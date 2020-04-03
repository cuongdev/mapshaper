/* @requires
mapshaper-filter,
mapshaper-slivers
*/

api.filterIslands2 = function(lyr, dataset, optsArg) {
  var opts = utils.extend({sliver_control: 0}, optsArg); // no sliver control
  var arcs = dataset.arcs;
  var removed = 0;
  var filter;
  if (lyr.geometry_type != 'polygon') {
    return;
  }
  if (!opts.min_area && !opts.min_vertices) {
    message("Missing a criterion for filtering islands; use min-area or min-vertices");
    return;
  }

  if (opts.min_area) {
    filter = internal.getSliverFilter(lyr, dataset, opts).filter;
  } else {
    filter = internal.getVertexCountTest(opts.min_vertices, arcs);
  }
  removed += internal.filterIslands2(lyr, arcs, filter);
  if (opts.remove_empty) {
    api.filterFeatures(lyr, arcs, {remove_empty: true, verbose: false});
  }
  message(utils.format("Removed %'d island%s", removed, utils.pluralSuffix(removed)));
};

internal.buildIslandIndex = function(lyr, arcs, ringTest) {
  // index of all islands
  // (all rings are considered to belong to an island)
  var islandIndex = [];
  // this index maps id of first arc in each ring to
  // an island in islandIndex
  var firstArcIndex = new ArcToIdIndex(arcs);
  var shpId;
  var parts;

  lyr.shapes.forEach(function(shp, i) {
    if (!shp) return;
    shpId = i;
    internal.forEachShapePart(parts, eachRing);

  });

  function eachRing(ring, ringId, shp) {
    var area = geom.getPathArea(ring, arcs);
    var firstArcId = part[0];
    if (area <= 0) return; // skip holes (really?)
    var islandId = firstArcIndex.getId(firstArcId);
    var islandData;
    if (islandId == -1) {
      islandData = {
        area: 0
      };
      islandId = islandIndex.length;
      islandIndex.push(islandData);
    } else {
      islandData = islandIndex[islandId];
    }
    islandData.area += area;

  }

};


internal.filterIslands2 = function(lyr, arcs, ringTest) {
  var removed = 0;
  var counts = new Uint8Array(arcs.size());
  internal.countArcsInShapes(lyr.shapes, counts);

  var pathFilter = function(path, i, paths) {
    if (path.length == 1) { // got an island ring
      if (counts[absArcId(path[0])] === 1) { // and not part of a donut hole
        if (!ringTest || ringTest(path)) { // and it meets any filtering criteria
          // and it does not contain any holes itself
          // O(n^2), so testing this last
          if (!internal.ringHasHoles(path, paths, arcs)) {
            removed++;
            return null;
          }
        }
      }
    }
  };
  internal.editShapes(lyr.shapes, pathFilter);
  return removed;
};

function ArcToIdIndex(arcs) {
  var n = arcs.size();
  var fwdArcIndex = new Int32Array(n);
  var revArcIndex = new Int32Array(n);
  utils.initializeArray(fwdArcIndex, -1);
  utils.initializeArray(revArcIndex, -1);
  this.setId = function(arcId, id) {
    if (arcId >= 0) {
      fwdArcIndex[arcId] = id;
    } else {
      revArcIndex[~arcId] = id;
    }
  };

  this.getId = function(arcId) {
    var i = absArcId(arcId);
    if (i < n === false) return -1;
    return (arcId < 0 ? revArcIndex : fwdArcIndex)[i];
  };
}
