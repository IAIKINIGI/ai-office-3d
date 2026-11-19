import { S } from './scope.js';

// Automated 2D footprint overlap check: rotated-rectangle (OBB) tests of
// building footprints against each other and against highway / rail / road
// polylines with widths. Exposed as window.__checkOverlaps().

const EPS = 0.20;          // contact slack, metres
const AREA_MIN = 0.5;      // ignore sliver intersections smaller than this (m²)
const PEN_MIN = 0.25;      // or penetration deeper than this (m)


function worldTower() {
  const builtW = S.FW || 22, builtD = S.FD || 14;
  return {
    tx: S.TOWER_X || 0,
    tz: S.TOWER_Z || 0,
    rot: S.TOWER_ROT != null ? S.TOWER_ROT : 138,
    fw: S.TOWER_FW || builtW * (S.FOOTPRINT_SCALE || 1),
    fd: S.TOWER_FD || builtD * (S.FOOTPRINT_SCALE || 1),
  };
}

function rot(x, z, c, s) { return [x * c + z * s, -x * s + z * c]; }

function towerCorners(tx, tz, deg, fw, fd) {
  const th = (deg || 0) * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  const hx = fw / 2, hz = fd / 2;
  const pts = [];
  for (const [sx, sz] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) {
    const [x, z] = rot(sx, sz, c, s);
    pts.push({ x: tx + x, z: tz + z });
  }
  return pts;
}

function aabbOf(pts) {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
  }
  return { minX, minZ, maxX, maxZ, w: maxX - minX, d: maxZ - minZ };
}

function boxCorners(minX, minZ, maxX, maxZ) {
  return [
    { x: minX, z: minZ }, { x: maxX, z: minZ },
    { x: maxX, z: maxZ }, { x: minX, z: maxZ },
  ];
}

function axesOf(pts) {
  const a = [];
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const dx = pts[j].x - pts[i].x, dz = pts[j].z - pts[i].z;
    const L = Math.hypot(dx, dz) || 1;
    a.push({ x: -dz / L, z: dx / L });
  }
  return a;
}

function project(pts, ax, az) {
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) {
    const t = p.x * ax + p.z * az;
    if (t < lo) lo = t; if (t > hi) hi = t;
  }
  return [lo, hi];
}

function satOverlap(ptsA, ptsB) {
  let pen = Infinity;
  for (const axis of axesOf(ptsA).concat(axesOf(ptsB))) {
    const [alo, ahi] = project(ptsA, axis.x, axis.z);
    const [blo, bhi] = project(ptsB, axis.x, axis.z);
    const ov = Math.min(ahi, bhi) - Math.max(alo, blo);
    if (ov <= EPS) return { hit: false, pen: 0 };
    if (ov < pen) pen = ov;
  }
  // Approximate intersection area as the product of the two smallest
  // residual overlaps, capped by each polygon's AABB area. Good enough
  // to ignore slivers and flag real crossings.
  const a = aabbOf(ptsA), b = aabbOf(ptsB);
  const ix = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const iz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  const area = Math.max(0, ix) * Math.max(0, iz);
  return { hit: true, pen, area };
}

function distPointSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / L2;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const qx = ax + t * dx, qz = az + t * dz;
  return Math.hypot(px - qx, pz - qz);
}

function obbVsPolyline(pts, poly, halfW) {
  // Overlap if any corner/edge sample is closer than halfW - EPS, or the
  // polyline centreline pierces the OBB.
  let minD = Infinity;
  const samples = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = 4;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      samples.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  // centroid
  let cx = 0, cz = 0;
  for (const p of pts) { cx += p.x; cz += p.z; }
  cx /= pts.length; cz /= pts.length;
  samples.push({ x: cx, z: cz });

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i], b = poly[i + 1];
    for (const s of samples) {
      const d = distPointSeg(s.x, s.z, a.x, a.z, b.x, b.z);
      if (d < minD) minD = d;
    }
    // segment midpoint inside OBB?
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    if (pointInConvex(pts, mx, mz) && minD > 0) minD = 0;
  }
  const pen = halfW - minD;
  return { hit: pen > EPS, pen: Math.max(0, pen), area: 0, minD };
}

