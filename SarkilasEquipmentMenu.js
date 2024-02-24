//=============================================================================
// SarkilasEquipmentMenu.js
//=============================================================================

/*:
 * @plugindesc Revised equipment menu.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */
//-----------------------------------------------------------------------------
// Window_EquipSlot Modifications

Window_EquipSlot.prototype.drawItem = function(index) {
    if (!this._actor) return;
    var rect = this.itemRectForText(index);
    this.changeTextColor(this.systemColor());
    this.changePaintOpacity(this.isEnabled(index));
    var ww1 = this._nameWidth;
    this.drawText(this.slotName(index), rect.x, rect.y, ww1);
    var ww2 = rect.width - ww1;
    var item = this._actor.equipment()[index];
    if (item.object()) {
      this.drawItemName(item, rect.x + ww1, rect.y, ww2);
    } else {
      this.drawEmptySlot(rect.x + ww1, rect.y, ww2);
    }
    this.changePaintOpacity(true);
};

Window_Base.prototype.drawItemName = function(item, x, y, width, noname) {
    width = width || 312;
    noname = noname || false;
    if (item) {
        var iconBoxWidth = Window_Base._iconWidth + 4;
        this.resetTextColor();
        if(typeof item.color === "function") {
        	this.changeTextColor(item.color());
        }
        var icon = null;
        if(item.object) {
        	icon = Utils.dataValue(item.object(), "Icon");
        } else {
        	icon = Utils.dataValue(item, "Icon");
        }
        if(icon) {
        	this.drawSingleIcon(icon, x + 18, y + 16);
        } else {
        	this.drawIcon(item.iconIndex, x + 2, y + 2);
        }
        if(!noname)
        	this.drawText(item.name, x + iconBoxWidth, y, width - iconBoxWidth);
    }
};

//-----------------------------------------------------------------------------
// Window_EquipItem Modifications

Window_EquipItem.prototype.makeItemList = function() {
	this._data = [];
	for(var i = 0; i < $gameParty.equipment().length; i++) {
		var item = $gameParty.equipment()[i];
		if (this._slotId < 0 || item.etypeId !== this._actor.equipSlots()[this._slotId]) {
	        continue;
	    }
	    if(this._actor.canEquip(item.object())) {
	    	this._data.push(item);
	    }
	}
};

Window_EquipItem.prototype.drawItem = function(index) {
    var rect = this.itemRect(index);
    var numberWidth = this.numberWidth();
    var item = this._data[index];
    if (item) {
        var iconBoxWidth = Window_Base._iconWidth + 4;
        this.resetTextColor();
        if(typeof item.color === "function") {
        	this.changeTextColor(item.color());
        }
        var icon = Utils.dataValue(item.object(), "Icon");
        if(icon) {
        	this.drawSingleIcon(icon, rect.x + 18, rect.y + 16);
        } else {
        	this.drawIcon(item.iconIndex, rect.x + 2, rect.y + 2);
        }
        var name = item.name;
        if(item.rarity > 1 && item.rarity < 4) {
        	name += ", " + item.object().name;
        }
        this.drawText(name, rect.x + iconBoxWidth, rect.y, rect.width - numberWidth - iconBoxWidth);
    }
};

//-----------------------------------------------------------------------------
// Window_EquipTooltip 

function Window_EquipTooltip() {
	this.initialize.apply(this, arguments);
}

Window_EquipTooltip.prototype = Object.create(Window_Base.prototype);
Window_EquipTooltip.prototype.constructor = Window_EquipTooltip;

Window_EquipTooltip.prototype.initialize = function(x, y, width, height) {
	Window_Base.prototype.initialize.call(this, x, y, width, height);
	this._item = null;
	this._compare = null;
	this.refresh();
};

