/* @requires mapshaper-utils */

// define some global objects
// (these will go away when esm transition is done)
import api from 'mapshaper-api';
import internal from 'mapshaper-internal';
import T from 'utils/mapshaper-timing';
import { error, stop, message, print, verbose, debug, UserError } from 'utils/mapshaper-logging';
import { absArcId } from 'paths/mapshaper-arc-utils';
import geom from 'geom/mapshaper-geom';

var VERSION; // assignment is inserted by build script at the beginning of the bundle
internal.VERSION = VERSION;

internal.runningInBrowser = function() {return !!api.gui;};

// Format an array of (preferably short) strings in columns for console logging.
internal.formatStringsAsGrid = function(arr) {
  // TODO: variable column width
  var longest = arr.reduce(function(len, str) {
        return Math.max(len, str.length);
      }, 0),
      colWidth = longest + 2,
      perLine = Math.floor(80 / colWidth) || 1;
  return arr.reduce(function(memo, name, i) {
    var col = i % perLine;
    if (i > 0 && col === 0) memo += '\n';
    if (col < perLine - 1) { // right-pad all but rightmost column
      name = utils.rpad(name, colWidth - 2, ' ');
    }
    return memo +  '  ' + name;
  }, '');
};

internal.getWorldBounds = function(e) {
  e = utils.isFiniteNumber(e) ? e : 1e-10;
  return [-180 + e, -90 + e, 180 - e, 90 - e];
};

internal.probablyDecimalDegreeBounds = function(b) {
  var world = internal.getWorldBounds(-1), // add a bit of excess
      bbox = (b instanceof Bounds) ? b.toArray() : b;
  return geom.containsBounds(world, bbox);
};

internal.clampToWorldBounds = function(b) {
  var bbox = (b instanceof Bounds) ? b.toArray() : b;
  return new Bounds().setBounds(Math.max(bbox[0], -180), Math.max(bbox[1], -90),
      Math.min(bbox[2], 180), Math.min(bbox[3], 90));
};

internal.requireProjectedDataset = function(dataset) {
  if (internal.isLatLngCRS(internal.getDatasetCRS(dataset))) {
    stop("Command requires a target with projected coordinates (not lat-long)");
  }
};
