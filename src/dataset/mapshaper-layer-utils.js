
// utility functions for layers


// Insert a column of values into a (new or existing) data field
internal.insertFieldValues = function(lyr, fieldName, values) {
  var size = internal.getFeatureCount(lyr) || values.length,
      table = lyr.data = (lyr.data || new DataTable(size)),
      records = table.getRecords(),
      rec, val;

  for (var i=0, n=records.length; i<n; i++) {
    rec = records[i];
    val = values[i];
    if (!rec) rec = records[i] = {};
    rec[fieldName] = val === undefined ? null : val;
  }
};

internal.getLayerDataTable = function(lyr) {
  var data = lyr.data;
  if (!data) {
    data = lyr.data = new DataTable(lyr.shapes ? lyr.shapes.length : 0);
  }
  return data;
};

internal.layerHasGeometry = function(lyr) {
  return internal.layerHasPaths(lyr) || internal.layerHasPoints(lyr);
};

internal.layerHasPaths = function(lyr) {
  return (lyr.geometry_type == 'polygon' || lyr.geometry_type == 'polyline') &&
    internal.layerHasNonNullShapes(lyr);
};

internal.layerHasPoints = function(lyr) {
  return lyr.geometry_type == 'point' && internal.layerHasNonNullShapes(lyr);
};

internal.layerHasNonNullShapes = function(lyr) {
  return utils.some(lyr.shapes || [], function(shp) {
    return !!shp;
  });
};

internal.getFeatureCount = function(lyr) {
  var count = 0;
  if (lyr.data) {
    count = lyr.data.size();
  } else if (lyr.shapes) {
    count = lyr.shapes.length;
  }
  return count;
};

internal.layerIsEmpty = function(lyr) {
  return internal.getFeatureCount(lyr) == 0;
};

internal.requireDataField = function(obj, field, msg) {
  var data = obj.fieldExists ? obj : obj.data; // accept layer or DataTable
  if (!field) stop('Missing a field parameter');
  if (!data || !data.fieldExists(field)) {
    stop(msg || 'Missing a field named:', field);
  }
};

internal.requireDataFields = function(table, fields) {
  if (!fields || !fields.length) return;
  if (!table) {
    stop("Missing attribute data");
  }
  var dataFields = table.getFields(),
      missingFields = utils.difference(fields, dataFields);
  if (missingFields.length > 0) {
    stop("Table is missing one or more fields:\n",
        missingFields, "\nExisting fields:", '\n' + internal.formatStringsAsGrid(dataFields));
  }
};

internal.layerTypeMessage = function(lyr, defaultMsg, customMsg) {
  var msg;
  if (customMsg && utils.isString(customMsg)) {
    msg = customMsg;
  } else {
    msg = defaultMsg + ', ';
    if (!lyr || !lyr.geometry_type) {
      msg += 'received a layer with no geometry';
    } else {
      msg += 'received a ' + lyr.geometry_type + ' layer';
    }
  }
  return msg;
};

internal.requirePointLayer = function(lyr, msg) {
  if (!lyr || lyr.geometry_type !== 'point')
    stop(internal.layerTypeMessage(lyr, "Expected a point layer", msg));
};

internal.requirePolylineLayer = function(lyr, msg) {
  if (!lyr || lyr.geometry_type !== 'polyline')
    stop(internal.layerTypeMessage(lyr, "Expected a polyline layer", msg));
};

internal.requirePolygonLayer = function(lyr, msg) {
  if (!lyr || lyr.geometry_type !== 'polygon')
    stop(internal.layerTypeMessage(lyr, "Expected a polygon layer", msg));
};

internal.requirePathLayer = function(lyr, msg) {
  if (!lyr || !internal.layerHasPaths(lyr))
    stop(internal.layerTypeMessage(lyr, "Expected a polygon or polyline layer", msg));
};


// Used by info command and gui layer menu
internal.getLayerSourceFile = function(lyr, dataset) {
  var inputs = dataset.info && dataset.info.input_files;
  return inputs && inputs[0] || '';
};

// Divide a collection of features with mixed types into layers of a single type
// (Used for importing TopoJSON and GeoJSON features)
internal.divideFeaturesByType = function(shapes, properties, types) {
  var typeSet = utils.uniq(types);
  var layers = typeSet.map(function(geoType) {
    var p = [],
        s = [],
        dataNulls = 0,
        rec;
    for (var i=0, n=shapes.length; i<n; i++) {
      if (types[i] != geoType) continue;
      if (geoType) s.push(shapes[i]);
      rec = properties[i];
      p.push(rec);
      if (!rec) dataNulls++;
    }
    return {
      geometry_type: geoType,
      shapes: s,
      data: dataNulls < s.length ? new DataTable(p) : null
    };
  });
  return layers;
};

// make a stub copy if the no_replace option is given, else pass thru src layer
internal.getOutputLayer = function(src, opts) {
  return opts && opts.no_replace ? {geometry_type: src.geometry_type} : src;
};

// Make a deep copy of a layer
internal.copyLayer = function(lyr) {
  var copy = internal.copyLayerShapes(lyr);
  if (copy.data) {
    copy.data = copy.data.clone();
  }
  return copy;
};

// Make a shallow copy of a path layer; replace layer.shapes with an array that is
// filtered to exclude paths containing any of the arc ids contained in arcIds.
// arcIds: an array of (non-negative) arc ids to exclude
internal.filterPathLayerByArcIds = function(pathLyr, arcIds) {
  var index = arcIds.reduce(function(memo, id) {
    memo[id] = true;
    return memo;
  }, {});
  // deep copy shapes; this could be optimized to only copy shapes that are modified
  var shapes = internal.cloneShapes(pathLyr.shapes);
  internal.editShapes(shapes, onPath); // remove paths that are missing shapes
  return utils.defaults({shapes: shapes}, pathLyr);

  function onPath(path) {
    for (var i=0; i<path.length; i++) {
      if (absArcId(path[i]) in index) {
        return null;
      }
    }
    return path;
  }
};

internal.copyLayerShapes = function(lyr) {
  var copy = utils.extend({}, lyr);
  if (lyr.shapes) {
    copy.shapes = internal.cloneShapes(lyr.shapes);
  }
  return copy;
};

internal.countMultiPartFeatures = function(shapes) {
  var count = 0;
  for (var i=0, n=shapes.length; i<n; i++) {
    if (shapes[i] && shapes[i].length > 1) count++;
  }
  return count;
};

internal.getLayerBounds = function(lyr, arcs) {
  var bounds = null;
  if (lyr.geometry_type == 'point') {
    bounds = internal.getPointBounds(lyr.shapes);
  } else if (lyr.geometry_type == 'polygon' || lyr.geometry_type == 'polyline') {
    bounds = internal.getPathBounds(lyr.shapes, arcs);
  } else {
    // just return null if layer has no bounds
    // error("Layer is missing a valid geometry type");
  }
  return bounds;
};

internal.getPathBounds = function(shapes, arcs) {
  var bounds = new Bounds();
  internal.forEachArcId(shapes, function(id) {
    arcs.mergeArcBounds(id, bounds);
  });
  return bounds;
};

internal.isolateLayer = function(layer, dataset) {
  return utils.defaults({
    layers: dataset.layers.filter(function(lyr) {return lyr == layer;})
  }, dataset);
};

internal.initDataTable = function(lyr) {
  lyr.data = new DataTable(internal.getFeatureCount(lyr));
};
