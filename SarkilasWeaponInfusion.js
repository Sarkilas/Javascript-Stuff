//=============================================================================
// Sarkilas Weapon Infusion System
// by Sarkilas
// Last update: 10th January 2016
//=============================================================================

/*:
 * @plugindesc Adds a weapon infusion system.
 * @author Sarkilas
 *
 * @help Allows infusing weapons, upgrading and transforming them.
 */

 // Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Check dependencies
if(Sarkilas.Imported.indexOf('Utils') < 0) {
	alert("SarkilasWeaponInfusion is dependent on SarkilasUtils!\n" +
		"The plugin must be above SarkilasWeaponInfusion in the plugin manager.");
}

// Import the system
Sarkilas.Imported.push("Weapon Infusion");

//=============================================================================
// * Game_Party Additions
//=============================================================================

Game_Party.prototype.materials = function() {
	return this.items().filter(function(item) {
		return Utils.hasTag(item, "Material");
	});
};

//=============================================================================
// * Equipment Modifications
//=============================================================================

// Ensure our map is created
Sarkilas.Equipment = Sarkilas.Equipment || {};

Object.defineProperties(Equipment.prototype, {
	iwp: { get: function() { return this.weaponPower(); }, configurable: true },
	level: { get: function() { return this._level; }, configurable: true },
	exp: { get: function() { return this._exp ? this._exp : 0; }, configurable: true },
	specials: { get: function() { return this._specials; }, configurable: true},
	special: { get: function() { return this._special; }, configurable: true }
});

// Initialize alias
Sarkilas.Equipment.initialize = Equipment.prototype.initialize;
Equipment.prototype.initialize = function(item, rarity) {
	Sarkilas.Equipment.initialize.call(this, item, rarity);
	if(item) {
		var startLevel = Utils.dataValue(item, "Start level");
		if(startLevel) {
			this._level = Math.floor(startLevel);
			this._exp = 0;
			this._special = Math.floor(Utils.dataValue(item, "Special"));
			this._specials = [this._special];
		}
	}
};

// Can gain exp?
Equipment.prototype.canGainExp = function(actor) {
	return !(actor.level <= this._level && this._exp >= this.nextExp());
};

// Gain exp
Equipment.prototype.gainExp = function(exp) {
	this._exp += exp;
};

// Check level up (returns true if leveled up)
Equipment.prototype.checkLevelUp = function(actor) {
	// Collect the current level
	var level = this._level;

	// While exp is enough for a new level
	while(this.nextExp() <= this._exp) {
		// Only level up the weapon if the actor is a higher level
		if(actor.level > this._level)
			this._level++;
		else
			break;
	}

	// Return the leveled up state 
	return level !== this._level;
};

// Next level EXP
Equipment.prototype.nextExp = function(mod) {
	// Return 0 if this weapon cannot be leveled
	if(!this._level) return 0;

	// Get modifier
	mod = mod || 0;
	var level = this._level + mod;

	// If level is 0 or lower: return 0
	if(level <= 0) return 0;

	// Return the next level formula
	return Math.floor((30 + (level * 110)) * Math.pow(2, level/5));
};

// Get exp array
// index 0 => current exp past current level
// index 1 => required exp difference from last level
Equipment.prototype.getExpArray = function() {
	// Return an empty arra if no level
	if(!this._level) return [];

	// Set up array
	var exp = [];

	// Add values
	exp.push(this._exp - this.nextExp(-1));
	exp.push(this.nextExp() - this.nextExp(-1));

	// Return the array
	return exp;
};

// Weapon power
Equipment.prototype.weaponPower = function() {
	return this._level ? this._level * 10 + (this._level * (this._level * 100)) / 100 : 0;
};

// Set affix value
Equipment.prototype.setAffix = function(key, value) {
	// search affixes and return a matching value if possible
	for(var i = 0; i < this._affixes.length; i++) {
		if(this._affixes[i].type == key) {
			this._affixes[i].value = value;
			return;
		}
	}

	// add affix
	this._affixes.push(new Affix(key, value));
};

// Maximum level
Equipment.prototype.maxLevel = function() {
	var maxLevel = Utils.dataValue(this, "Max level");
	return maxLevel ? Math.floor(maxLevel) : 0;
};

// Transform ID
Equipment.prototype.transformID = function() {
	var transformId = Utils.dataValue(this, "Transform");
	return transformId ? Math.floor(transformId) : 0;
};

//=============================================================================
// * Window_Infuse
//   Window for showing weapon infusion for a selected actor.
//=============================================================================

function Window_Infuse() {
	this.initialize.apply(this, arguments);
}

Window_Infuse.prototype = Object.create(Window_Selectable.prototype);
Window_Infuse.prototype.constructor = Window_Infuse;

Window_Infuse.prototype.initialize = function() {
	Window_Selectable.prototype.initialize.call(this, 240, 214, 400, 300);
	this._actor = null;
	this.refresh();
};

Window_Infuse.prototype.setActor = function(actor) {
	if(this._actor !== actor) {
		this._actor = actor;
		this.refresh();
	}
};