function pointInConvex(pts, x, z) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const cr = (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x);
    const s = cr > 1e-8 ? 1 : cr < -1e-8 ? -1 : 0;
    if (s === 0) continue;
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

function meshFootprint(o) {
  const box = new S.THREE.Box3().setFromObject(o);
  const hy = box.max.y - box.min.y;
  if (hy < 1.6) return null;
  const pts = boxCorners(box.min.x, box.min.z, box.max.x, box.max.z);
  const area = (box.max.x - box.min.x) * (box.max.z - box.min.z);
  if (area < 0.8) return null;
  return { pts, aabb: aabbOf(pts), area, hy, minY: box.min.y, maxY: box.max.y };
}

function inGroup(o, group) {
  let n = o;
  while (n) { if (n === group) return true; n = n.parent; }
  return false;
}

function collectBuildings() {
  const items = [];

  // H tower: exact rotated slab, not the loose world AABB of every floor mesh.
  const tw = worldTower();
  items.push({
    id: 'h-tower', kind: 'building', group: 'placed',
    pts: towerCorners(tw.tx, tw.tz, tw.rot, tw.fw, tw.fd),
  });

  if (S.oldSiteFillMeta) {
    const m = S.oldSiteFillMeta;
    items.push({
      id: 'old-hq', kind: 'building', group: 'placed',
      pts: towerCorners(m.x, m.z, m.rot || 0, m.w, m.d),
    });
  } else {
    function addNamed(name, id) {
      let found = null;
      S.scene.traverse(o => { if (!found && o.name === name) found = o; });
      if (!found) return;
      found.updateMatrixWorld(true);
      const box = new S.THREE.Box3().setFromObject(found);
      if (box.max.y - box.min.y < 1.6) return;
      items.push({
        id, kind: 'building', group: 'placed',
        pts: boxCorners(box.min.x, box.min.z, box.max.x, box.max.z),
      });
    }
    addNamed('old-hq-block', 'old-hq');
  }

  if (window.__atom) {
    const a = window.__atom;
    // ATOM lot is a 6.6 m square in the plan renderer.
    const h = 3.3;
    items.push({
      id: 'atom', kind: 'building', group: 'placed',
      pts: boxCorners(a.x - h, a.z - h, a.x + h, a.z + h),
    });
  }

  // Procedural mega-towers: one axis-aligned shaft per S.megas record.
  if (S.megas && S.megas.length) {
    S.megas.forEach((m, i) => {
      const hw = (m.w || 8) / 2, hd = (m.d || 8) / 2;
      items.push({
        id: 'mega-' + i, kind: 'building', group: 'placed',
        pts: boxCorners(m.x - hw, m.z - hd, m.x + hw, m.z + hd),
      });
    });
  }

  // Relocated / leftover west-plot buildings we parented to a group.
  if (window.__relocatedWest) {
    window.__relocatedWest.updateMatrixWorld(true);
    let i = 0;
    window.__relocatedWest.children.forEach(ch => {
      const box = new S.THREE.Box3().setFromObject(ch);
      if (box.max.y - box.min.y < 1.0) return;
      items.push({
        id: 'relocated-' + (ch.name || i++),
        kind: 'building', group: 'placed',
        pts: boxCorners(box.min.x, box.min.z, box.max.x, box.max.z),
      });
    });
  }

  // City GLB meshes are large combined chunks; their AABBs are useless
  // as footprints. They are rasterized into a 2D occupancy grid instead
  // (see buildCityGrid) and tested against placed buildings and ways.
  items.forEach(it => { it.aabb = aabbOf(it.pts); });
  return items;
}

