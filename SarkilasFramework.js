//=============================================================================
// SarkilasFramework.js
//=============================================================================

/*:
 * @plugindesc Interface framework tools.
 * @author Sarkilas
 *
 * @help This framework allows creating interface components that provide events on their own.
 */

 // Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Import the ABS
Sarkilas.Imported.push("Framework");

// Check dependencies
if(Sarkilas.Imported.indexOf('Data') < 0) {
	alert("SarkilasFramework is dependent on SarkilasData!\n" +
		"The plugin must be above SarkilasFramework in the plugin manager.");
}

// Framework global variables
var Framework = Framework || {};
Framework.DialogActive = false;

//=============================================================================
// ImageManager
//  * Additional code for loading bitmaps.
//=============================================================================

ImageManager.loadGui = function(filename, hue) {
    return this.loadBitmap('img/gui/', filename, hue, false);
};

//=============================================================================
// Scene_Boot
//  * Additional code for loading framework bitmaps.
//=============================================================================

// Ensure our map is created
Sarkilas.Scene_Boot = Sarkilas.Scene_Boot || {};

Sarkilas.Scene_Boot.isReadyFramework = Scene_Boot.prototype.isReady;
Scene_Boot.prototype.isReady = function() {
	if(!this.loadFramework())
		return false;
    return Sarkilas.Scene_Boot.isReadyFramework.call(this);
};

Scene_Boot.prototype.loadFramework = function() {
	if(!this._frameworkLoaded) {
		ImageManager.loadGui("Button");
		ImageManager.loadGui("Button_Highlight");
		ImageManager.loadGui("Button_Inactive");
		ImageManager.loadGui("Overlay");
		this._frameworkLoaded = true;
		return false;
	}
	return true;
};

//=============================================================================
// Framework_Base
//  * Class for buttons.
//=============================================================================

function Framework_Base() {
	this.initialize.apply(this, arguments);
}

Framework_Base.prototype = Object.create(Sprite.prototype);
Framework_Base.prototype.constructor = Framework_Base;

Framework_Base.prototype.initialize = function() {
	Sprite.prototype.initialize.call(this);
	this._mousedOver = false;
	this._clicked = false;
	this._width = 0;
	this._height = 0;
	this._active = true;
};

Framework_Base.prototype.bindEvent = function(f) {
	this._event = f;
};

Framework_Base.prototype.isClickable = function() {
	return true;
};

Framework_Base.prototype.canMouseOver = function() {
	return true;
};

Framework_Base.prototype.componentWidth = function() {
	return this._width;
};

Framework_Base.prototype.componentHeight = function() {
	return this._height;
};

Framework_Base.prototype.snap = function() {
	this.x = this.x.clamp(0, Graphics.boxWidth - this._width);
	this.y = this.y.clamp(0, Graphics.boxHeight - this._height);
};

Framework_Base.prototype.toCenter = function() {
	this.x -= this.componentWidth() / 2;
	this.y -= this.componentHeight() / 2;
};

Framework_Base.prototype.update = function() {
	Sprite.prototype.update.call(this);
	this._clicked = false;
	this.refresh();
	this.updateClickEvent();
	this.updateFade();
};

Framework_Base.prototype.updateFade = function() {
	if(this._fade) {
		switch(this._fade) {
			case 1: // Fade in
				if(this.alpha < 0.90)
					this.alpha += 0.15;
				else
					this._fade = 0;
				break;
			case 2: // Fade out
				if(this.alpha > 0) 
					this.alpha -= 0.15;
				else
					this._fade = 0;
				break;
		}
	}
};

Framework_Base.prototype.updateClickEvent = function() {
	if(this.isMousedOver() && TouchInput.isTriggered() &&
		this.isClickable()) {
		this._clicked = true;
		if(this._event)
			this._event.call(this.parent);
	}
};

Framework_Base.prototype.addComponent = function(component) {
	this.addChild(component);
};

Framework_Base.prototype.isMousedOver = function() {
	if(!this.bitmap || !this.canMouseOver()) return false;

	var x = TouchInput.x;
	var y = TouchInput.y;
	var tx = this.x;
	var ty = this.y;

	if(this.parent instanceof Framework_Dialog) {
		if(this.parent.alpha < 0.9)
			return false;
		tx += this.parent.x;
		ty += this.parent.y;
	}

	var over = (x >= tx + 2 && x <= tx + this.bitmap.width - 2 &&
		y >= ty + 2 && y <= ty + this.bitmap.height - 2);

	if(over != this._mousedOver && over)
		SoundManager.playCursor();

	this._mousedOver = over;

	return this._mousedOver;
};