Window_Infuse.prototype.maxCols = function() {
    return 1;
};

Window_Infuse.prototype.maxItems = function() {
    return 2;
};

Window_Infuse.prototype.item = function() {
    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
};

Window_Infuse.prototype.isCurrentItemEnabled = function() {
    return true;
};

Window_Infuse.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    var maxCols = this.maxCols();
    rect.width = this.contentsWidth();
    rect.height = 32;
    rect.x = 0;
    rect.y = this.contentsHeight() - 64 + 32 * index;
    return rect;
};

Window_Infuse.prototype.refresh = function() {
	// Create contents
	this.createContents();

	// Ignore drawing if no valid actor
	if(!this._actor) return;

	// Get the actor's weapon
	var weapon = this._actor.weapons()[0];

	// If no weapon: cancel drawing
	if(!weapon) return;

	// Get custom icon
	var icon = Utils.dataValue(weapon, "Icon"); 

	// Draw weapon icon
	if(icon) {
		this.drawSingleIcon(icon, 20, 20);
	} else {
		this.drawIcon(weapon.iconIndex, 4, 4);
	}

	// Draw the weapon name
	this.changeTextColor(weapon.color());
	this.drawText(weapon.name, 36, 4, this.contentsWidth());

	// Get experience array
	var exp = weapon.getExpArray();

	// Draw level
	this.changeTextColor(this.systemColor());
	this.drawText("Level", 4, 48, 96);
	this.changeTextColor(this.normalColor());
	this.drawText(weapon.level, 0, 48, this.contentsWidth()-1, 'right');

	// Draw experience
	this.changeTextColor(this.systemColor());
	this.drawText("EXP", 4, 72, 96);
	this.changeTextColor(this.normalColor());
	this.drawText(weapon.exp + " / " + weapon.nextExp(), 0, 72, this.contentsWidth()-1, 'right');

	// Calculate gauge rate
	var rate = exp[0] / exp[1];

	// If ready to level, draw message
	if(exp[0] >= exp[1]) {
		this.changeTextColor(this.crisisColor());
		this.drawText("Weapon cannot level past the wielder's level!", 4, 128, this.contentsWidth());
	}

	// Draw exp gauge
	this.drawGauge(4, 96, this.contentsWidth() - 8, rate, 
		Utils.rgbToCssColor(212,0,255), Utils.rgbToCssColor(228,92,255));

	// Draw special command
	var rect = this.itemRect(0);
	this.changeTextColor(this.systemColor());
	this.drawText("Special:", rect.x + 4, rect.y, rect.width);
	this.changeTextColor(this.normalColor());
	this.drawText($dataSkills[weapon.special].name, rect.x, rect.y, rect.width - 8, 'right');

	// Draw infuse command
	rect = this.itemRect(1);
	this.drawText("Infuse weapon", rect.x + 4, rect.y, rect.width);
};

//=============================================================================
// * Window_Materials
//=============================================================================

function Window_Materials() {
	this.initialize.apply(this, arguments);
}

Window_Materials.prototype = Object.create(Window_Selectable.prototype);
Window_Materials.prototype.constructor = Window_Materials;

Window_Materials.prototype.initialize = function(x, y, width) {
	Window_Selectable.prototype.initialize.call(this, x, y, width, 100);
	this.z = 9999;
	this.refresh();
};

Window_Materials.prototype.maxCols = function() {
    return 11;
};

Window_Materials.prototype.maxItems = function() {
    return this._data ? this._data.length : 1;
};

Window_Materials.prototype.item = function() {
    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
};

Window_Materials.prototype.isCurrentItemEnabled = function() {
    return true;
};

Window_Materials.prototype.makeItemList = function() {
    this._data = $gameParty.materials();
};

Window_Materials.prototype.drawItem = function(index) {
    var item = this._data[index];
    if (item) {
        var rect = this.itemRect(index);
        this.drawItemName(item, rect.x - 4, rect.y - 4, rect.width, true);
        this.drawText($gameParty.numItems(item), rect.x, rect.y + 8, rect.width, 'right');
    }
};

Window_Materials.prototype.refresh = function() {
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
};

Window_Materials.prototype.itemWidth = function() {
	return 32;
};

Window_Materials.prototype.itemHeight = function() {
	return 32;
};

//=============================================================================
// * Scene_Infuse
//=============================================================================

function Scene_Infuse() {
	this.initialize.apply(this, arguments);
}

Scene_Infuse.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Infuse.prototype.constructor = Scene_Infuse;

Scene_Infuse.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Infuse.prototype.create = function() {
	this.gainMaterials();
	this.createBackground();
	this.createWindowLayer();
	this.createWindows();
	this.createDialogs();
};

Scene_Infuse.prototype.gainMaterials = function() {
	for(var i = 0; i < 10; i++)
		$gameParty.leader().levelUp();
	for(var i = 1; i < $dataItems.length; i++) {
		var item = $dataItems[i];
		if(item) {
			if(Utils.hasTag(item, "Material"))
				$gameParty.gainItem(item, 10);
		}
	}
};

