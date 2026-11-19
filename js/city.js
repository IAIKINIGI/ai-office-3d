import { S } from './scope.js';
import './overlap-check.js';


S.facadeMat = function facadeMat(tintIdx, rx, ry) {
  const fac = S.texFacade.clone(); fac.needsUpdate = true;
  fac.wrapS = fac.wrapT = S.THREE.RepeatWrapping;
  fac.repeat.set(rx, ry); fac.offset.set(S.rng() * 2, S.rng() * 2);
  // dark facade — texture only as crushed emissive windows, never a bright flat plane
  return new S.THREE.MeshStandardMaterial({
    color: 0x080a10,
    map: null,
    emissive: new S.THREE.Color(0x152030),
    emissiveMap: fac,
    emissiveIntensity: 0.45,
    roughness: 0.42, metalness: 0.72
  });
}


S.addNeonSign = function addNeonSign(x, y, z, idx) {
  const list = window.__neons || (window.__neons = []);
  for (const p of list) if (Math.hypot(p.x - x, p.y - y, p.z - z) < 8) return;
  const mat = new S.THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: true, alphaTest: 0.18,
    toneMapped: false, side: S.THREE.DoubleSide,
  });
  const plane = new S.THREE.Mesh(new S.THREE.PlaneGeometry(S.NEON_W, S.NEON_H), mat);
  plane.position.set(x, y, z);
  plane.rotation.y = 0;
  S.megaGroup.add(plane); S.neonFlickers.push(plane);
  S.neonSlots.push({ mesh: plane, idx: idx % 6 });
  list.push({ x, y, z, h: S.NEON_H, idx: idx % 6 });
}


S.commitNeon = function commitNeon() {
  const img = S.texNeonSheet.image;
  if (!img || !img.width) return false;
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const im = ctx.getImageData(0, 0, c.width, c.height);
  const px = im.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    px[i + 3] = lum < 18 ? 0 : Math.min(255, (lum - 18) * 1.45);
  }
  ctx.putImageData(im, 0, 0);
  const sheet = new S.THREE.CanvasTexture(c);
  sheet.colorSpace = S.THREE.SRGBColorSpace;
  sheet.needsUpdate = true;
  const crops = [];
  for (let i = 0; i < 6; i++) crops.push(S.cropSheet(sheet, i / 6 + 0.02, 0.035, (i + 1) / 6 - 0.02, 0.965));
  for (const slot of S.neonSlots) {
    slot.mesh.material.map = crops[slot.idx];
    slot.mesh.material.opacity = 1;
    slot.mesh.material.needsUpdate = true;
    slot.mesh.userData.ready = true;
  }
  return true;
}


S.addBillboard = function addBillboard(x, y, z, rotY, idx, w = 10, h = 5.5) {
  const crop = S.billCrops[idx % 4];
  const plane = new S.THREE.Mesh(
    new S.THREE.PlaneGeometry(w, h),
    new S.THREE.MeshBasicMaterial({ map: crop, transparent: true, blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: S.THREE.DoubleSide })
  );
  plane.position.set(x, y, z); plane.rotation.y = rotY; S.megaGroup.add(plane);
}


/** Irregular Corpo megatower: stepped setbacks, antennas, pipes, AC, neon, rooftop ads */
S.makeMega = function makeMega(x, z, h, w0, d0, tintIdx, depth) {
  const face = x >= 0 ? -1 : 1;
  const ec = tintIdx % 2 ? 0x00f0ff : 0xff2a6d;
  // base shaft
  let y = 0, w = w0, d = d0;
  const steps = 3 + ((S.rng() * 3) | 0); // 3–5 dramatic setbacks
  for (let s = 0; s < steps; s++) {
    const segH = h * (s === 0 ? 0.45 + S.rng() * 0.15 : (0.55 / (steps - 1)) * (0.7 + S.rng() * 0.5));
    const mat = S.facadeMat(tintIdx + s, Math.max(1.2, w / 7), Math.max(1.8, segH / 12));
    const m = S.box(w, segH, d, mat, x, y + segH / 2, z, S.megaGroup);
    m.castShadow = false;
    // neon edge strip
    S.box(0.16, segH, 0.16, S.E(ec, 1.6), x + face * (w / 2), y + segH / 2, z + d / 2, S.megaGroup);
    S.box(0.1, segH, 0.1, S.E(ec === 0x00f0ff ? 0xff2a6d : 0x00f0ff, 1.0), x - face * (w / 2), y + segH / 2, z - d / 2, S.megaGroup);
    // exposed pipes
    for (let p = 0; p < (2 + ((S.rng() * 2) | 0)); p++) {
      const px = x + (S.rng() - 0.5) * w * 0.7, pz = z + d / 2 + 0.35;
      S.box(0.18, segH * (0.4 + S.rng() * 0.5), 0.18, S.M(0x2a3040, { metalness: 0.8, roughness: 0.35 }), px, y + segH * 0.4, pz, S.megaGroup);
    }
    // AC units on facade
    for (let a = 0; a < 3; a++) {
      const ay = y + 2 + S.rng() * (segH - 4);
      S.box(1.1, 0.7, 0.55, S.M(0x3a4050, { metalness: 0.6 }), x + face * (w / 2 + 0.3), ay, z + (S.rng() - 0.5) * d * 0.6, S.megaGroup);
    }
    y += segH;
    w *= 0.58 + S.rng() * 0.12; d *= 0.62 + S.rng() * 0.1;
  }
  // crown / antenna forest — go out of frame
  const crownH = 16 + S.rng() * 28;
  S.box(w * 1.05, 1.2, d * 1.05, S.M(0x1a2030, { metalness: 0.7 }), x, y + 0.6, z, S.megaGroup);
  for (let a = 0; a < (3 + ((S.rng() * 3) | 0)); a++) {
    const ah = crownH * (0.5 + S.rng());
    S.box(0.25 + S.rng() * 0.2, ah, 0.25, S.M(0x555a70, { metalness: 0.85 }), x + (S.rng() - 0.5) * w, y + ah / 2, z + (S.rng() - 0.5) * d, S.megaGroup);
    if (S.rng() > 0.4) S.blinkers.push(S.glow(S.GLOW.red, x + (S.rng() - 0.5) * w * 0.5, y + ah, z, 2.2, 2.2, 0.85));
  }
  // One street-facing banner on the near face of the base. The old second
  // banner shared this corner; rng() stays so the rest of the city does not move.
  if (depth <= 1) {
    S.addNeonSign(x + face * w0 * 0.18, 13.2 + (tintIdx % 3) * 1.6, z + d0 / 2 + 0.7, tintIdx + depth);
    S.rng();
  }
  // rooftop + mid billboards
  if (depth <= 1 || S.rng() > 0.4) {
    S.addBillboard(x + face * (w0 / 2 + 0.3), y * 0.7, z, face > 0 ? Math.PI / 2 : -Math.PI / 2, tintIdx, 9 + S.rng() * 4, 5 + S.rng() * 2);
  }
  if (S.rng() > 0.5) S.addBillboard(x, y + 2, z + d0 / 2 + 0.4, 0, tintIdx + 1, 8, 4.5);
  // tiny window sparkle sprites
  for (let i = 0; i < 6; i++) {
    S.glow(S.rng() > 0.5 ? S.GLOW.cyan : S.GLOW.mag, x + (S.rng() - 0.5) * w0, 5 + S.rng() * h * 0.8, z + d0 / 2 + 0.3, 1.2, 1.2, 0.35);
  }
  return { x, z, h: y + crownH, w: w0, d: d0, topY: y, depth };
}




// Depth haze slabs (purple/cyan) between near / mid / far
S.hazePlane = function hazePlane(z, col, op, w = 200, h = 120) {
  const m = new S.THREE.Mesh(
    new S.THREE.PlaneGeometry(w, h),
    new S.THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: S.THREE.AdditiveBlending, toneMapped: false, fog: false })
  );
  m.position.set(0, h * 0.35, z); S.scene.add(m);
}



S.logPerf = function logPerf(tag) {
  let meshes = 0, casters = 0, point = 0, actor = 0, room = 0, globalP = 0;
  S.scene.traverse(o => {
    if (o.isMesh) { meshes++; if (o.castShadow) casters++; }
    if (!o.isPointLight) return;
    point++;
    if (o.layers.mask === (1 << S.LAYER_ACTOR)) actor++;
    else if (o.layers.mask === (1 << S.LAYER_ROOM)) room++;
    else globalP++;
  });
  console.info('[perf]', tag, JSON.stringify({ meshes, casters, point, actor, room, globalP }));
}


S.av = function av(y, z, speed, trailCol) {
  const g = new S.THREE.Group();
  S.box(2.4, 0.35, 1.1, S.M(0x1a2030, { metalness: 0.85 }), 0, 0, 0, g);
  S.glow(trailCol === 0xff2a6d ? S.GLOW.mag : S.GLOW.cyan, -2, 0, 0, 2.5, 0.6, 0.3, g);
  const trail = new S.THREE.Mesh(new S.THREE.PlaneGeometry(3.2, 0.08), new S.THREE.MeshBasicMaterial({ color: trailCol, transparent: true, opacity: 0.2, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false, fog: false }));
  trail.position.set(-2.2, 0, 0); g.add(trail);
  g.position.set(z > 0 ? 48 : -48, y, z); S.scene.add(g); // start in side lanes
  S.avs.push({ g, speed, y, ph: Math.random() * 10, side: z > 0 ? 1 : -1 });
}


S.makeGlitchHolo = function makeGlitchHolo(x, z, accentHex) {
  const g = new S.THREE.Group();
  // Tall neon pane — clearly a hologram, not pale point-sprites
  const pane = new S.THREE.Mesh(
    new S.THREE.PlaneGeometry(0.85, 3.6),
    new S.THREE.MeshBasicMaterial({
      color: accentHex, transparent: true, opacity: 0.55,
      blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: S.THREE.DoubleSide
    })
  );
  pane.position.y = 2.0; g.add(pane);
  // horizontal scanlines
  for (let i = 0; i < 10; i++) {
    const bar = new S.THREE.Mesh(
      new S.THREE.PlaneGeometry(0.95, 0.03),
      new S.THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.2,
        blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: S.THREE.DoubleSide
      })
    );
    bar.position.set(0, 0.4 + i * 0.32, 0.02); g.add(bar);
  }
  // emissive frame
  S.box(0.06, 3.6, 0.06, S.E(accentHex, 2.0), -0.45, 2.0, 0, g);
  S.box(0.06, 3.6, 0.06, S.E(accentHex, 2.0), 0.45, 2.0, 0, g);
  S.box(0.96, 0.06, 0.06, S.E(accentHex, 1.6), 0, 3.8, 0, g);
  g.position.set(x, 0, z);
  S.scene.add(g);
  const mats = [];
  g.traverse(o => { if (o.material) mats.push(o.material); });
  S.glitchHolos.push({ g, mats, ph: Math.random() * 10 });
  return g;
}


S.makeHero = function makeHero() {
  const g = new S.THREE.Group();
  // dark silhouette flyer
  S.box(0.4, 1.2, 0.35, S.M(0x0a0a12), 0, 0, 0, g);
  S.box(0.35, 0.35, 0.35, S.M(0x1a1520), 0, 0.85, 0, g);
  const trail = new S.THREE.Mesh(new S.THREE.PlaneGeometry(6, 0.25), new S.THREE.MeshBasicMaterial({ color: 0xff2a6d, transparent: true, opacity: 0.7, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false }));
  trail.position.set(0, -0.4, 0); trail.rotation.z = Math.PI / 2; g.add(trail);
  g.visible = false; S.scene.add(g);
  S.heroes.push({ g, active: false, t0: 0, kind: 'fly' });
}


S.car = function car(color, lane, speed, x, hover = false) {
  const g = new S.THREE.Group();
  // wedge sports body — always dark gunmetal; `color` is neon accent only
  const body = new S.THREE.Mesh(new S.THREE.BoxGeometry(3.6, 0.55, 1.55), S.M(0x1a1e28, { metalness: 0.92, roughness: 0.25 }));
  body.position.y = hover ? 0.85 : 0.55; body.castShadow = true; g.add(body);
  // cabin
  const cabin = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.6, 0.55, 1.35), new S.THREE.MeshPhysicalMaterial({ color: 0x0a1520, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.75 }));
  cabin.position.set(-0.2, hover ? 1.25 : 0.95, 0); g.add(cabin);
  // light bar + neon underglow
  S.box(0.15, 0.12, 1.4, S.E(0x00f0ff, 2.5), 1.7, hover ? 0.85 : 0.55, 0, g);
  S.box(3.2, 0.06, 0.08, S.E(color, 2.0), 0, hover ? 0.55 : 0.22, 0.78, g);
  S.box(3.2, 0.06, 0.08, S.E(color, 2.0), 0, hover ? 0.55 : 0.22, -0.78, g);
  S.glow(S.GLOW.white, 2.3, hover ? 0.85 : 0.55, 0.45, 2.2, 1.0, 0.55, g);
  S.glow(S.GLOW.white, 2.3, hover ? 0.85 : 0.55, -0.45, 2.2, 1.0, 0.55, g);
  S.glow(S.GLOW.red, -2.0, hover ? 0.85 : 0.55, 0.4, 1.3, 0.8, 0.55, g);
  S.glow(S.GLOW.red, -2.0, hover ? 0.85 : 0.55, -0.4, 1.3, 0.8, 0.55, g);
  S.box(0.62, 0.24, 0.18, S.E(0xff2244, 5.5), -1.72, hover ? 0.9 : 0.5, 0.46, g);
  S.box(0.62, 0.24, 0.18, S.E(0xff2244, 5.5), -1.72, hover ? 0.9 : 0.5, -0.46, g);
  if (hover) {
    const tailL = new S.THREE.PointLight(0xff3355, 48, 26, 1.5);
    tailL.position.set(-2.1, 0.95, 0); g.add(tailL);
  }
  if (hover) {
    for (const dx of [-1.1, 1.1]) for (const dz of [-0.55, 0.55]) {
      const pad = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.28, 0.35, 0.12, 10), S.E(0x00f0ff, 1.6));
      pad.position.set(dx, 0.35, dz); g.add(pad);
    }
    S.glow(S.GLOW.cyan, 0, 0.2, 0, 4, 2, 0.35, g);
  } else {
    for (const dx of [-1.1, 1.1]) for (const dz of [-0.7, 0.7]) {
      const wh = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), S.M(0x111418, { metalness: 0.6 }));
      wh.rotation.z = Math.PI / 2; wh.position.set(dx, 0.28, dz); g.add(wh);
    }
  }
  // speed trail
  const trail = new S.THREE.Mesh(new S.THREE.PlaneGeometry(hover ? 6.5 : 2.5, hover ? 0.22 : 0.08), new S.THREE.MeshBasicMaterial({ color: hover ? 0xff4466 : color, transparent: true, opacity: hover ? 0.75 : 0.2, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false, fog: false }));
  trail.position.set(hover ? -4.6 : (speed >= 0 ? -2.2 : 2.2), hover ? 0.85 : 0.35, 0); trail.rotation.y = Math.PI / 2; g.add(trail);
  g.position.set(x, 0, lane); g.rotation.y = speed > 0 ? Math.PI / 2 : -Math.PI / 2;
  // cars move along +X; model faces +X after rot
  g.rotation.y = speed >= 0 ? 0 : Math.PI;
  S.scene.add(g); S.cars.push({ g, speed, hover });
  return g;
}


S.pointOnLoop = function pointOnLoop(pts, u) {
  const n = pts.length;
  const f = (((u % 1) + 1) % 1) * n;
  const i = Math.floor(f) % n;
  const t = f - Math.floor(f);
  const a = pts[i], b = pts[(i + 1) % n];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}


S.addRouteVehicle = function addRouteVehicle(spec) {
  if (spec.model) {
    const g = new S.THREE.Group();
    g.name = spec.id;
    g.visible = false;
    S.scene.add(g);
    const rec = {
      g, id: spec.id, kind: spec.kind, laneKey: spec.laneKey || null, model: spec.model,
      speed: 0, route: spec.park ? null : (S.VEHICLE_ROUTES[spec.route] || null),
      routeSpeed: spec.speed || 0, u: spec.offset || 0, fly: spec.kind === 'air',
      hoverHeight: spec.hoverHeight, yaw0: 0, park: spec.park || null,
    };
    S.cars.push(rec);
    return rec;
  }
  const hover = spec.kind === 'air';
  S.car(spec.color, 0, 0, 0, hover);
  const rec = S.cars[S.cars.length - 1];
  rec.id = spec.id;
  rec.kind = spec.kind;
  rec.laneKey = spec.laneKey || null;
  rec.model = null;
  rec.speed = 0;
  rec.g.visible = false;
  rec.route = S.VEHICLE_ROUTES[spec.route];
  rec.routeSpeed = spec.speed;
  rec.u = spec.offset || 0;
  rec.fly = hover;
  const p = S.pointOnLoop(rec.route, rec.u);
  rec.g.position.set(p.x, p.y, p.z);
  return rec;
}