Framework_Base.prototype.isClicked = function() {
	var clicked = this._clicked;
	this._clicked = false;
	return clicked;
};

Framework_Base.prototype.requestFadeIn = function(force) {
	if(!this._fade || force)
		this._fade = 1;
};

Framework_Base.prototype.requestFadeOut = function(force) {
	if(!this._fade || force)
		this._fade = 2;
};

Framework_Base.prototype.isRequestingFadeOut = function() {
	return this._fade === 2;
};

Framework_Base.prototype.isRequestingFadeIn = function() {
	return this._fade === 1;
};

Framework_Base.prototype.isClickable = function() {
	return this.alpha > 0 && (!Framework.DialogActive || 
		(this.parent instanceof Framework_Dialog));
};

Framework_Base.prototype.canMouseOver = function() {
	return this.alpha > 0 && (!Framework.DialogActive || 
		(this.parent instanceof Framework_Dialog));
};

Framework_Base.prototype.setActive = function(state) {
	this._active = state;
};

Framework_Base.prototype.isActive = function() {
	return this._active;
};

//=============================================================================
// Framework_Button
//  * Class for buttons.
//=============================================================================

function Framework_Button() {
	this.initialize.apply(this, arguments);
}

Framework_Button.prototype = Object.create(Framework_Base.prototype);
Framework_Button.prototype.constructor = Framework_Button;

Framework_Button.prototype.initialize = function(x, y, width, text, leftAlign) {
	Framework_Base.prototype.initialize.call(this);
	this._leftAlign = leftAlign || false;
	this.x = x;
	this.y = y;
	this._width = Math.floor(width / 4) * 4;
	this._text = text;
	this.alpha = 0;
	this._fade = 0;
	this.refresh();
};

Framework_Button.prototype.refresh = function() {
	// Get bitmaps
	var button = ImageManager.loadGui("Button");
	var highlight = ImageManager.loadGui("Button_Highlight");
	var inactive = ImageManager.loadGui("Button_Inactive");
	var overlay = ImageManager.loadGui("Overlay");

	// Create core bitmap
	var bitmap = new Bitmap(this._width + 2, highlight.height + 4);

	// Draw base button
	bitmap.blt(this.isActive() ? (this.isMousedOver() ? highlight : button) : inactive, 0, 0, 
		button.width, button.height, 1, 1, this._width, button.height);

	// Draw borders
	var borderColor = this.isActive() ? '#004157' : '#444444';
	bitmap.fillRect(0, 0, this._width + 2, 1, borderColor);
	bitmap.fillRect(0, 1, 1, button.height, borderColor);
	bitmap.fillRect(this._width + 1, 1, 1, button.height, borderColor);
	bitmap.fillRect(0, button.height + 1, this._width + 2, 1, borderColor);

	// Draw overlay
	for(var x = 0; x < this._width / 4; x++) {
		for(var y = 0; y < button.height / 4; y++) {
			bitmap.blt(overlay, 0, 0, overlay.width, overlay.height, 1 + x * 4, 1 + y * 4);
		}
	}

	// Draw the text
	bitmap.textColor = this.isMousedOver() ? '#FFA200' : '#B0E5FF';
	bitmap.outlineColor = this.isMousedOver() ? '#AD6500' : '#0082AD';
	bitmap.outlineWidth = 2;
	bitmap.fontSize = 12;
	if(this._leftAlign) {
		bitmap.drawText(this._text, 8, 4, bitmap.width, 24);
	} else {
		bitmap.drawText(this._text, bitmap.width / 2 - bitmap.measureTextWidth(this._text) / 2, 
			bitmap.height / 2 - 12, bitmap.width, 24);
	}

	// Set bitmap
	this.bitmap = bitmap;
};

Framework_Button.prototype.componentHeight = function() {
	return this.bitmap.height - 2;
};

Framework_Button.prototype.canMouseOver = function() {
	if(!this.isActive()) return false;
	return Framework_Base.prototype.canMouseOver.call(this);
};

//=============================================================================
// Framework_Container
//  * Class for any container.
//=============================================================================

function Framework_Container() {
	this.initialize.apply(this, arguments);
}

Framework_Container.prototype = Object.create(Framework_Base.prototype);
Framework_Container.prototype.constructor = Framework_Container;

