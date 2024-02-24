//=============================================================================
// SarkilasMessageSystem.js
//=============================================================================

/*:
 * @plugindesc Revised message system.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

Window_Message._eventId = -1;

Window_Message.prototype.startMessage = function() {
    this._textState = {};
    this._textState.index = 0;
    this._textState.text = this.convertEscapeCharacters($gameMessage.allText());
    this.createBubbleIcon();
    this.updatePlacement();
    this.newPage(this._textState);
    this.updateBackground();
    this.open();
};

var _Window_Message_update = Window_Message.prototype.update;
Window_Message.prototype.update = function() {
	if(this._bubbleIcon) {
		this._bubbleIcon.visible = (this.visible && Window_Message._eventId > -1) && this.openness >= 255;
		if(this._bubbleIcon.visible) {
			var eventId = Window_Message._eventId;
			var character = eventId == 0 ? $gamePlayer : $gameMap.event(eventId);
			var x = Math.floor(character.screenX() - this.width/2);
			var y = Math.floor(character.screenY() - this.height - 48);
			this.x = x;
			this.y = y;
			this._bubbleIcon.move(x + this.width/2 + 8, y + this.height - 2);
		}
	}
	_Window_Message_update.call(this);
};

Window_Message.prototype.createBubbleIcon = function() {
	if(this._bubbleIcon) return;
	this._bubbleIcon = new Sprite();
	this._bubbleIcon.bitmap = ImageManager.loadSystem('BubbleIcon');
	this._bubbleIcon.visible = this.visible && Window_Message._eventId > -1;
	SceneManager._scene.addChild(this._bubbleIcon);
};

Window_Message.prototype.updatePlacement = function() {
	if(!this._textState) return;
	if(Window_Message._eventId > -1) {
		var eventId = Window_Message._eventId;
		var character = eventId == 0 ? $gamePlayer : $gameMap.event(eventId);
		var w = Math.floor(this.calcTextWidth(this._textState) + 2 + this.standardPadding() * 2);
		var h = Math.floor(this.calcTextHeight(this._textState, true) + this.standardPadding() * 2);
		var x = Math.floor(character.screenX() - w/2);
		var y = Math.floor(character.screenY() - h - 48);
		this.move(x, y, w, h);
		this._bubbleIcon.move(x + w/2 + 8, y + h - 2);
	} else {
		this._positionType = $gameMessage.positionType();
		this.height = this.windowHeight();
		this.width = 800;
		this.x = Graphics.boxWidth / 2 - this.width / 2;
		this.y = this._positionType * (Graphics.boxHeight - this.height) / 2;
		if(this._positionType == 2) {
			this.y -= 60;
		} else if(this._positionType == 0) {
			this.y += 60;
		}
	    this._goldWindow.y = this.y > 0 ? 0 : Graphics.boxHeight - this._goldWindow.height;
	}
};

Window_Base.prototype.calcTextWidth = function(textState, all) {
    var textWidth = 0;
    var lines = textState.text.slice(textState.index).split('\n');
    var maxLines = lines.length;

    for (var i = 0; i < maxLines; i++) {
        textWidth = this.textWidth(lines[i]) > textWidth ? this.textWidth(lines[i]) : textWidth;
    }

    return textWidth;
};