// Fifth-generation coupe proportions, lofted from cross-sections (not sphere pods).
// Long flat hood, cabin behind the front axle, hips wider than the doors,
// double-bubble roof, short deck, ducktail lip. Nose is +X. Wheels sit on y = 0.
// Original mesh. Not a Toyota product and it carries no badge.
S.raceCar = function raceCar(accent = 0x00f0ff) {
  const g = new S.THREE.Group();
  const paint = S.M(0x2a2c31, { metalness: 0.22, roughness: 0.72, side: S.THREE.DoubleSide });
  const black = S.M(0x07080c, { metalness: 0.4, roughness: 0.62, side: S.THREE.DoubleSide });
  const bezel = S.M(0x8d939c, { metalness: 0.3, roughness: 0.42, side: S.THREE.DoubleSide });
  const rubber = S.M(0x121418, { metalness: 0.4, roughness: 0.62 });
  const metal = S.M(0xc8ccd4, { metalness: 0.88, roughness: 0.28 });
  const glassMat = new S.THREE.MeshPhysicalMaterial({
    color: 0x071018, metalness: 0.15, roughness: 0.06,
    transparent: true, opacity: 0.84, side: S.THREE.DoubleSide
  });
  const emit = (color, intensity) => new S.THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity,
    toneMapped: false, side: S.THREE.DoubleSide, roughness: 0.35
  });
  const redLamp = emit(0xff1c1c, 3.6);
  const tailLamp = emit(0xff2438, 2.8);
  const cyan = emit(0x00f0ff, 1.8);

  const cr = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  const sampleKeys = (keys, count) => {
    const n = keys.length;
    const names = Object.keys(keys[0]);
    const out = [];
    for (let i = 0; i < count; i++) {
      const f = (i / (count - 1)) * (n - 1);
      let i1 = Math.floor(f);
      if (i1 >= n - 1) i1 = n - 2;
      const u = Math.min(1, f - i1);
      const i0 = Math.max(0, i1 - 1);
      const i2 = i1 + 1;
      const i3 = Math.min(n - 1, i2 + 1);
      const s = {};
      for (const name of names) s[name] = cr(keys[i0][name], keys[i1][name], keys[i2][name], keys[i3][name], u);
      out.push(s);
    }
    return out;
  };
  const resampleOpen = (pts, count) => {
    const n = pts.length;
    const out = [];
    for (let i = 0; i < count; i++) {
      const f = (i / (count - 1)) * (n - 1);
      let i1 = Math.floor(f);
      if (i1 >= n - 1) i1 = n - 2;
      const u = Math.min(1, f - i1);
      const i0 = Math.max(0, i1 - 1);
      const i2 = i1 + 1;
      const i3 = Math.min(n - 1, i2 + 1);
      out.push([
        cr(pts[i0][0], pts[i1][0], pts[i2][0], pts[i3][0], u),
        cr(pts[i0][1], pts[i1][1], pts[i2][1], pts[i3][1], u),
      ]);
    }
    out[0][1] = 0;
    out[out.length - 1][1] = 0;
    for (let i = 0; i < out.length; i++) out[i][1] = Math.max(0, out[i][1]);
    let m = 0;
    for (let i = 1; i < out.length; i++) if (out[i][1] > out[m][1]) m = i;
    for (let i = 1; i <= m; i++) out[i][1] = Math.max(out[i][1], out[i - 1][1]);
    for (let i = m + 1; i < out.length; i++) out[i][1] = Math.min(out[i][1], out[i - 1][1]);
    return out;
  };
  const closeRing = (half) => {
    const ring = half.map(p => [p[0], p[1]]);
    for (let i = half.length - 2; i >= 1; i--) ring.push([half[i][0], -half[i][1]]);
    return ring;
  };
  const addMesh = (positions, indices, mat, shadow) => {
    const geo = new S.THREE.BufferGeometry();
    geo.setAttribute('position', new S.THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new S.THREE.Mesh(geo, mat);
    mesh.castShadow = !!shadow;
    mesh.receiveShadow = !!shadow;
    g.add(mesh);
    return mesh;
  };
  const loft = (rings, mat, { capStart = false, capEnd = false, shadow = true } = {}) => {
    const S = rings.length;
    const N = rings[0].length;
    const pos = [];
    for (let i = 0; i < S; i++) {
      for (let j = 0; j < N; j++) pos.push(rings[i][j][0], rings[i][j][1], rings[i][j][2]);
    }
    const idx = [];
    for (let i = 0; i < S - 1; i++) {
      for (let j = 0; j < N; j++) {
        const j2 = (j + 1) % N;
        const a = i * N + j;
        const b = i * N + j2;
        const c = (i + 1) * N + j;
        const d = (i + 1) * N + j2;
        idx.push(a, c, b, b, c, d);
      }
    }
    const cap = (station, outward) => {
      let cy = 0;
      for (let j = 0; j < N; j++) cy += rings[station][j][1];
      cy /= N;
      const c = pos.length / 3;
      pos.push(rings[station][0][0], cy, 0);
      const off = station * N;
      for (let j = 0; j < N; j++) {
        const j2 = (j + 1) % N;
        if (outward > 0) idx.push(c, off + j, off + j2);
        else idx.push(c, off + j2, off + j);
      }
    };
    if (capStart) cap(0, 1);
    if (capEnd) cap(S - 1, -1);
    return addMesh(pos, idx, mat, shadow);
  };
  const band = (rows, mat) => {
    const n = rows[0].length;
    const pos = [];
    rows.forEach(row => row.forEach(p => pos.push(p[0], p[1], p[2])));
    const idx = [];
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const a = i * n + j;
        idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    }
    return addMesh(pos, idx, mat, false);
  };
  const verticalRibbon = (points, halfH, mat) => {
    const pos = [];
    const idx = [];
    points.forEach(p => {
      pos.push(p[0], p[1] - halfH, p[2], p[0], p[1] + halfH, p[2]);
    });
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    return addMesh(pos, idx, mat, false);
  };
  const resample3 = (pts, count) => {
    const n = pts.length;
    const out = [];
    for (let i = 0; i < count; i++) {
      const f = (i / (count - 1)) * (n - 1);
      let i1 = Math.floor(f);
      if (i1 >= n - 1) i1 = n - 2;
      const u = Math.min(1, f - i1);
      const i0 = Math.max(0, i1 - 1);
      const i2 = i1 + 1;
      const i3 = Math.min(n - 1, i2 + 1);
      out.push([
        cr(pts[i0][0], pts[i1][0], pts[i2][0], pts[i3][0], u),
        cr(pts[i0][1], pts[i1][1], pts[i2][1], pts[i3][1], u),
        cr(pts[i0][2], pts[i1][2], pts[i2][2], pts[i3][2], u),
      ]);
    }
    return out;
  };
  const curveRibbon = (points, halfW, mat) => {
    const pos = [];
    const idx = [];
    const tmp = points.map(p => new S.THREE.Vector3(p[0], p[1], p[2]));
    for (let i = 0; i < tmp.length; i++) {
      const prev = tmp[Math.max(0, i - 1)];
      const next = tmp[Math.min(tmp.length - 1, i + 1)];
      const tan = new S.THREE.Vector3().subVectors(next, prev);
      if (tan.lengthSq() < 1e-8) tan.set(1, 0, 0);
      tan.normalize();
      let across = new S.THREE.Vector3(-tan.z, 0, tan.x);
      if (across.lengthSq() < 1e-6) across.set(0, 1, 0);
      across.normalize();
      const bin = new S.THREE.Vector3().crossVectors(tan, across);
      if (bin.lengthSq() < 1e-6) bin.set(0, 1, 0);
      bin.normalize().multiplyScalar(halfW);
      const p = tmp[i];
      pos.push(p.x + bin.x, p.y + bin.y, p.z + bin.z, p.x - bin.x, p.y - bin.y, p.z - bin.z);
    }
    for (let i = 0; i < tmp.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    return addMesh(pos, idx, mat, false);
  };

  // Nose → tail. The hood line stays low and flat until the screen, which
  // starts behind the front axle. Door zw is pinched; rear zw is the haunch.
  // arch tucks the lower fender in so the tire fills the opening.
  const KEYS = [
    { x: 2.32, zw: 0.90, zb: 0.84, zt: 0.58, yb: 0.16, ys: 0.62, belt: 0.68, yt: 0.70, bubble: 0, dome: 0.012, arch: 0 },
    { x: 1.98, zw: 0.98, zb: 0.68, zt: 0.54, yb: 0.16, ys: 0.74, belt: 0.74, yt: 0.73, bubble: 0, dome: 0.02, arch: 0.2 },
    { x: 1.68, zw: 1.02, zb: 0.50, zt: 0.50, yb: 0.28, ys: 0.76, belt: 0.75, yt: 0.74, bubble: 0, dome: 0.02, arch: 0.7 },
    { x: 1.40, zw: 1.04, zb: 0.44, zt: 0.48, yb: 0.38, ys: 0.78, belt: 0.76, yt: 0.74, bubble: 0, dome: 0.022, arch: 1 },
    { x: 1.00, zw: 0.92, zb: 0.58, zt: 0.54, yb: 0.24, ys: 0.74, belt: 0.74, yt: 0.74, bubble: 0, dome: 0.018, arch: 0.45 },
    { x: 0.52, zw: 0.78, zb: 0.68, zt: 0.62, yb: 0.15, ys: 0.70, belt: 0.73, yt: 0.75, bubble: 0, dome: 0.01, arch: 0 },
    { x: 0.12, zw: 0.70, zb: 0.64, zt: 0.56, yb: 0.14, ys: 0.64, belt: 0.74, yt: 0.78, bubble: 0, dome: 0, arch: 0 },
    { x: -0.16, zw: 0.69, zb: 0.62, zt: 0.42, yb: 0.14, ys: 0.66, belt: 0.84, yt: 1.08, bubble: 0, dome: 0, arch: 0 },
    { x: -0.40, zw: 0.70, zb: 0.62, zt: 0.34, yb: 0.14, ys: 0.72, belt: 0.90, yt: 1.24, bubble: 0.025, dome: 0, arch: 0 },
    { x: -0.62, zw: 0.72, zb: 0.62, zt: 0.32, yb: 0.14, ys: 0.74, belt: 0.90, yt: 1.26, bubble: 0.065, dome: 0, arch: 0 },
    { x: -0.82, zw: 0.98, zb: 0.60, zt: 0.40, yb: 0.18, ys: 0.74, belt: 0.86, yt: 1.00, bubble: 0.01, dome: 0, arch: 0.25 },
    { x: -1.02, zw: 1.18, zb: 0.52, zt: 0.50, yb: 0.32, ys: 0.76, belt: 0.82, yt: 0.80, bubble: 0, dome: 0, arch: 0.75 },
    { x: -1.18, zw: 1.22, zb: 0.46, zt: 0.52, yb: 0.38, ys: 0.78, belt: 0.80, yt: 0.70, bubble: 0, dome: 0, arch: 1 },
    { x: -1.42, zw: 1.10, zb: 0.72, zt: 0.66, yb: 0.22, ys: 0.56, belt: 0.70, yt: 0.72, bubble: 0, dome: 0, arch: 0.3 },
    { x: -1.66, zw: 1.00, zb: 0.84, zt: 0.60, yb: 0.20, ys: 0.46, belt: 0.58, yt: 0.64, bubble: 0, dome: 0, arch: 0 },
  ];

  const halfRing = (s) => {
    const zw = Math.max(0.25, s.zw);
    const zb = Math.min(zw, Math.max(0.12, s.zb));
    const zt = Math.min(zw * 0.98, Math.max(0.12, s.zt));
    const yb = s.yb;
    const ys = Math.max(yb + 0.05, s.ys);
    const belt = s.belt;
    const yt = Math.max(yb + 0.08, s.yt);
    const bubble = Math.max(0, s.bubble || 0);
    const dome = s.dome || 0;
    const arch = Math.min(1, Math.max(0, s.arch || 0));
    const zBelt = zt + (zw - zt) * 0.38;
    const zLow = zw * (0.96 - arch * 0.46);
    const pts = [
      [yb, 0],
      [yb + 0.01, zb * 0.55],
      [yb + 0.03, Math.min(zb * 0.92, zLow * 0.85)],
      [yb + (ys - yb) * 0.55, zLow],
      [ys, zw],
      [ys + (belt - ys) * 0.62, zw * 0.99],
      [belt, zBelt],
      [belt + (yt - belt) * 0.48, zt + (zBelt - zt) * 0.32],
      [yt, zt],
    ];
    if (bubble > 0.004) {
      pts.push([yt + bubble * 0.2, Math.min(zt * 0.66, 0.30)]);
      pts.push([yt + bubble, 0.16]);
      pts.push([yt + bubble * 0.18, 0.055]);
    } else {
      pts.push([yt + dome * 0.4, zt * 0.58]);
      pts.push([yt + dome * 0.9, zt * 0.2]);
    }
    pts.push([yt + dome * 0.12, 0]);
    pts[0][1] = 0;
    pts[pts.length - 1][1] = 0;
    return pts;
  };

  const HALF = 20;
  const stations = sampleKeys(KEYS, 52).map(s => {
    const ring = closeRing(resampleOpen(halfRing(s), HALF));
    return { x: s.x, zw: s.zw, zb: s.zb, belt: s.belt, yt: s.yt, yb: s.yb, ring };
  });
  const bodyRings = stations.map(s => s.ring.map(p => [s.x, p[0], p[1]]));
  loft(bodyRings, paint, { capEnd: true, shadow: true });

  // Bumper face with a hole, then a recessed trapezoid mouth. The opening is the
  // front surface, so the intake reads as a cavity rather than a sticker.
  const nose = bodyRings[0];
  const mouthHalf = [
    [0.14, 0],
    [0.14, 0.52],
    [0.16, 0.82],
    [0.30, 0.84],
    [0.44, 0.56],
    [0.52, 0.34],
    [0.53, 0],
  ];
  const mouth = closeRing(resampleOpen(mouthHalf, HALF));
  const lip = mouth.map(p => [nose[0][0] + 0.012, p[0], p[1]]);
  const outerPos = [];
  const outerIdx = [];
  nose.forEach(p => outerPos.push(p[0], p[1], p[2]));
  lip.forEach(p => outerPos.push(p[0], p[1], p[2]));
  const N = nose.length;
  for (let j = 0; j < N; j++) {
    const j2 = (j + 1) % N;
    outerIdx.push(j, j2, N + j, j2, N + j2, N + j);
  }
  addMesh(outerPos, outerIdx, paint, true);
  const bezelRing = mouth.map(p => {
    const yMid = 0.32;
    return [lip[0][0] + 0.01, yMid + (p[0] - yMid) * 1.1, p[1] * 1.14];
  });
  loft([bezelRing, lip], bezel, { shadow: false });
  const tunnel = [1, 0.88, 0.72].map((scale, i) => {
    const x = lip[0][0] - i * 0.09;
    return mouth.map(p => {
      const yMid = 0.30;
      return [x, yMid + (p[0] - yMid) * (1 - i * 0.08), p[1] * scale];
    });
  });
  tunnel[0] = lip;
  loft(tunnel, black, { capEnd: true, shadow: false });
  for (const y of [0.24, 0.36]) {
    const slat = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.012, 0.018, 1.35), black);
    slat.position.set(lip[0][0] - 0.05, y, 0);
    g.add(slat);
  }

  const airfoil = (halfW, y, thick) => {
    const t = thick;
    const half = [
      [y, 0],
      [y + t * 0.3, halfW * 0.4],
      [y + t * 0.65, halfW * 0.82],
      [y + t * 0.25, halfW],
      [y - t * 0.1, halfW * 0.9],
      [y - t * 0.28, halfW * 0.45],
      [y - t * 0.04, 0],
    ];
    return closeRing(resampleOpen(half, 8));
  };
  const wing = (specs) => loft(specs.map(s => airfoil(s.w, s.y, s.t).map(p => [s.x, p[0], p[1]])), paint, { shadow: true });
  wing([
    { x: 2.24, y: 0.15, w: 1.02, t: 0.03 },
    { x: 2.40, y: 0.125, w: 0.94, t: 0.016 },
    { x: 2.54, y: 0.105, w: 0.80, t: 0.008 },
  ]);
  wing([
    { x: -1.46, y: 0.72, w: 0.58, t: 0.028 },
    { x: -1.62, y: 0.78, w: 0.52, t: 0.016 },
    { x: -1.80, y: 0.86, w: 0.46, t: 0.008 },
  ]);

  const glassRows = (x0, y0, x1, y1, zHalf, bulge, lift) => {
    const rows = [];
    const R = 6, C = 13;
    for (let r = 0; r < R; r++) {
      const k = r / (R - 1);
      const e = k * k * (3 - 2 * k);
      const row = [];
      for (let c = 0; c < C; c++) {
        const u = c / (C - 1);
        const z = (u - 0.5) * 2 * zHalf;
        const edge = zHalf > 0 ? Math.abs(z) / zHalf : 0;
        const x = x0 + (x1 - x0) * e - edge * edge * bulge + lift[0];
        const y = y0 + (y1 - y0) * e - edge * edge * 0.03 + lift[1];
        row.push([x, y, z]);
      }
      rows.push(row);
    }
    return rows;
  };
  band(glassRows(0.02, 0.80, -0.42, 1.22, 0.46, 0.05, [0.028, 0.016]), glassMat);
  band(glassRows(-0.70, 1.14, -1.12, 0.78, 0.38, -0.035, [-0.02, 0.01]), glassMat);
  for (const sign of [1, -1]) {
    const lower = [];
    const upper = [];
    stations.forEach(s => {
      if (s.x > -0.18 || s.x < -0.78) return;
      const z = (Math.min(s.zw, 0.76) + 0.016) * sign;
      const y0 = Math.max(0.88, Math.min(s.belt - 0.02, s.yt - 0.14));
      const y1 = Math.min(s.yt - 0.07, y0 + 0.24);
      lower.push([s.x, y0, z]);
      upper.push([s.x, y1, z]);
    });
    if (lower.length > 1) band([lower, upper], glassMat);
  }

  const zwAt = (x) => {
    let a = stations[0], b = stations[stations.length - 1];
    for (let i = 0; i < stations.length - 1; i++) {
      if ((stations[i].x - x) * (stations[i + 1].x - x) <= 0) { a = stations[i]; b = stations[i + 1]; break; }
    }
    const d = a.x - b.x;
    const t = Math.abs(d) < 1e-4 ? 0 : (a.x - x) / d;
    return a.zw + (b.zw - a.zw) * t;
  };
  const spine = resample3([
    [2.05, 0.72, 0],
    [1.40, 0.74, 0],
    [0.55, 0.73, 0],
    [-0.05, 0.78, 0],
    [-0.55, 0.88, 0],
    [-1.05, 0.80, 0],
    [-1.50, 0.66, 0],
  ], 32);
  for (const sign of [1, -1]) {
    verticalRibbon(spine.map(p => [p[0], p[1], sign * (zwAt(p[0]) + 0.012)]), 0.011, cyan);
    verticalRibbon([0.7, 0.25, -0.2, -0.55].map(x => [x, 0.2, sign * (Math.min(zwAt(x) * 0.7, 0.68) + 0.012)]), 0.008, cyan);
  }

  const hookPts = [
    [2.40, 0.70, 0.58],
    [2.42, 0.66, 0.72],
    [2.36, 0.56, 0.86],
    [2.24, 0.46, 0.96],
  ];
  for (const sign of [1, -1]) {
    const pts = resample3(hookPts, 20).map(p => [p[0], p[1], p[2] * sign]);
    const house = pts.map(p => [p[0] - 0.018, p[1], p[2] - sign * 0.01]);
    curveRibbon(house, 0.04, black);
    curveRibbon(pts, 0.026, redLamp);
  }
  const tail = [];
  for (let i = 0; i <= 28; i++) {
    const z = -1.06 + 2.12 * (i / 28);
    const a = Math.pow(Math.abs(z) / 1.06, 2);
    tail.push([-1.88 + a * 0.06, 0.56, z]);
  }
  verticalRibbon(tail, 0.022, tailLamp);

  const glowMat = new S.THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.38,
    blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: S.THREE.DoubleSide
  });
  const under = new S.THREE.Mesh(new S.THREE.PlaneGeometry(3.5, 1.7), glowMat);
  under.rotation.x = -Math.PI / 2;
  under.position.set(0.05, 0.045, 0);
  g.add(under);

  const addWheel = (x, z, radius, width) => {
    const side = Math.sign(z) || 1;
    const tire = new S.THREE.Mesh(new S.THREE.CylinderGeometry(radius, radius, width, 28), rubber);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(x, radius, z);
    tire.castShadow = true;
    g.add(tire);
    const face = new S.THREE.Mesh(new S.THREE.CylinderGeometry(radius * 0.58, radius * 0.62, width * 0.16, 20), metal);
    face.rotation.x = Math.PI / 2;
    face.position.set(x, radius, z + side * width * 0.38);
    g.add(face);
    const lip = new S.THREE.Mesh(new S.THREE.TorusGeometry(radius * 0.78, radius * 0.07, 8, 20), metal);
    lip.position.set(x, radius, z + side * width * 0.28);
    g.add(lip);
    const hub = new S.THREE.Mesh(new S.THREE.CylinderGeometry(radius * 0.14, radius * 0.14, width * 0.2, 12), metal);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, radius, z + side * width * 0.42);
    g.add(hub);
  };
  addWheel(1.40, 0.80, 0.36, 0.30);
  addWheel(1.40, -0.80, 0.36, 0.30);
  addWheel(-1.18, 0.98, 0.36, 0.34);
  addWheel(-1.18, -0.98, 0.36, 0.34);
  return g;
}


S.loadHovercars = function loadHovercars() {
  S.gltfLoader.load(S.HOVER_GLB, (gltf) => {
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const box = new S.THREE.Box3().setFromObject(src);
    const size = box.getSize(new S.THREE.Vector3());
    const length = Math.max(size.x, size.z) || 1;
    const scale = 4.6 / length;
    const lift = -box.min.y * scale;
    const yaw0 = size.x > size.z ? -Math.PI / 2 : 0;
    for (const rec of S.cars) {
      if (rec.model !== S.HOVER_GLB) continue;
      const m = src.clone(true);
      m.scale.setScalar(scale);
      m.position.y = lift;
      m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
      rec.g.add(m);
      rec.yaw0 = yaw0;
      rec.g.userData.ready = true;
      if (rec.park) {
        rec.g.position.set(rec.park.x, rec.hoverHeight ?? 0.5, rec.park.z);
        rec.g.rotation.y = rec.park.yaw || 0;
        rec.g.visible = true;
      } else if (rec.route && rec.route.length > 2) rec.g.visible = true;
    }
    window.__hover = { size: size.toArray(), scale, yaw0 };
    console.info('[hovercar]', window.__hover);
  }, undefined, (err) => console.error('hovercar', err));
}


S.loadDinerVariant = function loadDinerVariant(name) {
  if (!S.dinerVariantCache[name]) {
    S.dinerVariantCache[name] = new Promise((resolve, reject) => {
      S.gltfLoader.load('assets/signs/cyberpunk-diner-sign-' + name + '.glb', gltf => resolve(gltf.scene), undefined, reject);
    });
  }
  return S.dinerVariantCache[name];
}


S.loadDinerText = function loadDinerText(file) {
  if (!S.dinerTextCache[file]) {
    S.dinerTextCache[file] = new Promise((resolve, reject) => {
      new S.THREE.TextureLoader().load('assets/signs/texts/' + file, tex => {
        tex.flipY = false;
        tex.colorSpace = S.THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      }, undefined, reject);
    });
  }
  return S.dinerTextCache[file];
}


S.placeDinerSign = function placeDinerSign(spec) {
  return Promise.all([S.loadDinerVariant(spec.variant), S.loadDinerText(spec.text)]).then(([src, tex]) => {
    const sign = src.clone(true);
    sign.scale.setScalar(S.SIGN_SCALE);
    sign.position.set(spec.x, spec.y, spec.z);
    sign.rotation.y = spec.yaw;
    sign.traverse(o => {
      if (!o.isMesh || o.name === 'TextPlate' || !o.material) return;
      const list = [].concat(o.material);
      const next = list.map(m => {
        if (!m.emissive || (m.emissive.r + m.emissive.g + m.emissive.b) < 0.15) return m;
        const copy = m.clone();
        copy.emissive.set(spec.color);
        copy.color && copy.color.set(spec.color);
        copy.emissiveIntensity = 1.5;
        copy.toneMapped = false;
        return copy;
      });
      o.material = Array.isArray(o.material) ? next : next[0];
    });
    const plate = sign.getObjectByName('TextPlate');
    if (plate && plate.material) {
      const mat = plate.material.clone();
      plate.material = mat;
      mat.map = tex;
      mat.emissiveMap = tex;
      mat.transparent = true;
      mat.alphaTest = 0.04;
      mat.emissive.set(spec.color);
      mat.emissiveIntensity = spec.intensity == null ? 2.8 : spec.intensity;
      mat.toneMapped = false;
      mat.needsUpdate = true;
    }
    S.scene.add(sign);
    return sign;
  });
}


S.whenCityReady = function whenCityReady() {
  if (window.__city) return Promise.resolve();
  return new Promise(resolve => {
    const timer = setInterval(() => {
      if (!window.__city) return;
      clearInterval(timer);
      resolve();
    }, 80);
  });
}


S.updateStreetGirls = function updateStreetGirls(dt) {
  if (window.__sidewalkLoop && S.streetGirls[0] && S.streetGirls[0].route !== window.__sidewalkLoop) {
    const route = window.__sidewalkLoop;
    const len = S.loopLength(route);
    S.streetGirls.forEach(g => { g.route = route; g.len = len; g.usingStreets = true; });
  }
  if (window.__streets && S.streetGirls[0] && !S.streetGirls[0].usingStreets) {
    const route = S.streetGirlRoute();
    const len = S.loopLength(route);
    S.streetGirls.forEach(g => { g.route = route; g.len = len; });
    S.streetGirls[0].usingStreets = true;
  }
  for (const g of S.streetGirls) {
    if (!g.route || g.route.length < 2) continue;
    g.u = (g.u + dt * g.mps / g.len) % 1;
    const p = S.pointOnLoop(g.route, g.u);
    const n = S.pointOnLoop(g.route, g.u + 0.01);
    g.root.position.set(p.x, g.lift || 0, p.z);
    const dx = n.x - p.x, dz = n.z - p.z;
    if (dx * dx + dz * dz > 1e-6) g.root.rotation.y = Math.atan2(dx, dz);
    g.mixer.update(dt);
  }
}


S.streetGirlRoute = function streetGirlRoute() {
  if (window.__sidewalkLoop && window.__sidewalkLoop.length > 4) return window.__sidewalkLoop;
  const lane = window.__streets && window.__streets.lanes && window.__streets.lanes.groundA;
  if (lane && lane.length > 4) return lane.map(p => ({ x: p.x, y: 0, z: p.z }));
  return [{ x: -18, y: 0, z: 24 }, { x: -18, y: 0, z: 42 }, { x: 16, y: 0, z: 42 }, { x: 16, y: 0, z: 24 }];
}


S.loopLength = function loopLength(pts) {
  let n = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n += Math.hypot(a.x - b.x, a.z - b.z);
  }
  return Math.max(n, 1);
}


S.tintGirl = function tintGirl(model, hairShift, bodyLift) {
  model.traverse(o => {
    if (!o.isMesh || !o.material) return;
    const list = [].concat(o.material).map(m => m.clone());
    o.material = list.length === 1 ? list[0] : list;
    const label = (o.name || '') + ' ' + (o.material.name || '') + ' ' + list.map(m => m.name || '').join(' ');
    list.forEach(m => {
      if (!m.color) return;
      if (/hair/i.test(label)) m.color.offsetHSL(hairShift, 0.04, hairShift * 0.25);
      else if (/body/i.test(label)) m.color.offsetHSL(0, 0, bodyLift);
    });
  });
}


S.loadStreetGirls = function loadStreetGirls() {
  S.gltfLoader.load('assets/props/cyberpunk-girl/cyberpunk-girl.glb', (gltf) => {
    const src = gltf.scene;
    src.traverse(o => {
      if (o.name === 'StreetWear') o.visible = false;
      if (o.name === 'Sketchfab_model') o.rotation.x = 0;
    });
    const walk = gltf.animations.find(a => a.name === 'Walk') || gltf.animations[0];
    const route = S.streetGirlRoute();
    const len = S.loopLength(route);
    const hairs = [0.04, -0.06, 0.1, -0.03, 0.07];
    const bodies = [-0.04, 0.03, -0.01, 0.05, 0.01];
    for (let i = 0; i < 5; i++) {
      const model = S.SkeletonUtils.clone(src);
      model.traverse(o => { if (o.name === 'StreetWear') o.visible = false; });
      S.tintGirl(model, hairs[i], bodies[i]);
      const mixer = new S.THREE.AnimationMixer(model);
      if (walk) {
        const act = mixer.clipAction(walk);
        act.play();
        act.time = i * 0.47;
      }
      S.scene.add(model);
      S.streetGirls.push({ root: model, mixer, route, len, u: i / 5, mps: 1.05 + i * 0.05, lift: 0.92 });
    }
    window.__streetGirls = S.streetGirls;
    console.info('[girls]', S.streetGirls.length, 'dress hidden');
  }, undefined, (err) => console.error('girl', err));
}


S.fitTo = function fitTo(obj, target, axis) {
  obj.scale.set(1, 1, 1);
  obj.position.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  const box = new S.THREE.Box3().setFromObject(obj);
  const size = box.getSize(new S.THREE.Vector3());
  const span = axis === 'y' ? size.y : Math.max(size.x, size.z);
  const c = box.getCenter(new S.THREE.Vector3());
  obj.children.forEach(ch => {
    ch.position.x -= c.x;
    ch.position.z -= c.z;
    ch.position.y -= box.min.y;
  });
  obj.scale.setScalar(target / Math.max(span, 1e-4));
}


S.dropStrayDeskParts = function dropStrayDeskParts(root) {
  const parts = [];
  root.traverse(o => { if (o.isMesh) parts.push(o); });
  const centers = parts.map(o => new S.THREE.Box3().setFromObject(o).getCenter(new S.THREE.Vector3()));
  const mid = centers.reduce((s, c) => s.add(c), new S.THREE.Vector3()).multiplyScalar(1 / Math.max(1, centers.length));
  parts.forEach((o, i) => {
    const d = Math.hypot(centers[i].x - mid.x, centers[i].z - mid.z);
    if (d > 1.15) o.visible = false;
  });
}