Framework_Container.prototype.initialize = function(x, y, width, height, self) {
	Framework_Base.prototype.initialize.call(this);
	self = self || false;
	this.x = x;
	this.y = y;
	this._width = Math.floor(width / 4) * 4;
	this._height = Math.floor(height / 4) * 4;
	this.alpha = 0;
	this._fade = 0;
	this._overlayBitmap = null;
	this._self = self;
	this._active = false;
};

Framework_Container.prototype.canMouseOver = function() {
	return !this._self;
};

Framework_Container.prototype.refresh = function() {
	// Get bitmaps
	var button = ImageManager.loadGui("Button");
	var highlight = ImageManager.loadGui("Button_Highlight");
	var overlay = ImageManager.loadGui("Overlay");

	// Create core bitmap
	var bitmap = new Bitmap(this._width + 2, this._height + 2);

	// Draw base button
	bitmap.blt((this.isMousedOver() || this.isActive()) ? highlight : button, 0, 0, 
		button.width, button.height, 1, 1, this._width, this._height);

	// Draw borders
	var borderColor = '#004157';
	bitmap.fillRect(0, 0, this._width + 2, 1, borderColor);
	bitmap.fillRect(0, 1, 1, this._height, borderColor);
	bitmap.fillRect(this._width + 1, 1, 1, this._height, borderColor);
	bitmap.fillRect(0, this._height + 1, this._width + 2, 1, borderColor);

	// Draw overlay
	if(!this._overlayBitmap) {
		this._overlayBitmap = new Bitmap(this._width, this._height);
		for(var x = 0; x < this._width / 4; x++) {
			for(var y = 0; y < this._height / 4; y++) {
				this._overlayBitmap.blt(overlay, 0, 0, overlay.width, overlay.height, 1 + x * 4, 1 + y * 4);
			}
		}
	}
	bitmap.blt(this._overlayBitmap, 0, 0, 
		this._overlayBitmap.width, this._overlayBitmap.height, 1, 1);

	// Set bitmap if self
	if(this._self)
		this.bitmap = bitmap;

	// Return bitmap
	return bitmap;
};

Framework_Container.fromObject = function(object, startAlpha) {
	startAlpha = startAlpha || 0.9;
	var container = new Framework_Container(object.x, object.y, object.width, object.height, true);
	container.alpha = startAlpha;
	return container;
};

//=============================================================================
// Framework_Tooltip
//  * Class for tooltip containers.
//=============================================================================

function Framework_Tooltip() {
	this.initialize.apply(this, arguments);
}

Framework_Tooltip.prototype = Object.create(Framework_Container.prototype);
Framework_Tooltip.prototype.constructor = Framework_Tooltip;

Framework_Tooltip.prototype.initialize = function(name, text) {
	Framework_Container.prototype.initialize.call(this, 0, 0, 0, 0);
	this._name = name;
	this._text = text;
	this.alpha = 0;
	this.refresh();
};

Framework_Tooltip.prototype.canMouseOver = function() {
	return false;
};

Framework_Tooltip.prototype.setData = function(name, text) {
	if(this._name != name || this._text != text) {
		this._name = name;
		this._text = text;
		this.refresh();
	}
};

Framework_Tooltip.prototype.refresh = function() {
	// Ignore if no values
	if(!this._name || !this._text) return;

	// Get width and height
	this._width = this.getWidth();
	this._height = this.getHeight();

	// Get container bitmap
	var bitmap = Framework_Container.prototype.refresh.call(this);

	// Set up font settings
	bitmap.textColor = '#FFA200';
	bitmap.outlineColor = '#AD6500';
	bitmap.outlineWidth = 1;
	bitmap.fontSize = 14;

	// Draw tooltip name
	bitmap.drawText(this._name, 8, 4, this._width, 32);

	// Draw text
	bitmap.textColor = 'white';
    bitmap.outlineColor = '#666666';
    var lines = this._text.split("\n");
    for(var i = 0; i < lines.length; i++) {
    	bitmap.drawText(lines[i], 8, 24 + 24 * i, this._width, 32);
    }

    // Set bitmap
    this.bitmap = bitmap;
};

Framework_Tooltip.prototype.getWidth = function() {
	var bitmap = new Bitmap(640, 480);
	var n = bitmap.measureTextWidth(name);
	var lines = this._text.split("\n");
	for(var i = 0; i < lines.length; i++) {
		if(bitmap.measureTextWidth(lines[i]) > n)
			n = bitmap.measureTextWidth(lines[i]);
	}
	return Math.round(n + 8);
};

