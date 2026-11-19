import { S } from './scope.js';
import { addHbRichInterior } from './hb-interior.js';


S.screenKeyFor = function screenKeyFor(floor) {
  const id = floor && floor.id;
  if (id === 'hb') return 'book';
  if (id === 'auto') return 'code';
  if (id === 'crypto') return 'chart';
  if (id === 'penny') return 'watch';
  if (id === 'exec') return 'ceo';
  return 'meet';
}


S.paintScreen = function paintScreen(key, t) {
  const s = S.screenBank[key]; if (!s) return;
  const ctx = s.ctx, w = 320, h = 180, ph = t / 1000;
  ctx.fillStyle = '#070b12'; ctx.fillRect(0, 0, w, h);
  ctx.font = '700 15px sans-serif';
  if (key === 'book') {
    ctx.fillStyle = '#062033'; ctx.fillRect(0, 0, w, 28);
    ctx.fillStyle = '#7fe3ff'; ctx.fillText('SAMPLE BOARD   not a live diary', 10, 19);
    ['Mon','Tue','Wed','Thu','Fri'].forEach((d, i) => {
      ctx.fillStyle = i === (Math.floor(ph) % 5) ? '#16384e' : '#101820';
      ctx.fillRect(12 + i * 60, 42, 52, 122);
      ctx.fillStyle = '#9ad7ff'; ctx.font = '12px sans-serif'; ctx.fillText(d, 24 + i * 60, 58);
      ctx.fillStyle = '#00e5ff'; ctx.fillRect(20 + i * 60, 78 + ((i * 19 + ph * 12) % 60), 34, 7);
    });
  } else if (key === 'chart') {
    ctx.fillStyle = '#07140c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#39ff14'; ctx.fillText('SIMULATED CHART   paper only', 10, 20);
    ctx.beginPath(); ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 2;
    for (let x = 0; x < 300; x++) {
      const y = 108 + Math.sin((x + ph * 24) * 0.07) * 26 + Math.sin(x * 0.19 + ph) * 8;
      if (x === 0) ctx.moveTo(12 + x, y); else ctx.lineTo(12 + x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#145'; ctx.fillRect(12, 150, 80, 14);
    ctx.fillStyle = '#9f9'; ctx.font = '11px sans-serif'; ctx.fillText('no orders', 18, 161);
  } else if (key === 'code') {
    ctx.fillStyle = '#39ff14'; ctx.fillText('SAMPLE SCRIPT', 10, 20);
    const lines = ['def tick():', '    # demo only', '    queue.step()', '    check.ok()', '    return True'];
    ctx.font = '13px monospace';
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === (Math.floor(ph * 1.5) % lines.length) ? '#d8ffb0' : '#6d6';
      ctx.fillText(ln, 16, 48 + i * 24);
    });
  } else if (key === 'watch') {
    ctx.fillStyle = '#4bb3f2'; ctx.fillText('OVERSIGHT   sample list', 10, 20);
    ['quiet desks', 'duplicates', 'notes', 'hours'].forEach((item, i) => {
      const on = ((Math.floor(ph) + i) % 4) !== 0;
      ctx.fillStyle = on ? '#b7e4ff' : '#445566';
      ctx.font = '14px sans-serif';
      ctx.fillText((on ? '[x]  ' : '[ ]  ') + item, 16, 52 + i * 28);
    });
  } else if (key === 'ceo') {
    ctx.fillStyle = '#fcee0a'; ctx.fillText('FLOOR GLANCE   sample', 10, 20);
    ['hall', 'watch', 'desks', 'scripts', 'paper', 'penthouse'].forEach((ln, i) => {
      ctx.fillStyle = '#3a3418'; ctx.fillRect(16, 36 + i * 22, 50 + ((i * 17 + ph * 8) % 150), 14);
      ctx.fillStyle = '#f6e7a2'; ctx.font = '12px sans-serif'; ctx.fillText(ln, 20, 47 + i * 22);
    });
  } else if (key === 'game') {
    ctx.fillStyle = '#140810'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff4d8d'; ctx.fillText('GAME LOUNGE', 10, 22);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(30 + ((ph * 40) % 210), 88, 26, 8);
    ctx.fillStyle = '#ff2a6d'; ctx.fillRect(250, 48 + Math.sin(ph * 2) * 28 + 30, 8, 40);
    ctx.fillStyle = '#888'; ctx.font = '11px sans-serif'; ctx.fillText('demo paddle', 10, 168);
  } else {
    ctx.fillStyle = '#7fe3ff'; ctx.fillText('MEETING   sample agenda', 10, 20);
    ctx.fillStyle = '#c5e8ff'; ctx.font = '14px sans-serif';
    ctx.fillText('open floor', 16, 64);
    ctx.fillText('no live minutes', 16, 92);
  }
  s.tex.needsUpdate = true;
}


S.screenMat = function screenMat(key) {
  if (S.screenBank[key]) return S.screenBank[key].mat;
  const c = document.createElement('canvas'); c.width = 320; c.height = 180;
  const ctx = c.getContext('2d');
  const tex = new S.THREE.CanvasTexture(c);
  tex.colorSpace = S.THREE.SRGBColorSpace;
  tex.magFilter = S.THREE.LinearFilter;
  const mat = new S.THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  S.screenBank[key] = { ctx, tex, mat };
  S.paintScreen(key, 0);
  return mat;
}


S.updateScreens = function updateScreens(dt) {
  S.screenAcc += dt;
  if (S.screenAcc < 0.55) return;
  S.screenAcc = 0;
  const keys = Object.keys(S.screenBank);
  if (!keys.length) return;
  S.paintScreen(keys[S.screenCursor++ % keys.length], performance.now());
}


S.addMonitor = function addMonitor(parent, x, y, z, key) {
  const m = new S.THREE.Mesh(new S.THREE.PlaneGeometry(1.02, 0.64), S.screenMat(key));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = false; parent.add(m);
  S.box(1.1, 0.72, 0.04, S.frameMat, x, y, z - 0.03, parent);
}