S.loadCyberDesk = function loadCyberDesk() {
  S.gltfLoader.load('assets/props/cyberpunk-desk/cyberpunk-desk.glb', (gltf) => {
    const src = gltf.scene;
    S.dropStrayDeskParts(src);
    const box = new S.THREE.Box3().setFromObject(src);
    const height = box.max.y - box.min.y || 1;
    src.scale.setScalar(1.42 / height);
    const grounded = new S.THREE.Box3().setFromObject(src);
    src.position.y -= grounded.min.y;
    const slots = window.__procDesks || [];
    slots.forEach(slot => {
      slot.bits.visible = false;
      const desk = src.clone(true);
      desk.position.set(slot.x, 0, slot.z - 0.15);
      desk.rotation.y = 0;
      slot.parent.add(desk);
    });
    const cupHost = slots[2] || slots[0];
    window.__deskCup = cupHost;
    window.__deskReady = true;
    console.info('[desk]', slots.length, 'height', height.toFixed(2));
    if (window.__propCup && cupHost) {
      const cup = window.__propCup;
      cupHost.parent.add(cup);
      cup.position.set(cupHost.x + 0.55, 1.05, cupHost.z + 0.15);
    }
  }, undefined, (err) => console.error('desk', err));
}


S.loadStreetProps = function loadStreetProps() {
  S.gltfLoader.load('assets/props/cyberpunk-assets/cyberpunk-assets.glb', (gltf) => {
    const src = gltf.scene;
    const take = (name) => {
      const n = src.getObjectByName(name);
      if (!n) return null;
      src.updateMatrixWorld(true);
      const g = new S.THREE.Group();
      n.traverse(o => {
        if (!o.isMesh) return;
        const m = o.clone();
        m.position.set(0, 0, 0);
        m.rotation.set(0, 0, 0);
        m.scale.set(1, 1, 1);
        m.applyMatrix4(o.matrixWorld);
        g.add(m);
      });
      return g;
    };
    const lobby = S.floorGroups.find(f => f.f.lv === 1);
    const office = S.floorGroups.find(f => f.f.lv === 3) || S.floorGroups.find(f => f.f.lv === 2);
    const hud = take('Object_2');
    const cup = take('Object_3');
    const holo = take('Object_4');
    const arcade = take('Object_5');
    const decal = take('Object_6');
    const locker = take('Object_7');
    if (hud && lobby) { S.fitTo(hud, 1.5, 'y'); hud.position.set(-2.4, 0, 1.2); hud.rotation.y = 0.4; lobby.g.add(hud); }
    if (holo && lobby) {
      S.fitTo(holo, 0.9, 'y'); holo.position.set(2.2, 0, 0.4); lobby.g.add(holo);
      const ad = holo.clone(true);
      ad.position.set(12.2, 0, 76);
      ad.rotation.y = -0.35;
      ad.scale.multiplyScalar(2.6);
      S.scene.add(ad);
    }
    if (locker && office) { S.fitTo(locker, 1.85, 'y'); locker.position.set(-9.2, 0, -4.6); locker.rotation.y = Math.PI / 2; office.g.add(locker); }
    if (arcade) { S.fitTo(arcade, 1.8, 'y'); arcade.position.set(-22.4, 0, 33.6); arcade.rotation.y = 0.6; S.scene.add(arcade); }
    if (decal) {
      S.fitTo(decal, 2.4, 'xz'); decal.position.set(9.5, 0.03, 12.5); S.scene.add(decal);
      const mark = decal.clone(true);
      mark.position.set(2.4, 0.08, 71);
      mark.rotation.y = 0.2;
      S.scene.add(mark);
    }
    if (cup) {
      S.fitTo(cup, 0.12, 'y');
      window.__propCup = cup;
      if (window.__deskCup) {
        window.__deskCup.parent.add(cup);
        cup.position.set(window.__deskCup.x + 0.55, 1.05, window.__deskCup.z + 0.15);
      } else S.scene.add(cup);
    }
    window.__streetProps = { hud, cup, holo, arcade, decal, locker };
    console.info('[props] placed');
  }, undefined, (err) => console.error('props', err));
}


S.roadRibbon = function roadRibbon(pts, halfW, yOf) {
  const pos = [], nrm = [], idx = [];
  const tang = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let x = b.x - a.x, z = b.z - a.z;
    const l = Math.hypot(x, z) || 1;
    return { x: x / l, z: z / l };
  });
  pts.forEach((p, i) => {
    const t = tang[i];
    const px = -t.z * halfW, pz = t.x * halfW;
    const y = yOf(p, i);
    pos.push(p.x - px, y, p.z - pz, p.x + px, y, p.z + pz);
    nrm.push(0, 1, 0, 0, 1, 0);
  });
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2, b = a + 1, c = (i + 1) * 2, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new S.THREE.BufferGeometry();
  g.setAttribute('position', new S.THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new S.THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}


S.asphaltMap = function asphaltMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1a1e24';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 16 + Math.random() * 28;
    g.fillStyle = 'rgba(' + v + ',' + (v + 1) + ',' + (v + 3) + ',0.55)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 18; i++) {
    g.fillStyle = 'rgba(8,10,12,0.35)';
    g.beginPath();
    g.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 24, 4 + Math.random() * 10, Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  const t = new S.THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = S.THREE.RepeatWrapping;
  t.colorSpace = S.THREE.SRGBColorSpace;
  t.repeat.set(6, 18);
  return t;
}


S.pavingMap = function pavingMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#3a424c';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#2a3038';
  g.lineWidth = 2;
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      g.strokeRect(x + 1, y + 1, 30, 30);
      const v = 48 + Math.random() * 18;
      g.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 4) + ',0.35)';
      g.fillRect(x + 3, y + 3, 26, 26);
    }
  }
  const t = new S.THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = S.THREE.RepeatWrapping;
  t.colorSpace = S.THREE.SRGBColorSpace;
  t.repeat.set(8, 8);
  return t;
}


S.buildAvenue = function buildAvenue() {
  const z0 = 52, z1 = 106, zc = (z0 + z1) / 2, len = z1 - z0;
  const tile = S.texStreet.clone();
  tile.wrapS = tile.wrapT = S.THREE.RepeatWrapping;
  tile.repeat.set(6, 14);
  tile.needsUpdate = true;
  S.gndMat.map = S.asphaltMap();
  S.gndMat.color.set(0xffffff);
  S.gndMat.needsUpdate = true;
  const walkMat = new S.THREE.MeshStandardMaterial({
    map: S.pavingMap(), color: 0xffffff, roughness: 0.92, metalness: 0.02,
  });
  const roadMat = new S.THREE.MeshStandardMaterial({
    map: S.asphaltMap(), color: 0xffffff, roughness: 0.93, metalness: 0.02,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const walk = new S.THREE.Mesh(new S.THREE.PlaneGeometry(33, len), walkMat);
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(0, 0.04, zc);
  walk.receiveShadow = true;
  walk.name = 'avenue-walk';
  walk.userData.planRoad = 'walk';
  S.scene.add(walk);
  const road = new S.THREE.Mesh(new S.THREE.PlaneGeometry(16.2, len), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.07, zc);
  road.receiveShadow = true;
  road.name = 'avenue-road';
  road.userData.planRoad = 'road';
  S.scene.add(road);
  const edge = (x, col) => {
    const m = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.08, 0.03, len - 1), new S.THREE.MeshStandardMaterial({
      color: 0x1a1e24, emissive: col, emissiveIntensity: 0.28,
    }));
    m.position.set(x, 0.1, zc);
    m.userData.planRoad = 'mark';
    S.scene.add(m);
  };
  edge(-7.7, 0x39f3ff);
  edge(7.7, 0xff2a6d);
  const mark = new S.THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.6, metalness: 0 });
  const yellow = new S.THREE.MeshStandardMaterial({ color: 0xc89612, roughness: 0.55, metalness: 0 });
  const yCentre = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.12, 0.02, len - 2), yellow);
  yCentre.position.set(0, 0.11, zc);
  yCentre.userData.planRoad = 'mark';
  S.scene.add(yCentre);
  [-7.55, 7.55].forEach(x => {
    const edgeLine = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.02, len - 2), yellow);
    edgeLine.position.set(x, 0.11, zc);
    edgeLine.userData.planRoad = 'mark';
    S.scene.add(edgeLine);
  });
  const dummy = new S.THREE.Object3D();
  function inst(list, geo, mat, place) {
    if (!list.length) return null;
    const mesh = new S.THREE.InstancedMesh(geo, mat, list.length);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    list.forEach((item, i) => { place(dummy, item); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
    S.scene.add(mesh);
    return mesh;
  }
  const dashes = [];
  for (let z = z0 + 2; z < z1 - 1; z += 3.4) dashes.push(z);
  const dashMesh = inst(dashes, new S.THREE.BoxGeometry(1, 1, 1), mark, (d, z) => {
    d.position.set(0, 0.1, z); d.rotation.set(0, 0, 0); d.scale.set(0.16, 0.025, 1.5);
  });
  if (dashMesh) dashMesh.userData.planRoad = 'mark';
  function zebra(z) {
    for (let x = -7.1; x <= 7.1; x += 0.95) {
      const m = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.4, 0.028, 1.65), mark);
      m.position.set(x, 0.105, z);
      m.userData.planRoad = 'mark';
      S.scene.add(m);
    }
    const stop = new S.THREE.Mesh(new S.THREE.BoxGeometry(14.2, 0.028, 0.16), mark);
    stop.position.set(0, 0.105, z - 5.2);
    stop.userData.planRoad = 'mark';
    S.scene.add(stop);
  }
  zebra(68);
  zebra(92);
  // Arrow on the approach, pointing toward the tower.
  {
    const shaft = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, 0.03, 1.5), mark);
    shaft.position.set(0, 0.105, 62);
    const headL = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, 0.03, 0.7), mark);
    headL.position.set(-0.28, 0.105, 61.15);
    headL.rotation.y = 0.55;
    const headR = headL.clone();
    headR.position.x = 0.28;
    headR.rotation.y = -0.55;
    S.scene.add(shaft, headL, headR);
  }
  function signal(x, z) {
    S.box(0.14, 3.3, 0.14, S.M(0x1a1e24, { metalness: 0.55, roughness: 0.4 }), x, 1.65, z);
    S.box(0.34, 0.95, 0.2, S.M(0x121418, { metalness: 0.4 }), x, 3.15, z);
    S.box(0.16, 0.16, 0.05, S.E(0xff3355, 2.0), x, 3.42, z + 0.1);
    S.box(0.16, 0.16, 0.05, S.E(0xfcee0a, 1.5), x, 3.16, z + 0.1);
    S.box(0.16, 0.16, 0.05, S.E(0x39f3ff, 1.5), x, 2.9, z + 0.1);
  }
  signal(-9.3, 66.2);
  signal(9.3, 66.2);
  signal(-9.3, 90.2);
  signal(9.3, 90.2);
  S.box(0.1, 2.4, 0.1, S.M(0x20262e, { metalness: 0.5 }), 10.4, 1.2, 65.2);
  S.box(0.9, 0.7, 0.08, S.E(0x39f3ff, 1.3), 10.4, 2.35, 65.2);
  const curbMat = new S.THREE.MeshStandardMaterial({ color: 0x3a424e, roughness: 0.62, metalness: 0.2 });
  inst([-8.15, 8.15], new S.THREE.BoxGeometry(1, 1, 1), curbMat, (d, x) => {
    d.position.set(x, 0.16, zc); d.rotation.set(0, 0, 0); d.scale.set(0.22, 0.16, len - 2);
  });
  const bollards = [], bins = [], crates = [], vents = [];
  for (let z = z0 + 5; z < z1; z += 6.4) {
    bollards.push({ x: -8.7, z }, { x: 8.7, z });
    if (Math.round(z) % 2 === 0) bins.push({ x: z % 11 < 6 ? -12.2 : 12.2, z: z + 1.2 });
  }
  [[-12.6, 60], [12.4, 74], [-11.8, 88], [12.6, 98]].forEach(([x, z]) => crates.push({ x, z }));
  [[11.2, 63], [-11.4, 79], [11.1, 97]].forEach(([x, z]) => vents.push({ x, z }));
  inst(bollards, new S.THREE.CylinderGeometry(0.11, 0.14, 0.85, 6), new S.THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.62, roughness: 0.38 }), (d, it) => {
    d.position.set(it.x, 0.48, it.z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
  });
  inst(bins, new S.THREE.BoxGeometry(1, 1, 1), new S.THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.55 }), (d, it) => {
    d.position.set(it.x, 0.48, it.z); d.rotation.set(0, 0.4, 0); d.scale.set(0.55, 0.75, 0.42);
  });
  inst(crates, new S.THREE.BoxGeometry(1, 1, 1), new S.THREE.MeshStandardMaterial({ color: 0x3a3228, roughness: 0.8 }), (d, it) => {
    d.position.set(it.x, 0.28, it.z); d.rotation.set(0, it.x, 0); d.scale.set(0.55, 0.42, 0.5);
  });
  inst(vents, new S.THREE.BoxGeometry(1, 1, 1), new S.THREE.MeshBasicMaterial({ color: 0xb7e4f2, transparent: true, opacity: 0.32, toneMapped: false, depthWrite: false }), (d, it) => {
    d.position.set(it.x, 0.85, it.z); d.rotation.set(0, 0, 0); d.scale.set(0.4, 1.5, 0.4);
  });
  const holes = [[0.5, 58], [-0.8, 86], [0.6, 102]];
  inst(holes, new S.THREE.CylinderGeometry(0.55, 0.55, 0.04, 10), new S.THREE.MeshStandardMaterial({ color: 0x1a1e26, metalness: 0.8, roughness: 0.35 }), (d, it) => {
    d.position.set(it[0], 0.09, it[1]); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
  });
  for (const [x, z] of [[-7.4, 63], [7.4, 75], [-7.4, 89], [7.4, 101]]) {
    const drain = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.7, 0.03, 0.28), new S.THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.7, roughness: 0.3 }));
    drain.position.set(x, 0.09, z);
    S.scene.add(drain);
  }
  const wet = new S.THREE.MeshStandardMaterial({
    color: 0x3a4552, metalness: 0.22, roughness: 0.55, transparent: true, opacity: 0.22,
    depthWrite: false,
  });
  for (const [x, z] of [[6.2, 60.5], [-5.8, 76], [6.4, 89], [-6.1, 100]]) {
    const blob = new S.THREE.Shape();
    blob.moveTo(0, 0.15);
    blob.bezierCurveTo(0.35, 0.45, 0.7, 0.2, 0.45, -0.15);
    blob.bezierCurveTo(0.2, -0.45, -0.35, -0.35, -0.4, 0.05);
    blob.bezierCurveTo(-0.45, 0.4, -0.15, 0.2, 0, 0.15);
    const puddle = new S.THREE.Mesh(new S.THREE.ShapeGeometry(blob), wet);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(1.15, 1.35, 1);
    puddle.position.set(x, 0.085, z);
    S.scene.add(puddle);
  }
  function park(x, z, yaw, col) {
    const g = new S.THREE.Group();
    const body = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.7, 0.48, 3.5), S.M(col, { metalness: 0.64, roughness: 0.3 }));
    body.position.y = 0.48;
    const cab = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.45, 0.36, 1.4), S.M(0x0c1018, { roughness: 0.15, metalness: 0.25 }));
    cab.position.set(0, 0.85, -0.2);
    g.add(body, cab);
    g.position.set(x, 0.08, z);
    g.rotation.y = yaw;
    S.scene.add(g);
  }
  park(5.7, 73, 0, 0x241820);
  park(-5.6, 84, Math.PI, 0x142028);
  park(5.5, 99, 0, 0x1a2430);
  function vend(x, z, col) {
    const face = x > 0 ? -1 : 1;
    S.box(0.75, 1.7, 0.5, S.M(0x1a1e26, { metalness: 0.45, roughness: 0.4 }), x, 0.85, z);
    S.box(0.06, 0.9, 0.42, S.E(col, 1.7), x + face * 0.4, 1.15, z);
  }
  vend(12.5, 62, 0xff2a6d);
  vend(-12.5, 71, 0x39f3ff);
  vend(12.4, 86, 0xfcee0a);
  // Sidewalk kiosk and a short cable run between avenue lamps.
  S.box(1.5, 2.3, 1.4, S.M(0x221820, { metalness: 0.35, roughness: 0.5 }), -12.4, 1.15, 80);
  S.box(1.7, 0.1, 1.6, S.M(0x2a1a22, { roughness: 0.6 }), -12.4, 2.35, 80);
  S.box(1.2, 0.45, 0.06, S.E(0xff2a6d, 1.8), -12.4, 2.05, 80.75);
  for (const z of [56, 74, 92]) {
    for (const x of [-13.2, 13.2]) {
      S.box(0.12, 4.2, 0.12, S.M(0x161a22, { metalness: 0.6, roughness: 0.35 }), x, 2.1, z);
      S.box(0.7, 0.08, 0.16, S.E(x < 0 ? 0xff2a6d : 0x39f3ff, 1.8), x, 4.15, z);
    }
  }
  for (let i = 0; i < 3; i++) {
    const z = 56 + i * 18;
    const cable = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.035, 0.035, 17.2), S.M(0x0e1218, { metalness: 0.4 }));
    cable.position.set(-13.2, 3.35, z + 9);
    cable.rotation.x = 0.08;
    S.scene.add(cable);
  }
  window.__intersection = { x: 0, y: 0, z: 68 };
  window.__avenue = true;
}


S.buildDistrict = function buildDistrict(lane) {
  if (window.__district || !lane || lane.length < 8) return;
  window.__district = true;
  window.__lane = lane;
  S.buildAvenue();
  // Elevated highway stays on the north and the sides so the south view of the tower stays open.
  const hw = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Kept low and outside the block mass so it skirts the north of the city
    // without crossing the tower in the south hero view or the high orbits.
    const a = Math.PI * (1.05 + t * 0.9);
    const r = 56;
    hw.push({ x: Math.cos(a) * r, z: Math.sin(a) * r - 10, y: 8.4 });
  }
  // The old north flyover is not built. The orange loop replaces it in sealRoads.
  function addHighwayLook(runs) {
  if (window.__hwGroup) S.scene.remove(window.__hwGroup);
  const hwGroup = new S.THREE.Group();
  hwGroup.name = 'highway';
  window.__hwGroup = hwGroup;
  S.scene.add(hwGroup);
  const deckMat = new S.THREE.MeshStandardMaterial({ color: 0x3a414c, roughness: 0.9, metalness: 0.06, side: S.THREE.DoubleSide });
  const railMat = new S.THREE.MeshStandardMaterial({ color: 0x8b95a6, metalness: 0.35, roughness: 0.55 });
  const pillarMat = new S.THREE.MeshStandardMaterial({ color: 0x9aa4b4, metalness: 0.25, roughness: 0.6 });
  runs.forEach(run => {
    if (run.length < 2) return;
    const deck = new S.THREE.Mesh(S.roadRibbon(run, 4.6, (p) => p.y), deckMat);
    deck.userData.planRoad = 'road';
    hwGroup.add(deck);
  });
  const hwDash = [];
  const posts = [];
  const barriers = [];
  const neons = [];
  let hwPillarN = 0;
  runs.forEach(run => {
    run.forEach((p, i) => {
      const n = run[Math.min(run.length - 1, i + 1)];
      const prev = run[Math.max(0, i - 1)];
      let x = n.x - prev.x, z = n.z - prev.z;
      const l = Math.hypot(x, z) || 1;
      const tx = x / l, tz = z / l, px = -tz, pz = tx;
      const yaw = Math.atan2(tx, tz);
      if (i % 2 === 0) {
        for (const off of [-1.7, 0, 1.7]) hwDash.push({ x: p.x + px * off, z: p.z + pz * off, y: p.y + 0.1, yaw });
      }
      if (i < run.length - 1) {
        const dx = n.x - p.x, dz = n.z - p.z;
        const seg = Math.hypot(dx, dz) || 1;
        const mx = (p.x + n.x) / 2, mz = (p.z + n.z) / 2, my = (p.y + n.y) / 2;
        const syaw = Math.atan2(dx / seg, dz / seg);
        const spx = -dz / seg, spz = dx / seg;
        for (const side of [-1, 1]) {
          barriers.push({ x: mx + spx * 4.5 * side, y: my + 0.48, z: mz + spz * 4.5 * side, yaw: syaw, len: seg + 0.15 });
          neons.push({ x: mx + spx * 4.68 * side, y: my + 0.98, z: mz + spz * 4.68 * side, yaw: syaw, len: seg + 0.05, mag: side > 0 });
        }
      }
      if (i % 2 === 0) {
        posts.push({ x: p.x + px * 4.5, y: p.y + 0.48, z: p.z + pz * 4.5 });
        posts.push({ x: p.x - px * 4.5, y: p.y + 0.48, z: p.z - pz * 4.5 });
      }
      if (i % 4 !== 0) return;
      const pillar = S.box(1.15, p.y, 1.15, pillarMat, p.x, p.y / 2, p.z, hwGroup);
      pillar.userData.planRoad = 'road';
      const cap = S.box(1.5, 0.18, 1.5, railMat, p.x, p.y - 0.08, p.z, hwGroup);
      cap.userData.planRoad = 'road';
      const sx = p.x + px * 4.0, sz = p.z + pz * 4.0;
      const mag = i % 8 === 0;
      S.box(0.14, 3.1, 0.14, railMat, sx, p.y + 1.7, sz, hwGroup);
      S.box(0.85, 0.1, 0.18, S.E(mag ? 0xff2a6d : 0x39f3ff, 2.4), sx, p.y + 3.2, sz, hwGroup);
      // Glowing head stays on every pillar. A real light only on every 6th.
      if ((hwPillarN++ % 6) === 0) {
        const lamp = new S.THREE.PointLight(mag ? 0xff4d86 : 0x7af6ff, 18, 22, 2);
        lamp.position.set(sx, p.y + 3.0, sz);
        hwGroup.add(lamp);
      }
    });
  });
  const dummy = new S.THREE.Object3D();
  function hwInst(list, geo, mat, place, kind) {
    if (!list.length) return;
    const mesh = new S.THREE.InstancedMesh(geo, mat, list.length);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.userData.planRoad = kind;
    list.forEach((item, i) => { place(dummy, item); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
    hwGroup.add(mesh);
  }
  hwInst(hwDash, new S.THREE.BoxGeometry(1, 1, 1), new S.THREE.MeshBasicMaterial({ color: 0xfff4c8, toneMapped: false }), (d, it) => {
    d.position.set(it.x, it.y, it.z);
    d.rotation.set(0, it.yaw, 0);
    d.scale.set(0.22, 0.045, 2.3);
  }, 'mark');
  hwInst(barriers, new S.THREE.BoxGeometry(1, 1, 1), railMat, (d, it) => {
    d.position.set(it.x, it.y, it.z);
    d.rotation.set(0, it.yaw, 0);
    d.scale.set(0.22, 0.85, it.len);
  }, 'road');
  hwInst(posts, new S.THREE.BoxGeometry(0.16, 0.9, 0.16), railMat, (d, it) => {
    d.position.set(it.x, it.y, it.z);
    d.rotation.set(0, 0, 0);
    d.scale.set(1, 1, 1);
  }, 'road');
  const neonMat = new S.THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  if (!neons.length) {
    window.__addHighwayLook = addHighwayLook;
    return;
  }
  const neonMesh = new S.THREE.InstancedMesh(new S.THREE.BoxGeometry(1, 1, 1), neonMat, neons.length);
  neonMesh.frustumCulled = false;
  neonMesh.instanceColor = new S.THREE.InstancedBufferAttribute(new Float32Array(neons.length * 3), 3);
  neons.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(0, it.yaw, 0);
    dummy.scale.set(0.1, 0.16, it.len);
    dummy.updateMatrix();
    neonMesh.setMatrixAt(i, dummy.matrix);
    neonMesh.setColorAt(i, new S.THREE.Color(it.mag ? 0xff2a6d : 0x39f3ff));
  });
  neonMesh.userData.planRoad = 'mark';
  hwGroup.add(neonMesh);
  function ramp(from, out) {
    const steps = 9;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const p = {
        x: from.x + out.x * t * 14,
        z: from.z + out.z * t * 14,
        y: from.y * (1 - t) + 0.12,
      };
      if (window.__footBlocked && window.__footBlocked(p.x, p.z)) return;
      pts.push(p);
    }
    if (pts.length < 2) return;
    const mesh = new S.THREE.Mesh(S.roadRibbon(pts, 2.4, (p) => p.y), deckMat);
    mesh.userData.planRoad = 'road';
    hwGroup.add(mesh);
    pts.forEach((p, i) => { if (i % 2 === 0) S.box(0.45, Math.max(0.4, p.y), 0.45, S.M(0x232833), p.x, p.y / 2, p.z, hwGroup); });
  }
  runs.forEach(run => {
    if (run.length < 6) return;
    ramp(run[2], { x: -0.7, z: 0.4 });
    ramp(run[run.length - 3], { x: 0.75, z: 0.35 });
  });
  window.__addHighwayLook = addHighwayLook;
  }
  const route = hw.map(p => ({ x: p.x, y: p.y + 0.08, z: p.z }));
  for (let i = 0; i < 0; i++) {
    const g = new S.THREE.Group();
    const body = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.8, 0.5, 4.0), S.M(i % 2 ? 0x241820 : 0x142028, { metalness: 0.66, roughness: 0.3 }));
    body.position.y = 0.55;
    const cab = new S.THREE.Mesh(new S.THREE.BoxGeometry(1.5, 0.38, 1.6), S.M(0x0c1018, { roughness: 0.15, metalness: 0.2 }));
    cab.position.set(0, 0.95, -0.15);
    const lampMat = S.E(0xe8fbff, 3.2);
    const tailMat = S.E(0xff2438, 2.8);
    [-0.55, 0.55].forEach(x => {
      const head = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.26, 0.12, 0.08), lampMat);
      head.position.set(x, 0.48, 1.95);
      const tail = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.32, 0.1, 0.06), tailMat);
      tail.position.set(x, 0.46, -1.95);
      g.add(head, tail);
    });
    const headLight = new S.THREE.PointLight(0xdff6ff, 14, 12, 2);
    headLight.position.set(0, 0.55, 2.3);
    const tailLight = new S.THREE.PointLight(0xff2438, 6, 7, 2);
    tailLight.position.set(0, 0.5, -2.2);
    g.add(body, cab, headLight, tailLight);
    S.scene.add(g);
    S.cars.push({ g, route, routeSpeed: 0.045 + i * 0.008, u: i / 4, yaw0: 0, hoverHeight: null, fly: false });
  }
  window.__highway = hw;
  S.sealRoads();
  console.info('[district] road', lane.length, 'highway', hw.length);
}