Framework_Tooltip.prototype.getHeight = function() {
	var lines = this._text.split("\n");
	return 32 + lines.length * 24;
};

//=============================================================================
// Framework_File
//  * Class for file containers.
//=============================================================================

function Framework_File() {
	this.initialize.apply(this, arguments);
}

Framework_File.prototype = Object.create(Framework_Container.prototype);
Framework_File.prototype.constructor = Framework_File;

Framework_File.prototype.initialize = function(x, y, width, height, fileIndex) {
	Framework_Container.prototype.initialize.call(this, x, y, width, height);
	this._index = fileIndex + 1;
	this._active = false;
	this.refresh();
};

Framework_File.prototype.refresh = function() {
	// Draw container
	var bitmap = Framework_Container.prototype.refresh.call(this);

	// Draw file number
	bitmap.textColor = '#FFA200';
	bitmap.outlineColor = '#AD6500';
	bitmap.outlineWidth = 1;
	bitmap.fontSize = 14;
	bitmap.drawText("File " + this._index, 8, 0, this._width, 32);

	// Draw file information
	var id = this._index;
    var valid = DataManager.isThisGameFile(id);
    var info = DataManager.loadSavefileInfo(id);
    bitmap.textColor = 'white';
    bitmap.outlineColor = '#666666';
    if(info) {
    	bitmap.drawText(info.act, 8, 20, this._width, 32);
    	if (info.characters) {
	        for (var i = 0; i < info.characters.length; i++) {
	            var data = info.characters[i];
	            this.drawCharacter(bitmap, data[0], 26 + i * 32, 48 + 48);
	        }
	    }
    	bitmap.drawText("Play time", 8, 96, this._width, 32);
    	bitmap.drawText(info.playtime, -8, 96, this._width, 32, 'right');
    }

	// Set bitmap
	this.bitmap = bitmap;
};

Framework_File.prototype.drawCharacter = function(bitmap, characterName, x, y) {
    var source = ImageManager.loadCharacter(characterName);
    var pw = source.width / 4;
    var ph = source.height / 4;
    bitmap.blt(source, 0, 0, pw, ph, x - pw / 2, y - ph);
};

//=============================================================================
// Framework_Stage
//  * Component class for displaying stage containers.
//=============================================================================

function Framework_Stage() {
	this.initialize.apply(this, arguments);
}

Framework_Stage.prototype = Object.create(Framework_Container.prototype);
Framework_Stage.prototype.constructor = Framework_Stage;

Framework_Stage.prototype.initialize = function(x, y, width, height, stageId) {
	Framework_Container.prototype.initialize.call(this, x, y, width, height);
	this._data = Utils.loadStageData(stageId);
	this._active = false;
	this.refresh();
};

Framework_Stage.prototype.refresh = function() {
	// Draw container
	var bitmap = Framework_Container.prototype.refresh.call(this);

	// Draw file number
	bitmap.textColor = '#FFA200';
	bitmap.outlineColor = '#AD6500';
	bitmap.outlineWidth = 1;
	bitmap.fontSize = 14;
	bitmap.drawText(this._data ? this._data.name : "Invalid data", 8, 0, this._width, 32);

	// Draw stage description
    bitmap.textColor = 'white';
    bitmap.outlineColor = '#666666';
    if(this._data) {
    	var text = Utils.wrap(this._data.description, 100);
    	text = text.split('\n');
    	for(var i = 0; i < text.length; i++) {
    		bitmap.drawText(text[i], 8, 24 + 18 * i, this._width, 24);
    	}
    }

	// Set bitmap
	this.bitmap = bitmap;
};

//=============================================================================
// Framework_Dialog
//  * Component class for displaying dialogs.
//=============================================================================

function Framework_Dialog() {
	this.initialize.apply(this, arguments);
}

Framework_Dialog.prototype = Object.create(Framework_Base.prototype);
Framework_Dialog.prototype.constructor = Framework_Dialog;

Framework_Dialog.prototype.initialize = function(x, y, width, height, text) {
	Framework_Base.prototype.initialize.call(this);
	this.x = x;
	this.y = y;
	this._width = width;
	this._height = height;
	this._buttons = [];
	this._text = text;
	this._lastButtonX = 0;
	this.alpha = 0;
	this.refresh();
};

Framework_Dialog.prototype.setText = function(text) {
	this._text = text;
};