Scene_Infuse.prototype.createWindows = function() {
	this._actorWindow = new Window_ActorSelect(240, 106, 400);
	this._actorWindow.setHandler('ok',		this.onActorOk.bind(this));
    this._actorWindow.setHandler('cancel',	this.onActorCancel.bind(this));
	this._actorWindow.select(0);
	this._actorWindow.activate();
	this.addWindow(this._actorWindow);
	this._infuseWindow = new Window_Infuse();
	this._infuseWindow.setHandler('ok', 	this.onInfuseOk.bind(this));
	this._infuseWindow.setHandler('cancel', this.onInfuseCancel.bind(this));
	this.addWindow(this._infuseWindow);
	this._materialWindow = new Window_Materials(240, 514, 400);
	this._materialWindow.setHandler('ok',		this.onMaterialOk.bind(this));
	this._materialWindow.setHandler('cancel',	this.onMaterialCancel.bind(this));
	this.addWindow(this._materialWindow);
	this._weaponWindow = new Window_EquipTooltip(640, 106, 400, 508);
	this.addWindow(this._weaponWindow);
};

Scene_Infuse.prototype.createDialogs = function() {
	this._levelUpDialog = new Framework_Dialog(Graphics.boxWidth / 2, 
		Graphics.boxHeight / 2, 256, 96, "");
	this._levelUpDialog.addButton(64, "OK");
	this._levelUpDialog.toCenter();
	this.addChild(this._levelUpDialog);

	this._tooltip = new Framework_Tooltip();
	this.addChild(this._tooltip);
};

Scene_Infuse.prototype.update = function() {
	Scene_MenuBase.prototype.update.call(this);
	if(this._actorWindow.isOpenAndActive()) {
		this._infuseWindow.setActor(this._actorWindow.item());
		this._weaponWindow.setItem(this._actorWindow.item().weapons()[0]);
	}
	if(this._levelUpDialog.alpha > 0 && !this._materialWindow.isOpenAndActive()) {
		if(this._levelUpDialog.isClicked(0)) {
			SoundManager.playOk();
			this._levelUpDialog.requestFadeOut();
			if($gameParty.materials().length === 0) {
				this.onMaterialCancel();
			} else {
				this._materialWindow.activate();
			}
		}
	} else {
		if(Utils.isMouseInside(this._materialWindow) &&
			this._materialWindow.isOpenAndActive()) {
			var item = this._materialWindow.item();
			if(item) {
				var exp = Utils.dataValue(item, "Exp");
				this._tooltip.setData(item.name, "Grants " + Math.floor(exp) + " EXP");
				this._tooltip.x = TouchInput.x + 16;
				this._tooltip.y = TouchInput.y + 16;
				this._tooltip.snap();
				this._tooltip.alpha = 0.95;
			}
		} else {
			this._tooltip.alpha = 0;
		}
	}
};

Scene_Infuse.prototype.onActorOk = function() {
	SoundManager.playOk();
	this._actorWindow.deactivate();
	this._infuseWindow.select(0);
	this._infuseWindow.activate();
};

Scene_Infuse.prototype.onActorCancel = function() {
	SoundManager.playCancel();
	SceneManager.pop();
};

Scene_Infuse.prototype.onInfuseOk = function() {
	SoundManager.playOk();
	if(this._infuseWindow.index() === 0) {

	} else {
		this._infuseWindow.deactivate();
		this._materialWindow.select(0);
		this._materialWindow.activate();
	}
};

Scene_Infuse.prototype.onInfuseCancel = function() {
	SoundManager.playCancel();
	this._infuseWindow.select(-1);
	this._infuseWindow.deactivate();
	this._actorWindow.activate();
};

Scene_Infuse.prototype.onMaterialOk = function() {
	SoundManager.playOk();
	var actor = this._actorWindow.item();
	var item = this._materialWindow.item();
	var exp = Utils.dataValue(item, "Exp");
	var weapon = actor.weapons()[0];
	this._materialWindow.activate();
	if(exp && weapon.canGainExp(actor)) {
		$gameParty.loseItem(item, 1);
		weapon.gainExp(Math.floor(exp));
		var levelUp = weapon.checkLevelUp(actor);
		this._infuseWindow.refresh();
		this._materialWindow.refresh();
		if(levelUp) {
			SoundManager.playUseSkill();
			this._materialWindow.deactivate();
			this._levelUpDialog.setText(actor.name() + "'s " + weapon.name + 
				"\nhas reached level " + weapon.level + "!");
			this._levelUpDialog.requestFadeIn();
			this._weaponWindow.refresh();
		} else if($gameParty.materials().length === 0) {
			this.onMaterialCancel();
		}
		$gameSystem.saveGame();
	} else {
		SoundManager.playBuzzer();
	}
};

Scene_Infuse.prototype.onMaterialCancel = function() {
	SoundManager.playCancel();
	this._materialWindow.select(-1);
	this._materialWindow.deactivate();
	this._infuseWindow.activate();
};