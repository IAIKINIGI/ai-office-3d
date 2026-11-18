import { S } from './scope.js';


S.whoId = function whoId(name) {
  const raw = String(name || '');
  const known = ['Andrew', 'Mandy', 'Penny', 'Hailey', 'Holly', 'Hazel', 'Routinizer', 'Crypto', '風控官', '大市監察'];
  const hit = known.find(k => raw.includes(k));
  const map = { Andrew: 'andrew', Mandy: 'mandy', Penny: 'penny', Hailey: 'hailey', Holly: 'holly', Hazel: 'hazel', Routinizer: 'routinizer', Crypto: 'crypto', '風控官': 'risk', '大市監察': 'market' };
  return hit ? map[hit] : '';
}


S.placed = function placed(geo, x, y, z, rx, ry, rz, sx, sy, sz) {
  const m = new S.THREE.Matrix4();
  m.compose(
    new S.THREE.Vector3(x || 0, y || 0, z || 0),
    new S.THREE.Quaternion().setFromEuler(new S.THREE.Euler(rx || 0, ry || 0, rz || 0)),
    new S.THREE.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)
  );
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(m);
  return g;
}


S.mergeGeos = function mergeGeos(parts) {
  let n = 0;
  for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nrm = new Float32Array(n * 3);
  let off = 0;
  for (const g of parts) {
    const p = g.attributes.position.array;
    const nn = g.attributes.normal ? g.attributes.normal.array : null;
    pos.set(p, off);
    if (nn && nn.length === p.length) nrm.set(nn, off);
    off += p.length;
    g.dispose();
  }
  const out = new S.THREE.BufferGeometry();
  out.setAttribute('position', new S.THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new S.THREE.BufferAttribute(nrm, 3));
  return out;
}


S.boxG = function boxG(w, h, d) { return new S.THREE.BoxGeometry(w, h, d); }


S.sphG = function sphG(r, w, h) { return new S.THREE.SphereGeometry(r, w || 8, h || 6); }


// Original geometry for this page. Rigged downloads were skipped: their skeletons
// do not match these elbow and knee pivots, and they would add a character file.
S.limbGeo = function limbGeo(kind) {
  const c = limbGeo.c || (limbGeo.c = {});
  if (c[kind]) return c[kind];
  const V = S.THREE.Vector2;
  const profiles = {
    upper: [new V(0.052, 0), new V(0.05, -0.05), new V(0.04, -0.11), new V(0.034, -0.18)],
    fore: [new V(0.036, 0), new V(0.038, -0.04), new V(0.03, -0.1), new V(0.026, -0.15), new V(0.022, -0.17)],
    thigh: [new V(0.074, 0), new V(0.07, -0.1), new V(0.055, -0.28), new V(0.044, -0.4)],
    shin: [new V(0.044, 0), new V(0.054, -0.12), new V(0.038, -0.28), new V(0.03, -0.38)],
  };
  c[kind] = new S.THREE.LatheGeometry(profiles[kind], 12);
  return c[kind];
}


S.handGeo = function handGeo(side) {
  const c = handGeo.c || (handGeo.c = {});
  if (c[side]) return c[side];
  const s = side < 0 ? -1 : 1;
  const parts = [S.placed(S.boxG(0.05, 0.03, 0.034), 0, -0.014, 0.008)];
  const fingers = [[-0.016, 0.028], [-0.005, 0.034], [0.006, 0.031], [0.016, 0.024]];
  for (const [x, len] of fingers) {
    parts.push(S.placed(S.boxG(0.011, len, 0.012), s * x, -0.028 - len / 2, 0.012));
    parts.push(S.placed(S.sphG(0.006, 5, 4), s * x, -0.028 - len, 0.012));
  }
  parts.push(S.placed(S.boxG(0.012, 0.024, 0.012), s * -0.024, -0.01, 0.016, 0.4, 0, s * -0.6));
  parts.push(S.placed(S.sphG(0.007, 5, 4), s * -0.034, -0.024, 0.022));
  c[side] = S.mergeGeos(parts);
  return c[side];
}


S.shoeGeo = function shoeGeo() {
  if (shoeGeo.g) return shoeGeo.g;
  shoeGeo.g = S.mergeGeos([
    S.placed(S.boxG(0.072, 0.014, 0.168), 0, 0.01, 0.02),
    S.placed(S.boxG(0.06, 0.03, 0.09), 0, 0.028, -0.005),
    S.placed(S.boxG(0.056, 0.022, 0.055), 0, 0.022, 0.07),
    S.placed(S.boxG(0.052, 0.034, 0.04), 0, 0.03, -0.05),
    S.placed(S.sphG(0.02, 6, 5), 0, 0.02, 0.09, 0, 0, 0, 1.3, 0.6, 1.1),
  ]);
  return shoeGeo.g;
}


S.skinGeo = function skinGeo() {
  if (skinGeo.g) return skinGeo.g;
  skinGeo.g = S.mergeGeos([
    S.placed(new S.THREE.SphereGeometry(0.104, 18, 14), 0, 0, 0),
    S.placed(S.sphG(0.016, 7, 5), 0, -0.004, 0.096, 0, 0, 0, 0.75, 0.6, 1.25),
    S.placed(S.sphG(0.02, 7, 5), 0.098, -0.006, 0, 0, 0, 0, 0.45, 1.05, 0.62),
    S.placed(S.sphG(0.02, 7, 5), -0.098, -0.006, 0, 0, 0, 0, 0.45, 1.05, 0.62),
    S.placed(S.boxG(0.032, 0.006, 0.008), 0, -0.042, 0.09),
    S.placed(S.boxG(0.026, 0.006, 0.008), -0.032, 0.042, 0.084, 0, 0, 0.2),
    S.placed(S.boxG(0.026, 0.006, 0.008), 0.032, 0.042, 0.084, 0, 0, -0.2),
  ]);
  return skinGeo.g;
}


S.eyeGeo = function eyeGeo() {
  if (eyeGeo.g) return eyeGeo.g;
  const whites = S.mergeGeos([
    S.placed(S.sphG(0.016, 8, 6), -0.034, 0.016, 0.09, 0, 0, 0, 1.05, 0.72, 0.55),
    S.placed(S.sphG(0.016, 8, 6), 0.034, 0.016, 0.09, 0, 0, 0, 1.05, 0.72, 0.55),
  ]);
  const pupils = S.mergeGeos([
    S.placed(S.sphG(0.007, 6, 4), -0.034, 0.014, 0.1),
    S.placed(S.sphG(0.007, 6, 4), 0.034, 0.014, 0.1),
  ]);
  const wc = whites.attributes.position.count;
  const pc = pupils.attributes.position.count;
  const pos = new Float32Array((wc + pc) * 3);
  const nrm = new Float32Array((wc + pc) * 3);
  pos.set(whites.attributes.position.array, 0);
  pos.set(pupils.attributes.position.array, wc * 3);
  nrm.set(whites.attributes.normal.array, 0);
  nrm.set(pupils.attributes.normal.array, wc * 3);
  whites.dispose(); pupils.dispose();
  const g = new S.THREE.BufferGeometry();
  g.setAttribute('position', new S.THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new S.THREE.BufferAttribute(nrm, 3));
  g.addGroup(0, wc, 0);
  g.addGroup(wc, pc, 1);
  eyeGeo.g = g;
  return g;
}


S.lapelGeo = function lapelGeo() {
  if (lapelGeo.g) return lapelGeo.g;
  const lip = S.boxG(0.032, 0.17, 0.01);
  lapelGeo.g = S.mergeGeos([
    S.placed(lip, 0.055, 0.42, 0.198, -0.28, 0, -0.55),
    S.placed(lip, -0.055, 0.42, 0.198, -0.28, 0, 0.55),
  ]);
  return lapelGeo.g;
}


S.jacketGeo = function jacketGeo(kind) {
  const c = jacketGeo.c || (jacketGeo.c = {});
  if (c[kind]) return c[kind];
  const V = S.THREE.Vector2;
  const profiles = {
    coat: [new V(0.118, -0.05), new V(0.156, 0.02), new V(0.124, 0.16), new V(0.15, 0.32), new V(0.178, 0.44), new V(0.15, 0.54), new V(0.07, 0.6), new V(0.046, 0.7)],
    blazer: [new V(0.1, 0.05), new V(0.146, 0.09), new V(0.11, 0.18), new V(0.146, 0.32), new V(0.164, 0.44), new V(0.14, 0.54), new V(0.066, 0.6), new V(0.046, 0.68)],
    utility: [new V(0.132, 0.02), new V(0.158, 0.1), new V(0.15, 0.22), new V(0.162, 0.36), new V(0.172, 0.46), new V(0.14, 0.54), new V(0.07, 0.6), new V(0.048, 0.68)],
  };
  const parts = [S.placed(new S.THREE.LatheGeometry(profiles[kind], 16), 0, 0, 0)];
  const lapel = S.boxG(0.026, kind === 'blazer' ? 0.15 : 0.18, 0.012);
  parts.push(S.placed(lapel, 0.05, 0.4, 0.185, -0.25, 0, -0.5));
  parts.push(S.placed(lapel, -0.05, 0.4, 0.185, -0.25, 0, 0.5));
  parts.push(S.placed(S.boxG(0.008, 0.3, 0.01), 0, 0.28, 0.162));
  parts.push(S.placed(S.boxG(0.11, 0.008, 0.012), 0.1, 0.5, 0.06, 0, 0, 0.35));
  parts.push(S.placed(S.boxG(0.11, 0.008, 0.012), -0.1, 0.5, 0.06, 0, 0, -0.35));
  if (kind === 'utility') parts.push(S.placed(S.boxG(0.07, 0.05, 0.014), 0.07, 0.36, 0.175));
  if (kind === 'coat') parts.push(S.placed(S.boxG(0.24, 0.012, 0.012), 0, -0.02, 0.1));
  c[kind] = S.mergeGeos(parts);
  return c[kind];
}


// A thin shell on the skull. The old caps were flattened spheres parked on top,
// which read as a beret and left the forehead bare.
S.hairShell = function hairShell(o) {
  const geo = new S.THREE.SphereGeometry(o.r, 32, 22);
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const idx = geo.index.array;
  const outP = [], outN = [];
  const keep = (x, y, z) => {
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len, ny = y / len, nz = z / len;
    const face = Math.max(0, nz), back = Math.max(0, -nz);
    const line = o.front * face + o.back * back + o.side * (1 - face - back);
    if (ny < line) return false;
    if (nz > 0.42 && ny < o.brow) return false;
    return true;
  };
  for (let i = 0; i < idx.length; i += 3) {
    const ia = idx[i], ib = idx[i + 1], ic = idx[i + 2];
    const mx = (pos.getX(ia) + pos.getX(ib) + pos.getX(ic)) / 3;
    const my = (pos.getY(ia) + pos.getY(ib) + pos.getY(ic)) / 3;
    const mz = (pos.getZ(ia) + pos.getZ(ib) + pos.getZ(ic)) / 3;
    if (!keep(mx, my, mz)) continue;
    for (const vi of [ia, ib, ic]) {
      outP.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
      outN.push(nrm.getX(vi), nrm.getY(vi), nrm.getZ(vi));
    }
  }
  geo.dispose();
  const g = new S.THREE.BufferGeometry();
  g.setAttribute('position', new S.THREE.Float32BufferAttribute(outP, 3));
  g.setAttribute('normal', new S.THREE.Float32BufferAttribute(outN, 3));
  return g;
}


S.hairGeo = function hairGeo(kind) {
  const c = hairGeo.c || (hairGeo.c = {});
  if (c[kind]) return c[kind];
  const spec = {
    part:  { front: 0.22, back: -0.08, side: -0.02, brow: 0.4, r: 0.114 },
    bob:   { front: 0.16, back: -0.48, side: -0.3, brow: 0.34, r: 0.116 },
    pony:  { front: 0.24, back: -0.16, side: -0.04, brow: 0.4, r: 0.114 },
    pixie: { front: 0.3, back: -0.02, side: 0.06, brow: 0.46, r: 0.112 },
    sweep: { front: 0.18, back: -0.34, side: -0.16, brow: 0.36, r: 0.115 },
    bun:   { front: 0.26, back: -0.1, side: 0.0, brow: 0.42, r: 0.113 },
    undercut: { front: 0.34, back: 0.02, side: 0.1, brow: 0.48, r: 0.111 },
    spike: { front: 0.24, back: -0.04, side: 0.02, brow: 0.4, r: 0.113 },
    slick: { front: 0.28, back: -0.2, side: 0.02, brow: 0.44, r: 0.113 },
    side:  { front: 0.2, back: -0.14, side: -0.04, brow: 0.38, r: 0.114 },
  }[kind] || { front: 0.24, back: -0.08, side: 0, brow: 0.4, r: 0.114 };
  let g = S.hairShell(spec);
  if (kind === 'pony') g = S.mergeGeos([g, S.placed(new S.THREE.CylinderGeometry(0.01, 0.016, 0.055, 8), 0, -0.03, -0.09, 0.7, 0, 0)]);
  if (kind === 'bun') g = S.mergeGeos([g, S.placed(S.sphG(0.018, 8, 6), 0, 0.02, -0.082)]);
  c[kind] = g;
  return g;
}


S.quietMesh = function quietMesh(geo, mat) {
  const m = new S.THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = false;
  return m;
}


S.makeOfficePerson = function makeOfficePerson(id) {
  const look = S.LOOKS[id] || S.LOOKS.hailey;
  const rig = new S.THREE.Group();
  const suit = S.M(look.suit, { roughness: 0.48, metalness: 0.14 });
  const cloth = S.M(look.trousers, { roughness: 0.6, metalness: 0.06 });
  const skin = S.M(look.skin, { roughness: 0.52, metalness: 0 });
  const hairM = S.M(look.hair, { roughness: 0.92, metalness: 0 });
  const shoeM = S.M(0x1a140e, { roughness: 0.38, metalness: 0.35 });
  const shirtM = S.M(look.shirt, { roughness: 0.5, metalness: 0.04 });
  const eyeM = S.M(0xf4f7fb, { roughness: 0.22, metalness: 0 });
  const pupilM = S.M(0x140e0c, { roughness: 0.3 });
  const trimM = S.E(look.trim, id === 'andrew' ? 1.05 : 0.5);
  const beltM = S.M(0x10141c, { roughness: 0.35, metalness: 0.55 });

  const torso = S.quietMesh(S.jacketGeo(look.jacket), suit);
  torso.position.y = 0.88;
  torso.scale.x = look.shoulder;
  rig.add(torso);
  const lapelTint = new S.THREE.Color(look.suit);
  lapelTint.offsetHSL(0, -0.04, 0.14);
  const lapels = S.quietMesh(S.lapelGeo(), S.M(lapelTint.getHex(), { roughness: 0.4, metalness: 0.22 }));
  torso.add(lapels);
  const shirt = S.quietMesh(S.mergeGeos([
    S.placed(S.boxG(0.04, 0.18, 0.012), 0, 0.36, 0.16),
    S.placed(new S.THREE.TorusGeometry(0.07, 0.01, 6, 14), 0, 0.56, 0, Math.PI / 2, 0, 0),
  ]), shirtM);
  torso.add(shirt);
  if (look.tie) {
    const tie = S.quietMesh(S.boxG(0.022, 0.16, 0.01), S.M(look.tie, { roughness: 0.4 }));
    tie.position.set(0, 0.3, 0.175);
    torso.add(tie);
  }
  const belt = S.quietMesh(new S.THREE.TorusGeometry(0.07, 0.008, 6, 14), beltM);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(look.shoulder * 1.55, 1.55, 1.15);
  belt.position.y = 0.12;
  torso.add(belt);
  const ring = S.quietMesh(new S.THREE.TorusGeometry(0.09, 0.011, 6, 16), trimM);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.57;
  torso.add(ring);
  if (look.cyber === 'pin') {
    const pin = S.quietMesh(S.sphG(0.012, 6, 5), trimM);
    pin.position.set(0.1 * look.shoulder, 0.44, 0.17);
    torso.add(pin);
  }

  const head = S.quietMesh(S.skinGeo(), skin);
  head.position.y = 1.66;
  head.scale.set(look.head[0], look.head[1], look.head[2]);
  rig.add(head);
  const hair = S.quietMesh(S.hairGeo(look.hairKind), hairM);
  head.add(hair);
  const eyes = S.quietMesh(S.eyeGeo(), [eyeM, pupilM]);
  eyes.scale.set(look.head[0] > 1 ? 0.96 : 1.04, 1, 1);
  head.add(eyes);
  if (look.cyber === 'ear') {
    const cuff = S.quietMesh(S.boxG(0.016, 0.012, 0.02), trimM);
    cuff.position.set(0.11, 0.01, 0.02);
    head.add(cuff);
  } else if (look.cyber === 'visor') {
    const bar = S.quietMesh(S.boxG(0.086, 0.008, 0.01), trimM);
    bar.position.set(0, 0.048, 0.09);
    head.add(bar);
  } else if (look.cyber === 'cheek') {
    const bar = S.quietMesh(S.boxG(0.028, 0.006, 0.008), trimM);
    bar.position.set(0.045, -0.01, 0.095);
    head.add(bar);
  } else if (look.cyber === 'monocle') {
    const mono = S.quietMesh(new S.THREE.TorusGeometry(0.02, 0.004, 6, 12), trimM);
    mono.position.set(0.034, 0.018, 0.095);
    head.add(mono);
  } else if (look.cyber === 'temple') {
    const bar = S.quietMesh(S.boxG(0.02, 0.008, 0.012), trimM);
    bar.position.set(0.08, 0.04, 0.05);
    head.add(bar);
  }

  function addArm(side) {
    const pivot = new S.THREE.Group();
    pivot.position.set(side * (0.19 + (look.shoulder - 1) * 0.05), 1.4, 0);
    rig.add(pivot);
    const upper = S.quietMesh(S.limbGeo('upper'), suit);
    pivot.add(upper);
    const fore = new S.THREE.Group();
    fore.position.y = -0.18;
    pivot.add(fore);
    fore.add(S.quietMesh(S.limbGeo('fore'), suit));
    const hand = S.quietMesh(S.handGeo(side), skin);
    hand.position.y = -0.16;
    fore.add(hand);
    return { pivot, fore };
  }
  function addLeg(side) {
    const hip = new S.THREE.Group();
    hip.position.set(side * 0.085, 0.9, 0);
    rig.add(hip);
    const thigh = S.quietMesh(S.limbGeo('thigh'), cloth);
    hip.add(thigh);
    const shin = new S.THREE.Group();
    shin.position.y = -0.4;
    hip.add(shin);
    shin.add(S.quietMesh(S.limbGeo('shin'), cloth));
    const shoe = S.quietMesh(S.shoeGeo(), shoeM);
    shoe.position.set(0, -0.36, 0.02);
    shin.add(shoe);
    return { hip, shin };
  }
  const armL = addArm(-1), armR = addArm(1);
  const legL = addLeg(-1), legR = addLeg(1);
  const labelAt = new S.THREE.Object3D();
  labelAt.position.set(0, 1.96, 0);
  rig.add(labelAt);
  rig.userData = {
    legL: legL.hip, legR: legR.hip, shinL: legL.shin, shinR: legR.shin,
    armL: armL.pivot, armR: armR.pivot, foreL: armL.fore, foreR: armR.fore,
    head, torso, labelAt,
  };
  return rig;
}