function collectWays() {
  const ways = [];
  const orange = window.__ORANGE || window.__hwyMeta;
  if (orange && orange.pts) {
    const loop = orange.pts.map(p => ({ x: p.x, z: p.z }));
    loop.push({ x: orange.pts[0].x, z: orange.pts[0].z });
    const w = orange.width || 5.6;
    ways.push({ id: 'highway-loop', kind: 'highway', pts: loop, width: w });
    (orange.ramps || []).forEach(rp => {
      if (!rp.road || rp.id === 'OVERLAP' || rp.road.length < 2) return;
      ways.push({
        id: 'ramp-' + rp.id,
        kind: 'highway',
        pts: rp.road.map(p => ({ x: p[0], z: p[1] })),
        width: rp.w || 4.2,
      });
    });
  } else if (window.__highway && window.__highway.length > 2) {
    const pts = window.__highway.map(p => ({ x: p.x, z: p.z }));
    pts.push({ x: window.__highway[0].x, z: window.__highway[0].z });
    ways.push({ id: 'highway-loop', kind: 'highway', pts, width: 5.6 });
  }

  // Ground streets from the authored lanes (typical carriageway ~6.5 m).
  const streets = window.__streets;
  if (streets && streets.lanes) {
    for (const [name, lane] of Object.entries(streets.lanes)) {
      if (!lane || lane.length < 2) continue;
      if (/air/i.test(name)) continue;
      ways.push({
        id: 'street-' + name,
        kind: 'road',
        pts: lane.map(p => ({ x: p.x, z: p.z })),
        width: 6.5,
      });
    }
  }

  // Procedural planRoad planes (our access avenue, etc.) as short OBBs.
  if (S.scene) {
    let i = 0;
    const hwGroup = window.__hwGroup;
    S.scene.traverse(o => {
      if (!o.isMesh || o.userData.planRoad !== 'road') return;
      // Highway decks are tagged planRoad but tested as polylines, and their
      // world AABB covers half the city.
      if (hwGroup) {
        let n = o;
        while (n) { if (n === hwGroup) return; n = n.parent; }
      }
      const box = new S.THREE.Box3().setFromObject(o);
      const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
      if (w * d < 4 || w * d > 80 || Math.max(w, d) > 28) return;
      ways.push({
        id: 'plan-road-' + i++,
        kind: 'road',
        pts: boxCorners(box.min.x, box.min.z, box.max.x, box.max.z),
        width: 0, // already an area, tested as a polygon
        areaPts: boxCorners(box.min.x, box.min.z, box.max.x, box.max.z),
      });
    });
  }

  // Elevated railway: any visible mesh whose name looks like a rail, or a
  // long thin elevated structure tagged as such. The current city has no
  // separate rail polyline; if we find named meshes we treat them as
  // building-like footprints with kind 'rail'.
  if (window.__city) {
    window.__city.traverse(o => {
      if (!o.isMesh || !o.visible) return;
      const n = (o.name || '') + ' ' + ((o.parent && o.parent.name) || '');
      if (!/rail|track|train|metro/i.test(n)) return;
      const fp = meshFootprint(o);
      if (!fp) return;
      ways.push({ id: 'rail-' + o.name, kind: 'rail', pts: fp.pts, width: 0, areaPts: fp.pts });
    });
  }
  return ways;
}

function aabbHit(a, b, pad) {
  return a.minX < b.maxX + pad && a.maxX > b.minX - pad &&
    a.minZ < b.maxZ + pad && a.maxZ > b.minZ - pad;
}


const CELL = 0.5;
const GRID_X0 = -80, GRID_Z0 = -80, GRID_X1 = 80, GRID_Z1 = 130;

function gridSize() {
  return {
    cols: Math.ceil((GRID_X1 - GRID_X0) / CELL),
    rows: Math.ceil((GRID_Z1 - GRID_Z0) / CELL),
  };
}

function stampCell(grid, cols, rows, x, z, tag) {
  const c = Math.floor((x - GRID_X0) / CELL);
  const r = Math.floor((z - GRID_Z0) / CELL);
  if (c < 0 || r < 0 || c >= cols || r >= rows) return;
  grid[r * cols + c] = tag;
}

