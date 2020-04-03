/* @requires
mapshaper-geojson
mapshaper-topojson
mapshaper-shapefile
mapshaper-svg
mapshaper-rounding
mapshaper-delim-export
mapshaper-json-table
mapshaper-output-format
*/

import { exportDbf } from 'shapefile/dbf-export';

// @targets - non-empty output from Catalog#findCommandTargets()
//
internal.exportTargetLayers = function(targets, opts) {
  // convert target fmt to dataset fmt
  var datasets = targets.map(function(target) {
    return utils.defaults({layers: target.layers}, target.dataset);
  });
  return internal.exportDatasets(datasets, opts);
};

//
//
internal.exportDatasets = function(datasets, opts) {
  var format = internal.getOutputFormat(datasets[0], opts);
  var files;
  if (format == 'svg' || format == 'topojson' || format == 'geojson' && opts.combine_layers) {
    // multi-layer formats: combine multiple datasets into one
    if (datasets.length > 1) {
      datasets = [internal.mergeDatasetsForExport(datasets)];
      if (format == 'topojson') {
        // Build topology, in case user has loaded several
        // files derived from the same source, with matching coordinates
        // (Downsides: useless work if geometry is unrelated;
        // could create many small arcs if layers are partially related)
        internal.buildTopology(datasets[0]);
      }
      // KLUDGE let exporter know that copying is not needed
      // (because shape data was deep-copied during merge)
      opts = utils.defaults({final: true}, opts);
    }
  } else {
    datasets = datasets.map(internal.copyDatasetForRenaming);
    internal.assignUniqueLayerNames2(datasets);
  }
  files = datasets.reduce(function(memo, dataset) {
    if (internal.runningInBrowser()) {
      utils.sortOn(dataset.layers, 'stack_id', true);
    } else {
      // kludge to export layers in order that target= option or previous
      // -target command matched them (useful mainly for SVG output)
      // target_id was assigned to each layer by findCommandTargets()
      utils.sortOn(dataset.layers, 'target_id', true);
    }
    return memo.concat(internal.exportFileContent(dataset, opts));
  }, []);
  // need unique names for multiple output files
  internal.assignUniqueFileNames(files);
  return files;
};

// Return an array of objects with "filename" and "content" members.
//
internal.exportFileContent = function(dataset, opts) {
  var outFmt = opts.format = internal.getOutputFormat(dataset, opts),
      exporter = internal.exporters[outFmt],
      files = [];

  if (!outFmt) {
    error("Missing output format");
  } else if (!exporter) {
    error("Unknown output format:", outFmt);
  }

  // shallow-copy dataset and layers, so layers can be renamed for export
  dataset = utils.defaults({
    layers: dataset.layers.map(function(lyr) {return utils.extend({}, lyr);})
  }, dataset);

  // Adjust layer names, so they can be used as output file names
  // (except for multi-layer formats TopoJSON and SVG)
  if (opts.file && outFmt != 'topojson' && outFmt != 'svg') {
    dataset.layers.forEach(function(lyr) {
      lyr.name = utils.getFileBase(opts.file);
    });
  }
  internal.assignUniqueLayerNames(dataset.layers);

  // apply coordinate precision, except:
  //   svg precision is applied by the SVG exporter, after rescaling
  //   GeoJSON precision is applied by the exporter, to handle default precision
  //   TopoJSON precision is applied to avoid redundant copying
  if (opts.precision && outFmt != 'svg' && outFmt != 'geojson' && outFmt != 'topojson') {
    dataset = internal.copyDatasetForExport(dataset);
    internal.setCoordinatePrecision(dataset, opts.precision);
  }

  if (opts.cut_table) {
    files = internal.exportDataTables(dataset.layers, opts).concat(files);
  }

  if (opts.extension) {
    opts.extension = internal.fixFileExtension(opts.extension, outFmt);
  }

  internal.validateLayerData(dataset.layers);

  files = exporter(dataset, opts).concat(files);
  // If rounding or quantization are applied during export, bounds may
  // change somewhat... consider adding a bounds property to each layer during
  // export when appropriate.
  if (opts.bbox_index) {
    files.push(internal.createIndexFile(dataset));
  }

  internal.validateFileNames(files);
  return files;
};

internal.exporters = {
  geojson: internal.exportGeoJSON,
  topojson: internal.exportTopoJSON,
  shapefile: internal.exportShapefile,
  dsv: internal.exportDelim,
  dbf: exportDbf,
  json: internal.exportJSON,
  svg: internal.exportSVG
};


// Generate json file with bounding boxes and names of each export layer
// TODO: consider making this a command, or at least make format settable
//
internal.createIndexFile = function(dataset) {
  var index = dataset.layers.map(function(lyr) {
    var bounds = internal.getLayerBounds(lyr, dataset.arcs);
    return {
      bbox: bounds.toArray(),
      name: lyr.name
    };
  });

  return {
    content: JSON.stringify(index),
    filename: "bbox-index.json"
  };
};

// Throw errors for various error conditions
internal.validateLayerData = function(layers) {
  layers.forEach(function(lyr) {
    if (!lyr.geometry_type) {
      // allowing data-only layers
      if (lyr.shapes && utils.some(lyr.shapes, function(o) {
        return !!o;
      })) {
        error("A layer contains shape records and a null geometry type");
      }
    } else {
      if (!utils.contains(['polygon', 'polyline', 'point'], lyr.geometry_type)) {
        error ("A layer has an invalid geometry type:", lyr.geometry_type);
      }
      if (!lyr.shapes) {
        error ("A layer is missing shape data");
      }
    }
  });
};

internal.validateFileNames = function(files) {
  var index = {};
  files.forEach(function(file, i) {
    var filename = file.filename;
    if (!filename) error("Missing a filename for file" + i);
    if (filename in index) error("Duplicate filename", filename);
    index[filename] = true;
  });
};

internal.assignUniqueLayerNames = function(layers) {
  var names = layers.map(function(lyr) {
    return lyr.name || "layer";
  });
  var uniqueNames = utils.uniqifyNames(names);
  layers.forEach(function(lyr, i) {
    lyr.name = uniqueNames[i];
  });
};

// Assign unique layer names across multiple datasets
internal.assignUniqueLayerNames2 = function(datasets) {
  var layers = datasets.reduce(function(memo, dataset) {
    return memo.concat(dataset.layers);
  }, []);
  internal.assignUniqueLayerNames(layers);
};

internal.assignUniqueFileNames = function(output) {
  var names = output.map(function(o) {return o.filename;});
  var uniqnames = utils.uniqifyNames(names, internal.formatVersionedFileName);
  output.forEach(function(o, i) {o.filename = uniqnames[i];});
};

// TODO: remove this -- format=json creates the same output
//   (but need to make sure there's a way to prevent names of json data files
//    from colliding with names of GeoJSON or TopoJSON files)
internal.exportDataTables = function(layers, opts) {
  var tables = [];
  layers.forEach(function(lyr) {
    if (lyr.data) {
      tables.push({
        content: JSON.stringify(lyr.data),
        filename: (lyr.name ? lyr.name + '-' : '') + 'table.json'
      });
    }
  });
  return tables;
};

internal.formatVersionedFileName = function(filename, i) {
  var parts = filename.split('.');
  var ext, base;
  if (parts.length < 2) {
    return utils.formatVersionedName(filename, i);
  }
  ext = parts.pop();
  base = parts.join('.');
  return utils.formatVersionedName(base, i) + '.' + ext;
};

internal.fixFileExtension = function(ext, fmt) {
  // TODO: use fmt to validate
  return ext.replace(/^\.+/, '');
};