S.registerAgent = function registerAgent(id, floor, group, rig, x, z, rot) {
  const agent = {
    id, lv: floor.lv, floorId: floor.id, group, rig,
    home: { x, z, rot }, phase: 'home', pose: 'type',
    route: [], ri: 0, busy: false, arriveYaw: rot, arrivePose: 'type',
  };
  rig.position.set(x, 0, z); rig.rotation.y = rot;
  S.cast.push(agent); S.castById[id] = agent;
  return agent;
}


S.person = function person(parent, x, z, color, name, floor, rotY = 0) {
  const id = S.whoId(name);
  if (!id || S.castById[id]) return;
  const rig = S.makeOfficePerson(id);
  parent.add(rig);
  const { torso, head } = rig.userData;
  [torso, head].forEach(m => { m.userData.floor = floor; S.pickables.push(m); });
  if (name) S.labels.push({ obj: rig.userData.labelAt, text: name, floor });
  S.registerAgent(id, floor, parent, rig, x, z, rotY);
}


S.laneOf = function laneOf(a) { return S.LANES[a.id] ?? 2.35; }


S.hereLv = function hereLv(a) {
  if (a.rig.parent === S.lift.cabin) return S.lift.lv;
  const py = a.rig.parent && a.rig.parent.position ? a.rig.parent.position.y : 0;
  return Math.round(py / S.FH) + 1;
}


S.faceYaw = function faceYaw(rig, yaw, dt) {
  let d = yaw - rig.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  rig.rotation.y += d * Math.min(1, (dt || 0.016) * 8);
}


S.lookAt = function lookAt(a, b, dt) {
  if (!a || !b || a.rig.parent !== b.rig.parent) return;
  const dx = b.rig.position.x - a.rig.position.x, dz = b.rig.position.z - a.rig.position.z;
  if (Math.hypot(dx, dz) < 0.08) return;
  S.faceYaw(a.rig, Math.atan2(dx, dz), dt);
}


S.pathTo = function pathTo(agent, dest) {
  const lane = S.laneOf(agent);
  const pts = [];
  let x = agent.rig.position.x, z = agent.rig.position.z;
  const push = (px, pz) => {
    const prev = pts.length ? pts[pts.length - 1] : [x, z];
    if (Math.hypot(prev[0] - px, prev[1] - pz) < 0.08) return;
    pts.push([px, pz]);
  };
  if (z > 4.9) { push(x, 5.45); push(-6.4, 5.45); }
  const zx = pts.length ? pts[pts.length - 1][0] : x;
  push(zx, lane);
  push(dest[0], lane);
  push(dest[0], dest[1]);
  return pts;
}


S.sendAlong = function sendAlong(agent, points, yaw, pose) {
  agent.arriveYaw = yaw;
  agent.arrivePose = pose;
  agent.route = points;
  agent.ri = 0;
  agent.phase = points.length ? 'walk' : 'there';
  agent.pose = points.length ? 'walk' : pose;
  if (!points.length && yaw != null) agent.rig.rotation.y = yaw;
}


S.sendTo = function sendTo(agent, dest, yaw, pose) { S.sendAlong(agent, S.pathTo(agent, dest), yaw, pose); }


S.sendHome = function sendHome(agent) { S.sendTo(agent, [agent.home.x, agent.home.z], agent.home.rot, 'type'); }


S.pairSpots = function pairSpots(beat) {
  if (beat.kind === 'chat') return { a: [-0.72, 2.72], aYaw: Math.PI / 2, b: [0.72, 2.72], bYaw: -Math.PI / 2, pose: 'talk' };
  if (beat.kind === 'rest') return { a: [7.68, 4.46], aYaw: Math.PI, b: [8.58, 4.46], bYaw: Math.PI, pose: 'sit' };
  if (beat.kind === 'game') return { a: [7.85, -1.93], aYaw: Math.PI, b: [8.85, -1.93], bYaw: Math.PI, pose: 'play' };
  const h = S.castById[beat.a].home;
  return { a: [h.x + 1.62, h.z - 1.15], aYaw: Math.PI, b: [h.x + 1.62, h.z + 0.15], bYaw: Math.PI, pose: 'look' };
}


S.visitSpots = function visitSpots(host, mode) {
  if (mode === 'consult') {
    const h = host.home;
    return { h: [h.x + 1.62, h.z - 1.15], hYaw: Math.PI, g: [h.x + 1.62, h.z + 0.15], gYaw: Math.PI, pose: 'look' };
  }
  return { h: [-0.72, 2.72], hYaw: Math.PI / 2, g: [0.72, 2.72], gYaw: -Math.PI / 2, pose: 'talk' };
}


S.walkAgent = function walkAgent(agent, dt) {
  const rig = agent.rig;
  const tgt = agent.route[agent.ri];
  if (!tgt) { agent.phase = 'there'; return true; }
  const dx = tgt[0] - rig.position.x, dz = tgt[1] - rig.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.07) {
    rig.position.x = tgt[0]; rig.position.z = tgt[1];
    agent.ri++;
    if (agent.ri < agent.route.length) return false;
    agent.phase = 'there';
    agent.pose = agent.arrivePose || 'stand';
    if (agent.arriveYaw != null) rig.rotation.y = agent.arriveYaw;
    if (agent.arrivePose === 'type') {
      rig.position.x = agent.home.x; rig.position.z = agent.home.z; rig.rotation.y = agent.home.rot;
    }
    return true;
  }
  const yaw = Math.atan2(dx, dz);
  let turn = yaw - rig.rotation.y;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  if (Math.abs(turn) > 0.4 && dist > 0.22) {
    rig.rotation.y += Math.sign(turn) * Math.min(Math.abs(turn), 2.6 * dt);
    return false;
  }
  // Mandy's in-place walk plants at about 1.22 m/s. The other cast keep 1.15.
  const step = Math.min(dist, (agent.id === 'mandy' ? 1.22 : 1.15) * dt);
  rig.position.x += dx / dist * step;
  rig.position.z += dz / dist * step;
  S.faceYaw(rig, yaw, dt);
  return false;
}


S.setElbows = function setElbows(u, l, r) {
  if (!u.foreL) return;
  u.foreL.rotation.x = l;
  u.foreR.rotation.x = r;
}


S.poseAgent = function poseAgent(agent, kind, t) {
  const u = agent.rig.userData, rig = agent.rig;
  if (!u.legL) return;
  const plant = () => { u.legL.rotation.x = u.legR.rotation.x = u.shinL.rotation.x = u.shinR.rotation.x = 0; };
  if (kind === 'walk') {
    const s = Math.sin(t * 7.2 + agent.home.x);
    u.legL.rotation.x = s * 0.7; u.legR.rotation.x = -s * 0.7;
    u.shinL.rotation.x = Math.max(0, -s) * 0.95; u.shinR.rotation.x = Math.max(0, s) * 0.95;
    u.armL.rotation.x = -s * 0.45; u.armR.rotation.x = s * 0.45;
    S.setElbows(u, -0.28, -0.28);
    rig.position.y = Math.abs(s) * 0.03;
    u.head.rotation.x = 0; u.head.rotation.y = 0;
  } else if (kind === 'type' || kind === 'sit' || kind === 'play') {
    u.legL.rotation.x = u.legR.rotation.x = 1.15;
    u.shinL.rotation.x = u.shinR.rotation.x = -1.2;
    // Desk chairs stay at the original height. Lounge seats were raised.
    rig.position.y = kind === 'type' ? -0.38 : -0.10;
    u.head.rotation.y = 0;
    if (kind === 'type') {
      u.armL.rotation.x = -0.62 + Math.sin(t * 8 + agent.home.x) * 0.08;
      u.armR.rotation.x = -0.58 + Math.cos(t * 8.5 + agent.home.x) * 0.08;
      S.setElbows(u, -0.85, -0.8);
      u.head.rotation.x = 0.28;
    } else if (kind === 'play') {
      u.armL.rotation.x = -0.78 + Math.sin(t * 6 + agent.home.x) * 0.05;
      u.armR.rotation.x = -0.72 + Math.sin(t * 7 + agent.home.x) * 0.06;
      S.setElbows(u, -0.55, -0.5);
      u.head.rotation.x = 0.34;
    } else {
      u.armL.rotation.x = -0.28; u.armR.rotation.x = -0.24;
      S.setElbows(u, -0.55, -0.5);
      u.head.rotation.x = 0.06;
    }
  } else if (kind === 'talk') {
    plant(); rig.position.y = 0;
    u.armL.rotation.x = -1.15 + Math.sin(t * 3.1 + agent.home.x) * 0.12;
    u.armR.rotation.x = -0.22;
    S.setElbows(u, -0.25, -0.45);
    u.head.rotation.x = Math.sin(t * 1.6 + agent.home.x) * 0.06;
    u.head.rotation.y = 0;
  } else if (kind === 'look') {
    plant(); rig.position.y = 0;
    u.armR.rotation.x = -0.85; u.armL.rotation.x = -0.22;
    S.setElbows(u, -0.4, -0.35);
    u.head.rotation.x = 0.22;
    u.head.rotation.y = Math.sin(t * 1.2 + agent.home.x) * 0.15;
  } else {
    plant(); rig.position.y = 0;
    u.armL.rotation.x = Math.sin(t * 0.8 + agent.home.x) * 0.04;
    u.armR.rotation.x = -0.08;
    S.setElbows(u, -0.22, -0.22);
    u.head.rotation.x = 0; u.head.rotation.y = 0;
  }
}


S.liftReady = function liftReady(lv) {
  return S.lift.target === lv && Math.abs(S.lift.cabin.position.y - S.liftY(lv)) < 0.08 && S.lift.open > 0.9;
}


S.beatIds = function beatIds(beat) {
  if (beat.kind === 'visit') return [beat.guest, beat.host];
  if (beat.kind === 'errand') return beat.with ? [beat.who, beat.with] : [beat.who];
  return [beat.a, beat.b];
}


S.streetPath = function streetPath(spot, lane) {
  const s = window.__streets && window.__streets.spots && window.__streets.spots[spot];
  const raw = s ? (lane === 'B' ? (s.pathB || s.path) : s.path) : [[0, 10], [0, 30]];
  return raw.map(p => [p[0], p[1]]);
}


S.streetBack = function streetBack(spot, lane) {
  return S.streetPath(spot, lane).slice().reverse().concat([[0, 8.5]]);
}


S.startBeat = function startBeat(beat) {
  const ids = S.beatIds(beat);
  if (ids.some(id => !S.castById[id])) return 'skip';
  if (ids.some(id => S.castById[id].busy)) return false;
  if (beat.kind === 'visit' && S.director.liftLock > 0) return false;
  S.director.beat = beat;
  S.director.hold = beat.hold;
  for (const id of ids) S.castById[id].busy = true;
  if (beat.kind === 'errand' && !window.__streets) return false;
  if (beat.kind === 'visit' || beat.kind === 'errand') {
    S.director.phase = 'toLift';
    S.director.spots = null;
    const who = beat.kind === 'visit' ? beat.guest : beat.who;
    S.sendTo(S.castById[who], [-6.4, 5.55], 0, 'stand');
  } else {
    const spots = S.pairSpots(beat);
    S.director.spots = spots;
    S.director.phase = 'go';
    S.sendTo(S.castById[beat.a], spots.a, spots.aYaw, spots.pose);
    S.sendTo(S.castById[beat.b], spots.b, spots.bYaw, spots.pose);
  }
  return true;
}


S.finishBeat = function finishBeat() {
  const beat = S.director.beat;
  if (!beat) { S.director.phase = 'gap'; S.director.gap = 4; return; }
  for (const id of S.beatIds(beat)) {
    const a = S.castById[id];
    if (!a) continue;
    a.busy = false; a.pose = 'type'; a.phase = 'home';
  }
  if (beat.kind === 'visit') S.director.liftLock = 10;
  S.director.beat = null;
  S.director.phase = 'gap';
  S.director.gap = 6;
}


S.updatePair = function updatePair(dt) {
  const beat = S.director.beat;
  const A = S.castById[beat.a], B = S.castById[beat.b];
  if (S.director.phase === 'go') {
    if (A.phase !== 'walk' && B.phase !== 'walk') { S.director.phase = 'hold'; S.director.hold = beat.hold; }
  } else if (S.director.phase === 'hold') {
    if (beat.kind === 'chat') { S.lookAt(A, B, dt); S.lookAt(B, A, dt); }
    S.director.hold -= dt;
    if (S.director.hold <= 0) { S.sendHome(A); S.sendHome(B); S.director.phase = 'back'; }
  } else if (S.director.phase === 'back') {
    if (A.phase !== 'walk' && B.phase !== 'walk') S.finishBeat();
  }
}


S.boardPath = function boardPath() { return [[-8.15, 5.7], [-8.15, 8.22]]; }


S.updateVisit = function updateVisit(dt) {
  const beat = S.director.beat;
  const G = S.castById[beat.guest], H = S.castById[beat.host];
  const mode = beat.mode || 'chat';
  if (S.director.phase === 'toLift') {
    if (G.phase !== 'walk') {
      S.lift.target = G.lv;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(G.lv)) < 0.1;
      if (S.liftReady(G.lv)) { S.sendAlong(G, S.boardPath(), 0, 'stand'); S.director.phase = 'board'; }
    }
  } else if (S.director.phase === 'board') {
    S.lift.target = G.lv; S.lift.wantOpen = true;
    if (G.phase !== 'walk' && S.liftReady(G.lv)) {
      S.lift.cabin.attach(G.rig);
      G.rig.position.set(0, 0, -0.12);
      G.rig.rotation.y = Math.PI;
      G.phase = 'there'; G.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = H.lv;
      const spots = S.visitSpots(H, mode);
      S.director.spots = spots;
      S.sendTo(H, spots.h, spots.hYaw, spots.pose);
      S.director.phase = 'ride';
    }
  } else if (S.director.phase === 'ride') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(H.lv)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      H.group.attach(G.rig);
      G.rig.position.set(-8.15, 0, 6.5);
      G.rig.rotation.y = Math.PI;
      const spots = S.director.spots || S.visitSpots(H, mode);
      S.sendTo(G, spots.g, spots.gYaw, spots.pose);
      S.lift.wantOpen = false;
      S.director.phase = 'toMeet';
    }
  } else if (S.director.phase === 'toMeet') {
    if (G.phase !== 'walk' && H.phase !== 'walk') { S.director.phase = 'meet'; S.director.hold = beat.hold; }
  } else if (S.director.phase === 'meet') {
    if (mode === 'chat') { S.lookAt(G, H, dt); S.lookAt(H, G, dt); }
    S.director.hold -= dt;
    if (S.director.hold <= 0) {
      S.sendHome(H);
      S.sendTo(G, [-6.4, 5.55], 0, 'stand');
      S.director.phase = 'toLiftHome';
    }
  } else if (S.director.phase === 'toLiftHome') {
    if (G.phase !== 'walk') {
      S.lift.target = H.lv;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(H.lv)) < 0.1;
      if (S.liftReady(H.lv)) { S.sendAlong(G, S.boardPath(), 0, 'stand'); S.director.phase = 'reboard'; }
    }
  } else if (S.director.phase === 'reboard') {
    S.lift.target = H.lv; S.lift.wantOpen = true;
    if (G.phase !== 'walk' && S.liftReady(H.lv)) {
      S.lift.cabin.attach(G.rig);
      G.rig.position.set(0, 0, -0.12);
      G.rig.rotation.y = Math.PI;
      G.phase = 'there'; G.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = G.lv;
      S.director.phase = 'rideHome';
    }
  } else if (S.director.phase === 'rideHome') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(G.lv)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      G.group.attach(G.rig);
      G.rig.position.set(-8.15, 0, 6.5);
      G.rig.rotation.y = Math.PI;
      S.lift.wantOpen = false;
      S.sendHome(G);
      S.director.phase = 'back';
    }
  } else if (S.director.phase === 'back') {
    if (G.phase !== 'walk' && H.phase !== 'walk') S.finishBeat();
  }
}