S.dressLane = function dressLane(lane) {
  if (window.__laneDressed || !lane || !window.__city) return;
  window.__laneDressed = true;
  const meshes = [];
  window.__city.traverse(o => { if (o.isMesh && o.geometry) meshes.push(o); });
  const ray = new S.THREE.Raycaster();
  const down = new S.THREE.Vector3(0, -1, 0);
  function groundY(x, z) {
    ray.set(new S.THREE.Vector3(x, 12, z), down);
    const hits = ray.intersectObjects(meshes, false);
    return hits.length ? hits[0].point.y : 0;
  }
  function open(x, z) {
    if (Math.hypot(x, z) < 16) return false;
    if (window.__footBlocked) return !window.__footBlocked(x, z);
    return groundY(x, z) < 1.25;
  }
  const runs = [];
  let run = [];
  for (let i = 0; i < lane.length; i++) {
    const p = lane[i];
    const n = lane[Math.min(lane.length - 1, i + 1)];
    const dx = n.x - p.x, dz = n.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    const midX = (p.x + n.x) / 2, midZ = (p.z + n.z) / 2;
    const samples = [0, 0.5, 1].every(t => {
      const x = p.x + (n.x - p.x) * t, z = p.z + (n.z - p.z) * t;
      return [-1, 0, 1].every(s => open(x + px * 2.0 * s, z + pz * 2.0 * s));
    }) && open(midX, midZ);
    const ok = samples;
    if (ok) run.push({ ...p, tx: dx / len, tz: dz / len, px, pz });
    else if (run.length > 2) { runs.push(run); run = []; }
    else run = [];
  }
  if (run.length > 2) runs.push(run);
  const asphalt = new S.THREE.MeshStandardMaterial({
    color: 0x343a44, roughness: 0.9, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  runs.forEach(pts => {
    const mesh = new S.THREE.Mesh(S.roadRibbon(pts, 1.65, () => 0.08), asphalt);
    mesh.userData.planRoad = 'road';
    mesh.userData.laneRoad = true;
    S.scene.add(mesh);
  });
  const dashes = [], curbs = [], stripes = [], props = [];
  runs.forEach(pts => {
    pts.forEach((p, i) => {
      if (i % 2 === 0) dashes.push(p);
      if (i % 3 === 0 && open(p.x + p.px * 2.5, p.z + p.pz * 2.5)) curbs.push({ ...p, x: p.x + p.px * 2.35, z: p.z + p.pz * 2.35 });
      if (i % 3 === 0 && open(p.x - p.px * 2.5, p.z - p.pz * 2.5)) curbs.push({ ...p, x: p.x - p.px * 2.35, z: p.z - p.pz * 2.35 });
      if (i % 8 === 4) {
        for (let s = -2; s <= 2; s++) stripes.push({ x: p.x + p.px * s * 0.5, z: p.z + p.pz * s * 0.5, yaw: Math.atan2(p.tx, p.tz) });
      }
      if (i % 6 === 2 && open(p.x + p.px * 3.1, p.z + p.pz * 3.1)) props.push({ x: p.x + p.px * 3.1, z: p.z + p.pz * 3.1, kind: 'bin' });
      if (i % 7 === 3 && open(p.x - p.px * 3.1, p.z - p.pz * 3.1)) props.push({ x: p.x - p.px * 3.1, z: p.z - p.pz * 3.1, kind: 'crate' });
    });
  });
  const dummy = new S.THREE.Object3D();
  function inst(list, geo, mat, place, kind) {
    if (!list.length) return;
    const mesh = new S.THREE.InstancedMesh(geo, mat, list.length);
    mesh.frustumCulled = false;
    mesh.userData.laneRoad = true;
    if (kind) mesh.userData.planRoad = kind;
    list.forEach((item, i) => { place(dummy, item); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
    S.scene.add(mesh);
  }
  const unit = new S.THREE.BoxGeometry(1, 1, 1);
  const mark = new S.THREE.MeshBasicMaterial({ color: 0xd5dde8, toneMapped: false });
  inst(dashes, unit, mark, (d, it) => {
    d.position.set(it.x, 0.12, it.z);
    d.rotation.set(0, Math.atan2(it.tx, it.tz), 0);
    d.scale.set(0.14, 0.02, 1.3);
  }, 'mark');
  inst(curbs, unit, new S.THREE.MeshStandardMaterial({ color: 0x3a404c, roughness: 0.7 }), (d, it) => {
    d.position.set(it.x, 0.14, it.z);
    d.rotation.set(0, Math.atan2(it.tx, it.tz), 0);
    d.scale.set(0.18, 0.12, 1.6);
  }, 'road');
  inst(stripes, unit, mark, (d, it) => {
    d.position.set(it.x, 0.13, it.z);
    d.rotation.set(0, it.yaw, 0);
    d.scale.set(0.32, 0.02, 1.5);
  }, 'mark');
  inst(props.filter(p => p.kind === 'bin'), unit, new S.THREE.MeshStandardMaterial({ color: 0x1a1e24 }), (d, it) => {
    d.position.set(it.x, 0.45, it.z); d.rotation.set(0, 0, 0); d.scale.set(0.5, 0.7, 0.4);
  });
  inst(props.filter(p => p.kind === 'crate'), unit, new S.THREE.MeshStandardMaterial({ color: 0x3a3228, roughness: 0.8 }), (d, it) => {
    d.position.set(it.x, 0.26, it.z); d.rotation.set(0, it.x, 0); d.scale.set(0.5, 0.38, 0.46);
  });
  console.info('[lane] runs', runs.length, 'pts', runs.reduce((n, r) => n + r.length, 0));
}


S.varRibbon = function varRibbon(pts, yOf, closed) {
  const pos=[], nrm=[], idx=[];
  const n=pts.length;
  const tang=pts.map((p,i)=>{
    const a=closed ? pts[(i-1+n)%n] : pts[Math.max(0,i-1)];
    const b=closed ? pts[(i+1)%n] : pts[Math.min(n-1,i+1)];
    let x=b.x-a.x, z=b.z-a.z; const l=Math.hypot(x,z)||1;
    return {x:x/l,z:z/l};
  });
  pts.forEach((p,i)=>{
    const t=tang[i];
    const half=(p.w||7)/2;
    const px = p.nx != null ? p.nx * half : -t.z * half;
    const pz = p.nz != null ? p.nz * half : t.x * half;
    const y=yOf(p,i);
    pos.push(p.x-px,y,p.z-pz, p.x+px,y,p.z+pz);
    nrm.push(0,1,0,0,1,0);
  });
  const last=closed?n:n-1;
  for(let i=0;i<last;i++){
    const j=(i+1)%n;
    const a=i*2,b=a+1,c=j*2,d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  const g=new S.THREE.BufferGeometry();
  g.setAttribute('position', new S.THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('normal', new S.THREE.Float32BufferAttribute(nrm,3));
  g.setIndex(idx);
  return g;
}



S.sealRoads = function sealRoads() {
  if (!window.__city || !window.__highway || window.__roadsSealed) return;
  window.__roadsSealed = true;
  const buildings = [];
  window.__city.updateMatrixWorld(true);
  window.__city.traverse(o => { if (o.isMesh && o.geometry) buildings.push(o); });
  S.megaGroup.updateMatrixWorld(true);
  S.megaGroup.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const box = new S.THREE.Box3().setFromObject(o);
    const size = box.getSize(new S.THREE.Vector3());
    if (size.y > 8 && size.x < 55 && size.z < 55) buildings.push(o);
  });
  const ray = new S.THREE.Raycaster();
  const down = new S.THREE.Vector3(0, -1, 0);
  const blocked = (x, z) => {
    if (Math.abs(x) < S.FW / 2 + 0.6 && Math.abs(z) < S.FD / 2 + 0.6) return true;
    ray.set(new S.THREE.Vector3(x, 80, z), down);
    const hit = ray.intersectObjects(buildings, false)[0];
    return !!(hit && hit.point.y > 1.5);
  };
  window.__footBlocked = blocked;
  function spanClear(p, n, halfW) {
    const dx = n.x - p.x, dz = n.z - p.z, len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    for (const t of [0.2, 0.5, 0.8]) {
      const x = p.x + dx * t, z = p.z + dz * t;
      for (const s of [-1, -0.5, 0, 0.5, 1]) {
        if (blocked(x + px * halfW * s, z + pz * halfW * s)) return false;
      }
    }
    return true;
  }
  const walk = S.scene.getObjectByName('avenue-walk');
  const road = S.scene.getObjectByName('avenue-road');
  let avenueHits = 0;
  if (road) {
    road.updateMatrixWorld(true);
    const box = new S.THREE.Box3().setFromObject(road);
    for (let x = box.min.x + 1; x <= box.max.x - 1; x += 4) {
      for (let z = box.min.z + 1; z <= box.max.z - 1; z += 4) if (blocked(x, z)) avenueHits++;
    }
    if (avenueHits && walk) {
      const full = new S.THREE.Box3().setFromObject(walk);
      S.scene.remove(walk); S.scene.remove(road);
      for (let z = full.min.z; z < full.max.z - 0.05; z += 4) {
        const h = Math.min(4, full.max.z - z);
        const zc = z + h / 2;
        let roadOk = true, walkOk = true;
        for (let x = -8; x <= 8; x += 4) if (blocked(x, zc)) roadOk = false;
        for (let x = -15; x <= 15; x += 5) if (blocked(x, zc)) walkOk = false;
        if (walkOk) {
          const m = new S.THREE.Mesh(new S.THREE.PlaneGeometry(33, h), walk.material);
          m.rotation.x = -Math.PI / 2; m.position.set(0, 0.04, zc);
          m.userData.planRoad = 'walk'; S.scene.add(m);
        }
        if (roadOk) {
          const m = new S.THREE.Mesh(new S.THREE.PlaneGeometry(16.2, h), road.material);
          m.rotation.x = -Math.PI / 2; m.position.set(0, 0.07, zc);
          m.userData.planRoad = 'road'; S.scene.add(m);
        }
      }
    }
  }
  const hw = window.__highway;
  const runs = [];
  let run = [], dropped = 0;
  for (let i = 0; i < hw.length - 1; i++) {
    if (spanClear(hw[i], hw[i + 1], 5.6)) {
      if (!run.length) run.push(hw[i]);
      run.push(hw[i + 1]);
    } else {
      dropped++;
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  if (window.__hwGroup) { S.scene.remove(window.__hwGroup); window.__hwGroup = null; }
  S.buildOrangeHighway();
  const drop = [];
  S.scene.traverse(o => { if (o.userData && o.userData.laneRoad) drop.push(o); });
  drop.forEach(o => { if (o.parent) o.parent.remove(o); });
  window.__laneDressed = false;
  if (window.__lane) S.dressLane(window.__lane);
  const marks = [];
  S.scene.traverse(o => {
    if (!o.isMesh || o.userData.planRoad !== 'mark' || o.isInstancedMesh) return;
    if (blocked(o.position.x, o.position.z)) marks.push(o);
  });
  marks.forEach(o => { if (o.parent) o.parent.remove(o); });
  let overlap = 0, checked = 0;
  S.scene.updateMatrixWorld(true);
  S.scene.traverse(o => {
    if (!o.isMesh || !o.userData.planRoad || o.userData.planRoad === 'mark') return;
    const box = new S.THREE.Box3().setFromObject(o);
    const sx = Math.max(3, (box.max.x - box.min.x) / 5);
    const sz = Math.max(3, (box.max.z - box.min.z) / 5);
    for (let x = box.min.x; x <= box.max.x; x += sx) {
      for (let z = box.min.z; z <= box.max.z; z += sz) {
        checked++;
        if (blocked(x, z)) overlap++;
      }
    }
  });
  window.__roadOverlap = { overlap, checked, avenueHits, dropped };
  console.info('[roads] avenueHits', avenueHits, 'hwDropped', dropped, 'overlap', overlap, '/', checked);
  window.__roadsReady = true;
}


S.applyStreetGraph = function applyStreetGraph(data) {
  window.__streets = data;
  for (const c of S.cars) {
    const lane = c.laneKey && data.lanes && data.lanes[c.laneKey];
    if (!lane || lane.length < 2) continue;
    c.route = lane;
    if (!c.model || c.g.userData.ready) c.g.visible = true;
    const p = S.pointOnLoop(c.route, c.u || 0);
    c.g.position.set(p.x, p.y, p.z);
  }
  S.addStreetLights(data.lights || []);
  S.buildDistrict(data.lanes && data.lanes.groundA);
}


S.addStreetLights = function addStreetLights(spots) {
  if (S.streetLightsOn) return;
  S.streetLightsOn = true;
  const list = (spots && spots.length) ? spots : [[-16, 13], [16, 13], [17, 0], [-17, 0], [16, -13], [-16, -13], [0, 14.5], [0, -14.5]];
  list.forEach(([x, z], i) => {
    const col = i % 2 ? 0xff2a6d : 0x00f0ff;
    S.box(0.16, 4.4, 0.16, S.M(0x12161e, { metalness: 0.7, roughness: 0.4 }), x, 2.2, z);
    S.box(0.85, 0.08, 0.18, S.E(col, 3.2), x, 4.35, z);
    // Glowing head on every pole. A real light only on every 4th.
    if (i % 4 === 0) {
      const L = new S.THREE.PointLight(col, 22, 18, 1.8);
      L.position.set(x, 4.2, z);
      S.scene.add(L);
    }
  });
}


S.loadCyberCity = function loadCyberCity() {
  S.gltfLoader.load('assets/city/cyberpunk-city.glb', (gltf) => {
    const city = gltf.scene;
    city.name = 'cyber-city';
    city.scale.setScalar(S.CITY_SCALE);
    city.position.set(-S.CITY_MID_X * S.CITY_SCALE, 0, -S.CITY_MID_Z * S.CITY_SCALE);
    city.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        if (!m || !m.emissive) return;
        const e = m.emissive.r + m.emissive.g + m.emissive.b;
        if (e > 0.12) {
          m.emissiveIntensity = 2.6;
          m.toneMapped = false;
        } else {
          m.roughness = Math.max(m.roughness == null ? 0.62 : m.roughness, 0.5);
          m.metalness = Math.min(m.metalness || 0, 0.2);
        }
      });
    });
    S.scene.add(city);
    city.updateMatrixWorld(true);
    S.darkenCityGround(city);
    window.__city = city;
    if (window.__streets) S.addStreetLights(window.__streets.lights || []);
    S.dressCityFacades(city);
    S.sealRoads();
  }, undefined, (err) => { console.error('city', err); });
}


S.darkenCityGround = function darkenCityGround(city) {
  const box = new S.THREE.Box3();
  const size = new S.THREE.Vector3();
  city.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    box.setFromObject(o);
    box.getSize(size);
    if (/Roof|SideCap|Neon/.test(o.name || '')) return;
    const flat = size.y < Math.max(size.x, size.z) * 0.4 && box.min.y < 2.2;
    if (!flat) return;
    const wide = Math.max(size.x, size.z) > 14;
    const mats = [].concat(o.material);
    mats.forEach(m => {
      if (!m || !m.color) return;
      if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.45) return;
      // Flat city slabs are the ground roads and sidewalks. Keep them matte and dark
      // so night exposure and bloom cannot turn them white.
      m.map = wide ? S.asphaltMap() : S.pavingMap();
      m.color.set(wide ? 0x14181c : 0x323840);
      m.map = null;
      m.emissive && m.emissive.set(0x000000);
      m.emissiveIntensity = 0;
      m.emissiveMap = null;
      m.roughness = wide ? 0.94 : 0.9;
      m.metalness = 0.02;
      m.toneMapped = true;
      m.needsUpdate = true;
    });
  });
}


