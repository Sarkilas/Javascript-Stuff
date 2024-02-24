//=============================================================================
// Sarkilas ABS Action Bar
// by Sarkilas
// Last update: 22nd November 2015
//=============================================================================

/*:
 * @plugindesc Adds an action bar system to the Sarkilas ABS.
 * @author Sarkilas
 *
 * @param Action Slots
 * @desc The amount of action bar slots. This will expand in the chosen direction.
 * @default 6
 *
 * @param Horizontal Bars
 * @desc Sets the action bar to be horizontal. If false, will draw vertically. (true / false)
 * @default true
 *
 * @param X
 * @desc The middle X position of the action bar. Can use scripts as its value.
 * @default Graphics.boxWidth / 2
 *
 * @param Y
 * @desc The middle Y position of the action bar. Can use scripts as its value.
 * @default Graphics.boxHeight - 32
 *
 * @param Hide Switch
 * @desc The switch ID for hiding the action bar.
 * @default 3
 *
 * @help If you wish to use a lot of action slots(like a LOT), you may want to write a less restrictive
 * action bar plugin. This plugin is an extension to the ABS that allows anyone to use an action
 * bar without further knowledge, and special cases would need a different script.
 * 
 * The more action slots, the more it will stack in the chosen direction, eventually going out of screen
 * bounds. If you want more action bar slots, make alterations to this extension or write your own.
 *
 * Please note that the default system only has up to 10 valid bindings. Any further action slots
 * would not have any valid keybindings.
 *
 * You can set bindings in the script itself. Otherwise default bindings will be Q, E and 1-9.
 *
 * Thanks for using!
 *
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Check dependencies
if(Sarkilas.Imported.indexOf('ABS') < 0) {
	alert("SarkilasABSActionBar is dependent on SarkilasABS!\n" +
		"This plugin must be below SarkilasABS to function.");
}

// Import the ABS
Sarkilas.Imported.push("ActionBar");

// Collect all plugin parameters
var parameters = PluginManager.parameters('SarkilasABSActionBar');
Sarkilas.Param = Sarkilas.Param || {};
Sarkilas.Param.actionSlots = parseInt(parameters['Action Slots'] || 6);
Sarkilas.Param.horizontalBars = ((parameters['Horizontal Bars'] || 'true') === 'true');
Sarkilas.Param.actionX = parameters['X'];
Sarkilas.Param.actionY = parameters['Y'];
Sarkilas.Param.actionHideSwitch = parseInt(parameters['Hide Switch'] || 3);

// Binding list
Sarkilas.Param.actionBinds = ['pageup','e','1','2','3','4','5','6','7','8']; // bindings
Sarkilas.Param.actionKeys = ['Q','E','1','2','3','4','5','6','7','8']; // visual key names

//=============================================================================
// Sprite_ActionBar
//  * The action bar sprite.
//=============================================================================

function Sprite_ActionBar() {
	this.initialize.apply(this, arguments);
}

Sprite_ActionBar.prototype = Object.create(Sprite.prototype);
Sprite_ActionBar.prototype.constructor = Sprite_ActionBar;

Sprite_ActionBar.prototype.initialize = function() {
	Sprite.prototype.initialize.call(this);
	this._actor = $gameParty.leader();
	this._slots = [];
	this._icons = [];
	this._texts = [];
	this.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
	this.setup();
	this.z = 9999;
};

Sprite_ActionBar.prototype.setup = function() {
	// Get bar width and height
	var width = Sarkilas.Param.horizontalBars ? 34 * Sarkilas.Param.actionSlots : 34;
	var height = Sarkilas.Param.horizontalBars ? 34 : 34 * Sarkilas.Param.actionSlots;

	// Get X and Y
	var x = eval(Sarkilas.Param.actionX) - width / 2;
	var y = eval(Sarkilas.Param.actionY) - height / 2;

	// If slots haven't been created
	if(this._slots.length == 0) {
		for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
			var sprite = new Sprite();
			sprite.bitmap = ImageManager.loadSystem("Slot");
			sprite.x = Sarkilas.Param.horizontalBars ? x + 34 * i : x;
			sprite.y = Sarkilas.Param.horizontalBars ? y : y + 34 * i;
			this._slots[i] = sprite;
			this.addChild(sprite);
		}
	}

	// Create icons
	if(this._actor) {
		for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
			// Create sprite if not already created
			if(!this._icons[i])
				this._icons[i] = new Sprite();

			// Get skill ID
			var skillId = this._actor.actionSkill(i);

			// If temp change: change sprite
			if($gameTemp.tempSkill(skillId) !== skillId) {
				skillId = $gameTemp.tempSkill(skillId);
				this._slots[i].bitmap = ImageManager.loadSystem("Proc Highlight");
			}

			// Get the skill
			var skill = $dataSkills[skillId];

			// If not skill: continue
			if(!skill) continue;

			// Create bitmap
			var map = new Bitmap(32,32);

			// Draw the icon onto the bitmap
			this.drawIcon(map, skill.iconIndex, 0, 0);

			// Set bitmap
			this._icons[i].bitmap = map;

			// Set the X and Y-coordinate
			this._icons[i].x = Sarkilas.Param.horizontalBars ? x + 34 * i : x;
			this._icons[i].y = Sarkilas.Param.horizontalBars ? y : y + 34 * i;
			this._icons[i].z = this._slots[i].z + 250;

			// Add child
			this.addChild(this._icons[i]);
		}
	}

	// Create texts
	for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
		// Create sprite if not already created
		if(!this._texts[i])
			this._texts[i] = new Sprite();

		// Create text bitmap
		this._texts[i].bitmap = this.createTextBitmap(i);

		// Set the X and Y-coordinate
		this._texts[i].x = Sarkilas.Param.horizontalBars ? x + 34 * i : x;
		this._texts[i].y = (Sarkilas.Param.horizontalBars ? y : y + 34 * i) - 4;
		this._texts[i].z = this._slots[i].z + 500;

		// Add child
		this.addChild(this._texts[i]);
	}

	// Return if no valid actor
	if(!this._actor) {
		this.hideSkills();
		return;
	}
};

Sprite_ActionBar.prototype.drawIcon = function(source, iconIndex, x, y) {
    var bitmap = ImageManager.loadSystem('IconSet');
    var pw = Window_Base._iconWidth;
    var ph = Window_Base._iconHeight;
    var sx = iconIndex % 16 * pw;
    var sy = Math.floor(iconIndex / 16) * ph;
    source.blt(bitmap, sx, sy, pw, ph, x, y);
};

Sprite_ActionBar.prototype.createTextBitmap = function(index) {
	// Create the bitmap
	var bitmap = new Bitmap(32,32);
	bitmap.fontSize = 14;

	// Draw the key name
	if(Sarkilas.Param.actionKeys[index])
		bitmap.drawText(Sarkilas.Param.actionKeys[index], 1, 1, 32, 24);

	// Return if no actor
	if(!this._actor) return bitmap;

	// Get the skill
	var skill = $dataSkills[this._actor.actionSkill(index)];

	// If not skill: continue
	if(!skill) return bitmap;

	// Draw cooldown text
	var cooldown = this._actor.cooldown(skill);
	if(cooldown > 0) {
		bitmap.textColor = Utils.rgbToCssColor(200,100,255);
		bitmap.drawText(cooldown, 1, 12, 32, 24, 'center');
	}

	// Return bitmap
	return bitmap;
};

Sprite_ActionBar.prototype.update = function() {
	// Set visibility state
	this.visible = !$gameSwitches[Sarkilas.Param.actionHideSwitch] && !$gameMessage.isBusy();

	// If not equal actors: setup
	if(this._actor != $gameParty.leader() ||
		this._actor.skillsChanged()) {
		this._actor = $gameParty.leader();
		this.setup();
	}

	// Update actions
	this.updateActions();
};

Sprite_ActionBar.prototype.updateActions = function() {
	// If no actor: hide icons and text
	for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
		if(this._icons[i])
			this._icons[i].visible = !!this._actor;
		if(this._icons[i])
			this._icons[i].visible = !!this._actor;
	}
	if(this._actor) {
		for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
			// Get the skill
			var skill = $dataSkills[this._actor.actionSkill(i)];

			// If no skill: continue
			if(!skill) continue;

			// Refresh bitmap
			this._texts[i].bitmap = this.createTextBitmap(i);

			// Set opacity
			this._icons[i].opacity = (this._actor.skillReady(skill) && 
				this._actor.canPaySkillCost(skill)) ? 255 : 128;
		}
	}
};

//=============================================================================
// Game_Player
//  * Additional code for the player.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Player = Sarkilas.Game_Player || {};

Sarkilas.Game_Player.updateActions = Game_Player.prototype.updateActions;
Game_Player.prototype.updateActions = function() {
	// Return if unable to update actions
	if(Sarkilas.Game_Player.updateActions.call(this)) return;

	// Check each key trigger
	for(var i = 0; i < Sarkilas.Param.actionSlots; i++) {
		var key = Sarkilas.Param.actionBinds[i];
		if(!key) continue;
		var skill = $dataSkills[this.battler.actionSkill(i)];
		if(!skill) return;
		if(this.battler.canPaySkillCost(skill) && !this.battler.onCooldown(skill)) {
			if(Input.isTriggered(key))
				this.shoot(skill.id);
		}
	}
}

//=============================================================================
// Scene_Map
//  * Additional code for adding action bar to the map.
//=============================================================================

// Endure our map is created
Sarkilas.Scene_Map = Sarkilas.Scene_Map || {};

Sarkilas.Scene_Map.createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
	Sarkilas.Scene_Map.createDisplayObjects.call(this);
	this._actionbar = new Sprite_ActionBar();
	this.addChild(this._actionbar);
};