S.workstation = function workstation(parent, x, z, color, name, floor, monCol = 0x00f0ff, seatTop = 0.60, fit) {
  // fit is only set for Mandy. It slides her desk toward the chair, raises the
  // desktop so the seat is not a stool at a counter, and parks her hips on the cushion.
  fit = fit || {};
  const dz = fit.deskShift || 0;
  const deskY = fit.deskY != null ? fit.deskY : 1.02;
  const dy = deskY - 1.02;
  const deskBits = new S.THREE.Group();
  deskBits.userData.procDesk = true;
  parent.add(deskBits);
  S.box(2.6, 0.1, 1.35, S.deskMat, x, deskY, z + dz, deskBits);
  for (const dx of [-1.15, 1.15]) S.box(0.12, 1.0, 1.1, S.deskMat, x + dx, 0.5 + dy * 0.45, z + dz, deskBits);
  const key = S.screenKeyFor(floor);
  S.addMonitor(deskBits, x - 0.55, 1.55 + dy, z + dz - 0.42, key);
  S.addMonitor(deskBits, x + 0.55, 1.55 + dy, z + dz - 0.42, key);
  S.box(0.08, 0.35, 0.08, S.frameMat, x - 0.55, 1.15 + dy, z + dz - 0.4, deskBits);
  S.box(0.08, 0.35, 0.08, S.frameMat, x + 0.55, 1.15 + dy, z + dz - 0.4, deskBits);
  const gTex = monCol === 0xff2a6d ? S.GLOW.mag : (monCol === 0xfcee0a ? S.GLOW.yel : S.GLOW.cyan);
  S.glow(gTex, x - 0.55, 1.55 + dy, z + dz - 0.62, 1.5, 1.0, 0.22, deskBits);
  S.glow(gTex, x + 0.55, 1.55 + dy, z + dz - 0.62, 1.5, 1.0, 0.22, deskBits);
  S.box(0.9, 0.04, 0.35, S.M(0x1a1e28), x, 1.1 + dy, z + dz + 0.15, deskBits);
  if (!window.__procDesks) window.__procDesks = [];
  window.__procDesks.push({ bits: deskBits, parent, x, z: z + dz });
  const seatLift = seatTop - 0.60;
  const seatZ = fit.seatZ != null ? fit.seatZ : 1.15;
  const backZ = fit.backZ != null ? fit.backZ : 1.45;
  const seatD = fit.seatD || 0.7;
  const seatW = fit.seatW || 0.7;
  const backH = fit.backH || 0.7;
  const backD = fit.backD || 0.1;
  S.box(seatW, 0.1, seatD, S.chairMat, x, 0.55 + seatLift, z + seatZ, parent);
  S.box(fit.backW || (seatW - 0.05), backH, backD, S.chairMat, x, (fit.backY != null ? fit.backY : 0.95) + seatLift, z + backZ, parent);
  if (seatLift === 0 && !fit.seatZ) S.box(0.12, 0.5, 0.12, S.frameMat, x, 0.28, z + seatZ, parent);
  else {
    const postTop = seatTop - 0.1, postBottom = 0.38, postH = Math.max(0.12, postTop - postBottom);
    S.box(0.12, postH, 0.12, S.frameMat, x, postBottom + postH / 2, z + seatZ, parent);
  }
  const personZ = fit.personZ != null ? fit.personZ : 1.05;
  if (name) S.person(parent, x, z + personZ, color, name, floor, Math.PI);
}


S.buildLobbyShell = function buildLobbyShell(g, f, mat) {
  const gh = S.FH - 0.35, gy = S.FH / 2 + 0.15;
  const doorW = 2.8, doorH = 3.05;
  const bottom = gy - gh / 2;
  const zf = S.FD / 2;
  const sideW = (S.FW - doorW) / 2;
  const pick = (mesh) => { mesh.userData.floor = f; g.add(mesh); S.pickables.push(mesh); };
  const left = new S.THREE.Mesh(new S.THREE.BoxGeometry(sideW, gh, 0.12), mat);
  left.position.set(-S.FW / 2 + sideW / 2, gy, zf); pick(left);
  const right = new S.THREE.Mesh(new S.THREE.BoxGeometry(sideW, gh, 0.12), mat);
  right.position.set(S.FW / 2 - sideW / 2, gy, zf); pick(right);
  const transomH = Math.max(0.4, gh - doorH);
  const transom = new S.THREE.Mesh(new S.THREE.BoxGeometry(doorW, transomH, 0.12), mat);
  transom.position.set(0, bottom + doorH + transomH / 2, zf); pick(transom);
  for (const x of [-S.FW / 2, S.FW / 2]) {
    const side = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.12, gh, S.FD), mat);
    side.position.set(x, gy, 0); pick(side);
  }
  const back = new S.THREE.Mesh(new S.THREE.BoxGeometry(S.FW, gh, 0.12), mat);
  back.position.set(0, gy, -S.FD / 2); pick(back);
  S.box(0.16, doorH, 0.28, S.E(0x39f3ff, 4.2), -doorW / 2, bottom + doorH / 2, zf + 0.12, g);
  S.box(0.16, doorH, 0.28, S.E(0xff2a6d, 4.2), doorW / 2, bottom + doorH / 2, zf + 0.12, g);
  S.box(doorW + 0.2, 0.14, 0.28, S.E(0xfcee0a, 3.6), 0, bottom + doorH, zf + 0.12, g);
}


S.addCityFacade = function addCityFacade(g, f) {
  const lv = f.lv;
  const dark = S.M(0x12151e, { metalness: 0.4, roughness: 0.52 });
  const lit = S.E(0xe7f7ff, 3.4);
  const mag = S.E(0xff2a6d, 4.6);
  const cyn = S.E(0x39f3ff, 4.6);
  const tier = lv <= 2 ? 0 : lv <= 4 ? 1 : 2;
  const out = tier === 0 ? 1.15 : tier === 1 ? 0.5 : 0.2;
  const ox = tier === 1 ? 1.3 : tier === 2 ? -0.85 : 0;
  const xb = S.FW / 2 + out;
  const zf = S.FD / 2 + out;
  const mark = (mesh) => { mesh.userData.floor = f; S.pickables.push(mesh); return mesh; };
  if (lv === 1) {
    const doorW = 2.8;
    const cheek = (xb * 2 - doorW) / 2;
    mark(S.box(cheek, S.FH - 0.25, 0.46, dark, -xb + cheek / 2, S.FH / 2, zf, g));
    mark(S.box(cheek, S.FH - 0.25, 0.46, dark, xb - cheek / 2, S.FH / 2, zf, g));
  } else {
    mark(S.box(xb * 2, 0.72, 0.46, dark, ox, 0.72, zf, g));
    mark(S.box(xb * 2, 0.58, 0.46, dark, ox, S.FH - 0.48, zf, g));
    mark(S.box(xb * 2 - 1.4, 0.12, 0.08, S.E(lv % 2 ? 0xff2a6d : 0x39f3ff, 3.6), ox, 1.95, zf + 0.26, g));
  }
  mark(S.box(0.52, S.FH - 0.2, S.FD + out * 1.5, dark, ox - xb, S.FH / 2, 0, g));
  mark(S.box(0.52, S.FH - 0.2, S.FD + out * 1.5, dark, ox + xb, S.FH / 2, 0, g));
  mark(S.box((xb - Math.abs(ox)) * 2, 0.8, 0.42, dark, ox, S.FH * 0.38, -S.FD / 2 - out * 0.45, g));
  const cols = lv === 1 ? [-8.2, -5.4, 5.4, 8.2] : [-8, -4, 0, 4, 8];
  for (const wx of cols) {
    S.box(0.62, 0.32, 0.08, lit, ox + wx, 2.2, zf + 0.28, g);
    S.box(0.36, 0.18, 0.06, lit, ox + wx + 0.15, 2.75, zf + 0.28, g);
  }
  for (const [sx, sz, neon] of [[-1, 1, mag], [1, 1, cyn], [-1, -1, cyn], [1, -1, mag]]) {
    S.box(0.2, S.FH + 0.08, 0.2, neon, ox + sx * xb, S.FH / 2, sz * (S.FD / 2 + out), g);
  }
  if (lv === 2 || lv === 3) {
    mark(S.box(2.6, S.FH - 0.35, 6.2, dark, xb + 1.15, S.FH / 2, 1.4, g));
    for (let i = 0; i < 4; i++) S.box(0.28, 0.2, 0.08, lit, xb + 2.35, 1.15 + i * 0.7, -0.6 + i * 1.1, g);
    S.box(0.14, S.FH - 0.2, 0.14, mag, xb + 2.45, S.FH / 2, 4.2, g);
  }
  if (lv === 4 || lv === 5) {
    mark(S.box(2.3, S.FH - 0.4, 5.4, dark, -xb - 0.95, S.FH / 2, -1.5, g));
    for (let i = 0; i < 3; i++) S.box(0.26, 0.18, 0.08, lit, -xb - 2.0, 1.35 + i * 0.75, -1.5, g);
    S.box(0.14, S.FH - 0.2, 0.14, cyn, -xb - 2.05, S.FH / 2, -3.9, g);
  }
}


