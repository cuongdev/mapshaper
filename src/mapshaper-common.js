/* requires mapshaper-utils */

// define some global objects
// (these will go away when esm transition is done)
import api from 'mapshaper-api';
import internal from 'mapshaper-internal';
import T from 'utils/mapshaper-timing';
import { error, stop, message, print, verbose, debug, UserError } from 'utils/mapshaper-logging';
import { absArcId } from 'paths/mapshaper-arc-utils';
import geom from 'geom/mapshaper-geom';
import utils from 'utils/mapshaper-utils';
import { BinArray, Transform, Bounds } from 'utils/mbloch-utils';
import * as LatLon from 'geom/mapshaper-latlon';
import * as Encodings from 'text/mapshaper-encodings';
import DataTable from 'datatable/mapshaper-data-table';

var VERSION; // assignment is inserted by build script at the beginning of the bundle
internal.VERSION = VERSION;

internal.runningInBrowser = function() {return !!api.gui;};
