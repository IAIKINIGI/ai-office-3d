import { S } from './scope.js';

// 3F 訂車部 only. Original procedural furniture + neon. No new point lights
// (PR #12's five camera-layer lights stay as they are). Does not load
// characters, the CC-BY-SA prop pack, or Penny's Sketchfab Standard GLB.

function tube(len, axis, color, x, y, z, parent) {
  const geo = new S.THREE.CylinderGeometry(0.03, 0.03, len, 8);
  const m = new S.THREE.Mesh(geo, S.E(color, 2.4));
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = m.receiveShadow = false;
  parent.add(m);
  return m;
}

function neonSign(parent, text, x, y, z, color, w = 4.2, h = 0.7) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 192);
  ctx.font = 'bold 92px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.fillText(text, 512, 96);
  const tex = new S.THREE.CanvasTexture(c);
  tex.colorSpace = S.THREE.SRGBColorSpace;
  const mat = new S.THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
  const mesh = new S.THREE.Mesh(new S.THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function nameplate(parent, x, y, z, name, role, ink) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = '#e8e8f0';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(name, 28, 64);
  ctx.fillStyle = ink;
  ctx.font = '26px sans-serif';
  ctx.fillText(role, 28, 104);
  const tex = new S.THREE.CanvasTexture(c);
  tex.colorSpace = S.THREE.SRGBColorSpace;
  const mesh = new S.THREE.Mesh(
    new S.THREE.BoxGeometry(0.55, 0.14, 0.03),
    new S.THREE.MeshStandardMaterial({
      map: tex, roughness: 0.35, metalness: 0.4,
      emissive: new S.THREE.Color(ink), emissiveIntensity: 0.25, emissiveMap: tex,
    })
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function plant(parent, x, z, scale = 1) {
  const g = new S.THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const pot = new S.THREE.Mesh(
    new S.THREE.CylinderGeometry(0.14, 0.16, 0.22, 10),
    S.M(0x2a1810, { roughness: 0.8 })
  );
  pot.position.y = 0.11;
  g.add(pot);
  const leaf = S.M(0x1f5a3a, { roughness: 0.7 });
  for (let i = 0; i < 7; i++) {
    const s = new S.THREE.Mesh(new S.THREE.SphereGeometry(0.14, 8, 6), leaf);
    s.position.set(Math.cos(i * 0.9) * 0.13, 0.4 + (i % 3) * 0.1, Math.sin(i * 0.9) * 0.13);
    s.scale.set(1, 0.7, 1);
    g.add(s);
  }
  parent.add(g);
  return g;
}

function shelf(parent, x, z, yaw) {
  const g = new S.THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  const wood = S.M(0x1a1a24, { metalness: 0.2, roughness: 0.5 });
  S.prop(1.2, 1.85, 0.32, wood, 0, 0.92, 0, g);
  S.prop(1.16, 1.76, 0.04, S.M(0x0c0c14), 0, 0.92, -0.12, g);
  for (let s = 0; s < 4; s++) {
    const y = 0.28 + s * 0.42;
    S.prop(1.14, 0.03, 0.28, wood, 0, y, 0, g);
    for (let b = 0; b < 8; b++) {
      const col = new S.THREE.Color().setHSL((b * 40 + s * 20) / 360, 0.4, 0.28);
      S.prop(0.08, 0.22 + (b % 3) * 0.04, 0.18, S.M(col.getHex()), -0.46 + b * 0.13, y + 0.13, 0.02, g);
    }
  }
  S.prop(1.2, 0.015, 0.04, S.E(0x00f0ff, 1.6), 0, 1.86, 0.14, g);
  parent.add(g);
  return g;
}

function serverRack(parent, x, z, yaw) {
  const g = new S.THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  const frame = S.M(0x101018, { metalness: 0.7, roughness: 0.3 });
  S.prop(0.7, 1.9, 0.55, frame, 0, 0.95, 0, g);
  for (let u = 0; u < 12; u++) {
    const y = 0.18 + u * 0.14;
    S.prop(0.62, 0.1, 0.5, S.M(u % 3 === 0 ? 0x1a1a28 : 0x16161f, { metalness: 0.5 }), 0, y, 0.02, g);
    for (let k = 0; k < 4; k++) {
      const led = S.prop(0.03, 0.03, 0.01, S.E(k % 2 ? 0x00f0ff : 0x39ff14, 2.0), -0.22 + k * 0.08, y, 0.28, g);
      if (!S._hbBlink) S._hbBlink = [];
      S._hbBlink.push(led.material);
    }
  }
  S.prop(0.7, 0.02, 0.55, S.E(0xff2a6d, 1.4), 0, 1.91, 0, g);
  parent.add(g);
  return g;
}

function keyboard(parent, x, y, z) {
  S.prop(0.5, 0.02, 0.16, S.M(0x15151c, { metalness: 0.4 }), x, y, z, parent);
  const key = S.M(0x2a2a36, { metalness: 0.3, roughness: 0.4 });
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      S.prop(0.028, 0.01, 0.028, key, x - 0.2 + c * 0.034, y + 0.012, z - 0.05 + r * 0.032, parent);
    }
  }
}