Window_EquipTooltip.prototype.refresh = function() {
	// Create contents
	this.createContents();

	// Return if no item
	if(!this._item) { 
		this.changeTextColor(this.systemColor());
		this.drawText("No equipment", 4, 4, this.contentsWidth());
		return; 
	}

	// Return if no item (object)
	if(!this._item.object()) { 
		this.changeTextColor(this.systemColor());
		this.drawText("No equipment", 4, 4, this.contentsWidth());
		return; 
	}

	// Set up Y-axis coordinate
	var y = 4;

	// Draw comparison text
	if(this._compare) {
		this.changeTextColor(this.systemColor());
		this.drawText("Stat change if equipped", 4, y, this.contentsWidth());
	}

	// Draw item name
	if(!this._compare) {
		this.changeTextColor(this._item.color());
		if(this.width > 300 && this._item.rarity > 1 && this._item.rarity < 4) {
			this.drawText(this._item.name + ", " + this._item.object().name, 4, y, this.contentsWidth());
		} else {
			this.drawText(this._item.name, 4, y, this.contentsWidth());
			if(this._item.rarity > 1 && this._item.rarity < 4) {
				y += 24;
				this.drawText(this._item.object().name, 4, y, this.contentsWidth());
			}
		}
	}
	this.resetTextColor();

	// Draw tooltip dependent on comparison or not
	y += 24;
	var types = Equipment._types;
	if(this._compare) {
		var item_b = this._compare;
		// Weapon comparison first
		if(this._item.type == 'weapon') {
			var min = item_b.atk - this._item.atk;
			var max = item_b.mat - this._item.mat;
			if(min < 0 || max < 0) {
				this.changeTextColor(this.deathColor());
				this.drawText("-" + Math.abs(min) + "-" + Math.abs(max) + " Weapon Power", 4, y, this.contentsWidth());
				y += 24;
			}
			else if(min > 0 || max > 0) {
				this.changeTextColor(this.powerUpColor());
				this.drawText("+" + min + "-" + max + " Weapon Power", 4, y, this.contentsWidth());
				y += 24;
			}
		}

		// Compare all affixes
		var affixes_a = this._item.affixes().slice(0);
		var affixes_b = item_b.affixes().slice(0);
		var list = [];
		for(var j = 0; j < affixes_a.length; j++) {
			// Get affix to compare with
			var affix = affixes_a[j].compare(affixes_b);

			// If a valid comparison affix was found: evaluate
			if(affix) {
				var value = affix.value - affixes_a[j].value;
				if(value == 0) { 
					list.push(affixes_a[j].type);
					continue; 
				}
				this.changeTextColor(value < 0 ? this.deathColor() : this.powerUpColor());
				var text = affix.textEx(value);
				if(value < 0){ 
					text = text.replace("+","");
					if(text.indexOf("-") === -1) { text = "-" + text; }
				} else if(text.indexOf("+") < 0) {
					text = "+" + text; 
				}
				this.drawText(text, 4, y, this.contentsWidth());
				y += 24;
			} else { // compared item does not have a matchin affix
				// so we will consider this affix as a 100% loss
				this.changeTextColor(this.deathColor());
				var txt = affixes_a[j].text().replace("+", "-");
				if(txt.indexOf("-") === -1) { txt = "-" + txt; }
				this.drawText(txt, 4, y, this.contentsWidth());
				y += 24;
			}
			list.push(affixes_a[j].type);
		}
		for(var l = 0; l < affixes_b.length; l++) {
			if(list.indexOf(affixes_b[l].type) > -1){
				continue;
			}
			var label = affixes_b[l].text();
			if(label.indexOf("+") < 0) { label = "+" + label; }
			this.changeTextColor(this.powerUpColor());
			this.drawText(label, 4, y, this.contentsWidth());
			y += 24;
		}
	} else {
		if(this._item.type == 'weapon') {
			this.drawText(this._item.atk + "-" + this._item.mat + " Weapon Power", 4, y, this.contentsWidth());
			y += 24;
		} else if(this._item.type == 'armor') {
			var item = this._item.object();
			if(item.params[3] > 0) {
				this.drawText(item.params[3] + " Defense", 4, y, this.contentsWidth());
				y += 24;
			}
			if(item.params[5] > 0) {
				this.drawText(item.params[5] + " Resistance", 4, y, this.contentsWidth());
				y += 24;
			}
		}
		var affixes = this._item.affixes();
		for(var i = 0; i < affixes.length; i++) {
			this.drawText(affixes[i].text(), 4, y, this.contentsWidth());
			y += 24;
		}
	}
};