S.updateErrand = function updateErrand(dt) {
  const beat = S.director.beat;
  const A = S.castById[beat.who];
  const B = beat.with ? S.castById[beat.with] : null;
  const lobby = S.floorGroups.find(f => f.f.lv === 1);
  if (!A || !lobby) { S.finishBeat(); return; }
  if (S.director.phase === 'toLift') {
    if (A.phase !== 'walk') {
      S.lift.target = A.lv;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(A.lv)) < 0.1;
      if (S.liftReady(A.lv)) { S.sendAlong(A, S.boardPath(), 0, 'stand'); S.director.phase = 'board'; }
    }
  } else if (S.director.phase === 'board') {
    S.lift.target = A.lv; S.lift.wantOpen = true;
    if (A.phase !== 'walk' && S.liftReady(A.lv)) {
      S.lift.cabin.attach(A.rig);
      A.rig.position.set(0, 0, -0.12);
      A.rig.rotation.y = Math.PI;
      A.phase = 'there'; A.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = 1;
      S.director.phase = 'rideOut';
    }
  } else if (S.director.phase === 'rideOut') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(1)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      lobby.g.attach(A.rig);
      A.rig.position.set(-8.15, 0, 6.5);
      A.rig.rotation.y = 0;
      S.sendAlong(A, [[-2.4, 5.5], [0, 5.5], [0, 8.6]], 0, 'walk');
      S.lift.wantOpen = false;
      S.director.phase = 'exit';
    }
  } else if (S.director.phase === 'exit') {
    if (A.phase !== 'walk') {
      const wp = new S.THREE.Vector3();
      A.rig.getWorldPosition(wp);
      S.scene.attach(A.rig);
      A.rig.position.set(wp.x, 0, wp.z);
      S.sendAlong(A, S.streetPath(beat.spot, 'A'), 0, 'walk');
      S.director.phase = 'street';
    }
  } else if (S.director.phase === 'street') {
    if (A.phase !== 'walk') {
      A.pose = beat.pose || 'look';
      if (B && !S.director.bOut) { S.director.phase = 'toLiftB'; S.sendTo(B, [-6.4, 5.55], 0, 'stand'); }
      else { S.director.phase = 'outHold'; S.director.hold = beat.hold; }
    }
  } else if (S.director.phase === 'toLiftB') {
    if (B.phase !== 'walk') {
      S.lift.target = B.lv;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(B.lv)) < 0.1;
      if (S.liftReady(B.lv)) { S.sendAlong(B, S.boardPath(), 0, 'stand'); S.director.phase = 'boardB'; }
    }
  } else if (S.director.phase === 'boardB') {
    S.lift.target = B.lv; S.lift.wantOpen = true;
    if (B.phase !== 'walk' && S.liftReady(B.lv)) {
      S.lift.cabin.attach(B.rig);
      B.rig.position.set(0, 0, -0.12); B.rig.rotation.y = Math.PI;
      B.phase = 'there'; B.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = 1;
      S.director.phase = 'rideOutB';
    }
  } else if (S.director.phase === 'rideOutB') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(1)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      lobby.g.attach(B.rig);
      B.rig.position.set(-8.15, 0, 6.5); B.rig.rotation.y = 0;
      S.sendAlong(B, [[2.2, 5.5], [0, 5.5], [0, 8.6]], 0, 'walk');
      S.lift.wantOpen = false;
      S.director.phase = 'exitB';
    }
  } else if (S.director.phase === 'exitB') {
    if (B.phase !== 'walk') {
      const wp = new S.THREE.Vector3();
      B.rig.getWorldPosition(wp);
      S.scene.attach(B.rig);
      B.rig.position.set(wp.x, 0, wp.z);
      S.sendAlong(B, S.streetPath(beat.spot, 'B'), 0, 'walk');
      S.director.phase = 'streetB';
    }
  } else if (S.director.phase === 'streetB') {
    if (B.phase !== 'walk') {
      S.director.bOut = true;
      B.pose = beat.pose || 'look';
      S.director.phase = 'outHold';
      S.director.hold = beat.hold;
    }
  } else if (S.director.phase === 'outHold') {
    if (B && B.rig.parent === S.scene) { S.lookAt(A, B, dt); S.lookAt(B, A, dt); }
    S.director.hold -= dt;
    if (S.director.hold <= 0) {
      if (B && S.director.bOut) {
        S.sendAlong(B, S.streetBack(beat.spot, 'B'), Math.PI, 'walk');
        S.director.phase = 'returnB';
      } else {
        S.sendAlong(A, S.streetBack(beat.spot, 'A'), Math.PI, 'walk');
        S.director.phase = 'returnDoor';
      }
    }
  } else if (S.director.phase === 'returnB') {
    if (B.phase !== 'walk') {
      lobby.g.attach(B.rig);
      B.rig.position.set(0, 0, 7.2); B.rig.rotation.y = Math.PI;
      S.sendTo(B, [-6.4, 5.55], 0, 'stand');
      S.director.phase = 'toLiftHomeB';
    }
  } else if (S.director.phase === 'toLiftHomeB') {
    if (B.phase !== 'walk') {
      S.lift.target = 1;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(1)) < 0.1;
      if (S.liftReady(1)) { S.sendAlong(B, S.boardPath(), 0, 'stand'); S.director.phase = 'reboardB'; }
    }
  } else if (S.director.phase === 'reboardB') {
    S.lift.target = 1; S.lift.wantOpen = true;
    if (B.phase !== 'walk' && S.liftReady(1)) {
      S.lift.cabin.attach(B.rig);
      B.rig.position.set(0, 0, -0.12); B.rig.rotation.y = Math.PI;
      B.phase = 'there'; B.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = B.lv;
      S.director.phase = 'rideHomeB';
    }
  } else if (S.director.phase === 'rideHomeB') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(B.lv)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      B.group.attach(B.rig);
      B.rig.position.set(-8.15, 0, 6.5); B.rig.rotation.y = Math.PI;
      S.lift.wantOpen = false;
      S.sendHome(B);
      S.director.bOut = false;
      S.sendAlong(A, S.streetBack(beat.spot, 'A'), Math.PI, 'walk');
      S.director.phase = 'returnDoor';
    }
  } else if (S.director.phase === 'returnDoor') {
    if (A.phase !== 'walk') {
      lobby.g.attach(A.rig);
      A.rig.position.set(0, 0, 7.2);
      A.rig.rotation.y = Math.PI;
      S.sendTo(A, [-6.4, 5.55], 0, 'stand');
      S.director.phase = 'toLiftHome';
    }
  } else if (S.director.phase === 'toLiftHome') {
    if (A.phase !== 'walk') {
      S.lift.target = 1;
      S.lift.wantOpen = Math.abs(S.lift.cabin.position.y - S.liftY(1)) < 0.1;
      if (S.liftReady(1)) { S.sendAlong(A, S.boardPath(), 0, 'stand'); S.director.phase = 'reboard'; }
    }
  } else if (S.director.phase === 'reboard') {
    S.lift.target = 1; S.lift.wantOpen = true;
    if (A.phase !== 'walk' && S.liftReady(1)) {
      S.lift.cabin.attach(A.rig);
      A.rig.position.set(0, 0, -0.12);
      A.rig.rotation.y = Math.PI;
      A.phase = 'there'; A.pose = 'stand';
      S.lift.wantOpen = false; S.lift.target = A.lv;
      S.director.phase = 'rideHome';
    }
  } else if (S.director.phase === 'rideHome') {
    const parked = Math.abs(S.lift.cabin.position.y - S.liftY(A.lv)) < 0.08;
    S.lift.wantOpen = parked;
    if (parked && S.lift.open > 0.9) {
      A.group.attach(A.rig);
      A.rig.position.set(-8.15, 0, 6.5);
      A.rig.rotation.y = Math.PI;
      S.lift.wantOpen = false;
      S.sendHome(A);
      S.director.phase = 'back';
    }
  } else if (S.director.phase === 'back') {
    if (A.phase !== 'walk' && (!B || B.phase !== 'walk')) { S.director.bOut = false; S.finishBeat(); }
  }
}


S.updateDirector = function updateDirector(dt) {
  if (S.director.phase === 'gap') {
    S.director.gap -= dt;
    if (S.director.gap > 0) return;
    const beat = S.BEATS[S.director.index % S.BEATS.length];
    const started = S.startBeat(beat);
    if (started === 'skip') { S.director.index++; S.director.gap = 0.2; return; }
    if (!started) { S.director.gap = 0.6; return; }
    S.director.index++;
    return;
  }
  if (!S.director.beat) { S.director.phase = 'gap'; S.director.gap = 2; return; }
  if (S.director.beat.kind === 'visit') S.updateVisit(dt);
  else if (S.director.beat.kind === 'errand') S.updateErrand(dt);
  else S.updatePair(dt);
}


S.poseName = function poseName(a) { return a.phase === 'walk' ? 'walk' : a.pose; }


S.pushTrace = function pushTrace(reason) {
  if (S.lifeTrace.length > 2400) return;
  S.lifeTrace.push({
    t: +S.director.t.toFixed(2), reason, phase: S.director.phase,
    beat: S.director.beat ? S.director.beat.kind + ':' + (S.director.beat.host || S.director.beat.a || '') : '',
    hold: S.director.beat ? +Math.max(0, S.director.hold).toFixed(2) : 0,
    lift: { lv: S.lift.lv, y: +S.lift.cabin.position.y.toFixed(2), open: +S.lift.open.toFixed(2), target: S.lift.target },
    people: S.cast.map(a => ({
      id: a.id, x: +a.rig.position.x.toFixed(2), z: +a.rig.position.z.toFixed(2),
      yaw: +a.rig.rotation.y.toFixed(2), pose: S.poseName(a), phase: a.phase,
      parent: a.rig.parent === S.lift.cabin ? 'cabin' : a.rig.parent === S.scene ? 'street' : 'floor', lv: S.hereLv(a),
    })),
  });
}


S.updateLife = function updateLife(dt, t) {
  S.director.t += dt;
  if (S.director.liftLock > 0) S.director.liftLock = Math.max(0, S.director.liftLock - dt);
  for (const a of S.cast) {
    if (a.phase === 'walk') {
      S.walkAgent(a, dt);
      S.poseAgent(a, 'walk', t);
    } else S.poseAgent(a, a.pose || 'type', t);
  }
  if (!S.director.paused) S.updateDirector(dt);
  if (S.director.phase !== S.tracePhase) { S.tracePhase = S.director.phase; S.pushTrace('phase'); S.traceAcc = 0; }
  else if (S.director.phase === 'hold' || S.director.phase === 'meet' || S.director.phase === 'ride' || S.director.phase === 'board') {
    S.traceAcc += dt;
    if (S.traceAcc >= 0.5) { S.traceAcc = 0; S.pushTrace('sample'); }
  }
}


S.updateLift = function updateLift(dt) {
  if (!S.lift.cabin) return;
  const destY = S.liftY(S.lift.target);
  const dy = destY - S.lift.cabin.position.y;
  if (Math.abs(dy) > 0.06) {
    if (S.lift.open > 0.04) S.lift.openTarget = 0;
    else S.lift.cabin.position.y += Math.sign(dy) * Math.min(Math.abs(dy), 2.5 * dt);
  } else {
    S.lift.cabin.position.y = destY;
    S.lift.lv = S.lift.target;
    S.lift.openTarget = S.lift.wantOpen ? 1 : 0;
  }
  S.lift.open += (S.lift.openTarget - S.lift.open) * Math.min(1, dt * 3.4);
  const shown = Math.min(6, Math.max(1, Math.round((S.lift.cabin.position.y - 0.2) / S.FH) + 1));
  S.setCabinFloor(shown);
  const parked = Math.abs(S.lift.cabin.position.y - S.liftY(shown)) < 0.25;
  for (const d of S.lift.doors) {
    const gap = d.lv === shown && parked ? S.lift.open : 0;
    d.left.position.x = d.cx - 0.46 - gap * 0.48;
    d.right.position.x = d.cx + 0.46 + gap * 0.48;
  }
}


S.stepLife = function stepLife(dt) {
  if (window.__HOLD_LIFE) return;
  const d = Math.max(0, Math.min(dt, 0.2));
  S.lifeT += d;
  S.updateLift(d);
  S.updateLife(d, S.lifeT);
}


S.lifeStatus = function lifeStatus() {
  const people = S.cast.map(a => ({
    id: a.id, x: +a.rig.position.x.toFixed(2), z: +a.rig.position.z.toFixed(2),
    y: +a.rig.position.y.toFixed(2), yaw: +a.rig.rotation.y.toFixed(2),
    pose: S.poseName(a), phase: a.phase,
    parent: a.rig.parent === S.lift.cabin ? 'cabin' : a.rig.parent === S.scene ? 'street' : 'floor', lv: S.hereLv(a),
  }));
  return {
    t: +S.director.t.toFixed(2), phase: S.director.phase,
    beat: S.director.beat ? S.director.beat.kind : '',
    who: S.director.beat ? (S.director.beat.who || S.director.beat.host || S.director.beat.a) : '',
    hold: S.director.beat ? +Math.max(0, S.director.hold).toFixed(2) : 0,
    lift: { lv: S.lift.lv, y: +S.lift.cabin.position.y.toFixed(2), open: +S.lift.open.toFixed(2), target: S.lift.target, want: S.lift.wantOpen },
    people,
  };
}



S.pick = function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }



S.findBone = function findBone(root, re) {
  let found = null;
  root.traverse(o => { if (!found && o.isBone && re.test(o.name)) found = o; });
  return found;
}



/** Mixamo armatures sit at ~0.01 world scale — wrap clothes so meter-sized meshes stay human-sized */
S.parentToBone = function parentToBone(bone, mesh) {
  const pivot = new S.THREE.Group();
  pivot.scale.setScalar(100);
  bone.add(pivot);
  pivot.add(mesh);
  return pivot;
}



/** Procedural fabric / leather albedo (no external assets) */
S.makeFabricMap = function makeFabricMap(hex, kind = 'fabric') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 64, 64);
  if (kind === 'fabric') {
    for (let i = 0; i < 64; i += 2) {
      x.fillStyle = `rgba(255,255,255,${0.03 + (i % 4) * 0.01})`;
      x.fillRect(0, i, 64, 1);
      x.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.01})`;
      x.fillRect(i, 0, 1, 64);
    }
  } else if (kind === 'leather') {
    for (let i = 0; i < 180; i++) {
      const px = Math.random() * 64, py = Math.random() * 64;
      x.fillStyle = `rgba(${r + 30},${g + 20},${b + 15},${0.08 + Math.random() * 0.12})`;
      x.fillRect(px, py, 2 + Math.random() * 3, 1);
    }
  } else if (kind === 'tech') {
    x.strokeStyle = 'rgba(0,240,255,0.12)'; x.lineWidth = 1;
    for (let i = 8; i < 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); }
    for (let i = 8; i < 64; i += 8) { x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
  }
  const t = new S.THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = S.THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = S.THREE.SRGBColorSpace;
  return t;
}



S.clothMat = function clothMat(hex, { kind = 'fabric', metal = 0.08, rough = 0.78, side = S.THREE.DoubleSide } = {}) {
  return new S.THREE.MeshStandardMaterial({
    color: 0xffffff, map: S.makeFabricMap(hex, kind),
    metalness: metal, roughness: rough, side,
  });
}



S.ledMat = function ledMat(hex, intensity = 0.4) {
  return new S.THREE.MeshStandardMaterial({
    color: hex, emissive: new S.THREE.Color(hex), emissiveIntensity: intensity,
    metalness: 0.35, roughness: 0.35, toneMapped: false
  });
}



S.paletteFor = function paletteFor(archetype, accent) {
  const skins = S.SKIN_TONES;
  if (archetype === 'corpo') {
    return { skin: S.pick(skins), coat: S.pick([0x1a1e28, 0x12151c, 0x0e1218, 0x222630]), pants: S.pick([0x10141a, 0x0c0e14]),
      under: S.pick([0x1a2030, 0xe8e8f0, 0x2a3040]), shoes: 0x0a0a0c, hair: S.pick(S.HAIR_COLS), accent,
      kindCoat: 'fabric', kindPants: 'fabric', metalCoat: 0.12, roughCoat: 0.55 };
  }
  if (archetype === 'punk') {
    return { skin: S.pick(skins), coat: S.pick([0x2a1020, 0x1a0810, 0x301828, 0x101018]), pants: S.pick([0x1a1018, 0x0a0a0c]),
      under: S.pick([0xff2a6d, 0xfcee0a, 0x00f0ff, 0x2a2030]), shoes: 0x1a0a10, hair: S.pick([0x1a1210, 0xff2a6d, 0x00f0ff, 0xfcee0a]),
      accent, kindCoat: 'leather', kindPants: 'fabric', metalCoat: 0.22, roughCoat: 0.45 };
  }
  if (archetype === 'techwear') {
    return { skin: S.pick(skins), coat: S.pick([0x1a2030, 0x141c28, 0x0e1820, 0x222838]), pants: S.pick([0x121820, 0x0e141c]),
      under: S.pick([0x101418, 0x1a2030]), shoes: 0x0a0c10, hair: S.pick(S.HAIR_COLS), accent,
      kindCoat: 'tech', kindPants: 'tech', metalCoat: 0.35, roughCoat: 0.5 };
  }
  if (archetype === 'bomber') {
    return { skin: S.pick(skins), coat: S.pick([0x1c2430, 0x2a1820, 0x203028, 0x241828]), pants: S.pick([0x1a2030, 0x12161e]),
      under: S.pick([0x2a3040, 0x1a1520]), shoes: 0x0a0a0c, hair: S.pick(S.HAIR_COLS), accent,
      kindCoat: 'leather', kindPants: 'fabric', metalCoat: 0.25, roughCoat: 0.48 };
  }
  if (archetype === 'nomad') {
    return { skin: S.pick(skins), coat: S.pick([0x2a2218, 0x1a1810, 0x302818, 0x221c14]), pants: S.pick([0x1a1810, 0x14120e]),
      under: S.pick([0x3a3020, 0x2a2418]), shoes: 0x1a1008, hair: S.pick(S.HAIR_COLS), accent,
      kindCoat: 'leather', kindPants: 'fabric', metalCoat: 0.18, roughCoat: 0.62 };
  }
  // trench default
  return { skin: S.pick(skins), coat: S.pick([0x1a1520, 0x141018, 0x201828, 0x12141c, 0x1c2030]), pants: S.pick([0x10141a, 0x0e1016]),
    under: S.pick([0x1a2030, 0x2a1520]), shoes: 0x08080a, hair: S.pick(S.HAIR_COLS), accent,
    kindCoat: 'fabric', kindPants: 'fabric', metalCoat: 0.1, roughCoat: 0.72 };
}



/** Body: skin head/hands + dark undershirt — fashion comes from attached clothes */
S.dressBodyMesh = function dressBodyMesh(mesh, palette) {
  const srcMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const next = srcMats.map((mat) => {
    const m = mat.clone();
    m.color = new S.THREE.Color(0xffffff);
    m.metalness = 0.08; m.roughness = 0.72;
    if (m.map && !m.map.image) m.map = null;
    if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
    const key = 'bodyUnder_v12_' + palette.under.toString(16) + '_' + palette.skin.toString(16) + (m.map ? 't' : 'f');
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uSkin = { value: new S.THREE.Color(palette.skin) };
      shader.uniforms.uUnder = { value: new S.THREE.Color(palette.under) };
      shader.uniforms.uHair = { value: new S.THREE.Color(palette.hair) };
      shader.uniforms.uShoes = { value: new S.THREE.Color(palette.shoes) };
      shader.uniforms.uHasMap = { value: m.map ? 1 : 0 };
      shader.vertexShader = 'varying float vClothY;\n' + shader.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvClothY = position.y;');
      shader.fragmentShader = `
        uniform vec3 uSkin; uniform vec3 uUnder; uniform vec3 uHair; uniform vec3 uShoes;
        uniform float uHasMap; varying float vClothY;
      ` + shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float y = vClothY;
        vec3 band = uShoes;
        if (y > 0.08) band = uUnder;   // undershirt / base layer (hidden under jacket)
        if (y > 1.40) band = uSkin;    // neck + face
        if (y > 1.58) band = uHair;
        // hands roughly mid-height extremities — keep under tint; face wins above 1.4
        if (uHasMap > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb * band, band, 0.5);
        else diffuseColor.rgb = band;
        `
      );
    };
    m.customProgramCacheKey = () => key;
    m.needsUpdate = true;
    return m;
  });
  mesh.material = Array.isArray(mesh.material) ? next : next[0];
}



S.addFlaredHem = function addFlaredHem(parent, mat, { y = -0.55, rTop = 0.28, rBot = 0.48, h = 0.55, segs = 16 } = {}) {
  // Open-front trench skirt: half-ish cylinder with flare (sways with hips)
  const geo = new S.THREE.CylinderGeometry(rTop, rBot, h, segs, 1, true, 0.15, Math.PI * 1.85);
  const hem = new S.THREE.Mesh(geo, mat);
  hem.position.set(0, y, 0.02);
  S.parentToBone(parent, hem);
  return hem;
}



