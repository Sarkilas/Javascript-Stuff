//=============================================================================
// Sarkilas ABS HUD
// by Sarkilas
// Last update: 26th November 2015
//=============================================================================

/*:
 * @plugindesc Adds a HUD to the Sarkilas ABS.
 * @author Sarkilas
 *
 * @param Player Status X
 * @desc The X position for the player status frame. Can use scripts.
 * @default 16
 *
 * @param Player Status Y
 * @desc The Y position for the player status frame. Can use scripts.
 * @default Graphics.boxHeight - 88
 *
 * @param Combo Status X
 * @desc The X position of the combo frame (includes combo gauge). Can use scripts. 
 * @default 16
 *
 * @param Combo Status Y
 * @desc The Y position of the combo frame (includes combo gauge). Can use scripts.
 * @default 64
 *
 * @param Hide Switch
 * @desc The switch ID for hiding the HUD.
 * @default 3
 *
 * @help A basic HUD that shows how HUD extensions can be scripted for the Sarkilas ABS.
 *
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Check dependencies
if(Sarkilas.Imported.indexOf('ABS') < 0) {
	alert("SarkilasABSHUD is dependent on SarkilasABS!\n" +
		"This plugin must be below SarkilasABS to function.");
}

// Import the ABS
Sarkilas.Imported.push("HUD");

// Collect all plugin parameters
var parameters = PluginManager.parameters('SarkilasABSHUD');
Sarkilas.Param = Sarkilas.Param || {};
Sarkilas.Param.hudStatusX = parameters['Player Status X'] || 16;
Sarkilas.Param.hudStatusY = parameters['Player Status Y'] || "Graphics.boxHeight - 88";
Sarkilas.Param.hudComboX = parameters['Combo Status X'] || 16;
Sarkilas.Param.hudComboY = parameters['Combo Status Y'] || 16;
Sarkilas.Param.hudHideSwitch = parseInt(parameters['Hide Switch'] || 3);

//=============================================================================
// Sprite_HUD
//  * The hud sprite.
//=============================================================================

function Sprite_HUD() {
	this.initialize.apply(this, arguments);
}

Sprite_HUD.prototype = Object.create(Sprite.prototype);
Sprite_HUD.prototype.constructor = Sprite_HUD;

Sprite_HUD.prototype.initialize = function() {
	Sprite.prototype.initialize.call(this);
	this._actor = $gameParty.leader();
	this.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
	this.setup();
	this.z = 9999;
	this._fadePhase = 0;
	this._lastSpecial = 0;
};

Sprite_HUD.prototype.setup = function() {
	this.createSprites();
	this.updateStatus();
	this.updateCombo();
};

Sprite_HUD.prototype.createSprites = function() {
	// Create player status sprite
	if(!this._statusSprite) {
		this._statusSprite = new Sprite();
		this.addChild(this._statusSprite);
	}

	// Create combo sprites
	if(!this._comboGauge) {
		this._comboGauge = new Sprite();
		this._comboGauge.bitmap = ImageManager.loadSystem('Charger');
		this.addChild(this._comboGauge);
		this._comboArrow = new Sprite();
		this._comboArrow.bitmap = ImageManager.loadSystem('Arrow');
		this._comboArrow.anchor.y = 0.5;
		this._comboArrow.y = eval(Sarkilas.Param.hudComboY) + this._comboGauge.bitmap.height + 64;
		this.addChild(this._comboArrow);
		this._comboText = [];
		for(var i = 1; i <= 8; i++) {
			var sprite = new Sprite();
			sprite.bitmap = ImageManager.loadSystem('Combo Text ' + i);
			sprite.visible = false;
			sprite.alpha = 0.4;
			this._comboText.push(sprite);
			this.addChild(sprite);
		}
		this._specialSprite = new Sprite();
		this._specialSprite.bitmap = ImageManager.loadSystem('Special');
		this._specialSprite.visible = false;
		this.addChild(this._specialSprite);
		this._comboHud = new Sprite();
		this._comboHud.bitmap = ImageManager.loadSystem('Combo_Hud');
		this.addChild(this._comboHud);
		this._comboNumber = new Sprite_Combo();
		this.addChild(this._comboNumber);
		this._comboDamage = new Sprite();
		this.addChild(this._comboDamage);
	}
};

Sprite_HUD.prototype.updateStatus = function() {
	// Get X and Y
	var x = eval(Sarkilas.Param.hudStatusX);
	var y = eval(Sarkilas.Param.hudStatusY);

	// Load bitmaps
	var container = ImageManager.loadSystem('Container');
	var hpbar = ImageManager.loadSystem('Health Bar');
	var mpbar = ImageManager.loadSystem('Mind Bar');
	var tpbar = ImageManager.loadSystem('Energy Bar');

	// Create sprite bitmap
	this._statusSprite.bitmap = new Bitmap(container.width, container.height * 3 + 12);

	// Return if no valid actor
	if(!this._actor) return;

	// Draw bars
	this.drawContainer(container, hpbar, this._actor.hp, this._actor.mhp, 0);
	this.drawContainer(container, mpbar, this._actor.mp, this._actor.mmp, container.height + 2);
	this.drawContainer(container, tpbar, this._actor.tp, this._actor.maxTp(), container.height * 2 + 4);

	// Set coordinates
	this._statusSprite.x = x;
	this._statusSprite.y = y;
};

Sprite_HUD.prototype.drawContainer = function(container, bar, value, max, y) {
	this._statusSprite.bitmap.blt(container, 0, 0, 
		container.width, container.height, 0, y, container.width, container.height);
	var percent = value / max;
	this._statusSprite.bitmap.blt(bar, 0, 0, bar.width * percent, bar.height,
		0, y, bar.width * percent, bar.height);
};

Sprite_HUD.prototype.updateCombo = function() {
	// Get X and Y
	var x = eval(Sarkilas.Param.hudComboX);
	var y = eval(Sarkilas.Param.hudComboY);

	// Gauge percent
	var current = $gameTemp.combo() % Sarkilas.Param.specialBreakpoint;
	var percent = current / Sarkilas.Param.specialBreakpoint;

	// Set visibility state
	this._comboHud.visible = this._comboNumber.visible;

	// Position hud
	this._comboHud.x = x;
	this._comboHud.y = y;
	this._comboNumber.x = x + 64;
	this._comboNumber.y = y + 32;
	this._comboDamage.x = x + 108;
	this._comboDamage.y = y - 2;

	// Set visibility of damage
	this._comboDamage.visible = $gameTemp.comboDamage() > 0;
	if($gameTemp.comboDamage() > 0) {
		var bitmap = new Bitmap(100, 32);
		bitmap.fontSize = 18;
		bitmap.drawText($gameTemp.comboDamage(), 1, 1, bitmap.width, bitmap.height);
		this._comboDamage.bitmap = bitmap;
	}

	// Make combo gauge hidden if not applicable
	if(!Sarkilas.Param.weaponSpecial) {
		this._comboGauge.visible = false;
		this._comboArrow.visible = false;
		return;
	}

	// Position gauge
	this._comboGauge.x = x;
	this._comboGauge.y = y + 64;

	// Position and move arrow
	var gaugeY = this._comboGauge.y + 
		this._comboGauge.bitmap.height - (this._comboGauge.bitmap.height * percent);
	this._comboArrow.x = x + 25;
	if(this._comboArrow.y !== gaugeY) {
		if(this._comboArrow.y < gaugeY) {
			this._comboArrow.y += 4;
			if(this._comboArrow.y >= gaugeY)
				this._comboArrow.y = gaugeY;
		} else if(this._comboArrow.y > gaugeY) {
			this._comboArrow.y -= 4;
			if(this._comboArrow <= gaugeY)
				this._comboArrow.y = gaugeY;
		}
	}

};

Sprite_HUD.prototype.updateEffects = function() {
	// Get X and Y
	var x = eval(Sarkilas.Param.hudComboX);
	var y = eval(Sarkilas.Param.hudComboY);
	var index = Math.floor($gameTemp.combo() / 10) - 1;

	// Update combo texts
	for(var i = 0; i < this._comboText.length; i++) {
		this._comboText[i].visible = false;
		this._comboText[i].x = x + 96;
		this._comboText[i].y = y + 50;
	}
	if(index >= 0) {
		this._comboText[index].visible = true;
		if(this._fadePhase == 0) {
			this._comboText[index].alpha += 0.075;
			if(this._comboText[index].alpha >= 1)
				this._fadePhase = 1; 
		} else if(this._fadePhase == 1) {
			this._comboText[index].alpha -= 0.075;
			if(this._comboText[index].alpha <= 0.4)
				this._fadePhase = 0;
		}
	}

	// Update special attack proc
	if(this._specialSprite.alpha > 0) {
		if(this._specialSprite.x > x + 96) {
			this._specialSprite.x -= 4;
		} else {
			this._specialSprite.x -= 1;
		}
		this._specialSprite.alpha -= 0.01;
	} else {
		this._specialSprite.visible = false;
	}
};

Sprite_HUD.prototype.startSpecial = function() {
	// Get X and Y
	var x = eval(Sarkilas.Param.hudComboX);
	var y = eval(Sarkilas.Param.hudComboY);

	// Set coordinates and alpha
	this._specialSprite.x = x + 148;
	this._specialSprite.y = y + 80;
	this._specialSprite.alpha = 1.0;
	this._specialSprite.visible = true;
};

Sprite_HUD.prototype.update = function() {
	Sprite.prototype.update.call(this);
	// Set visibility state
	this.visible = !$gameSwitches[Sarkilas.Param.hudHideSwitch] && !$gameMessage.isBusy();

	// If not equal actors: setup
	if(this._actor != $gameParty.leader()) {
		this._actor = $gameParty.leader();
		this.setup();
	}

	// If breakpoint has been passed
	if($gameTemp.combo() > 0) {
		var breakpoint = Math.floor($gameTemp.combo() / Sarkilas.Param.specialBreakpoint);
		if(this._lastSpecial < breakpoint) {
			this.startSpecial();
			this._lastSpecial = breakpoint;
		}
	} else {
		this._lastSpecial = 0;
	}

	// Update different components
	this.updateStatus();
	this.updateCombo();
	this.updateEffects();
};

//=============================================================================
// Sprite_Combo
//  * The combo number sprite.
//=============================================================================

function Sprite_Combo() {
	this.initialize.apply(this, arguments);
}

Sprite_Combo.prototype = Object.create(Sprite.prototype);
Sprite_Combo.prototype.constructor = Sprite_Combo;

Sprite_Combo.prototype.initialize = function() {
	Sprite.prototype.initialize.call(this);
	this._combo = $gameTemp.combo();
	this._effectPhase = 0;
	this.anchor.set(0.5, 0.5);
	this.z = 9999;
	this.visible = false;
};

Sprite_Combo.prototype.setup = function() {
	var bitmap = ImageManager.loadSystem('Combo_Number');
	var bwidth = bitmap.width / 10;
	var digits = this._combo.toString().length;
	this.bitmap = new Bitmap(bwidth * digits, bitmap.height);
	for(var i = 0; i < digits; i++) {
		var n = parseInt(this._combo.toString()[i]);
		this.bitmap.blt(bitmap, bwidth * n, 0, bwidth, bitmap.height, (bwidth - 8) * i, 0);
	}
};

Sprite_Combo.prototype.update = function() {
	Sprite.prototype.update.call(this);
	this.visible = this._combo > 0;
	if(this.bitmap)
		this.x -= this.bitmap.width / 2;
	if(this._combo !== $gameTemp.combo()) {
		this._combo = $gameTemp.combo();
		if(this._combo > 0) {
			this.setup();
			this.startEffect();
		}
	}
	this.updateEffect();
};

Sprite_Combo.prototype.startEffect = function() {
	this._effectPhase = 1;
	this._scale = 1.0;
};

Sprite_Combo.prototype.updateEffect = function() {
	if(!this._effectPhase) return;
	if(this._effectPhase == 1) {
		this._scale += 0.1;
		this.scale.set(this._scale, this._scale);
		if(this._scale >= 2) {
			this._effectPhase = 2;
		}
	} else if(this._effectPhase == 2) {
		this._scale -= 0.05;
		this.scale.set(this._scale, this._scale);
		if(this._scale <= 1) {
			this._effectPhase = 0;
		}
	}
};

//=============================================================================
// Scene_Map
//  * Additional code for adding hud to the map.
//=============================================================================

// Endure our map is created
Sarkilas.Scene_Map = Sarkilas.Scene_Map || {};

Sarkilas.Scene_Map.createDisplayObjectsHUD = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
	Sarkilas.Scene_Map.createDisplayObjectsHUD.call(this);
	this._hud = new Sprite_HUD();
	this.addChild(this._hud);
};