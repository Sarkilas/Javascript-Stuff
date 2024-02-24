//=============================================================================
// Sarkilas ABS Tools
// by Sarkilas
// Last update: 23nd November 2015
//=============================================================================

/*:
 * @plugindesc Adds a tool system to the Sarkilas ABS.
 * @author Sarkilas
 *
 * @param Hook SE
 * @desc The name of the sound to play when successfully hooked onto a target.
 * @default Sword1
 *
 * @help Allows creating tool skills and weapons that can be bound to actors.
 * 
 * Add the tag <Tool> to a weapon or skill to make it into a tool.
 * You can then add specific tool tags or just have the tool act as a regular skill.
 * New skill tags for tools (only available when <Tool> is active) is:
 *   - <Hook> - let's this skill hook onto hookable events
 *   - <Boomerang = X> - this skill will move forward X tiles and then return
 *	   if not piercing, will return when hits a valid target
 *   - <Pull> - let's this skill pull pullable events
 *
 * For events, there are some new tags that interacts with tools:
 *   - <Hookable> - let's any hook tools hook onto this event
 *   - <Pullable> - let's any pull tools pull this event to them
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Check dependencies
if(Sarkilas.Imported.indexOf('ABS') < 0) {
	alert("SarkilasABSTools is dependent on SarkilasABS!\n" +
		"This plugin must be below SarkilasABS to function.");
}

// Import the ABS
Sarkilas.Imported.push("Tools");

// Load parameters
var parameters = PluginManager.parameters('SarkilasABSTools');
Sarkilas.Param = Sarkilas.Param || {};
Sarkilas.Param.hookSE = { 
	name: parameters['Hook SE'] || "Sword1", 
	volume: 100, 
	pitch: 100, 
	pan: 100
};

//=============================================================================
// Game_Bullet
//  * Bullet additions for tools.
//=============================================================================

// Create bullet map
Sarkilas.Game_Bullet = Sarkilas.Game_Bullet || {};

// Sets up tool parameters
Sarkilas.Game_Bullet.setup = Game_Bullet.prototype.setup;
Game_Bullet.prototype.setup = function() {
	// Core system setup
	Sarkilas.Game_Bullet.setup.call(this);

	// Get the skill from the action
	var skill = this._action.item();

	// Get user
	var user = this._action.character;

	// Set tool state
	this.params.tool = Utils.hasTag(skill, "Tool");

	// If tool: set other parameters
	if(this.params.tool) {
		this.params.hook = Utils.hasTag(skill, "Hook");
		this.params.boomerang = Utils.dataValue(skill, "Boomerang");
		this.params.pull = Utils.hasTag(skill, "Pull");
		this._startPoint = new Point(Math.round(user.x), Math.round(user.y));
		this._returning = false;
		this._pullTargets = [];
		if(this.params.hook) {
			$gameTemp.startHook(this._action.character, this);
		}
	}
};

// Update bullet
Sarkilas.Game_Bullet.update = Game_Bullet.prototype.update;
Game_Bullet.prototype.update = function() {
	Sarkilas.Game_Bullet.update.call(this);
	if(!this._erased && this.params.tool) {
		for(var i = 0; i < this._pullTargets.length; i++) {
			if(!this._pullTargets[i]) continue;
			this._pullTargets[i].copyPosition(this);
		}
		if(this.params.boomerang) {
			var n = Math.floor(this.params.boomerang);
			if(Utils.difference(this.x, this._startPoint.x) >= n ||
				Utils.difference(this.y, this._startPoint.y) >= n) {
				if(!this._returning) {
					this.turn180();
					this._returning = true;
				} 
			} else if(this._returning) {
				if(this.x == this._startPoint.x &&
					this.y == this._startPoint.y) {
					this.erase();
				}
			}
		} else if(this.params.hook && this._lockPoint) {
			this.params.duration = 10;
			this.setPosition(this._lockPoint.x, this._lockPoint.y);
			if(this._action.character.sequence() != "hook") {
				$gameTemp.endHook();
				this.erase();
			}
		}
	}
};

// Tool erase: some tools don't erase on hit
Game_Bullet.prototype.erase = function() {
	if(this.params.tool && this.params.duration > 0) {
		if(this.params.boomerang) {
			if(!this._returning) {
				this.turn180();
				this._returning = true;
			} else {
				if(this.x == this._startPoint.x &&
					this.y == this._startPoint.y) {
					Game_Event.prototype.erase.call(this);
					this._action.character.cancelWait();
				}
			}
		} else {
			Game_Event.prototype.erase.call(this);
		}
	} else {
		Game_Event.prototype.erase.call(this);
	}
}

// Hit effect
Sarkilas.Game_Bullet.hitEffect = Game_Bullet.prototype.hitEffect;
Game_Bullet.prototype.hitEffect = function(target) {
	// If tool: tool effect
	if(this.params.tool)
		this.toolEffect(target);

	// Actual hit effect
	Sarkilas.Game_Bullet.hitEffect.call(this, target);
};

// Hit effect event
Sarkilas.Game_Bullet.hitEffectEvent = Game_Bullet.prototype.hitEffectEvent;
Game_Bullet.prototype.hitEffectEvent = function(target) {
	// If tool: tool effect
	if(this.params.tool) {
		var hit = this.toolEffect(target);
		if(!this.params.piercing && hit)
			this.erase();
	}

	// Actual hit effect
	Sarkilas.Game_Bullet.hitEffectEvent.call(this, target);
};

// Tool effect
Game_Bullet.prototype.toolEffect = function(target) {
	// Set up bool
	var bool = false;

	// If pull
	if(this.params.pull) {
		if(Utils.hasTag(target.event(), "Pullable")) {
			if(this._pullTargets.indexOf(target) < 0) {
				this._pullTargets.push(target);
				bool = true;
			}
		}
	} else if(this.params.hook) { // If hook
		if(Utils.hasTag(target.event(), "Hookable")) {
			AudioManager.playSe(Sarkilas.Param.hookSE);
			this._action.character.startHook(target.x, target.y);
			this.setActive(false);
			this._lockPoint = new Point(this.x, this.y);
		}
	}

	// Return bool
	return bool;
};

//=============================================================================
// Game_Character
//  * Character additions for tools.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Character = Sarkilas.Game_Character || {};

// Starts a hook sequence towards the target location
Game_Character.prototype.startHook = function(x, y) {
	this._x = $gameMap.roundXWithDirection(x, this.reverseDir(this._direction));
	this._y = $gameMap.roundYWithDirection(y, this.reverseDir(this._direction));
	this._hookDestination = new Point(this._x, this._y);
	this._customSequence = "hook";
	this.setActionMoveSpeed(2);
};

// Through state
Game_Character.prototype.isThrough = function() {
    return (this._through || this._customSequence);
};

// Update other
Sarkilas.Game_Character.updateOtherTools = Game_Character.prototype.updateOther;
Game_Character.prototype.updateOther = function() {
	Sarkilas.Game_Character.updateOtherTools.call(this);
	if(this._hookDestination) {
		this._userWait = 10;
		if(this instanceof Game_Player) {
			$gamePlayer.gatherFollowers();
		}
		if(this._realX == this._hookDestination.x &&
			this._realY == this._hookDestination.y) {
			this._customSequence = null;
			this._hookDestination = null;
			this._userWait = 0;
			this._pose = "";
			this.setActionMoveSpeed(0);
			$gameTemp.endHook();
		}
	};
};

//=============================================================================
// Game_Player
//  * Player additions for tools.
//=============================================================================

// Use tool
Game_Player.prototype.useTool = function() {
	// Get tool ID
	var toolId = $gameSystem.getTool($gameParty.leader().actor().id);

	// Get tool weapon
	var tool = $dataWeapons[toolId];

	// If no valid tool: return
	if(!tool) return;

	// Get skill
	var skillId = Utils.dataValue(tool, "Skill");
	if(skillId) {
		// Shoot
		var skill = $dataSkills[Math.floor(skillId)];
		this.shoot(skill.id);

		// Check if skill uses weapon pose
		if(Utils.hasTag(skill, "Weapon pose")) {
			var pose = Utils.dataValue(tool, "Pose");
			if(pose)
				this._pose = pose;
			if(this.pose !== "") {
				this.setPattern(0);
				this._animationCount = 0;
			}
		}
	} else {
		throw new Error("The tool " + tool.name + " must have a skill reference!");
	}
};

//=============================================================================
// Game_Temp
//  * Temporary hook data storage.
//=============================================================================

Game_Temp.prototype.startHook = function(user, bullet) {
	this._hookBullet = bullet;
	this._hookUser = user;
};

Game_Temp.prototype.endHook = function() {
	this._hookBullet = null;
	this._hookUser = null;
};

Game_Temp.prototype.isHooking = function() {
	return (this._hookBullet && this._hookUser);
};

Game_Temp.prototype.hookBullet = function() {
	return this._hookBullet;
};

Game_Temp.prototype.hookUser = function() {
	return this._hookUser;
};

//=============================================================================
// Spriteset_Map
//  * Additional code for handling bullet event sprites.
//=============================================================================

// Ensure our map is created
Sarkilas.Spriteset_Map = Sarkilas.Spriteset_Map || {};

Sarkilas.Spriteset_Map.recheckExtensions = Spriteset_Map.prototype.recheckExtensions;
Spriteset_Map.prototype.recheckExtensions = function() {
	// If hooking
	if(!this._hookSprite) {
		this._hookSprite = new Sprite_Hook();
		this.addChild(this._hookSprite);
	}
};

//=============================================================================
// Sprite_Hook
//  * The sprite for hooks.
//=============================================================================

function Sprite_Hook() {
	this.initialize.apply(this, arguments);
}

Sprite_Hook.prototype = Object.create(Sprite.prototype);
Sprite_Hook.prototype.constructor = Sprite_Hook;

Sprite_Hook.prototype.initialize = function() {
	Sprite.prototype.initialize.call(this);
	this.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
	this.createChains();
	this.z = 3500;
};

Sprite_Hook.prototype.update = function() {
	this.visible = $gameTemp.isHooking();
	this.updateChains();
	Sprite.prototype.update.call(this);
};

Sprite_Hook.prototype.createChains = function() {
	this._chains = [];
	for(var i = 0; i < 5; i++) {
		var sprite = new Sprite();
		sprite.bitmap = ImageManager.loadSystem("Hook");
		this._chains.push(sprite);
		this.addChild(sprite);
	}
};

Sprite_Hook.prototype.updateChains = function() {
	// Get characters and return if invalid
	var bullet = $gameTemp.hookBullet();
	var user = $gameTemp.hookUser();
	if(!user || !bullet) return;
	if(bullet.finished()){
		$gameTemp.endHook();
		return;
	}

	// Get values
	var x1 = bullet.screenX();
	var y1 = bullet.screenY();
	var x2 = user.screenX();
	var y2 = user.screenY();
	var moveX = x1 - x2;
	var moveY = y1 - y2;
	var unitX = moveX / this._chains.length;
	var unitY = moveY / this._chains.length;

	// Update chain positions
	for(var i = 0; i < this._chains.length; i++) {
		this._chains[i].x = x2 + unitX * i - 
			(user.direction() == 4 ? 32 : user.direction() !== 6 ? 16 : 0);
		this._chains[i].y = y2 + unitY * i - this._chains[i].bitmap.height;
	}
};

//=============================================================================
// Game_System
//  * System storage for tool bindings.
//=============================================================================

// Create system map
Sarkilas.Game_System = Sarkilas.Game_System || {};

// Initialize override
Sarkilas.Game_System.initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
	Sarkilas.Game_System.initialize.call(this);
	this._tools = {};
};

// Bind tool to actor
Game_System.prototype.bindTool = function(actorId, toolId) {
	this._tools[actorId] = toolId;
};

// Unbind tool
Game_System.prototype.unbindTool = function(actorId) {
	delete this._tools[actorId];
};

// Get tool by actor
Game_System.prototype.getTool = function(actorId) {
	return this._tools[actorId] ? this._tools[actorId] : 0;
};

// Get all bound tools
Game_System.prototype.tools = function() {
	return this._tools;
};

//=============================================================================
// Game_Party
//  * Party changes for weapon collection.
//=============================================================================

Game_Party.prototype.weapons = function() {
    var list = [];
    for (var id in this._weapons) {
    	var weapon = $dataWeapons[id];
    	if(!Utils.hasTag(weapon, "Tool"))
        	list.push(weapon);
    }
    return list;
};

Game_Party.prototype.tools = function() {
    var list = [];
    for (var id in this._weapons) {
    	var weapon = $dataWeapons[id];
    	if(Utils.hasTag(weapon, "Tool"))
        	list.push(weapon);
    }
    return list;
};