Framework_Dialog.prototype.refresh = function() {
	// Get bitmaps
	var button = ImageManager.loadGui("Button");
	var highlight = ImageManager.loadGui("Button_Highlight");
	var overlay = ImageManager.loadGui("Overlay");

	// Create core bitmap
	var bitmap = new Bitmap(this._width + 2, this._height + 2);

	// Draw window background
	bitmap.fillRect(1, 1, this._width, this._height, '#417f9b');

	// Draw borders
	var borderColor = '#004157';
	bitmap.fillRect(0, 0, this._width + 2, 1, borderColor);
	bitmap.fillRect(0, 1, 1, this._height, borderColor);
	bitmap.fillRect(this._width + 1, 1, 1, this._height, borderColor);
	bitmap.fillRect(0, this._height + 1, this._width + 2, 1, borderColor);

	// Draw the text
	bitmap.textColor = '#B0E5FF';
	bitmap.outlineColor = '#0082AD';
	bitmap.outlineWidth = 4;
	bitmap.fontSize = 12;
	var lines = this._text.split("\n");
	for(var i = 0; i < lines.length; i++) {
		bitmap.drawText(lines[i], 8, i * 18, bitmap.width, 24);
	}

	// Set bitmap
	this.bitmap = bitmap;
};

Framework_Dialog.prototype.addComponent = function(component) {
	if(component instanceof Framework_Button)
		this._buttons.push(component);
	component.alpha = 0.9;
	Framework_Base.prototype.addComponent.call(this, component);
};

Framework_Dialog.prototype.addButton = function(width, text) {
	var button = new Framework_Button(this.componentWidth() - 8 - (width + 
		this._lastButtonX), this.componentHeight() - 8 - 30, width, text);
	this._lastButtonX += width + 4;
	button.alpha = 0.9;
	this._buttons.push(button);
	this.addChild(button);
};

Framework_Dialog.prototype.bindEvent = function(index, f) {
	if(this._buttons[index])
		this._buttons[index].bindEvent(f);
};

Framework_Dialog.prototype.isClicked = function(index) {
	return this._buttons[index] ? this._buttons[index].isClicked() : false;
};

Framework_Dialog.prototype.isClickable = function() {
	return false;
};

Framework_Dialog.prototype.canMouseOver = function() {
	return false;
};

//=============================================================================
// Window_Options
//  * Remove always dash and remember command from options.
//=============================================================================

Window_Options.prototype.addGeneralOptions = function() { }

//=============================================================================
// Scene_Title
//  * Title overhaul.
//=============================================================================

Scene_Title.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    DataManager.loadAllSavefileImages();
    this.createBackground();
    this.createFiles();
    this.createButtons();
    this.createDialogs();
    this._activeFile = -1;
};

Scene_Title.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    SceneManager.clearStack();
    this.centerSprite(this._backSprite);
    this.playTitleMusic();
    if(!SceneManager.isPreviousScene(Scene_Options))
    	this.startFadeIn(this.fadeSpeed(), false);
};

Scene_Title.prototype.createBackground = function() {
	this._backSprite = new Sprite(ImageManager.loadTitle1('Title'));
	this.addChild(this._backSprite);
	this._textSprite = new Sprite(ImageManager.loadGui('Title'));
	this._textSprite.x = Graphics.boxWidth / 2 - 277;
	this.addChild(this._textSprite);
};

Scene_Title.prototype.createFiles = function() {
	this._files = [];
	for(var i = 0; i < 4; i++) {
		var container = new Framework_File(128 + i * 256, 256, 244, 128, i);
		this._files.push(container);
		container.requestFadeIn();
		this.addChild(container);
	}
};

Scene_Title.prototype.createButtons = function() {
	// Create play, copy and erase buttons
	this._playButton = new Framework_Button(Graphics.boxWidth / 2 - 50 - 104, Graphics.boxHeight - 256, 100, "Play");
	this.addChild(this._playButton);
	this._copyButton = new Framework_Button(Graphics.boxWidth / 2 - 50, Graphics.boxHeight - 256, 100, "Copy");
	this.addChild(this._copyButton);
	this._eraseButton = new Framework_Button(Graphics.boxWidth / 2 + 54, Graphics.boxHeight - 256, 100, "Erase");
	this.addChild(this._eraseButton);

	// Create options button
	this._optionsButton = new Framework_Button(Graphics.boxWidth / 2 - 50, Graphics.boxHeight - 162, 100, "Options");
	this._optionsButton.requestFadeIn();
	this.addChild(this._optionsButton);

	// Create exit button
	this._exitButton = new Framework_Button(Graphics.boxWidth / 2 - 50, Graphics.boxHeight - 128, 100, "Exit");
	this._exitButton.requestFadeIn();
	this.addChild(this._exitButton);
};

