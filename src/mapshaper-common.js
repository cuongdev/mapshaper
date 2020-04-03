// REFACTORING IN PROGRESS
// Assign some module objects to global variables, so files that
// haven't been converted to modules will continue to function
// (most of these will go away when esm transition is done)

import api from 'mapshaper-api';
import internal from 'mapshaper-internal';
import geom from 'geom/mapshaper-geom';
import utils from 'utils/mapshaper-utils';
import cli from 'cli/mapshaper-cli-utils';

internal.runningInBrowser = function() {return !!api.gui;};

api.internal = internal;
api.geom = geom;
api.utils = utils;
api.cli = cli;

import T from 'utils/mapshaper-timing';
import { error, stop, message, print, verbose, debug, UserError } from 'utils/mapshaper-logging';
import { absArcId } from 'paths/mapshaper-arc-utils';
import { BinArray, Bounds, Transform } from 'utils/mbloch-utils';
import { ArcCollection } from 'paths/mapshaper-arcs';
import Heap from 'simplify/mapshaper-heap';
import Visvalingam from 'simplify/mapshaper-visvalingam';
import DouglasPeucker from 'simplify/mapshaper-dp';
import ShpType from 'shapefile/shp-type';
import DbfReader from 'shapefile/dbf-reader';
import Dbf from 'shapefile/dbf-writer';
import { DataTable } from 'datatable/mapshaper-data-table';
import { ShpReader } from 'shapefile/shp-reader';
import { PolygonIndex } from 'polygons/mapshaper-polygon-index';
import { PathIndex } from 'paths/mapshaper-path-index';

// Assign functions and objects exported from modules to the 'internal' namespace
// to maintain compatibility with tests and to expose (some of) them to the GUI.

Object.assign(internal, {
  BinArray,
  Bounds,
  Transform,
  ArcCollection,
  Heap,
  Visvalingam,
  DouglasPeucker,
  ShpType,
  DbfReader,
  Dbf,
  DataTable,
  ShpReader,
  PolygonIndex,
  PathIndex
});

import * as PathGeom from 'geom/mapshaper-path-geom';
import * as PolygonGeom from 'geom/mapshaper-polygon-geom';
Object.assign(geom, PolygonGeom, PathGeom);

import * as FilenameUtils from 'utils/mapshaper-filename-utils';
Object.assign(utils, FilenameUtils);

import * as LatLon from 'geom/mapshaper-latlon';
import * as Topology from 'topology/mapshaper-topology';
import * as PathUtils from 'paths/mapshaper-path-utils';
import * as ShapeUtils from 'paths/mapshaper-shape-utils';
import * as PointUtils from 'points/mapshaper-point-utils';
import * as LayerUtils from 'dataset/mapshaper-layer-utils';
import * as DatasetUtils from 'dataset/mapshaper-dataset-utils';
import * as _ShapeIter from 'paths/mapshaper-shape-iter';
import * as FileTypes from 'io/mapshaper-file-types';
import * as Expressions from 'expressions/mapshaper-expressions';
import * as Projections from 'geom/mapshaper-projections';
import * as Encodings from 'text/mapshaper-encodings';
import * as _FileReader from 'io/mapshaper-file-reader';
import { FileReader, BufferReader, Reader2 } from 'io/mapshaper-file-reader';
import * as TargetUtils from 'dataset/mapshaper-target-utils';
import { Catalog } from 'dataset/mapshaper-catalog';
import * as _Catalog from 'dataset/mapshaper-catalog';
import * as ShpCommon from 'shapefile/shp-common';

Object.assign(internal,
  LatLon,
  Topology,
  PathUtils,
  ShapeUtils,
  PointUtils,
  LayerUtils,
  DatasetUtils,
  _ShapeIter,
  FileTypes,
  Expressions,
  Projections,
  Encodings,
  _FileReader,
  TargetUtils,
  _Catalog,
  ShpCommon
  );

var VERSION; // assignment is inserted by build script at the beginning of the bundle
internal.VERSION = VERSION;