S.B = function B(hex) {
  let m = S.basicMat.get(hex);
  if (!m) { m = new S.THREE.MeshBasicMaterial({ color: hex, toneMapped: false }); S.basicMat.set(hex, m); }
  return m;
}


S.prop = function prop(w, h, d, mat, x, y, z, parent) {
  const m = S.box(w, h, d, mat, x, y, z, parent);
  m.castShadow = m.receiveShadow = false;
  return m;
}


S.plaque = function plaque(text, ink, w, h, parent, x, y, z, ry = 0) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x2 = c.getContext('2d');
  x2.fillStyle = 'rgba(6,8,16,0.72)'; x2.fillRect(0, 0, 512, 256);
  x2.strokeStyle = ink; x2.lineWidth = 14; x2.strokeRect(12, 12, 488, 232);
  x2.fillStyle = ink; x2.textAlign = 'center'; x2.textBaseline = 'middle';
  const lines = String(text).split('\n');
  x2.font = lines.length === 1 ? '800 84px sans-serif' : '800 68px sans-serif';
  lines.forEach((line, i) => x2.fillText(line, 256, lines.length === 1 ? 132 : 88 + i * 88));
  const tex = new S.THREE.CanvasTexture(c); tex.colorSpace = S.THREE.SRGBColorSpace;
  const m = new S.THREE.Mesh(new S.THREE.PlaneGeometry(w, h), new S.THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = false; parent.add(m);
  return m;
}


S.liftY = function liftY(lv) { return (lv - 1) * S.FH + 0.2; }


S.addFloorLanding = function addFloorLanding(parent, f) {
  const yDoor = 1.2;
  const frame = S.M(0x1a2030, { metalness: 0.75, roughness: 0.3 });
  S.prop(2.3, 0.1, 1.7, frame, S.LIFT_X, 0.08, S.LIFT_Z, parent);
  S.prop(0.1, 2.3, 0.1, frame, S.LIFT_X - 1.05, yDoor, S.FD / 2 + 0.12, parent);
  S.prop(0.1, 2.3, 0.1, frame, S.LIFT_X + 1.05, yDoor, S.FD / 2 + 0.12, parent);
  S.prop(2.3, 0.1, 0.1, frame, S.LIFT_X, 2.35, S.FD / 2 + 0.12, parent);
  const leafMat = S.M(0x12161e, { metalness: 0.7, roughness: 0.35 });
  const left = S.prop(0.82, 2.05, 0.08, leafMat, S.LIFT_X - 0.46, yDoor, S.FD / 2 + 0.16, parent);
  const right = S.prop(0.82, 2.05, 0.08, leafMat, S.LIFT_X + 0.46, yDoor, S.FD / 2 + 0.16, parent);
  S.prop(0.06, 0.28, 0.06, S.B(f.id === 'exec' ? 0xfcee0a : 0x00f0ff), S.LIFT_X + 1.2, 1.25, S.FD / 2 - 0.2, parent);
  S.prop(0.9, 0.015, 0.45, S.B(f.id === 'exec' ? 0xc8a84a : 0x00f0ff), S.LIFT_X, 0.04, S.FD / 2 - 0.7, parent);
  S.plaque('LIFT', f.id === 'exec' ? '#FCEE0A' : '#d7f6ff', 0.72, 0.28, parent, S.LIFT_X, 2.15, S.FD / 2 + 0.22);
  left.userData.kind = right.userData.kind = 'lift-door';
  S.lift.doors.push({ lv: f.lv, left, right, cx: S.LIFT_X });
}


S.addRestCorner = function addRestCorner(parent, f) {
  const s = S.REST_STYLE[f.id] || S.REST_STYLE.hall;
  const cloth = S.M(s.cloth, { roughness: 0.82, metalness: 0.08 });
  const metal = S.M(0x1a2030, { metalness: 0.6, roughness: 0.4 });
  const x = 8.05, z = 4.35;
  const g = new S.THREE.Group(); g.position.set(x, 0, z); g.userData.kind = 'rest-corner'; g.userData.floorId = f.id; parent.add(g); S.restCount++;
  S.prop(2.4, 0.04, 1.5, cloth, 0, 0.04, 0, g);
  // Seat top 0.78: Mandy's sit pose, feet on the slab, puts her pelvis here.
  S.prop(2.1, 0.36, 0.7, cloth, 0, 0.60, 0.15, g);
  S.prop(2.1, 0.7, 0.16, cloth, 0, 1.03, 0.48, g);
  S.prop(0.16, 0.42, 0.7, cloth, -1.05, 0.68, 0.15, g);
  S.prop(0.16, 0.42, 0.7, cloth, 1.05, 0.68, 0.15, g);
  S.prop(2.15, 0.06, 0.08, S.B(s.accent), 0, 0.76, 0.52, g);
  S.prop(0.7, 0.08, 0.45, metal, 0.15, 0.32, -0.55, g);
  const pot = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.12, 0.14, 0.22, 8), metal);
  pot.position.set(-0.85, 0.16, -0.35); pot.castShadow = pot.receiveShadow = false; g.add(pot);
  const leaf = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.22, 8, 6), S.B(s.accent));
  leaf.position.set(-0.85, 0.48, -0.35); g.add(leaf);
  const sign = S.plaque(s.label, s.ink, 1.35, 0.48, g, 0, 1.62, 0.62);
  sign.userData.kind = 'rest-corner';
  g.traverse(o => { if (o.isMesh) o.userData.kind = 'rest-corner'; });
}