function stampTriangle(grid, cols, rows, ax, az, bx, bz, cx, cz, tag) {
  const minX = Math.min(ax, bx, cx), maxX = Math.max(ax, bx, cx);
  const minZ = Math.min(az, bz, cz), maxZ = Math.max(az, bz, cz);
  const c0 = Math.max(0, Math.floor((minX - GRID_X0) / CELL));
  const c1 = Math.min(cols - 1, Math.floor((maxX - GRID_X0) / CELL));
  const r0 = Math.max(0, Math.floor((minZ - GRID_Z0) / CELL));
  const r1 = Math.min(rows - 1, Math.floor((maxZ - GRID_Z0) / CELL));
  const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  if (Math.abs(area) < 1e-8) return;
  for (let r = r0; r <= r1; r++) {
    const z = GRID_Z0 + (r + 0.5) * CELL;
    for (let c = c0; c <= c1; c++) {
      const x = GRID_X0 + (c + 0.5) * CELL;
      const w0 = ((bx - ax) * (z - az) - (bz - az) * (x - ax));
      const w1 = ((cx - bx) * (z - bz) - (cz - bz) * (x - bx));
      const w2 = ((ax - cx) * (z - cz) - (az - cz) * (x - cx));
      if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
        grid[r * cols + c] = tag;
      }
    }
  }
}

function stampPolyline(grid, cols, rows, pts, halfW, tag) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L * halfW, nz = dx / L * halfW;
    const q = [
      { x: a.x + nx, z: a.z + nz }, { x: a.x - nx, z: a.z - nz },
      { x: b.x - nx, z: b.z - nz }, { x: b.x + nx, z: b.z + nz },
    ];
    stampTriangle(grid, cols, rows, q[0].x, q[0].z, q[1].x, q[1].z, q[2].x, q[2].z, tag);
    stampTriangle(grid, cols, rows, q[0].x, q[0].z, q[2].x, q[2].z, q[3].x, q[3].z, tag);
  }
}

function buildCityGrid() {
  const { cols, rows } = gridSize();
  const grid = new Uint8Array(cols * rows);
  if (!window.__city) return { grid, cols, rows, cells: 0 };
  window.__city.updateMatrixWorld(true);
  const vA = new S.THREE.Vector3(), vB = new S.THREE.Vector3(), vC = new S.THREE.Vector3();
  window.__city.traverse(o => {
    if (!o.isMesh || !o.visible || o.userData.planHide || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    const pos = o.geometry.attributes.position;
    const idx = o.geometry.index;
    const triCount = idx ? (idx.count / 3) : (pos.count / 3);
    const mw = o.matrixWorld;
    for (let t = 0; t < triCount; t++) {
      const ia = t * 3, ib = ia + 1, ic = ia + 2;
      const a = idx ? idx.getX(ia) : ia;
      const b = idx ? idx.getX(ib) : ib;
      const c0 = idx ? idx.getX(ic) : ic;
      vA.fromBufferAttribute(pos, a).applyMatrix4(mw);
      vB.fromBufferAttribute(pos, b).applyMatrix4(mw);
      vC.fromBufferAttribute(pos, c0).applyMatrix4(mw);
      const maxY = Math.max(vA.y, vB.y, vC.y), minY = Math.min(vA.y, vB.y, vC.y);
      if (maxY - minY < 1.2 && maxY < 2.0) continue; // ground / road slabs
      if (maxY < 1.6) continue;
      stampTriangle(grid, cols, rows, vA.x, vA.z, vB.x, vB.z, vC.x, vC.z, 1);
    }
  });
  let cells = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i]) cells++;
  return { grid, cols, rows, cells };
}

function obbGridHits(grid, cols, rows, pts) {
  const aabb = aabbOf(pts);
  const c0 = Math.max(0, Math.floor((aabb.minX - GRID_X0) / CELL));
  const c1 = Math.min(cols - 1, Math.floor((aabb.maxX - GRID_X0) / CELL));
  const r0 = Math.max(0, Math.floor((aabb.minZ - GRID_Z0) / CELL));
  const r1 = Math.min(rows - 1, Math.floor((aabb.maxZ - GRID_Z0) / CELL));
  let n = 0;
  for (let r = r0; r <= r1; r++) {
    const z = GRID_Z0 + (r + 0.5) * CELL;
    for (let c = c0; c <= c1; c++) {
      if (!grid[r * cols + c]) continue;
      const x = GRID_X0 + (c + 0.5) * CELL;
      if (pointInConvex(pts, x, z)) n++;
    }
  }
  return n;
}

