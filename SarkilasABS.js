//=============================================================================
// Sarkilas ABS MV
// by Sarkilas
// Last update: 22nd Novemner 2015
//=============================================================================

/*:
 * @plugindesc Implements a complete complex ABS system to the engine.
 * @author Sarkilas
 *
 * @param Skill Map
 * @desc The ID of the map where skill events are located.
 * @default 1
 *
 * @param Actor Swapping
 * @desc If enabled, player can swap active actors with a key (true / false)
 * @default true
 *
 * @param Combo Cancel When Damaged
 * @desc If enabled, combo counter is cancelled when you take damage (true / false)
 * @default true
 *
 * @param Weapon Special
 * @desc If enabled, weapon specials are automatically activated on combo breakpoints (true / false)
 * @default true
 *
 * @param Special Breakpoint
 * @desc The breakpoint when weapon specials are activated during combos (if enabled)
 * @default 10
 *
 * @param Combo Time
 * @desc The time (in frames) before the combo is lost.
 * @default 100
 *
 * @param Default Sensor
 * @desc The default enemy sensor range (measured in tile radius)
 * @default 10
 *
 * @param Combat Switch
 * @desc The switch ID that can be used to force combat status, preventing out of combat actions.
 * @default 1
 *
 * @param Level Up Sound
 * @desc The name of the SE to play when the active actor levels up.
 * @default Recovery
 *
 * @param Mouse Aiming
 * @desc If true, the player will turn towards the mouse location on screen when attacking.
 * @default true
 *
 * @param Disable Switch
 * @desc The ID of the switch that will disable the player's ability to attack.
 * @default 2
 *
 * @param Hit Variable
 * @desc The ID of the variable that detects hits on non-battler events.
 * @default 1
 *
 * @help Please see the manual and demo for help with how to use the system.
 *
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Check dependencies
if(Sarkilas.Imported.indexOf('Utils') < 0) {
	alert("SarkilasABS is dependent on SarkilasUtils!\n" +
		"The plugin must be above SarkilasABS in the plugin manager.");
}

// Import the ABS
Sarkilas.Imported.push("ABS");

// Collect all plugin parameters
var parameters = PluginManager.parameters('SarkilasABS');
Sarkilas.Param = Sarkilas.Param || {};
Sarkilas.Param.skillMap = parseInt(parameters['Skill Map'] || 1);
Sarkilas.Param.actorSwapping = ((parameters['Actor Swapping'] || 'true') === 'true');
Sarkilas.Param.comboCancel = ((parameters['Combo Cancel When Damaged'] || 'true') === 'true');
Sarkilas.Param.weaponSpecial = ((parameters['Weapon Special'] || 'true') === 'true');
Sarkilas.Param.specialBreakpoint = parseInt(parameters['Special Breakpoint'] || 10);
Sarkilas.Param.comboTime = parseInt(parameters['Combo Time'] || 60);
Sarkilas.Param.sensor = parseInt(parameters['Default Sensor'] || 10);
Sarkilas.Param.combatSwitch = parseInt(parameters['Combat Switch'] || 1);
Sarkilas.Param.levelSE = parameters['Level Up Sound'];
Sarkilas.Param.mouseAim = ((parameters['Mouse Aiming'] || 'true') === 'true');
Sarkilas.Param.disableSwitch = parseInt(parameters['Disable Switch'] || 1);
Sarkilas.Param.hitVariable = parseInt(parameters['Hit Variable'] || 1);

// Load actual skill map
DataManager.loadMapData(Sarkilas.Param.skillMap);

// Set up key mapper
Input.keyMapper = {
    9: 'tab',       // tab
    13: 'ok',       // enter
    16: 'shift',    // shift
    17: 'control',  // control
    18: 'control',  // alt
    27: 'escape',   // escape
    32: 'ok',       // space
    33: 'pageup',   // pageup
    34: 'pagedown', // pagedown
    37: 'left',     // left arrow
    38: 'up',       // up arrow
    39: 'right',    // right arrow
    40: 'down',     // down arrow
    45: 'escape',   // insert
    48:  '0'            ,
    49:  '1'            ,
    50:  '2'            ,
    51:  '3'            ,
    52:  '4'            ,
    53:  '5'            ,
    54:  '6'            ,
    55:  '7'            ,
    56:  '8'            ,
    57:  '9'            ,
    65:  'a'            ,
    66:  'b'            ,
    67:  'ok'            ,
    68:  'd'            ,
    69:  'e'            ,
    70:  'f'            ,
    71:  'g'            ,
    72:  'h'            ,
    73:  'i'            ,
    74:  'j'            ,
    75:  'k'            ,
    76:  'l'            ,
    77:  'm'            ,
    78:  'n'            ,
    79:  'o'            ,
    80:  'p'            ,
    81:  'pageup'       , // q
    82:  'r'            ,
    83:  's'            ,
    84:  't'            ,
    85:  'u'            ,
    86:  'v'            ,
    87:  'pagedown'     , // w
    88:  'escape'       , // x
    89:  'y'            ,
    90:  'ok'           , // z
    87: 'up',
    65: 'left',
    83: 'down',
    68: 'right',
    96: 'escape',   // numpad 0
    98: 'down',     // numpad 2
    100: 'left',    // numpad 4
    102: 'right',   // numpad 6
    104: 'up',      // numpad 8
    120: 'debug'    // F9
};

//=============================================================================
// AudioManager
//  * Additional code for voice control.
//=============================================================================

AudioManager.playVoice = function(voice) {
    if (voice.name) {
        this._seBuffers = this._seBuffers.filter(function(audio) {
            return audio.isPlaying();
        });
        var buffer = this.createBuffer('se/voices', voice.name);
        this.updateSeParameters(buffer, voice);
        buffer.play(false);
        this._seBuffers.push(buffer);
    }
};

//=============================================================================
// Scene_Boot
//  * Additional code for loading skill map data.
//=============================================================================

// Ensure our map is created
Sarkilas.Scene_Boot = Sarkilas.Scene_Boot || {};

Sarkilas.Scene_Boot.isReady = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function() {
	if(DataManager.isMapLoaded() &&
		Sarkilas.Param.skillMap === parseInt(Sarkilas.Param.skillMap, 10)) {
		Sarkilas.Param.skillMap = $dataMap;
	} else if(Sarkilas.Param.skillMap === parseInt(Sarkilas.Param.skillMap, 10)) {
		return false;
	}
    return Sarkilas.Scene_Boot.isReady.call(this);
};

//=============================================================================
// Game_Temp
//  * Additional code for temporary data.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Temp = Sarkilas.Game_Temp || {};

Sarkilas.Game_Temp.initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
	Sarkilas.Game_Temp.initialize.call(this);
	this._inCombat = false;
	this._combo = 0;
	this._comboTime = 0;
	this._comboDamage = 0;
	this._slowTime = 0;
	this._slowRate = 0;
	this._tempSkills = {};
};

Game_Temp.prototype.comboHit = function(damage) {
	this._combo++;
	this._comboDamage += damage;
	this._comboTime = Sarkilas.Param.comboTime;
	if(Sarkilas.Param.weaponSpecial) 
		if(this._combo % Sarkilas.Param.specialBreakpoint == 0) 
			$gamePlayer.weaponSpecial(true);
};

Game_Temp.prototype.resetCombo = function() {
	this._combo = 0;
	this._comboTime = 0;
	this._comboDamage = 0;
};

Game_Temp.prototype.combo = function() {
	return this._combo;
};

Game_Temp.prototype.comboDamage = function() {
	return this._comboDamage;
};

Game_Temp.prototype.startSlowmo = function(rate, time) {
	this._slowRate = rate;
	this._slowTime = time;
};

Game_Temp.prototype.setTempSkill = function(skillId, newSkillId) {
	if(this.tempSkill(skillId) !== newSkillId &&
		$gameParty.leader())
		$gameParty.leader().requestSkillChange();
	this._tempSkills[skillId] = newSkillId;
};

Game_Temp.prototype.tempSkill = function(skillId) {
	return this._tempSkills[skillId] ? this._tempSkills[skillId] : skillId;
};

Game_Temp.prototype.removeTempSkill = function(skillId) {
	if(this._tempSkills[skillId] && $gameParty.leader())
		$gameParty.leader().requestSkillChange();
	this._tempSkills[skillId] = null;
};

Game_Temp.prototype.update = function() {
	// Update the combo timer
	if(this._comboTime > 0) {
		this._comboTime--;
		if(this._comboTime == 0) {
			this.resetCombo();
		}
	}

	// Update slowmo
	if(this._slowTime > 0) {
		SceneManager._frameLimit = this._slowRate;
		this._slowTime--;
	} else {
		SceneManager._frameLimit = 60;
	}
};

Game_Temp.prototype.inBattle = function() {
	return (this._comboTime > 0 || $gameSwitches.value(Sarkilas.Param.combatSwitch));
};

//=============================================================================
// Game_Character
//  * Additional code to attach battlers to events.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Character = Sarkilas.Game_Character || {};

// Object definitions
Object.defineProperties(Game_Character.prototype, {
    battler: { get: function() { return this._battler; }, configurable: true },
    pose: { get: function() { return this._pose ? this._pose : ""; }, configurable: true },
    sensor: { get: function() {
    	if(this.isEnemy()) {
    		var radius = Utils.dataValue(this.battler.enemy(), "Sensor");
    		return radius ? Math.floor(radius) : Sarkilas.Param.sensor;
    	} else if(this.isActor()) {
    		return Sarkilas.Param.sensor * 10; // actors act differently
    	} else {
    		return 0;
    	}
    }, configurable: true },
    iframes: { get: function() { return this._iframes; }, configurable: true }
});

// Initialize override
Sarkilas.Game_Character.initialize = Game_Character.prototype.initialize;
Game_Character.prototype.initialize = function() {
	Sarkilas.Game_Character.initialize.call(this);
	this._castTime = 0;
	this._userWait = 0;
	this._battler = null;
	this._moveCount = 0;
	this._iframes = 0;
	this._invulnerable = false;
	this._knockbackRange = 0;
	this._knockbackDirection = 0;
	this._knockbackX = this._knockbackY = -1;
	this._actionMoveSpeed = 0;
	this._weaponIndex = 0;
	this._poseSpeed = 1;
	this._customSequence = false;
};

// Set action movespeed
Game_Character.prototype.setActionMoveSpeed = function(speed) {
	this._actionMoveSpeed = speed;
};

// Invulnerable settings
Game_Character.prototype.isInvulnerable = function() {
	return this._invulnerable;
};
Game_Character.prototype.setInvulnerable = function(bool) {
	this._invulnerable = bool;
};

// Character update modification
Sarkilas.Game_Character.update = Game_Character.prototype.update;
Game_Character.prototype.update = function() {
	// Update the base character class
	Sarkilas.Game_Character.update.call(this);

	// If this is a battler that currently can be updated
	if(this.canUpdateBattler()) {
		// Update AI if not player
		if(!(this instanceof Game_Player)) {
			if(this.page().moveType != 3 && this.isEnemy()) {
				this.updateAI();
			} else {
				var key = [this._mapId, this._eventId, 'D'];
				if(!$gameSelfSwitches.value(key))
					$gameSelfSwitches.setValue(key, true);
			}
		}

		// Update cooldowns if actor
		if(this.isActor())
			this.battler.updateCooldowns();

		// Update battler stats
		this.battler.updateStates();

		// If battler is requesting a skill: shoot
		if(this.battler.isRequestingSkill()) {
			this.shoot(this.battler.isRequestingSkill());
			this.battler.requestSkill(0);
		}

		// Update cast time
		if(this._castTime > 0) {
			this._castTime--;
			var castAnimation = Utils.dataVector2(this._queuedAction, "Cast animation");
			if(castAnimation) {
				this._castAnimationTime--;
				if(this._castAnimationTime <= 0) {
					this._castAnimationTime = Math.floor(castAnimation[1]);
					this.requestAnimation(Math.floor(castAnimation[0]));
				}
			}
			if(this._castTime <= 0) {
				this.shoot(this._queuedAction, true);
			}
		}

		// Update knockback
		if(this.isKnockbacking()) {
			this.updateKnockback();
		}
	} else if(this.isBattler() && !(this instanceof Game_Player)) { // battler is currently inactive
		if(this.page()) {
			if(this.page().moveType == 3) {
				var key = [this._mapId, this._eventId, 'D'];
				if($gameSelfSwitches.value(key))
					$gameSelfSwitches.setValue(key, false);
			}
		}
	}

	// Update other
	this.updateOther();

	// Update wait time
	if(this._userWait > 0) {
		this._userWait--;
		if(this._userWait <= 0) {
			this._pose = "";
		}
	}

	// Update death
	if(this.isBattler()) {
		// Update death effects
		if(this.battler.isDead()) {
			if(this instanceof Game_Event) {
				this.onDeathEffect();
				this.erase();
				if(!(this instanceof Game_Bullet)) {
					var noRespawn = Utils.hasTag(this.event(), "No respawn");
					if(noRespawn)
						$gameSystem.addEvent($gameMap.mapId(), this.eventId());
				}
				this._battler = null;
			}
		}
	}
};

// Update other
Game_Character.prototype.updateOther = function() {
	// Update invulnerability frames
	if(this._iframes > 0) {
		this._iframes--;
	}
};

// Can update battler ?
Game_Character.prototype.canUpdateBattler = function() {
	return (this.isBattler() && this.in_range(
		$gamePlayer.x, $gamePlayer.y, this.sensor) && 
		this.page() && !$gameMap.isEventRunning());
};

// In range ?
Game_Character.prototype.in_range = function(x, y, radius) {
	return (x >= this.x - radius && y >= this.y - radius &&
		x <= this.x + radius && y <= this.y + radius);
};

// Is enemy ?
Game_Character.prototype.isEnemy = function() {
	return (this.isBattler() ? (this.battler instanceof Game_Enemy) : false);
};

// Is actor ?
Game_Character.prototype.isActor = function() {
	return (this.isBattler() && !this.isEnemy());
};

// Data
Game_Character.prototype.data = function() {
	return (this.isEnemy() ? this.battler.enemy() : 
		this.isActor() ? this.battler.actor() : null);
};

// Update AI
Game_Character.prototype.updateAI = function() {
	// Return if busy
	if(this.busy()) return;

	// Generate random number
	var n = Utils.rand(3,6) / (1 + (this.battler.agi / 100));

	// Action controls
	if(this._moveCount > n) {
		// Only perform an action if not casting
		if(this._castTime <= 0) {
			this.battler.clearActions();
			this.battler.makeActions();
			if(this.battler.action(0).item()) {
				this.shoot(this.battler.action(0).item().id);
			}
		}

		// Reset move count
		this._moveCount = 0;
	} else {
		if(Utils.rand(0,100) < 50)
			this.moveTowardPlayer();
		else
			this.moveRandom();
		this._moveCount++;
	}
};

// Cancel wait
Game_Character.prototype.cancelWait = function() {
	this._userWait = 0;
	this._pose = "";
};

// Hit effect
Game_Character.prototype.onHitEffect = function(iframes) {
	this._iframes = iframes;
};

// Death effect
Game_Character.prototype.onDeathEffect = function() {
	// Get data
	var data = this.data();

	// Perform a voice check
	this.voiceCheck(data, true);

	// Perform collapse SE
	var se = Utils.dataValue(data, "Death SE");
	if(se) {
		var se = {
			name: se,
			volume: 80,
			pitch: 100,
			pan: 100
		}
		AudioManager.playSe(se);
	} else {
		SoundManager.playEnemyCollapse();
	}

	// Execute final attack
	var finalAttack = Utils.dataValue(data, "Final attack");
	if(finalAttack) 
		this.shoot(Math.floor(finalAttack));

	// Perform slow death if required
	var slowmo = Utils.dataVector2(data, "Die slow");
	if(slowmo) 
		$gameTemp.startSlowmo(Math.floor(slowmo[0]), Math.floor(slowmo[1]));

	// Set death switch
	var deathSwitch = Utils.dataVector2(data, "Death switch");
	if(deathSwitch) 
		$gameSwitches.setValue(Math.floor(deathSwitch[0]), deathSwitch[1]);

	// Execute death script
	var script = Utils.dataText(data, "Death Effect");
	if(script) 
		eval(script);

	// Finally gain loot if enemy
	if(this.isEnemy()) {
		$gameParty.gainGold(data.gold);
		this.battler.makeDropItems().forEach(function(item) {
			$gameParty.gainItem(item, 1, false);
		});
		$gameParty.allMembers().forEach(function(actor) {
			actor.gainExp(data.exp);
		});
	}
};

// Is battler ?
Game_Character.prototype.isBattler = function() {
	return (!this._erased && (this.battler ? true : false));
};

// Busy?
Game_Character.prototype.busy = function() {
	return (this._userWait > 0 || this.isMoving());
};

// Shoot
Game_Character.prototype.shoot = function(skillId, instant, force) {
	// Set up instant value (default false)
	instant = instant || false;

	// Log information
	if(!this.isBattler()) {
		throw new Error("You forgot to make this event into a battler!");
	}

	// Return if not a unable to use skill
	if((this._castTime > 0 || this.busy()) && !force) return;

	// If is player
	if(this.battler.isPlayer())
		skillId = $gameTemp.tempSkill(skillId);

	// Get skill
	var skill = $dataSkills[skillId];

	// If no skill: log information
	if(!skill) {
		throw new Error("The skill ID " + skillId + " isn't in the database.");
	}

	// Check custom condition
	if(!this.condition(skill) || !this.battler.canPaySkillCost(skill)) {
		if(this.battler.isPlayer())
			SoundManager.playBuzzer();
		return;
	}

	// If cast time: add to queue (unless instant)
	if(!instant) {
		if(Utils.dataValue(skill, "Cast time")) {
			this._queuedAction = skillId;
			this._castTime = Math.floor(Utils.dataValue(skill, "Cast time"));
			var castAnimation = Utils.dataVector2(skill, "Cast animation");
			if(castAnimation) {
				this._castAnimationTime = Math.floor(castAnimation[1]);
				this.requestAnimation(Math.floor(castAnimation[0]));
			}
			return;
		}
	}

	// Update mouse aim
	this.updateMouseAim();

	// If skill can't aim: set mouse direction to same as character
	if(!Utils.hasTag(skill, "Aim"))
		this._mouseDirection = 2;

	// Pay skill cost
	this.battler.paySkillCost(skill);

	// Create action
	var action = new Game_Action(this);
    action.setSkill(skillId);

    // Add cooldown
    if(this.isActor()) {
		this.battler.addCooldown(skill);
	}

    // Attach action
    this.actionAttachment(action);
};

// Custom condition check
Game_Character.prototype.condition = function(skill) {
	var script = Utils.dataText(skill, "Condition");
	if(script) {
		return new Function(script)();
	} else { // always return true if there's no custom condition
		return true;
	}
};

// Attach action
Game_Character.prototype.actionAttachment = function(action) {
	// Get skill or item data
	var data = action.item();

	// Get event ID
	var eventId = Math.floor(Utils.dataValue(data, "Event ID"));

	// Get directions
	var directions = Math.floor(Utils.dataValue(data, "Directions"));

	// Make direction array
	var arry = this.makeDirectionArray(directions);

	// Get offsets
	var ox = 0;
	var oy = 0;
	if(this instanceof Game_Event) {
		ox = Utils.dataValue(this.event(), "OffsetX");
		oy = Utils.dataValue(this.event(), "OffsetY");
		ox = ox ? Math.floor(ox) : 0;
		oy = oy ? Math.floor(oy) : 0;
	}

	// Fire a bullet in every direction provided
	for(var i = 0; i < arry.length; i++) {
		var bullet = new Game_Bullet(arry[i], eventId, action);
		bullet.setPosition(this.x+ox, this.y+oy);
		$gameMap.addBullet(bullet);
	}

	// Voice check
	if(!(this.isActor() && (this instanceof Game_Bullet)))
		this.voiceCheck(data);

	// User wait
	var wait = Utils.dataValue(data, "User Wait");
	if(wait) {
		var pose = Utils.dataValue(data, "Pose");
		this._pose = pose ? pose : "";
		var speed = Utils.dataValue(data, "Animation speed");
		this._poseSpeed = speed ? speed : 1;
		this._userWait = Math.floor(wait);
		this._immobile = Utils.hasTag(data, "Immobile");
		if(this.pose !== "")
			this.setPattern(0);
	}

	// Execute script
	var script = Utils.dataText(data, "Script");
	if(script) 
		eval(script);
};

// Knockbacking ?
Game_Character.prototype.isKnockbacking = function() {
	return this._knockbackRange > 0;
};

Game_Character.prototype.isDirectionFixed = function() {
    return this._directionFix || this.isKnockbacking() || this._userWait > 0;
};

Game_Character.prototype.hasWalkAnime = function() {
	return this._walkAnime && !this.isKnockbacking();
}

// Knockback effect
Game_Character.prototype.startKnockback = function(direction, range) {
	// Ignore if already knockbacking
	if(this.isKnockbacking()) return;

	// Get data
	var data = this.data();

	// Return if immune to knockback
	if(Utils.hasTag(data, "No knockback")) return;

	// Set knockback range and direction
	this._knockbackRange = range;
	this._knockbackDirection = direction;
};

// Update knockback
Game_Character.prototype.updateKnockback = function() {
	// Perform knockback
	for(var i = 0; i < this._knockbackRange; i++)
		this.knockback(this._knockbackDirection);

	// Set destination 
	this._knockbackX = this._x;
	this._knockbackY = this._y;

	// Reset knockback
	this._knockbackRange = 0;
};

// Actual knockback method
Game_Character.prototype.knockback = function(d) {
    this.setMovementSuccess(this.canPass(this._x, this._y, d));
    if (this.isMovementSucceeded()) {
        this._x = $gameMap.roundXWithDirection(this._x, d);
        this._y = $gameMap.roundYWithDirection(this._y, d);
        this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(d));
        this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(d));
    }
};


// Knockback speed
Game_Character.prototype.knockbackSpeed = function() {
	if(this._knockbackX < 0) return 0;
	if(this._realX !== this._knockbackX || this._realY !== this._knockbackY) {
		return 1;
	} else {
		this._knockbackX = this._knockbackY = -1;
		return 0;
	}
};

// Real move speed
Game_Character.prototype.realMoveSpeed = function() {
	return this._moveSpeed + this._actionMoveSpeed + this.knockbackSpeed();
};

// Voice check
Game_Character.prototype.voiceCheck = function(arg, death) {
	// Set up variables
	death = death || false;
	var data = null;
	var suffix = "";
	var voices = 0;

	// Get data
	if(this.battler.isActor()) {
		data = this.battler.actor();
	} else if(this.battler.isEnemy()) {
		data = this.battler.enemy();
	}

	// Return if no valid data
	if(!data) return;

	// If death voice
	if(death) {
		// Set voices
		voices = Utils.dataValue(data, "Death voices");

		// Set suffix
		suffix = "_Death";
	} else if(arg) { // if skill voice
		// Return if this skill does not trigger voices
		if(Utils.hasTag(arg, "No voice"))
			return;

		// Set voices
		voices = Utils.dataValue(data, "Attack voices");

		// Set suffix
		suffix = "_Attack";
	} else { // when damaged
		// Set voices
		voices = Utils.dataValue(data, "Damage voices");

		// Set suffix
		suffix = "_Damage";
	}

	// Actual voice check
	if(voices) {
		voices = Math.floor(voices);
		if(voices > 0) {
			var n = Utils.rand(1, voices);
			var voice = {
				name: data.name + suffix + n,
				volume: 80,
				pitch: 100,
				pan: 100
			};
			AudioManager.playVoice(voice);
		}
	}
};

// Get sequence
Game_Character.prototype.sequence = function() {
	return this._customSequence;
}

// Purge
Game_Character.prototype.purge = function(count) {

};

// Cleanse
Game_Character.prototype.cleanse = function(count) {

};

// Make direction array
Game_Character.prototype.makeDirectionArray = function(directions) {
	switch(directions) {
		case 1:
			return this._mouseDirection !== undefined ? [this._mouseDirection] : [2];
		case 2:
			return [0,1];
			break;
		case 3:
			return [0,1,2];
		case 4:
		case 5:
		case 6:
		case 7:
			return [2,4,6,8];
		case 8:
			return [0,1,2,3,4,5,6,8];
		default:
			return [2];
	}
};

// Has step anime
Game_CharacterBase.prototype.hasStepAnime = function() {
	if(this._pose) {
		return true;
	}
    return this._stepAnime;
};

// Character name modification to allow poses
Game_Character.prototype.characterName = function() {
	if(!this._characterName)
		return "";
	if(!Utils.fileExists('characters/' + this._characterName + this.pose)) {
		return this._characterName;
	} else {
    	return this._characterName + this.pose;
    }
};

Game_Character.prototype.animationWait = function() {
	if(this.pose) {
		return ((9 - this.realMoveSpeed()) * 3) / this._poseSpeed;
	} else {
    	return (9 - this.realMoveSpeed()) * 3;
    }
};

// Update mouse aim
Game_Character.prototype.updateMouseAim = function() {
	// If actor and player
	if(!this.isActor()) return;
	if(!this.battler.isPlayer() || (this instanceof Game_Bullet)) return;

	// Update mouse aim if possible
	if(Sarkilas.Param.mouseAim && !(this._userWait > 0)) {
		$gamePlayer.turnToward($gameMap.canvasToMapX(TouchInput.x),
            $gameMap.canvasToMapY(TouchInput.y));
		this.getMouseDirection();
	}
};

// Get mouse direction
Game_Character.prototype.getMouseDirection = function() {
	var x = $gameMap.canvasToMapX(TouchInput.x);
	var y = $gameMap.canvasToMapY(TouchInput.y);
	var deltaX = x - this.x;
	var deltaY = y - this.y;
	var angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
	if(angle < 0) {
		angle = Math.abs(angle) + 180;
	} else {
		angle = Math.abs(angle - 180);
	}
	var data = [0,45,90,135,180,225,270,315,360];
	var index = 0;
	var distance = Utils.difference(data[0], angle);
	for(var i = 1; i < data.length; i++) {
		var ndistance = Utils.difference(data[i], angle);
		if(ndistance < distance) {
			distance = ndistance;
			index = i;
		}
	}
	switch(data[index]) {
		case 0: 
		case 90:
		case 180:
		case 270:
		case 360:
			this._mouseDirection = 2;
			break;
		case 45: 
			this._mouseDirection = this.direction() === 8 ? 0 : 1;
			break;
		case 135:
			this._mouseDirection = this.direction() === 6 ? 0 : 1;	
			break;
		case 225: 
			this._mouseDirection = this.direction() === 2 ? 0 : 1;
			break;
		case 315:
			this._mouseDirection = this.direction() === 4 ? 0 : 1;
			break;
		default:
			this._mouseDirection = 2;
			break;
	}
};

// Weapon attack (attacks with equipped weapons, alternating if multiple)
// Only works for actors
Game_Character.prototype.weaponAttack = function() {
	// If not an actor: return
	if(!this.isActor() || this._userWait > 0) return;

	// Get weapons
	var weapons = this.battler.weapons();

	// Increase weapon index
	this._weaponIndex++;

	// Fix weapon index
	if(this._weaponIndex >= weapons.length)
		this._weaponIndex = 0;

	// Get weapon
	var weapon = weapons[this._weaponIndex];

	// If no weapon: return
	if(!weapon) return;

	// Get skill ID
	var skillId = Utils.dataValue(weapon, "Skill");
	if(skillId) {
		skillId = Math.floor(skillId);
	} else {
		throw new Error("The weapon " + weapon.name + " must have a skill reference!");
	}

	// Get skill
	var skill = $dataSkills[skillId];

	// Perform the action
	this.shoot(skillId);

	// Check if skill uses weapon pose
	if(Utils.hasTag(skill, "Weapon pose")) {
		var pose = Utils.dataValue(weapon, "Pose");
		if(pose)
			this._pose = pose;
		if(this.pose !== "") {
			this.setPattern(0);
			this._animationCount = 0;
		}
	}
};

// Weapon special attack (performs the special attack for the last used weapon)
// Only works for actors
Game_Character.prototype.weaponSpecial = function(force) {
	// If not an actor: return
	if((!this.isActor() || this._userWait > 0) && !force) return;

	// Get weapons
	var weapons = this.battler.weapons();

	// Fix weapon index
	if(this._weaponIndex >= weapons.length)
		this._weaponIndex = 0;

	// Get weapon
	var weapon = weapons[this._weaponIndex];

	// If no weapon: return
	if(!weapon) return;

	// Get skill ID (returns if nothing is found: this is not a required tag)
	var skillId = Utils.dataValue(weapon, "Special");
	if(skillId) {
		skillId = Math.floor(skillId);
	} else {
		return;
	}

	// Get skill
	var skill = $dataSkills[skillId];

	// Perform the action
	this.shoot(skillId, true, force);

	// Check if skill uses weapon pose
	if(Utils.hasTag(skill, "Weapon pose")) {
		var pose = Utils.dataValue(weapon, "Pose");
		if(pose)
			this._pose = pose;
		if(this.pose !== "") {
			this.setPattern(0);
			this._animationCount = 0;
		}
	}
};

Game_Character.prototype.turnToward = function(x, y) {
    var sx = this.deltaXFrom(x);
    var sy = this.deltaYFrom(y);
    if (Math.abs(sx) > Math.abs(sy)) {
        this.setDirection(sx > 0 ? 4 : 6);
    } else if (sy !== 0) {
        this.setDirection(sy > 0 ? 8 : 2);
    }
};

//=============================================================================
// Game_Actor
//  * Additional code for the player.
//=============================================================================

Game_Actor.prototype.onPlayerWalk = function() {
    this.checkFloorEffect();
    if ($gamePlayer.isNormal()) {
        this.turnEndOnMap();
        this.states().forEach(function(state) {
            this.updateStateSteps(state);
        }, this);
        this.showAddedStates();
        this.showRemovedStates();
    }
};

//=============================================================================
// Game_Player
//  * Additional code for the player.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Player = Sarkilas.Game_Player || {};

// Player refresh modification
Sarkilas.Game_Player.refresh = Game_Player.prototype.refresh;
Game_Player.prototype.refresh = function() {
    Sarkilas.Game_Player.refresh.call(this);
};

// Player update modification
Sarkilas.Game_Player.update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
	// If no battler is attached to player: recheck
	if(this.battler !== $gameParty.leader()) {
    	this._battler = $gameParty.leader();
    }
    Sarkilas.Game_Player.update.call(this, sceneActive);
};

// Can update battler ?
Game_Player.prototype.canUpdateBattler = function() {
	return !$gameSwitches[Sarkilas.Param.disableSwitch] && !$gameMap.isEventRunning();
};

// Busy?
Game_Player.prototype.busy = function() {
	return (this._userWait > 0);
};

// Can move modification
Sarkilas.Game_Player.canMove = Game_Player.prototype.canMove;
Game_Player.prototype.canMove = function() {
	if(this.isKnockbacking() || (this._userWait > 0 && this._immobile) ||
		this._customSequence) return false;
	return Sarkilas.Game_Player.canMove.call(this);
};

// Real move speed
Game_Player.prototype.realMoveSpeed = function() {
	return Game_Character.prototype.realMoveSpeed.call(this) + 0.5;
};

// Use tool
Game_Player.prototype.useTool = function() {

};

// Update actions
Game_Player.prototype.updateActions = function() {
	// Return if can't update
	return (!this.canUpdateBattler() || this._userWait > 0);
};

//=============================================================================
// Game_Event
//  * Additional code to attach battlers to events.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Event = Sarkilas.Game_Event || {};

// Event refresh modification
Sarkilas.Game_Event.refresh = Game_Event.prototype.refresh;
Game_Event.prototype.refresh = function() {
	// Return if page locked
	if(this._pageLock) return;

	// If no battler is attached to this event: recheck
    if(!this.isBattler()) {
    	// If a valid enemy value is found: attach enemy
    	// Else if valid actor value is found: attach actor
    	if(Utils.dataValue(this.event(), "Enemy")) {
    		var enemyId = Math.floor(Utils.dataValue(this.event(), "Enemy"));
    		this._battler = new Game_Enemy(enemyId, 0, 0);
    	} else if(Utils.dataValue(this.event(), "Actor")) {
    		var actorId = Math.floor(Utils.dataValue(this.event(), "Actor"));
    		this._battler = $gameActors.actor(actorId);
    	}
    }

    // If battler
    if(this.isBattler()) {
    	// Erase if not allowed to respawn
    	if($gameSystem.noRespawns($gameMap.mapId()).indexOf(this.eventId()) >= 0) {
    		this.erase();
    		return;
    	}
    }
    Sarkilas.Game_Event.refresh.call(this);
};

// Check skill trigger
Game_Event.prototype.checkSkillTrigger = function(skillId) {
	// Return if already in progress
	if(this.isStarting() || this._erased) return false;

	// Reset page lock
	this._pageLock = false;

	// Set variable
	$gameVariables.setValue(Sarkilas.Param.hitVariable, skillId);

	// Get pages
	var n = this.findProperPageIndex();
	if(n !== this._pageIndex) {
		this._pageIndex = n;
		this.setupPage();
		this.start();
		this._pageLock = true;
	}

	// Unset variable
	$gameVariables.setValue(Sarkilas.Param.hitVariable, 0);

	// Return page lock
	return this._pageLock;
};

// True if this event can be hit (using the <Hit> tag)
Game_Event.prototype.canHit = function() {
	return Utils.hasTag(this.event(), "Hit");
};

// Erase
Game_Event.prototype.erase = function() {
	if(this._sprite) {
		this._sprite.erase();
	}
	this._erased = true;
	this.refresh();
};

// Meets conditions alteration
Sarkilas.Game_Event.meetsConditions = Game_Event.prototype.meetsConditions;
Game_Event.prototype.meetsConditions = function(page) {
	var bool = Sarkilas.Game_Event.meetsConditions.call(this, page);
	var c = page.conditions;
	if (c.variableValid) {
        if (c.variableId == Sarkilas.Param.hitVariable &&
        	$gameVariables.value(Sarkilas.Param.hitVariable) != c.variableValue) {
            bool = false;
        }
    }
    return bool;
};

//=============================================================================
// Game_Battler
//  * Additional code for handling battlers.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Battler = Sarkilas.Game_Battler || {};

// Initialize modification
Sarkilas.Game_Battler.initialize = Game_Battler.prototype.initialize;
Game_Battler.prototype.initialize = function() {
	Sarkilas.Game_Battler.initialize.call(this);
	this._stateQueue = [];
	this._stateTimes = {};
	this._stateStacks = {};
};

// Request text pop
Game_Battler.prototype.requestTextPop = function(text) {
	this._stateQueue.push(text);
}

// Is requesting state pop
Game_Battler.prototype.isRequestingStatePop = function() {
	return this._stateQueue.length > 0;
};

// Get next in state queue
Game_Battler.prototype.nextState = function() {
	return this._stateQueue.shift();
};

Game_Battler.prototype.addState = function(stateId, stacks) {
	stacks = stacks || 1;
    if (this.isStateAddable(stateId)) {
    	if(this.executeScript($dataStates[stateId])) return;
        if (!this.isStateAffected(stateId)) {
            this.addNewState(stateId);
            this._stateStacks[stateId] = stacks;
            this._stateTimes[stateId] = this.stateTime(stateId);
            this.refresh();
        } else {
        	this._stateStacks[stateId] += stacks;
        	this._stateTimes[stateId] = this.stateTime(stateId);
        }
        this.resetStateCounts(stateId);
        this._result.pushAddedState(stateId);
    }
};

Game_Battler.prototype.stateTime = function(stateId) {
	// Get state
	var state = $dataStates[stateId];

	// If invalid: return 0
	if(!state) return 0;

	// Return state time
	if(state.autoRemovalTiming > 0) {
		return state.minTurns * 60;
	} else {
		return -1;
	}
};

Game_Battler.prototype.stateStacks = function(stateId) {
	// Get state
	var state = $dataStates[stateId];

	// If invalid: return 1
	if(!state) return 1;

	// Get stacks
	var stacks = Utils.dataValue(state, "Stacks");
	if(stacks)
		return Math.floor(stacks);
	else
		return 1;
};

// Executes a script effect
Game_Battler.prototype.executeScript = function(data) {
	var script = Utils.dataText(data, "Script");
	if(script) {
		return new Function(script);
	}
	else {
		return false;
	}
};

Game_Battler.prototype.updateStates = function() {
	for(var i = 0; i < this._states.length; i++) {
		var stateId = this._states[i];
		if(this._stateTimes[stateId] > 0) {
			this._stateTimes[stateId]--;
			if(this._stateTimes[stateId] == 0) {
				this.eraseState(stateId);
				continue;
			}
		}
		this.updateStateEffects(stateId);
	}
};

Game_Battler.prototype.requestSkill = function(skillId) {
	this._requestSkill = skillId;
};

Game_Battler.prototype.isRequestingSkill = function() {
	return this._requestSkill;
};

Game_Battler.prototype.isImmune = function() {
	for(var i = 0; i < this._states.length; i++) {
		var stateId = this._states[i];
		var state = $dataStates[stateId];
		if(state) {
			if(Utils.hasTag(state, "Immunity"))
				return true;
		}
	}
	return false;
};

Game_Battler.prototype.stateHitEffects = function() {
	for(var i = 0; i < this._states.length; i++) {
		var stateId = this._states[i];
		var state = $dataStates[stateId];

		// Check if there is a hit effect
		var data = Utils.dataText(state, "Hit Effect");
		if(data) {
			eval(data);
		}
	}
};

Game_Battler.prototype.updateStateEffects = function(stateId) {
	// Get state
	var state = $dataStates[stateId];
	var n = 0;
	var time = 0;

	// Damage over time
	var data = Utils.dataVector2(state, "Damage");
	if(data) {
		n = data[0];
		time = data[1];
		if(this._stateTimes[stateId] % (time * 60) == 0) {
			this.gainHp(-eval(n) * this._stateStacks[stateId]);
		}
	}

	// Healing over time
	data = Utils.dataVector2(state, "Heal");
	if(data) {
		n = data[0];
		time = data[1];
		if(this._stateTimes[stateId] % (time * 60) == 0) {
			this.gainHp(eval(n) * this._stateStacks[stateId]);
		}
	}

	// Skill effect
	data = Utils.dataVector2(state, "Skill effect");
	if(data) {
		n = Math.floor(data[0]);
		time = data[1];
		if(this._stateTimes[stateId] % (time * 60) == 0) {
			this.requestSkill(n);
		}
	}

	// Tick effect
	data = Utils.dataValue(state, "Tick");
	if(data) {
		time = Math.floor(data);
		if(this._stateTimes[stateId] % (time * 60) == 0) {
			data = Utils.dataText(state, "Tick Effect");
			if(data)
				eval(data);
		}
	}
};

Game_BattlerBase.prototype.allTraits = function() {
    return this.traitObjects().reduce(function(r, obj) {
    	var success = false;
    	if(obj.overlay !== undefined && this._stateStacks) {
	    	for(var i = 0; i < this._stateStacks[obj.id]; i++)
	        	success = r.concat(obj.traits);
	        return success;
	    } else {
	    	return r.concat(obj.traits);
	    }
    }, []);
};

Game_Battler.prototype.addNewState = function(stateId, stacks) {
	Game_BattlerBase.prototype.addNewState.call(this, stateId);
	if(stateId !== this.deathStateId()) {
		this._stateQueue.push("+" + $dataStates[stateId].name);
	}
};

Game_Battler.prototype.eraseState = function(stateId) {
	Game_BattlerBase.prototype.eraseState.call(this, stateId);
	this._stateQueue.push("-" + $dataStates[stateId].name);
};

Game_Battler.prototype.isPlayer = function() {
	if(this.isActor()) {
		return (this.actor().id === $gameParty.leader().actor().id);
	} else {
		return false;
	}
};

//=============================================================================
// Game_Actor
//  * Additional code for handling actors.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Actor = Sarkilas.Game_Actor || {};

Game_Actor.prototype.displayLevelUp = function(newSkills) {
    this.requestTextPop("Level up!");
    newSkills.forEach(function(skill) {
        this.requestTextPop("Learned " + skill.name);
    }, this);
    var se = { name: Sarkilas.Param.levelSE, volume: 80, pan: 100, pitch: 100 };
    AudioManager.playSe(se);
};

//=============================================================================
// Game_Party
//  * Additional code for party control.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Party = Sarkilas.Game_Party || {};

Game_Party.prototype.leader = function() {
	return this.allMembers()[0];
};

//=============================================================================
// Game_Action
//  * Additional code for handling actions.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Action = Sarkilas.Game_Action || {};

// Object definitions
Object.defineProperties(Game_Action.prototype, {
    character: { get: function() { return this._character; }, configurable: true }
});

// Set subject modification
Sarkilas.Game_Action.setSubject = Game_Action.prototype.setSubject;
Game_Action.prototype.setSubject = function(subject) {
	if(subject instanceof Game_Character) {
		this._character = subject;
		if(subject.isEnemy()) {
			this._subjectEnemy = subject.battler;
		} 
		Sarkilas.Game_Action.setSubject.call(this, subject.battler);
	} else {
    	Sarkilas.Game_Action.setSubject.call(this, subject);
    }
};

Game_Action.prototype.subject = function() {
    if (this._subjectActorId > 0) {
        return $gameActors.actor(this._subjectActorId);
    } else {
        return this._subjectEnemy;
    }
};

//=============================================================================
// Game_Map
//  * Additional code for handling bullet events.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Map = Sarkilas.Game_Map || {};

Sarkilas.Game_Map.setupEvents = Game_Map.prototype.setupEvents;
Game_Map.prototype.setupEvents = function() {
	this._bullets = [];
	this._erasedBullets = [];
	Sarkilas.Game_Map.setupEvents.call(this);
};

Sarkilas.Game_Map.update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
	Sarkilas.Game_Map.update.call(this, sceneActive);
	for(var i = 0; i < this._bullets.length; i++) {
		if(!this._bullets[i]) continue;
		if(this._bullets[i].finished()) {
			this._erasedBullets.push(this._bullets[i]);
		}
	}
	$gameTemp.update();
};

Game_Map.prototype.cleanupBullets = function() {
	for(var j = 0; j < this._erasedBullets.length; j++) {
		this._bullets.splice(this._bullets.indexOf(this._erasedBullets[j]), 1);
	}
	this._erasedBullets = [];
};

Game_Map.prototype.erasedBullets = function() {
	return this._erasedBullets;
};

Game_Map.prototype.bullets = function() {
	return this._bullets.filter(function(bullet) {
        return !!bullet;
    });
};

Sarkilas.Game_Map.events = Game_Map.prototype.events;
Game_Map.prototype.events = function() {
    var events = Sarkilas.Game_Map.events.call(this).slice(0);
    return events.concat(this.bullets());
};

Game_Map.prototype.battlers = function(attacker, other) {
	return this.events().filter(function(event) {
		if(attacker && event.isBattler()) {
			if(attacker.isEnemy()) {
				return ((event.isEnemy() && !other) ||
					(event.isActor() && other));
			} else if(attacker.isActor()) {
				return ((event.isActor() && !other) ||
					(event.isEnemy() && other));
			}
		}
		return event.isBattler();
	});
};

Game_Map.prototype.addBullet = function(bullet) {
	this._bullets.push(bullet);
};

//=============================================================================
// Spriteset_Map
//  * Additional code for handling bullet event sprites.
//=============================================================================

// Ensure our map is created
Sarkilas.Spriteset_Map = Sarkilas.Spriteset_Map || {};

Sarkilas.Spriteset_Map.update = Spriteset_Map.prototype.update;
Spriteset_Map.prototype.update = function() {
	if(!$gameMap.isEventRunning())
		this.bulletRecheck();
	this.recheckExtensions();
	Sarkilas.Spriteset_Map.update.call(this);
};

Spriteset_Map.prototype.recheckExtensions = function() {};

Spriteset_Map.prototype.bulletRecheck = function() {
	if(!this._bulletSprites)
		this._bulletSprites = [];
	this.cleanupBullets();
	$gameMap.bullets().forEach(function(bullet) {
		if(!this.hasBullet(bullet)) {
			var sprite = new Sprite_Bullet(bullet);
        	this._bulletSprites.push(sprite);
        	bullet.setSprite(sprite);
        	this._tilemap.addChild(sprite);
        } 
    }, this);
};

Spriteset_Map.prototype.cleanupBullets = function() {
	var erased = $gameMap.erasedBullets();
	var list = [];
	for(var j = 0; j < erased.length; j++) {
		var bullet = erased[j];
		this._bulletSprites.forEach(function(sprite) {
			if(sprite.bullet() === bullet) {
				sprite.erase();
				list.push(sprite);
			}
		}, this);
	}
	for(var i = 0; i < list.length; i++) {
		console.log("visible = " + list[i].visible);
		this._bulletSprites.splice(this._bulletSprites.indexOf(list[i]), 1);
		this._tilemap.removeChild(list[i]);
	}
	$gameMap.cleanupBullets();
};

Spriteset_Map.prototype.hasBullet = function(bullet) {
	var state = false;
	this._bulletSprites.forEach(function(sprite) {
		if(sprite.bullet() === bullet) {
			state = true;
		}
	}, this);
	return state;
};

//=============================================================================
// Sprite_Character
//  * Modifications to the character sprites for showing battler health.
//=============================================================================

// Ensure our map is created
Sarkilas.Sprite_Character = Sarkilas.Sprite_Character || {};

Sarkilas.Sprite_Character.initialize = Sprite_Character.prototype.initialize;
Sprite_Character.prototype.initialize = function(character) {
	Sarkilas.Sprite_Character.initialize.call(this, character);
	if(character.isBattler()) {
		if(!character.battler.isPlayer())
			this.createHealthbar(character.battler);
		this._damages = [];
		this._statePop = null;
	}
};

Sarkilas.Sprite_Character.update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
	Sarkilas.Sprite_Character.update.call(this);
	this.updateHealthbar();
	this.updateDamagePopup();
	if(!(this.bullet() instanceof Game_Bullet)) return;
	if(this.bullet().finished())
		this.erase();
};

Sprite_Character.prototype.bullet = function() {
	return this._character;
};

Sprite_Character.prototype.erase = function() {
	this.visible = false;
	this.hide();
};

Sprite_Character.prototype.createHealthbar = function(battler) {
	// Get data
	var data = battler.isEnemy() ? battler.enemy() : battler.actor();

	// Perform checks
	if(Utils.hasTag(data, "Object") || Utils.hasTag(data, "Item") ||
		Utils.hasTag(data, "Hide HP") || Utils.hasTag(this.bullet().event(), "Hide HP")) 
		return;

	// Create sprite
	this._healthbar = new Sprite();
	this.redrawHealthbar(battler);
	this._health = battler.hp;
	this.addChild(this._healthbar);
};

Sprite_Character.prototype.redrawHealthbar = function(battler) {
	var healthmap = new Bitmap(36,8);
	healthmap.fillRect(0,0,36,4,Utils.rgbToCssColor(0,0,0));
	var prc = battler.hp / battler.mhp;
	var barColor = battler.isEnemy() ? Utils.rgbToCssColor(255,50,50) : Utils.rgbToCssColor(50,255,50);
	healthmap.fillRect(1,1,34 * prc,2,barColor);
	this._healthbar.bitmap = healthmap;
};

Sprite_Character.prototype.updateHealthbar = function() {
	// Return if no health bar
	if(!this._healthbar) return;

	// Hide and return if no battler
	if(!this._character.isBattler()) {
		this._healthbar.visible = false;
		return;
	}

	// If leader: hide health bar and return
	if(this._character.battler.isPlayer() ||
		!this._character.isBattler()) {
		this._healthbar.visible = false;
		return;
	} 
	if(!this._healthbar.visible)
		this._healthbar.visible = true;

	// Reposition healthbar
	this._healthbar.x = -16;
	this._healthbar.y = 4;
	
	// If HP changed: redraw
	if(this._health !== this._character.battler.hp)
		this.redrawHealthbar(this._character.battler);
};

Sprite_Character.prototype.createDamagePopup = function(battler) {
	// Get data
	var data = battler.isEnemy() ? battler.enemy() : battler.actor();

	// Perform checks
	if(Utils.hasTag(data, "Object") || Utils.hasTag(data, "Item")) 
		return;

	// Create the necessary sprite
	if (battler.isDamagePopupRequested()) {
        var sprite = new Sprite_Damage();
        sprite.x = this.x;
        sprite.y = this.y - 24;
        sprite.z = this.z + 2500;
        sprite.setup(battler);
        this._damages.push(sprite);
        this.parent.addChild(sprite);
        battler.clearDamagePopup();
        battler.clearResult();
    }

    // Return if already state popping
    if(this._statePop) return;

    // Create the necessary text sprite
    if (battler.isRequestingStatePop()) {
    	var state = battler.nextState();
    	this._statePop = new Sprite_TextPop(state, battler);
    	this._statePop.x = this.x;
    	this._statePop.y = this.y - 24;
    	this._statePop.z = this.z + 2500;
    	this.parent.addChild(this._statePop);
    }
};

Sprite_Character.prototype.updateDamagePopup = function() {
	if(!this._character.isBattler() || !this._damages) return;
    this.createDamagePopup(this._character.battler);
    if (this._damages.length > 0) {
        for (var i = 0; i < this._damages.length; i++) {
        	this._damages[i].x = this.x;
        	this._damages[i].y = this.y - 24;
            this._damages[i].update();
        }
        if (!this._damages[0].isPlaying()) {
            this.parent.removeChild(this._damages[0]);
            this._damages.shift();
        }
    }
    if(this._statePop) {
    	this._statePop.x = this.x;
    	this._statePop.y = this.y - 24;
    	this._statePop.update();
    	if(this._statePop.finished()) {
    		this.parent.removeChild(this._statePop);
    		this._statePop = null;
    	}
    }
};

//=============================================================================
// Sprite_TextPop
//  * A new class that allows any text to pop on a battler.
//=============================================================================

function Sprite_TextPop() {
	this.initialize.apply(this, arguments);
}

Sprite_TextPop.prototype = Object.create(Sprite.prototype);
Sprite_TextPop.prototype.constructor = Sprite_TextPop;

Sprite_TextPop.prototype.initialize = function(text, battler) {
	Sprite.prototype.initialize.call(this);
	this._text = text;
	this._duration = 150;
	this._phase = 0;
	this._plusX = 0;
	this._plusY = 0;
	this._battler = battler;
	this.setup();
};

Sprite_TextPop.prototype.setup = function() {
	var temp = new Bitmap(640,480);
	temp.fontSize = 18;
	var width = temp.measureTextWidth(this._text);
	temp = new Bitmap(width + 4,24);
	temp.fontSize = 18;
	temp.drawText(this._text, 1, 1, width, 24);
	this.bitmap = temp;
};

Sprite_TextPop.prototype.update = function() {
	if(this._battler.isDead()) {
		this.visible = false;
		return;
	}
	this.updateMovement();
	this.updateOpacity();
};

Sprite_TextPop.prototype.updateMovement = function() {
	// Set plus X
	this._plusX = 16 - this.bitmap.width / 3;

	// Update Y
	if(this._phase == 0) {
		this._plusY--;
	}

	// Set position
	this.x = this.x + this._plusX;
	this.y = this.y + this._plusY;

	// Reduce duration
	this._duration--;

	// Increase phase
	if(this._duration % 30 == 0)
		this._phase++;
};

Sprite_TextPop.prototype.updateOpacity = function() {
    if (this._duration < 10) {
        this.opacity = 255 * this._duration / 10;
    }
};

Sprite_TextPop.prototype.finished = function() {
	return this._duration <= 0;
};

//=============================================================================
// Sprite_Bullet
//  * A new class that builds on Sprite_Character for handling bullet rotation.
//=============================================================================

function Sprite_Bullet() {
	this.initialize.apply(this, arguments);
}

Sprite_Bullet.prototype = Object.create(Sprite_Character.prototype);
Sprite_Bullet.prototype.constructor = Sprite_Bullet;

Sprite_Bullet.prototype.initialize = function(character) {
	Sprite_Character.prototype.initialize.call(this, character);
};

Sprite_Bullet.prototype.updateOther = function() {
	Sprite_Character.prototype.updateOther.call(this);
	this.rotation = this._character.angle() * Math.PI / 180;
	if(this._character.angle() !== 0)
		this.anchor.y = 0.5;
};

Sprite_Bullet.prototype.updatePosition = function() {
	this.x = this._character.screenX();
	this.y = this._character.screenY();
	this.z = this._character.screenZ();
};

//=============================================================================
// Game_Bullet
//  * A new class for handling skill events.
//=============================================================================

function Game_Bullet() {
	this.initialize.apply(this, arguments);
}

Game_Bullet.prototype = Object.create(Game_Event.prototype);
Game_Bullet.prototype.constructor = Game_Bullet;

Game_Bullet.prototype.initialize = function(direction, eventId, action) {
	Game_Event.prototype.initialize.call(this, Sarkilas.Param.skillMap.id, eventId);
	this._action = action;
	this._actionDirection = direction;
	this._hitTimers = {};
	this.setup();
	this._offsetSet = false;
};

// Object definitions
Object.defineProperties(Game_Bullet.prototype, {
    params: { get: function() { return this._params; }, configurable: true },
    actionDirection: { get: function() { return this._actionDirection; }, configurable: true }
});

// Set offset
Game_Bullet.prototype.setOffset = function() {
	// Get the skill from the action
	var skill = this._action.item();

	// Get offset
	var offset = Utils.dataValue(skill, "Offset");
	if(offset) {
		offset = Math.floor(offset);
		switch(this._moveDirection) {
			case 2: // down
				this.setPosition(this.x,this.y+offset);
				break;
			case 4: // left
				this.setPosition(this.x-offset,this.y);
				break;
			case 6: // right
				this.setPosition(this.x+offset,this.y);
				break;
			case 8: // up
				this.setPosition(this.x,this.y-offset);
				break;
		}
	}

	// Offset set
	this._offsetSet = true;
};

// User direction
Game_Character.prototype.userDirection = function(direction, shift, dir) {
	shift = shift || 0;
	dir = dir || this._actionDirection;
	var dirs = [2,4,8,6];
	var index = dirs.indexOf(direction) + shift;
	switch(dir) {
		case 0:
		case 1:
		case 2: // forward
			break;
		case 4: // user's right
			index++;
			break;
		case 6: // user's left
			index--;
			break;
		case 3:
		case 5:
		case 8: // up
			index += 2;
			break;
	}
	if(index < 0) {
		index = dirs.length + index;
	} else if(index >= dirs.length) {
		index = 0 + (index - dirs.length);
	}
	return dirs[index];
};

// Set direction
Game_Bullet.prototype.setDirection = function(direction) {
	var temp = this.direction();
	Game_Character.prototype.setDirection.call(this, direction);
	if(temp != this.direction()) {
		this._moveDirection = this.direction();
	}
};

// Move forward
Game_Bullet.prototype.moveForward = function() {
	var dirs = [2,4,6,8];
	if(dirs.indexOf(this._actionDirection) < 0) {
		this.moveRelative();
	} else {
    	this.moveStraight(this._moveDirection);
    }
};

// Set sprite
Game_Bullet.prototype.setSprite = function(sprite) {
	this._sprite = sprite;
}

// Move relative
Game_Bullet.prototype.moveRelative = function() {
	switch(this._actionDirection) {
		case 0: 
		case 3:
			if(this._moveDirection >= 4 && this._moveDirection <= 6) {
				this.moveDiagonally(this._moveDirection, 
					this.userDirection(this._moveDirection, 1, 0));
			} else {
				this.moveDiagonally(this.userDirection(
					this._moveDirection, 1, 0), this._moveDirection);
			}
			break;
		case 1:
		case 5:
			if(this._moveDirection >= 4 && this._moveDirection <= 6) {
				this.moveDiagonally(this._moveDirection, 
					this.userDirection(this._moveDirection, -1, 0));
			} else {
				this.moveDiagonally(this.userDirection(
					this._moveDirection, -1, 0), this._moveDirection);
			}
			break;
	}
};

// Angle
Game_Bullet.prototype.angle = function() {
	if(this.params.rotate) {
		switch(this._actionDirection) {
			case 0: 
			case 5:
				return 45;
			case 1:
			case 3:
				return 315;
		}
	}
	return 0;
};

// Sets up the parameters for this bullet event
Game_Bullet.prototype.setup = function() {
	// Get the skill from the action
	var skill = this._action.item();

	// Set up map
	this._params = this._params || {};

	// Get the user
	var user = this._action.character;

	// Fix direction
	this._moveDirection = this.userDirection(user.direction());
	this.setDirection(this._moveDirection);

	// Set mouse direction
	this._mouseDirection = this._actionDirection;

	// Boolean values
	this._params.piercing = Utils.hasTag(skill, "Piercing");
	this._params.ignoreInvulnerability = Utils.hasTag(skill, "Ignore invulnerability");
	this._params.melee = Utils.hasTag(skill, "Melee");
	this._params.friendlyFire = Utils.hasTag(skill, "Friendly fire");
	this._params.rotate = Utils.hasTag(skill, "Rotate");
	this._params.hookshot = Utils.hasTag(skill, "Hookshot");
	this._active = !Utils.hasTag(skill, "Start inactive");

	// Single values (values will be null if not present)
	this._params.attach = Utils.dataValue(skill, "Attach");
	this._params.duration = Utils.dataValue(skill, "Duration");
	this._params.invulnerability = Utils.dataValue(skill, "Target invulnerability");
	this._params.invulnerability = this._params.invulnerability ? 
		Math.floor(this._params.invulnerability) : 0;
	this._params.multihit = Utils.dataValue(skill, "Multihit");
	this._params.background = Utils.dataValue(skill, "Background");
	this._params.purge = Utils.dataValue(skill, "Purge");
	this._params.cleanse = Utils.dataValue(skill, "Cleanse");
	this._params.knockback = Utils.dataValue(skill, "Knockback");

	// Vector2 values
	this._params.hitbox = Utils.dataVector2(skill, "Hitbox");
	this._params.slowHit = Utils.dataVector2(skill, "Hit slowmo");
	this._params.addState = Utils.dataVector2(skill, "Add state");
	this._params.removeState = Utils.dataVector2(skill, "Remove state");

	// Vector3 values
	this._params.shake = Utils.dataVector3(skill, "Shake");
};

// Set active
Game_Bullet.prototype.setActive = function(active) {
	this._active = active;
};

// Updates the bullet
Game_Bullet.prototype.update = function() {
	Game_Event.prototype.update.call(this);
	if(!this._erased) {
		if(!this._offsetSet)
			this.setOffset();
		if(this.params.duration > 0) {
			this.params.duration--;
			if(this.params.duration <= 0) {
				this.erase();
				return;
			}
		}
		this.updateAttachment();
		this.updateHitCheck();
		this.updateNonBattlerEffects();
	}
};

// Finished?
Game_Bullet.prototype.finished = function() {
	return this._erased || this.params.duration <= 0;
};

// Update non battler effects
Game_Bullet.prototype.updateNonBattlerEffects = function() {
	// Return if inactive
	if(!this._active) return;

	// Load hitbox and map battlers
	var hitbox = this.hitbox();
	var battlers = this.params.friendlyFire ? $gameMap.battlers() : 
		$gameMap.battlers(this._action.subject(), this._action.isForOpponent());

	// Get all events
	var events = $gameMap.events().filter(function(event) {
		return !event.isBattler() && event.canHit();
	});

	// Perform hit effect on all struck events
	var hit = false;
	for(var i = 0; i < events.length; i++) {
		if(events[i] == this) continue;
		var tile = [events[i].x,events[i].y];
		if(this.collided(hitbox, tile)) {
			hit = this.hitEffectEvent(events[i]);
		}
	}

	// Erase unless piercing if any battler was hit
	if(hit && !this.params.piercing) {
		this.erase();
	}
};

// Update attachment
Game_Bullet.prototype.updateAttachment = function() {
	// If not supposed to attach: return
	if(!this.params.attach) return;

	// If attach to user
	if(this.params.attach.toLowerCase() == "user") {
		this.setPosition(this._action.character.x, this._action.character.y);
	} else if(this._attachTarget) { // if attach to target
		this.setPosition(this._attachTarget.x, this._attachTarget.y);
	}
};

// Update hit check
Game_Bullet.prototype.updateHitCheck = function() {
	// Return if inactive
	if(!this._active) return;

	// Load hitbox and map battlers
	var hitbox = this.hitbox();
	var battlers = this.params.friendlyFire ? $gameMap.battlers() : 
		$gameMap.battlers(this._action.subject(), this._action.isForOpponent());

	// Add player if required
	if((this._action.character.isEnemy() && this._action.isForOpponent()) ||
		(this._action.character.isActor() && this._action.isForFriend()) ||
		this.params.friendlyFire) {
		battlers.push($gamePlayer);
	}

	// Perform hit effect on all struck battlers
	var hit = false;
	for(var i = 0; i < battlers.length; i++) {
		var tile = [Math.round(battlers[i].x),Math.round(battlers[i].y)];
		if(this.collided(hitbox, tile)) {
			this.hitEffect(battlers[i]);
			hit = true;
		}
	}

	// Erase unless piercing if any battler was hit
	if(hit && !this.params.piercing) {
		this.erase();
	}
};

// Collects the event of this bullet
Game_Bullet.prototype.event = function() {
    return Sarkilas.Param.skillMap.events[this._eventId];
};

// Checks if a tile has collided with the hitbox
Game_Bullet.prototype.collided = function(hitbox, tile) {
	for(var i = 0; i < hitbox.length; i++) {
		if(hitbox[i][0] == tile[0] &&
			hitbox[i][1] == tile[1])
			return true;
	}
	return false;
};

// The actual hitbox currently
Game_Bullet.prototype.hitbox = function() {
	// If no valid hitbox: return hitbox as current tile only
	if(!this.params.hitbox) {
		return [[this.x,this.y]];
	}

	// Collect actual hitbox tiles
	var tiles = [];
	var range = Math.floor(this.params.hitbox[1]);
	switch(this.params.hitbox[0].toLowerCase()) {
		case "line":
			switch(this._actionDirection) {
				case 0: // down-left
				case 3: // up-left
					for(var i = 0; i < range; i++) {
						tiles.push([this.x+i,this.y-i],[this.x-i,this.y+i]);
					}
					break;
				case 1: // down-right
				case 5: // up-right
					for(var i = 0; i < range; i++) {
						tiles.push([this.x-i,this.y-i],[this.x+i,this.y+i]);
					}
					break;
				case 2: // down
				case 8: // up
					for(var i = 0; i < range; i++) {
						tiles.push([this.x,this.y-i],[this.x,this.y+i]);
					}
					break;
				case 4: // left
				case 6: // right
					for(var i = 0; i < range; i++) {
						tiles.push([this.x-i,this.y],[this.x+i,this.y]);
					}
					break;
			}
			break;

		case "wall":
			switch(this._moveDirection) {
				case 2: // down
					for(var i = 0; i < range; i++) {
						for(var j = -1; j < 1; j++) {
							tiles.push([this.x+j,this.y+i]);
						}
					}
					break;
				case 8: // up
					for(var i = 0; i < range; i++) {
						for(var j = -1; j < 1; j++) {
							tiles.push([this.x+j,this.y-i]);
						}
					}
					break;
				case 4: // left
					for(var i = 0; i < range; i++) {
						for(var j = -1; j < 1; j++) {
							tiles.push([this.x-i,this.y+j]);
						}
					}
					break;
				case 6: // right
					for(var i = 0; i < range; i++) {
						for(var j = -1; j < 1; j++) {
							tiles.push([this.x+i,this.y+j]);
						}
					}
					break;
			}
			break;

		case "square":
			for(var x = -range; x <= range; x++) {
				for(var y = -range; y <= range; y++) {
					tiles.push([this.x+x,this.y+y]);
				}
			}
			break;

		case "rhombus":
			for(var y = -range; y <= range; y++) {
				for(var x = -range-y; x <= range-Math.abs(y); x++) {
					tiles.push([this.x+x,this.y+y]);
				}
			}
			break;
	}

	// Return actual hitbox array
	return tiles.length > 0 ? tiles : [[this.x,this.y]];
};

// Hit effect for events
Game_Bullet.prototype.hitEffectEvent = function(target) {
	// If not ignoring iframes: ensure iframes are at 0 or lower
	if(!this.params.ignoreInvulnerability && target.iframes > 0)
		return false;

	// Ensure this bullet cannot constantly hit the same target
	if(this._hitTimers[target]) {
		this._hitTimers[target]--;
		if(this._hitTimers[target] <= 0) {
			delete this._hitTimers[target];
		}
		return false;
	}

	// Get skill data
	var skill = this._action.item();

	// Check event
	return target.checkSkillTrigger(skill.id);
};

// Hit effect
Game_Bullet.prototype.hitEffect = function(target) {
	// If not ignoring iframes: ensure iframes are at 0 or lower
	if(!this.params.ignoreInvulnerability && target.iframes > 0 || target.isInvulnerable())
		return;

	// Ensure this bullet cannot constantly hit the same target
	if(this._hitTimers[target]) {
		this._hitTimers[target]--;
		if(this._hitTimers[target] <= 0) {
			delete this._hitTimers[target];
		}
		return;
	}

	// Get skill data
	var skill = this._action.item();

	// If target is immune (from immunity state)
	if(target.battler.isImmune()) {
		target.battler.requestTextPop("Immune");
	} else {
		// Apply action to target 
		// This only does the actual default MV effect
		this._action.apply(target.battler);

		// State hit effects
		target.battler.stateHitEffects();

		// Start damage popup
		target.battler.startDamagePopup();

		// If a successful hit
		if(target.battler.result().isHit()) {
			// If attachment: attach
			if(this.params.attach && !this._attachTarget) {
				if(this.params.attach.toLowerCase() == "target") {
					this._attachTarget = target;
				}
			}

			// Request hit animation on target
			target.requestAnimation(skill.animationId);

			// Voice check
			target.voiceCheck(false);

			// Perform purge and cleanse
			if(this.params.purge)
				target.purge(Math.floor(this.params.purge));
			if(this.params.cleanse)
				target.cleanse(Math.floor(this.params.cleanse));

			// Perform different skill effects
			this.startSlowmo();
			this.performKnockback(target);
			this.executeScript("Hit Effect");

			// Target hit effect
			target.onHitEffect(this.params.invulnerability);

			// Shake screen
			if(this.params.shake) {
				$gameScreen.startShake(Math.floor(this.params.shake[0]), 
					Math.floor(this.params.shake[1]), Math.floor(this.params.shake[2]));
			}

			// Add to combo time or reset combo
			if(this._action.subject().isPlayer()) {
				if(this._action.isForOpponent())
					$gameTemp.comboHit(target.battler.result().hpDamage);
			} else if(target instanceof Game_Player) {
				if(this._action.isForOpponent() &&
					Sarkilas.Param.comboCancel)
					$gameTemp.resetCombo();
			}
		}
	}

	// If multihit: add timer
	if(this.params.multihit) {
		this._hitTimers[target] = Math.floor(this.params.multihit);
	} else if(this.params.piercing) {
		this._hitTimers[target] = 99999;
	}
};

// Starts the slowmo effect for this bullet
Game_Bullet.prototype.startSlowmo = function() {
	// Return if this skill doesn't have this effect
	if(!this.params.slowHit) return;

	// Start slowmo
	$gameTemp.startSlowmo(Math.floor(this.params.slowHit[0]), 
		Math.floor(this.params.slowHit[1]));
};

// Performs the knockback effect from this skill on a target
Game_Bullet.prototype.performKnockback = function(target) {
	// Return if this skill doesn't knockback
	if(!this.params.knockback) return;

	// Send knockback request to target
	target.startKnockback(this._moveDirection, Math.floor(this.params.knockback));
};

// Executes a script effect
Game_Bullet.prototype.executeScript = function(tag) {
	var script = Utils.dataText(this._action.item(), tag);
	if(script) 
		eval(script);
};

// The user character of this bullet
Game_Bullet.prototype.user = function() {
	return this._action.character;
}

//=============================================================================
// Scene_Map
//  * Modifications for the map scene.
//=============================================================================

// Endure our map is created
Sarkilas.Scene_Map = Sarkilas.Scene_Map || {};

// Update scene modification
Sarkilas.Scene_Map.updateScene = Scene_Map.prototype.updateScene;
Scene_Map.prototype.updateScene = function() {
	// Process regular weapon attack
	if (TouchInput.isPressed()) {
		$gamePlayer.weaponAttack();
	} else if(TouchInput.isCancelled()) { // tool effect
		$gamePlayer.useTool();
	}

	// If actor swapping enabled and F key is pressed: swap actor
	if(Sarkilas.Param.actorSwapping && Input.isTriggered('f') && !$gamePlayer.busy()) {
		if($gameParty.allMembers().length > 1) {
			var leader = $gameParty.leader().actor();
			$gameParty.removeActor(leader.id);
			$gameParty.addActor(leader.id);
			var sound = Utils.dataValue($gameParty.leader().actor(), "Swap SE");
			if(sound) {
				AudioManager.playSe({ name: sound, volume: 100, pan: 100, pitch: 100 });
			}
		}
	}
	
	// Update player actions
	$gamePlayer.updateActions();
	
	// Update scene
	Sarkilas.Scene_Map.updateScene.call(this);
};

// Preventing right-click to enter menu
Scene_Map.prototype.isMenuCalled = function() {
    return Input.isTriggered('menu');
};

// Disables map touch movement
Scene_Map.prototype.processMapTouch = function() {};

//=============================================================================
// Game_System
//  * Modifications for the game system for handling respawning.
//=============================================================================

// Create system map
Sarkilas.Game_System = Sarkilas.Game_System || {};

Game_System.prototype.addEvent = function(mapId, eventId) {
	this.noRespawns(mapId).push(eventId);
};

Game_System.prototype.noRespawns = function(mapId) {
	if(!this._noRespawns) this._noRespawns = {};
	if(!this._noRespawns[mapId]) this._noRespawns[mapId] = [];
	return this._noRespawns[mapId];
};

//=============================================================================
// Cooldown Additions
//=============================================================================

Sarkilas.Game_Actor.initialize = Game_Actor.prototype.initialize;
Game_Actor.prototype.initialize = function(actorId) {
	Sarkilas.Game_Actor.initialize.call(this, actorId);
	this._cooldowns = new Cooldowns();
	this._actionSkills = [];
	this._skillsChanged = false;
};

Object.defineProperties(Game_Actor.prototype, { 
	cooldowns: { get: function() { 
		if(!(this._cooldowns instanceof Cooldowns)) {
			this._cooldowns = new Cooldowns();
		}
		return this._cooldowns;
	}, configurable: true }
});

Game_Actor.prototype.actionSkill = function(index) {
	return this._actionSkills[index];
};

Game_Actor.prototype.bindSkill = function(index, skillId) {
	this._actionSkills[index] = skillId;
	this._skillsChanged = true;
};

Game_Actor.prototype.skillsChanged = function() {
	var bool = this._skillsChanged;
	this._skillsChanged = false;
	return bool;
};

Game_Actor.prototype.requestSkillChange = function() {
	this._skillsChanged = true;
};

Game_Actor.prototype.updateCooldowns = function() {
	this.cooldowns.update();
};

Game_Actor.prototype.resetCooldowns = function() {
	this.cooldowns.reset();
};

Game_Actor.prototype.addCooldown = function(skill) {
	if(Utils.dataValue(skill, "Cooldown"))
		this.cooldowns.add(skill.id, Math.floor(Utils.dataValue(skill, "Cooldown")));
};

Game_Actor.prototype.cooldown = function(skill) {
	return this.cooldowns.get(skill.id);
};

Game_Actor.prototype.onCooldown = function(skill) {
	return this.cooldowns.active(skill.id);
};

Game_Actor.prototype.skillReady = function(skill) {
	var condition = Utils.dataText(skill, "Condition");
	if(condition) {
		if(!eval(condition)) {
			return false;
		}
	}

	return !this.onCooldown(skill);
};

//=============================================================================
// Cooldowns Class
//  * The cooldown class. Must be initialized within each actor.
//=============================================================================

function Cooldowns() {
	this.initialize.apply(this, arguments);
}

Cooldowns.prototype.initialize = function() {
	this.reset();
};

Cooldowns.prototype.reset = function() {
	this._data = {};
};

Cooldowns.prototype.add = function(index, seconds) {
	this._data[index] = seconds * 60;
};

Cooldowns.prototype.get = function(index) {
	return this._data[index] ? Math.ceil(this._data[index] / 60) : 0;
};

Cooldowns.prototype.active = function(index) {
	return this._data[index] > 0;
};

Cooldowns.prototype.update = function() {
	var keys = Utils.sortedKeys(this._data);
	for(var i = 0; i < keys.length; i++) {
		if(this._data[keys[i]] > 0) {
			this._data[keys[i]]--;
		}
	}
};

//=============================================================================
// SceneManager
//  * Modifications for the scene manager to allow FPS changes.
//  * Written by ocean pollen
//=============================================================================

SceneManager._frameLimit = 60;
var nextUpdate = 0,
  timeout = null;

SceneManager.requestUpdate = function() {
	if (!this._stopped) {
	  var now = Date.now()
	  if (now >= nextUpdate) {
	    if (timeout) { clearTimeout(timeout); timeout = null }
	    nextUpdate = now + 1000/SceneManager._frameLimit
	    requestAnimationFrame(this.update.bind(this))
	  } else {
	    var that = this
	    timeout = setTimeout(function() {
	      nextUpdate = Date.now() + 1000/SceneManager._frameLimit;
	      requestAnimationFrame(that.update.bind(that))
	    }, nextUpdate - now)
	  }
	}
}