S.addGamingRoom = function addGamingRoom(parent, f) {
  const g = new S.THREE.Group(); g.position.set(8.35, 0, -2.35); g.userData.kind = 'gaming-zone'; parent.add(g);
  const shell = S.M(0x0c0e14, { metalness: 0.72, roughness: 0.32 });
  S.prop(2.4, 0.08, 0.9, shell, 0, 0.78, -0.55, g);
  S.prop(0.08, 0.74, 0.8, shell, -1.1, 0.4, -0.55, g);
  S.prop(0.08, 0.74, 0.8, shell, 1.1, 0.4, -0.55, g);
  S.prop(2.2, 0.05, 0.06, S.B(0xff2a6d), 0, 0.84, -0.12, g);
  S.prop(2.2, 0.04, 0.05, S.B(0x00f0ff), 0, 0.72, -0.95, g);
  [-0.55, 0.55].forEach(x => {
    const m = new S.THREE.Mesh(new S.THREE.PlaneGeometry(0.95, 0.58), S.screenMat('game'));
    m.position.set(x, 1.28, -0.9); m.castShadow = m.receiveShadow = false; g.add(m);
    S.prop(1.05, 0.68, 0.04, shell, x, 1.28, -0.96, g);
  });
  S.prop(0.55, 0.04, 0.22, S.M(0x222), 0, 0.84, -0.35, g);
  const pad = new S.THREE.Mesh(new S.THREE.BoxGeometry(0.28, 0.04, 0.16), S.B(0x202028));
  pad.position.set(0.35, 0.86, -0.2); g.add(pad);
  S.prop(0.45, 0.7, 0.4, shell, 1.15, 0.4, -0.7, g);
  S.prop(0.38, 0.06, 0.04, S.B(0xff2a6d), 1.15, 0.62, -0.48, g);
  S.prop(0.38, 0.04, 0.04, S.B(0x00f0ff), 1.15, 0.28, -0.48, g);
  for (const sx of [-0.5, 0.5]) {
    S.prop(0.08, 0.30, 0.08, S.M(0x141820), sx, 0.53, 0.42, g);
    S.prop(0.46, 0.1, 0.46, S.M(0x141820), sx, 0.73, 0.42, g);
    S.prop(0.4, 0.5, 0.08, S.M(0x141820), sx, 0.94, 0.64, g);
  }
  S.plaque('GAME\nLOUNGE', '#ff4d8d', 1.5, 0.55, g, 0, 1.9, -1.02);
  g.traverse(o => { if (o.isMesh) { o.userData.kind = 'gaming-zone'; o.userData.floor = f; } });
}