S.dressCityFacades = function dressCityFacades(city) {
  const meshes = [];
  city.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position) meshes.push(o); });
  const ray = new S.THREE.Raycaster();
  const seen = new Set();
  const p = [new S.THREE.Vector3(), new S.THREE.Vector3(), new S.THREE.Vector3()];
  const e1 = new S.THREE.Vector3(), e2 = new S.THREE.Vector3(), nrm = new S.THREE.Vector3(), c = new S.THREE.Vector3();
  const probe = new S.THREE.Vector3();
  const faces = [];
  const roofs = [];
  meshes.forEach(m => {
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
  });
  let meshI = 0, triI = 0;
  function stepFacades() {
    const t0 = performance.now();
    while (meshI < meshes.length && performance.now() - t0 < 32) {
      const mesh = meshes[meshI];
      if (/Roof|SideCap/.test(mesh.name || '')) { meshI++; triI = 0; continue; }
      const pos = mesh.geometry.attributes.position;
      const index = mesh.geometry.index;
      const count = index ? index.count : pos.count;
      const stride = Math.max(3, Math.floor(count / 900) * 3);
      if (triI + 2 >= count) { meshI++; triI = 0; continue; }
      scanSamples(mesh, pos, index, count, stride, t0);
      if (triI + 2 >= count) { meshI++; triI = 0; }
    }
    if (meshI < meshes.length) requestAnimationFrame(stepFacades);
    else finishFacades();
  }
  function scanSamples(mesh, pos, index, count, stride, t0) {
    for (let i = triI; i + 2 < count; i += stride) {
      if (performance.now() - t0 > 32) { triI = i; return; }
      triI = i + stride;
      for (let k = 0; k < 3; k++) {
        const vi = index ? index.getX(i + k) : i + k;
        p[k].fromBufferAttribute(pos, vi).applyMatrix4(mesh.matrixWorld);
      }
      e1.subVectors(p[1], p[0]);
      e2.subVectors(p[2], p[0]);
      nrm.crossVectors(e1, e2);
      const area = nrm.length();
      if (area < 1.4) continue;
      nrm.multiplyScalar(1 / area);
      c.copy(p[0]).add(p[1]).add(p[2]).multiplyScalar(1 / 3);
      if (c.y < 1.2 || c.y > 29 || Math.hypot(c.x, c.z) < 18) continue;
      if (Math.abs(nrm.y) < 0.45) {
        const key = (Math.floor(c.x / 3.4) + ',' + Math.floor(c.z / 3.4) + ',' + Math.floor(c.y / 3.2)
          + ',' + (nrm.x > 0.4 ? 1 : nrm.x < -0.4 ? -1 : 0) + ',' + (nrm.z > 0.4 ? 1 : nrm.z < -0.4 ? -1 : 0));
        if (seen.has(key)) continue;
        seen.add(key);
        probe.copy(c).addScaledVector(nrm, 0.35);
        ray.set(probe, nrm);
        const into = ray.intersectObjects(meshes, false)[0];
        if (into && into.distance < 1.15) nrm.negate();
        probe.copy(c).addScaledVector(nrm, 0.25);
        ray.set(probe, nrm);
        const out = ray.intersectObjects(meshes, false)[0];
        const clear = out ? out.distance : 16;
        if (clear < 1.8) continue;
        const horiz = Math.hypot(nrm.x, nrm.z) || 1;
        faces.push({ x: c.x, y: c.y, z: c.z, nx: nrm.x / horiz, nz: nrm.z / horiz, clear });
      } else if (nrm.y > 0.75) {
        const key = 'r' + Math.floor(c.x / 4) + ',' + Math.floor(c.z / 4);
        if (seen.has(key)) continue;
        seen.add(key);
        roofs.push({ x: c.x, y: c.y + 0.2, z: c.z });
      }
    }
  }
  function finishFacades() {

  faces.sort((a, b) => (b.nz - a.nz) || (b.clear - a.clear));
  function paint() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#05070c';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#f2f6ff';
    g.fillRect(7, 7, 50, 50);
    g.fillStyle = '#05070c';
    g.fillRect(30, 7, 4, 50);
    g.fillRect(7, 30, 50, 4);
    const tex = new S.THREE.CanvasTexture(c);
    tex.colorSpace = S.THREE.SRGBColorSpace;
    tex.magFilter = S.THREE.NearestFilter;
    tex.minFilter = S.THREE.NearestFilter;
    return tex;
  }
  const winMat = new S.THREE.MeshBasicMaterial({ map: paint(), color: 0xffffff, toneMapped: false });
  const q = new S.THREE.Quaternion();
  const up = new S.THREE.Vector3(0, 0, 1);
  const dir = new S.THREE.Vector3();
  const dummy = new S.THREE.Object3D();
  const winColors = [0x7ef6ff, 0xff4d88, 0xf0d078, 0xd8fff4, 0x9ecbff, 0xff9ec4];
  const windows = [], frames = [], awnings = [], acs = [], trims = [], balconies = [], rails = [];
  const pipes = [], vents = [], escapes = [], boards = [], holos = [], ledges = [], bands = [];
  const placed = new Set();
  const back = new S.THREE.Vector3();
  faces.forEach((f, i) => {
    dir.set(f.nx, 0, f.nz);
    const tx = -dir.z, tz = dir.x;
    const colKey = Math.round(f.x / 2.8) + ',' + Math.round(f.z / 2.8) + ',' + Math.round(dir.x) + ',' + Math.round(dir.z);
    if (placed.has(colKey)) return;
    placed.add(colKey);
    let rows = 0;
    for (let py = 2.5; py <= 20 && rows < 7; py += 2.15) {
      probe.set(f.x + dir.x * 1.35, py, f.z + dir.z * 1.35);
      back.set(-dir.x, 0, -dir.z);
      ray.set(probe, back);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (!hit || !hit.face || hit.distance < 0.35 || hit.distance > 2.3) continue;
      const hp = hit.point;
      if (Math.hypot(hp.x - f.x, hp.z - f.z) > 2.4) continue;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      const hn = Math.hypot(n.x, n.z) || 1;
      if (Math.abs((n.x / hn) * dir.x + (n.z / hn) * dir.z) < 0.72) continue;
      const rowKey = 'w' + Math.round(hp.x / 2.2) + ',' + Math.round(hp.z / 2.2) + ',' + Math.round(py / 2.15);
      if (placed.has(rowKey)) continue;
      placed.add(rowKey);
      rows++;
      if (!f.anchor || rows === 3) f.anchor = { x: hp.x, y: hp.y, z: hp.z };
      const shop = py < 4.15;
      const oxs = shop ? [0] : [-0.76, 0.04, 0.84];
      oxs.forEach(ox => {
        if (windows.length > 1500) return;
        const lit = (i + rows + Math.round(ox * 2)) % 5 !== 0;
        windows.push({
          x: hp.x + dir.x * 0.14 + tx * ox, y: hp.y + (shop ? 0.2 : 0.08), z: hp.z + dir.z * 0.14 + tz * ox,
          nx: dir.x, nz: dir.z, sx: shop ? 1.65 : 0.62, sy: shop ? 1.02 : 0.7,
          color: lit ? winColors[(i + rows) % winColors.length] : 0x161c28,
        });
        frames.push({
          x: hp.x + dir.x * 0.06 + tx * ox, y: hp.y + (shop ? 0.2 : 0.08), z: hp.z + dir.z * 0.06 + tz * ox,
          nx: dir.x, nz: dir.z, sx: shop ? 1.9 : 0.78, sy: shop ? 1.24 : 0.86, sz: 0.05,
        });
      });
      if (shop && awnings.length < 64) {
        awnings.push({ x: hp.x + dir.x * 0.58, y: hp.y + 0.9, z: hp.z + dir.z * 0.58, nx: dir.x, nz: dir.z, sx: 2.0 });
      }
      if (rows % 2 === 0 && ledges.length < 150) {
        ledges.push({ x: hp.x + dir.x * 0.26, y: hp.y + 0.62, z: hp.z + dir.z * 0.26, nx: dir.x, nz: dir.z, sx: 2.05 });
      }
      if (rows === 2 && bands.length < 80) {
        bands.push({ x: hp.x + dir.x * 0.06, y: hp.y - 0.15, z: hp.z + dir.z * 0.06, nx: dir.x, nz: dir.z, sx: 2.15 });
      }
      if (rows % 3 === 0 && trims.length < 150) {
        trims.push({
          x: hp.x + dir.x * 0.1, y: hp.y + 0.78, z: hp.z + dir.z * 0.1, nx: dir.x, nz: dir.z,
          color: (i + rows) % 2 ? 0xff2a6d : 0x39f3ff, sx: 2.05,
        });
      }
      if (rows === 3 && acs.length < 70) {
        acs.push({ x: hp.x + dir.x * 0.3 + tx * 1.02, y: hp.y, z: hp.z + dir.z * 0.3 + tz * 1.02, nx: dir.x, nz: dir.z });
        vents.push({ x: hp.x + dir.x * 0.16 - tx * 0.15, y: hp.y + 0.85, z: hp.z + dir.z * 0.16 - tz * 0.15, nx: dir.x, nz: dir.z });
      }
      if (rows === 4 && py > 5 && balconies.length < 42) {
        balconies.push({ x: hp.x + dir.x * 0.48, y: hp.y - 0.42, z: hp.z + dir.z * 0.48, nx: dir.x, nz: dir.z });
        rails.push({ x: hp.x + dir.x * 0.78, y: hp.y - 0.16, z: hp.z + dir.z * 0.78, nx: dir.x, nz: dir.z });
      }
      if (rows === 2 && pipes.length < 48) {
        pipes.push({ x: hp.x + dir.x * 0.2 - tx * 1.2, y: hp.y + 0.4, z: hp.z + dir.z * 0.2 - tz * 1.2 });
      }
      if (rows === 5 && py > 6 && escapes.length < 22) {
        escapes.push({ x: hp.x + dir.x * 0.62 + tx * 1.15, y: hp.y, z: hp.z + dir.z * 0.62 + tz * 1.15, nx: dir.x, nz: dir.z });
      }
      if (rows === 6 && boards.length + holos.length < 18) {
        const item = { x: hp.x + dir.x * 0.32, y: hp.y + 0.15, z: hp.z + dir.z * 0.32, nx: dir.x, nz: dir.z, color: i % 2 ? 0xff2a9a : 0x19f0ff };
        if (i % 2) holos.push(item); else boards.push(item);
      }
    }
    f.rows = rows;
  });
  function spawn(list, geo, mat, place) {
    if (!list.length) return;
    const mesh = new S.THREE.InstancedMesh(geo, mat, list.length);
    const tinted = list.some(item => item.color != null);
    if (tinted) mesh.instanceColor = new S.THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    const white = new S.THREE.Color(0xffffff);
    list.forEach((item, n) => {
      place(item);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      if (tinted) mesh.setColorAt(n, item.color != null ? new S.THREE.Color(item.color) : white);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    S.scene.add(mesh);
  }
  const faceOf = (item) => {
    dir.set(item.nx, 0, item.nz).normalize();
    q.setFromUnitVectors(up, dir);
    dummy.quaternion.copy(q);
    dummy.position.set(item.x, item.y, item.z);
    dummy.scale.set(item.sx || 1, item.sy || 1, item.sz || 0.08);
  };
  const unit = new S.THREE.BoxGeometry(1, 1, 1);
  spawn(windows, unit, winMat, faceOf);
  spawn(frames, unit, new S.THREE.MeshStandardMaterial({ color: 0x12161c, metalness: 0.45, roughness: 0.4 }), faceOf);
  spawn(awnings, unit, new S.THREE.MeshStandardMaterial({ color: 0x3a1824, roughness: 0.55, metalness: 0.15 }), (item) => {
    faceOf(item); dummy.scale.set(item.sx || 1.8, 0.07, 0.85);
  });
  spawn(ledges, unit, new S.THREE.MeshStandardMaterial({ color: 0x2c3340, metalness: 0.4, roughness: 0.5 }), (item) => {
    faceOf(item); dummy.scale.set(item.sx || 2, 0.07, 0.5);
  });
  spawn(bands, unit, new S.THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.3, roughness: 0.7 }), (item) => {
    faceOf(item); dummy.scale.set(item.sx || 2.2, 0.16, 0.05);
  });
  spawn(acs, unit, new S.THREE.MeshStandardMaterial({ color: 0x343c48, metalness: 0.55, roughness: 0.4 }), (item) => {
    faceOf(item); dummy.scale.set(0.62, 0.36, 0.32);
  });
  spawn(trims, unit, new S.THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), (item) => {
    faceOf(item); dummy.scale.set(item.sx || 1.8, 0.055, 0.045);
  });
  spawn(balconies, unit, new S.THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.35, roughness: 0.55 }), (item) => {
    faceOf(item); dummy.scale.set(1.35, 0.06, 0.7);
  });
  spawn(rails, unit, new S.THREE.MeshStandardMaterial({ color: 0x8a939e, metalness: 0.7, roughness: 0.3 }), (item) => {
    faceOf(item); dummy.scale.set(1.35, 0.28, 0.04);
  });
  spawn(pipes, unit, new S.THREE.MeshStandardMaterial({ color: 0x3a444e, metalness: 0.72, roughness: 0.32 }), (item) => {
    dummy.quaternion.identity();
    dummy.position.set(item.x, item.y, item.z);
    dummy.scale.set(0.12, 2.5, 0.12);
  });
  spawn(vents, unit, new S.THREE.MeshStandardMaterial({ color: 0x1c222c, metalness: 0.5, roughness: 0.45 }), (item) => {
    faceOf(item); dummy.scale.set(0.55, 0.28, 0.1);
  });
  spawn(escapes, unit, new S.THREE.MeshStandardMaterial({ color: 0x4a545e, metalness: 0.65, roughness: 0.38 }), (item) => {
    faceOf(item); dummy.scale.set(0.72, 3.1, 0.28);
  });
  spawn(boards, unit, new S.THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), (item) => {
    faceOf(item); dummy.scale.set(2.15, 1.15, 0.06);
  });
  spawn(holos, unit, new S.THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.82, blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), (item) => { faceOf(item); dummy.scale.set(1.7, 0.95, 0.04); });
  const clutter = roofs.slice(0, 72);
  const tanks = [], antennas = [], dishes = [], fans = [];
  clutter.forEach((r, i) => {
    if (i % 4 === 0) tanks.push(r);
    else if (i % 4 === 1) antennas.push(r);
    else if (i % 4 === 2) dishes.push(r);
    else fans.push(r);
  });
  const dark = new S.THREE.MeshStandardMaterial({ color: 0x2a313c, metalness: 0.55, roughness: 0.42 });
  const steel = new S.THREE.MeshStandardMaterial({ color: 0x6e7682, metalness: 0.75, roughness: 0.3 });
  spawn(tanks, new S.THREE.CylinderGeometry(0.45, 0.45, 0.7, 8), dark, (item) => {
    dummy.quaternion.identity();
    dummy.position.set(item.x, item.y + 0.45, item.z);
    dummy.scale.set(1, 1, 1);
  });
  spawn(antennas, unit, steel, (item) => {
    dummy.quaternion.identity();
    dummy.position.set(item.x + 0.6, item.y + 1.05, item.z);
    dummy.scale.set(0.06, 1.7, 0.06);
  });
  const tilt = new S.THREE.Quaternion().setFromAxisAngle(new S.THREE.Vector3(1, 0, 0), 1.05);
  spawn(dishes, new S.THREE.CylinderGeometry(0.55, 0.55, 0.08, 10), steel, (item) => {
    dummy.quaternion.copy(tilt);
    dummy.position.set(item.x - 0.5, item.y + 0.55, item.z + 0.2);
    dummy.scale.set(1, 1, 1);
  });
  spawn(fans, new S.THREE.CylinderGeometry(0.42, 0.42, 0.1, 6), dark, (item) => {
    dummy.quaternion.identity();
    dummy.position.set(item.x, item.y + 0.2, item.z + 0.5);
    dummy.scale.set(1, 1, 1);
  });
  let best = null;
  const cam = new S.THREE.Vector3(), look = new S.THREE.Vector3(), aim = new S.THREE.Vector3();
  faces.forEach(f => {
    if (!f.anchor || f.rows < 3 || f.nz < 0.65 || f.clear < 5 || Math.abs(f.x) > 36) return;
    const a = f.anchor;
    cam.set(a.x + f.nx * 9.5, a.y + 0.2, a.z + f.nz * 9.5);
    look.set(a.x, a.y + 1.4, a.z);
    aim.copy(look).sub(cam).normalize();
    ray.set(cam, aim);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (hit && hit.distance < 6.5) return;
    const score = f.rows * 4 + f.clear + f.nz * 3;
    if (!best || score > best.score) best = { score, f, cam: cam.clone(), look: look.clone() };
  });
  if (best) {
    window.__facadeShot = {
      pos: [best.cam.x, best.cam.y, best.cam.z],
      tgt: [best.look.x, best.look.y, best.look.z],
    };
  }
  console.info('[facades]', faces.length, 'walls', windows.length, 'windows', awnings.length, 'awnings', roofs.length, 'roofs', best && best.f);
  window.__facadesReady = true;
  }
  stepFacades();
}

S.loadAtomTower = function loadAtomTower() {
  S.gltfLoader.load('assets/city/atom-skyscraper.glb', (gltf) => {
    const atom = gltf.scene;
    atom.name = 'atom-tower';
    // The northeast lot is a 6.6 m square. Height is the H tower crown, a bit taller.
    // X/Z stay on the lot; Y is stretched so it reads as a spire.
    atom.scale.set(6.6 / 0.972, 72 / 4.586, 6.6 / 0.571);
    // Local -X carries the ATOM face. Point that face south, back toward the H tower.
    atom.rotation.y = Math.PI / 2;
    atom.updateMatrixWorld(true);
    const box = new S.THREE.Box3().setFromObject(atom);
    const center = box.getCenter(new S.THREE.Vector3());
    atom.position.x += 42.4 - center.x;
    atom.position.z += -37.2 - center.z;
    atom.position.y += -box.min.y + 0.05;
    atom.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = true;
    });
    S.scene.add(atom);
    const cover = () => {
      if (!window.__city) return;
      window.__city.updateMatrixWorld(true);
      window.__city.traverse(o => {
        if (!o.isMesh) return;
        const b = new S.THREE.Box3().setFromObject(o);
        const s = b.getSize(new S.THREE.Vector3());
        if (s.y < 2 || s.x > 36 || s.z > 36) return;
        const cx = (b.min.x + b.max.x) / 2;
        const cz = (b.min.z + b.max.z) / 2;
        if (Math.abs(cx - 42.4) < 4.2 && Math.abs(cz + 37.2) < 4.2) o.visible = false;
      });
    };
    cover();
    window.__atom = { x: 42.4, z: -37.2, h: 72 };
    console.info('[atom] placed', window.__atom);
  }, undefined, (err) => console.error('atom', err));
}

 // 'city' | 'cars' | null — for external colormap remap
S.glbUrl = function glbUrl(path) {
  if (path.includes('/cars/')) S.__glbTexCtx = 'cars';
  else if (path.includes('/city/')) S.__glbTexCtx = 'city';
  else S.__glbTexCtx = null;
  const m = (typeof window !== 'undefined' && window.__GLB) ? window.__GLB : null;
  if (m && m[path]) return m[path];
  return path;
}


S.remapGltfUrl = function remapGltfUrl(url) {
  if (!url) return url;
  if (String(url).includes('colormap.png')) {
    const tex = (typeof window !== 'undefined' && window.__TEX) ? window.__TEX : null;
    if (tex) {
      const key = (S.__glbTexCtx === 'cars' ? 'cars' : 'city') + '/Textures/colormap.png';
      if (tex[key]) return tex[key];
      // fallback either pack
      if (tex['city/Textures/colormap.png']) return tex['city/Textures/colormap.png'];
    }
  }
  return url;
}


S.cyberpunkize = function cyberpunkize(root, { neon = 0x00f0ff, kind = 'building' } = {}) {
  root.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map((mat) => {
      // Dark gunmetal base — never keep Kenney pastel albedo as a flat plane
      const m = new S.THREE.MeshStandardMaterial({
        color: kind === 'car' ? 0x0c0e14 : 0x0a0d14,
        // keep colormap only as subtle emissive window pattern, heavily crushed
        map: null,
        metalness: kind === 'car' ? 0.92 : 0.82,
        roughness: kind === 'car' ? 0.2 : 0.38,
        emissive: new S.THREE.Color(kind === 'car' ? neon : 0x1a3048),
        emissiveMap: kind === 'building' ? (mat.map || null) : null,
        emissiveIntensity: kind === 'car' ? 0.12 : 0.22,
        envMapIntensity: 1.15
      });
      return m;
    });
    obj.material = next.length === 1 ? next[0] : next;
    obj.castShadow = false; obj.receiveShadow = kind !== 'building';
  });
}


S.groundOnY = function groundOnY(obj) {
  obj.updateMatrixWorld(true);
  const box = new S.THREE.Box3().setFromObject(obj);
  obj.position.y -= box.min.y;
}


S.loadGltf = function loadGltf(base, name) {
  return new Promise((resolve, reject) => {
    S.gltfLoader.load(S.glbUrl(base + name), gltf => resolve(gltf.scene), undefined, reject);
  });
}

export function initCitySky() {


// ---- skyline surround: one tall cylinder, no flat billboard edge ----
{ const sky = new S.THREE.Mesh(
    new S.THREE.CylinderGeometry(380, 380, 520, 96, 1, true),
    new S.THREE.MeshBasicMaterial({ map: S.texSkyline, side: S.THREE.BackSide, fog: false, toneMapped: false })
  );
  sky.position.y = 40; S.scene.add(sky);
}

// purple/cyan night dome (not pure black)
{ const dome = new S.THREE.Mesh(
    new S.THREE.SphereGeometry(420, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new S.THREE.MeshBasicMaterial({ color: 0x12062a, side: S.THREE.BackSide, fog: false })
  ); S.scene.add(dome);
  // horizon glow band
  const band = new S.THREE.Mesh(
    new S.THREE.CylinderGeometry(310, 310, 28, 64, 1, true),
    new S.THREE.MeshBasicMaterial({ color: 0x4a1a7a, side: S.THREE.BackSide, transparent: true, opacity: 0.35, fog: false, blending: S.THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  ); band.position.y = 18; S.scene.add(band);
}


// ---- wet street ground ----
S.gndMat = new S.THREE.MeshStandardMaterial({
  color: 0x1a1e24, roughness: 0.94, metalness: 0.02,
});

{ const gnd = new S.THREE.Mesh(new S.THREE.PlaneGeometry(500, 500), S.gndMat);
  gnd.rotation.x = -Math.PI / 2; gnd.position.y = 0.02; gnd.receiveShadow = true; S.scene.add(gnd);
  S.texStreet.repeat.set(14, 14);
}

// No large coloured light pools on the ground. Wet patches stay small and dim.
// dark textured kerbs (no saturated emissive planes)
for (let z = 56; z <= 106; z += 10) {
  S.box(1.4, 0.28, 8, S.M(0x1a1e26, { metalness: 0.55, roughness: 0.45, map: S.texStreet }), -17, 0.14, z);
  S.box(1.4, 0.28, 8, S.M(0x1a1e26, { metalness: 0.55, roughness: 0.45, map: S.texStreet }), 17, 0.14, z);
  // thin neon edge only
  S.box(0.06, 0.05, 7, S.E(0x00f0ff, 0.7), -17.7, 0.32, z);
  S.box(0.06, 0.05, 7, S.E(0xff2a6d, 0.7), 17.7, 0.32, z);
}

// plaza ring around tower base removed so the shrunk H tower is not ringed by a 14 m civic circle.

// Lane dashes that ran straight through the blocks were removed.

// ---- Night City canyon: irregular megatowers, setbacks, neon, skybridges, haze ----
S.rng = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

S.tints = [0xffffff, 0xffd0ff, 0xc8f8ff, 0xffe8f4, 0xe8ffff, 0xfff0e0];

S.megaGroup = new S.THREE.Group();
 S.scene.add(S.megaGroup);

S.blinkers = [];

S.neonFlickers = [];

// Portrait cells on the sheet are about 1:3.4. A 26m plane stretched one banner
// into smeared stacked strokes, and a second banner sat on the same corner.
S.NEON_W = 2.45, S.NEON_H = 8.25;

S.neonSlots = [];

S.megas = [];

// Clear center corridor so sky + HQ silhouette read. Framing towers at MID distance with gaps.
// LAYER 0 — near frame (left/right, pulled back from lens)
for (const side of [-1, 1]) {
  for (let i = 0; i < 3; i++) {
    const x = side * (46 + i * 16 + S.rng() * 4);
    const z = 6 - i * 18 - S.rng() * 4;
    if (Math.abs(x) < 38) continue;
    if (Math.hypot(x, z) < 112) continue;
    const h = 85 + S.rng() * 55;
    S.megas.push(S.makeMega(x, z, h, 11 + S.rng() * 8, 10 + S.rng() * 7, i + (side > 0 ? 3 : 0), 0));
  }
}

// LAYER 1 — mid depth (frame gaps, see through to far)
for (const side of [-1, 1]) {
  for (let i = 0; i < 6; i++) {
    const x = side * (58 + S.rng() * 40);
    const z = -15 - S.rng() * 55;
    if (Math.hypot(x, z) < 112) continue;
    S.megas.push(S.makeMega(x, z, 70 + S.rng() * 80, 9 + S.rng() * 11, 9 + S.rng() * 9, i + 4, 1));
  }
}

// LAYER 2 — far city ring (behind HQ / skyline)
for (let i = 0; i < 36; i++) {
  const a = -Math.PI * 0.15 + S.rng() * Math.PI * 1.3; // mostly behind
  const r = 100 + S.rng() * 90;
  const x = Math.cos(a) * r, z = Math.sin(a) * r - 40;
  if (z > 10) continue;
  if (Math.hypot(x - 22, z + 22) < 35) continue; // HQ clearance
  if (Math.abs(x) < 30 && z < 5 && z > -40) continue; // center corridor
  if (Math.hypot(x, z) < 118) continue;
  S.megas.push(S.makeMega(x, z, 50 + S.rng() * 95, 8 + S.rng() * 12, 8 + S.rng() * 10, i, 2));
}


// Skybridges — offset to sides so they frame rather than wall the shot
for (let i = 0; i < 3; i++) {
  const y = 36 + i * 12, z = -132 - i * 8;
  const len = 40 + S.rng() * 20;
  const sx0 = (i % 2 ? 1 : -1) * 42;
  S.box(len, 0.8, 2.4, S.M(0x1a2030, { metalness: 0.8, roughness: 0.35 }), sx0, y, z, S.megaGroup);
  S.box(len, 0.06, 0.06, S.E(0x00f0ff, 0.7), sx0, y + 0.45, z - 1.0, S.megaGroup);
  S.box(len, 0.06, 0.06, S.E(0xff2a6d, 0.7), sx0, y + 0.45, z + 1.0, S.megaGroup);
}

// elevated highways deeper — dark deck only, no neon rails banding the frame
for (let i = 0; i < 3; i++) {
  const y = 22 + i * 10, z = -155 - i * 8;
  for (let x = -100; x <= 100; x += 4) {
    if (Math.abs(x) < 22) continue; // keep clear of tower + HQ sightline
    S.box(3.4, 0.35, 1.5, S.M(0x1a2030, { metalness: 0.7 }), x, y, z, S.megaGroup);
  }
}


S.buildOldSiteFill = function buildOldSiteFill() {
  const spec = S.OLD_SITE || { x: 10, z: 2, w: 12, d: 6, rot: 128, h: 18 };
  const g = new S.THREE.Group();
  g.name = 'old-hq-block';
  const h = spec.h || 18;
  const w = spec.w, d = spec.d;
  const baseH = h * 0.62, topH = h * 0.28, roofH = 0.7;
  const facade = S.facadeMat(2, Math.max(1.2, w / 6), Math.max(1.8, baseH / 10));
  const upper = S.facadeMat(3, Math.max(1.0, w / 7), Math.max(1.4, topH / 8));
  const dark = S.M(0x141820, { metalness: 0.62, roughness: 0.42 });
  S.box(w, baseH, d, facade, 0, baseH / 2, 0, g);
  S.box(w * 0.72, topH, d * 0.7, upper, 0, baseH + topH / 2, 0, g);
  S.box(w * 0.8, roofH, d * 0.78, dark, 0, baseH + topH + roofH / 2, 0, g);
  // corner neon, same language as the surrounding blocks, kept dim
  const ec = 0x00f0ff, em = 0xff2a6d;
  S.box(0.12, baseH, 0.12, S.E(ec, 1.2), w / 2, baseH / 2, d / 2, g);
  S.box(0.1, baseH, 0.1, S.E(em, 0.9), -w / 2, baseH / 2, -d / 2, g);
  const ant = 5.5;
  S.box(0.18, ant, 0.18, S.M(0x555a70, { metalness: 0.85 }), w * 0.15, baseH + topH + roofH + ant / 2, d * 0.1, g);
  S.box(0.12, ant * 0.7, 0.12, S.M(0x555a70, { metalness: 0.85 }), -w * 0.18, baseH + topH + roofH + ant * 0.35, -d * 0.12, g);
  g.position.set(spec.x, 0, spec.z);
  g.rotation.y = (spec.rot || 0) * Math.PI / 180;
  S.scene.add(g);
  S.oldSiteFill = g;
  S.oldSiteFillMeta = { x: spec.x, z: spec.z, w, d, rot: spec.rot || 0, h };
  console.info('[old-site] mid-rise fill', S.oldSiteFillMeta);
};

S.buildOldSiteFill();

// Side billboards only. A second vertical neon here used to ghost through the first.
S.megas.filter(m => m.depth === 0).forEach((m, i) => {
  const face = m.x >= 0 ? -1 : 1;
  if (i % 2 === 0) S.addBillboard(m.x + face * (m.w / 2 + 0.4), Math.min(m.topY * 0.55, 50), m.z, face > 0 ? Math.PI / 2 : -Math.PI / 2, i, 12, 6.5);
});

S.hazePlane(-25, 0x6a2a8a, 0.06);

S.hazePlane(-45, 0x3a1a6a, 0.07);

S.hazePlane(-70, 0x1a3a7a, 0.06);

S.hazePlane(-100, 0x2a0a5a, 0.08);

S.hazePlane(-140, 0x0a1528, 0.1);

// rim light boost for city
S.scene.add(new S.THREE.AmbientLight(0x1a0a28, 0.25));

S.cityRim = new S.THREE.DirectionalLight(0xff2a6d, 0.45);
 S.cityRim.position.set(-60, 40, -40);
 S.scene.add(S.cityRim);

S.cityRim2 = new S.THREE.DirectionalLight(0x00f0ff, 0.4);
 S.cityRim2.position.set(50, 30, -60);
 S.scene.add(S.cityRim2);


// ---- Original corporate HQ megatower (not any trademarked brand) ----
{
  // Behind+right of our tower — body must read as a building, emblem is a logo on it
  const CX = 28, CZ = -28;
  const H = 160, W = 22, D = 16;
  const embY = 52; // above our roof sign (~37), not a floating orb
  const glassBlk = new S.THREE.MeshPhysicalMaterial({
    color: 0x07080e, metalness: 0.9, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.15,
    emissive: 0x0a0608, emissiveIntensity: 0.2
  });
  const redStrip = new S.THREE.MeshStandardMaterial({
    color: 0x14060a, emissive: 0x8a1824, emissiveIntensity: 0.22,
    roughness: 0.5, metalness: 0.12,
  });
  // window grid texture (canvas) — faint lit windows so the shaft reads
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 512;
  const wx = wc.getContext('2d');
  wx.fillStyle = '#05060a'; wx.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 48; row++) for (let col = 0; col < 12; col++) {
    if (Math.random() > 0.35) {
      const lit = Math.random();
      wx.fillStyle = lit > 0.7 ? 'rgba(255,80,100,0.55)' : (lit > 0.4 ? 'rgba(255,200,180,0.35)' : 'rgba(80,100,140,0.25)');
      wx.fillRect(8 + col * 20, 6 + row * 10, 12, 6);
    }
  }
  const winTex = new S.THREE.CanvasTexture(wc); winTex.wrapS = winTex.wrapT = S.THREE.RepeatWrapping;
  winTex.repeat.set(1, 3); winTex.colorSpace = S.THREE.SRGBColorSpace;
  const winMat = new S.THREE.MeshStandardMaterial({
    color: 0x0a0c14, map: winTex, emissive: 0xffffff, emissiveMap: winTex,
    emissiveIntensity: 0.55, metalness: 0.7, roughness: 0.35
  });
  let y = 0, w = W, d = D;
  for (let i = 0; i < 4; i++) {
    const seg = H * (i === 0 ? 0.48 : i === 3 ? 0.12 : 0.2);
    S.box(w, seg, d, glassBlk, CX, y + seg / 2, CZ, S.megaGroup);
    // window faces (camera-facing + sides) so body is visible
    const face = new S.THREE.Mesh(new S.THREE.PlaneGeometry(w * 0.92, seg * 0.95), winMat);
    face.position.set(CX, y + seg / 2, CZ + d / 2 + 0.05); S.megaGroup.add(face);
    const sideL = new S.THREE.Mesh(new S.THREE.PlaneGeometry(d * 0.92, seg * 0.95), winMat);
    sideL.position.set(CX - w / 2 - 0.05, y + seg / 2, CZ); sideL.rotation.y = Math.PI / 2; S.megaGroup.add(sideL);
    const sideR = new S.THREE.Mesh(new S.THREE.PlaneGeometry(d * 0.92, seg * 0.95), winMat.clone());
    sideR.position.set(CX + w / 2 + 0.05, y + seg / 2, CZ); sideR.rotation.y = -Math.PI / 2; S.megaGroup.add(sideR);
    // red corner strips full segment height
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const strip = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, seg, 0.16), redStrip);
      strip.position.set(CX + sx * (w / 2), y + seg / 2, CZ + sz * (d / 2));
      S.megaGroup.add(strip);
    }
    y += seg; w *= 0.9; d *= 0.92;
  }
  // red crown band on the building (not a free-floating glow)
  const crown = new S.THREE.Mesh(new S.THREE.BoxGeometry(w * 1.1, 3.2, d * 1.1), redStrip);
  crown.position.set(CX, y - 2, CZ); S.megaGroup.add(crown);
  // blade spire
  const spireH = 36;
  const spire = new S.THREE.Mesh(
    new S.THREE.ConeGeometry(w * 0.35, spireH, 4),
    new S.THREE.MeshPhysicalMaterial({ color: 0x06060c, metalness: 0.95, roughness: 0.1, flatShading: true })
  );
  spire.position.set(CX, y + spireH / 2 - 1, CZ); spire.rotation.y = Math.PI / 4; S.megaGroup.add(spire);
  const spireEdge = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.2, spireH * 0.9, 0.2), redStrip);
  spireEdge.position.set(CX, y + spireH * 0.45, CZ + 0.4); S.megaGroup.add(spireEdge);
  // soft rim so silhouette reads against purple sky (not a red wash)
  const hqRim = new S.THREE.DirectionalLight(0xaa8899, 0.55);
  hqRim.position.set(CX + 30, 80, CZ + 40); S.scene.add(hqRim);
  const hqFill = new S.THREE.PointLight(0xff3344, 10, 48, 2);
  hqFill.position.set(CX, embY, CZ + 25); S.scene.add(hqFill);
  // emblem ~60% of prior size, mounted ON the face
  const emb = new S.THREE.Sprite(new S.THREE.SpriteMaterial({
    map: S.texEmblem, blending: S.THREE.AdditiveBlending, depthWrite: false, transparent: true,
    opacity: 0.9, fog: false, toneMapped: false
  }));
  emb.scale.set(18, 18, 1); emb.position.set(CX, embY, CZ + D / 2 + 1.5); S.scene.add(emb);
  window.__corpEmblem = emb;
  const plate = new S.THREE.Mesh(
    new S.THREE.PlaneGeometry(16, 16),
    new S.THREE.MeshBasicMaterial({ map: S.texEmblem, transparent: true, blending: S.THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false, fog: false })
  );
  plate.position.set(CX, embY, CZ + D / 2 + 1.2); S.megaGroup.add(plate);
  // continuous camera-facing red edges full shaft
  for (const sx of [-1, 1]) {
    const strip = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, H * 0.95, 0.16), redStrip);
    strip.position.set(CX + sx * (W * 0.5), H * 0.45, CZ + D * 0.5);
    S.megaGroup.add(strip);
  }
  // subtle crown haze only (no giant red orb)
  S.glow(S.GLOW.red, CX, embY + 6, CZ + 4, 10, 6, 0.12);
  S.glow(S.GLOW.red, CX, y + spireH - 4, CZ, 4, 4, 0.22);
  S.blinkers.push(S.glow(S.GLOW.red, CX, y + spireH - 2, CZ, 2.2, 2.2, 0.4));
  window.__HQ = { CX, CZ, embY, H: y + spireH };
}

