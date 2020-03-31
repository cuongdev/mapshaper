
/* @requires
mapshaper-nodes
mapshaper-shape-geom
mapshaper-segment-geom
mapshaper-units
*/

internal.closeUndershoots = function(lyr, dataset, opts) {
  var maxGapLen = opts.gap_tolerance ? internal.convertIntervalParam(opts.gap_tolerance, internal.getDatasetCRS(dataset)) : 0;
  var arcs = dataset.arcs;
  var arcFilter = internal.getArcPresenceTest(lyr.shapes, arcs);
  var nodes = new NodeCollection(dataset.arcs, arcFilter);
  var dangles = internal.findPotentialUndershoots(nodes, maxGapLen);
  if (dangles.length === 0) return nodes;
  var arcShapes = internal.arcsToShapes(arcs, arcFilter);
  var index = new PathIndex(arcShapes, arcs);
  var extensions = dangles.reduce(function(memo, dangle) {
    var candidates = index.findPointEnclosureCandidates(dangle.point, maxGapLen);
    var nearestHit = internal.findUndershootTarget(dangle, candidates, arcs, maxGapLen);
    if (nearestHit) {
      memo.push(internal.getArcExtension(nearestHit, dangle.arc, arcs));
    }
    return memo;
  }, []);

  // TODO: consider alternative: append small patch arcs to paths instead of shifting endpoints
  dataset.arcs = internal.insertArcExtensions(arcs, extensions);
  return internal.addIntersectionCuts(dataset, {});
};

// Return information about an arc that @endpoint can connect with to close a gap
// @candidates: array of ids of possible target arcs
internal.findUndershootTarget = function(endpoint, candidates, arcs, maxGapLen) {
  var absId = absArcId(endpoint.arc);
  var target = null;
  candidates.forEach(function(candId) {
    var hit;
    if (candId == absId) return; // ignore self-intersections
    hit = geom.getPointToPathInfo(endpoint.point[0], endpoint.point[1], [candId], arcs);
    if (hit && hit.distance <= maxGapLen && (!target || hit.distance < target.distance)) {
      target = hit;
    }
  });
  return target;
};


// Create a polyline shape for each arc in an ArcCollection
internal.arcsToShapes = function(arcs, filter) {
  var shapes = [];
  for (var i=0, n=arcs.size(); i<n; i++) {
    shapes.push(filter(i) ? [[i]] : null);
  }
  return shapes;
};

// Find unconnected (dangling) arcs that don't look like overshoots
internal.findPotentialUndershoots = function(nodes, maxLen) {
  return nodes.findDanglingEndpoints().filter(function(o) {
    return geom.calcPathLen([o.arc], nodes.arcs) > maxLen;
  });
};

internal.insertArcExtensions = function(arcs, extensions) {
  var data = arcs.getVertexData();
  extensions.forEach(function(obj) {
    var i = arcs.indexOfVertex(obj.arc, -1);
    data.xx[i] = obj.point[0];
    data.yy[i] = obj.point[1];
  });

  // re-index arc bounds
  arcs.updateVertexData(data.nn, data.xx, data.yy, data.zz);
  return arcs;
};

internal.chooseCloserPoint = function(p, a, b) {
  return geom.distance2D(p[0], p[1], a[0], a[1]) < geom.distance2D(p[0], p[1], b[0], b[1]) ? a : b;
};

internal.pointIsEndpoint = function(p, a, b) {
  return p[0] == a[0] && p[1] == a[1] || p[0] == b[0] && p[1] == b[1];
};

// move point <b> a bit farther away from <a>
internal.addTinyOvershoot = function(a, b) {
  var dist = geom.distance2D(a[0], a[1], b[0], b[1]);
  var k = (dist + 1e-6) / dist;
  return [a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1])];
};

internal.getArcExtension = function(hit, arcId, arcs) {
  var v0 = arcs.getVertex(arcId, -1),
      endPtOld = [v0.x, v0.y],
      v1 = arcs.getVertex(arcId, -2),
      p1 = [v1.x, v1.y],
      s1 = hit.segment[0],
      s2 = hit.segment[1],
      endPtNew = geom.findClosestPointOnSeg(endPtOld[0], endPtOld[1], s1[0], s1[1], s2[0], s2[1]);
  if (!internal.pointIsEndpoint(endPtNew, s1, s2)) {
    // add small overshoot if new endpoint is not a vertex, to make sure intersection
    // is correctly detected later
    endPtNew = internal.addTinyOvershoot(p1, endPtNew);
    // handle floating point rounding errors by snapping to a segment endpoint
    if (!geom.segmentIntersection(p1[0], p1[1], endPtNew[0], endPtNew[1], s1[0], s1[1], s2[0], s2[1])) {
      endPtNew = internal.chooseCloserPoint(p1, s1, s2);
    }
    // TODO: test edge cases; moving the endpoint of a dangling arc could create
    //   invalid geometry, e.g. duplicate points
  }
  return {
    arc: arcId,
    point: endPtNew
  };
};
