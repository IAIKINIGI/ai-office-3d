import { S } from './scope.js';


S.buildOrangeHighway = function buildOrangeHighway() {
  if (window.__orangeBuilt) return;
  window.__orangeBuilt = true;
  const spec = window.__ORANGE;
  if (!spec) return;
  const H = spec.height;
  const group = new S.THREE.Group();
  group.name = 'highway';
  window.__hwGroup = group;
  S.scene.add(group);
  const deckMat = new S.THREE.MeshStandardMaterial({ map: S.asphaltMap(), color: 0xffffff, roughness: 0.9, metalness: 0.03, side: S.THREE.DoubleSide });
  const railMat = new S.THREE.MeshStandardMaterial({ color: 0x8b95a6, metalness: 0.35, roughness: 0.55 });
  const roadMat = new S.THREE.MeshStandardMaterial({ map: S.asphaltMap(), color: 0xffffff, roughness: 0.93, metalness: 0.02 });
  const walkMat = new S.THREE.MeshStandardMaterial({ map: S.pavingMap(), color: 0xffffff, roughness: 0.92, metalness: 0.02 });
  const pts = spec.pts.map(p => ({ x: p.x, z: p.z, w: p.w || 5.6 }));
  const n = pts.length;
  const guideMat = new S.THREE.MeshStandardMaterial({ color: 0xb7c0ca, roughness: 0.62, metalness: 0.08 });
  const parapetMat = new S.THREE.MeshStandardMaterial({ color: 0xd5dbe3, roughness: 0.5, metalness: 0.12 });
  const markMat = new S.THREE.MeshStandardMaterial({ color: 0xf4f1e4, roughness: 0.45, metalness: 0 });
  const yelMat = new S.THREE.MeshStandardMaterial({ color: 0xe0b03a, roughness: 0.45, metalness: 0 });
  function framesOf(samples, closed) {
    const m = samples.length;
    const R = [];
    let prev = null;
    for (let i = 0; i < m; i++) {
      const a = closed ? samples[(i - 1 + m) % m] : samples[Math.max(0, i - 1)];
      const b = closed ? samples[(i + 1) % m] : samples[Math.min(m - 1, i + 1)];
      let dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
      let rx = dz / L, rz = -dx / L;
      if (prev && rx * prev.x + rz * prev.z < 0) { rx = -rx; rz = -rz; }
      prev = { x: rx, z: rz };
      R.push(prev);
    }
    if (closed && R.length > 2 && R[0].x * R[R.length - 1].x + R[0].z * R[R.length - 1].z < 0) {
      for (const r of R) { r.x = -r.x; r.z = -r.z; }
    }
    return R;
  }
  function buildGuideway(samples, opt) {
    const closed = !!opt.closed;
    const m = samples.length;
    const R = framesOf(samples, closed);
    const width = opt.width;
    const half = width / 2;
    const topPos = [], topNor = [], topIdx = [];
    const bodyPos = [], bodyNor = [], bodyIdx = [];
    const emit = (bucket, quad, hint) => {
      let q = quad;
      const a = q[0], b = q[1], c = q[2];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) {
        q = [quad[0], quad[3], quad[2], quad[1]];
        nx = -nx; ny = -ny; nz = -nz;
      }
      const ln = Math.hypot(nx, ny, nz) || 1;
      nx /= ln; ny /= ln; nz /= ln;
      const pos = bucket[0], nor = bucket[1], idx = bucket[2];
      const base = pos.length / 3;
      for (const p of q) { pos.push(p[0], p[1], p[2]); nor.push(nx, ny, nz); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const topB = [topPos, topNor, topIdx];
    const bodyB = [bodyPos, bodyNor, bodyIdx];
    const last = closed ? m : m - 1;
    const edge = (p, r, s, y) => [p.x + r.x * s, y, p.z + r.z * s];
    for (let i = 0; i < last; i++) {
      const j = (i + 1) % m;
      const pi = samples[i], pj = samples[j];
      const ri = R[i], rj = R[j];
      const thi = pi.th != null ? pi.th : 0.62;
      const thj = pj.th != null ? pj.th : 0.62;
      const phi = pi.ph != null ? pi.ph : 0.86;
      const phj = pj.ph != null ? pj.ph : 0.86;
      const pt = 0.18;
      const iL = edge(pi, ri, -half, pi.y), iR = edge(pi, ri, half, pi.y);
      const jL = edge(pj, rj, -half, pj.y), jR = edge(pj, rj, half, pj.y);
      const iLb = edge(pi, ri, -half, pi.y - thi), iRb = edge(pi, ri, half, pi.y - thi);
      const jLb = edge(pj, rj, -half, pj.y - thj), jRb = edge(pj, rj, half, pj.y - thj);
      emit(topB, [iL, jL, jR, iR], [0, 1, 0]);
      emit(bodyB, [iLb, iRb, jRb, jLb], [0, -1, 0]);
      emit(bodyB, [iL, iLb, jLb, jL], [-ri.x, 0, -ri.z]);
      emit(bodyB, [iR, jR, jRb, iRb], [ri.x, 0, ri.z]);
      const wall = (sign) => {
        if (phi < 0.05 && phj < 0.05) return;
        const o = sign * half;
        const inn = o - sign * pt;
        const iO0 = edge(pi, ri, o, pi.y), iO1 = edge(pi, ri, o, pi.y + phi);
        const iI0 = edge(pi, ri, inn, pi.y), iI1 = edge(pi, ri, inn, pi.y + phi);
        const jO0 = edge(pj, rj, o, pj.y), jO1 = edge(pj, rj, o, pj.y + phj);
        const jI0 = edge(pj, rj, inn, pj.y), jI1 = edge(pj, rj, inn, pj.y + phj);
        const outN = [sign * ri.x, 0, sign * ri.z];
        emit(bodyB, [iO0, jO0, jO1, iO1], outN);
        emit(bodyB, [iI0, iI1, jI1, jI0], [-outN[0], 0, -outN[2]]);
        emit(bodyB, [iO1, jO1, jI1, iI1], [0, 1, 0]);
        emit(bodyB, [iO0, iI0, jI0, jO0], [0, -1, 0]);
      };
      wall(-1);
      wall(1);
    }
    const geo = (pos, nor, idx) => {
      const g = new S.THREE.BufferGeometry();
      g.setAttribute('position', new S.THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new S.THREE.Float32BufferAttribute(nor, 3));
      g.setIndex(idx);
      return g;
    };
    return {
      top: geo(topPos, topNor, topIdx),
      body: geo(bodyPos, bodyNor, bodyIdx),
      frames: R,
    };
  }
  function addWay(samples, opt) {
    const built = buildGuideway(samples, opt);
    const top = new S.THREE.Mesh(built.top, deckMat);
    top.userData.planRoad = 'road';
    const body = new S.THREE.Mesh(built.body, guideMat);
    body.userData.planRoad = 'road';
    group.add(top, body);
    const parapet = new S.THREE.Mesh(built.body, parapetMat);
    // body already includes parapet; one concrete material is enough
    return built.frames;
  }
  const ringSamples = pts.map(p => ({ x: p.x, z: p.z, y: H, th: 0.62, ph: 0.86 }));
  const ringFrames = addWay(ringSamples, { closed: true, width: pts[0].w || 5.6 });
  let yLo = Infinity, yHi = -Infinity;
  ringSamples.forEach(p => { yLo = Math.min(yLo, p.y); yHi = Math.max(yHi, p.y); });
  window.__deckLevel = { top: H, min: yLo, max: yHi, dev: +(yHi - yLo).toFixed(3) };
  console.info('[highway] deck Y', window.__deckLevel);
  const dashMat = markMat;
  function laneMarks(samples, frames, closed) {
    const m = samples.length;
    const last = closed ? m : m - 1;
    let along = 0;
    for (let i = 0; i < last; i++) {
      const j = (i + 1) % m;
      const dx = samples[j].x - samples[i].x, dz = samples[j].z - samples[i].z;
      const step = Math.hypot(dx, dz) || 1;
      const yaw = Math.atan2(dx, dz);
      if (Math.floor(along / 4) !== Math.floor((along + step) / 4)) {
        const dash = S.box(0.16, 0.025, Math.min(2.0, step * 0.7), dashMat, samples[i].x, samples[i].y + 0.03, samples[i].z, group);
        dash.rotation.y = yaw;
        dash.userData.planRoad = 'mark';
      }
      for (const side of [-1, 1]) {
        const r = frames[i];
        const inset = (samples[i].w || optWidth(samples)) / 2 - 0.45;
        const yel = S.box(0.1, 0.02, Math.min(step + 0.05, step), yelMat, samples[i].x + r.x * inset * side, samples[i].y + 0.025, samples[i].z + r.z * inset * side, group);
        yel.rotation.y = yaw;
        yel.userData.planRoad = 'mark';
      }
      along += step;
    }
  }
  function optWidth(samples) { return samples[0] && samples[0].w ? samples[0].w : 5.6; }
  ringSamples.forEach((p, i) => { p.w = pts[i].w || 5.6; });
  laneMarks(ringSamples, ringFrames, true);
  let along = 0, nextPillar = 0, ringPillarN = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const step = Math.hypot(pts[j].x - pts[i].x, pts[j].z - pts[i].z);
    if (along >= nextPillar) {
      const ph = H - 0.62;
      const pillar = S.box(1.15, ph, 1.15, railMat, pts[i].x, ph / 2, pts[i].z, group);
      pillar.userData.planRoad = 'road';
      // Pier on every support. A real light only on every 6th.
      if ((ringPillarN++ % 6) === 0) {
        const lamp = new S.THREE.PointLight(0xfff1d0, 10, 22, 2);
        lamp.position.set(pts[i].x, H + 1.2, pts[i].z);
        group.add(lamp);
      }
      nextPillar += 24;
    }
    along += step;
  }
  const sidewalks = [];
  function groundRoad(path, half) {
    if (path.length < 2) return;
    const rp = path.map(p => ({ x: p[0], z: p[1], w: half * 2, y: 0.08 }));
    const mesh = new S.THREE.Mesh(S.varRibbon(rp, () => 0.08, false), roadMat);
    mesh.userData.planRoad = 'road';
    S.scene.add(mesh);
  }
  spec.ramps.forEach((ramp) => {
    const road = ramp.road;
    const rw = ramp.w || 4.2;
    if (!ramp.pair || road.length < 2) {
      if (road.length >= 2) groundRoad(road, rw / 2);
      return;
    }
    const cum = [0];
    for (let i = 1; i < road.length; i++) cum.push(cum[i - 1] + Math.hypot(road[i][0] - road[i - 1][0], road[i][1] - road[i - 1][1]));
    const total = Math.max(cum[cum.length - 1], 0.01);
    const merge = Math.min(10, total * 0.08);
    const slope = Math.max(total - merge, 1);
    const grade = (H - 0.12) / slope;
    const samples = road.map((p, i) => {
      const along = cum[i];
      const drop = Math.max(0, along - merge) * grade;
      const y = Math.max(0.12, H - drop);
      const distEnd = total - along;
      const feather = Math.min(1, distEnd / 16);
      return { x: p[0], z: p[1], y, th: 0.05 + 0.57 * feather, ph: 0.86 * Math.min(1, distEnd / 18), w: rw };
    });
    const frames = addWay(samples, { closed: false, width: rw });
    laneMarks(samples, frames, false);
    let pAlong = 0, nextP = 8;
    for (let i = 1; i < samples.length; i++) {
      pAlong += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
      const soffit = samples[i].y - samples[i].th;
      if (pAlong >= nextP && soffit > 1.3) {
        const pier = S.box(0.7, soffit, 0.7, railMat, samples[i].x, soffit / 2, samples[i].z, group);
        pier.userData.planRoad = 'road';
        nextP += 18;
      }
    }
    const lit = samples[Math.max(1, Math.floor(samples.length * 0.35))];
    const glow = new S.THREE.PointLight(0xfff1d0, 46, 60, 1.6);
    glow.position.set(lit.x, lit.y + 5, lit.z);
    group.add(glow);
    const toe = samples[samples.length - 1];
    const toeLight = new S.THREE.PointLight(0xffe6c2, 28, 36, 1.7);
    toeLight.position.set(toe.x, 4.5, toe.z);
    group.add(toeLight);
  });

  if (sidewalks[0]) window.__sidewalkLoop = sidewalks[0];
  const route = pts.map(p => ({ x: p.x, y: H + 0.08, z: p.z }));
  for (let i = 0; i < 4; i++) {
    const g = new S.THREE.Group();
    const body = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.8, 0.5, 4.0), S.M(i % 2 ? 0x241820 : 0x142028, { metalness: 0.55, roughness: 0.4 }));
    body.position.y = 0.55;
    const cab = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.5, 0.38, 1.6), S.M(0x0c1018, { roughness: 0.2, metalness: 0.2 }));
    cab.position.set(0, 0.95, -0.15);
    [-0.55, 0.55].forEach(x => {
      const head = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.26, 0.12, 0.08), S.E(0xe8fbff, 2.4));
      head.position.set(x, 0.48, 1.95);
      const tail = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.32, 0.1, 0.06), S.E(0xff2438, 2.2));
      tail.position.set(x, 0.46, -1.95);
      g.add(head, tail);
    });
    g.add(body, cab);
    S.scene.add(g);
    S.cars.push({ g, route, routeSpeed: 0.04 + i * 0.006, u: i / 4, yaw0: 0, hoverHeight: null, fly: false });
  }
  window.__highway = pts;
  window.__hwyMeta = spec;
  console.info('[highway] orange loop', pts.length, 'minClear', spec.minClear, 'ramps', spec.ramps.length);
}

export function initHighway() {

}