// Distant canyon props don't need moon-shadow draws. Merge identical static boxes
// so the establishing shot is not thousands of draw calls. Unique facades stay separate.
(function mergeCityClutter() {
  try {
  const skip = new Set(S.neonFlickers);
  S.megaGroup.updateMatrixWorld(true);
  S.megaGroup.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  const buckets = new Map();
  const meshes = [];
  S.megaGroup.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
  for (const o of meshes) {
    if (skip.has(o) || !o.geometry || !o.material || Array.isArray(o.material)) continue;
    if (o.material.transparent) continue;
    const key = o.material.uuid;
    let b = buckets.get(key);
    if (!b) { b = { mat: o.material, items: [] }; buckets.set(key, b); }
    b.items.push(o);
  }
  let mergedSets = 0, removed = 0;
  for (const b of buckets.values()) {
    if (b.items.length < 2) continue;
    const geos = [];
    for (const o of b.items) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      geos.push(g);
    }
    const merged = S.mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    for (const o of b.items) {
      o.geometry.dispose();
      if (o.parent) o.parent.remove(o);
      removed++;
    }
    const mesh = new S.THREE.Mesh(merged, b.mat);
    mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.matrixAutoUpdate = false;
    S.scene.add(mesh);
    mergedSets++;
  }
  console.info('[perf] city merge', { mergedSets, removed });
  } catch (err) { console.warn('[perf] city merge failed', err); }
})();

S.logPerf('sync');


// ---- koi + dancer holograms ----
S.koiMat = new S.THREE.SpriteMaterial({ map: S.texKoi, blending: S.THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9, fog: false, toneMapped: false });

S.koi = new S.THREE.Sprite(S.koiMat);
 S.koi.scale.set(14, 8, 1);
 S.koi.position.set(-24, 20, 2);
 S.scene.add(S.koi);

S.dancerMat = new S.THREE.SpriteMaterial({ map: S.texDancer, blending: S.THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85, fog: false, toneMapped: false });

S.dancer = new S.THREE.Sprite(S.dancerMat);
 S.dancer.scale.set(8, 14, 1);
 S.dancer.position.set(22, 15, 4);
 S.scene.add(S.dancer);

S.glow(S.GLOW.mag, -20, 22, 4, 8, 5, 0.18);
 S.glow(S.GLOW.cyan, 18, 16, 6, 6, 8, 0.15);


// ---- rain ----
S.rain = null;

{ const g = new S.THREE.BufferGeometry(); const a = [];
  for (let i = 0; i < 10000; i++) a.push((Math.random() - 0.5) * 100, Math.random() * 100, (Math.random() - 0.5) * 80);
  g.setAttribute('position', new S.THREE.Float32BufferAttribute(a, 3));
  S.rain = new S.THREE.Points(g, new S.THREE.PointsMaterial({ color: 0xa8d4ff, size: 0.045, transparent: true, opacity: 0.4, depthWrite: false, sizeAttenuation: true }));
  S.scene.add(S.rain);
  const lg = new S.THREE.BufferGeometry(); const la = [];
  for (let i = 0; i < 800; i++) { const x = (Math.random() - 0.5) * 80, y = Math.random() * 90, z = (Math.random() - 0.5) * 60; la.push(x, y, z, x - 0.15, y - 3, z); }
  lg.setAttribute('position', new S.THREE.Float32BufferAttribute(la, 3));
  window.__rainLines = new S.THREE.LineSegments(lg, new S.THREE.LineBasicMaterial({ color: 0xa8d4ff, transparent: true, opacity: 0.28, depthWrite: false }));
  S.scene.add(window.__rainLines);
}
}

export function initVehicles() {


// ---- monorail / skybridge ----
S.mono = new S.THREE.Group();
 S.scene.add(S.mono);

for (let i = -50; i <= 50; i += 3) S.box(2.8, 0.18, 0.65, S.M(0x1a2030, { metalness: 0.8 }), i, 36, -58, S.mono);

S.box(100, 0.05, 0.06, S.E(0x00f0ff, 0.6), 0, 36.15, -57.7, S.mono);

S.box(100, 0.05, 0.06, S.E(0xff2a6d, 0.6), 0, 36.15, -58.3, S.mono);

S.monoCar = new S.THREE.Group();

S.box(8, 1.5, 2, S.M(0xc8d0e8, { metalness: 0.6 }), 0, 0, 0, S.monoCar);

S.glow(S.GLOW.cyan, 4, 0, 0, 4, 2, 0.6, S.monoCar);

S.monoCar.position.set(-30, 37, -58);
 S.scene.add(S.monoCar);


// ---- AVs ----
S.avs = [];

S.av(30, -40, 5, 0x00f0ff);
 // one far-left only

// ---- plaza "steam" was default square Points sprites (pale grey pixels) — replaced with glitch holo columns ----
S.steams = [];
 // kept empty; tick still safe
S.glitchHolos = [];

S.makeGlitchHolo(-17.5, 19.2, 0xff2a6d);
 // by red neon sign / former steam column
S.makeGlitchHolo(17.5, 19.2, 0x00f0ff);

S.makeGlitchHolo(-5.5, 24.5, 0x00f0ff);

S.makeGlitchHolo(9.0, 24.5, 0xff2a6d);


// ---- hero events (original, not IP) ----
S.heroes = [];

// hero flyers disabled — trails were banding the frame
S.nextHero = 12;


// ---- cars ----
S.cars = [];

// Closed lanes around the tower plaza. A later wheel-less hovercar GLB
// slots in by setting `model` on a fleet entry; kind 'air' already hovers.
S.VEHICLE_ROUTES = {
  plaza: [
    { x: -17, y: 0, z: 13 }, { x: 17, y: 0, z: 13 },
    { x: 17, y: 0, z: -13 }, { x: -17, y: 0, z: -13 },
  ],
  airLow: [
    { x: -36, y: 22, z: 28 }, { x: 36, y: 24, z: 28 },
    { x: 40, y: 26, z: -30 }, { x: -34, y: 22, z: -32 },
  ],
  airHigh: [
    { x: -48, y: 40, z: -8 }, { x: 8, y: 44, z: -42 },
    { x: 52, y: 38, z: 6 }, { x: 6, y: 42, z: 36 },
  ],
};

S.HOVER_GLB = 'assets/vehicles/hovercar-nowheels.glb';

S.VEHICLE_FLEET = [
  { id: 'lane-a', kind: 'ground', route: 'plaza', laneKey: 'groundA', speed: 0.045, color: 0xff2a6d, offset: 0.05 },
  { id: 'lane-b', kind: 'ground', route: 'plaza', laneKey: 'groundB', speed: 0.05, color: 0x00f0ff, offset: 0.4 },
  { id: 'hover-air-1', kind: 'air', route: 'airLow', laneKey: 'airLow', speed: 0.028, offset: 0.18, model: S.HOVER_GLB },
  { id: 'hover-air-2', kind: 'air', route: 'airHigh', laneKey: 'airHigh', speed: 0.02, offset: 0.62, model: S.HOVER_GLB },
  { id: 'hover-low', kind: 'hover', route: 'plaza', laneKey: 'groundA', speed: 0.036, offset: 0.47, model: S.HOVER_GLB, hoverHeight: 0.5 },
  { id: 'hover-park', kind: 'park', model: S.HOVER_GLB, hoverHeight: 0.5, park: { x: 18, z: 13.5, yaw: -0.9 } },
];

S.VEHICLE_FLEET.forEach(S.addRouteVehicle);

window.__cars = S.cars;

window.__VEHICLE_FLEET = S.VEHICLE_FLEET;

{
  const g = S.raceCar(0xfcee0a);
  g.position.set(-8, 0, 43);
  S.scene.add(g);
  const rec = { g, speed: 13, hover: false, hero: true };
  S.cars.push(rec);
  window.__supra = rec;
}

// Flying car. Circuits, sets down on the roof pad, waits, then lifts off.
S.roofFlyer = S.raceCar(0x00f0ff);

S.roofFlyer.traverse(o => { if (o.isMesh) o.layers.enable(S.LAYER_ROOM); });

for (const dx of [-1.05, 1.15]) for (const dz of [-0.55, 0.55]) {
  const pad = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.22, 0.3, 0.1, 10), S.E(0x00f0ff, 2.2));
  pad.position.set(dx, 0.08, dz); S.roofFlyer.add(pad);
}

S.scene.add(S.roofFlyer);

window.__roofFlyer = S.roofFlyer;

S.ROOF_PAD = new S.THREE.Vector3(0, S.ROOF + 0.86, S.PAD_Z);
}

