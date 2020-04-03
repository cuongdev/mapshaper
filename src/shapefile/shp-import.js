/* @requires
mapshaper-path-import
*/

// Read Shapefile data from a file, ArrayBuffer or Buffer
// @shp, @shx: filename or buffer
internal.importShp = function(shp, shx, opts) {
  var reader = new ShpReader(shp, shx),
      shpType = reader.type(),
      type = internal.translateShapefileType(shpType),
      importOpts = utils.defaults({
        type: type,
        reserved_points: Math.round(reader.header().byteLength / 16)
      }, opts),
      importer = new PathImporter(importOpts);

  if (!internal.isSupportedShapefileType(shpType)) {
    stop("Unsupported Shapefile type:", shpType);
  }
  if (ShpType.isZType(shpType)) {
    message("Warning: Shapefile Z data will be lost.");
  } else if (ShpType.isMType(shpType)) {
    message("Warning: Shapefile M data will be lost.");
  }

  // TODO: test cases: null shape; non-null shape with no valid parts
  reader.forEachShape(function(shp) {
    importer.startShape();
    if (shp.isNull) {
      // skip
    } else if (type == 'point') {
      importer.importPoints(shp.readPoints());
    } else {
      shp.stream(importer);
      // shp.stream2(importer);
    }
  });

  return importer.done();
};