Scene_Title.prototype.createDialogs = function() {
	// Create copy failure dialog
	this._copyFail = new Framework_Dialog(Graphics.boxWidth / 2, 
		Graphics.boxHeight / 2, 256, 96, "There are no empty files.\nPlease erase one to copy.");
	this._copyFail.addButton(64, "OK");
	this._copyFail.toCenter();
	this.addChild(this._copyFail);

	// Create erase confirmation dialog
	this._eraseDialog = new Framework_Dialog(Graphics.boxWidth / 2, 
		Graphics.boxHeight / 2, 256, 96, "Are you sure you wish to erase this file?\nThis action cannot be undone.");
	this._eraseDialog.addButton(64, "No");
	this._eraseDialog.addButton(64, "Yes");
	this._eraseDialog.toCenter();
	this.addChild(this._eraseDialog);
};

Scene_Title.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    for(var i = 0; i < this._files.length; i++) {
		if(i === this._activeFile) continue;
		if(this._files[i].isClicked()) {
			SoundManager.playOk();
			this._activeFile = i;
			this.activateFile(i);
			break;
		}
	}
    this.updateFiles();
    Framework.DialogActive = this.dialogActive();
    if(this.dialogActive()) {
    	if(this._eraseDialog.alpha > 0) {
    		if(this._eraseDialog.isClicked(0)) {
    			SoundManager.playOk();
    			this._eraseDialog.requestFadeOut();
    		}
    		if(this._eraseDialog.isClicked(1)) {
    			SoundManager.playOk();
    			this.eraseFile();
    			this._eraseDialog.requestFadeOut();
    		}
    	}
    	if(this._copyFail.alpha > 0) {
    		if(this._copyFail.isClicked(0)) {
    			SoundManager.playOk();
    			this._copyFail.requestFadeOut();
    		}
    	}
    	return;
    }
    if(this._playButton.isClicked()) {
    	var info = DataManager.loadSavefileInfo(this._activeFile + 1);
    	if(info) {
    		if(DataManager.loadGame(this._activeFile + 1)) {
    			this.onLoadSuccess();
    		} else {
    			SoundManager.playBuzzer();
    		}
    	} else {
    		DataManager.setupNewGame();
    		$gameSystem.newGame(this._activeFile + 1);
    		DataManager.saveGame(this._activeFile + 1);
    		this.onLoadSuccess();
    	}
    }
    if(this._copyButton.isClicked()) {
		var copied = false;
		SoundManager.playOk();
    	for(var i = 1; i <= 4; i++) {
    		var file = DataManager.loadSavefileInfo(i);
    		if(file) continue;
    		if(DataManager.loadGame(this._activeFile + 1)) {
    			Graphics.frameCount = $gameSystem._framesOnSave;
    			$gameSystem.saveFile = i;
    			DataManager.saveGame(i);
    		}
	    	copied = true;
	    	break;
    	}
    	if(!copied) {
    		this._copyFail.requestFadeIn();
    	}
    }
    if(this._eraseButton.isClicked()) {
    	var info = DataManager.loadSavefileInfo(this._activeFile + 1);
    	if(info) {
	    	SoundManager.playOk();
	    	this._eraseDialog.requestFadeIn();
	    } else {
	    	SoundManager.playBuzzer();
	    }
    }
    if(this._optionsButton.isClicked()) {
    	SoundManager.playOk();
    	SceneManager.push(Scene_Options);
    	SceneManager.snapForBackground();
    }
    if(this._exitButton.isClicked()) {
    	SoundManager.playOk();
    	window.close();
    }
};

Scene_Title.prototype.eraseFile = function() {
	// Return if no file is selected
	if(this._actveFile < 0) return;
	
	// Erase the file
	Utils.deleteFile("save/file" + (this._activeFile + 1) + ".rpgsave");

	// Set active file to -1
	this._activeFile = -1;
	this.activateFile(-1);
};

Scene_Title.prototype.isBusy = function() {
	return Scene_Base.prototype.isBusy.call(this);
};