S.attachOutfit = function attachOutfit(root, palette, opts = {}) {
  const arch = opts.archetype || S.pick(S.OUTFIT_ARCHETYPES);
  palette.archetype = arch;
  const spine = S.findBone(root, /Spine2$/) || S.findBone(root, /Spine1$/) || S.findBone(root, /Spine$/);
  const spine1 = S.findBone(root, /Spine1$/) || spine;
  const hips = S.findBone(root, /Hips$/);
  const head = S.findBone(root, /Head$/);
  const neck = S.findBone(root, /Neck$/);
  const armL = S.findBone(root, /LeftArm$/);
  const armR = S.findBone(root, /RightArm$/);
  const foreL = S.findBone(root, /LeftForeArm$/);
  const foreR = S.findBone(root, /RightForeArm$/);
  const upL = S.findBone(root, /LeftUpLeg$/);
  const upR = S.findBone(root, /RightUpLeg$/);
  const legL = S.findBone(root, /LeftLeg$/);
  const legR = S.findBone(root, /RightLeg$/);

  const coatM = S.clothMat(palette.coat, { kind: palette.kindCoat, metal: palette.metalCoat, rough: palette.roughCoat });
  const pantM = S.clothMat(palette.pants, { kind: palette.kindPants, metal: 0.1, rough: 0.8 });
  const underM = S.clothMat(palette.under, { kind: 'fabric', metal: 0.05, rough: 0.85 });
  const leatherM = S.clothMat(palette.coat, { kind: 'leather', metal: 0.28, rough: 0.42 });
  const led = S.ledMat(palette.accent, opts.hero ? 0.55 : 0.32);
  const strapM = new S.THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.4, roughness: 0.5 });

  // --- layered undershirt on spine (always) ---
  if (spine) {
    const shirt = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.20, 0.22, 0.48, 12, 1, true), underM);
    shirt.position.set(0, -0.02, 0.02); S.parentToBone(spine, shirt);
  }

  // --- archetype outerwear ---
  if (spine) {
    if (arch === 'trench' || arch === 'nomad') {
      // Upper coat body (spine) — structured shoulders
      const torso = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.24, 0.27, 0.55, 16, 1, true, 0.25, Math.PI * 1.7), coatM);
      torso.position.set(0, 0.02, 0.03); S.parentToBone(spine, torso);
      // Collar
      const collar = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.15, 0.035, 6, 14, Math.PI * 1.2), coatM);
      collar.rotation.set(0.9, 0, 0); collar.position.set(0, 0.28, 0.06); S.parentToBone(spine, collar);
      // Lapels
      const lapL = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.35, 0.02), coatM);
      lapL.position.set(-0.12, 0.12, 0.2); lapL.rotation.z = 0.25; S.parentToBone(spine, lapL);
      const lapR = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.35, 0.02), coatM);
      lapR.position.set(0.12, 0.12, 0.2); lapR.rotation.z = -0.25; S.parentToBone(spine, lapR);
      // Subtle LED trim on lapel
      if (arch === 'trench' || opts.hero) {
        const trim = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.02, 0.4, 0.015), led);
        trim.position.set(0.14, 0.08, 0.22); S.parentToBone(spine, trim);
      }
      // Shoulder pads
      for (const [sx, bone] of [[-1, armL], [1, armR]]) {
        if (!bone) continue;
        const pad = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), coatM);
        pad.scale.set(1.2, 0.7, 1); pad.position.set(sx * 0.02, 0.06, 0); S.parentToBone(bone, pad);
      }
      // Flared hem on HIPS — sways with walk
      if (hips) {
        S.addFlaredHem(hips, coatM, { y: -0.38, rTop: 0.26, rBot: arch === 'nomad' ? 0.42 : 0.38, h: arch === 'nomad' ? 0.72 : 0.62 });
        // second layer for thickness
        S.addFlaredHem(hips, coatM, { y: -0.28, rTop: 0.24, rBot: 0.32, h: 0.32, segs: 12 });
      }
    } else if (arch === 'bomber') {
      // Cropped bomber
      const body = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.30, 0.34, 0.48, 16, 1, true), leatherM);
      body.position.set(0, 0.05, 0.02); S.parentToBone(spine, body);
      // Ribbed hem
      const rib = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.27, 0.04, 6, 16), S.clothMat(palette.under, { kind: 'fabric', rough: 0.9 }));
      rib.rotation.x = Math.PI / 2; rib.position.set(0, -0.16, 0.02); S.parentToBone(spine, rib);
      // Collar stand
      const col = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.16, 0.18, 0.12, 12, 1, true), leatherM);
      col.position.set(0, 0.28, 0.02); S.parentToBone(spine, col);
      // Zip LED
      const zip = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.025, 0.38, 0.02), led);
      zip.position.set(0, 0.05, 0.27); S.parentToBone(spine, zip);
      if (opts.hood || Math.random() < 0.5) {
        const host = head || neck;
        if (host) {
          const hood = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.72), leatherM);
          hood.position.set(0, 0.05, -0.04); S.parentToBone(host, hood);
        }
      }
    } else if (arch === 'techwear') {
      const shell = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.28, 0.32, 0.55, 14, 1, true), coatM);
      shell.position.set(0, 0.02, 0.02); S.parentToBone(spine, shell);
      // High collar
      const hc = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.14, 0.16, 0.18, 12, 1, true), coatM);
      hc.position.set(0, 0.32, 0.02); S.parentToBone(spine, hc);
      // Harness straps
      const h1 = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.06, 0.45, 0.03), strapM);
      h1.position.set(-0.12, 0.0, 0.2); S.parentToBone(spine, h1);
      const h2 = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.06, 0.45, 0.03), strapM);
      h2.position.set(0.12, 0.0, 0.2); S.parentToBone(spine, h2);
      const cross = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.32, 0.05, 0.03), strapM);
      cross.position.set(0, -0.05, 0.22); S.parentToBone(spine, cross);
      // LED chest panel
      const panel = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.14, 0.1, 0.02), led);
      panel.position.set(0, 0.12, 0.24); S.parentToBone(spine, panel);
      // Utility pouches
      const pouch = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.12, 0.08), leatherM);
      pouch.position.set(0.22, -0.1, 0.1); S.parentToBone(spine, pouch);
    } else if (arch === 'corpo') {
      // Sharp blazer
      const blazer = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.27, 0.31, 0.55, 14, 1, true, 0.25, Math.PI * 1.75), coatM);
      blazer.position.set(0, 0.02, 0.02); S.parentToBone(spine, blazer);
      // Peak shoulders
      for (const [sx, bone] of [[-1, armL], [1, armR]]) {
        if (!bone) continue;
        const pad = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, 0.08, 0.14), coatM);
        pad.position.set(sx * 0.02, 0.08, 0); S.parentToBone(bone, pad);
      }
      // Tie / accent strip
      const tie = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.04, 0.28, 0.02), led);
      tie.position.set(0, 0.05, 0.22); S.parentToBone(spine, tie);
      // Shirt collar V
      const v1 = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.08, 0.12, 0.02), underM);
      v1.position.set(-0.06, 0.22, 0.18); v1.rotation.z = 0.4; S.parentToBone(spine, v1);
      const v2 = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.08, 0.12, 0.02), underM);
      v2.position.set(0.06, 0.22, 0.18); v2.rotation.z = -0.4; S.parentToBone(spine, v2);
    } else if (arch === 'punk') {
      // Asymmetric vest / cropped jacket
      const vest = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.27, 0.30, 0.42, 14, 1, true, 0.15, Math.PI * 1.8), leatherM);
      vest.position.set(0, 0.06, 0.02); S.parentToBone(spine, vest);
      // One-shoulder pad
      if (armL) {
        const pad = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.1, 8, 6), leatherM);
        pad.scale.set(1.3, 0.8, 1.1); pad.position.set(0, 0.05, 0); S.parentToBone(armL, pad);
      }
      // Spiky-ish collar (boxes)
      for (let i = 0; i < 4; i++) {
        const sp = new S.THREE.Mesh(new S.THREE.ConeGeometry(0.03, 0.1, 4), strapM);
        sp.position.set(-0.1 + i * 0.07, 0.28, 0.12); sp.rotation.x = -0.8; S.parentToBone(spine, sp);
      }
      const stripe = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.35, 0.06, 0.02), led);
      stripe.position.set(0.05, 0.1, 0.24); S.parentToBone(spine, stripe);
    }
  }

  // --- sleeves (all archetypes) — Mixamo arm bone +Y points to elbow ---
  for (const [arm, fore] of [[armL, foreL], [armR, foreR]]) {
    if (!arm) continue;
    const len = (arch === 'bomber' || arch === 'punk') ? 0.32 : 0.38;
    const sleeve = new S.THREE.Mesh(
      new S.THREE.CylinderGeometry(0.09, 0.08, len, 10, 1, true),
      arch === 'bomber' || arch === 'punk' ? leatherM : coatM
    );
    sleeve.position.set(0, -len * 0.45, 0);
    S.parentToBone(arm, sleeve);
    if (fore && (arch === 'trench' || arch === 'corpo' || arch === 'techwear' || arch === 'nomad')) {
      const cuff = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.075, 0.07, 0.26, 8, 1, true), coatM);
      cuff.position.set(0, -0.12, 0);
      S.parentToBone(fore, cuff);
    }
  }

  // --- cargo / tailored pants ---
  for (const [up, lo] of [[upL, legL], [upR, legR]]) {
    if (!up) continue;
    const thigh = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.12, 0.11, 0.45, 10, 1, true), pantM);
    thigh.position.set(0, -0.2, 0); S.parentToBone(up, thigh);
    if (arch === 'techwear' || arch === 'punk' || arch === 'nomad') {
      // cargo pocket
      const pocket = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.12, 0.06), leatherM);
      pocket.position.set(0.08, -0.15, 0.05); S.parentToBone(up, pocket);
    }
    if (lo) {
      const calf = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.09, 0.08, 0.4, 8, 1, true), pantM);
      calf.position.set(0, -0.18, 0); S.parentToBone(lo, calf);
    }
  }

  // --- belt / harness on hips ---
  if (hips) {
    const belt = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.18, 0.025, 6, 18), arch === 'corpo' ? strapM : leatherM);
    belt.rotation.x = Math.PI / 2; belt.position.y = 0.02; S.parentToBone(hips, belt);
    if (arch === 'techwear' || arch === 'punk') {
      const buckle = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.08, 0.05, 0.04), led);
      buckle.position.set(0, 0.02, 0.18); S.parentToBone(hips, buckle);
    }
  }

  // --- headwear / hair ---
  if (head) {
    if (opts.hood && arch !== 'corpo') {
      const hood = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.7), coatM);
      hood.position.set(0, 0.06, -0.03); S.parentToBone(head, hood);
    } else {
      const hair = new S.THREE.Mesh(
        new S.THREE.SphereGeometry(arch === 'punk' ? 0.13 : 0.11, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new S.THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.9, metalness: 0.05 })
      );
      hair.position.set(0, 0.09, 0); S.parentToBone(head, hair);
      if (arch === 'punk' || opts.longHair) {
        const tail = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.035, 0.22, 3, 6),
          new S.THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.9 }));
        tail.position.set(0, 0.0, -0.1); tail.rotation.x = 0.5; S.parentToBone(head, tail);
      }
    }
    if (opts.visor || arch === 'techwear') {
      const vis = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.22, 0.05, 0.08), led);
      vis.position.set(0, 0.04, 0.1); S.parentToBone(head, vis);
    }
    if (opts.cyber || opts.hero || arch === 'techwear') {
      const eye = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.022, 6, 6), led);
      eye.position.set(0.05, 0.02, 0.1); S.parentToBone(head, eye);
    }
  }

  // --- bags / sling ---
  if (spine && (opts.pack || arch === 'techwear' || arch === 'nomad' || Math.random() < 0.35)) {
    if (arch === 'corpo' || Math.random() < 0.4) {
      // sling bag
      const bag = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.18, 0.22, 0.1), leatherM);
      bag.position.set(0.28, -0.15, 0.05); S.parentToBone(spine, bag);
      const strap = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.04, 0.5, 0.02), strapM);
      strap.position.set(0.1, 0.05, -0.05); strap.rotation.z = -0.6; S.parentToBone(spine, strap);
    } else {
      const pack = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.3, 0.38, 0.16), leatherM);
      pack.position.set(0, -0.05, -0.24); S.parentToBone(spine, pack);
      const bar = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.28, 0.03, 0.02), led);
      bar.position.set(0, 0.1, -0.33); S.parentToBone(spine, bar);
    }
  }

  if (opts.phone && spine) {
    const phone = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.07, 0.12, 0.02), led);
    phone.position.set(0.25, -0.12, 0.28); S.parentToBone(spine, phone);
  }
  if (opts.guitar && spine) {
    const bodyG = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.32, 0.4, 0.09), led);
    bodyG.position.set(0.38, -0.2, 0.12); S.parentToBone(spine, bodyG);
  }
  if (opts.hero && spine) {
    const rim = new S.THREE.PointLight(palette.accent, 3.8, 4.5, 2);
    rim.position.set(0.4, 0.15, 0.5); S.parentToBone(spine, rim);
  }
  root.userData.archetype = arch;
}



S.cyberpunkHuman = function cyberpunkHuman(root, accent, opts = {}) {
  const archetype = opts.archetype || S.pick(S.OUTFIT_ARCHETYPES);
  const palette = S.paletteFor(archetype, accent || S.pick(S.accentCols));
  root.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    const oname = (obj.name || '').toLowerCase();
    if (/joint|helper|skeleton/.test(oname)) { obj.visible = false; return; }
    S.dressBodyMesh(obj, palette);
  });
  S.attachOutfit(root, palette, { ...opts, archetype });
  root.userData.palette = palette;
  return palette;
}



S.cpPalette = function cpPalette(arch, accent) {
  // Darker street skins so bloom doesn't wash faces white
  const skin = S.pick([0xc68642, 0xd4a574, 0x8d5524, 0xb07a4a, 0x6b3f24]);
  if (arch === 'corpo') {
    return {
      skin,
      coat: S.pick([0x080a10, 0x0c1018, 0x10141c, 0x0a0e16]),
      pants: S.pick([0x080a10, 0x0c1018]),
      under: S.pick([0x0a0e16, 0x121820, 0x0e1420]), // no white shirts
      hair: S.pick([0x0a0808, 0x1a1210, 0x00f0ff]),
      boots: 0x050508,
      accent: accent || S.pick([0x00f0ff, 0xfcee0a]),
      leather: 0.7, chrome: 0.85,
    };
  }
  if (arch === 'nomad') {
    return {
      skin,
      coat: S.pick([0x14100c, 0x1a1410, 0x100e0a, 0x18140e]),
      pants: S.pick([0x100e0a, 0x14120e]),
      under: S.pick([0x1a1410, 0x12100c]),
      hair: S.pick([0x1a1210, 0x0a0808, 0xfcee0a]),
      boots: 0x0a0806,
      accent: accent || S.pick([0xfcee0a, 0xff2a6d]),
      leather: 0.75, chrome: 0.55,
    };
  }
  if (arch === 'netrunner') {
    return {
      skin,
      coat: S.pick([0x080c14, 0x0a1018, 0x0e0a16]),
      pants: S.pick([0x080c14, 0x0a1018]),
      under: S.pick([0x0a1018, 0x0c1420]), // cyan only as accent, not whole torso
      hair: S.pick([0x00f0ff, 0xff2a6d, 0x7fe3ff]),
      boots: 0x05060a,
      accent: accent || S.pick([0x00f0ff, 0xff2a6d]),
      leather: 0.55, chrome: 0.8,
    };
  }
  // street_punk — black leather + neon hair/accents only
  return {
    skin,
    coat: S.pick([0x06080c, 0x0a0a10, 0x100810, 0x08060a]),
    pants: S.pick([0x06080c, 0x0a0a10, 0x0c1018]),
    under: S.pick([0x0a0a10, 0x101018, 0x0c0810]),
    hair: S.pick([0xff2a6d, 0xfcee0a, 0x00f0ff, 0x39ff14]),
    boots: 0x050508,
    accent: accent || S.pick([0xff2a6d, 0xfcee0a, 0x00f0ff]),
    leather: 0.75, chrome: 0.7,
  };
}



/** Attach mesh to bone in world-metre size (Quaternius armatures are ~100× / cm) */
S.attachProp = function attachProp(bone, mesh, root = null) {
  if (!bone) return null;
  const pivot = new S.THREE.Group();
  bone.add(pivot);
  // Prefer explicit root scale: bone.matrixWorld can ignore root.scale before scene add
  let rootScale = 1;
  if (root && root.scale) rootScale = root.scale.x || 1;
  else {
    let r = bone; while (r.parent) r = r.parent;
    rootScale = r.scale?.x || 1;
  }
  const comp = Math.max(100 * rootScale, 1e-4);
  pivot.scale.setScalar(1 / comp);
  pivot.add(mesh);
  return pivot;
}



S.chromeMat = function chromeMat(hex = 0xc8d0e0) {
  return new S.THREE.MeshStandardMaterial({ color: hex, metalness: 0.92, roughness: 0.22 });
}


S.glowMat = function glowMat(hex, intensity = 0.55) {
  return new S.THREE.MeshStandardMaterial({
    color: hex, emissive: new S.THREE.Color(hex), emissiveIntensity: intensity,
    metalness: 0.35, roughness: 0.4, toneMapped: false
  });
}


S.leatherMat = function leatherMat(hex) {
  return new S.THREE.MeshStandardMaterial({ color: hex, metalness: 0.35, roughness: 0.48 });
}



/** Segmented chrome/gunmetal cyber arm (metres); parented under forearm via attachProp */
S.buildCyberArm = function buildCyberArm(accentHex = 0x00f0ff) {
  const g = new S.THREE.Group();
  const chrome = new S.THREE.MeshStandardMaterial({
    color: 0xc8d2e0, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.6
  });
  const gun = new S.THREE.MeshStandardMaterial({
    color: 0x3a4450, metalness: 0.88, roughness: 0.28, envMapIntensity: 1.3
  });
  const seam = S.glowMat(accentHex, 1.05);
  // upper arm plate (near elbow) — cylinder along -Y toward hand
  const upper = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.048, 0.055, 0.14, 10), chrome);
  upper.position.y = 0.02; g.add(upper);
  // elbow joint
  const elbow = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.055, 10, 8), gun);
  elbow.position.y = 0.1; g.add(elbow);
  // forearm plates (two half-shells)
  const foreA = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.042, 0.038, 0.2, 10, 1, false), chrome);
  foreA.position.y = -0.12; g.add(foreA);
  const plate = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.07, 0.16, 0.02), gun);
  plate.position.set(0.04, -0.12, 0); g.add(plate);
  // thin emissive seam lines
  const seamL = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.006, 0.3, 0.006), seam);
  seamL.position.set(0.052, -0.05, 0); g.add(seamL);
  const seamR = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.006, 0.22, 0.006), seam);
  seamR.position.set(-0.04, -0.08, 0.03); g.add(seamR);
  // wrist ring
  const wrist = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.036, 0.008, 6, 14), chrome);
  wrist.rotation.x = Math.PI / 2; wrist.position.y = -0.23; g.add(wrist);
  const wristLed = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.036, 0.004, 6, 14), seam);
  wristLed.rotation.x = Math.PI / 2; wristLed.position.y = -0.23; g.add(wristLed);
  // hand: palm + fingers
  const palm = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.055, 0.05, 0.028), chrome);
  palm.position.y = -0.29; g.add(palm);
  for (let i = 0; i < 5; i++) {
    const fx = (i - 2) * 0.012;
    const len = i === 0 ? 0.035 : 0.045; // thumb shorter
    const finger = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.005, len, 3, 6), gun);
    finger.position.set(fx, -0.33 - len * 0.35, i === 0 ? 0.012 : 0.005);
    if (i === 0) finger.rotation.z = 0.6;
    g.add(finger);
  }
  // knuckle LED
  const knuck = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.05, 0.005, 0.006), seam);
  knuck.position.set(0, -0.305, 0.016); g.add(knuck);
  return g;
}