Window_EquipTooltip.prototype.setItem = function(item) {
	if(item !== this._item) {
		this._item = item;
		this.refresh();
	}
};

Window_EquipTooltip.prototype.compare = function(item) {
	if(item !== this._compare) {
		this._compare = item;
		this.refresh();
	}
};

//-----------------------------------------------------------------------------
// Scene_Equip Modifications

Scene_Equip.prototype.create = function() {
	Scene_MenuBase.prototype.create.call(this);
	this.createWindows();
	this._actorWindow.activate();
	this._actorWindow.select(0);
	this.refreshActor();
};

Scene_Equip.prototype.createWindows = function() {
	this._actorWindow = new Window_ActorSelect(128, 64, 400);
	this._actorWindow.setHandler('ok',     this.onActorOk.bind(this));
    this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
    this._equipSlot = new Window_EquipSlot(128, 160, 400, 428);
    this._equipSlot.setHandler('ok',     this.onSlotOk.bind(this));
    this._equipSlot.setHandler('cancel', this.onSlotCancel.bind(this));
    this._statList = new Window_ActorStats(816, 64, 400, 524);
    this._tooltipWindow = new Window_EquipTooltip(528, 64, 288, 294);
    this._compareWindow = new Window_EquipTooltip(528, 294, 288, 294);
    this._equipList = new Window_EquipItem(128, 160, 400, 428);
    this._equipList.setHandler('ok',     this.onListOk.bind(this));
    this._equipList.setHandler('cancel', this.onListCancel.bind(this));
    this._equipList.hide();
    this.addWindow(this._actorWindow);
    this.addWindow(this._equipSlot);
    this.addWindow(this._statList);
    this.addWindow(this._tooltipWindow);
    this.addWindow(this._compareWindow);
    this.addWindow(this._equipList);
};

Scene_Equip.prototype.update = function() {
	var actor = this._actorWindow.item();
	if(actor) {
		this.refreshActor();
		if(this._equipList.active) {
			this._tooltipWindow.setItem(this._equipList.item());
			this._compareWindow.setItem(actor.equipment()[this._equipSlot.index()]);
			this._compareWindow.compare(this._equipList.item());
		} else {
			this._tooltipWindow.setItem(actor.equipment()[this._equipSlot.index()]);
			this._compareWindow.setItem(null);
		}
	} else {
		this._tooltipWindow.setItem(null);
		this._compareWindow.setItem(null);
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Equip.prototype.refreshActor = function() {
	var actor = this._actorWindow.item();
	this._equipSlot.setActor(actor);
	this._statList.setActor(actor);
	this._equipList.setActor(actor);
};

Scene_Equip.prototype.onActorOk = function() {
	this._equipSlot.activate();
	this._equipSlot.select(0);
};

Scene_Equip.prototype.onActorCancel = function() {
	SceneManager.pop();
};

Scene_Equip.prototype.onSlotOk = function() {
	this._equipSlot.hide();
	this._equipList.setSlotId(this._equipSlot.index());
	this._equipList.show();
	this._equipList.activate();
	this._equipList.select(0);
};

Scene_Equip.prototype.onSlotCancel = function() {
	this._actorWindow.activate();
};

Scene_Equip.prototype.onListOk = function() {
	SoundManager.playEquip();
	var actor = this._actorWindow.item();
	if(actor.equipment()[this._equipSlot.index()].object()) {
		$gameParty.equipment().push(actor.equipment()[this._equipSlot.index()]);
	}
	actor.equip(this._equipSlot.index(), this._equipList.item());
	$gameParty.loseEquipment(this._equipList.item());
	this._equipList.refresh();
	this._equipList.hide();
	this._equipSlot.refresh();
	this._equipSlot.show();
	this._equipSlot.activate();
	this._statList.refresh();
};

Scene_Equip.prototype.onListCancel = function() {
	this._equipList.hide();
	this._equipSlot.show();
	this._equipSlot.activate();
};