Scene_Title.prototype.onLoadSuccess = function() {
    SoundManager.playLoad();
    this.startFadeOut(this.slowFadeSpeed());
    SceneManager.goto(Scene_Hub);
};

Scene_Title.prototype.dialogActive = function() {
	return (this._copyFail.alpha > 0 || this._eraseDialog.alpha > 0);
};

Scene_Title.prototype.activateFile = function(fileIndex) {
	for(var i = 0; i < this._files.length; i++) 
		this._files[i].setActive(i === fileIndex);
	var info = DataManager.loadSavefileInfo(fileIndex + 1);
	this._copyButton.setActive(!!info);
	this._eraseButton.setActive(!!info);
};

Scene_Title.prototype.updateFiles = function() {
	for(var i = 0; i < this._files.length; i++) {
		if(i === this._activeFile) continue;
		if(this._files[i].y > 256)
			this._files[i].y -= 1;
	}
	if(this._activeFile >= 0) {
		this._playButton.requestFadeIn();
		this._copyButton.requestFadeIn();
		this._eraseButton.requestFadeIn();
	} else {
		this._playButton.requestFadeOut();
		this._copyButton.requestFadeOut();
		this._eraseButton.requestFadeOut();
	}
	
	if(this._activeFile < 0) return;
	var file = this._files[this._activeFile];
	if(file.y < 288)
		file.y += 1;
};

//=============================================================================
// Scene_Hub
//  * Game hub when not in the game world.
//=============================================================================

function Scene_Hub() {
	this.initialize.apply(this, arguments);
}

Scene_Hub.prototype = Object.create(Scene_Base.prototype);
Scene_Hub.prototype.constructor = Scene_Hub;

Scene_Hub.prototype.initialize = function() {
	Scene_Base.prototype.initialize.call(this);
	this._selectedStage = 0;
};

Scene_Hub.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createButtons();
	this.createStageList();
	this.createDialogs();
	Scene_Title.prototype.playTitleMusic.call(this);
};

Scene_Hub.prototype.start = function() {
	Scene_Base.prototype.start.call(this);
	SceneManager.clearStack();
	if (this.needsFadeIn()) {
        this.startFadeIn(this.fadeSpeed(), false);
    }
};

Scene_Hub.prototype.update = function() {
	Scene_Base.prototype.update.call(this);
	Framework.DialogActive = this.dialogActive();
	if(this.dialogActive()) {
		if(this._dialogs.difficulty.isActive()) {
			if(TouchInput.isCancelled() || Input.isTriggered('escape')) {
				SoundManager.playCancel();
				this._dialogs.difficulty.requestFadeOut();
			}
			for(var i = 0; i < 3; i++) {
				if(this._dialogs.difficulty.isClicked(i)) {
					$gameSystem.difficulty = i;
					this.startStage();
				}
			}
		}
		return;
	}
	this._buttons.play.setActive(this._selectedStage > 0);
	this.updateButtons();
	this.updateStages();
};

Scene_Hub.prototype.updateButtons = function() {
	if(this._buttons.play.isClicked()) {
		var data = Utils.loadStageData(this._selectedStage);
		if(data) {
			SoundManager.playOk();
			this._mercilessButton.setActive($gameSystem.hasMerciless(this._selectedStage));
			this._dialogs.difficulty.requestFadeIn();
		} else {
			SoundManager.playBuzzer();
			console.log("The stage JSON data is invalid or non-existent.");
		}
	}

	if(this._buttons.skills.isClicked()) {
		SoundManager.playOk();
		SceneManager.push(Scene_Skill);
		SceneManager.snapForBackground();
	}

	if(this._buttons.gear.isClicked()) {
		SoundManager.playOk();
		SceneManager.push(Scene_Equip);
		SceneManager.snapForBackground();
	}

	if(this._buttons.infuse.isClicked()) {
		SoundManager.playOk();
		SceneManager.push(Scene_Infuse);
		SceneManager.snapForBackground();
	}

	if(this._buttons.stats.isClicked()) {
		SoundManager.playOk();
		SceneManager.push(Scene_Level);
		SceneManager.snapForBackground();
	}

	if(this._buttons.options.isClicked()) {
    	SoundManager.playOk();
    	SceneManager.push(Scene_Options);
    	SceneManager.snapForBackground();
    }

	if(this._buttons.quit.isClicked()) {
		SoundManager.playOk();
		SceneManager.goto(Scene_Title);
	}
};