/** CP2077-inspired cyberware + hair/mask — original, no CDPR IP */
S.attachCyberware = function attachCyberware(root, palette, opts = {}) {
  const _R = root;
  const arch = palette.arch || 'street_punk';
  const accent = palette.accent;
  const head = S.findBone(root, /Head$/);
  const neck = S.findBone(root, /Neck$/);
  const spine = S.findBone(root, /Spine2$/) || S.findBone(root, /Spine1$/) || S.findBone(root, /Spine$/)
    || S.findBone(root, /Chest$/) || S.findBone(root, /Torso$/);
  // Quaternius: LowerArmR/L ; Mixamo: RightForeArm
  const foreR = S.findBone(root, /RightForeArm$|LowerArmR$|ForeArmR$/i);
  const foreL = S.findBone(root, /LeftForeArm$|LowerArmL$|ForeArmL$/i);
  const armR = S.findBone(root, /RightArm$|UpperArmR$/i);
  const wristR = S.findBone(root, /WristR$|RightHand$/i);

  // Cyber-eye / thin optic strip (bright, slim — reads under bloom)
  if (head && (opts.cyber !== false)) {
    const eye = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.022, 8, 8), S.glowMat(accent, 0.9));
    eye.position.set(0.048, 0.032, 0.095);
    S.attachProp(head, eye, _R);
    const strip = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.16, 0.008, 0.01), S.glowMat(accent, 1.05));
    strip.position.set(0.01, 0.052, 0.105);
    S.attachProp(head, strip, _R);
  }
  // Visor / shades — thin bright bar
  if (head && (opts.visor || arch === 'corpo' || arch === 'netrunner' || opts.hero || Math.random() < 0.55)) {
    const vis = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.22, 0.028, 0.05), S.glowMat(accent, arch === 'corpo' ? 0.75 : 1.05));
    vis.position.set(0, 0.038, 0.11);
    S.attachProp(head, vis, _R);
  }
  // Chrome jaw / face plate + thin emissive seam
  if (head && (opts.faceplate || arch === 'nomad' || opts.hero || Math.random() < 0.4)) {
    const jaw = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.13, 0.055, 0.055), S.chromeMat(0xd8dde8));
    jaw.position.set(0, -0.025, 0.085);
    S.attachProp(head, jaw, _R);
    const jawLed = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.11, 0.006, 0.01), S.glowMat(accent, 0.95));
    jawLed.position.set(0, -0.01, 0.115);
    S.attachProp(head, jawLed, _R);
  }
  // Neck / temple implant lines — thin + bright
  if (neck && (opts.hero || Math.random() < 0.7)) {
    const line = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.007, 0.1, 0.007), S.glowMat(accent, 1.15));
    line.position.set(0.065, 0.02, 0.04);
    S.attachProp(neck, line, _R);
  }
  if (head && (opts.hero || Math.random() < 0.55)) {
    const temple = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.05, 0.007, 0.007), S.glowMat(accent, 0.95));
    temple.position.set(0.085, 0.042, 0.025);
    S.attachProp(head, temple, _R);
  }
  // Respirator mask
  if (head && (opts.mask || (arch === 'nomad' && Math.random() < 0.4) || Math.random() < 0.15)) {
    const mask = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.14, 0.08, 0.07), S.chromeMat(0x2a3038));
    mask.position.set(0, -0.01, 0.11);
    S.attachProp(head, mask, _R);
    const vent = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.025, 0.03, 0.04, 8), S.glowMat(accent, 0.35));
    vent.rotation.x = Math.PI / 2; vent.position.set(0, -0.02, 0.15);
    S.attachProp(head, vent, _R);
  }
  // Mohawk — neon emissive (punk / netrunner)
  if (head && (arch === 'street_punk' || arch === 'netrunner') && (opts.hero || Math.random() < 0.65)) {
    const neon = (palette.hair === 0x1a1210 || palette.hair === 0x0a0808) ? accent : palette.hair;
    const mohawk = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.03, 0.14, 0.13), S.glowMat(neon, 1.15));
    mohawk.position.set(0, 0.16, 0);
    S.attachProp(head, mohawk, _R);
  }
  // LED jacket seams + collar on spine
  if (spine) {
    const seam = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.025, 0.4, 0.018), S.glowMat(accent, 0.5));
    seam.position.set(0.12, 0.05, 0.14);
    S.attachProp(spine, seam, _R);
    if (Math.random() < 0.6 || opts.hero) {
      const collar = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.1, 0.012, 6, 14, Math.PI * 1.2), S.glowMat(accent, 0.35));
      collar.rotation.set(1.0, 0, 0); collar.position.set(0, 0.22, 0.05);
      S.attachProp(spine, collar, _R);
    }
    // leather shoulder pad vibe
    if (arch === 'street_punk' || arch === 'nomad') {
      const pad = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.07, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), S.leatherMat(palette.coat));
      pad.scale.set(1.3, 0.7, 1); pad.position.set(-0.14, 0.18, 0.02);
      S.attachProp(spine, pad, _R);
    }
  }
  // Segmented chrome cyber-arm (heroes + rare street) — not a flat box
  if (opts.mantis || opts.hero || Math.random() < 0.1) {
    const fore = foreR || foreL;
    if (fore) {
      const arm = S.buildCyberArm(accent);
      arm.userData.cyberArm = true;
      arm.position.set(0, -0.02, 0);
      S.attachProp(fore, arm, _R);
      root.userData.hasCyberArm = true;
    }
  }
  // Holo wrist — small, coloured (not a white face blast)
  if ((opts.phone || opts.holoWrist || Math.random() < 0.3) && (foreL || foreR || armR)) {
    const host = foreL || foreR || armR;
    const wrist = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.05, 0.035, 0.07), S.glowMat(accent, 1.1));
    wrist.position.set(0, -0.18, 0.05);
    S.attachProp(host, wrist, _R);
    if (opts.phone && head) {
      const faceGlow = new S.THREE.PointLight(accent, 0.55, 0.35, 2);
      faceGlow.position.set(0.04, 0.02, 0.12);
      S.attachProp(head, faceGlow, _R);
    }
  }
}



S.styleQuaternius = function styleQuaternius(root, accent, opts = {}) {
  const arch = opts.archetype || S.pick(S.CP_ARCHETYPES);
  const palette = S.cpPalette(arch, accent);
  palette.arch = arch;
  root.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map(mat => {
      const m = mat.clone();
      const n = ((m.name || obj.name || '') + '').toLowerCase();
      if (m.map && !m.map.image) m.map = null;
      if (/skin|face|hand|arm_skin|body_skin|skin_/.test(n) && !/shirt|undershirt/.test(n)) {
        m.color = new S.THREE.Color(palette.skin);
        if (m.map) m.color.multiply(new S.THREE.Color(0xffc8a0));
        m.metalness = 0.05; m.roughness = 0.65;
        if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      } else if (/hair|eyebrow/.test(n)) {
        m.color = new S.THREE.Color(palette.hair); m.roughness = 0.85; m.metalness = 0.08;
        // neon hair emissive for punk/netrunner
        if (arch === 'street_punk' || arch === 'netrunner') {
          if (m.emissive) { m.emissive.setHex(palette.hair); m.emissiveIntensity = 0.25; }
        } else if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      } else if (/eye|pupil/.test(n)) {
        m.color = new S.THREE.Color(0x102030);
        if (m.emissive) { m.emissive.setHex(palette.accent); m.emissiveIntensity = 0.35; }
      } else if (/pant|leg|trouser|short/.test(n)) {
        m.color = new S.THREE.Color(palette.pants);
        if (m.map) m.color.multiplyScalar(0.5);
        m.metalness = 0.15; m.roughness = 0.75;
        if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      } else if (/boot|shoe|sock|sneaker/.test(n)) {
        m.color = new S.THREE.Color(palette.boots); m.metalness = 0.4; m.roughness = 0.45;
        if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      } else if (/dress/.test(n)) {
        // no white/pastel dresses — black or magenta-black leather
        m.color = new S.THREE.Color(arch === 'street_punk' ? 0x1a0812 : palette.coat);
        m.metalness = 0.65; m.roughness = 0.4;
        if (m.emissive) { m.emissive.setHex(palette.accent); m.emissiveIntensity = 0.08; }
      } else if (/shirt|undershirt|top|tee/.test(n)) {
        m.color = new S.THREE.Color(palette.under);
        if (m.map) m.color.multiplyScalar(0.35);
        m.metalness = 0.2; m.roughness = 0.65;
        if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      } else if (/metal|detail|gold|weapon|gun|chrome/.test(n)) {
        m.color = new S.THREE.Color(0xc8d0dc); m.metalness = Math.max(palette.chrome, 0.9); m.roughness = 0.18;
        if (m.emissive) { m.emissive.setHex(palette.accent); m.emissiveIntensity = 0.22; }
      } else if (/orange|yellow|red|blue|cyan|green|pink|purple|white|lightblue|lightbrown|brown|grey|gray/.test(n)) {
        const on = (obj.name || '').toLowerCase();
        const isLeg = /leg|pant|feet|boot|shoe/.test(on);
        const isHead = /head|hair|hat/.test(on);
        if (isHead) {
          m.color = new S.THREE.Color(palette.hair);
          if ((arch === 'street_punk' || arch === 'netrunner') && m.emissive) {
            m.emissive.setHex(palette.hair); m.emissiveIntensity = 0.55;
          } else if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
        } else if (isLeg) {
          m.color = new S.THREE.Color(palette.pants); m.metalness = 0.25; m.roughness = 0.7;
          if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
        } else if (/white|light|yellow|orange|pink|cyan|blue|green/.test(n)) {
          // was pastel panel → dark leather + tiny accent emissive (not whole bright torso)
          m.color = new S.THREE.Color(palette.coat);
          m.metalness = 0.6; m.roughness = 0.4;
          if (m.emissive) { m.emissive.setHex(palette.accent); m.emissiveIntensity = 0.1; }
        } else {
          m.color = new S.THREE.Color(palette.coat);
          m.metalness = 0.55; m.roughness = 0.42;
          if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
        }
      } else {
        // outerwear → black/charcoal/navy leather — no cloth emissive wash
        m.color = new S.THREE.Color(palette.coat);
        if (m.map) m.color.multiplyScalar(0.25);
        m.metalness = Math.max(palette.leather, 0.65); m.roughness = 0.36;
        if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 0; }
      }
      m.needsUpdate = true;
      return m;
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
    obj.castShadow = false; obj.frustumCulled = true;
  });
  // Magenta + cyan neon rims only (no white fill → no washed pastels / floor pools)
  if (opts.hero || opts.rim !== false) {
    const rimM = new S.THREE.PointLight(0xff2a6d, opts.hero ? 1.35 : 0.95, 2.4, 2);
    rimM.position.set(0.55, 1.55, 0.15); root.add(rimM);
    const rimC = new S.THREE.PointLight(0x00f0ff, opts.hero ? 1.2 : 0.85, 2.4, 2);
    rimC.position.set(-0.55, 1.5, 0.1); root.add(rimC);
  }
  S.attachCyberware(root, palette, opts);
  root.userData.palette = palette;
  root.userData.archetype = arch;
  return palette;
}



/** Variant B + shared: detailed procedural civilian */
S.makeHumanoid = function makeHumanoid(color, accent, opts = {}) {
  const g = new S.THREE.Group();
  const scale = opts.scale || (0.92 + Math.random() * 0.22);
  const build = opts.build || 1;
  const hips = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.15 * build, 0.12, 4, 8), S.M(0x141820));
  hips.position.y = 0.92; g.add(hips);
  const torso = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.19 * build, 0.38, 4, 10), S.M(color, { metalness: 0.35, roughness: 0.4 }));
  torso.position.y = 1.3; g.add(torso);
  // neon jacket / coat trim
  const trim = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.21 * build, 0.022, 6, 16), S.E(accent, 2.4));
  trim.rotation.x = Math.PI / 2; trim.position.y = 1.48; g.add(trim);
  if (opts.coat) {
    const coat = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.28 * build, 0.32 * build, 0.85, 10, 1, true),
      new S.THREE.MeshStandardMaterial({ color, side: S.THREE.DoubleSide, metalness: 0.25, roughness: 0.5, transparent: true, opacity: 0.85 }));
    coat.position.y = 1.15; g.add(coat);
    S.box(0.04, 0.7, 0.02, S.E(accent, 2), 0.12 * build, 1.2, 0.28 * build, g);
  }
  const neck = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.05, 0.06, 3, 6), S.M(0xe8b896)); neck.position.y = 1.64; g.add(neck);
  const head = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.125 * (opts.hero ? 1.05 : 1), 14, 12), S.M(0xe8b896));
  head.position.y = 1.8; g.add(head);
  // hairstyles / hood / visor
  if (opts.hood) {
    const hood = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.155, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.72), S.M(color, { metalness: 0.2 }));
    hood.position.y = 1.84; g.add(hood);
  } else if (opts.visor) {
    const vis = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.22, 0.06, 0.08), S.E(accent, 2.8));
    vis.position.set(0, 1.82, 0.1); g.add(vis);
    const hair = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), S.M(0x1a1210));
    hair.position.y = 1.88; g.add(hair);
  } else if (opts.longHair) {
    const hair = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.14, 10, 8), S.M(0x2a1810)); hair.position.y = 1.86; g.add(hair);
    const ponytail = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.04, 0.25, 3, 6), S.M(0x2a1810));
    ponytail.position.set(0, 1.7, -0.12); ponytail.rotation.x = 0.4; g.add(ponytail);
  } else {
    const hair = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), S.M(0x1a1210));
    hair.position.y = 1.88; g.add(hair);
  }
  if (opts.cyber) {
    const eye = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.028, 6, 6), S.E(accent, 3.5));
    eye.position.set(0.05, 1.82, 0.11); g.add(eye);
  }
  const armL = new S.THREE.Group(); armL.position.set(-0.26 * build, 1.45, 0); g.add(armL);
  { const u = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.048, 0.22, 3, 6), S.M(color)); u.position.set(0, -0.14, 0); armL.add(u);
    const l = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.042, 0.2, 3, 6), S.M(color)); l.position.set(0, -0.38, 0); armL.add(l);
    const h = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.042, 6, 6), S.M(0xe8b896)); h.position.set(0, -0.52, 0); armL.add(h); }
  const armR = new S.THREE.Group(); armR.position.set(0.26 * build, 1.45, 0); g.add(armR);
  { const u = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.048, 0.22, 3, 6), S.M(opts.cyberArm ? 0x1a2030 : color)); u.position.set(0, -0.14, 0); armR.add(u);
    const l = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.042, 0.2, 3, 6), opts.cyberArm ? S.E(accent, 1.8) : S.M(color)); l.position.set(0, -0.38, 0); armR.add(l);
    const h = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.042, 6, 6), S.M(0xe8b896)); h.position.set(0, -0.52, 0); armR.add(h); }
  const legL = new S.THREE.Group(); legL.position.set(-0.1 * build, 0.92, 0); g.add(legL);
  { const u = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.055, 0.28, 3, 6), S.M(0x12161e)); u.position.set(0, -0.22, 0); legL.add(u);
    const l = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.05, 0.26, 3, 6), S.M(0x12161e)); l.position.set(0, -0.52, 0); legL.add(l);
    const f = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.05, 0.16), S.M(0x0a0c10)); f.position.set(0, -0.7, 0.04); legL.add(f); }
  const legR = new S.THREE.Group(); legR.position.set(0.1 * build, 0.92, 0); g.add(legR);
  { const u = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.055, 0.28, 3, 6), S.M(0x12161e)); u.position.set(0, -0.22, 0); legR.add(u);
    const l = new S.THREE.Mesh(new S.THREE.CapsuleGeometry(0.05, 0.26, 3, 6), S.M(0x12161e)); l.position.set(0, -0.52, 0); legR.add(l);
    const f = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.1, 0.05, 0.16), S.M(0x0a0c10)); f.position.set(0, -0.7, 0.04); legR.add(f); }
  if (opts.pack) {
    const pack = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.28, 0.35, 0.14), S.M(0x101418, { metalness: 0.5 }));
    pack.position.set(0, 1.3, -0.2); g.add(pack);
    S.box(0.3, 0.04, 0.02, S.E(accent, 2), 0, 1.4, -0.28, g);
  }
  if (opts.phone) {
    const phone = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.08, 0.14, 0.02), S.E(accent, 2.8));
    phone.position.set(0.12, 1.2, 0.28); g.add(phone);
    armR.rotation.x = -1.15; armR.rotation.z = -0.25;
  }
  if (opts.guitar) {
    const bodyG = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.35, 0.45, 0.1), S.E(accent, 1.2));
    bodyG.position.set(0.35, 1.1, 0.15); g.add(bodyG);
    const neckG = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.06, 0.55, 0.06), S.M(0x2a1a10));
    neckG.position.set(0.35, 1.55, 0.15); g.add(neckG);
  }
  if (opts.hero) {
    // rim light so foreground heroes read
    const rim = new S.THREE.PointLight(accent, 6, 5, 2); rim.position.set(0.4, 1.5, 0.8); g.add(rim);
    S.box(0.5, 0.03, 0.03, S.E(accent, 3), 0, 1.55, 0.22 * build, g);
  }
  g.scale.setScalar(scale);
  g.userData.armL = armL; g.userData.armR = armR; g.userData.legL = legL; g.userData.legR = legR;
  g.userData.head = head; g.userData.mode = opts.mode || 'walk';
  return g;
}



S.placePed = function placePed(g, x, z, rotY, mode, speed, x0, x1) {
  g.position.set(x, 0, z); g.rotation.y = rotY;
  g.traverse(o => {
    if (o.isLight) o.layers.set(S.LAYER_ACTOR);
    else if (o.isMesh) o.layers.enable(S.LAYER_ACTOR);
  });
  S.scene.add(g);
  S.pedestrians.push({ g, z, x0, x1, speed: mode === 'walk' ? speed : 0, ph: Math.random() * 10, mode });
}



