/* @requires
mapshaper-commands
mapshaper-cli-utils
mapshaper-bbox-clipping
*/

api.cli = cli;
api.internal = internal;
api.utils = utils;
api.geom = geom;

// Maintain compatibility between ESM modules and current tests
import exports from 'esm-exports';
Object.assign(api.internal, exports.internal);


// Expose internal objects for testing
utils.extend(api.internal, {
  Catalog: Catalog,
  DataTable: DataTable,
  BinArray: BinArray,
  DouglasPeucker: DouglasPeucker,
  Visvalingam: Visvalingam,
  Heap: Heap,
  ShpReader: ShpReader,
  ShpType: ShpType,
  Dbf: Dbf,
  DbfReader: DbfReader,
  ShapefileTable: ShapefileTable,
  ArcCollection: ArcCollection,
  PointIter: PointIter,
  ArcIter: ArcIter,
  ShapeIter: ShapeIter,
  Bounds: Bounds,
  Transform: Transform,
  NodeCollection: NodeCollection,
  PolygonIndex: PolygonIndex,
  PathIndex: PathIndex,
  topojson: TopoJSON,
  geojson: GeoJSON,
  svg: SVG,
  UserError: UserError
});

if (typeof define === "function" && define.amd) {
  define("mapshaper", api);
} else if (typeof module === "object" && module.exports) {
  module.exports = api;
} else if (typeof window === "object" && window) {
  window.mapshaper = api;
}
