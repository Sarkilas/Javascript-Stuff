//=============================================================================
// SarkilasStatSystem.js
//=============================================================================

/*:
 * @plugindesc Stat system overhaul.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

 	// Party level
 	Game_Party.prototype.level = function() {
 		return this.allMembers()[0].level;
 	}

 	// Base value overrides
 	Object.defineProperties(Game_BattlerBase.prototype, {
 		// Crit chance integration
 		cri: { get: function() { return (this.xparam(2) + this.critChance()).clamp(0,1); }, configurable: true },
 		// Mp ReGeneration rate
    	mrg: { get: function() { return Math.floor(2 * (1 + this.manaRegen())); }, configurable: true }
 	});

 	// Base value overrides for enemies
 	Object.defineProperties(Game_Enemy.prototype, {
 		// Health integration
 		mhp:  { get: function() { return Math.floor(this.param(0) * this.healthModifier()); }, configurable: true }
 	});

 	// Make damage value override
 	Game_Action.prototype.makeDamageValue = function(target, critical) {
	    var item = this.item();
	    var baseValue = this.evalDamageFormula(target);
	    var value = baseValue * this.calcElementRate(target);
	    var pierced = Utils.hasTag(item, "No pierce") ? false : target.pierced(this.subject());
	    if (this.isPhysical()) {
	        value *= target.pdr;
	    }
	    if (this.isMagical()) {
	        value *= target.mdr;
	    }
	    if (baseValue < 0) {
	        value *= target.rec;
	    }
	    if (critical) {
	        value = this.applyCritical(value);
	    }
	    if(pierced) {
	    	value *= 1.5;
	    }
	    if(pierced || critical)
	    	target.requestTextPop((critical ? "Critical " : "") + (pierced ? "Pierced" : ""));
	    value = this.applyVariance(value, item.damage.variance);
	    value = this.applyGuard(value, target);
	    value = Math.round(value);
	    return value;
	};

 	// The monster formulae
 	Game_BattlerBase.prototype.damageFormula = function(spell) {
 		return Math.floor(Utils.rand(this.atk, this.mat) * this.damageModifier());
 	};
 	Game_BattlerBase.prototype.healingFormula = function() {
 		return Math.floor((Utils.rand(this.atk, this.mat) * this.damageModifier()) / 2);
 	};

 	// Battler pierced ?
 	Game_Battler.prototype.pierced = function(attacker) {
 		if(Utils.rand(0, 100) < attacker.pierceChance()) {
 			if(Utils.rand(0, 100) >= this.pierceAvoidance())
 				return true;
 		}
 		return false;
 	};

	Game_Battler.prototype.procEffects = function(item) {
		var value = Utils.dataValue(item, "Heal Self");
		if(value && value !== 0) {
			this.gainHp(Math.floor(eval(value)));
			this.startDamagePopup();
		}
	};

	var _Game_Action_apply = Game_Action.prototype.apply;
	Game_Action.prototype.apply = function(target) {
	    _Game_Action_apply.call(this, target);
	    var result = target.result();
	    if (result.isHit()) {
	        this.subject().procEffects(this.item()); 
	    }
	};

	var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
	Game_Battler.prototype.onTurnEnd = function() {
		_Game_Battler_onTurnEnd.call(this);
		var alive = !this.isDead();
		if(this instanceof Game_Actor) {
			var data = this.currentClass();
			var value = Utils.dataValue(data, "ResourceCTurn");
			if(value !== 0) {
				this._rc += value;
			}
			value = Utils.dataValue(data, "ResourceCTurnM");
			if(value !== 0) {
				this._rc -= value;
			}
			this.updateCooldowns();
		}
		if(this.isDead() && alive) { this.performCollapse(); }
	};

 	// The monster modifiers
 	Game_BattlerBase.prototype.damageModifier = function() {
 		return 1.0 + (0.5 * ($gameParty.level()-1));
 	};
 	Game_BattlerBase.prototype.healthModifier = function() {
 		return 1.0 + (0.4 * ($gameParty.level()-1));
 	};

 	Game_Enemy.prototype.exp = function() {
	    return this.enemy().exp * this.healthModifier();
	};

	Game_Enemy.prototype.gold = function() {
	    return this.enemy().gold * this.healthModifier();
	};

	// Enemy pierce values (increases with party level, caps at 25%)
	Game_Enemy.prototype.pierceChance = function() {
		return ($gameParty.level() * 2).clamp(0, 25);
	};

	// Enemy pierce avoidance (increases with party level, caps at 20%)
	Game_Enemy.prototype.pierceAvoidance = function() {
		return $gameParty.level().clamp(0, 20);
	}; 

 	// The actor formulae
 	Game_Actor.prototype.damageFormula = function(spell) {
 		var base = Utils.rand(this.minDamage(), this.maxDamage());
 		var multiplier = 1.0 + (spell ? (this.spellPower() / 100) : (this.attackPower() / 100));
 		return Math.ceil(base * multiplier);
 	};
 	Game_Actor.prototype.healingFormula = function() {
 		var base = Utils.rand(this.minDamage(), this.maxDamage());
 		var multiplier = 1.0 + (this.spellPower() / 100);
 		return Math.ceil((base * multiplier) * 4);
 	};

 	// Critical damage application
 	Game_Action.prototype.applyCritical = function(damage) {
	    return damage * this.critDamage();
	};

	// Action crit damage collection
	Game_Action.prototype.critDamage = function() {
		if(this.subject().isActor()) {
			return 1.25 + this.subject().critDamage();
		} else {
			return 1.25; 
		}
	};

	// Pierce chance (returned as a value between 0 and 100)
	Game_Actor.prototype.pierceChance = function() {
		var chance = 0;
		for(var i = 0; i < this.equipment().length; i++) {
			chance += this.equipment()[i].affixValue('prc');
		}
		return chance.clamp(0, 100);
	};

	// Pierce avoidance (returned as a value between 0 and 100)
	Game_Actor.prototype.pierceAvoidance = function() {
		var chance = 0;
		for(var i = 0; i < this.equipment().length; i++) {
			chance += this.equipment()[i].affixValue('prd');
		}
		return chance.clamp(0, 100);
	};

	// Actor crit camage
	Game_Actor.prototype.critDamage = function() {
		return (this.atk / 100.0);
	};

	// Crit chance (same for actors and enemies)
	// This value is added to base crit chance from core engine
	Game_BattlerBase.prototype.critChance = function() {
		return ((this.agi / 100.0) * 0.1).clamp(0, 1);
	};

	// Mana regeneration increase
	Game_BattlerBase.prototype.manaRegen = function() {
		return this.mat / 100.0;
	};

 	// Actor minimum and maximum base damage
 	Game_Actor.prototype.minDamage = function() {
 		var value = 0;
 		if(this.weapons().length > 0) {
	 		this.weapons().forEach(function(weapon) {
	 			value += weapon.atk;
	 		});
	 		value /= this.weapons().length;
	 		if(this.weapons() > 1){
	 			value = Math.floor(value * 1.1);
	 		}
	 	}
 		return value;
 	};
 	Game_Actor.prototype.maxDamage = function() {
 		var value = 0;
 		if(this.weapons().length > 0) {
	 		this.weapons().forEach(function(weapon) {
	 			value += weapon.mat;
	 		});
	 		value /= this.weapons().length;
	 		if(this.weapons() > 1){
	 			value = Math.floor(value * 1.1);
	 		}
	 	}
 		return value;
 	};

 	// Actor attack power and spell power calculations
 	Game_Actor.prototype.attackPower = function() {
 		var c = this.currentClass();
 		var regex = /<Attack = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 0;
 	};

 	Game_Actor.prototype.spellPower = function() {
 		var c = this.currentClass();
 		var regex = /<Spell = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 0;
 	};

 	// Initialize Tp and Resource C
 	Game_Actor.prototype.initTp = function() {
 		this.setTp(this.resourceBStart());
 		this.setRc(this.resourceCStart());
 	};

 	// The resource C control
 	Game_Actor.prototype.setRc = function(value) {
 		this._rc = value.clamp(0, this.resourceCMax());
 	};
 	Game_Actor.prototype.rc = function() {
 		return this._rc ? this._rc : this.resourceCStart();
 	};

 	Object.defineProperties(Game_Actor.prototype, {
 		// Maximum Magic Points
	    mmp: { get: function() { return this.resourceAMax(); }, configurable: true },
	});

	Game_Actor.prototype.paySkillCost = function(skill) {
	    this._mp -= this.skillMpCost(skill);
	    this._tp -= this.skillTpCost(skill);
	    var value = Utils.dataValue(skill, "ResourceC");
	    if(value !== 0) {
	    	if(Utils.hasTag(skill, "ResourceCM")) {
	    		this._rc -= Math.floor(value);
	    	} else {
	    		this._rc += Math.floor(value);
	    	}
	    }
	    this.addCooldown(skill);
	};

 	// Actor resource names
 	Game_Actor.prototype.resourceA = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceA = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? match[1] : "Mana";
 	};
 	Game_Actor.prototype.resourceAMax = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceAMax = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 100;
 	};
 	Game_Actor.prototype.resourceAStart = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceAStart = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 0;
 	};

 	Game_Actor.prototype.resourceB = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceB = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? match[1] : "Energy";
 	};
 	Game_Actor.prototype.maxTp = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceBMax = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 100;
 	};
 	Game_Actor.prototype.resourceBStart = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceBStart = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 0;
 	};

 	Game_Actor.prototype.resourceC = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceC = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? match[1] : null;
 	};
 	Game_Actor.prototype.resourceCMax = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceCMax = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 100;
 	};
 	Game_Actor.prototype.resourceCStart = function() {
 		var c = this.currentClass();
 		var regex = /<ResourceCStart = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : 0;
 	};
 	Game_Actor.prototype.rcColor1 = function() {
 		var c = this.currentClass();
 		var regex = /<RCColor1 = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : null;
 	};
 	Game_Actor.prototype.rcColor2 = function() {
 		var c = this.currentClass();
 		var regex = /<RCColor2 = (.*?)>/i;
 		var match = regex.exec(c.note);
 		return match ? eval(match[1]) : null;
 	};
 	Game_Actor.prototype.rcRate = function() {
 		return this.rc() / this.resourceCMax();
 	};