/** Shared street story — clear of tower (|x|>=16 near crosswalk) */
S.addStreetStory = function addStreetStory(makeFn) {
  // chatting groups (corpo / punk mix)
  [[-18, 29, 0.4], [-17.2, 29.4, -0.8], [18, 30, -2.2], [18.8, 29.6, 1.0]].forEach(([x, z, ry], i) => {
    const g = makeFn({
      mode: 'stand', scale: 1.05, phone: i === 1, holoWrist: i === 1,
      archetype: i % 2 === 0 ? 'corpo' : 'street_punk', cyber: true,
    });
    S.placePed(g, x, z, ry, 'stand', 0, x - 1, x + 1);
  });
  // phone walkers — holo glow on face
  [[-22, 35, 1], [22, 36, -1]].forEach(([x, z, dir]) => {
    const g = makeFn({ phone: true, holoWrist: true, cyber: true, mode: 'phone', scale: 1.0, archetype: 'netrunner' });
    S.placePed(g, x, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'phone', 0, -28, 28);
  });
  // leaner by vending machine (right sidewalk)
  {
    const g = makeFn({ mode: 'stand', scale: 1.08, archetype: 'street_punk', cyber: true, mask: true });
    S.placePed(g, 16.5, 26.5, -0.4, 'stand', 0, 16, 17);
  }
  // street performer with glowing guitar + holo
  {
    const g = makeFn({ guitar: true, longHair: true, mode: 'stand', scale: 1.1, accentForce: 0xfcee0a, archetype: 'street_punk' });
    S.placePed(g, -20, 26.5, 0.3, 'stand', 0, -21, -19);
    S.glow(S.GLOW.yel, -20, 1.4, 26.5, 3, 3, 0.35);
    const holo = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.6, 0.6, 0.05, 16), S.E(0x00f0ff, 1.5));
    holo.position.set(-20, 0.05, 25.5); S.scene.add(holo);
  }
  // generic patrol (no real branding) — corpo visor
  {
    const g = makeFn({ visor: true, mode: 'walk', scale: 1.08, archetype: 'corpo', cyber: true });
    S.placePed(g, 20, 32, -Math.PI / 2, 'walk', -1.2, 16, 24);
  }
  // delivery drone
  {
    const drone = new S.THREE.Group();
    S.box(0.7, 0.25, 0.5, S.M(0x1a2030, { metalness: 0.8 }), 0, 0, 0, drone);
    S.box(0.9, 0.06, 0.15, S.E(0x00f0ff, 2), 0, 0.2, 0, drone);
    for (const dx of [-0.4, 0.4]) {
      const rotor = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.25, 0.25, 0.04, 12), S.E(0x7fe3ff, 1.2));
      rotor.position.set(dx, 0.28, 0); drone.add(rotor);
    }
    drone.position.set(17, 2.2, 28); S.scene.add(drone);
    window.__drone = drone;
  }
  // small sidewalk bot
  {
    const bot = new S.THREE.Group();
    S.box(0.5, 0.35, 0.6, S.M(0x222838, { metalness: 0.7 }), 0, 0.3, 0, bot);
    S.box(0.35, 0.2, 0.15, S.E(0xff2a6d, 1.5), 0, 0.55, 0.2, bot);
    bot.position.set(-16, 0, 33); S.scene.add(bot);
    window.__sidewalkBot = bot;
  }
}



S.addStreetPropsB = function addStreetPropsB() {
  // noodle / food stall
  const stall = new S.THREE.Group();
  S.box(2.4, 0.1, 1.4, S.M(0x1a1520), 0, 1.05, 0, stall);
  S.box(0.1, 1.0, 1.3, S.M(0x2a2030), -1.1, 0.55, 0, stall);
  S.box(0.1, 1.0, 1.3, S.M(0x2a2030), 1.1, 0.55, 0, stall);
  S.box(2.5, 0.08, 1.5, S.M(0x101018, { metalness: 0.5 }), 0, 1.9, 0, stall);
  // lantern / neon
  S.box(2.2, 0.35, 0.08, S.E(0xff2a6d, 2.2), 0, 2.15, 0.7, stall);
  const lantern = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.18, 10, 8), S.E(0xfcee0a, 2.5));
  lantern.position.set(0.7, 1.55, 0.5); stall.add(lantern);
  // steam
  const sg = new S.THREE.BufferGeometry(); const sa = [];
  for (let i = 0; i < 40; i++) sa.push((Math.random() - 0.5) * 0.6, Math.random() * 1.2, (Math.random() - 0.5) * 0.4);
  sg.setAttribute('position', new S.THREE.Float32BufferAttribute(sa, 3));
  const steam = new S.THREE.Points(sg, new S.THREE.PointsMaterial({ color: 0x7fe3ff, size: 0.06, transparent: true, opacity: 0.28, depthWrite: false, sizeAttenuation: true }));
  steam.position.set(-0.3, 1.15, 0.3); stall.add(steam); window.__stallSteam = steam;
  stall.position.set(-17, 0, 26.5); S.scene.add(stall);
  S.glow(S.GLOW.mag, -17, 2.1, 27, 4, 2, 0.35);
  // vending machine
  const vend = new S.THREE.Group();
  S.box(1.0, 2.0, 0.7, S.M(0x1a2030, { metalness: 0.6 }), 0, 1.0, 0, vend);
  S.box(0.75, 1.2, 0.05, S.E(0x00f0ff, 1.4), 0, 1.2, 0.36, vend);
  S.box(0.5, 0.15, 0.05, S.E(0xff2a6d, 2), 0, 1.85, 0.37, vend);
  vend.position.set(17.5, 0, 26.8); S.scene.add(vend);
  S.glow(S.GLOW.cyan, 17.5, 1.3, 27.2, 2.5, 3, 0.3);
  // street sign
  S.box(0.1, 3.2, 0.1, S.M(0x333848), 15.5, 1.6, 26.2);
  S.box(1.6, 0.9, 0.08, S.E(0xfcee0a, 1.8), 15.5, 3.0, 26.2);
}



S.spawnBackgroundCrowd = function spawnBackgroundCrowd(makeFn, count = 36) {
  const sidewalks = [
    { z: 36, x0: -28, x1: 28, dir: 1 },
    { z: 42, x0: 28, x1: -28, dir: -1 },
    { z: 50, x0: -24, x1: 24, dir: 1 },
    { z: 58, x0: 22, x1: -22, dir: -1 },
  ];
  let n = 0;
  for (const sw of sidewalks) {
    for (let i = 0; i < 9 && n < count; i++, n++) {
      const mode = n % 6 === 0 ? 'stand' : (n % 4 === 0 ? 'phone' : 'walk');
      const archs = ['street_punk', 'corpo', 'nomad', 'netrunner'];
      const g = makeFn({
        cyber: true, visor: n % 5 === 0, phone: mode === 'phone', holoWrist: mode === 'phone',
        mantis: n % 11 === 0, mask: n % 9 === 0,
        feminine: n % 2 === 0,
        mode, scale: 0.98 + (n % 4) * 0.04,
        archetype: archs[n % archs.length],
      });
      const t0 = (i + 0.4) / 9;
      const x = sw.x0 + (sw.x1 - sw.x0) * t0;
      // keep clear of tower column near center sidewalks
      if (Math.abs(x) < 14 && sw.z < 38) continue;
      S.placePed(g, x, sw.z + (Math.random() - 0.5), sw.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        mode, (1.2 + Math.random() * 1.2) * sw.dir, Math.min(sw.x0, sw.x1), Math.max(sw.x0, sw.x1));
    }
  }
}



S.spawnHeroPedestrians = function spawnHeroPedestrians(makeFn) {
  // 2–3 detailed figures near crosswalk foreground — sides only so tower stays clear
  const heroes = [
    { x: -15, z: 27.5, rot: 0.5, opts: { hero: true, archetype: 'street_punk', cyber: true, mantis: true, mode: 'walk', scale: 1.15 } },
    { x: 15.5, z: 28.2, rot: -0.6, opts: { hero: true, archetype: 'corpo', visor: true, mantis: true, mode: 'walk', scale: 1.12 } },
    { x: -14, z: 31, rot: Math.PI / 2, opts: { hero: true, archetype: 'netrunner', cyber: true, phone: true, holoWrist: true, mode: 'phone', scale: 1.1 } },
  ];
  heroes.forEach((h, i) => {
    const g = makeFn(h.opts);
    const dir = i === 1 ? -1 : 1;
    S.placePed(g, h.x, h.z, h.rot, h.opts.mode, h.opts.mode === 'walk' ? 1.0 * dir : 0, h.x - 4, h.x + 4);
  });
}



S.makeFnProcedural = function makeFnProcedural(extra = {}) {
  return (opts) => {
    const o = { ...opts, ...extra };
    const accent = o.accentForce || S.accentCols[(Math.random() * S.accentCols.length) | 0];
    const col = S.pedColors[(Math.random() * S.pedColors.length) | 0];
    return S.makeHumanoid(col, accent, o);
  };
}


S.proofClip = function proofClip(agent, clips) {
  if (agent.phase === 'walk' && clips.walk) return 'walk';
  const pose = agent.pose;
  if (pose === 'type' && clips.type) return 'type';
  if ((pose === 'type' || pose === 'sit' || pose === 'play') && clips.sit) return 'sit';
  if ((pose === 'talk' || pose === 'look') && clips.talk) return 'talk';
  return clips.idle || null;
}


S.playProof = function playProof(entry, name) {
  if (window.__FREEZE_PROOF) return;
  if (!name || !entry.clips[name] || entry.current === name) return;
  const next = entry.clips[name];
  next.reset().fadeIn(0.22).play();
  if (entry.current && entry.clips[entry.current]) entry.clips[entry.current].fadeOut(0.22);
  entry.current = name;
}


S.attachProof = function attachProof(id, url) {
  const agent = S.castById[id];
  if (!agent) return;
  S.gltfLoader.load(url, (gltf) => {
    const model = gltf.scene;
    model.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.frustumCulled = false;
      o.layers.enable(S.LAYER_ROOM);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        if (!m) return;
        m.metalness = 0.02;
        if (id === 'mandy') m.roughness = 0.55;
        else if (m.roughness == null || m.roughness > 0.85) m.roughness = 0.62;
        if (m.map) m.map.colorSpace = S.THREE.SRGBColorSpace;
      });
    });
    agent.rig.traverse(o => { if (o.isMesh) o.visible = false; });
    const mixer = new S.THREE.AnimationMixer(model);
    const clips = {};
    const alias = { Idle: 'idle', Walk: 'walk', Sit: 'sit' };
    gltf.animations.forEach(clip => {
      clips[alias[clip.name] || clip.name] = mixer.clipAction(clip);
    });
    S.proofHumans.push({ id, agent, model, mixer, clips, current: '' });
    console.info('[proof]', id, Object.keys(clips));
  }, undefined, err => console.error('[proof]', id, err));
}


S.mandySoleY = function mandySoleY(model) {
  // Same skinning path as __meshBounds, which matches the picture.
  // Toe bones sit above the heel once the foot flexes, so the mesh is the contact.
  model.updateWorldMatrix(true, true);
  model.getWorldPosition(S._soleOrigin);
  let min = Infinity;
  model.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const pos = o.geometry.attributes.position;
    const si = o.geometry.attributes.skinIndex;
    const sw = o.geometry.attributes.skinWeight;
    if (!pos || !si || !sw) return;
    o.skeleton.update();
    const bones = o.skeleton.boneMatrices;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.18) continue;
      S._soleV.fromBufferAttribute(pos, i).applyMatrix4(o.bindMatrix);
      S._soleAcc.set(0, 0, 0);
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        if (w <= 0) continue;
        S._soleM.fromArray(bones, si.getComponent(i, k) * 16);
        S._soleP.copy(S._soleV).applyMatrix4(S._soleM).multiplyScalar(w);
        S._soleAcc.add(S._soleP);
      }
      S._soleAcc.applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld);
      if (S._soleAcc.y < min) min = S._soleAcc.y;
    }
  });
  if (!Number.isFinite(min)) return null;
  return min - S._soleOrigin.y;
}


S.flattenMandyFeet = function flattenMandyFeet(model) {
  // The sit clip points the toes down. Level each foot so the sole sits on the slab.
  for (const [footName, toeName] of [['mixamorigLeftFoot', 'mixamorigLeftToeBase'], ['mixamorigRightFoot', 'mixamorigRightToeBase']]) {
    const foot = model.getObjectByName(footName);
    const toe = model.getObjectByName(toeName);
    if (!foot || !toe || !foot.parent) continue;
    foot.getWorldPosition(S._flatA);
    toe.getWorldPosition(S._flatB);
    S._flatB.sub(S._flatA);
    const horiz = Math.hypot(S._flatB.x, S._flatB.z);
    if (horiz < 1e-4) continue;
    const pitch = Math.atan2(S._flatB.y, horiz);
    if (Math.abs(pitch) < 0.02) continue;
    S._flatA.set(-S._flatB.z, 0, S._flatB.x).normalize();
    S._flatQ.setFromAxisAngle(S._flatA, -pitch);
    foot.getWorldQuaternion(S._flatP);
    S._flatP.premultiply(S._flatQ);
    foot.parent.getWorldQuaternion(S._flatQ);
    foot.quaternion.copy(S._flatQ.invert()).multiply(S._flatP);
    foot.updateMatrixWorld(true);
  }
}


S.syncProof = function syncProof(dt) {
  S.proofHumans.forEach(entry => {
    const rig = entry.agent.rig;
    if (entry.model.parent !== rig.parent) rig.parent.add(entry.model);
    entry.model.rotation.set(0, rig.rotation.y, 0);
    S.playProof(entry, S.proofClip(entry.agent, entry.clips));
    if (entry._footClip !== entry.current) {
      entry._footClip = entry.current;
      entry.footY = null;
    }
    entry.mixer.update(dt);
    let y = 0;
    const pose = entry.agent.pose;
    const inCabin = rig.parent === S.lift.cabin;
    const outside = rig.parent === S.scene;
    if ((entry.id === 'mandy' || entry.id === 'hailey') && pose === 'sit' && !inCabin) S.flattenMandyFeet(entry.model);
    if (entry.id === 'mandy' || entry.id === 'hailey' || entry.id === 'penny') {
      let sole = entry.id === 'penny' ? S.pennySoleY(entry.model) : S.mandySoleY(entry.model);
      // A bad skin sample (seen once inside the lift) would throw her a metre up.
      const soleBad = entry.id === 'penny'
        ? (!Number.isFinite(sole) || sole < -2.2 || sole > 2.2)
        : (!Number.isFinite(sole) || sole < -0.2 || sole > 0.2);
      if (soleBad) sole = entry._soleOk != null ? entry._soleOk : -0.004;
      else entry._soleOk = sole;
      if (Number.isFinite(sole)) {
        const surface = outside ? 0.02 : (inCabin ? S.MANDY_CABIN_FLOOR : S.MANDY_FLOOR);
        const need = surface - sole;
        const prev = entry.footY;
        entry.footY = prev == null ? need : Math.max(need, prev + (need - prev) * 0.45);
        y = entry.footY;
      }
      if (entry.id === 'mandy') window.__mandyFoot = { y: +y.toFixed(4), sole: Number.isFinite(sole) ? +sole.toFixed(4) : null, cabin: inCabin };
      else if (entry.id === 'penny') window.__pennyFoot = { y: +y.toFixed(4), sole: Number.isFinite(sole) ? +sole.toFixed(4) : null, cabin: inCabin, clip: entry.current };
      else if (entry.id === 'hailey') window.__haileyFoot = { y: +y.toFixed(4), sole: Number.isFinite(sole) ? +sole.toFixed(4) : null, cabin: inCabin, clip: entry.current };
    } else if (entry.id === 'andrew' && (pose === 'sit' || pose === 'play') && !inCabin) {
      // Lounge seats were raised to Mandy's seated pelvis. His own desk stays at y = 0.
      y = S.ANDREW_LOUNGE_Y;
    }
    entry.model.position.set(rig.position.x, y, rig.position.z);
    if (entry.id === 'hailey') {
      entry.model.getWorldPosition(S._soleOrigin);
      window.__haileyWorld = [S._soleOrigin.x, S._soleOrigin.y, S._soleOrigin.z, entry.current || ''];
    }
  });
}


S.pennySoleY = function pennySoleY(model) {
  // The skinned-vertex sample used for Mandy reads this mesh's indices wrong
  // and reports a shin as the sole, which plants her knees on the slab.
  // The ankle joint sits about 10 cm above the boot sole in the bind pose.
  model.updateWorldMatrix(true, true);
  model.getWorldPosition(S._soleOrigin);
  let min = Infinity;
  for (const name of ['Left_ankle_023', 'Right_ankle_023', 'Left_toe_024', 'Right_toe_047']) {
    const bone = model.getObjectByName(name);
    if (!bone) continue;
    const y = bone.getWorldPosition(S._soleV).y - S._soleOrigin.y;
    if (y < min) min = y;
  }
  if (!Number.isFinite(min)) return null;
  return min - 0.10;
}


S._worldQ = function _worldQ(o, out) {
  o.updateWorldMatrix(true, false);
  o.matrixWorld.decompose(S._rtV, out, S._rtS);
  return out;
}


S.setWorldQuat = function setWorldQuat(bone, worldQ) {
  const parent = bone.parent;
  if (parent) S._worldQ(parent, S._rtParent);
  else S._rtParent.identity();
  bone.quaternion.copy(S._rtParent.clone().invert()).multiply(worldQ);
  bone.updateMatrixWorld(true);
}


S.aimBoneTo = function aimBoneTo(bone, restW, restDir, desired) {
  if (!restDir) return;
  S._rtDelta.setFromUnitVectors(restDir, S._aimD.copy(desired).normalize());
  S.setWorldQuat(bone, S._rtDelta.clone().multiply(restW));
}


S.hangDir = function hangDir(side, deg, z) {
  const out = side * Math.sin(S.THREE.MathUtils.degToRad(deg));
  const zz = z || 0;
  const yy = -Math.sqrt(Math.max(0.04, 1 - out * out - zz * zz));
  return S._aimD.set(out, yy, zz);
}