Scene_Hub.prototype.dialogActive = function() {
	// Check all dialogs
	var keys = Utils.sortedKeys(this._dialogs);
	for(var i = 0; i < keys.length; i++) {
		if(this._dialogs[keys[i]].alpha > 0)
			return true;
	}
	return false;
};

Scene_Hub.prototype.startStage = function() {
	var data = Utils.loadStageData(this._selectedStage);
	SoundManager.playSave();
	$gameParty.setActor(data.actor);
	$gamePlayer.reserveTransfer(data.map_id, data.x, data.y);
	$gamePlayer.setTransparent(false);
	this.fadeOutAll();
	this.resetContent();
	SceneManager.goto(Scene_Map);
};

Scene_Hub.prototype.resetContent = function() {
	$gameSwitches = new Game_Switches();
	$gameVariables = new Game_Variables();
	$gameSelfSwitches = new Game_SelfSwitches();
};

Scene_Hub.prototype.updateStages = function() {
	for(var i = 0; i < this._stages.length; i++) {
		if(this._stages[i].isClicked()) {
			SoundManager.playOk();
			this._selectedStage = $gameSystem.unlockedStages()[i];
			this.activateStage(i);
		}
	}
};

Scene_Hub.prototype.createBackground = function() {
	this._backSprite = new Sprite(ImageManager.loadTitle1('Title'));
	this.addChild(this._backSprite);
	this._textSprite = new Sprite(ImageManager.loadGui('Title'));
	this._textSprite.x = Graphics.boxWidth / 2 - 277;
	this.addChild(this._textSprite);
};

Scene_Hub.prototype.activateStage = function(stageIndex) {
	for(var i = 0; i < this._stages.length; i++) {
		this._stages[i].setActive(i == stageIndex);
	}
};

Scene_Hub.prototype.needsFadeIn = function() {
    return SceneManager.isPreviousScene(Scene_Title);
};

Scene_Hub.prototype.createButtons = function() {
	// Create button map
	this._buttons = {};

	// Create buttons
	this._buttons.play = new Framework_Button(128, 128, 256, "Play", true);
	this._buttons.inventory = new Framework_Button(128, 160, 256, "Inventory", true);
	this._buttons.skills = new Framework_Button(128, 192, 256, "Skills", true);
	this._buttons.gear = new Framework_Button(128, 224, 256, "Gear", true);
	this._buttons.infuse = new Framework_Button(128, 256, 256, "Infuse", true);
	this._buttons.stats = new Framework_Button(128, 288, 256, "Stats", true);
	this._buttons.options = new Framework_Button(128, 320, 256, "Options", true);
	this._buttons.quit = new Framework_Button(128, 352, 256, "Quit", true);

	// Add all buttons
	var keys = Utils.sortedKeys(this._buttons);
	for(var i = 0; i < keys.length; i++) {
		if(this.needsFadeIn())
			this._buttons[keys[i]].requestFadeIn();
		else
			this._buttons[keys[i]].alpha = 0.9;
		this.addChild(this._buttons[keys[i]]);
	}
};

Scene_Hub.prototype.createDialogs = function() {
	// Create dialog map
	this._dialogs = {};

	// Create difficulty dialog
	this._dialogs.difficulty = new Framework_Dialog(Graphics.boxWidth / 2, 
		Graphics.boxHeight / 2, 200, 128, "Select difficulty");
	this._dialogs.difficulty.toCenter();

	// Add buttons to difficulty dialog
	this._dialogs.difficulty.addComponent(new Framework_Button(8, 28, 184, "Normal"));
	this._dialogs.difficulty.addComponent(new Framework_Button(8, 60, 184, "Hard"));
	this._mercilessButton = new Framework_Button(8, 92, 184, "Merciless");
	this._dialogs.difficulty.addComponent(this._mercilessButton);


	// Add all dialogs
	var keys = Utils.sortedKeys(this._dialogs);
	for(var i = 0; i < keys.length; i++) {
		this.addChild(this._dialogs[keys[i]]);
	}
};

Scene_Hub.prototype.createStageList = function() {
	// Create stage array
	this._stages = [];

	// Add all stages accordingly
	for(var i = 0; i < $gameSystem.unlockedStages().length; i++) {
		var container = new Framework_Stage(390, 128, 758, 96, $gameSystem.unlockedStages()[i]);
		if(this.needsFadeIn())
			container.requestFadeIn();
		else
			container.alpha = 0.9;
		this._stages.push(container);
		this.addChild(container);
	}
};