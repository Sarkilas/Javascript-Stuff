//=============================================================================
// SarkilasSkillMenu.js
//=============================================================================

/*:
 * @plugindesc Detailed skill menu. Allows only 6 active skills at once per character.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

	/**
	* Game_Actor setup alias
	*/
	var _Game_Actor_setup = Game_Actor.prototype.setup;
	Game_Actor.prototype.setup = function(actorId) {
		this._actives = []; 
		_Game_Actor_setup.call(this, actorId);
		this._skills.forEach(function (id) {
			if(this._actives.length < 8) {
				this._actives.push(id);
				this._actionSkills.push(id);
			}
		}, this);
		this.requestSkillChange();
	};

	/**
	* Game_Actor learnSkill alias
	*/
	var _Game_Actor_learnSkill = Game_Actor.prototype.learnSkill;
	Game_Actor.prototype.learnSkill = function(skillId) {
		_Game_Actor_learnSkill.call(this, skillId);
		if (this._actives.length < 8) {
			this._actives.push(skillId);
		}
	};

	/**
	* Game_Actor skills alias
	* 
	* Collects only the active skills, rather than all learned skills.
	*/
	Game_Actor.prototype.skills = function() {
		var list = [];
	    this._actives.forEach(function(id) {
	        if (!list.contains($dataSkills[id])) {
	            list.push($dataSkills[id]);
	        }
	    }, this);
	    return list.sort();
	};

	/**
	* Gets all the currently inactive skills.
	*/
	Game_Actor.prototype.inactiveSkills = function() {
		var list = [];
		this._skills.forEach(function (id) {
			if(this._actives.indexOf(id) == -1) {
				list.push($dataSkills[id]);
			}
		}, this);
	    return list.sort();
	};

	/**
	* Selects an inactive skill and swaps it with an active skill.
	*/
	Game_Actor.prototype.selectSkill = function(active, skillId) {
		this._actives[this._actives.indexOf(active)] = skillId;
		this.requestSkillChange();
	};

	Scene_Menu.prototype.createCommandWindow = function() {
	    this._commandWindow = new Window_MenuCommand(0, 0);
	    this._commandWindow.setHandler('item',      this.commandItem.bind(this));
	    this._commandWindow.setHandler('skill',     this.commandSkill.bind(this));
	    this._commandWindow.setHandler('equip',     this.commandEquip.bind(this));
	    this._commandWindow.setHandler('status',    this.commandPersonal.bind(this));
	    this._commandWindow.setHandler('formation', this.commandFormation.bind(this));
	    this._commandWindow.setHandler('options',   this.commandOptions.bind(this));
	    this._commandWindow.setHandler('save',      this.commandSave.bind(this));
	    this._commandWindow.setHandler('gameEnd',   this.commandGameEnd.bind(this));
	    this._commandWindow.setHandler('cancel',    this.popScene.bind(this));
	    this.addWindow(this._commandWindow);
	};

	Scene_Menu.prototype.commandSkill = function() {
		SceneManager.push(Scene_Skill);
	};

	Scene_Menu.prototype.commandEquip = function() {
		SceneManager.push(Scene_Equip);
	};

	//-----------------------------------------------------------------------------
	// Window_ActorSelect
	//
	// The window for selecting an actor by its graphic.

	function Window_ActorSelect() {
		this.initialize.apply(this, arguments);
	}

	Window_ActorSelect.prototype = Object.create(Window_Selectable.prototype);
	Window_ActorSelect.prototype.constructor = Window_ActorSelect;

	Window_ActorSelect.prototype.initialize = function(x, y, width) {
		Window_Selectable.prototype.initialize.call(this, x, y, width, 108);
		this.z = 9999;
		this.refresh();
	};

	Window_ActorSelect.prototype.maxCols = function() {
	    return this._data ? this._data.length : 1;
	};

	Window_ActorSelect.prototype.spacing = function() {
	    return 4;
	};

	Window_ActorSelect.prototype.maxItems = function() {
	    return this._data ? this._data.length : 1;
	};

	Window_ActorSelect.prototype.item = function() {
	    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
	};

	Window_ActorSelect.prototype.isCurrentItemEnabled = function() {
	    return true;
	};

	Window_ActorSelect.prototype.makeItemList = function() {
	    this._data = $gameParty.allMembers();
	};

	Window_ActorSelect.prototype.drawItem = function(index) {
	    var actor = this._data[index];
	    if (actor) {
	        var rect = this.itemRect(index);
	        this.drawActorCharacter(actor, rect.x + rect.width / 2, rect.y + rect.height - 12, 4);
	    }
	};

	Window_ActorSelect.prototype.refresh = function() {
	    this.makeItemList();
	    this.createContents();
	    this.drawAllItems();
	};

	Window_ActorSelect.prototype.itemWidth = function() {
		return 48;
	};

	Window_ActorSelect.prototype.itemHeight = function() {
		return 72;
	};

	//-----------------------------------------------------------------------------
	// Window_Skills
	//
	// The window for selecting a skill on the skill screen.
	// Can store either active or inactive skills, but not both.
	// Create two windows if both skill lists are required.

	function Window_Skills() {
	    this.initialize.apply(this, arguments);
	}

	Window_Skills.prototype = Object.create(Window_Selectable.prototype);
	Window_Skills.prototype.constructor = Window_Skills;

	Window_Skills.prototype.initialize = function(x, y, width, height, active) {
	    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	    this._actor = null;
	    this._data = [];
	    this._active = active;
	    this.z = 9999;
	};

	Window_Skills.prototype.setActor = function(actor) {
	    if (this._actor !== actor) {
	        this._actor = actor;
	        this.refresh();
	        this.resetScroll();
	    }
	};

	Window_Skills.prototype.maxCols = function() {
	    return 1;
	};

	Window_Skills.prototype.spacing = function() {
	    return 24;
	};

	Window_Skills.prototype.maxItems = function() {
	    return this._data ? this._data.length : 1;
	};

	Window_Skills.prototype.item = function() {
	    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
	};

	Window_Skills.prototype.isCurrentItemEnabled = function() {
	    return true;
	};

	Window_Skills.prototype.makeItemList = function() {
	    if (this._actor) {
	        this._data = this._active ? this._actor.skills() : this._actor.inactiveSkills();
	    } else {
	        this._data = [];
	    }
	};

	Window_Skills.prototype.drawItem = function(index) {
	    var skill = this._data[index];
	    if (skill) {
	        var costWidth = this.costWidth();
	        var rect = this.itemRect(index);
	        rect.width -= this.textPadding();
	        if(this._active) {
		        this.changeTextColor(this.systemColor());
		        this.drawText(Sarkilas.Param.actionKeys[index], rect.x, rect.y, 48, 'center');
		    }
	        this.drawItemName(skill, rect.x + (this._active ? 48 : 0), rect.y, rect.width - costWidth - 48);
	        this.drawSkillCost(skill, rect.x, rect.y, rect.width);
	    }
	};

	Window_Skills.prototype.costWidth = function() {
	    return this.textWidth('000');
	};

	Window_Skills.prototype.drawSkillCost = function(skill, x, y, width) {
	    if (this._actor.skillTpCost(skill) > 0) {
	        this.changeTextColor(this.tpCostColor());
	        this.drawText(this._actor.skillTpCost(skill), x, y, width, 'right');
	    } else if (this._actor.skillMpCost(skill) > 0) {
	        this.changeTextColor(this.mpCostColor());
	        this.drawText(this._actor.skillMpCost(skill), x, y, width, 'right');
	    }
	};

	Window_Skills.prototype.refresh = function() {
	    this.makeItemList();
	    this.createContents();
	    this.drawAllItems();
	};

	Window_Skills.prototype.playOkSound = function() { };

	//-----------------------------------------------------------------------------
	// Window_SkillTooltip
	//
	// The tooltip window for skills

	function Window_SkillTooltip() {
		this.initialize.apply(this, arguments);
	}

	Window_SkillTooltip.prototype = Object.create(Window_Base.prototype);
	Window_SkillTooltip.prototype.constructor = Window_SkillTooltip;

	Window_SkillTooltip.prototype.initialize = function(x, y, width, height) {
	    Window_Base.prototype.initialize.call(this, x, y, width, height);
	    this._skill = null;
	    this.refresh();
	};

	Window_SkillTooltip.prototype.refresh = function() {
	    this.createContents();
	    if(this._skill) {
	    	var y = 0;
	    	this.contents.fontSize = 24;
		    this.changeTextColor(this.systemColor());
		    this.drawText(this._skill.name, 2, y + 4, this.contentsWidth(), 0);
		    this.contents.fontSize = this.standardFontSize();
		    if(Utils.hasTag(this._skill, 'Attack')) {
		    	this.drawText("Attack", -4, y + 4, this.contentsWidth(), 'right');
		    } else if(Utils.hasTag(this._skill, 'Spell')) {
		    	this.drawText("Spell", -4, y + 4, this.contentsWidth(), 'right');
		    }
		    y += 28;
		    var cooldown = Utils.dataValue(this._skill, "Cooldown");
		    if(cooldown && cooldown !== "0") {
		    	cooldown = Math.floor(cooldown);
			    this.changeTextColor(this.mpCostColor());
			    this.drawText("Cooldown: " + cooldown + " seconds", 2, y, this.contentsWidth(), 0);
			    y += 24;
			}
			if(this._skill.tpGain > 0){
				this.changeTextColor(this.powerUpColor());
				this.drawText("Generates " + this._skill.tpGain + " " + this._actor.resourceB(), 2, y, this.contentsWidth(), 0);
				y += 24;
			}
			var rc = Utils.dataValue(this._skill, "ResourceC");
			if(rc) {
				this.changeTextColor(this.crisisColor());
				var word = Utils.hasTag(this._skill, "ResourceCM") ? "Removes" : "Generates";
				this.drawText(word + " " + rc + " " + this._actor.resourceC(), 2, y, this.contentsWidth(), 0);
				y += 24;
			}
			y += 4;
			this.changeTextColor(this.normalColor());
			this.drawTextEx(Utils.wrap(this._skill.description, Math.floor(80 * (this.width / 800))), 2, y);
		}
	};

	Window_SkillTooltip.prototype.setSkill = function(actor, skill) {
		if(this._skill !== skill) {
			this._actor = actor;
			this._skill = skill;
			this.refresh();
		}
	};

	//-----------------------------------------------------------------------------
	// Scene_Skill
	//
	// The visual interface and control of the skill menu

	Scene_Skill.prototype.create = function() {
		Scene_ItemBase.prototype.create.call(this);
		this.createWindows();
		this.refreshActor();
		this._actorWindow.activate();
		this._actorWindow.select(0);
		this._actor = this._actorWindow.item();
		this._activeWindow.select(-1);
		this._actorIndex = 0;
	};

	Scene_Skill.prototype.createWindows = function() {
		this._activeWindow = new Window_Skills(240, 131, 400, 333, true);
		this._activeWindow.setHandler('ok',     this.onActiveOk.bind(this));
    	this._activeWindow.setHandler('cancel', this.onActiveCancel.bind(this));
		this._inactiveWindow = new Window_Skills(639, 24, 400, 440, false);
		this._inactiveWindow.setHandler('ok',     this.onInactiveOk.bind(this));
    	this._inactiveWindow.setHandler('cancel', this.onInactiveCancel.bind(this));
    	this._actorWindow = new Window_ActorSelect(240, 24, 400);
    	this._actorWindow.setHandler('ok',		this.onActorOk.bind(this));
    	this._actorWindow.setHandler('cancel',	this.onActorCancel.bind(this));
    	this._tooltipWindow = new Window_SkillTooltip(240, 463, 800, 204);
    	this.addWindow(this._activeWindow);
		this.addWindow(this._inactiveWindow);
		this.addWindow(this._actorWindow);
		this.addWindow(this._tooltipWindow);
	};

	Scene_Skill.prototype.update = function() {
		// Actor updates
		if(this._actorIndex !== this._actorWindow.index()) {
			this._actor = this._actorWindow.item();
			this._actorIndex = this._actorWindow.index();
			this.refreshActor();
			this._actorWindow.activate();
		}

		// Tooltip handling
		if(this._activeWindow.isOpenAndActive()){
			this._tooltipWindow.setSkill(this._actor, this._activeWindow.item());
		} else if(this._inactiveWindow.isOpenAndActive()){
			this._tooltipWindow.setSkill(this._actor, this._inactiveWindow.item());
		} else {
			this._tooltipWindow.setSkill(null, null);
		}

		// Update the base class
		Scene_Base.prototype.update.call(this);
	};

	Scene_Skill.prototype.refreshActor = function() {
	    var actor = this._actor;
	    this._activeWindow.setActor(actor);
	    this._inactiveWindow.setActor(actor);
	};

	Scene_Skill.prototype.onActorOk = function() {
		this._activeWindow.activate();
		this._activeWindow.select(0);
	};

	Scene_Skill.prototype.onActorCancel = function() {
		SceneManager.pop();
	};

	Scene_Skill.prototype.onActiveOk = function() {
		if(this._inactiveWindow.maxItems() > 0) {
			SoundManager.playOk();
			this._inactiveWindow.activate();
			this._inactiveWindow.select(0);
		} else {
			SoundManager.playBuzzer();
			this._activeWindow.activate();
		}
	};

	Scene_Skill.prototype.onActiveCancel = function() {
		SoundManager.playCancel();
		this._activeWindow.select(-1);
		this._actorWindow.activate();
	};

	Scene_Skill.prototype.onInactiveOk = function() {
		SoundManager.playOk();
		var skill = this._inactiveWindow.item();
		var active = this._activeWindow.item();
		this._actor.selectSkill(active.id, skill.id);
		this._inactiveWindow.refresh();
		this._inactiveWindow.select(-1);
		this._activeWindow.refresh();
		this._activeWindow.activate();
	};

	Scene_Skill.prototype.onInactiveCancel = function() {
		SoundManager.playCancel();
		this._inactiveWindow.select(-1);
		this._activeWindow.activate();
	};