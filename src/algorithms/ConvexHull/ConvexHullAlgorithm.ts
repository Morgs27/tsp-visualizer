// Convex hull
//   Determine the leftmost point
// Continually add the most counterclockwise point until the convex hull is formed
// For each remaining point p, find the segment i => j in the hull that minimizes cost(i -> p) + cost(p -> j) - cost(i -> j)
// Of those, choose p that minimizes cost(i -> p -> j) / cost(i -> j)
// Add p to the path between i and j
// Repeat from #3 until there are no remaining points

import point from "../../types/Point";
import { pathCost } from "../../functions/helpers";

function orientation(p: point, q: point, r: point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0; // collinear
  return val > 0 ? 1 : 2; // clock or counterclock wise
}

async function convexHullAlgorithm(pointsParam: point[]) {
  const points: point[] = [...pointsParam];
  const frames: point[][] = [];
  const convexHull = async (points: point[]) => {
    const sp = points[0];

    // Find the "left most point"
    let leftmost = points[0];
    for (const point of points) {
      if (point.x < leftmost.x) {
        leftmost = point;
      }
    }

    const path = [leftmost];
    frames.push([...path]);

    while (true) {
      const curPoint = path[path.length - 1];
      let [selectedIdx, selectedPoint] = [0, points[0]];

      // find the "most counterclockwise" point
      for (let [idx, p] of points.entries()) {
        if (!selectedPoint || orientation(curPoint, p, selectedPoint) === 2) {
          // this point is counterclockwise with respect to the current hull
          // and selected point (e.g. more counterclockwise)
          [selectedIdx, selectedPoint] = [idx, p];
        }
      }

      // adding this to the hull so it's no longer available
      points.splice(selectedIdx, 1);

      // back to the furthest left point, formed a cycle, break
      if (selectedPoint === leftmost) {
        break;
      }

      // add to hull
      path.push(selectedPoint!);
      frames.push([...path]);
    }

    while (points.length > 0) {
      let [bestRatio, bestPointIdx, insertIdx] = [Infinity, 0, 0];

      for (let [freeIdx, freePoint] of points.entries()) {
        // for every free point, find the point in the current path
        // that minimizes the cost of adding the point minus the cost of
        // the original segment
        let [bestCost, bestIdx] = [Infinity, 0];
        for (let [pathIdx, pathPoint] of path.entries()) {
          const nextPathPoint = path[(pathIdx + 1) % path.length];

          // the new cost minus the old cost
          const evalCost =
            (await pathCost([pathPoint, freePoint, nextPathPoint])) -
            (await pathCost([pathPoint, nextPathPoint]));

          if (evalCost < bestCost) {
            [bestCost, bestIdx] = [evalCost, pathIdx];
          }
        }

        // figure out how "much" more expensive this is with respect to the
        // overall length of the segment
        const nextPoint = path[(bestIdx + 1) % path.length];
        const prevCost = await pathCost([path[bestIdx], nextPoint]);
        const newCost = await pathCost([path[bestIdx], freePoint, nextPoint]);
        const ratio = newCost / prevCost;

        if (ratio < bestRatio) {
          [bestRatio, bestPointIdx, insertIdx] = [ratio, freeIdx, bestIdx + 1];
        }
      }

      const [nextPoint] = points.splice(bestPointIdx, 1);
      path.splice(insertIdx, 0, nextPoint);

      frames.push([...path]);
    }

    // rotate the array so that starting point is back first
    const startIdx = path.findIndex((p) => p === sp);
    path.unshift(...path.splice(startIdx, path.length));

    // go back home
    path.push(sp);
    frames.push([...path]);

    return path;
  };

  const hull = await convexHull(points);

  return [hull, frames];
}

export default convexHullAlgorithm;