function polylineGridHits(grid, cols, rows, pts, halfW) {
  let n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const L = Math.hypot(dx, dz) || 1;
    const steps = Math.max(1, Math.ceil(L / CELL));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = a.x + dx * t, z = a.z + dz * t;
      // sample a few points across the width
      const nx = -dz / L, nz = dx / L;
      for (const s of [-1, 0, 1]) {
        const px = x + nx * s * halfW * 0.8, pz = z + nz * s * halfW * 0.8;
        const c = Math.floor((px - GRID_X0) / CELL);
        const r = Math.floor((pz - GRID_Z0) / CELL);
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        if (grid[r * cols + c]) n++;
      }
    }
  }
  return n;
}

S.checkOverlaps = function checkOverlaps() {
  if (S.scene) S.scene.updateMatrixWorld(true);
  const buildings = collectBuildings();
  const ways = collectWays();
  const cityGrid = buildCityGrid();
  const overlaps = [];

  function report(a, b, kind, extra) {
    if (extra.area != null && extra.area < AREA_MIN && (extra.pen || 0) < PEN_MIN) return;
    overlaps.push({
      a: a.id, b: b.id, kind,
      pen: +(extra.pen || 0).toFixed(3),
      area: +((extra.area || 0)).toFixed(2),
    });
  }

  // Building vs building: placed vs placed, and placed vs city.
  // Skip city vs city (authored).
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const A = buildings[i], B = buildings[j];
      if (A.group === 'city' && B.group === 'city') continue;
      if (!aabbHit(A.aabb, B.aabb, 0.5)) continue;
      const r = satOverlap(A.pts, B.pts);
      if (r.hit) report(A, B, 'building-building', r);
    }
  }

  // Buildings vs ways.
  for (const bld of buildings) {
    for (const way of ways) {
      // Ramp terminals and streets may share asphalt at junctions.
      // Buildings must still clear them. Roads we added under the
      // drop-off must meet the site at the edge, not under the slab:
      // any OBB intersection deeper than EPS is a fail.
      if (way.areaPts) {
        const wAabb = aabbOf(way.areaPts);
        if (!aabbHit(bld.aabb, wAabb, (way.width || 0) / 2 + 0.5)) continue;
        const r = satOverlap(bld.pts, way.areaPts);
        if (r.hit) report(bld, way, 'building-' + way.kind, r);
      } else {
        // Expand AABB by half width for a cheap reject.
        const pad = (way.width || 0) / 2 + 0.5;
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (const p of way.pts) {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }
        const wAabb = { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad };
        if (!aabbHit(bld.aabb, wAabb, 0)) continue;
        const r = obbVsPolyline(bld.pts, way.pts, (way.width || 0) / 2);
        if (r.hit) report(bld, way, 'building-' + way.kind, { pen: r.pen, area: r.pen * 1.0 });
      }
    }
  }

  // Placed buildings and highway/roads vs the city occupancy grid.
  for (const bld of buildings) {
    const n = obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, bld.pts);
    if (n >= 2) { // two 0.5 m cells ≈ 0.5 m²
      overlaps.push({
        a: bld.id, b: 'city-grid', kind: 'building-city',
        pen: +(Math.sqrt(n) * CELL).toFixed(3),
        area: +(n * CELL * CELL).toFixed(2),
        cells: n,
      });
    }
  }
  for (const way of ways) {
    if (way.kind !== 'highway' && way.kind !== 'rail') continue;
    const half = (way.width || 0) / 2;
    const n = way.areaPts
      ? obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, way.areaPts)
      : polylineGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, way.pts, half);
    if (n >= 3) {
      overlaps.push({
        a: 'city-grid', b: way.id, kind: 'city-' + way.kind,
        pen: +(Math.sqrt(n) * CELL).toFixed(3),
        area: +(n * CELL * CELL).toFixed(2),
        cells: n,
      });
    }
  }

  const hHits = overlaps.filter(o => o.a === 'h-tower' || o.b === 'h-tower');
  const result = {
    ok: hHits.length === 0,
    cityOk: overlaps.length === 0,
    overlaps: overlaps.length,
    hTowerOverlaps: hHits.length,
    buildings: buildings.length,
    ways: ways.length,
    cityCells: cityGrid.cells,
    items: overlaps,
  };
  window.__overlapReport = result;
  return result;
};





