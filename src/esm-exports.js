
// Maintain compatibility with tests by assigning functions from modules to "internal" namespace

import Heap from 'simplify/mapshaper-heap';
import Visvalingam from 'simplify/mapshaper-visvalingam';
import DouglasPeucker from 'simplify/mapshaper-dp';
import ShpType from 'shapefile/shp-type';
import { BinArray, Bounds, Transform } from 'utils/mbloch-utils';
import DbfReader from 'shapefile/dbf-reader';
import Dbf from 'shapefile/dbf-writer';
import DataTable from 'datatable/mapshaper-data-table';

var internal = {
  Heap: Heap,
  Visvalingam: Visvalingam,
  DouglasPeucker: DouglasPeucker,
  ShpType: ShpType,
  BinArray: BinArray,
  Bounds: Bounds,
  Transform: Transform,
  DbfReader: DbfReader,
  Dbf: Dbf,
  DataTable: DataTable
};

export default {internal: internal};