S.buildLiftCabin = function buildLiftCabin() {
  const cabin = new S.THREE.Group();
  S.tower.add(cabin);
  cabin.position.set(S.LIFT_X, S.liftY(6), S.LIFT_Z);
  const frame = S.M(0x161a24, { metalness: 0.78, roughness: 0.28 });
  S.prop(1.85, 0.08, 1.35, frame, 0, 0.04, 0, cabin);
  S.prop(1.85, 0.08, 1.35, S.B(0xfcee0a), 0, 2.28, 0, cabin);
  S.prop(0.08, 2.15, 1.2, frame, -0.9, 1.15, 0, cabin);
  S.prop(0.08, 2.15, 1.2, frame, 0.9, 1.15, 0, cabin);
  S.prop(1.7, 2.15, 0.06, frame, 0, 1.15, 0.62, cabin);
  S.prop(0.08, 2.15, 0.08, S.B(0xfcee0a), -0.95, 1.15, -0.62, cabin);
  S.prop(0.08, 2.15, 0.08, S.B(0x00f0ff), 0.95, 1.15, -0.62, cabin);
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const tex = new S.THREE.CanvasTexture(c); tex.colorSpace = S.THREE.SRGBColorSpace;
  const sign = new S.THREE.Mesh(new S.THREE.PlaneGeometry(0.7, 0.35), new S.THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  sign.position.set(0, 1.85, -0.7); cabin.add(sign);
  const H = S.TOPLV * S.FH + 1.4;
  const rail = S.M(0x12151c, { metalness: 0.8, roughness: 0.32 });
  for (const [dx, dz] of [[-1.05, -0.72], [1.05, -0.72], [-1.05, 0.72], [1.05, 0.72]]) {
    S.prop(0.08, H, 0.08, rail, S.LIFT_X + dx, H / 2 - 0.2, S.LIFT_Z + dz, S.tower);
  }
  S.prop(0.04, H, 0.04, S.B(0x6a5a28), S.LIFT_X - 1.12, H / 2 - 0.2, S.LIFT_Z + 0.78, S.tower);
  S.prop(0.04, H, 0.04, S.B(0x1a4a55), S.LIFT_X + 1.12, H / 2 - 0.2, S.LIFT_Z + 0.78, S.tower);
  for (let lv = 1; lv <= S.TOPLV; lv++) {
    S.prop(1.9, 0.05, 0.08, S.B(lv === S.TOPLV ? 0xc8a84a : 0x2a6a78), S.LIFT_X, S.liftY(lv) + 2.32, S.LIFT_Z + 0.7, S.tower);
  }
  S.lift.cabin = cabin;
  S.lift.label = { ctx, tex, shown: 0 };
  S.setCabinFloor(6);
}


S.setCabinFloor = function setCabinFloor(n) {
  const lab = S.lift.label; if (!lab || lab.shown === n) return;
  lab.shown = n;
  const ctx = lab.ctx;
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(8,8,12,0.8)'; ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#FCEE0A'; ctx.lineWidth = 8; ctx.strokeRect(8, 8, 240, 112);
  ctx.fillStyle = '#FCEE0A'; ctx.font = '800 72px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(n + 'F', 128, 68);
  lab.tex.needsUpdate = true;
}


S.makeAndrew = function makeAndrew(floor) {
  const g = S.makeOfficePerson('andrew');
  const { torso, head } = g.userData;
  [torso, head].forEach(m => { m.userData.floor = floor; S.pickables.push(m); });
  S.labels.push({ obj: g.userData.labelAt, text: 'Andrew 行政總監', floor });
  g.position.set(-4, 0, 0.9); g.rotation.y = Math.PI;
  return g;
}


S.markRoom = function markRoom(root) {
  root.traverse(o => { if (o.isMesh) o.layers.enable(S.LAYER_ROOM); });
}

export function initOfficeBase() {


// ---- tower ----
S.tower = new S.THREE.Group();
 S.scene.add(S.tower);

// Yellow mark on the plan is a NE–SW rectangle. The working floors rotate with it.
S.tower.rotation.y = ((S.TOWER_ROT != null) ? S.TOWER_ROT : 138) * Math.PI / 180;
S.tower.position.set(S.TOWER_X || 0, 0, S.TOWER_Z || 0);

S.FW = 22, S.FD = 14, S.FH = 4.2;

S.glass = new S.THREE.MeshPhysicalMaterial({ color: 0x24506e, transparent: true, opacity: 0.34, roughness: 0.16, metalness: 0.74, clearcoat: 1.0, clearcoatRoughness: 0.12, side: S.THREE.DoubleSide, depthWrite: true, envMapIntensity: 1.0 });

S.glassTint = new S.THREE.MeshPhysicalMaterial({ color: 0x0a2030, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.6, clearcoat: 0.8, side: S.THREE.FrontSide, depthWrite: false });

S.panelMat = new S.THREE.MeshStandardMaterial({ color: 0x0c121c, metalness: 0.7, roughness: 0.35 });

S.backWall = new S.THREE.MeshStandardMaterial({ color: 0x2a3648, metalness: 0.22, roughness: 0.74 });

S.frameMat = S.M(0x1a2030, { metalness: 0.85, roughness: 0.25 });

S.floorMat = S.M(0x354860, { roughness: 0.58 });
 S.deskMat = S.M(0x3a5068, { metalness: 0.22 });
 S.chairMat = S.M(0x34485e);

S.pickables = [], S.typers = [], S.labels = [];

S.colors = [0xf2b84b, 0x4bb3f2, 0xe25c8a, 0x7bd36a, 0xb48cf2, 0x5fd3c4];

S.execBundle = null;

S.floorGroups = [];
}

export function initFloors() {

S.screenBank = {};

S.screenCursor = 0, S.screenAcc = 0;


S.shellMat = S.glass.clone();

S.shellMat.color.set(0x101820);

S.shellMat.opacity = 0.32;

S.shellMat.roughness = 0.2;

S.FLOORS.forEach((f, idx) => {
  const h = S.hOf(f);
  const g = new S.THREE.Group(); g.position.y = (f.lv - 1) * S.FH; S.tower.add(g);
  // floor slab + lit edge strip
  S.box(S.FW + 0.4, 0.38, S.FD + 0.4, S.floorMat, 0, 0.19, 0, g);
  // opaque rear wall so interiors read against dark.
  // 3F (hb) gets a windowed back wall in addHbRichInterior instead.
  if (f.id !== 'hb') S.box(S.FW - 0.4, S.FH - 0.5, 0.25, S.backWall, 0, S.FH / 2, -S.FD / 2 + 0.2, g);
  // Dark city glass. The lobby front is a real door, not a solid pane.
  if (f.lv === 1) S.buildLobbyShell(g, f, S.shellMat);
  else {
    const shellMat = f.id === 'hb' ? S.shellMat.clone() : S.shellMat;
    if (f.id === 'hb') { shellMat.opacity = 0.16; shellMat.depthWrite = false; }
    const shell = new S.THREE.Mesh(new S.THREE.BoxGeometry(S.FW, S.FH - 0.35, S.FD), shellMat);
    shell.position.y = S.FH / 2 + 0.15; shell.userData.floor = f; g.add(shell); S.pickables.push(shell);
  }
  S.addCityFacade(g, f);
  // mullions / curtain grid — the centre mullion stops for the lobby door
  for (let i = -3; i <= 3; i++) {
    if (!(f.lv === 1 && i === 0)) S.box(0.12, S.FH - 0.2, 0.12, S.frameMat, i * S.FW / 6.5, S.FH / 2, S.FD / 2 + 0.08, g);
    S.box(0.08, S.FH - 0.2, 0.08, S.frameMat, i * S.FW / 6.5, S.FH / 2, -S.FD / 2 - 0.02, g);
  }
  for (let i = -1; i <= 1; i++) {
    S.box(0.14, S.FH, 0.14, S.frameMat, S.FW / 2 + 0.05, S.FH / 2, i * S.FD / 2, g);
    S.box(0.14, S.FH, 0.14, S.frameMat, -S.FW / 2 - 0.05, S.FH / 2, i * S.FD / 2, g);
  }
  // horizontal ledge
  S.box(S.FW + 0.5, 0.18, S.FD + 0.5, S.frameMat, 0, S.FH, 0, g);
  S.box(S.FW + 0.55, 0.06, 0.35, S.panelMat, 0, S.FH - 0.05, S.FD / 2 + 0.2, g);
  const sc = new S.THREE.Color(S.HCOL[h] || '#aab2c8');
  const strip = S.box(S.FW + 0.4, 0.1, 0.1, new S.THREE.MeshStandardMaterial({ color: sc, emissive: sc, emissiveIntensity: h === 'vacant' ? 0.15 : 2.4, toneMapped: false }), 0, S.FH - 0.02, S.FD / 2 + 0.22, g);
  // neon floor number plaque on facade
  { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 0, 256, 96);
    const accent = f.id === 'exec' ? '#FCEE0A' : (idx % 2 ? '#00F0FF' : '#FF2A6D');
    x.strokeStyle = accent; x.lineWidth = 4; x.strokeRect(6, 6, 244, 84);
    x.font = '800 48px sans-serif'; x.fillStyle = accent; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = accent; x.shadowBlur = 16; x.fillText(f.lv + 'F', 128, 48);
    const t = new S.THREE.CanvasTexture(c); t.colorSpace = S.THREE.SRGBColorSpace;
    const plaque = new S.THREE.Mesh(new S.THREE.PlaneGeometry(2.4, 0.9), new S.THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
    plaque.position.set(3.6, S.FH * 0.62, S.FD / 2 + (f.lv <= 2 ? 1.45 : 0.7)); g.add(plaque);
  }
  const coolCols = [0x00f0ff, 0x39ff14, 0xff2a6d, 0x7fe3ff, 0xfcee0a, 0xff5fa2];
  const cc = f.id === 'exec' ? 0xfcee0a : coolCols[idx % coolCols.length];
  const lamp = new S.THREE.MeshStandardMaterial({ color: 0x050810, emissive: cc, emissiveIntensity: h === 'vacant' ? 0.05 : 0.55, toneMapped: false });
  for (const lx of [-7, -2.5, 2.5, 7]) S.box(2.8, 0.05, 0.3, lamp, lx, S.FH - 0.12, 0, g);
  // interior warm fill so staff/desks read through glass
  const pl = new S.THREE.PointLight(cc, (f.id === 'exec' ? 14 : 9) * (h === 'vacant' ? 0.05 : 1), 18, 1.7); pl.position.set(0, 2.0, 1); pl.layers.set(S.LAYER_ROOM); g.add(pl);
  const fill = new S.THREE.PointLight(0xffe8c8, (f.id === 'exec' ? 9 : 5.5) * (h === 'vacant' ? 0.05 : 1), 14, 1.9); fill.position.set(0, 1.4, -2); fill.layers.set(S.LAYER_ROOM); g.add(fill);
  // ceiling cove light strip readable through glass
  S.box(S.FW - 2, 0.06, 0.2, S.E(cc, h === 'vacant' ? 0.2 : 1.6), 0, S.FH - 0.25, -S.FD / 2 + 1.2, g);
  if (f.id === 'exec') { const gl = new S.THREE.PointLight(0xfcee0a, 14, 16, 1.4); gl.position.set(-4, 2.2, -1); gl.layers.set(S.LAYER_ROOM); g.add(gl); }
  // 3F 訂車部 only (ported from PR #12). The shared floor lights above sit on
  // the room layer, which the street camera never renders, so Hailey read
  // almost black. These stay on the camera layer with a short range that dies
  // inside this storey. PR #12 used 8 point lights; this keeps the same look
  // with 5 (warm key per desk, one cool fill, cyan and magenta rims) so the
  // camera-layer light budget from PR #13 only grows from 26 to 31.
  if (f.id === 'hb') {
    const bookLight = (color, intensity, dist, x, y, z) => {
      const L = new S.THREE.PointLight(color, intensity, dist, 2);
      L.position.set(x, y, z);
      g.add(L);
    };
    // Warm key in front of each desk. The range is widened a little to also
    // cover the aisle, replacing PR #12's separate aisle key.
    bookLight(0xfff1e2, 14, 2.8, -4.5, 1.65, -1.85);
    bookLight(0xfff1e2, 14, 2.8, 4.5, 1.65, -1.85);
    // One cooler fill from the room side so a turned face is not a silhouette
    // (replaces PR #12's three fills).
    bookLight(0xc5d0e8, 7, 6.0, 0, 1.6, 1.4);
    // Short cyan and magenta rims. An edge on the hair and jacket, not a wash.
    bookLight(0x3adfff, 8, 2.05, -6.6, 1.75, 0.35);
    bookLight(0xff4b88, 7, 2.05, 6.6, 1.75, 0.35);
    // Modest hall fill so the new furniture reads from the street and
    // from the 3F inspect camera. Range still dies inside this storey.
    // Camera-layer lights: 31 -> 32.
    bookLight(0xd8e4f4, 9, 10, 0, 1.75, 0.2);
  }

  const c = S.colors[idx % S.colors.length];
  if (f.id === 'hall') {
    S.box(14, 0.15, 3, S.M(0x3a2a1a, { roughness: 0.4 }), 0, 1.05, 0, g);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const x = -5.5 + i * 2.2; S.box(0.9, 0.12, 0.9, S.chairMat, x, 0.55, s * 2.2, g); }
    { const scr = new S.THREE.Mesh(new S.THREE.PlaneGeometry(6, 2.2), S.screenMat('meet')); scr.position.set(0, 2.4, -S.FD / 2 + 0.55); scr.castShadow = scr.receiveShadow = false; g.add(scr); }
    S.glow(S.GLOW.cyan, 0, 2.4, -S.FD / 2 + 0.7, 8, 4, 0.4, g);
    // reception desk
    S.box(4, 1.1, 1.2, S.deskMat, 0, 0.55, 3.5, g);
    S.box(3.5, 0.08, 0.9, S.E(0x00f0ff, 1.2), 0, 1.15, 3.5, g);
  } else if (f.id === 'exec') {
    const gold = 0xc8a84a;
    S.box(4.2, 0.15, 2, S.M(gold, { metalness: 0.55, roughness: 0.35 }), -4, 1.05, -1, g);
    S.box(4, 0.9, 1.8, S.M(0x8a6a28, { metalness: 0.4 }), -4, 0.5, -1, g);
    { const scr = new S.THREE.Mesh(new S.THREE.PlaneGeometry(1.6, 0.9), S.screenMat('ceo')); scr.position.set(-4, 1.55, -1.55); scr.castShadow = scr.receiveShadow = false; g.add(scr); }
    S.workstation(g, 4, -1.2, 0xff2a6d, (S.FLOORS.find(x => x.id === 'exec')?.people[1] || 'Mandy').replace(/（.*）/, '') + ' 秘書', f, 0xfcee0a, 0.74, {
      deskShift: 0.34, deskY: 1.12, personZ: 1.16, seatZ: 1.39, backZ: 1.66, seatD: 0.42, seatW: 0.62, backW: 0.50, backH: 0.36, backD: 0.06, backY: 0.84,
    });
    strip.material.color.set(0xfcee0a); strip.material.emissive.set(0xfcee0a); strip.material.emissiveIntensity = 3;
  } else if ((f.people || []).length >= 3) {
    const ppl = f.people;
    S.workstation(g, -6, -1.2, c, ppl[0], f, 0x39ff14);
    S.workstation(g, 0, -1.2, S.colors[(idx + 1) % 6], ppl[1], f, 0x00f0ff);
    S.workstation(g, 6, -1.2, S.colors[(idx + 2) % 6], ppl[2], f, 0xff2a6d);
  } else if ((f.people || []).length === 2) {
    const ppl = f.people;
    const hollyIdx = ppl.findIndex(n => /Holly/i.test(n));
    const aIdx = hollyIdx === 0 ? 1 : 0, bIdx = hollyIdx >= 0 ? hollyIdx : 1;
    S.workstation(g, -4.5, -1.2, c, ppl[aIdx], f, 0x00f0ff);
    S.workstation(g, 4.5, -1.2, 0x7a8aa8, (hollyIdx >= 0 ? ppl[bIdx] + ' 準備中' : ppl[bIdx]), f, 0x7a8aa8);
    S.box(0.5, 1.6, 0.5, S.E(0xfcee0a, 1.2), 0, 0.9, 2.5, g);
  } else if (!S.isVac(f)) {
    const who = (f.people && f.people[0]) || f.name;
    if (/Penny/i.test(who)) {
      // Her sit drops the hips to about 0.50 m above the soles. The cushion
      // top has to meet that, with the backrest behind the shoulders.
      S.workstation(g, -2, -1.5, c, who, f, 0x00f0ff, 0.98, {
        deskShift: 0.28, deskY: 1.20, personZ: 1.16, seatZ: 1.08, backZ: 1.33,
        seatD: 0.42, seatW: 0.60, backW: 0.50, backH: 0.32, backD: 0.06, backY: 0.74,
      });
    } else {
      S.workstation(g, -2, -1.5, c, who, f);
    }
    S.workstation(g, 4.5, -1.5, c, null, f);
  }
  S.floorGroups.push({ g, f });
});

S.tower.traverse(o => { if (o.isMesh) o.layers.enable(S.LAYER_ROOM); });


// Decorative penthouse life. Unlit trims only — no extra point lights.
S.basicMat = new Map();

S.LIFT_X = -8.15, S.LIFT_Z = S.FD / 2 + 1.45;

S.lift = { doors: [], cabin: null, target: 6, open: 0, openTarget: 0, wantOpen: false, hold: false, idleT: 0, lv: 6, destQueue: [] };

S.restCount = 0;

S.REST_STYLE = {
  hall:   { cloth: 0x1c2433, accent: 0x7fe3ff, label: '會議休息', ink: '#7fe3ff' },
  penny:  { cloth: 0x172028, accent: 0x4bb3f2, label: '監察休息', ink: '#4bb3f2' },
  hb:     { cloth: 0x241820, accent: 0xff2a6d, label: '訂車休息', ink: '#ff5fa2' },
  auto:   { cloth: 0x121c18, accent: 0x39ff14, label: '自動化休息', ink: '#39ff14' },
  crypto: { cloth: 0x101810, accent: 0x39ff14, label: '交易休息', ink: '#7dff6a' },
  exec:   { cloth: 0x2c2416, accent: 0xfcee0a, label: '總監休息', ink: '#FCEE0A' },
};

for (const { g, f } of S.floorGroups) {
  S.addFloorLanding(g, f);
  S.addRestCorner(g, f);
  if (f.id === 'exec') { S.addGamingRoom(g, f); S.execBundle = { g, f }; }
  if (f.id === 'hb') addHbRichInterior(g, f);
}

S.buildLiftCabin();

S.andrewAgent = null;

if (S.execBundle) {
  const rig = S.makeAndrew(S.execBundle.f);
  S.execBundle.g.add(rig);
  S.prop(0.55, 0.1, 0.5, S.M(0x141820), -4, 0.5, 0.85, S.execBundle.g);
  S.prop(0.48, 0.5, 0.08, S.M(0x141820), -4, 0.75, 1.08, S.execBundle.g);
  S.andrewAgent = S.registerAgent('andrew', S.execBundle.f, S.execBundle.g, rig, -4, 0.9, Math.PI);
}

for (const { g } of S.floorGroups) S.markRoom(g);

if (S.lift.cabin) S.markRoom(S.lift.cabin);
}