function windowedBackWall(parent) {
  const z = -S.FD / 2 + 0.2;
  const wall = S.backWall;
  S.prop(S.FW - 0.4, 0.9, 0.25, wall, 0, 0.45, z, parent);
  S.prop(S.FW - 0.4, 0.55, 0.25, wall, 0, S.FH - 0.42, z, parent);
  for (let i = -4; i <= 4; i++) {
    S.prop(0.26, S.FH - 1.15, 0.25, wall, i * 2.5, S.FH / 2, z, parent);
  }
  const glass = new S.THREE.MeshStandardMaterial({
    color: 0x081018, transparent: true, opacity: 0.14, metalness: 0.8, roughness: 0.06,
    emissive: 0x00f0ff, emissiveIntensity: 0.04, depthWrite: false,
  });
  for (let i = -3; i <= 3; i++) {
    S.prop(2.2, 1.85, 0.04, glass, i * 2.5, 1.75, z + 0.08, parent);
    tube(2.15, 'x', i % 2 ? 0xff2a6d : 0x00f0ff, i * 2.5, 2.72, z + 0.14, parent);
  }

  // Cheap skyline card behind the openings so the view reads even when
  // the street city is not aligned with this wall.
  const sky = new S.THREE.Group();
  sky.position.set(0, 0, z - 1.4);
  parent.add(sky);
  // Night plate behind the openings so the windows never read as a black hole.
  S.prop(S.FW, 3.6, 0.08, S.M(0x0a1020, { metalness: 0.1, roughness: 0.8, emissive: 0x152038, emissiveIntensity: 0.35 }), 0, 1.7, -0.5, sky);
  for (let i = 0; i < 16; i++) {
    const bw = 0.7 + (i % 3) * 0.25;
    const bh = 1.8 + (i * 17) % 22 / 10;
    const bx = -9 + i * 1.2;
    S.prop(bw, bh, 0.6, S.M(0x101018, { metalness: 0.4, roughness: 0.6, emissive: 0x1a2030, emissiveIntensity: 0.2 }), bx, bh / 2, 0, sky);
    const lit = S.E(i % 2 ? 0xff2a6d : 0x00f0ff, 2.2);
    for (let wy = 0; wy < 4; wy++) {
      S.prop(0.1, 0.1, 0.02, lit, bx - 0.15, 0.35 + wy * 0.35, 0.32, sky);
      S.prop(0.1, 0.1, 0.02, lit, bx + 0.15, 0.4 + wy * 0.35, 0.32, sky);
    }
  }
}

export function addHbRichInterior(parent, floor) {
  const g = new S.THREE.Group();
  g.userData.kind = 'hb-interior';
  parent.add(g);

  windowedBackWall(g);

  // Ceiling neon (emissive only). Clear of the existing cove strip.
  tube(S.FW - 1.2, 'x', 0x00f0ff, 0, S.FH - 0.22, -S.FD / 2 + 0.7, g);
  tube(S.FW - 1.2, 'x', 0xff2a6d, 0, S.FH - 0.22, S.FD / 2 - 0.7, g);
  tube(S.FD - 1.2, 'z', 0x00f0ff, -S.FW / 2 + 0.7, S.FH - 0.22, 0, g);
  tube(S.FD - 1.2, 'z', 0xff2a6d, S.FW / 2 - 0.7, S.FH - 0.22, 0, g);

  neonSign(g, '3F  訂車部', 0, 3.15, -S.FD / 2 + 0.45, '#00f0ff', 4.6, 0.72);
  const hex = S.plaque('H', '#ff2a6d', 0.7, 0.7, g, 0, 3.55, -S.FD / 2 + 0.48);

  // Desks stay where initFloors placed them: Hailey (-4.5, -1.2), Holly (4.5, -1.2).
  nameplate(g, -4.5, 1.16, -1.2 + 0.72, 'Hailey', 'PACE / 1Link MOT', '#00f0ff');
  nameplate(g, 4.5, 1.16, -1.2 + 0.72, 'Holly', 'Halfords 候補', '#ff5fa2');
  keyboard(g, -4.5, 1.08, -1.2 + 0.2);
  keyboard(g, 4.5, 1.08, -1.2 + 0.2);

  // Left wall: racks + shelf. Lift landing is further forward at x=-8.15, z≈8.4.
  serverRack(g, -9.6, -3.4, Math.PI / 2);
  serverRack(g, -9.6, -1.5, Math.PI / 2);
  shelf(g, -9.6, 1.6, Math.PI / 2);

  plant(g, -9.2, -5.5, 1.1);
  plant(g, 0, -5.6, 0.95);
  plant(g, 9.2, -5.5, 1.1);
  plant(g, -6.2, 5.0, 0.9);
  // Rest corner already sits at (8.05, 4.35); a plant just west of it.
  plant(g, 5.6, 5.1, 0.85);

  g.traverse((o) => {
    if (o.isMesh) {
      o.userData.kind = 'hb-interior';
      o.userData.floor = floor;
    }
  });
  // Whole 3F group (desks, chairs, rest corner, new props, characters later)
  // also gets the hb fill layer.
  parent.traverse((o) => {
    if (o.isMesh) o.layers.enable(S.LAYER_HB);
  });
  const fy = (floor.lv - 1) * S.FH;
  S.tower.updateMatrixWorld(true);
  // Just behind the desk line, looking at both workstations, the neon sign
  // and the window wall. Further back the glass shell can fill the frame.
  S.HB_POS = S.tower.localToWorld(new S.THREE.Vector3(0, fy + 1.82, 0.55));
  S.HB_TGT = S.tower.localToWorld(new S.THREE.Vector3(0, fy + 1.35, -5.2));
  S.HB_HAILEY_POS = S.tower.localToWorld(new S.THREE.Vector3(-4.8, fy + 1.45, 1.7));
  S.HB_HAILEY_TGT = S.tower.localToWorld(new S.THREE.Vector3(-6.0, fy + 1.05, -0.2));
  window.__HB_POS = S.HB_POS;
  window.__HB_TGT = S.HB_TGT;
  window.__HB_HAILEY_POS = S.HB_HAILEY_POS;
  window.__HB_HAILEY_TGT = S.HB_HAILEY_TGT;
  return g;
}
