//=============================================================================
// SarkilasLevelSystem.js
//=============================================================================

/*:
 * @plugindesc Leveling system overhaul.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

 	// Actor initialize alias
 	var _Game_Actor_initialize = Game_Actor.prototype.initialize;
 	Game_Actor.prototype.initialize = function(actorId) {
 		_Game_Actor_initialize.call(this, actorId);
 		this._spentPoints = 0;
 		this._points = {'str':0, 'wis':0, 'cun':0};
 	};

 	// Redefine attribute getters
	Object.defineProperties(Game_Actor.prototype, {
	 	// ATtacK power (Strength)
	    atk: { get: function() { return this.param(2) + this._points['str']; }, configurable: true },
	    // Magic ATtack power (Wisdom)
	    mat: { get: function() { return this.param(4) + this._points['wis']; }, configurable: true },
	    // AGIlity (Cunning)
	    agi: { get: function() { return this.param(6) + this._points['cun']; }, configurable: true }
	});

 	// Get actual points
 	Game_Actor.prototype.statPoints = function() {
 		return ((this.level - 1) * 5) - this._spentPoints;
 	};

 	// Spend points function
 	Game_Actor.prototype.spendPoints = function(key, value) {
 		// Ensure that the key exists
 		if(!(key in this._points))
 			this._points[key] = 0;

 		// Add the points to the list
 		this._points[key] += value;

 		// Add to spent points
 		this._spentPoints += value;
 	};

 	//-----------------------------------------------------------------------------
	// Window_ActorSelectLevel
	//
	// The window for actor selection in the level scene.

	function Window_ActorSelectLevel() {
		this.initialize.apply(this, arguments);
	}

	Window_ActorSelectLevel.prototype = Object.create(Window_ActorSelect.prototype);
	Window_ActorSelectLevel.prototype.constructor = Window_ActorSelectLevel;

	Window_ActorSelectLevel.prototype.initialize = function(x, y, width) {
		Window_ActorSelect.prototype.initialize.call(this, x, y, width);
	};

	Window_ActorSelectLevel.prototype.drawItem = function(index) {
	    var actor = this._data[index];
	    if (actor) {
	        var rect = this.itemRect(index);
	        this.drawActorCharacter(actor, rect.x + rect.width / 2, rect.y + rect.height - 12, 4);
	        this.changeTextColor(actor.statPoints() > 0 ? this.powerUpColor() : this.powerDownColor());
	        this.drawText(actor.statPoints(), rect.x - 4, rect.y + 40, rect.width, 'right')
	    }
	};

	//-----------------------------------------------------------------------------
	// Window_ActorLevelStats
	//
	// The window for leveling up stats in level up scene.

	function Window_ActorLevelStats() {
		this.initialize.apply(this, arguments);
	}

	Window_ActorLevelStats.prototype = Object.create(Window_Selectable.prototype);
	Window_ActorLevelStats.prototype.constructor = Window_ActorLevelStats;

	Window_ActorLevelStats.prototype.initialize = function(x, y, width) {
		Window_Selectable.prototype.initialize.call(this, x, y, width, 296);
		this._actor = null;
	};	

	Window_ActorLevelStats.prototype.itemRect = function(index) {
	    var rect = new Rectangle();
	    var maxCols = this.maxCols();
	    rect.width = this.itemWidth();
	    rect.height = this.itemHeight();
	    rect.x = index % maxCols * (rect.width + this.spacing()) - this._scrollX;
	    rect.y = 136 + Math.floor(index / maxCols) * rect.height - this._scrollY;
	    return rect;
	};

	Window_ActorLevelStats.prototype.item = function() {
	    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
	};

	Window_ActorLevelStats.prototype.isCurrentItemEnabled = function() {
	    return true;
	};

	Window_ActorLevelStats.prototype.setActor = function(actor) {
		this._actor = actor;
		this.refresh();
	};

	Window_ActorLevelStats.prototype.makeItemList = function() {
	    this._data = ['+1 Strength', '+1 Cunning', '+1 Wisdom'];
	};

	Window_ActorLevelStats.prototype.maxItems = function() {
	    return this._data ? this._data.length : 1;
	};

	Window_ActorLevelStats.prototype.drawItem = function(index) {
	    var text = this._data[index];
        var rect = this.itemRect(index);
        this.changeTextColor(this.systemColor());
        this.drawText(text, rect.x + 4, rect.y, rect.width, rect.height, 0);
        this.changeTextColor(this.normalColor());
        this.drawText(text, rect.x + 4, rect.y, rect.width, rect.height, 2);
	};

	Window_ActorLevelStats.prototype.refresh = function() {
		// If no actor: return
		if(!this._actor) 
			return;

		// Make item list and draw all items
	    this.makeItemList();
	    this.createContents();
	    for(var i = 0; i < this._data.length; i++) {
	    	this.drawItem(i);
	    }

	    // Draw actor information
	    var rect = this.itemRect(0);
	    this.changeTextColor(this.systemColor());
        this.drawText(this._actor.name(), rect.x + 1, rect.y - 136, rect.width);
        this.changeTextColor(this.normalColor());
        this.drawText("Level " + this._actor.level, rect.x + 1, rect.y  - 136 + 24, rect.width);
        this.changeTextColor(this._actor.statPoints() > 0 ? this.powerUpColor() : this.powerDownColor());
        this.drawText(this._actor.statPoints() + " points available", rect.x + 1, rect.y  - 136 + 24 * 2, rect.width);
	};

	//-----------------------------------------------------------------------------
	// Window_ActorStats
	//
	// The window for detailed actor stats.

	function Window_ActorStats() {
		this.initialize.apply(this, arguments);
	}

	Window_ActorStats.prototype = Object.create(Window_Base.prototype);
	Window_ActorStats.prototype.constructor = Window_ActorStats;

	Window_ActorStats.prototype.initialize = function(x, y, width, height) {
		height = height || 404;
		Window_Base.prototype.initialize.call(this, x, y, width, height);
		this._actor = null;
	};

	Window_ActorStats.prototype.setActor = function(actor) {
		if(this._actor !== actor) {
			this._actor = actor;
			this.refresh();
		}
	};

	Window_ActorStats.prototype.refresh = function() {
		// First create contents
		this.createContents();

		// Get actor
		var actor = this._actor;

		if(actor) {
			this.drawStat(2, 2, "Maximum Health", actor.mhp);
			this.drawStat(2, 26, "Attack Power", this.minDamage(actor) + "-" + this.maxDamage(actor));
			this.drawStat(2, 50, "Spell Power", this.minDamage(actor, true) + "-" + this.maxDamage(actor, true));
			this.drawStat(2, 74, "Increased attack power", actor.attackPower(), "%");
			this.drawStat(2, 98, "Increased spell power", actor.spellPower(), "%");
			this.drawStat(2, 122, "Defense", actor.def);
			this.drawStat(2, 146, "Resistance", actor.mdf);
			this.drawStat(2, 170, "Strength", actor.atk);
			this.drawStat(2, 194, "Cunning", actor.agi);
			this.drawStat(2, 218, "Wisdom", actor.mat);
			this.drawStat(2, 242, "Luck", actor.luk);
			this.drawStat(2, 266, "Critical Power", ((actor.critDamage() * 100) + 25).toFixed(2), "%");
			this.drawStat(2, 290, "Critical Hit Chance", (actor.cri * 100).toFixed(2), "%");
			this.drawStat(2, 314, "Mana regeneration increase", (actor.manaRegen() * 100).toFixed(2), "%");
			this.drawStat(2, 338, "Mana per 5 sec", actor.mrg);
			this.drawStat(2, 362, "Pierce Chance", actor.pierceChance().toFixed(2), "%");
			this.drawStat(2, 386, "Pierce Avoidance", actor.pierceAvoidance().toFixed(2), "%");
		}
	};

	Window_ActorStats.prototype.minDamage = function(actor, spell) {
		spell = spell || false;
		var power = spell ? (actor.spellPower() / 100.0) : (actor.attackPower() / 100);
		power += 1.0;
		return (actor.minDamage() * power).toFixed(0);
	};

	Window_ActorStats.prototype.maxDamage = function(actor, spell) {
		spell = spell || false;
		var power = spell ? (actor.spellPower() / 100.0) : (actor.attackPower() / 100);
		power += 1.0;
		return (actor.maxDamage() * power).toFixed(0);
	};

	Window_ActorStats.prototype.drawStat = function(x, y, name, value, suffix) {
		suffix = suffix || "";
		this.changeTextColor(this.systemColor());
		this.drawText(name, x, y, this.contentsWidth(), 24);
		this.changeTextColor(this.normalColor());
		this.drawText(value + suffix, x - 8, y, this.contentsWidth(), 'right');
	};

	//-----------------------------------------------------------------------------
	// Window_StatTooltip
	//
	// The window for displaying benefits of stats per class.

	function Window_StatTooltip() {
		this.initialize.apply(this, arguments);
	}

	Window_StatTooltip.prototype = Object.create(Window_Base.prototype);
	Window_StatTooltip.prototype.constructor = Window_StatTooltip;

	Window_StatTooltip.prototype.initialize = function(x, y, width) {
		Window_Base.prototype.initialize.call(this, x, y, width, 128);
		this._actor = null;
		this._stat = -1;
	};

	Window_StatTooltip.prototype.setActor = function(actor) {
		if(this._actor !== actor) {
			this._actor = actor;
			this.refresh();
		}
	};

	Window_StatTooltip.prototype.setStat = function(stat) {
		if(this._stat !== stat) {
			this._stat = stat;
			this.refresh();
		}
	};

	Window_StatTooltip.prototype.refresh = function() {
		this.createContents();
		var actor = this._actor;
		if(actor && this._stat >= 0) {
			this.contents.fontSize = 24;
		    this.changeTextColor(this.systemColor());
		    this.drawText(this.statText(), 2, 4, this.contentsWidth());
		    this.contents.fontSize = this.standardFontSize();
		    this.changeTextColor(this.normalColor());
		    switch(this.statText()) {
		    	case "Strength":
		    		this.drawText("+1% Critical Power per point", 2, 32, this.contentsWidth());
		    		this.drawClassEffects();
		    		break;
		    	case "Cunning":
		    		this.drawText("+0.1% Critical Hit Chance per point", 2, 32, this.contentsWidth());
		    		this.drawClassEffects();
		    		break;
		    	case "Wisdom":
		    		this.drawText("+1% Mana regeneration rate per point", 2, 32, this.contentsWidth());
		    		this.drawClassEffects();
		    		break;
		    	default:
		    		throw new Error("Invalid stat string.");
		    }
		}
	};

	Window_StatTooltip.prototype.drawClassEffects = function(stat) {
		var actor = this._actor;
		var vectorA = Utils.dataVector2(actor.currentClass(), "AStat");
		var vectorS = Utils.dataVector2(actor.currentClass(), "SStat");
		var y = 24;
		if(vectorA[0] == this.statText()) {
			this.drawText("+" + vectorA[1] + "% increased Attack Power per point", 2, 32 + y);
			y += 24;
		}
		if(vectorS[0] == this.statText()) {
			this.drawText("+" + vectorS[1] + "% increased Spell Power per point", 2, 32 + y);
		}
	};

	Window_StatTooltip.prototype.statText = function() {
		switch(this._stat) {
			case 0: 
				return "Strength";
			case 1:
				return "Cunning";
			case 2:
				return "Wisdom";
			default:
				throw new Error("Invalid stat number.");
		}
	};

 	//-----------------------------------------------------------------------------
	// Scene_Level
	//
	// The scene class of the level up interface.

	function Scene_Level() {
	    this.initialize.apply(this, arguments);
	}

	Scene_Level.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_Level.prototype.constructor = Scene_Level;

	Scene_Level.prototype.initialize = function() {
	    Scene_MenuBase.prototype.initialize.call(this);
	};

	Scene_Level.prototype.create = function() {
	    Scene_MenuBase.prototype.create.call(this);
	    this.createWindows();
	    this.refreshActor();
	    this._actorIndex = null;
	};

	Scene_Level.prototype.createWindows = function() {
    	this._actorWindow = new Window_ActorSelectLevel(240, 60, 400);
    	this._actorWindow.setHandler('ok',		this.onActorOk.bind(this));
    	this._actorWindow.setHandler('cancel',	this.onActorCancel.bind(this));
    	this._levelWindow = new Window_ActorLevelStats(240, 168, 400);
    	this._levelWindow.setHandler('ok',		this.onLevelOk.bind(this));
    	this._levelWindow.setHandler('cancel',	this.onLevelCancel.bind(this));
    	this._actorStats = new Window_ActorStats(640, 60, 400);
    	this._tooltipWindow = new Window_StatTooltip(240, 464, 800);
		this.addWindow(this._tooltipWindow);
		this.addWindow(this._actorWindow);
		this.addWindow(this._levelWindow);
		this.addWindow(this._actorStats);
		this._actorWindow.activate();
		this._actorWindow.select(0);
	};

	Scene_Level.prototype.update = function() {
		// Actor updates
		if(this._actorIndex !== this._actorWindow.index()) {
			this._actor = this._actorWindow.item();
			this._actorIndex = this._actorWindow.index();
			this.refreshActor();
			this._actorWindow.activate();
		}

		// Set stat
		this._tooltipWindow.setStat(this._levelWindow.index());

		// Update the base class
		Scene_Base.prototype.update.call(this);
	};

	Scene_Level.prototype.refreshActor = function() {
	    var actor = this._actor;
	    if(actor) {
	    	this._levelWindow.setActor(actor);
	    	this._actorStats.setActor(actor);
	    	this._tooltipWindow.setActor(actor);
	    }
	};

	Scene_Level.prototype.onActorOk = function() {
		if(this._actor.statPoints() > 0) {
			this._levelWindow.activate();
			this._levelWindow.select(0);
		} else {
			SoundManager.playBuzzer();
			this._actorWindow.activate();
		}
	};

	Scene_Level.prototype.onActorCancel = function() {
		SceneManager.pop();
	};

	Scene_Level.prototype.onLevelOk = function() {
		var keys = ['str', 'cun', 'wis'];
		if(Input.isPressed('shift')) {
			this._actor.spendPoints(keys[this._levelWindow.index()], this._actor.statPoints() > 5 ? 5 : this._actor.statPoints());
		} else {
			this._actor.spendPoints(keys[this._levelWindow.index()], 1);
		}
		this._levelWindow.refresh();
		this._actorWindow.refresh();
		this._actorStats.refresh();

		if(this._actor.statPoints() > 0) {
			this._levelWindow.activate();
		} else {
			this._actorWindow.activate();
			this._levelWindow.select(-1);
		}
	};

	Scene_Level.prototype.onLevelCancel = function() {
		this._actorWindow.activate();
		this._levelWindow.select(-1);
	};