S.searchAspect = function searchAspect(opts) {
  opts = opts || {};
  const rot0 = opts.rot0 != null ? opts.rot0 : 138;
  const rots = opts.rots || [rot0];
  const fws = opts.fws || [];
  const fds = opts.fds || [];
  const spanX0 = opts.x0 != null ? opts.x0 : 4;
  const spanX1 = opts.x1 != null ? opts.x1 : 12;
  const spanZ0 = opts.z0 != null ? opts.z0 : -4;
  const spanZ1 = opts.z1 != null ? opts.z1 : 4;
  const posStep = opts.posStep || 0.25;
  const insideOrig = opts.insideOrig !== false;
  if (S.scene) S.scene.updateMatrixWorld(true);
  const buildings = collectBuildings().filter(b => b.id !== 'h-tower');
  const ways = collectWays();
  const cityGrid = buildCityGrid();
  const orig = towerCorners(0, 0, 138, 22, 14);

  function hitsFor(tx, tz, rot, fw, fd) {
    const pts = towerCorners(tx, tz, rot, fw, fd);
    const aabb = aabbOf(pts);
    const hits = [];
    for (const B of buildings) {
      if (!aabbHit(aabb, B.aabb, 0.5)) continue;
      const r = satOverlap(pts, B.pts);
      if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) return ['b'];
    }
    for (const way of ways) {
      if (way.areaPts) {
        const wAabb = aabbOf(way.areaPts);
        if (!aabbHit(aabb, wAabb, (way.width || 0) / 2 + 0.5)) continue;
        const r = satOverlap(pts, way.areaPts);
        if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) return ['w'];
      } else {
        const pad = (way.width || 0) / 2 + 0.5;
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (const p of way.pts) {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }
        if (!aabbHit(aabb, { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad }, 0)) continue;
        const r = obbVsPolyline(pts, way.pts, (way.width || 0) / 2);
        if (r.hit) return ['w'];
      }
    }
    const n = obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, pts);
    if (n >= 2) return ['c', n];
    return [];
  }

  let best = null;
  const tops = [];
  for (const rot of rots) {
    for (const fw of fws) {
      for (const fd of fds) {
        if (fw * fd < 40) continue;
        for (let tx = spanX0; tx <= spanX1 + 1e-9; tx = +(tx + posStep).toFixed(3)) {
          for (let tz = spanZ0; tz <= spanZ1 + 1e-9; tz = +(tz + posStep).toFixed(3)) {
            if (insideOrig && !pointInConvex(orig, tx, tz)) continue;
            const hits = hitsFor(tx, tz, rot, fw, fd);
            if (hits.length) continue;
            const rec = { tx, tz, rot, fw, fd, area: +(fw * fd).toFixed(2), dist: +Math.hypot(tx, tz).toFixed(3) };
            if (!best || rec.area > best.area + 0.1 || (Math.abs(rec.area - best.area) < 0.1 && rec.dist < best.dist)) best = rec;
            tops.push(rec);
          }
        }
      }
    }
  }
  tops.sort((a, b) => b.area - a.area || a.dist - b.dist);
  const result = { best, tops: tops.slice(0, 25), nClear: tops.length };
  window.__aspectSearch = result;
  return result;
};