export function initProps() {


// ---- Kenney CC0 GLB buildings + cars (cyberpunk restyle) ----
S.__gltfMgr = new S.THREE.LoadingManager();

S.__gltfMgr.setURLModifier(S.remapGltfUrl);

S.gltfLoader = new S.GLTFLoader(S.__gltfMgr);

S.gltfLoader.setMeshoptDecoder(S.MeshoptDecoder);

S.dracoLoader = new S.DRACOLoader();

S.dracoLoader.setDecoderPath('assets/vehicles/draco/');

S.gltfLoader.setDRACOLoader(S.dracoLoader);

S.loadHovercars();


// Shopfront signs, all the same size. Bottom sits at 3 m so the lettering
// stays in the 3–6 m band. Districts are on measured facades, off the
// tower's north/south and east/west sightlines.
S.SIGN_SCALE = 0.32;

S.MAGENTA = 0xff2a9a;

S.CYAN = 0x00e5ff;

S.AMBER = 0xff8c14;

S.DINER_SIGNS = [
  // Food street: south face of the block the north walk runs past.
  { variant: 'ramen', text: 'ramen.png', color: S.MAGENTA, x: -17.2, y: 3, z: 29.15, yaw: 0 },
  { variant: 'izakaya', text: 'izakaya.png', color: S.AMBER, x: -9.2, y: 3, z: 29.15, yaw: 0 },
  // Tech block: east face, two adjacent fronts.
  { variant: 'dennou', text: 'dennou.png', color: S.CYAN, x: 33.55, y: 3, z: 2.4, yaw: Math.PI / 2 },
  { variant: '24h', text: '24h.png', color: S.MAGENTA, x: 33.55, y: 3, z: 7.6, yaw: Math.PI / 2 },
  // Nightlife corner: one BAR on the east face of the west block.
  { variant: 'bar', text: 'bar.png', color: S.MAGENTA, x: -31.45, y: 3, z: 29, yaw: Math.PI / 2 },
  // Company store, street level on the plaza-side facade.
  { variant: 'ramen', text: 'h-industry-mart.png', color: S.CYAN, x: 16.55, y: 3, z: 24.4, yaw: Math.PI / 2 },
];

S.dinerVariantCache = {};

S.dinerTextCache = {};

S.whenCityReady().then(() => Promise.all(S.DINER_SIGNS.map(S.placeDinerSign))).then(signs => {
  window.__dinerSigns = signs;
  console.info('[signs]', signs.length);
}).catch(err => console.error('diner signs', err));


// Street pedestrians and office/plaza props. Girl keeps her original outfit:
// the added StreetWear dress is never shown.
S.streetGirls = [];

window.__stepGirls = (dt) => S.updateStreetGirls(dt || 0.05);

S.loadStreetGirls();

S.loadCyberDesk();

S.loadStreetProps();

S.CITY_SCALE = 11;

// Original world centre of Cyberpunk City #1, before the root scale.
S.CITY_MID_X = 1.675, S.CITY_MID_Z = 1.375;

window.__ORANGE = {"pts": [{"x": 13.19, "z": -55.37, "w": 5.6}, {"x": 14.3, "z": -55.55, "w": 5.6}, {"x": 15.46, "z": -55.7, "w": 5.6}, {"x": 16.67, "z": -55.8, "w": 5.6}, {"x": 17.91, "z": -55.84, "w": 5.6}, {"x": 19.17, "z": -55.82, "w": 5.6}, {"x": 20.41, "z": -55.73, "w": 5.6}, {"x": 21.64, "z": -55.55, "w": 5.6}, {"x": 22.84, "z": -55.28, "w": 5.6}, {"x": 23.99, "z": -54.85, "w": 5.6}, {"x": 25.12, "z": -54.27, "w": 5.6}, {"x": 26.24, "z": -53.57, "w": 5.6}, {"x": 27.35, "z": -52.81, "w": 5.6}, {"x": 28.46, "z": -52.04, "w": 5.6}, {"x": 29.59, "z": -51.31, "w": 5.6}, {"x": 30.74, "z": -50.66, "w": 5.6}, {"x": 31.92, "z": -50.14, "w": 5.6}, {"x": 33.14, "z": -49.75, "w": 5.6}, {"x": 34.39, "z": -49.45, "w": 5.6}, {"x": 35.65, "z": -49.22, "w": 5.6}, {"x": 36.93, "z": -49.02, "w": 5.6}, {"x": 38.22, "z": -48.86, "w": 5.6}, {"x": 39.51, "z": -48.7, "w": 5.6}, {"x": 40.8, "z": -48.54, "w": 5.6}, {"x": 42.08, "z": -48.34, "w": 5.6}, {"x": 43.38, "z": -48.17, "w": 5.6}, {"x": 44.73, "z": -48.05, "w": 5.6}, {"x": 46.09, "z": -47.97, "w": 5.6}, {"x": 47.45, "z": -47.87, "w": 5.6}, {"x": 48.77, "z": -47.73, "w": 5.6}, {"x": 50.04, "z": -47.5, "w": 5.6}, {"x": 51.22, "z": -47.15, "w": 5.6}, {"x": 52.28, "z": -46.65, "w": 5.6}, {"x": 53.24, "z": -45.98, "w": 5.6}, {"x": 54.14, "z": -45.18, "w": 5.6}, {"x": 54.96, "z": -44.26, "w": 5.6}, {"x": 55.71, "z": -43.26, "w": 5.6}, {"x": 56.4, "z": -42.2, "w": 5.6}, {"x": 57.02, "z": -41.09, "w": 5.6}, {"x": 57.58, "z": -39.96, "w": 5.6}, {"x": 58.07, "z": -38.83, "w": 5.6}, {"x": 58.49, "z": -37.68, "w": 5.6}, {"x": 58.83, "z": -36.49, "w": 5.6}, {"x": 59.1, "z": -35.25, "w": 5.6}, {"x": 59.31, "z": -33.98, "w": 5.6}, {"x": 59.47, "z": -32.69, "w": 5.6}, {"x": 59.58, "z": -31.38, "w": 5.6}, {"x": 59.65, "z": -30.07, "w": 5.6}, {"x": 59.7, "z": -28.77, "w": 5.6}, {"x": 59.71, "z": -27.46, "w": 5.6}, {"x": 59.66, "z": -26.14, "w": 5.6}, {"x": 59.57, "z": -24.81, "w": 5.6}, {"x": 59.44, "z": -23.46, "w": 5.6}, {"x": 59.28, "z": -22.11, "w": 5.6}, {"x": 59.09, "z": -20.76, "w": 5.6}, {"x": 58.89, "z": -19.41, "w": 5.6}, {"x": 58.68, "z": -18.07, "w": 5.6}, {"x": 58.46, "z": -16.72, "w": 5.6}, {"x": 58.24, "z": -15.37, "w": 5.6}, {"x": 58.0, "z": -14.01, "w": 5.6}, {"x": 57.73, "z": -12.66, "w": 5.6}, {"x": 57.43, "z": -11.31, "w": 5.6}, {"x": 57.1, "z": -9.97, "w": 5.6}, {"x": 56.72, "z": -8.64, "w": 5.6}, {"x": 56.29, "z": -7.34, "w": 5.6}, {"x": 55.78, "z": -6.05, "w": 5.6}, {"x": 55.2, "z": -4.78, "w": 5.6}, {"x": 54.56, "z": -3.52, "w": 5.6}, {"x": 53.89, "z": -2.27, "w": 5.6}, {"x": 53.21, "z": -1.04, "w": 5.6}, {"x": 52.54, "z": 0.19, "w": 5.6}, {"x": 51.91, "z": 1.4, "w": 5.6}, {"x": 51.34, "z": 2.59, "w": 5.6}, {"x": 50.8, "z": 3.76, "w": 5.6}, {"x": 50.25, "z": 4.91, "w": 5.6}, {"x": 49.72, "z": 6.03, "w": 5.6}, {"x": 49.21, "z": 7.15, "w": 5.6}, {"x": 48.74, "z": 8.26, "w": 5.6}, {"x": 48.33, "z": 9.38, "w": 5.6}, {"x": 47.99, "z": 10.51, "w": 5.6}, {"x": 47.74, "z": 11.66, "w": 5.6}, {"x": 47.57, "z": 12.83, "w": 5.6}, {"x": 47.47, "z": 14.01, "w": 5.6}, {"x": 47.44, "z": 15.19, "w": 5.6}, {"x": 47.47, "z": 16.39, "w": 5.6}, {"x": 47.55, "z": 17.59, "w": 5.6}, {"x": 47.68, "z": 18.8, "w": 5.6}, {"x": 47.86, "z": 20.02, "w": 5.6}, {"x": 48.08, "z": 21.24, "w": 5.6}, {"x": 48.36, "z": 22.48, "w": 5.6}, {"x": 48.72, "z": 23.73, "w": 5.6}, {"x": 49.14, "z": 24.99, "w": 5.6}, {"x": 49.6, "z": 26.26, "w": 5.6}, {"x": 50.09, "z": 27.53, "w": 5.6}, {"x": 50.59, "z": 28.8, "w": 5.6}, {"x": 51.08, "z": 30.06, "w": 5.6}, {"x": 51.55, "z": 31.3, "w": 5.6}, {"x": 52.03, "z": 32.54, "w": 5.6}, {"x": 52.55, "z": 33.78, "w": 5.6}, {"x": 53.08, "z": 35.01, "w": 5.6}, {"x": 53.61, "z": 36.24, "w": 5.6}, {"x": 54.13, "z": 37.46, "w": 5.6}, {"x": 54.59, "z": 38.67, "w": 5.6}, {"x": 55.0, "z": 39.85, "w": 5.6}, {"x": 55.33, "z": 41.02, "w": 5.6}, {"x": 55.61, "z": 42.18, "w": 5.6}, {"x": 55.88, "z": 43.33, "w": 5.6}, {"x": 56.11, "z": 44.47, "w": 5.6}, {"x": 56.29, "z": 45.59, "w": 5.6}, {"x": 56.39, "z": 46.69, "w": 5.6}, {"x": 56.39, "z": 47.76, "w": 5.6}, {"x": 56.28, "z": 48.78, "w": 5.6}, {"x": 56.02, "z": 49.76, "w": 5.6}, {"x": 55.62, "z": 50.71, "w": 5.6}, {"x": 55.09, "z": 51.64, "w": 5.6}, {"x": 54.45, "z": 52.54, "w": 5.6}, {"x": 53.71, "z": 53.4, "w": 5.6}, {"x": 52.88, "z": 54.21, "w": 5.6}, {"x": 51.98, "z": 54.96, "w": 5.6}, {"x": 51.02, "z": 55.63, "w": 5.6}, {"x": 50.02, "z": 56.2, "w": 5.6}, {"x": 48.93, "z": 56.69, "w": 5.6}, {"x": 47.74, "z": 57.11, "w": 5.6}, {"x": 46.45, "z": 57.45, "w": 5.6}, {"x": 45.11, "z": 57.73, "w": 5.6}, {"x": 43.73, "z": 57.94, "w": 5.6}, {"x": 42.35, "z": 58.08, "w": 5.6}, {"x": 40.98, "z": 58.15, "w": 5.6}, {"x": 39.65, "z": 58.16, "w": 5.6}, {"x": 38.34, "z": 58.07, "w": 5.6}, {"x": 37.02, "z": 57.86, "w": 5.6}, {"x": 35.7, "z": 57.57, "w": 5.6}, {"x": 34.38, "z": 57.22, "w": 5.6}, {"x": 33.06, "z": 56.84, "w": 5.6}, {"x": 31.77, "z": 56.46, "w": 5.6}, {"x": 30.49, "z": 56.11, "w": 5.6}, {"x": 29.24, "z": 55.81, "w": 5.6}, {"x": 28.02, "z": 55.55, "w": 5.6}, {"x": 26.83, "z": 55.28, "w": 5.6}, {"x": 25.65, "z": 55.03, "w": 5.6}, {"x": 24.49, "z": 54.78, "w": 5.6}, {"x": 23.34, "z": 54.55, "w": 5.6}, {"x": 22.21, "z": 54.34, "w": 5.6}, {"x": 21.07, "z": 54.16, "w": 5.6}, {"x": 19.94, "z": 54.01, "w": 5.6}, {"x": 18.82, "z": 53.9, "w": 5.6}, {"x": 17.71, "z": 53.8, "w": 5.6}, {"x": 16.61, "z": 53.74, "w": 5.6}, {"x": 15.52, "z": 53.7, "w": 5.6}, {"x": 14.43, "z": 53.68, "w": 5.6}, {"x": 13.34, "z": 53.69, "w": 5.6}, {"x": 12.23, "z": 53.72, "w": 5.6}, {"x": 11.11, "z": 53.78, "w": 5.6}, {"x": 9.98, "z": 53.88, "w": 5.6}, {"x": 8.85, "z": 54.01, "w": 5.6}, {"x": 7.71, "z": 54.18, "w": 5.6}, {"x": 6.57, "z": 54.37, "w": 5.6}, {"x": 5.41, "z": 54.57, "w": 5.6}, {"x": 4.24, "z": 54.78, "w": 5.6}, {"x": 3.05, "z": 54.98, "w": 5.6}, {"x": 1.84, "z": 55.17, "w": 5.6}, {"x": 0.61, "z": 55.36, "w": 5.6}, {"x": -0.64, "z": 55.57, "w": 5.6}, {"x": -1.91, "z": 55.79, "w": 5.6}, {"x": -3.2, "z": 56.0, "w": 5.6}, {"x": -4.49, "z": 56.21, "w": 5.6}, {"x": -5.8, "z": 56.4, "w": 5.6}, {"x": -7.13, "z": 56.56, "w": 5.6}, {"x": -8.46, "z": 56.69, "w": 5.6}, {"x": -9.81, "z": 56.79, "w": 5.6}, {"x": -11.18, "z": 56.87, "w": 5.6}, {"x": -12.57, "z": 56.94, "w": 5.6}, {"x": -13.97, "z": 56.98, "w": 5.6}, {"x": -15.38, "z": 57.0, "w": 5.6}, {"x": -16.78, "z": 57.0, "w": 5.6}, {"x": -18.18, "z": 56.97, "w": 5.6}, {"x": -19.57, "z": 56.92, "w": 5.6}, {"x": -20.95, "z": 56.84, "w": 5.6}, {"x": -22.33, "z": 56.72, "w": 5.6}, {"x": -23.71, "z": 56.58, "w": 5.6}, {"x": -25.09, "z": 56.42, "w": 5.6}, {"x": -26.46, "z": 56.24, "w": 5.6}, {"x": -27.83, "z": 56.04, "w": 5.6}, {"x": -29.19, "z": 55.84, "w": 5.6}, {"x": -30.54, "z": 55.62, "w": 5.6}, {"x": -31.89, "z": 55.4, "w": 5.6}, {"x": -33.23, "z": 55.18, "w": 5.6}, {"x": -34.58, "z": 54.95, "w": 5.6}, {"x": -35.91, "z": 54.7, "w": 5.6}, {"x": -37.24, "z": 54.43, "w": 5.6}, {"x": -38.55, "z": 54.13, "w": 5.6}, {"x": -39.85, "z": 53.79, "w": 5.6}, {"x": -41.13, "z": 53.41, "w": 5.6}, {"x": -42.42, "z": 53.0, "w": 5.6}, {"x": -43.72, "z": 52.58, "w": 5.6}, {"x": -45.02, "z": 52.14, "w": 5.6}, {"x": -46.3, "z": 51.66, "w": 5.6}, {"x": -47.55, "z": 51.13, "w": 5.6}, {"x": -48.73, "z": 50.54, "w": 5.6}, {"x": -49.84, "z": 49.87, "w": 5.6}, {"x": -50.86, "z": 49.11, "w": 5.6}, {"x": -51.79, "z": 48.25, "w": 5.6}, {"x": -52.67, "z": 47.3, "w": 5.6}, {"x": -53.48, "z": 46.28, "w": 5.6}, {"x": -54.23, "z": 45.19, "w": 5.6}, {"x": -54.92, "z": 44.06, "w": 5.6}, {"x": -55.53, "z": 42.89, "w": 5.6}, {"x": -56.08, "z": 41.7, "w": 5.6}, {"x": -56.55, "z": 40.5, "w": 5.6}, {"x": -56.93, "z": 39.29, "w": 5.6}, {"x": -57.2, "z": 38.03, "w": 5.6}, {"x": -57.4, "z": 36.75, "w": 5.6}, {"x": -57.53, "z": 35.43, "w": 5.6}, {"x": -57.62, "z": 34.1, "w": 5.6}, {"x": -57.68, "z": 32.74, "w": 5.6}, {"x": -57.74, "z": 31.38, "w": 5.6}, {"x": -57.81, "z": 30.01, "w": 5.6}, {"x": -57.88, "z": 28.62, "w": 5.6}, {"x": -57.92, "z": 27.21, "w": 5.6}, {"x": -57.93, "z": 25.78, "w": 5.6}, {"x": -57.93, "z": 24.34, "w": 5.6}, {"x": -57.91, "z": 22.88, "w": 5.6}, {"x": -57.89, "z": 21.42, "w": 5.6}, {"x": -57.88, "z": 19.96, "w": 5.6}, {"x": -57.88, "z": 18.49, "w": 5.6}, {"x": -57.87, "z": 17.02, "w": 5.6}, {"x": -57.86, "z": 15.54, "w": 5.6}, {"x": -57.85, "z": 14.05, "w": 5.6}, {"x": -57.83, "z": 12.55, "w": 5.6}, {"x": -57.82, "z": 11.05, "w": 5.6}, {"x": -57.82, "z": 9.56, "w": 5.6}, {"x": -57.83, "z": 8.07, "w": 5.6}, {"x": -57.85, "z": 6.59, "w": 5.6}, {"x": -57.9, "z": 5.12, "w": 5.6}, {"x": -57.97, "z": 3.64, "w": 5.6}, {"x": -58.05, "z": 2.17, "w": 5.6}, {"x": -58.14, "z": 0.7, "w": 5.6}, {"x": -58.23, "z": -0.76, "w": 5.6}, {"x": -58.31, "z": -2.21, "w": 5.6}, {"x": -58.38, "z": -3.66, "w": 5.6}, {"x": -58.42, "z": -5.1, "w": 5.6}, {"x": -58.44, "z": -6.53, "w": 5.6}, {"x": -58.45, "z": -7.95, "w": 5.6}, {"x": -58.45, "z": -9.36, "w": 5.6}, {"x": -58.44, "z": -10.77, "w": 5.6}, {"x": -58.42, "z": -12.17, "w": 5.6}, {"x": -58.38, "z": -13.56, "w": 5.6}, {"x": -58.34, "z": -14.95, "w": 5.6}, {"x": -58.3, "z": -16.32, "w": 5.6}, {"x": -58.25, "z": -17.68, "w": 5.6}, {"x": -58.22, "z": -19.04, "w": 5.6}, {"x": -58.18, "z": -20.39, "w": 5.6}, {"x": -58.12, "z": -21.73, "w": 5.6}, {"x": -58.05, "z": -23.06, "w": 5.6}, {"x": -57.95, "z": -24.37, "w": 5.6}, {"x": -57.8, "z": -25.67, "w": 5.6}, {"x": -57.6, "z": -26.95, "w": 5.6}, {"x": -57.35, "z": -28.21, "w": 5.6}, {"x": -57.05, "z": -29.45, "w": 5.6}, {"x": -56.71, "z": -30.66, "w": 5.6}, {"x": -56.34, "z": -31.87, "w": 5.6}, {"x": -55.95, "z": -33.06, "w": 5.6}, {"x": -55.53, "z": -34.25, "w": 5.6}, {"x": -55.11, "z": -35.45, "w": 5.6}, {"x": -54.68, "z": -36.64, "w": 5.6}, {"x": -54.28, "z": -37.88, "w": 5.6}, {"x": -53.89, "z": -39.17, "w": 5.6}, {"x": -53.5, "z": -40.48, "w": 5.6}, {"x": -53.09, "z": -41.77, "w": 5.6}, {"x": -52.63, "z": -43.02, "w": 5.6}, {"x": -52.12, "z": -44.2, "w": 5.6}, {"x": -51.51, "z": -45.27, "w": 5.6}, {"x": -50.8, "z": -46.2, "w": 5.6}, {"x": -49.97, "z": -47.01, "w": 5.6}, {"x": -49.03, "z": -47.75, "w": 5.6}, {"x": -48.01, "z": -48.4, "w": 5.6}, {"x": -46.92, "z": -48.96, "w": 5.6}, {"x": -45.79, "z": -49.43, "w": 5.6}, {"x": -44.64, "z": -49.82, "w": 5.6}, {"x": -43.48, "z": -50.11, "w": 5.6}, {"x": -42.34, "z": -50.31, "w": 5.6}, {"x": -41.2, "z": -50.38, "w": 5.6}, {"x": -40.05, "z": -50.31, "w": 5.6}, {"x": -38.87, "z": -50.14, "w": 5.6}, {"x": -37.68, "z": -49.88, "w": 5.6}, {"x": -36.48, "z": -49.57, "w": 5.6}, {"x": -35.27, "z": -49.24, "w": 5.6}, {"x": -34.05, "z": -48.91, "w": 5.6}, {"x": -32.83, "z": -48.62, "w": 5.6}, {"x": -31.6, "z": -48.31, "w": 5.6}, {"x": -30.36, "z": -47.95, "w": 5.6}, {"x": -29.11, "z": -47.54, "w": 5.6}, {"x": -27.86, "z": -47.14, "w": 5.6}, {"x": -26.6, "z": -46.76, "w": 5.6}, {"x": -25.34, "z": -46.44, "w": 5.6}, {"x": -24.09, "z": -46.21, "w": 5.6}, {"x": -22.85, "z": -46.1, "w": 5.6}, {"x": -21.62, "z": -46.12, "w": 5.6}, {"x": -20.39, "z": -46.25, "w": 5.6}, {"x": -19.17, "z": -46.46, "w": 5.6}, {"x": -17.95, "z": -46.74, "w": 5.6}, {"x": -16.73, "z": -47.05, "w": 5.6}, {"x": -15.52, "z": -47.37, "w": 5.6}, {"x": -14.31, "z": -47.68, "w": 5.6}, {"x": -13.1, "z": -47.96, "w": 5.6}, {"x": -11.9, "z": -48.22, "w": 5.6}, {"x": -10.69, "z": -48.48, "w": 5.6}, {"x": -9.49, "z": -48.75, "w": 5.6}, {"x": -8.3, "z": -49.03, "w": 5.6}, {"x": -7.11, "z": -49.3, "w": 5.6}, {"x": -5.92, "z": -49.58, "w": 5.6}, {"x": -4.74, "z": -49.85, "w": 5.6}, {"x": -3.56, "z": -50.12, "w": 5.6}, {"x": -2.37, "z": -50.38, "w": 5.6}, {"x": -1.18, "z": -50.63, "w": 5.6}, {"x": 0.01, "z": -50.87, "w": 5.6}, {"x": 1.2, "z": -51.12, "w": 5.6}, {"x": 2.37, "z": -51.37, "w": 5.6}, {"x": 3.52, "z": -51.63, "w": 5.6}, {"x": 4.63, "z": -51.92, "w": 5.6}, {"x": 5.7, "z": -52.23, "w": 5.6}, {"x": 6.71, "z": -52.6, "w": 5.6}, {"x": 7.65, "z": -53.02, "w": 5.6}, {"x": 8.55, "z": -53.48, "w": 5.6}, {"x": 9.42, "z": -53.94, "w": 5.6}, {"x": 10.3, "z": -54.39, "w": 5.6}, {"x": 11.21, "z": -54.79, "w": 5.6}, {"x": 12.17, "z": -55.13, "w": 5.6}], "minClear": 1.79, "height": 7.0, "grade": 0.09, "ramps": [{"id": "R1", "pair": true, "w": 4.2, "at": [-32.22, -41.93], "road": [[-32.22, -41.93], [-27.43, -40.5], [-22.49, -39.86], [-17.53, -40.39], [-12.67, -41.59], [-7.79, -42.68], [-2.92, -43.8], [1.97, -44.85], [6.83, -46.02], [11.45, -47.89], [16.15, -49.43], [21.12, -49.19], [25.36, -46.56], [29.79, -44.27], [34.63, -43.01], [39.58, -42.34], [44.55, -41.76], [49.41, -40.96], [52.09, -36.77], [53.2, -31.92], [53.38, -26.93], [52.89, -21.95], [52.12, -17.01], [51.13, -12.11], [49.46, -7.41], [47.11, -3.0], [44.9, 1.49], [42.16, 5.11], [40.0, 4.0]], "grade": 0.05}, {"id": "R3", "pair": true, "w": 4.2, "at": [-51.61, 4.86], "road": [[-51.61, 4.86], [-51.35, 9.85], [-51.4, 14.85], [-51.58, 19.85], [-51.63, 24.85], [-51.51, 29.85], [-51.25, 34.84], [-50.07, 39.66], [-47.31, 43.8], [-42.96, 46.18], [-38.2, 47.7], [-33.31, 48.77], [-28.38, 49.58], [-23.43, 50.27], [-18.44, 50.65], [-13.44, 50.66], [-8.46, 50.35], [-3.5, 49.66], [1.43, 48.86], [6.36, 48.02], [11.33, 47.47], [16.32, 47.43], [20.76, 46.34], [21.2, 40.5], [20.2, 38.2], [21.4, 37.2]], "grade": 0.058}, {"id": "R4", "pair": true, "w": 4.0, "at": [6.73, 47.96], "road": [[6.73, 47.96], [1.8, 48.8], [-3.14, 49.61], [-8.08, 50.32], [-13.07, 50.65], [-18.07, 50.67], [-23.06, 50.31], [-28.01, 49.65], [-32.94, 48.84], [-37.84, 47.81], [-42.6, 46.31], [-47.04, 44.07], [-49.92, 40.02], [-51.22, 35.23], [-51.49, 30.24], [-51.63, 25.24], [-51.58, 20.24], [-51.39, 15.25], [-51.35, 10.25], [-51.55, 5.27], [-50.2, 9.24], [-48.66, 14.0], [-44.0, 16.0], [-38.5, 16.4], [-33.5, 15.2], [-30.6, 13.8]], "grade": 0.056}, {"id": "R2", "pair": false, "at": [43.05, 36.89], "road": [[43.05, 36.89], [24.8, 36.97], [24.52, 36.19], [24.25, 35.42], [23.97, 34.65]]}, {"id": "OVERLAP", "pair": false, "at": [43.05, 36.89], "road": [[43.05, 36.89]]}], "worstPx": [828.9, 939.0], "width": 5.6};
}

