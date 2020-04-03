/* @requires
mapshaper-common
mapshaper-commands
mapshaper-bbox-clipping
*/

// Expose internal objects for testing
utils.extend(api.internal, {
  NodeCollection: NodeCollection,
  topojson: TopoJSON,
  geojson: GeoJSON,
  svg: SVG
});

if (typeof define === "function" && define.amd) {
  define("mapshaper", api);
} else if (typeof module === "object" && module.exports) {
  module.exports = api;
} else if (typeof window === "object" && window) {
  window.mapshaper = api;
}