S.probeTower = function probeTower(tx, tz, k, rot) {
  rot = rot != null ? rot : (S.TOWER_ROT != null ? S.TOWER_ROT : 138);
  k = k == null ? (S.FOOTPRINT_SCALE || 1) : k;
  const fw0 = S.FW || 22, fd0 = S.FD || 14;
  if (S.scene) S.scene.updateMatrixWorld(true);
  const buildings = collectBuildings().filter(b => b.id !== 'h-tower');
  const ways = collectWays();
  const cityGrid = buildCityGrid();
  const pts = towerCorners(tx, tz, rot, fw0 * k, fd0 * k);
  const aabb = aabbOf(pts);
  const hits = [];
  for (const B of buildings) {
    if (!aabbHit(aabb, B.aabb, 0.5)) continue;
    const r = satOverlap(pts, B.pts);
    if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) hits.push({ b: B.id, kind: 'building-building', pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
  }
  for (const way of ways) {
    if (way.areaPts) {
      const wAabb = aabbOf(way.areaPts);
      if (!aabbHit(aabb, wAabb, (way.width || 0) / 2 + 0.5)) continue;
      const r = satOverlap(pts, way.areaPts);
      if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
    } else {
      const pad = (way.width || 0) / 2 + 0.5;
      let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
      for (const p of way.pts) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
      }
      if (!aabbHit(aabb, { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad }, 0)) continue;
      const r = obbVsPolyline(pts, way.pts, (way.width || 0) / 2);
      if (r.hit) hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +(r.pen).toFixed(2) });
    }
  }
  const n = obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, pts);
  if (n >= 2) hits.push({ b: 'city-grid', kind: 'building-city', pen: +(Math.sqrt(n) * CELL).toFixed(3), area: +(n * CELL * CELL).toFixed(2), cells: n });
  return { tx, tz, k, rot, fw: +(fw0*k).toFixed(3), fd: +(fd0*k).toFixed(3), hits, corners: pts };
};
S.searchTowerSite = function searchTowerSite(opts) {
  opts = opts || {};
  const rot = opts.rot != null ? opts.rot : (S.TOWER_ROT != null ? S.TOWER_ROT : 138);
  const fw0 = S.FW || 22, fd0 = S.FD || 14;
  const kMin = opts.kMin || 0.35;
  const kMax = opts.kMax != null ? opts.kMax : 1;
  const kStep = opts.kStep || 0.05;
  const span = opts.span != null ? opts.span : 12;
  const posStep = opts.posStep || 0.5;
  if (S.scene) S.scene.updateMatrixWorld(true);
  const buildings = collectBuildings().filter(b => b.id !== 'h-tower');
  const ways = collectWays();
  const cityGrid = buildCityGrid();

  function hitsFor(tx, tz, k) {
    const pts = towerCorners(tx, tz, rot, fw0 * k, fd0 * k);
    const aabb = aabbOf(pts);
    const hits = [];
    for (const B of buildings) {
      if (!aabbHit(aabb, B.aabb, 0.5)) continue;
      const r = satOverlap(pts, B.pts);
      if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) {
        hits.push({ b: B.id, kind: 'building-building', pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
      }
    }
    for (const way of ways) {
      if (way.areaPts) {
        const wAabb = aabbOf(way.areaPts);
        if (!aabbHit(aabb, wAabb, (way.width || 0) / 2 + 0.5)) continue;
        const r = satOverlap(pts, way.areaPts);
        if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) {
          hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
        }
      } else {
        const pad = (way.width || 0) / 2 + 0.5;
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (const p of way.pts) {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }
        if (!aabbHit(aabb, { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad }, 0)) continue;
        const r = obbVsPolyline(pts, way.pts, (way.width || 0) / 2);
        if (r.hit) hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +(r.pen).toFixed(2) });
      }
    }
    const n = obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, pts);
    if (n >= 2) {
      hits.push({ b: 'city-grid', kind: 'building-city', pen: +(Math.sqrt(n) * CELL).toFixed(3), area: +(n * CELL * CELL).toFixed(2), cells: n });
    }
    return hits;
  }

  const found = [];
  for (let k = kMax; k + 1e-9 >= kMin; k = +(k - kStep).toFixed(4)) {
    const locals = [];
    for (let tx = -span; tx <= span + 1e-9; tx = +(tx + posStep).toFixed(3)) {
      for (let tz = -span; tz <= span + 1e-9; tz = +(tz + posStep).toFixed(3)) {
        const hits = hitsFor(tx, tz, k);
        if (!hits.length) {
          const dist = Math.hypot(tx, tz);
          locals.push({ k: +k.toFixed(4), fw: +(fw0 * k).toFixed(3), fd: +(fd0 * k).toFixed(3), tx, tz, dist: +dist.toFixed(3) });
        }
      }
    }
    locals.sort((a, b) => a.dist - b.dist || a.tx * a.tx + a.tz * a.tz);
    if (locals.length) {
      found.push({ k: +k.toFixed(4), count: locals.length, best: locals[0], near: locals.slice(0, 8) });
      // Once we have a reasonably large k with a close pose, we can still
      // continue to list smaller k's best, but we already have what we need.
    }
  }
  const result = { rot, fw0, fd0, found, best: found[0] ? found[0].best : null };
  window.__siteSearch = result;
  return result;
};