// Left is +X on this rig. Shoulders stay near the bind so the jacket
// does not shrug into a hump, then the arms are aimed to hang.
S.refinePennyPose = function refinePennyPose(outName, byUal, clothRoots) {
  for (const ual of ['DEF-neck', 'DEF-head']) {
    const p = byUal[ual];
    if (!p) continue;
    p.target.quaternion.copy(p.restLocal);
    p.target.updateMatrixWorld(true);
  }
  const chest = byUal['DEF-spine.003'];
  if (chest) {
    chest.target.quaternion.slerp(chest.restLocal, outName === 'walk' ? 0.72 : 0.45);
    chest.target.updateMatrixWorld(true);
  }
  for (const ual of ['DEF-shoulder.L', 'DEF-shoulder.R']) {
    const p = byUal[ual];
    if (!p) continue;
    p.target.quaternion.slerp(p.restLocal, 0.7);
    p.target.updateMatrixWorld(true);
  }
  const swingOf = (ual) => {
    const p = byUal[ual];
    if (!p || !p.curSrcDir || outName !== 'walk') return 0;
    return S.THREE.MathUtils.clamp(p.curSrcDir.z, -0.5, 0.5) * 0.5;
  };
  for (const [ual, side, foreUal] of [['DEF-upper_arm.L', 1, 'DEF-forearm.L'], ['DEF-upper_arm.R', -1, 'DEF-forearm.R']]) {
    const arm = byUal[ual];
    const fore = byUal[foreUal];
    if (!arm || !arm.restChildDir) continue;
    const z = swingOf(ual);
    S.aimBoneTo(arm.target, arm.restW, arm.restChildDir, S.hangDir(side, outName === 'walk' ? 12 : 10, z));
    if (fore && fore.restChildDir) {
      S.aimBoneTo(fore.target, fore.restW, fore.restChildDir, S.hangDir(side, 6, z * 0.35));
      const handU = foreUal === 'DEF-forearm.L' ? 'DEF-hand.L' : 'DEF-hand.R';
      const hand = byUal[handU];
      if (hand) S.setWorldQuat(hand.target, S._worldQ(fore.target, new S.THREE.Quaternion()));
    }
    const cur = arm.childTarget
      ? arm.childTarget.getWorldPosition(S._aimA).sub(arm.target.getWorldPosition(S._aimB)).normalize()
      : null;
    if (!cur) continue;
    S._rtDelta.setFromUnitVectors(arm.restChildDir, cur);
    for (const c of clothRoots) {
      if (c.side !== side) continue;
      S.setWorldQuat(c.target, S._rtDelta.clone().multiply(c.restW));
    }
  }
  if (outName === 'sit') {
    const legs = [['DEF-shin.L', 'DEF-foot.L'], ['DEF-shin.R', 'DEF-foot.R']];
    const ys = legs.map(([shin]) => byUal[shin].childTarget.getWorldPosition(S._aimA).y);
    const targetY = Math.min(ys[0], ys[1]);
    for (const [shinU] of legs) {
      const shin = byUal[shinU];
      if (!shin || !shin.restChildDir || !shin.childLen) continue;
      const kp = shin.target.getWorldPosition(new S.THREE.Vector3());
      const ap = shin.childTarget.getWorldPosition(new S.THREE.Vector3());
      const dir = new S.THREE.Vector3(ap.x - kp.x, targetY - kp.y, ap.z - kp.z);
      const reach = dir.length();
      if (reach > shin.childLen * 0.98) {
        const h = Math.sqrt(Math.max(0.01, shin.childLen * shin.childLen - 0.04 * 0.04));
        dir.set((ap.x - kp.x) * 0.35, -h, (ap.z - kp.z) * 0.35);
      }
      S.aimBoneTo(shin.target, shin.restW, shin.restChildDir, dir);
    }
  }
}


S.retargetPennyClip = function retargetPennyClip(sourceRoot, clip, outName, pairs, byUal, clothRoots) {
  const fps = 30;
  const frames = Math.max(2, Math.round(clip.duration * fps));
  const times = new Float32Array(frames + 1);
  pairs.forEach(p => { p.quats = new Float32Array((frames + 1) * 4); p.prev = null; });
  clothRoots.forEach(c => { c.quats = new Float32Array((frames + 1) * 4); c.prev = null; });
  const hip = byUal['DEF-hips'];
  hip.pos = new Float32Array((frames + 1) * 3);
  const mixer = new S.THREE.AnimationMixer(sourceRoot);
  const action = mixer.clipAction(clip);
  action.setLoop(S.THREE.LoopRepeat, Infinity);
  action.play();
  const srcPos = new S.THREE.Vector3();
  const childPos = new S.THREE.Vector3();
  const world = new S.THREE.Vector3();
  for (let i = 0; i <= frames; i++) {
    const time = Math.min(clip.duration, (i / fps));
    times[i] = time;
    mixer.setTime(time === 0 ? 1e-4 : time);
    sourceRoot.updateMatrixWorld(true);
    for (const p of pairs) {
      p.srcW = S._worldQ(p.source, new S.THREE.Quaternion());
      p.srcPos = p.source.getWorldPosition(new S.THREE.Vector3());
      p.target.quaternion.copy(p.restLocal);
      p.target.position.copy(p.restPos);
    }
    clothRoots.forEach(c => {
      c.target.quaternion.copy(c.restLocal);
      c.target.position.copy(c.restPos);
    });
    for (const p of pairs) {
      const child = byUal[S.UAL_CHILD[p.ual]];
      if (child) p.curSrcDir = child.srcPos.clone().sub(p.srcPos);
      else p.curSrcDir = null;
      if (p.curSrcDir && p.curSrcDir.lengthSq() > 1e-8) p.curSrcDir.normalize();
    }
    let root = pairs[0].target;
    while (root.parent) root = root.parent;
    root.updateMatrixWorld(true);
    for (const p of pairs) {
      const childName = S.UAL_CHILD[p.ual];
      const child = childName ? byUal[childName] : null;
      let tgtW;
      if (child && p.restSrcDir) {
        srcPos.copy(p.srcPos);
        childPos.copy(child.srcPos);
        const cur = childPos.sub(srcPos);
        if (cur.lengthSq() > 1e-8) {
          cur.normalize();
          S._rtDelta.setFromUnitVectors(p.restSrcDir, cur);
          tgtW = S._rtDelta.clone().multiply(p.restW);
        } else tgtW = p.restW.clone();
      } else if (p.ual === 'DEF-head') {
        tgtW = p.srcW.clone().multiply(S._rtQ.copy(p.srcRest).invert()).multiply(p.restW);
      } else {
        // Hands and toes keep the bind local, so they follow the limb
        // instead of taking on the source rig's wrist axes.
        tgtW = null;
      }
      if (tgtW) {
        const parent = p.target.parent;
        if (parent) S._worldQ(parent, S._rtParent);
        else S._rtParent.identity();
        p.target.quaternion.copy(S._rtParent.invert()).multiply(tgtW);
      }
      p.target.updateMatrixWorld(true);
    }
    const dy = (hip.srcPos.y - hip.srcRestPos.y) * hip.yScale;
    const parent = hip.target.parent;
    parent.updateWorldMatrix(true, false);
    world.copy(hip.target.getWorldPosition(S._rtV));
    world.y += dy;
    parent.worldToLocal(world);
    hip.target.position.copy(world);
    hip.target.updateMatrixWorld(true);
    S.refinePennyPose(outName, byUal, clothRoots);
    for (const p of pairs) {
      const q = p.target.quaternion;
      if (p.prev && p.prev.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      p.prev = q.clone();
      q.toArray(p.quats, i * 4);
    }
    hip.target.position.toArray(hip.pos, i * 3);
    for (const c of clothRoots) {
      const q = c.target.quaternion;
      if (c.prev && c.prev.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      c.prev = q.clone();
      q.toArray(c.quats, i * 4);
    }
  }
  action.stop();
  mixer.stopAllAction();
  for (const p of pairs) {
    p.target.quaternion.copy(p.restLocal);
    p.target.position.copy(p.restPos);
  }
  clothRoots.forEach(c => {
    c.target.quaternion.copy(c.restLocal);
    c.target.position.copy(c.restPos);
  });
  const tracks = [];
  for (const p of pairs) {
    tracks.push(new S.THREE.QuaternionKeyframeTrack(p.target.name + '.quaternion', times, p.quats));
    if (p === hip) tracks.push(new S.THREE.VectorKeyframeTrack(p.target.name + '.position', times, p.pos));
    p.quats = null;
    p.pos = null;
    p.prev = null;
  }
  for (const c of clothRoots) {
    tracks.push(new S.THREE.QuaternionKeyframeTrack(c.target.name + '.quaternion', times, c.quats));
    c.quats = null;
    c.prev = null;
  }
  return new S.THREE.AnimationClip(outName, clip.duration, tracks);
}


S.attachPenny = function attachPenny() {
  const agent = S.castById.penny;
  if (!agent) return;
  const loadGltf = (url) => new Promise((resolve, reject) => S.gltfLoader.load(url, resolve, undefined, reject));
  Promise.all([
    fetch('assets/characters/bone-map-mixamo.json').then(r => r.json()),
    loadGltf('assets/characters/penny.glb'),
    loadGltf('assets/characters/quaternius/AnimationLibrary_Godot_Standard.gltf'),
  ]).then(([map, pennyGltf, srcGltf]) => {
    const model = pennyGltf.scene;
    const source = srcGltf.scene;
    model.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.frustumCulled = false;
      o.layers.enable(S.LAYER_ROOM);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        if (!m) return;
        if (m.map) m.map.colorSpace = S.THREE.SRGBColorSpace;
        const label = (m.name || '') + ' ' + (o.name || '');
        if (/hair|bangs/i.test(label)) {
          if (m.color) m.color.multiplyScalar(0.58);
          m.roughness = Math.max(m.roughness || 0, 0.62);
          if (m.sheen != null) m.sheen *= 0.4;
          m.envMapIntensity = 0.3;
          m.side = S.THREE.DoubleSide;
        }
      });
    });
    const sane = S.THREE.PropertyBinding.sanitizeNodeName;
    const pairs = [];
    Object.entries(S.UAL_TO_MIXAMO).forEach(([ual, mix]) => {
      const lucy = map[mix];
      if (!lucy) return;
      const target = model.getObjectByName(sane(lucy));
      const srcBone = source.getObjectByName(sane(ual));
      if (!target || !srcBone || !target.isBone || !srcBone.isBone) {
        console.info('[penny] skip', ual, !!target, !!srcBone);
        return;
      }
      pairs.push({ ual, target, source: srcBone });
    });
    pairs.sort((a, b) => {
      const depth = (bone) => { let d = 0; for (let p = bone.parent; p; p = p.parent) d++; return d; };
      return depth(a.target) - depth(b.target);
    });
    const byUal = {};
    pairs.forEach(p => { byUal[p.ual] = p; });
    model.updateMatrixWorld(true);
    source.updateMatrixWorld(true);
    pairs.forEach(p => {
      p.restLocal = p.target.quaternion.clone();
      p.restPos = p.target.position.clone();
      p.restW = S._worldQ(p.target, new S.THREE.Quaternion());
      const child = byUal[S.UAL_CHILD[p.ual]];
      p.childTarget = child ? child.target : null;
      if (p.childTarget) {
        const d = p.childTarget.getWorldPosition(new S.THREE.Vector3()).sub(p.target.getWorldPosition(new S.THREE.Vector3()));
        p.childLen = d.length();
        p.restChildDir = p.childLen > 1e-6 ? d.multiplyScalar(1 / p.childLen) : null;
      } else {
        p.childLen = 0;
        p.restChildDir = null;
      }
    });
    const clothRoots = [];
    [['CoatL_0351', 1], ['CoatR_0359', -1]].forEach(([name, side]) => {
      const bone = model.getObjectByName(name);
      if (!bone) return;
      clothRoots.push({
        target: bone,
        side,
        restLocal: bone.quaternion.clone(),
        restPos: bone.position.clone(),
        restW: S._worldQ(bone, new S.THREE.Quaternion()),
      });
    });
    const srcClips = {};
    srcGltf.animations.forEach(c => { srcClips[c.name] = c; });
    const restMixer = new S.THREE.AnimationMixer(source);
    const restAction = restMixer.clipAction(srcClips.A_TPose);
    restAction.play();
    restMixer.setTime(0.05);
    source.updateMatrixWorld(true);
    pairs.forEach(p => {
      p.srcRest = S._worldQ(p.source, new S.THREE.Quaternion());
      p.srcRestPos = p.source.getWorldPosition(new S.THREE.Vector3());
    });
    pairs.forEach(p => {
      const child = byUal[S.UAL_CHILD[p.ual]];
      if (!child) { p.restSrcDir = null; return; }
      const d = child.srcRestPos.clone().sub(p.srcRestPos);
      p.restSrcDir = d.lengthSq() > 1e-8 ? d.normalize() : null;
    });
    const hip = byUal['DEF-hips'];
    hip.yScale = hip.target.getWorldPosition(new S.THREE.Vector3()).y / hip.srcRestPos.y;
    restAction.stop();
    const wanted = [['Idle_Loop', 'idle'], ['Walk_Loop', 'walk'], ['Sitting_Idle_Loop', 'sit']];
    const clips = {};
    wanted.forEach(([srcName, outName]) => {
      clips[outName] = S.retargetPennyClip(source, srcClips[srcName], outName, pairs, byUal, clothRoots);
    });
    agent.rig.traverse(o => { if (o.isMesh) o.visible = false; });
    const pivot = new S.THREE.Group();
    pivot.name = 'penny-pivot';
    pivot.add(model);
    const mixer = new S.THREE.AnimationMixer(model);
    const actions = {};
    Object.entries(clips).forEach(([name, clip]) => { actions[name] = mixer.clipAction(clip); });
    const entry = { id: 'penny', agent, model: pivot, mixer, clips: actions, current: '' };
    S.proofHumans.push(entry);
    window.__penny = entry;
    window.__pennyReady = true;
    const box = new S.THREE.Box3().setFromObject(model);
    console.info('[penny]', Object.keys(actions).join(','), 'bones', pairs.length, 'h', +(box.max.y - box.min.y).toFixed(3));
  }).catch(err => console.error('[penny]', err));
}

export function initCast() {


S.cast = [], S.castById = {};

S.LOOKS = {
  andrew:     { suit: 0x6a5040, shirt: 0xf3efe6, trim: 0xf0d078, hair: 0x2c2016, skin: 0xd0a07a, hairKind: 'part', jacket: 'coat', shoulder: 1.1, head: [1.0, 1.1, 0.96], cyber: 'pin', tie: 0x6e2434, trousers: 0x2a241c },
  mandy:      { suit: 0x8a2460, shirt: 0x2a1022, trim: 0x9af0ff, hair: 0x3a2428, skin: 0xe0b090, hairKind: 'bob', jacket: 'blazer', shoulder: 0.9, head: [0.92, 1.02, 0.97], cyber: 'ear', trousers: 0x140c12 },
  hailey:     { suit: 0x1a4a5c, shirt: 0xd5e4ea, trim: 0x3ec8e0, hair: 0x4a3020, skin: 0xc98868, hairKind: 'pony', jacket: 'blazer', shoulder: 0.98, head: [0.96, 1.04, 0.95], cyber: 'ring', trousers: 0x12161c },
  holly:      { suit: 0x24344e, shirt: 0xd8dde6, trim: 0xb7c6dc, hair: 0x121216, skin: 0xd8b098, hairKind: 'pixie', jacket: 'blazer', shoulder: 0.92, head: [0.9, 1.0, 0.94], cyber: 'ring', trousers: 0x10141a },
  hazel:      { suit: 0x5a3850, shirt: 0xf0dce4, trim: 0xf0a0c0, hair: 0x6a4030, skin: 0xe0b898, hairKind: 'sweep', jacket: 'coat', shoulder: 0.96, head: [0.98, 1.05, 0.98], cyber: 'ear', trousers: 0x1a1218 },
  penny:      { suit: 0x16365e, shirt: 0xd5e2f2, trim: 0x4bb3f2, hair: 0x10141c, skin: 0xd0a080, hairKind: 'bun', jacket: 'coat', shoulder: 1.0, head: [0.97, 1.06, 0.95], cyber: 'visor', trousers: 0x101820 },
  routinizer: { suit: 0x1c4034, shirt: 0xd7e6dc, trim: 0x39ff14, hair: 0x101410, skin: 0xc09070, hairKind: 'undercut', jacket: 'utility', shoulder: 1.08, head: [1.02, 1.04, 0.98], cyber: 'ring', tie: 0x102018, trousers: 0x101614 },
  crypto:     { suit: 0x143028, shirt: 0xd4e6d4, trim: 0x39ff14, hair: 0x14301c, skin: 0xc8a080, hairKind: 'spike', jacket: 'utility', shoulder: 0.98, head: [0.95, 1.03, 0.96], cyber: 'cheek', trousers: 0x101814 },
  risk:       { suit: 0x4a321c, shirt: 0xf0e6d4, trim: 0xffb347, hair: 0x1c1610, skin: 0xc49878, hairKind: 'slick', jacket: 'blazer', shoulder: 1.02, head: [1.0, 1.08, 0.94], cyber: 'monocle', trousers: 0x16120e },
  market:     { suit: 0x163848, shirt: 0xd5e6ee, trim: 0x7fe3ff, hair: 0x1a1e28, skin: 0xd0a888, hairKind: 'side', jacket: 'coat', shoulder: 1.0, head: [0.98, 1.05, 0.97], cyber: 'temple', trousers: 0x10161c },
};
}

export function initLife() {


// Ambient office life. One shared routine at a time so partners actually meet.
// The lift moves only when someone is visiting another floor, then brings them home.
S.LANES = { andrew: 2.12, mandy: 2.52, hailey: 2.18, holly: 2.55, hazel: 2.16, penny: 2.36, routinizer: 2.42, crypto: 2.14, risk: 2.5, market: 2.62 };

S.BEATS = [
  { kind: 'errand', who: 'penny', with: 'hailey', spot: 'north', hold: 8, pose: 'look' },
  { kind: 'chat', a: 'hailey', b: 'holly', hold: 8 },
  { kind: 'consult', a: 'crypto', b: 'risk', hold: 8 },
  { kind: 'rest', a: 'market', b: 'crypto', hold: 9 },
  { kind: 'visit', guest: 'andrew', host: 'routinizer', mode: 'consult', hold: 8 },
  { kind: 'errand', who: 'mandy', spot: 'west', hold: 6, pose: 'look' },
  { kind: 'chat', a: 'hazel', b: 'hailey', hold: 7 },
  { kind: 'game', a: 'andrew', b: 'mandy', hold: 10 },
  { kind: 'visit', guest: 'andrew', host: 'penny', mode: 'chat', hold: 8 },
  { kind: 'rest', a: 'holly', b: 'hazel', hold: 8 },
  { kind: 'consult', a: 'market', b: 'risk', hold: 7 },
  { kind: 'visit', guest: 'andrew', host: 'hailey', mode: 'consult', hold: 8 },
  { kind: 'rest', a: 'andrew', b: 'mandy', hold: 9 },
  { kind: 'errand', who: 'holly', with: 'hazel', spot: 'east', hold: 6, pose: 'look' },
  { kind: 'chat', a: 'holly', b: 'hazel', hold: 7 },
  { kind: 'visit', guest: 'andrew', host: 'crypto', mode: 'consult', hold: 8 },
];

S.director = { paused: false, index: 0, phase: 'gap', gap: 2.4, beat: null, hold: 0, t: 0, liftLock: 0, spots: null };

S.lifeTrace = [];

S.lifeT = 0, S.traceAcc = 0, S.tracePhase = '';

window.__stepLife = (dt) => S.stepLife(dt);

for (const a of S.cast) S.poseAgent(a, 'type', 1);

window.__life = {
  step(dt) { S.stepLife(dt); },
  status: S.lifeStatus,
  get trace() { return S.lifeTrace; },
  ids: () => S.cast.map(a => a.id),
  pause(v) { S.director.paused = v !== false; },
  meshCost() {
    const geos = new Set();
    let meshes = 0, tris = 0;
    for (const a of S.cast) a.rig.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      meshes++;
      geos.add(o.geometry.uuid);
      const geo = o.geometry;
      tris += geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
    });
    return { people: S.cast.length, meshes, tris, uniqueGeos: geos.size };
  },
};

