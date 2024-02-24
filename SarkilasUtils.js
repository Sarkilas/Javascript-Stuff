//=============================================================================
// Utils
//  * Static utility class
//=============================================================================

/*:
 * @plugindesc Additional utility methods.
 * @author Sarkilas
 *
 * @help This plugin does not provide plugin commands.
 */

// Initialize Sarkilas map
var Sarkilas = Sarkilas || {};
Sarkilas.Imported = Sarkilas.Imported || [];
Sarkilas.Imported.push('Utils');

// Wraps given text to a certain width
Utils.wrap = function(text, width, brk, cut) {
	brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
 
    if (!text) { return str; }
 
    var regex = new RegExp("(.{1," + width + "})( +|$\n?)|(.{1," + width + "})", 'g');
 
    return text.match( regex ).join( brk );
};

// Gets the difference between two numbers
Utils.difference = function(a, b) { return Math.abs(a - b); }

// Utils local file directory
Utils.localFileDirectoryPath = function() {
    var path = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, '/img/');
    if (path.match(/^\/([A-Z]\:)/)) {
        path = path.slice(1);
    }
    return decodeURIComponent(path);
};

// File exists (for images only, must provide which image domain)
Utils.fileExists = function(url)
{
    var fs = require('fs');
    return fs.existsSync(Utils.localFileDirectoryPath() + url + ".png");
}

// Gets a sorted array of keys from given map
Utils.sortedKeys = function(map) {
	var keys = [];
	for(var key in map) {
		if(map.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	return keys.sort();
};

// Checks if data has tag
Utils.hasTag = function(data, tag) {
	return data.note.toLowerCase().includes("<" + tag.toLowerCase() + ">") ? true : false;
};

// Gets a data value (JSON object must have a note property)
Utils.dataValue = function(data, tag) {
	var regex = new RegExp("<" + tag + " = (.*?)>", "i");
	var match = regex.exec(data.note);
	return match ? match[1] : 0;
};

// Gets a vector2 data value (JSON object must have a note property)
Utils.dataVector2 = function(data, tag) {
	var regex = new RegExp("<" + tag + " = (.*?),(.*?)>", "i");
	var match = regex.exec(data.note);
	return match ? [match[1],match[2]] : null;
};

// Gets a vector3 data value (JSON object must have a note property)
Utils.dataVector3 = function(data, tag) {
	var regex = new RegExp("<" + tag + " = (.*?),(.*?),(.*?)>", "i");
	var match = regex.exec(data.note);
	return match ? [match[1],match[2],match[3]] : null;
};

// Gets the complete value between an open and close tag
Utils.dataText = function(data, tag) {
	var regex = new RegExp("<" + tag + ">(.*?)</" + tag + ">", "i");
	var match = regex.exec(data.note);
	return match ? match[1] : null;
};

// Gets a random number between min and max (both inclusive)
Utils.rand = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};