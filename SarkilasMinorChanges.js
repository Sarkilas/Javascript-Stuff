//=============================================================================
// SarkilasUtils.js
//=============================================================================

/*:
 * @plugindesc Minor engine alterations.
 * @author Sarkilas
 *
 * @help Fills window backgrounds; no more margins.
 */

 (function() {
	Window.prototype._refreshBack = function() {
	    var m = 0;
	    var w = this._width - m * 2;
	    var h = this._height - m * 2;
	    var bitmap = new Bitmap(w, h);

	    this._windowBackSprite.bitmap = bitmap;
	    this._windowBackSprite.setFrame(0, 0, w, h);
	    this._windowBackSprite.move(m, m);

	    if (w > 0 && h > 0 && this._windowskin) {
	        var p = 96;
	        bitmap.blt(this._windowskin, 0, 0, p, p, 0, 0, w, h);
	        for (var y = 0; y < h; y += p) {
	            for (var x = 0; x < w; x += p) {
	                bitmap.blt(this._windowskin, 0, p, p, p, x, y, p, p);
	            }
	        }
	        var tone = this._colorTone;
	        bitmap.adjustTone(tone[0], tone[1], tone[2]);
	    }
	};
 })();