export function initCrown() {


// Corner neon, brighter than the surrounding blocks so the tower stays the landmark.
S.neonH = S.TOPLV * S.FH + 9.2;

S.podX = S.FW / 2 + 1.2, S.podZ = S.FD / 2 + 1.2;

for (const [x, z, col] of [[-S.podX, S.podZ, 0xff2a6d], [S.podX, -S.podZ, 0xff2a6d], [S.podX, S.podZ, 0x39f3ff], [-S.podX, -S.podZ, 0x39f3ff]])
  S.box(0.34, S.neonH, 0.34, S.E(col, 4.8), x, S.neonH / 2, z);


S.ROOF = S.TOPLV * S.FH;

S.box(S.FW + 2.2, 0.7, S.FD + 2.2, S.M(0x141820, { metalness: 0.5, roughness: 0.48 }), 0, S.ROOF + 0.35, 0);

// Landing deck on the open front roof. Long axis is X, matching the car's nose.
S.PAD_Z = 3.8;

S.box(10.5, 0.16, 6.2, S.M(0x1a1c24, { metalness: 0.45, roughness: 0.55 }), 0, S.ROOF + 0.78, S.PAD_Z);

S.box(10.2, 0.04, 0.08, S.E(0xfcee0a, 1.6), 0, S.ROOF + 0.88, S.PAD_Z + 2.95);

S.box(10.2, 0.04, 0.08, S.E(0xfcee0a, 1.6), 0, S.ROOF + 0.88, S.PAD_Z - 2.95);

S.box(0.08, 0.04, 5.8, S.E(0x00f0ff, 1.4), 5.15, S.ROOF + 0.88, S.PAD_Z);

S.box(0.08, 0.04, 5.8, S.E(0x00f0ff, 1.4), -5.15, S.ROOF + 0.88, S.PAD_Z);

{ const hc = document.createElement('canvas'); hc.width = hc.height = 256; const hx = hc.getContext('2d');
  hx.strokeStyle = '#FCEE0A'; hx.lineWidth = 10; hx.beginPath(); hx.arc(128, 128, 100, 0, Math.PI * 2); hx.stroke();
  hx.font = '800 120px sans-serif'; hx.fillStyle = '#FCEE0A'; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillText('H', 128, 138);
  const ht = new S.THREE.CanvasTexture(hc); ht.colorSpace = S.THREE.SRGBColorSpace;
  const hm = new S.THREE.Mesh(new S.THREE.PlaneGeometry(4.6, 4.6), new S.THREE.MeshBasicMaterial({ map: ht, transparent: true, toneMapped: false }));
  hm.rotation.x = -Math.PI / 2; hm.position.set(0, S.ROOF + 0.88, S.PAD_Z); S.scene.add(hm); }

// Penthouse sits on the back half so the street side of the roof stays a landing deck.
S.pent = S.box(S.FW - 4, 3.2, 7.2, S.M(0x10141c, { metalness: 0.45, roughness: 0.5 }), 0, S.ROOF + 2.4, -4.4);

for (let i = -2; i <= 2; i++) S.box(0.42, 0.22, 0.08, S.E(0xe7f7ff, 3.2), i * 1.6, S.ROOF + 3.3, -0.7);

S.box(0.16, 3.0, 0.16, S.E(0xff2a6d, 4.4), -(S.FW - 4) / 2, S.ROOF + 2.4, -4.4);

S.box(0.16, 3.0, 0.16, S.E(0x39f3ff, 4.4), (S.FW - 4) / 2, S.ROOF + 2.4, -4.4);


// Hex H as a roof hologram. No backing board. One additive shader plane,
// a short glitch every few seconds, and a faint beam from a roof emitter.
{
  const crownH = 34;
  const shaft = S.box(8.4, crownH, 5.4, S.M(0x12161c, { metalness: 0.62, roughness: 0.32 }), 0, S.ROOF + crownH / 2, 0, S.tower);
  shaft.userData.planHide = true;
  [-1, 1].forEach(s => {
    S.box(0.14, crownH - 2, 0.14, S.E(0xff2a6d, 2.6), s * 4.3, S.ROOF + crownH / 2, s * 2.75, S.tower);
    S.box(0.14, crownH - 2, 0.14, S.E(0x39f3ff, 2.2), s * -4.3, S.ROOF + crownH / 2, s * 2.75, S.tower);
  });
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const hPx = 512 / 8.4;
  const to = (x, y) => [256 + x * hPx, 256 - y * hPx];
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const hex = (r, thick, color) => {
    g.strokeStyle = color;
    g.lineWidth = thick * hPx;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const p = to(Math.cos(a) * r, Math.sin(a) * r);
      if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
    }
    g.closePath();
    g.stroke();
  };
  hex(3.15, 0.18, '#7ef6ff');
  hex(2.55, 0.14, '#d8fbff');
  g.strokeStyle = '#ff4d8d';
  g.lineWidth = 0.5 * hPx;
  g.beginPath();
  let a = to(-0.72, 1.28), b = to(-0.72, -1.28);
  g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
  a = to(0.72, 1.28); b = to(0.72, -1.28);
  g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
  g.stroke();
  g.save();
  g.translate(256, 256);
  g.rotate(0.12);
  g.beginPath();
  g.moveTo(-0.9 * hPx, 0.04 * hPx);
  g.lineTo(0.9 * hPx, -0.04 * hPx);
  g.stroke();
  g.restore();
  const tex = new S.THREE.CanvasTexture(c);
  tex.colorSpace = S.THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new S.THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: S.THREE.AdditiveBlending,
    side: S.THREE.DoubleSide,
    toneMapped: false,
    uniforms: { uMap: { value: tex }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D uMap; uniform float uTime; varying vec2 vUv;',
      'float hash(float n){ return fract(sin(n) * 43758.5453); }',
      'void main(){',
      '  float period = 3.8;',
      '  float cycle = floor(uTime / period);',
      '  float local = fract(uTime / period);',
      '  float burst = step(0.22, hash(cycle)) * smoothstep(0.10, 0.16, local) * (1.0 - smoothstep(0.30, 0.40, local));',
      '  float band = floor(vUv.y * 24.0);',
      '  float br = hash(band * 13.7 + cycle * 9.2);',
      '  float shift = burst * step(0.74, br) * (br - 0.5) * 0.14;',
      '  vec2 uv = vUv + vec2(shift, 0.0);',
      '  float split = burst * (0.006 + step(0.74, br) * 0.012);',
      '  vec4 sR = texture2D(uMap, uv + vec2(split, 0.0));',
      '  vec4 sG = texture2D(uMap, uv);',
      '  vec4 sB = texture2D(uMap, uv - vec2(split, 0.0));',
      '  vec3 col = vec3(sR.r, sG.g, sB.b);',
      '  float a = max(sG.a, max(sR.a, sB.a));',
      '  if (a < 0.04) discard;',
      '  float scan = 0.74 + 0.26 * sin(vUv.y * 170.0 + uTime * 5.0);',
      '  float flick = 0.94 + 0.06 * sin(uTime * 8.0);',
      '  flick *= 1.0 - burst * 0.34 * step(0.62, hash(floor(uTime * 26.0) + cycle));',
      '  gl_FragColor = vec4(col * scan * flick * 1.25, a * flick);',
      '}',
    ].join('\n'),
  });
  const mesh = new S.THREE.Mesh(new S.THREE.PlaneGeometry(8.4, 8.4), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.userData.planHide = true;
  S.scene.add(mesh);
  const anchor = new S.THREE.Object3D();
  anchor.position.set(0, S.ROOF + crownH + 7.2, 0);
  S.tower.add(anchor);
  const emitter = S.box(0.7, 0.32, 0.7, S.E(0xff4d8d, 2.4), -6.2, S.ROOF + 0.5, -4.8, S.tower);
  emitter.userData.planHide = true;
  const beamMat = new S.THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: S.THREE.AdditiveBlending,
    side: S.THREE.DoubleSide,
    toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.2) * 0.42; gl_FragColor = vec4(1.0, 0.42, 0.72, a); }',
  });
  const beam = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.28, 1.35, 1, 12, 1, true), beamMat);
  const from = new S.THREE.Vector3(-6.2, S.ROOF + 0.7, -4.8);
  const beamEnd = anchor.position.clone();
  const dir = new S.THREE.Vector3().subVectors(beamEnd, from);
  const len = dir.length();
  beam.scale.set(1, len, 1);
  beam.position.copy(from).add(beamEnd).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new S.THREE.Vector3(0, 1, 0), dir.clone().normalize());
  beam.userData.planHide = true;
  S.tower.add(beam);
  const glow = new S.THREE.PointLight(0xff4d8d, 18, 28, 1.6);
  glow.position.copy(beamEnd);
  S.tower.add(glow);
  window.__holoLogo = { mesh, mat, anchor };
  window.__signY = beamEnd.y;
}
}