S.scanTowerFit = function scanTowerFit(opts) {
  opts = opts || {};
  const kMin = opts.kMin || 0.2;
  const kMax = opts.kMax != null ? opts.kMax : 1;
  const step = opts.step || 0.02;
  const rot = S.TOWER_ROT != null ? S.TOWER_ROT : 138;
  const tx = S.TOWER_X || 0, tz = S.TOWER_Z || 0;
  const fw0 = S.FW || 22, fd0 = S.FD || 14;
  if (S.scene) S.scene.updateMatrixWorld(true);
  const buildings = collectBuildings().filter(b => b.id !== 'h-tower');
  const ways = collectWays();
  const cityGrid = buildCityGrid();
  const rows = [];
  let firstClear = null;
  for (let k = kMax; k + 1e-9 >= kMin; k = +(k - step).toFixed(4)) {
    const pts = towerCorners(tx, tz, rot, fw0 * k, fd0 * k);
    const aabb = aabbOf(pts);
    const hits = [];
    for (const B of buildings) {
      if (!aabbHit(aabb, B.aabb, 0.5)) continue;
      const r = satOverlap(pts, B.pts);
      if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) {
        hits.push({ b: B.id, kind: 'building-building', pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
      }
    }
    for (const way of ways) {
      if (way.areaPts) {
        const wAabb = aabbOf(way.areaPts);
        if (!aabbHit(aabb, wAabb, (way.width || 0) / 2 + 0.5)) continue;
        const r = satOverlap(pts, way.areaPts);
        if (r.hit && (r.area >= AREA_MIN || r.pen >= PEN_MIN)) {
          hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +r.area.toFixed(2) });
        }
      } else {
        const pad = (way.width || 0) / 2 + 0.5;
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (const p of way.pts) {
          if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
          if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }
        if (!aabbHit(aabb, { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad }, 0)) continue;
        const r = obbVsPolyline(pts, way.pts, (way.width || 0) / 2);
        if (r.hit) hits.push({ b: way.id, kind: 'building-' + way.kind, pen: +r.pen.toFixed(3), area: +(r.pen).toFixed(2) });
      }
    }
    const n = obbGridHits(cityGrid.grid, cityGrid.cols, cityGrid.rows, pts);
    if (n >= 2) {
      hits.push({ b: 'city-grid', kind: 'building-city', pen: +(Math.sqrt(n) * CELL).toFixed(3), area: +(n * CELL * CELL).toFixed(2), cells: n });
    }
    const row = { k: +k.toFixed(4), fw: +(fw0 * k).toFixed(3), fd: +(fd0 * k).toFixed(3), hits: hits.length, items: hits };
    rows.push(row);
    if (!hits.length && !firstClear) firstClear = row;
  }
  const result = {
    rot, tx, tz, fw0, fd0,
    firstClear,
    rows,
  };
  window.__fitReport = result;
  return result;
};

if (typeof window !== 'undefined') {
  window.__checkOverlaps = S.checkOverlaps;
  window.__scanTowerFit = S.scanTowerFit;
  window.__searchTowerSite = S.searchTowerSite;
  window.__probeTower = S.probeTower;
  window.__searchAspect = S.searchAspect;
  window.__towerCorners = function () {
    const tw = worldTower();
    return towerCorners(tw.tx, tw.tz, tw.rot, tw.fw, tw.fd);
  };
}

export { towerCorners };