export function initDistrict() {

window.__renderCityPlan = function (withRoads, highwayOnly, opts) {
  opts = opts || {};
  const W = 2048;
  const buildings = [];
  if (window.__city) {
    window.__city.updateMatrixWorld(true);
    window.__city.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const box = new S.THREE.Box3().setFromObject(o);
      if (box.max.y - box.min.y < 1.6) return;
      buildings.push(o);
    });
  }
  const extra = [];
  if (S.oldSiteFill) extra.push(S.oldSiteFill);
  extra.forEach(root => {
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const box = new S.THREE.Box3().setFromObject(o);
      if (box.max.y - box.min.y < 1.6) return;
      buildings.push(o);
    });
  });

  const roads = [];
  S.scene.traverse(o => { if (o.isMesh && o.userData.planRoad) roads.push(o); });
  const inHighway = (m) => {
    let n = m;
    while (n) { if (n === window.__hwGroup) return true; n = n.parent; }
    return false;
  };
  const shownRoads = highwayOnly ? roads.filter(inHighway) : roads;
  const bounds = new S.THREE.Box3();
  buildings.forEach(m => bounds.expandByObject(m));
  bounds.expandByPoint(new S.THREE.Vector3(-S.FW / 2, 0, -S.FD / 2));
  bounds.expandByPoint(new S.THREE.Vector3(S.FW / 2, 30, S.FD / 2));
  roads.forEach(m => bounds.expandByObject(m));
  let world, half, cx, cz, x0, x1, z0, z1;
  if (opts.fixed !== false) {
    // Same 210 m orthographic frame as docs/city-plan.md
    world = 210;
    half = world / 2;
    x0 = -100.76154028251767;
    z0 = -87.36261804588139;
    x1 = x0 + world;
    z1 = z0 + world;
    cx = x0 + half;
    cz = z0 + half;
  } else {
    const spanNeed = Math.max(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) + 24;
    world = Math.ceil(spanNeed / 10) * 10;
    half = world / 2;
    cx = (bounds.min.x + bounds.max.x) / 2;
    cz = (bounds.min.z + bounds.max.z) / 2;
    x0 = cx - half; x1 = cx + half;
    z0 = cz - half; z1 = cz + half;
  }
  const savedVis = [];
  S.scene.traverse(o => savedVis.push([o, o.visible]));
  S.scene.traverse(o => { o.visible = false; });
  S.scene.visible = true;
  const show = (o) => { let n = o; while (n) { n.visible = true; n = n.parent; } };
  const ground = new S.THREE.Mesh(new S.THREE.PlaneGeometry(world + 40, world + 40), new S.THREE.MeshBasicMaterial({ color: 0xffffff }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.4, cz);
  S.scene.add(ground);
  show(ground);
  const grey = new S.THREE.MeshBasicMaterial({ color: 0x8d939c });
  const savedMat = buildings.map(m => [m, m.material]);
  const edgeMat = new S.THREE.LineBasicMaterial({ color: 0x2a2e33 });
  const edgeLines = [];
  buildings.forEach(m => {
    m.material = grey;
    show(m);
    const line = new S.THREE.LineSegments(new S.THREE.EdgesGeometry(m.geometry, 28), edgeMat);
    m.add(line);
    edgeLines.push(line);
  });
  const twFw = S.TOWER_FW || S.FW, twFd = S.TOWER_FD || S.FD;
  const office = new S.THREE.Mesh(new S.THREE.BoxGeometry(twFw, 1.2, twFd), new S.THREE.MeshBasicMaterial({ color: 0xff2ad0 }));
  office.position.set(S.TOWER_X || 0, 0.2, S.TOWER_Z || 0);
  office.rotation.y = ((S.TOWER_ROT != null) ? S.TOWER_ROT : 138) * Math.PI / 180;
  const officeLine = new S.THREE.LineSegments(new S.THREE.EdgesGeometry(office.geometry), new S.THREE.LineBasicMaterial({ color: 0x7a1060 }));
  office.add(officeLine);
  S.scene.add(office);
  show(office);
  const atomLot = new S.THREE.Mesh(new S.THREE.BoxGeometry(6.6, 1.2, 6.6), new S.THREE.MeshBasicMaterial({ color: 0xd4a017 }));
  atomLot.position.set(42.4, 0.2, -37.2);
  const atomLine = new S.THREE.LineSegments(new S.THREE.EdgesGeometry(atomLot.geometry), new S.THREE.LineBasicMaterial({ color: 0x7a5a08 }));
  atomLot.add(atomLine);
  S.scene.add(atomLot);
  show(atomLot);
  const savedRoad = [];
  const roadFlat = new S.THREE.MeshBasicMaterial({ color: 0x4e5966 });
  const walkFlat = new S.THREE.MeshBasicMaterial({ color: 0xb7c0c8 });
  const markFlat = new S.THREE.MeshBasicMaterial({ color: 0xf7f4ea });
  const hwyFlat = new S.THREE.MeshBasicMaterial({ color: 0xff7a18 });
  if (withRoads || highwayOnly) {
    shownRoads.forEach(m => {
      savedRoad.push([m, m.material]);
      m.material = highwayOnly ? hwyFlat : (m.userData.planRoad === 'walk' ? walkFlat : (m.userData.planRoad === 'mark' ? markFlat : roadFlat));
      show(m);
    });
  }
  const cam = new S.THREE.OrthographicCamera(-half, half, half, -half, 0.1, 800);
  cam.position.set(cx, 240, cz);
  cam.up.set(0, 0, -1);
  cam.lookAt(cx, 0, cz);
  const prevTarget = S.renderer.getRenderTarget();
  const prevSize = S.renderer.getSize(new S.THREE.Vector2());
  const prevPR = S.renderer.getPixelRatio();
  const prevFog = S.scene.fog;
  const prevBg = S.scene.background;
  S.scene.fog = null;
  S.scene.background = new S.THREE.Color(0xffffff);
  const rt = new S.THREE.WebGLRenderTarget(W, W);
  S.renderer.setPixelRatio(1);
  S.renderer.setSize(W, W, false);
  S.renderer.setRenderTarget(rt);
  S.renderer.setClearColor(0xffffff, 1);
  S.renderer.render(S.scene, cam);
  const buf = new Uint8Array(W * W * 4);
  S.renderer.readRenderTargetPixels(rt, 0, 0, W, W, buf);
  S.renderer.setRenderTarget(prevTarget);
  S.renderer.setPixelRatio(prevPR);
  S.renderer.setSize(prevSize.x, prevSize.y, false);
  S.scene.fog = prevFog;
  S.scene.background = prevBg;
  savedVis.forEach(([o, v]) => { o.visible = v; });
  savedMat.forEach(([m, mat]) => { m.material = mat; });
  savedRoad.forEach(([m, mat]) => { m.material = mat; });
  edgeLines.forEach(l => l.parent && l.parent.remove(l));
  S.scene.remove(ground);
  S.scene.remove(office);
  S.scene.remove(atomLot);
  rt.dispose();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = W;
  const g = canvas.getContext('2d');
  const img = g.createImageData(W, W);
  for (let y = 0; y < W; y++) {
    const src = (W - 1 - y) * W * 4;
    img.data.set(buf.subarray(src, src + W * 4), y * W * 4);
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(20,24,28,0.22)';
  g.lineWidth = 1;
  g.fillStyle = '#1a1e22';
  g.font = '22px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const mpp = world / W;
  for (let x = Math.ceil(x0 / 10) * 10; x <= x1; x += 10) {
    const px = (x - x0) / world * W;
    g.beginPath(); g.moveTo(px, 0); g.lineTo(px, W); g.stroke();
    if (x % 20 === 0) g.fillText(String(x), px, 28);
  }
  g.textAlign = 'left';
  for (let z = Math.ceil(z0 / 10) * 10; z <= z1; z += 10) {
    const py = (z - z0) / world * W;
    g.beginPath(); g.moveTo(0, py); g.lineTo(W, py); g.stroke();
    if (z % 20 === 0) g.fillText(String(z), 8, py - 12);
  }
  const barM = 50;
  const barPx = barM / mpp;
  const bx = 48, by = W - 56;
  g.strokeStyle = '#111';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + barPx, by); g.stroke();
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(bx, by - 8); g.lineTo(bx, by + 8); g.moveTo(bx + barPx, by - 8); g.lineTo(bx + barPx, by + 8); g.stroke();
  g.font = '24px sans-serif';
  g.textAlign = 'center';
  g.fillText('50 m', bx + barPx / 2, by - 18);
  const nx = W - 90, ny = 100;
  g.strokeStyle = '#111';
  g.fillStyle = '#111';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(nx, ny + 50); g.lineTo(nx, ny - 36); g.stroke();
  g.beginPath(); g.moveTo(nx, ny - 48); g.lineTo(nx - 14, ny - 20); g.lineTo(nx + 14, ny - 20); g.closePath(); g.fill();
  g.font = '28px sans-serif';
  g.textAlign = 'center';
  g.fillText('N', nx, ny - 70);
  const label = (wx, wz, text, color, dx, dy) => {
    const px = (wx - x0) / world * W + (dx || 0);
    const py = (wz - z0) / world * W + (dy || 0);
    g.fillStyle = color;
    g.font = '28px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, px, py);
  };
  label(S.TOWER_X || 0, S.TOWER_Z || 0, 'H TOWER', '#c01880', 0, 52);
  label(42.4, -37.2, 'ATOM', '#8a6a10', 0, -22);

  return {
    png: canvas.toDataURL('image/png'),
    width: W,
    height: W,
    x0, x1, z0, z1, cx, cz, world,
    metersPerPixel: mpp,
    north: '-Z is up',
  };
};

fetch('assets/city/streets.json').then(r => r.json()).then(S.applyStreetGraph).catch(err => console.error('streets', err));

S.streetLightsOn = false;

S.loadCyberCity();

S.loadAtomTower();

S.MODEL_BASE_CITY = 'models/runtime/city/';

S.MODEL_BASE_CARS = 'models/runtime/cars/';

/** Resolve GLB path to embedded data URI when present (file:// offline), else relative URL */
S.__glbTexCtx = null;

S.kenneyCars = [];

S.kenneyBuildings = [];

(async () => {
  try {
    const skyNames = ['building-skyscraper-a.glb','building-skyscraper-b.glb','building-skyscraper-c.glb','building-skyscraper-d.glb','building-skyscraper-e.glb'];
    const midNames = ['building-a.glb','building-e.glb','building-h.glb','building-k.glb'];
    const carNames = ['sedan-sports.glb','hatchback-sports.glb','race-future.glb','suv-luxury.glb','taxi.glb','van.glb','truck.glb','delivery.glb'];
    const skies = await Promise.all(skyNames.map(n => S.loadGltf(S.MODEL_BASE_CITY, n).catch(() => null)));
    const mids = await Promise.all(midNames.map(n => S.loadGltf(S.MODEL_BASE_CITY, n).catch(() => null)));
    const carScenes = await Promise.all(carNames.map(n => S.loadGltf(S.MODEL_BASE_CARS, n).catch(() => null)));
    // Place Kenney skyscrapers as framing mid-distance towers (gaps preserved)
    const slots = [
      { x: -55, z: 8, s: 20, neon: 0x00f0ff },
      { x: 62, z: 12, s: 18, neon: 0x00f0ff }, // right near: cyan accents, not red
      { x: -62, z: -18, s: 24, neon: 0x7fe3ff },
      { x: 70, z: -30, s: 22, neon: 0x00f0ff },
      { x: -70, z: -45, s: 28, neon: 0xfcee0a },
      { x: 78, z: -55, s: 26, neon: 0x7fe3ff },
      { x: -52, z: 28, s: 15, neon: 0x00f0ff },
      { x: 58, z: 32, s: 14, neon: 0x39ff14 },
    ];
    slots.forEach((slot, i) => {
      if (Math.hypot(slot.x, slot.z) < 85) return;
      const src = skies[i % skies.length];
      if (!src) return;
      const b = src.clone(true);
      S.cyberpunkize(b, { neon: slot.neon, kind: 'building' });
      b.scale.setScalar(slot.s);
      b.position.set(slot.x, 0, slot.z);
      b.rotation.y = (slot.x > 0 ? -0.25 : 0.25);
      S.groundOnY(b);
      S.megaGroup.add(b);
      const bb = new S.THREE.Box3().setFromObject(b);
      const hApprox = Math.max(20, bb.max.y - bb.min.y);
      S.box(0.25, hApprox * 0.9, 0.25, S.E(slot.neon, 2.2), slot.x + (slot.x > 0 ? -3.5 : 3.5), hApprox / 2, slot.z + 4, S.megaGroup);
      S.glow(slot.neon === 0xff2a6d ? S.GLOW.mag : S.GLOW.cyan, slot.x, hApprox * 0.65, slot.z + 5, 6, 12, 0.22);
      S.kenneyBuildings.push(b);
    });
    // A few mid-rise Kenney buildings deeper
    [[-70, -40, 12, 0x00f0ff], [72, -45, 11, 0xff2a6d], [-75, -70, 14, 0x7fe3ff], [78, -75, 13, 0xff5fa2]].forEach(([x, z, sc, neon], i) => {
      if (Math.hypot(x, z) < 112) return;
      const src = mids[i % mids.length];
      if (!src) return;
      const b = src.clone(true);
      S.cyberpunkize(b, { neon, kind: 'building' });
      b.scale.setScalar(sc);
      b.position.set(x, 0, z);
      S.groundOnY(b);
      S.megaGroup.add(b);
    });
    // Replace / supplement street cars with Kenney GLBs
    // Ground cars — 2–3 at kerb/crosswalk edges; clear of plaza ring (r≈14)
    const lanes = [
      { z: 34, speed: 0, x: -16, paint: 0x2a2038, neon: 0xff2a6d }, // left kerb
      { z: 33, speed: 0, x: 16, paint: 0x1a2830, neon: 0x00f0ff },  // right kerb
      { z: 40, speed: 0, x: -20, paint: 0x221828, neon: 0xff2a6d }, // parked; city lanes carry traffic
    ];
    lanes.forEach((ln, i) => {
      const src = carScenes[i % carScenes.length];
      if (!src) return;
      const c = src.clone(true);
      const neon = ln.neon, paint = ln.paint;
      c.traverse(o => {
        if (!o.isMesh) return;
        o.material = new S.THREE.MeshStandardMaterial({
          color: paint, metalness: 0.88, roughness: 0.28,
          emissive: new S.THREE.Color(neon).multiplyScalar(0.06), emissiveIntensity: 0.25,
          envMapIntensity: 1.4
        });
      });
      c.scale.setScalar(2.6);
      c.position.set(ln.x, 0, ln.z);
      c.rotation.y = ln.speed >= 0 ? Math.PI / 2 : -Math.PI / 2;
      if (ln.speed === 0) c.rotation.y = Math.PI / 2;
      S.groundOnY(c);
      const rim = new S.THREE.PointLight(neon, 8, 10, 2);
      rim.layers.set(S.LAYER_ACTOR); rim.position.set(0, 1.0, 1.5); c.add(rim);
      c.traverse(o => { if (o.isMesh) o.layers.enable(S.LAYER_ACTOR); });
      const ug = neon === 0x00f0ff ? S.GLOW.cyan : S.GLOW.mag;
      S.glow(ug, 0, 0.1, 0, 3.2, 1.0, 0.4, c);
      S.glow(ug, 0, 0.04, 0, 3.5, 1.8, 0.22, c);
      const hx = ln.speed >= 0 ? 2.5 : -2.5, tx = -hx;
      // small headlights — no giant white blobs
      S.glow(S.GLOW.white, hx, 0.55, 0.35, 1.4, 0.7, 0.55, c);
      S.glow(S.GLOW.white, hx, 0.55, -0.35, 1.4, 0.7, 0.55, c);
      S.glow(S.GLOW.red, tx, 0.5, 0.35, 1.0, 0.55, 0.6, c);
      S.glow(S.GLOW.red, tx, 0.5, -0.35, 1.0, 0.55, 0.6, c);
      if (ln.speed) {
        const trail = new S.THREE.Mesh(
          new S.THREE.PlaneGeometry(3.5, 0.12),
          new S.THREE.MeshBasicMaterial({ color: neon, transparent: true, opacity: 0.28, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false, fog: false })
        );
        trail.position.set(ln.speed >= 0 ? -2.8 : 2.8, 0.35, 0);
        trail.rotation.y = Math.PI / 2; c.add(trail);
      }
      S.scene.add(c);
      S.kenneyCars.push({ g: c, speed: ln.speed });
      S.cars.push({ g: c, speed: ln.speed, hero: true });
    });
    // Flying cars — max 2, left/right lanes + mid/far bg; NEVER over our tower/sign/labels
    // Our tower occupies roughly |x|<14, z>-5 in close framing — keep flyers outside
    const flySlots = [
      { x: -38, y: 28, z: -8, neon: 0x00f0ff, paint: 0x1a2830, spd: 5.5 },  // left mid
      { x: 42, y: 34, z: -18, neon: 0xff2a6d, paint: 0x2a1830, spd: -4.8 }, // right far
    ];
    flySlots.forEach((fs, i) => {
      const src = carScenes[i % carScenes.length];
      if (!src) return;
      const c = src.clone(true);
      const neon = fs.neon, paint = fs.paint;
      c.traverse(o => {
        if (!o.isMesh) return;
        o.material = new S.THREE.MeshStandardMaterial({
          color: paint, metalness: 0.9, roughness: 0.25,
          emissive: new S.THREE.Color(neon).multiplyScalar(0.08), emissiveIntensity: 0.3,
          envMapIntensity: 1.3
        });
      });
      c.scale.setScalar(1.85); // ~55% of prior 3.4
      c.position.set(fs.x, fs.y, fs.z);
      c.rotation.y = fs.spd >= 0 ? Math.PI / 2 : -Math.PI / 2;
      const bar = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.2, 0.1, 1.6),
        new S.THREE.MeshBasicMaterial({ color: neon, toneMapped: false, fog: false }));
      bar.position.set(0, 0.85, 0); c.add(bar);
      S.glow(neon === 0x00f0ff ? S.GLOW.cyan : S.GLOW.mag, 0, -0.35, 0, 2.2, 1.0, 0.35, c);
      S.glow(S.GLOW.white, 2.0, 0.3, 0, 1.6, 0.7, 0.5, c);
      S.glow(S.GLOW.red, -2.0, 0.3, 0, 1.1, 0.55, 0.5, c);
      // thin short fade trail — no wide plane across frame
      const trail = new S.THREE.Mesh(
        new S.THREE.PlaneGeometry(4.0, 0.1),
        new S.THREE.MeshBasicMaterial({ color: neon, transparent: true, opacity: 0.22, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false, fog: false })
      );
      trail.position.set(fs.spd >= 0 ? -2.6 : 2.6, 0.2, 0);
      trail.rotation.y = Math.PI / 2; c.add(trail);
      const streak = new S.THREE.Mesh(
        new S.THREE.PlaneGeometry(2.2, 0.04),
        new S.THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: S.THREE.AdditiveBlending, depthWrite: false, side: S.THREE.DoubleSide, toneMapped: false, fog: false })
      );
      streak.position.set(fs.spd >= 0 ? -3.5 : 3.5, 0.2, 0);
      streak.rotation.y = Math.PI / 2; c.add(streak);
      S.scene.add(c);
      const routeName = i === 0 ? 'airLow' : 'airHigh';
      const rec = { g: c, speed: 0, hover: true, fly: true, baseY: fs.y, ph: i, hero: true, route: S.VEHICLE_ROUTES[routeName], routeSpeed: 0.02 + i * 0.006, u: 0.28 + i * 0.4, kind: 'air', id: 'kenney-air-' + i, yaw0: 0, laneKey: routeName };
      if (window.__streets && window.__streets.lanes[routeName]) rec.route = window.__streets.lanes[routeName];
      S.kenneyCars.push(rec);
      S.cars.push(rec);
    });
    
    window.__CARS_READY = true; window.__cars = S.cars; window.__kenneyCars = S.kenneyCars;
    window.__pedestrians = S.pedestrians; window.__mixers = S.mixers;
    window.__SOLDIER_OK = false; // Soldier.glb present but unused (military look)

    // ---- Variant A: Quaternius CC0 clothed walkers (see models/runtime/people/quaternius/LICENSE.txt) ----
    if (S.PEOPLE_VARIANT === 'a') {
      const loadGltfFull = (base, name) => new Promise((resolve, reject) => {
        S.gltfLoader.load(S.glbUrl(base + name), gltf => resolve(gltf), undefined, reject);
      });
      const QBASE = 'models/runtime/people/quaternius/';
      // char_shirt.glb excluded — chibi/big-head proportions (headFrac~0.29)
      // hooded.glb dropped — hood silhouette reads oversized/chibi at street distance
      // char_shirt.glb already excluded (true chibi headFrac~0.29)
      // woman_dress dropped — pastel dress read; dress materials also forced dark if re-added
      const qFiles = [
        'casual.glb', 'woman_casual.glb',
        'scifi.glb', 'woman1.glb', 'woman3.glb',
      ];
      const qGltfs = await Promise.all(qFiles.map(n => loadGltfFull(QBASE, n).catch(e => { console.warn('[people-a] fail', n, e); return null; })));
      const templates = [];
      qGltfs.forEach((gltf, i) => {
        if (!gltf) return;
        const clips = {};
        (gltf.animations || []).forEach(c => {
          const k = (c.name || '').toLowerCase();
          clips[k] = c;
          // also short aliases
          if (/walk/.test(k)) clips.walk = clips.walk || c;
          if (/idle/.test(k) && !/gun|sword|attack|sit/.test(k)) clips.idle = clips.idle || c;
          if (/standing/.test(k)) clips.idle = clips.idle || c;
        });
        templates.push({ name: qFiles[i], scene: gltf.scene, clips });
        console.info('[people-a]', qFiles[i], 'clips', Object.keys(clips).filter(k => k === 'walk' || k === 'idle' || k.length < 40).slice(0, 8));
      });
      if (!templates.length) throw new Error('No Quaternius templates loaded');

      function pickClip(clips, mode) {
        if (mode === 'walk') return clips.walk || clips.idle;
        if (mode === 'stand' || mode === 'phone') return clips.idle || clips.walk;
        return clips.walk || clips.idle;
      }

      function sculptSlimFrame(root) {
        let body = null, best = 0;
        root.traverse(o => {
          if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
          const n = o.geometry.attributes.position.count;
          if (n > best) { best = n; body = o; }
        });
        if (!body || best < 80) return;
        const g = body.geometry.clone();
        body.geometry = g;
        const pos = g.attributes.position;
        g.computeBoundingBox();
        const bb = g.boundingBox;
        const h = Math.max(0.001, bb.max.y - bb.min.y);
        const cx = (bb.max.x + bb.min.x) / 2;
        const cz = (bb.max.z + bb.min.z) / 2;
        let topZ = 0, topN = 0;
        for (let i = 0; i < pos.count; i++) {
          if ((pos.getY(i) - bb.min.y) / h > 0.84) { topZ += pos.getZ(i); topN++; }
        }
        const frontSign = topN && ((topZ / topN) - cz) < 0 ? -1 : 1;
        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const yn = (y - bb.min.y) / h;
          const dx = x - cx, dz = z - cz;
          if (yn > 0.47 && yn < 0.63) {
            const s = Math.sin((yn - 0.47) / 0.16 * Math.PI);
            x = cx + dx * (1 - 0.30 * s);
            z = cz + dz * (1 - 0.10 * s);
          }
          if (yn > 0.65 && yn < 0.78 && (z - cz) * frontSign > -h * 0.02) {
            const t = Math.sin((yn - 0.65) / 0.13 * Math.PI);
            const side = Math.min(1, Math.abs(dx) / (h * 0.09));
            z += frontSign * h * 0.055 * t * (0.3 + 0.7 * side);
          }
          if (yn > 0.55 && yn < 0.86 && Math.abs(dx) > h * 0.11) x = cx + dx * 0.86;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
      }
      function makeRigged(opts = {}) {
        let chosen = templates[(Math.random() * templates.length) | 0];
        if (opts.feminine || opts.longHair) {
          const fem = templates.filter(t => /woman/.test(t.name));
          if (fem.length) chosen = fem[(Math.random() * fem.length) | 0];
        }
        if (opts.hero) {
          const prefer = templates.filter(t => /scifi|casual|woman_casual|woman3/.test(t.name));
          if (prefer.length) chosen = prefer[(Math.random() * prefer.length) | 0];
        }
        if (opts.guitar || opts.longHair) {
          const fem = templates.filter(t => /woman|dress/.test(t.name));
          if (fem.length) chosen = fem[(Math.random() * fem.length) | 0];
        }
        const root = S.SkeletonUtils.clone(chosen.scene);
        const accent = opts.accentForce || S.accentCols[(Math.random() * S.accentCols.length) | 0];
        const arch = opts.archetype || S.pick(S.CP_ARCHETYPES);
        // Scale first so cyberware attachProp sees correct bone world scale
        root.scale.setScalar(1);
        root.updateMatrixWorld(true);
        let bb = new S.THREE.Box3().setFromObject(root);
        const rawH = Math.max(0.01, bb.max.y - bb.min.y);
        const targetH = (opts.hero ? 1.9 : 1.72) * (opts.scale || 1.0);
        root.scale.setScalar(targetH / rawH);
        root.updateMatrixWorld(true);
        bb = new S.THREE.Box3().setFromObject(root);
        if (isFinite(bb.min.y)) root.position.y -= bb.min.y;

        S.styleQuaternius(root, accent, {
          hero: !!opts.hero, rim: true, archetype: arch,
          cyber: true, visor: opts.visor || arch === 'corpo',
          phone: opts.phone, holoWrist: opts.phone || opts.holoWrist,
          mantis: opts.mantis || opts.hero,
          faceplate: opts.faceplate, mask: opts.mask,
        });

        const mixer = new S.THREE.AnimationMixer(root);
        const clip = pickClip(chosen.clips, opts.mode || 'walk');
        if (clip) {
          const act = mixer.clipAction(clip);
          act.play();
          if (opts.mode === 'stand' || opts.mode === 'phone') act.timeScale = 0.7;
        }
        S.mixers.push(mixer);
        root.userData.mode = opts.mode || 'walk';
        root.userData.legL = null;
        root.userData.qName = chosen.name;
        if (opts.guitar) {
          const gtr = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.3, 0.4, 0.08), S.glowMat(accent, 0.4));
          gtr.position.set(0.35, 0.95, 0.15); root.add(gtr);
        }
        return root;
      }

      S.addStreetStory(makeRigged);
      S.addStreetPropsB();
      S.spawnHeroPedestrians(makeRigged);
      S.spawnBackgroundCrowd(makeRigged, 28);
      window.__pedestrians = S.pedestrians; window.__mixers = S.mixers;
      window.__PEOPLE_READY = true;
      window.__PEOPLE_A = true;
      console.info('[people-a] Quaternius spawned', S.pedestrians.length, 'peds', S.mixers.length, 'mixers', templates.length, 'templates');
    }

        console.info('[models] Kenney CC0 loaded', S.kenneyBuildings.length, 'buildings', S.kenneyCars.length, 'cars');
        S.logPerf('models');
    window.__MODELS_OK = true;
  } catch (err) {
    console.warn('[models] Kenney/people load failed', err);
    window.__MODELS_OK = false;
    // Fallback: if A failed, spawn procedural so street isn't empty
    if (S.PEOPLE_VARIANT === 'a' && !window.__PEOPLE_READY) {
      const mk = S.makeFnProcedural();
      S.addStreetStory(mk); S.spawnHeroPedestrians(mk); S.spawnBackgroundCrowd(mk, 36);
      window.__PEOPLE_READY = true;
      console.warn('[people-a] fell back to procedural');
    }
  }
})();


// ---- street signs / poles ----
for (const [x, z, col] of [[-16, 19, 0xff2a6d], [16, 19, 0x00f0ff], [-4, 26, 0xfcee0a], [10, 26, 0xff5fa2]]) {
  S.box(0.12, 4.5, 0.12, S.M(0x333848, { metalness: 0.7 }), x, 2.25, z);
  S.box(2.2, 1.2, 0.12, S.E(col, 2.2), x, 4.2, z);
  S.glow(col === 0xfcee0a ? S.GLOW.yel : (col === 0x00f0ff ? S.GLOW.cyan : S.GLOW.mag), x, 4.2, z + 0.3, 4, 2.2, 0.45);
}
}

