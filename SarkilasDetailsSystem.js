//=============================================================================
// SarkilasDetailsSystem.js
//=============================================================================

/*:
 * @plugindesc A details system for glossaries per character.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

//-----------------------------------------------------------------------------
// Glossary data implementation
//-----------------------------------------------------------------------------
Game_Party.prototype.setupGlossary = function() {
	if(!this._glossary) {
		this._glossary = ['Speed','Mana','Toxocity','Energy','Holy Power'];
	}
}

Game_Party.prototype.addGlossary = function(key) {
	this.setupGlossary();
	if(this._glossary.indexOf(key) < 0)
		this._glossary.push(key);
};

Game_Party.prototype.glossary = function() {
	this.setupGlossary();
	return this._glossary.sort();
};

Game_Party.prototype.glossaryCategories = function() {
	return {
		"Combat": ['Speed','Mana','Toxocity','Energy','Holy Power'],
		"Characters": [],
		"Locations": []
	};
};

//-----------------------------------------------------------------------------
// Window_GlossaryCommand
//-----------------------------------------------------------------------------

function Window_GlossaryCommand() {
	this.initialize.apply(this, arguments);
}

Window_GlossaryCommand.prototype = Object.create(Window_Selectable.prototype);
Window_GlossaryCommand.prototype.constructor = Window_GlossaryCommand;

Window_GlossaryCommand.prototype.initialize = function(x, y, width) {
	Window_Selectable.prototype.initialize.call(this, x, y, width, 600);
	this._activeIndex = 0;
	this.refresh();
};

Window_GlossaryCommand.prototype.makeItemList = function() {
    this._data = $gameParty.glossary();
};

Window_GlossaryCommand.prototype.drawItem = function(index) {
    var name = this._data[index];
    var rect = this.itemRect(index);
    rect.width -= this.textPadding();
    this.changeTextColor(this._activeIndex == index ? this.systemColor() : this.normalColor());
    this.drawText(name, rect.x + 4, rect.y, rect.width);
};

Window_GlossaryCommand.prototype.setActive = function() {
	if(this._activeIndex != this.index()) {
		this._activeIndex = this.index();
		this.refresh();
	}
};

Window_GlossaryCommand.prototype.refresh = function() {
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
};

Window_GlossaryCommand.prototype.maxItems = function() {
    return this._data ? this._data.length : 0;
};

Window_GlossaryCommand.prototype.item = function() {
    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
};

//-----------------------------------------------------------------------------
// Window_GlossaryDetails
//-----------------------------------------------------------------------------

function Window_GlossaryDetails() {
	this.initialize.apply(this, arguments);
}

Window_GlossaryDetails.prototype = Object.create(Window_Base.prototype);
Window_GlossaryDetails.prototype.constructor = Window_GlossaryDetails;

Window_GlossaryDetails.prototype.initialize = function(x, y, width) {
	Window_Base.prototype.initialize.call(this, x, y, width, 600);
	this._key = null;
};

Window_GlossaryDetails.prototype.setKey = function(key) {
	if(this._key !== key) {
		this._key = key;
		this.refresh();
	}
};

Window_GlossaryDetails.prototype.refresh = function() {
	this.createContents();

	if(this._key) {
		var request = new XMLHttpRequest();
		request.open("GET", 'data/glossary/' + this._key + '.json', false);
		request.send(null);
		var data = JSON.parse(request.responseText);
		request = new XMLHttpRequest();
		request.open("GET", 'data/glossary/' + data.file, false);
		request.send(null);
		var text = request.responseText;
		this.contents.fontSize = 24;
		this.changeTextColor(this.systemColor());
		this.drawText(data.title, 4, 4, this.contentsWidth());
		this.contents.fontSize = this.standardFontSize();
		var y = 32;
		if(data.subtitle) {
			this.changeTextColor(eval(data.subtitleColor));
			this.drawText(data.subtitle, 4, y, this.contentsWidth());
			y += 28;
		}
		this.changeTextColor(this.normalColor());
		this.drawTextEx(Utils.wrap(text, 45), 4, y);
	}
};

//-----------------------------------------------------------------------------
// Scene_Glossary
//-----------------------------------------------------------------------------

function Scene_Glossary() {
	this.initialize.apply(this, arguments);
}

Scene_Glossary.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Glossary.prototype.constructor = Scene_Glossary;

Scene_Glossary.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize(this);
}

Scene_Glossary.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createWindows();
};

Scene_Glossary.prototype.createWindows = function() {
	this._commandWindow = new Window_GlossaryCommand(240, 60, 400);
	this._commandWindow.setHandler('ok',     this.onCommandOk.bind(this));
    this._commandWindow.setHandler('cancel', this.onCommandCancel.bind(this));
    this._commandWindow.activate();
    this._commandWindow.select(0);
    this._detailsWindow = new Window_GlossaryDetails(640, 60, 400);
    this._detailsWindow.setKey(this._commandWindow.item());
    this.addWindow(this._commandWindow);
    this.addWindow(this._detailsWindow);
};

Scene_Glossary.prototype.onCommandOk = function() {
	this._detailsWindow.setKey(this._commandWindow.item());
	this._commandWindow.setActive();
	this._commandWindow.activate();
};

Scene_Glossary.prototype.onCommandCancel = function() {
	SceneManager.pop();
};