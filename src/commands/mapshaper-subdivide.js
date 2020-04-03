/* @requires mapshaper-calc */

// Recursively divide a layer into two layers until a (compiled) expression
// no longer returns true. The original layer is split along the long side of
// its bounding box, so that each split-off layer contains half of the original
// shapes (+/- 1).
//
api.subdivideLayer = function(lyr, arcs, exp) {
  return internal.subdivide(lyr, arcs, exp);
};

internal.subdivide = function(lyr, arcs, exp) {
  var divide = internal.evalCalcExpression(lyr, arcs, exp),
      subdividedLayers = [],
      tmp, bounds, lyr1, lyr2, layerName;

  if (!utils.isBoolean(divide)) {
    stop("Expression must evaluate to true or false");
  }
  if (divide) {
    bounds = internal.getLayerBounds(lyr, arcs);
    tmp = internal.divideLayer(lyr, arcs, bounds);
    lyr1 = tmp[0];
    if (lyr1.shapes.length > 1 && lyr1.shapes.length < lyr.shapes.length) {
      utils.merge(subdividedLayers, internal.subdivide(lyr1, arcs, exp));
    } else {
      subdividedLayers.push(lyr1);
    }

    lyr2 = tmp[1];
    if (lyr2.shapes.length > 1 && lyr2.shapes.length < lyr.shapes.length) {
      utils.merge(subdividedLayers, internal.subdivide(lyr2, arcs, exp));
    } else {
      subdividedLayers.push(lyr2);
    }
  } else {
    subdividedLayers.push(lyr);
  }
  layerName = internal.getSplitNameFunction(lyr);
  subdividedLayers.forEach(function(lyr2, i) {
    lyr2.name = layerName(i);
    utils.defaults(lyr2, lyr);
  });
  return subdividedLayers;
};

// split one layer into two layers containing the same number of shapes (+-1),
// either horizontally or vertically
//
internal.divideLayer = function(lyr, arcs, bounds) {
  var properties = lyr.data ? lyr.data.getRecords() : null,
      shapes = lyr.shapes,
      lyr1, lyr2;
  lyr1 = {
    geometry_type: lyr.geometry_type,
    shapes: [],
    data: properties ? [] : null
  };
  lyr2 = {
    geometry_type: lyr.geometry_type,
    shapes: [],
    data: properties ? [] : null
  };

  var useX = bounds && bounds.width() > bounds.height();
  // TODO: think about case where there are null shapes with NaN centers
  var centers = shapes.map(function(shp) {
    var bounds = arcs.getMultiShapeBounds(shp);
    return useX ? bounds.centerX() : bounds.centerY();
  });
  var ids = utils.range(centers.length);
  ids.sort(function(a, b) {
    return centers[a] - centers[b];
  });
  ids.forEach(function(shapeId, i) {
    var dest = i < shapes.length / 2 ? lyr1 : lyr2;
    dest.shapes.push(shapes[shapeId]);
    if (properties) {
      dest.data.push(properties[shapeId]);
    }
  });

  if (properties) {
    lyr1.data = new DataTable(lyr1.data);
    lyr2.data = new DataTable(lyr2.data);
  }
  return [lyr1, lyr2];
};
