//=============================================================================
// SarkilasRandomEquipment.js
//=============================================================================

/*:
 * @plugindesc Randomized equipment system.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */
 	//-----------------------------------------------------------------------------
 	// Random Names static class

 	function RandomNames() {
 		throw new Error("This is a static class");
 	}

 	RandomNames._affixes = {
 		'hp': ['Tenacious {i}','Massive {i}','Healthy {i}','{i} of Stamina','{i} of Endurance','Enduring {i}'],
 		'str': ['Strong {i}','{i} of Power','{i} of Force','Mighty {i}','{i} of Might','Powerful {i}'],
 		'cun': ['Keen {i}','Sharp {i}','{i} of Acuity','Astute {i}','Shifty {i}','{i} of Guile'],
 		'wis': ['Wise {i}','{i} of the Sage','Perceptive {i}','Enlightened {i}','{i} of Knowledge'],
 		'spd': ['Fast {i}','Agile {i}','Quick {i}','Nimble {i}','Rapid {i}','Swift {i}','{i} of Dashing','Fleeting {i}'],
 		'def': ['Robust {i}','Sturdy {i}','Tough {i}','{i} of Vigor','Hearty {i}'],
 		'mdf': ['Resistant {i}','Defiant {i}','{i} of Defiance','{i} of Shielding','Protecting {i}'],
 		'mrg': ['{i} of Recovery','Restoring {i}','Flowing {i}','{i} of Flows','{i} of the Fountain'],
 		'iwp': ['Forceful {i}','{i} of Intensity','{i} of Brawn','Potent {i}','{i} of Virtue'],
 		'prc': ['Piercing {i}','{i} of Stabbing','Penetrating {i}'],
 		'prd': ['Layered {i}','Solid {i}','Ribbed {i}']
 	};

 	RandomNames._sharedPrefixes = ['Dragon','Honor','Brood','Rune','Elegant','Demon','Plasma','Alpha','Cave','Solar','Royal','Galvanic',
 									'Empyrean','Glyph','Grim','Kraken','Foe','Brimstone','Skull','Tempest','Gale','Phoenix','Soul','Fate'];
 	RandomNames._armorPrefixes = ['Protective','Defensive','Plate','Solid','Miracle'];
 	RandomNames._weaponPrefixes = ['Pointy','Brutal','Rage','Cataclysm','Pain','Hate','Behemoth','Oblivion','Doom','Morbid','Agony'];
 	RandomNames._sharedSuffixes = ['Dominion','Core','Song','Glance','Star','Spark','Clasp'];
 	RandomNames._armorSuffixes = ['Hide','Bulwark','Shell','Jack','Mantle','Guardian','Veil','Shelter','Ward'];
 	RandomNames._weaponSuffixes = ['Striker','Destroyer','Wreck','Havoc','Flayer','Edge','Bite','Blow','Strike','Crusher','Ram','Spell'];

 	RandomNames.affixName = function(type) {
 		var list = RandomNames._affixes[type];
 		return list[Utils.rand(0,list.length - 1)];
 	};

 	RandomNames.itemName = function(item) {
 		// Get prefix and suffix list
 		var prefixes = RandomNames._sharedPrefixes;
 		prefixes.concat((item.type == 'weapon') ? RandomNames._weaponPrefixes : RandomNames._armorPrefixes);
 		var suffixes = RandomNames._sharedSuffixes;
 		suffixes.concat((item.type == 'weapon') ? RandomNames._weaponSuffixes : RandomNames._armorSuffixes);

 		// Get a random prefix
 		var n = Utils.rand(0, prefixes.length - 1);
 		var prefix = prefixes[n];

 		// Get a random suffix
 		n = Utils.rand(0, suffixes.length - 1);
 		var suffix = suffixes[n];

 		// Return the final name
 		return prefix + " " + suffix;
 	};

 	//-----------------------------------------------------------------------------
 	// Game_Party additions

 	// Based on an enemy object, rolls treasure
 	Game_Party.prototype.enemyTreasure = function(enemy) {
 		// Initialize the treasure array
 		var treasure = [];

		// Get the core data (min treasure, max treasure)
		var data = Utils.dataVector2(enemy, 'Treasure');
		if(!data) data = [0,1];

		// Get the rarity bonus
		var bonus = Utils.dataValue(enemy, 'Rarity') / 100.0;

		// Get the amount of treasures from this enemy
		var amount = Math.floor(Utils.rand(Math.abs(data[0]), Math.abs(data[1])));

		// Roll treasure
		for(var j = 0; j < amount; j++) {
			treasure.push(this.rollTreasure(bonus));
		}

 		// Set the treasure (for result screen)
 		this._treasure = treasure.slice(0);

 		// Add all treasure to inventory
 		while(treasure.length > 0) {
 			// Remove and collect item from treasure array
 			var item = treasure.pop();

 			this.gainItem(item, 1, false);
 		}

 		// Request text pop
 		if(amount > 0)
 			$gamePlayer.battler.requestTextPop("+" + amount + " items");
 	};

 	// Get treasure
 	Game_Party.prototype.treasure = function() {
 		return this._treasure;
 	}

 	// Rolls a single treasure with bonus rarity included and returns it
 	Game_Party.prototype.rollTreasure = function(bonus) {
 		// Set the rarity chance
 		var rbonus = 1.0 + bonus;

 		// Roll the die
 		var roll = Utils.rand(0,100);

 		// Roll rarity
 		var rarity = 0;
 		if(roll < 5 * rbonus) { // Mythical
 			rarity = 3;
 		} else if(roll < 20 * rbonus) { // Superior
 			rarity = 2;
 		} else if(roll < 40 * rbonus) { // Enchanted
 			rarity = 1;
 		} 

 		// Select item type
 		var type = "";
 		roll = Utils.rand(0,100);
 		if(roll < 25) { // Orb
 			type = "Game_Item";
 		} else if(roll < 60) {
 			type = "Material";
 		} else {
 			type = "Armor";
 		}


 		// Select item within type based on level requirement
 		var item = this.rollItem(type);

 		// Create item
 		if(type !== "Armor") {
 			return new Game_Item(item);
 		}
 		return new Equipment(item, rarity);
 	};

 	// Rolls an item based on given type string
 	Game_Party.prototype.rollItem = function(type) {
 		switch(type) {
 			case 'Game_Item':
 				return this.rollItem('Orb');
 				break;
 			case 'Material':
 				return this.rollItem('Material');
 				break;
 			case 'Armor':
 				return this.rollEquip('armor');
 				break;
 			default:
 				throw new Error("Invalid type was passed in rollItem()");
 		}
 	};

 	// Rolls an orb item
 	Game_Party.prototype.rollItem = function(tag) {
 		// Set up data arrays
 		var orbs = [];
 		var data = [];

 		// Collect orb data
 		for(var i = 1; i < $dataItems.length; i++) {
 			// Ignore non-truths
 			if(!$dataItems[i]) continue; 

 			// Continue if item isn't an orb
 			if(!Utils.hasTag($dataItems[i], tag)) continue;

 			// Add to orb data
 			orbs.push($dataItems[i]);
 			data.push(Utils.dataValue($dataItems[i], 'Chance'));
 		}

 		// Create sorted data array
 		var sorted = data.slice().sort(function(a, b) { return a-b });

 		// Check each orb chance in the sorted order
 		var roll = Utils.rand(0,100);
 		for(var i = 0; i < sorted.length; i++) {
 			if(roll < sorted[i])
 				return orbs[data.indexOf(sorted[i])];
 		}

 		// If all else fails: return highest chance orb
 		return orbs[data.indexOf(sorted[sorted.length-1])];
 	};

 	// Rolls equipment
 	Game_Party.prototype.rollEquip = function(type) {
 		// Set up data arrays
 		var data = [];
 		var arry = type == 'weapon' ? $dataWeapons : $dataArmors;

 		// Get party level
 		var level = $gameParty.level();

 		// Iterate all weapons
 		for(var i = 1; i < arry.length; i++) {
 			// Ignore non-truths
 			if(!arry[i]) continue; 

 			// Continue if equip has no level tag
 			if(Utils.dataValue(arry[i], 'Level') == 0) continue;

 			// Continue if equip is too high level
 			if(Utils.dataValue(arry[i], 'Level') > level) continue;

 			// Add equip to data
 			data.push(arry[i]);
 		}

 		// Return a random equip
 		return data[Utils.rand(0,data.length - 1)];
 	};

 	// Gain Item override
 	var _Game_Party_gainItem = Game_Party.prototype.gainItem;
 	Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
 		if(item instanceof Equipment) {
 			this.equipment().push(item);
 		} else if(DataManager.isWeapon(item)) {
 			for(var i = 0; i < amount; i++) {
 				this.equipment().push(new Equipment(item));
 			}
 		} else if(DataManager.isArmor(item)) {
 			for(var i = 0; i < amount; i++) {
 				this.equipment().push(new Equipment(item));
 			}
 		} else {
 			_Game_Party_gainItem.call(this, item, amount, includeEquip);
 		}
 	};

 	Game_Party.prototype.equipment = function() {
 		if(!this._equipment) {
 			this._equipment = [];
 		}
	    return this._equipment;
	};

	Game_Party.prototype.loseEquipment = function(item) {
		this._equipment.splice(this._equipment.indexOf(item), 1);
	};

 	Game_Party.prototype.weapons = function() { 
 		return this.equipment().filter(function(item) {
	        return item && item.isWeapon();
	    });
 	};

 	Game_Party.prototype.armors = function() { 
 		return this.equipment().filter(function(item) {
	        return item && item.isArmor();
	    });
 	};

 	Game_Actor.prototype.equipment = function() {
	    return this._equipment;
	};

	Game_Actor.prototype.weapons = function() {
		return this._equipment.filter(function(item) {
			return item.type == 'weapon';
		});
	};

	Game_Actor.prototype.armors = function() {
		return this._equipment.filter(function(item) {
			return item.type == 'armor';
		});
	};

	var _Game_Actor_paramBase = Game_Actor.prototype.paramBase;
	Game_Actor.prototype.paramBase = function(paramId) {
	    return _Game_Actor_paramBase.call(this, paramId) + this.equipParams(paramId);
	};

	Game_Actor.prototype.equipParams = function(paramId) {
		var n = 0;
		for(var i = 0; i < this._equipment.length; i++) {
			if(this._equipment[i].object()) {
				if(this._equipment[i].params[paramId] > 0) {
					n += this._equipment[i].params[paramId];
					if(this._equipment[i].type == 'weapon') {
						if(paramId == 2 || paramId == 4) {
							n -= this._equipment[i].object().params[paramId];
						}
					}
				}
			}
		}
		return n;
	};

	Game_Actor.prototype.initEquips = function(equips) {
	    var slots = this.equipSlots();
	    var maxSlots = slots.length;
	    this._equips = [];
	    this._equipment = [];
	    for (var i = 0; i < maxSlots; i++) {
	        this._equipment[i] = new Equipment();
	    }
	    this.releaseUnequippableItems(true);
	    this.refresh();
	};

	Game_Actor.prototype.equip = function(index, item) {
		this._equipment[index] = item;
	};

 	//-----------------------------------------------------------------------------
	// Affix Class
	//
	// The affix class for storing affix data as objects.

	function Affix() {
		this.initialize.apply(this, arguments);
	}

	Affix.prototype.initialize = function(type, value) {
		this._type = type;
		this._value = value;
	};

	Object.defineProperties(Affix.prototype, {
		type: { get: function() { return this._type; }, 
			set: function(value) { this._type = value; }, configurable: true },
	    value: { get: function() { return this._value; }, 
	    	set: function(value) { this._value = value; }, configurable: true },
	    textData: { 
	    	get: function() { 
	    		return { 	'hp'		: '+{n} Life', 
	    					'str'		: '+{n} Strength',
	    					'wis'		: '+{n} Wisdom',
	    					'cun'		: '+{n} Cunning',
	    					'spd'		: '+{n} Luck',
	    					'def'		: '+{n} Defense',
	    					'mdf'		: '+{n} Resistance',
	    					'mrg'		: '+{n} Mana per 5 sec',
	    					'iwp'		: '{n}% increased weapon power',
	    					'prc'		: '+{n}% Pierce Chance',
	    					'prd'		: '+{n}% Pierce Avoidance',
	    					'loh'		: '+{n} Life on Hit',
	    					'bleed'		: "{n}% chance to Bleed on Hit",
	    					's_bleed'	: "{n}% chance to Bleed when Hit",
	    					'burn'		: "{n}% chance to Burn on Hit",
	    					's_burn'	: "{n}% chance to Burn when Hit",
	    					'freeze'	: "{n}% chance to Freeze on Hit",
	    					's_freeze'	: "{n}% chance to Freeze when Hit",
	    					'shock'		: '{n}% chance to Shock on Hit',
	    					's_shock'	: "{n}% chance to Shock when Hit",
	    					'envelop'	: "{n}% chance to Envelop on Hit",
	    					's_envelop'	: "{n}% chance to Envelop when Hit",
	    					'blind'		: "{n}% chance Blind on Hit",
	    					's_blind'	: "{n}% chance to Blind when Hit",
	    					'unstable'	: "{n}% chance to Unstabilize on Hit",
	    					's_unstable': "{n}% chance to Unstabilize when Hit"
	    			};
	    	}, configurable: true 
	    }
	});

	Affix.prototype.text = function() {
		return this.textData[this.type].replace('{n}', this.value);
	};

	Affix.prototype.textEx = function(value) {
		return this.textData[this.type].replace('{n}', value);
	};

	Affix.prototype.compare = function(arry) {
		for(var i = 0; i < arry.length; i++) {
			if(arry[i].type == this.type) {
				return arry[i];
			}
		}

		return null;
	};

 	//-----------------------------------------------------------------------------
	// Equipment Class
	//
	// The base equipment class. 

	function Equipment() {
		this.initialize.apply(this, arguments);
	}

	Equipment.prototype = Object.create(Game_Item.prototype);
	Equipment.prototype.constructor = Equipment;

	Equipment._types = ['hp','str','wis','cun','spd','def','mdf','mrg','iwp','prc','prd'];

	Equipment.prototype.initialize = function(item, rarity) {
		if(item) {
			this.setObject(item);
			rarity = rarity || this.rollRarity();
			this._rarity = Utils.hasTag(item, "Unique") ? 4 : rarity;
			if(Utils.hasTag(item, "Unique")) {
				this._name = item.name;
			} else {
				this.setupAffixes();
				this.createName();
			}
		} else {
			this._rarity = 0;
			this._affixes = [];
		}
	};

	Equipment.prototype.rollRarity = function() {
		var roll = Utils.rand(0,100);
		if(roll < 5) {
			return 3;
		} else if(roll < 20) {
			return 2;
		} else if(roll < 40) {
			return 1;
		}
		return 0;
	};

	Equipment.prototype.setObject = function(item) {
	    if (DataManager.isWeapon(item)) {
	        this._dataClass = 'weapon';
	    } else if (DataManager.isArmor(item)) {
	        this._dataClass = 'armor';
	    } else {
	        this._dataClass = '';
	    }
	    this._itemId = item ? item.id : 0;
	};

	Object.defineProperties(Equipment.prototype, {
		type: { get: function() { return this._dataClass; }, configurable: true },
		name: { get: function() { return this._name; }, configurable: true },
		description: { get: function() { return this.object().description; }, configurable: true },
		etypeId: { get: function() { return this.object().etypeId; }, configurable: true },
		iconIndex: { get: function() { return this.object().iconIndex; }, configurable: true },
		id: { get: function() { return this.object().id; }, configurable: true },
		note: { get: function() { return this.object().note; }, configurable: true },
		price: { get: function() { return this.object().price * (this._rarity + 1); }, configurable: true },
		traits: { get: function() { return this.object().traits; }, configurable: true },
		params: { get: function() { 
			if(this.object()) {
				var arry = this.object().params.slice(0);
				arry[0] += this.affixValue('hp');
				arry[2] += this.affixValue('str');
				arry[3] += this.affixValue('def');
				arry[4] += this.affixValue('wis');
				arry[5] += this.affixValue('mdf');
				arry[6] += this.affixValue('cun');
				arry[7] += this.affixValue('spd');
				return arry;
			} else { return [0,0,0,0,0,0,0,0]; }
		}, configurable: true },
		mrg: { get: function() { return this.affixValue('mrg'); }, configurable: true },
		rarity: { get: function() { return this._rarity; }, configurable: true },
		animationId: { get: function() { return this.object().animationId; }, configurable: true },
		wtypeId: { get: function() { return this.object().wtypeId; }, configurable: true },
		iwp: { get: function() { return this.affixValue('iwp'); }, configurable: true },
		atk: { get: function() { return (this.object().params[2] * (1.0 + (this.iwp / 100))).toFixed(0); }, configurable: true },
		mat: { get: function() { return (this.object().params[4] * (1.0 + (this.iwp / 100))).toFixed(0); }, configurable: true },
		atypeId: { get: function() { return this.object().atypeId; }, configurable: true }
	});

	Equipment.prototype.affixes = function() {
		return this._affixes ? this._affixes : [];
	};

	Equipment.prototype.createName = function() {
		if(this._rarity == 0) {
			this._name = this.object().name;
			return;
		}
		var name = "";
		if(this._rarity == 1) {
			name = RandomNames.affixName(this._affixes[0].type);
			this._name = name.replace('{i}', this.object().name);
			return;
		}
		this._name = RandomNames.itemName(this);
	};

	Equipment.prototype.affixValue = function(type) {
		// Return 0 if no affixes
		if(!this._affixes) {
			return 0;
		}

		// search affixes and return a matching value if possible
		for(var i = 0; i < this._affixes.length; i++) {
			if(this._affixes[i].type == type) {
				return this._affixes[i].value;
			}
		}

		// return 0 when no valid affix was found
		return 0;
	};

	// Set up for magical affixes
	Equipment.prototype.setupAffixes = function() {
		// Set up affix arrays
		this._affixes = [];

		// Return if normal item
		if(this._rarity == 0) return;

		// Add affixes
		var list = [];
		var types = Equipment._types;
		var affixes = this.affixTypes();
		for(var i = 0; i < this._rarity; i++) {
			// Get the random affix type
			var roll = Utils.rand(0,affixes.length-1);
			while(list.indexOf(affixes[roll]) > -1){
				roll = Utils.rand(0,affixes.length-1);
			}

			// Get value range
			var range = [1,1];
			var n = types.indexOf(affixes[roll]);
			if(n == 4) {
				range = [5,10];
			} else if(n == 0) {
				range = [10, 10 + $gameParty.level() * 5];
			} else if(n == 7) {
				range = [1,2];
			} else if(n == 8) {
				range = [10, 10 + $gameParty.level() * 3];
			} else if(n == 5 || n == 6) {
				range = [1, 2 + $gameParty.level()];
			} else if(n >= 9) {
				range = [3, 5];
			} else {
				range = [5, 5 + $gameParty.level() * 2];
			}

			// Roll actual value
			var value = Utils.rand(range[0], range[1]);

			// Add affix
			this._affixes.push(new Affix(affixes[roll], value));

			// Add affix type to list
			list.push(affixes[roll]);
		}
	};

	// Affix types
	Equipment.prototype.affixTypes = function() {
		var item = this.object();
		var list = ['str','wis','cun','prc'];
		if(Utils.hasTag(item, "Jewelry")) {
			list.push('mrg', 'spd');
		} 
		if(DataManager.isArmor(item)) {
			list.push('prd', 'def', 'mdf');
		}
		return list;
	};

	// The rarity color based on rarity
	Equipment.prototype.color = function() {
		switch(this._rarity) {
			case 0: // normal
				return Utils.rgbToCssColor(255, 255, 255);
			case 1: // enchanted
				return Utils.rgbToCssColor(0, 255, 191);
			case 2: // superior
				return Utils.rgbToCssColor(255, 234, 0);
			case 3: // mythical
				return Utils.rgbToCssColor(255, 162, 0);
			case 4: // unique
				return Utils.rgbToCssColor(255, 0, 195);
			default:
				return Utils.rgbToCssColor(255, 255, 255);
		}
	};