window.__ceo = {
  get activity() { return S.director.beat ? S.director.beat.kind : 'work'; },
  get phase() { return S.andrewAgent ? S.andrewAgent.phase : S.director.phase; },
  get pose() { return S.andrewAgent ? S.poseName(S.andrewAgent) : 'type'; },
  get lift() { return S.lift.lv; },
  get open() { return +S.lift.open.toFixed(2); },
  rests: () => S.restCount,
  doors: () => S.lift.doors.length,
  pointLights() { let n = 0; S.scene.traverse(o => { if (o.isPointLight) n++; }); return n; },
  goto(id) { this.snap(id); },
  snap(id) {
    const spots = {
      desk: [-4, 0.9, Math.PI, 'type'],
      rest: [7.68, 4.46, Math.PI, 'sit'],
      game: [7.85, -1.93, Math.PI, 'play'],
      look: [-1.2, 5.2, 0, 'stand'],
      liftLobby: [-6.4, 5.55, 0, 'stand'],
    };
    const s = spots[id];
    if (!s || !S.andrewAgent) return;
    S.director.paused = true;
    if (S.andrewAgent.rig.parent !== S.andrewAgent.group) S.andrewAgent.group.attach(S.andrewAgent.rig);
    S.andrewAgent.phase = 'there'; S.andrewAgent.pose = s[3]; S.andrewAgent.busy = true;
    S.andrewAgent.rig.position.set(s[0], 0, s[1]); S.andrewAgent.rig.rotation.y = s[2];
    S.poseAgent(S.andrewAgent, s[3], 2);
  },
  showLift(lv) {
    S.lift.target = lv; S.lift.lv = lv; S.lift.cabin.position.y = S.liftY(lv);
    S.lift.open = S.lift.openTarget = 1; S.lift.wantOpen = true; S.setCabinFloor(lv);
  },
};
}

export function initCrowd() {



// ---- people variants: ?people=a (rigged civilian GLB) | ?people=b (procedural+) ----
S.PEOPLE_VARIANT = (new URLSearchParams(location.search).get('people') || 'a').toLowerCase();

window.__PEOPLE_VARIANT = S.PEOPLE_VARIANT;

S.pedestrians = [];

S.mixers = [];

S.pedColors = [0x1a2030, 0x121820, 0x1e1528, 0x0e1820, 0x221818, 0x141c28, 0x1a1520, 0x102028];

S.accentCols = [0x00f0ff, 0xff2a6d, 0xfcee0a, 0x7fe3ff, 0xff5fa2, 0x39ff14];


S.SKIN_TONES = [0xe8c4a2, 0xd4a574, 0xc68642, 0xf1c27d, 0x8d5524, 0xffdbac];

S.HAIR_COLS = [0x1a1210, 0x0a0808, 0x2a1810, 0x101018, 0x3a2010, 0x1a2030];

S.OUTFIT_ARCHETYPES = ['trench', 'bomber', 'techwear', 'corpo', 'punk', 'nomad'];


/** Night City recolour for Quaternius clothed GLBs — keep albedo readable, low emissive trim */
S.CP_ARCHETYPES = ['street_punk', 'corpo', 'nomad', 'netrunner'];


// Variant B boots immediately; Variant A waits for GLB then fills
if (S.PEOPLE_VARIANT === 'b') {
  const mk = S.makeFnProcedural();
  S.addStreetStory(mk);
  S.addStreetPropsB();
  S.spawnHeroPedestrians(mk);
  S.spawnBackgroundCrowd(mk, 40);
  window.__pedestrians = S.pedestrians; window.__mixers = S.mixers;
  window.__PEOPLE_READY = true;
} else {
  // light placeholders until A loads — still get props-less story via procedural temporarily
  window.__PEOPLE_READY = false;
}
}

export function initProof() {

// Andrew and Mandy proof: skinned Rocketbox humans (see assets/characters/NOTICE.md).
// The life director still drives the original rig. These models follow that rig
// and play a matching clip. Other staff stay on the existing figures.
S.proofHumans = [];

// Fictional adults. Fully clothed. Not likenesses of any real person.
// Halfords (Hailey, Holly, Hazel) and bookings (Mandy, Penny) are women.
// Andrew and the other staff are men. Andrew, Mandy, Penny, and Hailey are skinned.
// Penny is the Lucy rig. Her clips are retargeted from the Quaternius CC0 set.
S.CAST_DESIGN = {
  female: ['mandy', 'hailey', 'holly', 'hazel', 'penny'],
  male: ['andrew', 'routinizer', 'crypto', 'risk', 'market'],
};

// The office slab is 0.38 m thick, centered at local y 0.19, so the walkable top is 0.38.
// Mandy's soles are at the model origin, which put her legs through that slab.
// The walk cycle plants about 6 cm lower still. Lift only her skinned model.
// In the lift the floor plate top is 0.08, not the office slab.
S.MANDY_FLOOR = 0.383;

S.MANDY_CABIN_FLOOR = 0.084;

S.ANDREW_LOUNGE_Y = 0.43;

S._soleV = new S.THREE.Vector3();

S._soleP = new S.THREE.Vector3();

S._soleAcc = new S.THREE.Vector3();

S._soleM = new S.THREE.Matrix4();

S._soleOrigin = new S.THREE.Vector3();

S._flatA = new S.THREE.Vector3();

S._flatB = new S.THREE.Vector3();

S._flatQ = new S.THREE.Quaternion();

S._flatP = new S.THREE.Quaternion();

S.attachProof('andrew', 'assets/characters/andrew.glb');

S.attachProof('mandy', 'assets/characters/mandy.glb');

S.attachProof('hailey', 'assets/characters/hailey.glb');


// Penny: Lucy rig, used as-is (do not re-export; that breaks the skin).
// The GLB root already stands her upright. syncProof writes yaw onto the
// object it moves, so that root rotation stays on an inner node.
// Clips are Quaternius CC0 Universal Animation Library (standard):
// Idle_Loop, Walk_Loop, Sitting_Idle_Loop, with A_TPose as the source rest.
// bone-map-mixamo.json names the humanoid bones. Hair, coat tails, and twist
// bones stay at the bind pose. The jacket roots CoatL and CoatR are keyed
// with the same swing as the upper arms, so the sleeves and shoulder pieces
// follow the arms instead of staying out in the A-pose.
// Upper arms are then aimed to hang about 10 degrees off vertical. Neck and
// head stay at the bind, so the chin does not pitch down on the walk.
S.UAL_TO_MIXAMO = {
  'DEF-hips': 'mixamorigHips',
  'DEF-spine.001': 'mixamorigSpine',
  'DEF-spine.002': 'mixamorigSpine1',
  'DEF-spine.003': 'mixamorigSpine2',
  'DEF-neck': 'mixamorigNeck',
  'DEF-head': 'mixamorigHead',
  'DEF-shoulder.L': 'mixamorigLeftShoulder',
  'DEF-upper_arm.L': 'mixamorigLeftArm',
  'DEF-forearm.L': 'mixamorigLeftForeArm',
  'DEF-hand.L': 'mixamorigLeftHand',
  'DEF-thigh.L': 'mixamorigLeftUpLeg',
  'DEF-shin.L': 'mixamorigLeftLeg',
  'DEF-foot.L': 'mixamorigLeftFoot',
  'DEF-toe.L': 'mixamorigLeftToeBase',
  'DEF-shoulder.R': 'mixamorigRightShoulder',
  'DEF-upper_arm.R': 'mixamorigRightArm',
  'DEF-forearm.R': 'mixamorigRightForeArm',
  'DEF-hand.R': 'mixamorigRightHand',
  'DEF-thigh.R': 'mixamorigRightUpLeg',
  'DEF-shin.R': 'mixamorigRightLeg',
  'DEF-foot.R': 'mixamorigRightFoot',
  'DEF-toe.R': 'mixamorigRightToeBase',
};

S.UAL_CHILD = {
  'DEF-hips': 'DEF-spine.001',
  'DEF-spine.001': 'DEF-spine.002',
  'DEF-spine.002': 'DEF-spine.003',
  'DEF-spine.003': 'DEF-neck',
  'DEF-neck': 'DEF-head',
  'DEF-shoulder.L': 'DEF-upper_arm.L',
  'DEF-upper_arm.L': 'DEF-forearm.L',
  'DEF-forearm.L': 'DEF-hand.L',
  'DEF-thigh.L': 'DEF-shin.L',
  'DEF-shin.L': 'DEF-foot.L',
  'DEF-foot.L': 'DEF-toe.L',
  'DEF-shoulder.R': 'DEF-upper_arm.R',
  'DEF-upper_arm.R': 'DEF-forearm.R',
  'DEF-forearm.R': 'DEF-hand.R',
  'DEF-thigh.R': 'DEF-shin.R',
  'DEF-shin.R': 'DEF-foot.R',
  'DEF-foot.R': 'DEF-toe.R',
};

S._rtV = new S.THREE.Vector3();

S._rtS = new S.THREE.Vector3();

S._rtQ = new S.THREE.Quaternion();

S._rtParent = new S.THREE.Quaternion();

S._rtDelta = new S.THREE.Quaternion();

S._aimA = new S.THREE.Vector3();

S._aimB = new S.THREE.Vector3();

S._aimD = new S.THREE.Vector3();


S.attachPenny();

window.__proof = S.proofHumans;

window.__frame = (id, clip, phase, view) => {
  window.__HOLD_LIFE = true;
  const a = S.castById[id];
  const other = S.castById[id === 'andrew' ? 'mandy' : 'andrew'];
  a.phase = clip === 'walk' ? 'walk' : 'there';
  a.pose = clip === 'walk' ? 'walk' : clip === 'sit' || clip === 'type' ? 'sit' : 'stand';
  a.busy = true;
  a.rig.position.set(-7.2, 0, 2.4);
  a.rig.rotation.y = 0;
  if (other) other.rig.position.set(14, 0, 14);
  S.scene.updateMatrixWorld(true);
  const info = window.__scrub(id, clip, phase);
  const wp = new S.THREE.Vector3();
  a.rig.getWorldPosition(wp);
  const look = wp.clone();
  look.y += view === 'close' ? 1.55 : 0.78;
  const cam = look.clone();
  if (view === 'close') { cam.z += 1.15; }
  else if (view === 'side') { cam.x += 3.15; cam.z += 0.35; }
  else if (view === 'feet') {
    cam.set(wp.x + 1.35, wp.y + 1.25, wp.z + 2.05);
    look.set(wp.x, wp.y + 0.16, wp.z + 0.2);
  }
  else { cam.z += 3.6; cam.y += 0.05; }
  window.__LOCK_CAM = { pos: cam, tgt: look };
  if (!window.__proofKey) {
    const key = new S.THREE.DirectionalLight(0xfff4e8, 2.4);
    key.position.set(3, 8, 6);
    S.scene.add(key);
    const fill = new S.THREE.DirectionalLight(0xc9d7ff, 0.9);
    fill.position.set(-4, 4, -2);
    S.scene.add(fill);
    window.__proofKey = key;
  }
  return info;
};

window.__place = (id, x, z, yaw, pose, phase, cam) => {
  window.__HOLD_LIFE = true;
  window.__DIAG_LIGHT = false;
  const a = S.castById[id];
  const other = S.castById[id === 'andrew' ? 'mandy' : 'andrew'];
  a.phase = pose === 'walk' ? 'walk' : 'there';
  a.pose = pose;
  a.busy = true;
  a.rig.position.set(x, 0, z);
  a.rig.rotation.y = yaw;
  if (other) { other.busy = true; other.rig.position.set(30, 0, 30); }
  const entry = S.proofHumans.find(p => p.id === id);
  if (entry) entry.footY = null;
  const clip = (pose === 'type' || pose === 'sit' || pose === 'play') ? 'sit' : (pose === 'walk' ? 'walk' : 'idle');
  window.__scrub(id, clip, phase || 0);
  S.syncProof(0);
  S.scene.updateMatrixWorld(true);
  const wp = new S.THREE.Vector3();
  entry.model.getWorldPosition(wp);
  if (cam) {
    window.__LOCK_CAM = {
      pos: { x: wp.x + cam[0], y: wp.y + cam[1], z: wp.z + cam[2] },
      tgt: { x: wp.x + cam[3], y: wp.y + cam[4], z: wp.z + cam[5] },
    };
  }
  return { x: +wp.x.toFixed(3), y: +wp.y.toFixed(3), z: +wp.z.toFixed(3), foot: window.__mandyFoot || null, pose };
};

window.__cabinCheck = () => {
  window.__HOLD_LIFE = true;
  const a = S.castById.mandy;
  S.lift.cabin.attach(a.rig);
  a.rig.position.set(0, 0, -0.12);
  a.rig.rotation.y = Math.PI;
  a.pose = 'stand';
  a.phase = 'there';
  a.busy = true;
  const entry = S.proofHumans.find(p => p.id === 'mandy');
  entry.footY = null;
  window.__scrub('mandy', 'idle', 0);
  S.syncProof(0);
  S.scene.updateMatrixWorld(true);
  const wp = new S.THREE.Vector3();
  entry.model.getWorldPosition(wp);
  const cabin = new S.THREE.Vector3();
  S.lift.cabin.getWorldPosition(cabin);
  window.__LOCK_CAM = {
    pos: { x: wp.x + 1.4, y: wp.y + 1.1, z: wp.z + 2.2 },
    tgt: { x: wp.x, y: wp.y + 0.8, z: wp.z },
  };
  return { gap: +(wp.y - cabin.y).toFixed(3), foot: window.__mandyFoot };
};

window.__meshBounds = (id) => {
  const entry = S.proofHumans.find(p => p.id === id);
  if (!entry) return null;
  entry.model.updateWorldMatrix(true, true);
  const feet = [];
  let minY = 1e9, maxY = -1e9;
  const v = new S.THREE.Vector3();
  const p = new S.THREE.Vector3();
  const acc = new S.THREE.Vector3();
  const m4 = new S.THREE.Matrix4();
  entry.model.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const g = o.geometry;
    const pos = g.attributes.position;
    const si = g.attributes.skinIndex;
    const sw = g.attributes.skinWeight;
    if (!pos || !si || !sw) return;
    o.skeleton.update();
    const bones = o.skeleton.boneMatrices;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.bindMatrix);
      acc.set(0, 0, 0);
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        if (w <= 0) continue;
        const bi = si.getComponent(i, k);
        m4.fromArray(bones, bi * 16);
        p.copy(v).applyMatrix4(m4).multiplyScalar(w);
        acc.add(p);
      }
      acc.applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld);
      if (acc.y < minY) minY = acc.y;
      if (acc.y > maxY) maxY = acc.y;
      if (acc.y < 0.25) feet.push([+acc.x.toFixed(3), +acc.y.toFixed(3), +acc.z.toFixed(3)]);
    }
  });
  feet.sort((a, b) => a[1] - b[1]);
  const left = feet.filter(f => f[0] >= 0).slice(0, 1)[0] || null;
  const right = feet.filter(f => f[0] < 0).slice(0, 1)[0] || null;
  return { minY: +minY.toFixed(4), maxY: +maxY.toFixed(4), left, right, low: feet.slice(0, 6) };
};

window.__chairShot = () => {
  window.__HOLD_LIFE = true;
  const a = S.castById.andrew;
  a.phase = 'there'; a.pose = 'sit'; a.busy = true;
  a.rig.position.set(-4, 0, 0.9); a.rig.rotation.y = Math.PI;
  const m = S.castById.mandy;
  m.phase = 'there'; m.pose = 'sit'; m.busy = true;
  m.rig.position.set(8, 0, 8);
  S.scene.updateMatrixWorld(true);
  window.__scrub('andrew', 'sit', 0);
  const wp = new S.THREE.Vector3();
  a.rig.getWorldPosition(wp);
  const look = wp.clone(); look.y += 0.55;
  const cam = look.clone(); cam.x += 2.2; cam.z += 2.4; cam.y += 0.35;
  window.__LOCK_CAM = { pos: cam, tgt: look };
};

window.__scrub = (id, clip, phase) => {
  const entry = S.proofHumans.find(p => p.id === id);
  if (!entry || !entry.clips[clip]) return null;
  Object.values(entry.clips).forEach(a => { a.stop(); a.setEffectiveWeight(0); });
  const act = entry.clips[clip];
  act.reset().play();
  act.paused = true;
  act.setEffectiveWeight(1);
  act.time = Math.max(0, act.getClip().duration * phase);
  entry.current = clip;
  entry.mixer.update(0);
  return { clip, time: +act.time.toFixed(3), dur: +act.getClip().duration.toFixed(3) };
};

window.__stageProof = (mode) => {
  window.__HOLD_LIFE = true;
  const place = (id, x, z, yaw, pose) => {
    const a = S.castById[id];
    a.phase = pose === 'walk' ? 'walk' : 'there';
    a.pose = pose;
    a.busy = true;
    a.rig.position.set(x, 0, z);
    a.rig.rotation.y = yaw;
  };
  const focusId = mode === 'mandy' ? 'mandy' : 'andrew';
  if (mode === 'walk') {
    place('andrew', -1.1, 2.4, Math.PI / 2, 'walk');
    place('mandy', 1.15, 2.4, -Math.PI / 2, 'walk');
  } else if (mode === 'close' || mode === 'body') {
    place('andrew', -3.5, 1.5, 0.15, 'stand');
    place('mandy', -1.6, 1.5, -0.15, 'stand');
  } else if (mode === 'mandy') {
    place('mandy', -2.4, 1.6, 0.2, 'stand');
    place('andrew', -5.2, 2.6, 0.4, 'stand');
  } else {
    place('andrew', -4, 0.9, Math.PI, 'type');
    place('mandy', -1.15, 2.15, 2.6, 'stand');
  }
  S.scene.updateMatrixWorld(true);
  const wp = new S.THREE.Vector3();
  S.castById[focusId].rig.getWorldPosition(wp);
  const look = wp.clone();
  look.y += mode === 'close' ? 1.5 : mode === 'body' || mode === 'mandy' ? 0.95 : 1.0;
  const cam = look.clone();
  if (mode === 'close') { cam.x += 0.55; cam.z += 1.55; }
  else if (mode === 'body' || mode === 'mandy') { cam.x += 1.15; cam.y += 0.15; cam.z += 3.15; }
  else { cam.x += 2.6; cam.y += 1.35; cam.z += 3.4; }
  window.__LOCK_CAM = { pos: cam, tgt: look };
  return { look: look.toArray(), cam: cam.toArray(), proof: S.proofHumans.length };
};

}

