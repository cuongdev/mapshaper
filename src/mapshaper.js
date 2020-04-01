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
  ShpReader: ShpReader,
  ArcCollection: ArcCollection,
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