S.applyTowerFootprintScale = function applyTowerFootprintScale() {
  if (!S.tower) return;
  const builtW = S.FW || 22, builtD = S.FD || 14;
  const fw = S.TOWER_FW || builtW, fd = S.TOWER_FD || builtD;
  const sx = fw / builtW, sz = fd / builtD;
  S.tower.position.set(S.TOWER_X || 0, 0, S.TOWER_Z || 0);
  S.tower.rotation.y = ((S.TOWER_ROT != null) ? S.TOWER_ROT : 138) * Math.PI / 180;
  S.tower.scale.set(sx, 1, sz);
  const invX = sx ? 1 / sx : 1, invZ = sz ? 1 / sz : 1;
  const unscale = (rig) => { if (rig && rig.scale) rig.scale.set(invX, 1, invZ); };
  const underTower = (o) => { let n = o; while (n) { if (n === S.tower) return true; n = n.parent; } return false; };
  if (S.cast) {
    S.cast.forEach(a => { if (a.rig && underTower(a.rig)) unscale(a.rig); });
  }
  // Rigs are the groups that carry head/torso userData.
  S.tower.traverse(o => {
    if (o && o.userData && (o.userData.head || o.userData.torso)) unscale(o);
  });
  S.tower.updateMatrixWorld(true);
  if (S.refreshHbInspect) S.refreshHbInspect();
};
