//=============================================================================
// SarkilasData.js
//=============================================================================

/*:
 * @plugindesc Data manager additions.
 * @author Sarkilas
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];

// Import the ABS
Sarkilas.Imported.push("Data");

//=============================================================================
// DataManager
//  * Additional code for save file management.
//=============================================================================

DataManager.makeSavefileInfo = function() {
    var info = {};
    info.globalId   = this._globalId;
    info.title      = $dataSystem.gameTitle;
    info.characters = $gameParty.charactersForSavefile();
    info.faces      = $gameParty.facesForSavefile();
    info.playtime   = $gameSystem.playtimeText();
    info.timestamp  = Date.now();
    info.act        = $gameSystem.act;
    info.difficulty = $gameSystem.difficultyText();
    return info;
};

//=============================================================================
// Game_Party
//  * Additional party handling code.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_Party = Sarkilas.Game_Party || {};

// Set actor
Game_Party.prototype.setActor = function(actorId) {
	// Remove all actors
	this._actors = [];

	// Add selected actor
	this.addActor(actorId);
};

//=============================================================================
// Game_System
//  * Additional code for additional game data.
//=============================================================================

// Ensure our map is created
Sarkilas.Game_System = Sarkilas.Game_System || {};

// Define act property
Object.defineProperty(Game_System.prototype, 'act', {
    get: function() {
        return this._act;
    },
    set: function(value) {
        this._act = value;
    },
    configurable: true
});

// Define difficulty property
Object.defineProperty(Game_System.prototype, 'difficulty', {
    get: function() {
        return this._difficulty;
    },
    set: function(value) {
        this._difficulty = value;
    },
    configurable: true
});

// Define save file property
Object.defineProperty(Game_System.prototype, 'saveFile', {
    get: function() {
        return this._saveFile;
    },
    set: function(value) {
    	this._saveFile = value;
    },
    configurable: true
});

// System initialization
Sarkilas.Game_System.initializeData = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
	Sarkilas.Game_System.initializeData.call(this);
	this._act = "Prologue";
	this._gameId = 0;
	this._saveFile = 0;
	this._difficulty = 0;
	this._unlockedStages = [1];
	this._normalBeaten = [];
	this._hardBeaten = [];
	this._mercilessBeaten = [];
};

// Has merciless ?
Game_System.prototype.hasMerciless = function(stageId) {
	return this._hardBeaten.indexOf(stageId) >= 0;
};

// Unlock stage
Game_System.prototype.unlockStage = function(stageId) {
	this._unlockedStages.push(stageId);
};

// Get unlocked stages
Game_System.prototype.unlockedStages = function() {
	return this._unlockedStages.sort();
};

// Creates new game ID
Game_System.prototype.newGame = function(saveFileId) {
	this._gameId = 10000000 + Utils.rand(1,89999999);
	this._saveFile = saveFileId;
	$gameParty.leader().equip(0, 
 		new Equipment($dataWeapons[1], 4));
	$gameParty.allMembers()[1].equip(0, 
		new Equipment($dataWeapons[6], 4));
	$gameParty.allMembers()[2].equip(0, 
		new Equipment($dataWeapons[10], 4));
};

// Save this game
Game_System.prototype.saveGame = function() {
	DataManager.saveGame(this._saveFile);
};

// Difficulty text
Game_System.prototype.difficultyText = function(difficulty) {
	difficulty = difficulty || this._difficulty;
	switch(difficulty) {
		case 0: // Normal
			return "Normal";
		case 1: // Hard
			return "Hard";
		case 2: // Merciless
			return "Merciless";
	}
};