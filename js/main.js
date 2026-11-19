import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../assets/city/meshopt_decoder.module.js';
import { DRACOLoader } from '../assets/vehicles/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { S } from './scope.js';
import { initShared } from './shared.js';
import { initCitySky, initVehicles, initProps, initDistrict } from './city.js';
import { initOfficeBase, initFloors, initCrown } from './office.js';
import { initCast, initLife, initCrowd, initProof } from './characters.js';
import { initHighway } from './highway.js';
import { initHud } from './ui.js';

S.THREE = THREE;
S.OrbitControls = OrbitControls;
S.EffectComposer = EffectComposer;
S.RenderPass = RenderPass;
S.UnrealBloomPass = UnrealBloomPass;
S.OutputPass = OutputPass;
S.GLTFLoader = GLTFLoader;
S.MeshoptDecoder = MeshoptDecoder;
S.DRACOLoader = DRACOLoader;
S.SkeletonUtils = SkeletonUtils;
S.mergeGeometries = mergeGeometries;



S.qText = function qText() {
  const label = S.Q_TIERS[S.qTier].label;
  if (S.qMode === 'auto') return S.qTier === 0 ? '畫質 · 自動' : `畫質 · 自動 · ${label}`;
  return S.qMode === 'high' ? '畫質 · 高畫質' : '畫質 · 流暢';
}


S.applyQuality = function applyQuality() {
  const t = S.Q_TIERS[S.qTier];
  const cap = Math.min(devicePixelRatio || 1, t.dpr);
  S.renderer.setPixelRatio(cap);
  S.renderer.shadowMap.enabled = t.shadow;
  S.renderer.shadowMap.type = t.soft ? S.THREE.PCFSoftShadowMap : S.THREE.PCFShadowMap;
  S.renderer.shadowMap.needsUpdate = true;
  S.moon.shadow.mapSize.set(t.map, t.map);
  if (S.moon.shadow.map) { S.moon.shadow.map.dispose(); S.moon.shadow.map = null; }
  S.renderer.setSize(innerWidth, innerHeight);
  S.composer.setSize(innerWidth, innerHeight);
  S.composer.setPixelRatio(cap);
  S.bloomPass.setSize(Math.max(2, innerWidth * cap * t.bloom), Math.max(2, innerHeight * cap * t.bloom));
  S.gndMat.clearcoat = t.coat; S.gndMat.needsUpdate = true;
  S.glass.clearcoat = t.coat; S.glass.needsUpdate = true;
  if (S.qBtn) S.qBtn.textContent = S.qText();
}


S.observeQuality = function observeQuality(elapsed, frameMs) {
  if (S.qMode !== 'auto' || elapsed < S.INTRO + 0.5) return;
  if (frameMs > 4000) return; // ignore a one-off shader compile, keep real slow frames
  S.qGaps.push(frameMs);
  if (S.qGaps.length < 10) return;
  const s = S.qGaps.slice().sort((a, b) => a - b);
  const p50 = s[4];
  S.qGaps = [];
  if (p50 > 34 && S.qTier < S.Q_TIERS.length - 1) { S.qTier++; S.applyQuality(); }
}


S.tick = function tick() {
  const nowMs = performance.now();
  const frameMs = nowMs - S.qPrevMs; S.qPrevMs = nowMs;
  const t = S.clock.getElapsedTime(), dt = Math.min(t - S.last, 0.05); S.last = t;
  if (document.hidden) { requestAnimationFrame(tick); return; }
  if (window.__LOCK_CAM) {
    S.camera.position.copy(window.__LOCK_CAM.pos);
    S.controls.target.copy(window.__LOCK_CAM.tgt);
    S.camera.lookAt(S.controls.target);
    S.controls.enabled = false;
  } else if (t < S.INTRO) {
    const k = S.ease(t / S.INTRO);
    S.camera.position.lerpVectors(S.CAM_START, S.CAM_END, k);
    S.controls.target.y = S.TGT_Y + 4 * (1 - k);
  } else if (!S.controls.enabled) { S.controls.enabled = true; }
  if (!window.__LOCK_CAM && t >= S.INTRO && S.panel && !S.panel.classList.contains('open')) {
    S.ceoInspect = false;
    S.hbInspect = false;
  }
  if (!window.__LOCK_CAM && t >= S.INTRO && !S.userTook) {
    const want = S.ceoInspect ? 1 : 0;
    S.ceoBlend += (want - S.ceoBlend) * 0.045;
    if (S.ceoBlend > 0.004 && !S.hbInspect) {
      S.controls.minDistance = 8;
      S.camHomeTgt.y = S.focusY != null ? S.focusY : S.TGT_Y;
      S.camera.position.lerpVectors(S.CAM_END, S.CEO_POS, S.ceoBlend);
      S.controls.target.lerpVectors(S.camHomeTgt, S.CEO_TGT, S.ceoBlend);
    } else if (!S.hbInspect && S.hbBlend <= 0.004) S.controls.minDistance = 22;
  }
  // 3F inspect: dolly inside the booking floor when the user clicks 3F.
  // Runs even after a prior orbit so the floor click always frames the room.
  if (!window.__LOCK_CAM && t >= S.INTRO && S.HB_POS && S.HB_TGT) {
    const wantHb = S.hbInspect ? 1 : 0;
    S.hbBlend += (wantHb - S.hbBlend) * 0.07;
    if (S.hbBlend > 0.004) {
      S.controls.minDistance = 5;
      S.camera.position.lerp(S.HB_POS, 0.085);
      S.controls.target.lerp(S.HB_TGT, 0.085);
    } else if (!(S.ceoBlend > 0.004 && !S.userTook)) {
      S.controls.minDistance = 22;
    }
  }
  if (S.setHbRoomView) S.setHbRoomView(!!(S.hbInspect || S.hbBlend > 0.05 || (S.cameraNearHb && S.cameraNearHb())));
  const wantFov = window.__LOCK_CAM ? S.camera.fov : ((S.hbInspect || S.hbBlend > 0.15) ? 72 : 42);
  if (Math.abs(S.camera.fov - wantFov) > 0.05) {
    S.camera.fov += (wantFov - S.camera.fov) * 0.14;
    S.camera.updateProjectionMatrix();
  }
  window.__hbInspect = S.hbInspect;
  window.__hbBlend = S.hbBlend;

  S.typers.forEach(p => { p.armL.rotation.x = Math.sin(t * 10 + p.ph) * 0.25; p.armR.rotation.x = Math.cos(t * 10 + p.ph) * 0.25; p.head.rotation.y = Math.sin(t * 0.7 + p.ph) * 0.3; if (p.legL) { p.legL.rotation.x = Math.sin(t * 8 + p.ph) * 0.15; p.legR.rotation.x = Math.cos(t * 8 + p.ph) * 0.15; } });
  if (window.__streetGirls) S.updateStreetGirls(dt, t);
  S.cars.forEach(c => {
    if (c.route) {
      c.u = (c.u + dt * c.routeSpeed) % 1;
      const p = S.pointOnLoop(c.route, c.u);
      const n = S.pointOnLoop(c.route, c.u + 0.012);
      const bob = c.hoverHeight != null ? Math.sin(t * 2.2 + c.u * 6) * 0.045 : (c.fly ? Math.sin(t * 1.3 + c.u * 8) * 0.35 : 0);
      const y = (c.hoverHeight != null ? c.hoverHeight : p.y) + bob;
      c.g.position.set(p.x, y, p.z);
      const dx = n.x - p.x, dz = n.z - p.z;
      if (dx * dx + dz * dz > 1e-6) c.g.rotation.y = Math.atan2(dx, dz) + (c.yaw0 == null ? -Math.PI / 2 : c.yaw0);
      return;
    }
    if (!c.speed) return;
    c.g.position.x += c.speed * dt;
    // hero ground cars stay in close-shot band
    if (c.hero && !c.fly) {
      if (c.g.position.x > 22) c.g.position.x = -22;
      if (c.g.position.x < -22) c.g.position.x = 22;
    } else {
      if (c.g.position.x > 70) c.g.position.x = -70;
      if (c.g.position.x < -70) c.g.position.x = 70;
    }
    if (c.fly && c.baseY != null) {
      c.g.position.y = c.baseY + Math.sin(t * 1.2 + (c.ph || 0)) * 0.4;
      const lo = c.laneMin != null ? c.laneMin : -55;
      const hi = c.laneMax != null ? c.laneMax : -30;
      if (c.g.position.x > hi) c.g.position.x = lo;
      if (c.g.position.x < lo) c.g.position.x = hi;
      // hard keep clear of tower column |x|<18
      if (Math.abs(c.g.position.x) < 18) c.g.position.x = c.g.position.x < 0 ? -32 : 36;
    } else if (c.hover) c.g.position.y = 0.5 + Math.sin(t * 3 + c.g.position.x) * 0.1;
  });
  S.pedestrians.forEach(p => {
    if (p.speed) {
      p.g.position.x += p.speed * dt;
      if (p.speed > 0 && p.g.position.x > p.x1) p.g.position.x = p.x0;
      if (p.speed < 0 && p.g.position.x < p.x0) p.g.position.x = p.x1;
    }
    const u = p.g.userData;
    if (!u.legL) return;
    if (p.mode === 'walk' || u.mode === 'walk') {
      const spd = 6.5 + (p.ph % 3);
      const swing = Math.sin(t * spd + p.ph);
      u.legL.rotation.x = swing * 0.75; u.legR.rotation.x = -swing * 0.75;
      u.armL.rotation.x = -swing * 0.55;
      if (u.mode !== 'phone') u.armR.rotation.x = swing * 0.55;
      p.g.position.y = Math.abs(swing) * 0.045;
    } else if (p.mode === 'stand') {
      u.head.rotation.y = Math.sin(t * 0.6 + p.ph) * 0.35;
      u.armL.rotation.x = -0.25 + Math.sin(t * 1.2 + p.ph) * 0.1;
    }
  });
  S.mixers.forEach(m => m.update(dt));
  if (typeof S.syncProof === 'function') S.syncProof(dt);
  if (window.__drone) {
    const d = window.__drone;
    d.position.x = 17 + Math.sin(t * 0.35) * 6;
    d.position.z = 28 + Math.cos(t * 0.35) * 4;
    d.position.y = 2.2 + Math.sin(t * 2.2) * 0.25;
    d.rotation.y = t * 0.5;
  }
  if (window.__sidewalkBot) {
    const b = window.__sidewalkBot;
    b.position.x = -16 + ((t * 1.4) % 20);
    if (b.position.x > 4) b.position.x = -16;
    b.position.z = 33 + Math.sin(t * 0.8) * 0.3;
  }
  if (window.__stallSteam) {
    const a = window.__stallSteam.geometry.attributes.position;
    for (let j = 1; j < a.array.length; j += 3) { a.array[j] += 0.8 * dt; if (a.array[j] > 1.2) a.array[j] = 0; }
    a.needsUpdate = true;
  }

  S.monoCar.position.x += 11 * dt; if (S.monoCar.position.x > 48) S.monoCar.position.x = -48;
  if (window.__DIAG_LIGHT && !window.__diagOn) {
    const diag = new S.THREE.DirectionalLight(0xffffff, 3.4);
    diag.position.set(1.2, 3.2, 4);
    S.scene.add(diag);
    S.scene.add(new S.THREE.AmbientLight(0xffffff, 0.7));
    window.__diagOn = true;
  }
  if (window.__roofFlyer) {
    const f = window.__roofFlyer;
    const cyc = 26;
    const u = window.__flyerU != null ? window.__flyerU : (t % cyc) / cyc;
    const pad = S.ROOF_PAD;
    const hover = pad.y + 16;
    let x = pad.x, y = hover, z = pad.z, yaw = 0;
    if (u < 0.28) {
      const k = u / 0.28;
      x = -42 + (pad.x + 6 - -42) * k;
      y = hover + 6 * (1 - k);
      z = pad.z + 10 * (1 - k);
      yaw = 0.4;
    } else if (u < 0.46) {
      const k = (u - 0.28) / 0.18;
      const e = k * k * (3 - 2 * k);
      x = pad.x + 6 * (1 - e);
      y = hover + (pad.y - hover) * e;
      z = pad.z;
      yaw = 0.15 * (1 - e);
    } else if (u < 0.70) {
      x = pad.x; y = pad.y; z = pad.z; yaw = 0;
    } else {
      const k = (u - 0.70) / 0.30;
      const e = k * k;
      x = pad.x + 48 * e;
      y = pad.y + (hover + 8 - pad.y) * e;
      z = pad.z - 6 * e;
      yaw = -0.3 * k;
    }
    f.position.set(x, y, z);
    f.rotation.y = yaw;
    f.rotation.z = (y > pad.y + 1) ? Math.sin(t * 1.4) * 0.04 : 0;
  }
  S.avs.forEach(a => {
    a.g.position.x += a.speed * dt * (a.side || 1);
    if (a.side && a.side < 0) { if (a.g.position.x > -30) a.g.position.x = -55; if (a.g.position.x < -55) a.g.position.x = -30; }
    else { if (a.g.position.x > 55) a.g.position.x = 30; if (a.g.position.x < 30) a.g.position.x = 55; }
    if (Math.abs(a.g.position.x) < 22) a.g.position.x = (a.side || 1) < 0 ? -36 : 40;
    a.g.position.y = a.y + Math.sin(t * 1.2 + a.ph) * 0.4;
  });
  // holograms
  S.koi.position.set(-24 + Math.sin(t * 0.35) * 3, 20 + Math.sin(t * 0.55) * 1.4, 2 + Math.cos(t * 0.3) * 2);
  S.koi.material.rotation = Math.sin(t * 0.4) * 0.12;
  S.koi.material.opacity = 0.75 + Math.sin(t * 2.2) * 0.15;
  S.dancer.position.y = 16 + Math.sin(t * 0.5) * 0.8;
  S.dancer.material.opacity = 0.7 + Math.sin(t * 3.5) * 0.18;
  if (window.__corpEmblem) window.__corpEmblem.material.opacity = 0.85 + Math.sin(t * 4.2) * 0.12;
  if (window.__holoLogo) {
    const h = window.__holoLogo;
    h.anchor.getWorldPosition(h.mesh.position);
    h.mesh.quaternion.copy(S.camera.quaternion);
    h.mat.uniforms.uTime.value = t;
  }
  S.neonFlickers.forEach((p, i) => { if (!p.userData.ready) return; p.material.opacity = 0.94 + Math.sin(t * 1.5 + i) * 0.05; });
  if (S.rain) { const a = S.rain.geometry.attributes.position; for (let i = 1; i < a.array.length; i += 3) { a.array[i] -= 50 * dt; if (a.array[i] < 0) a.array[i] = 95; } a.needsUpdate = true; }
  if (window.__rainLines) { const a = window.__rainLines.geometry.attributes.position; for (let i = 1; i < a.array.length; i += 3) { a.array[i] -= 65 * dt; if (a.array[i] < 0) a.array[i] = 95; } a.needsUpdate = true; }
  S.steams.forEach((p, i) => { const a = p.geometry.attributes.position; for (let j = 1; j < a.array.length; j += 3) { a.array[j] += (0.9 + i * 0.05) * dt; if (a.array[j] > 4.5) a.array[j] = 0; } a.needsUpdate = true; });
  if (typeof S.glitchHolos !== 'undefined') {
    S.glitchHolos.forEach((h, i) => {
      const flick = 0.28 + 0.35 * Math.abs(Math.sin(t * (4.5 + i) + h.ph));
      h.mats.forEach((m, mi) => { if (m && m.opacity != null) m.opacity = flick * (mi === 0 ? 1 : 0.7 + 0.3 * Math.sin(t * 9 + mi)); });
      h.g.rotation.y = Math.sin(t * 0.7 + h.ph) * 0.08;
    });
  }

  // hero events every 18–35s
  // hero fly-bys disabled

  if (!window.__LOCK_CAM) {
    if (!(S.ceoBlend > 0.004 && !S.userTook) && !S.hbInspect && S.hbBlend <= 0.004 && S.focusY != null) S.controls.target.y += (S.focusY - S.controls.target.y) * 0.06;
    S.controls.update();
  }
  if (!window.__neonReady) window.__neonReady = S.commitNeon();
  if (!window.__PAUSE_LIFE) S.stepLife(window.__SIM_DT > 0 ? window.__SIM_DT : dt);
  S.updateScreens(dt);

  // project labels — keep floor tags clear of top HUD (y > 90)
  S.labels.forEach(l => {
    l.obj.getWorldPosition(S.v); S.v.project(S.camera);
    const x = (S.v.x * 0.5 + 0.5) * innerWidth, y = (-S.v.y * 0.5 + 0.5) * innerHeight;
    l.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
    l.el.style.display = S.v.z > 1 || x < 0 || x > innerWidth || y < 56 || y > innerHeight - 30 ? 'none' : '';
  });
  S.floorTags.forEach(({ f, el }, i) => {
    S.v.set(S.FW / 2 + 2, (f.lv - 1) * S.FH + S.FH / 2, 0); S.tower.localToWorld(S.v); S.v.project(S.camera);
    let x = (S.v.x * 0.5 + 0.5) * innerWidth + 12;
    let y = (-S.v.y * 0.5 + 0.5) * innerHeight;
    // keep clear of top HUD bar (~80px) and stack from top floor downward with min gap
    const minY = 56 + (S.TOPLV - f.lv) * 34;
    if (y < minY) y = minY;
    if (y > innerHeight - 50) y = innerHeight - 50;
    el.style.transform = `translate(${Math.min(x, innerWidth - 280)}px,${y}px) translate(0,-50%)`;
    el.style.display = S.v.z > 1 ? 'none' : '';
  });

  S.observeQuality(t, frameMs);
  S.composer.render();
  requestAnimationFrame(tick);
}

export function initCamera() {


// ---- camera: concept framing — pulled back, looking slightly up ----
S.camera = new S.THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 1600);

window.__brightShot = (fov) => {
  S.renderer.toneMappingExposure = 0.78;
  if (fov) { S.camera.fov = fov; S.camera.updateProjectionMatrix(); }
  if (window.__bloom) window.__bloom.strength = 0.07;
};

// ~80 m back, low street, look-up ~17° — tower fills ~50% height, HQ crown above roof
S.ROOF_Y = S.TOPLV * 4.2 + 6;

S.CAM_END = new S.THREE.Vector3(9, 9.0, 104);

S.CAM_START = new S.THREE.Vector3(20, 14, 115);

S.CAM_WIDE = new S.THREE.Vector3(14, 8.0, 130);

S.camera.position.copy(S.CAM_START);

S.controls = new S.OrbitControls(S.camera, S.renderer.domElement);

S.TGT_Y = S.ROOF_Y * 0.45;

S.controls.target.set(2, S.TGT_Y + 9, -4);

S.controls.enableDamping = true;
 S.controls.maxPolarAngle = Math.PI * 0.495;

S.controls.minDistance = 22;
 S.controls.maxDistance = 200;
 S.controls.enabled = false;

S.userTook = false;

S.ceoInspect = false;
S.hbInspect = false;
S.hbBlend = 0;
S.CEO_POS = new S.THREE.Vector3(2.4, 23.5, 15.5);

S.CEO_TGT = new S.THREE.Vector3(0.5, 22.6, -0.4);

S.camHomePos = new S.THREE.Vector3();

S.camHomeTgt = new S.THREE.Vector3(2, S.TGT_Y + 9, -4);

S.ceoBlend = 0;

S.controls.addEventListener('start', () => { S.userTook = true; S.ceoInspect = false; S.ceoBlend = 0; S.hbInspect = false; S.controls.autoRotate = false; });

window.__setCam = (x, y, z, tx, ty, tz) => {
  S.userTook = true; S.controls.enabled = true;
  S.camera.position.set(x, y, z); S.controls.target.set(tx, ty, tz); S.controls.update();
};

window.__CAM_END = S.CAM_END;
 window.__CAM_WIDE = S.CAM_WIDE;
 window.__TGT_Y = S.TGT_Y;

window.__camera = S.camera;
 window.__controls = S.controls;
window.__renderer = S.renderer;
window.__LAYER_HB = S.LAYER_HB;


// lights — cold
S.scene.add(new S.THREE.HemisphereLight(0x4a6cff, 0x0a0614, 0.32));

// Cool fill for floor interiors only. Layer 2 keeps it off the street and the megatowers.
S.roomFill = new S.THREE.AmbientLight(0xd5dce8, 1.05);

S.roomFill.layers.set(S.LAYER_ROOM);

S.scene.add(S.roomFill);

// Cheap 3F-only fill. Camera enables LAYER_HB when inspecting or near 3F
// so we never turn on the other floors' LAYER_ROOM point lights.
S.hbFill = new S.THREE.AmbientLight(0xdce6f4, 1.4);
S.hbFill.layers.set(S.LAYER_HB);
S.scene.add(S.hbFill);

S.setHbRoomView = function setHbRoomView(on) {
  if (on) S.camera.layers.enable(S.LAYER_HB);
  else S.camera.layers.disable(S.LAYER_HB);
};

S.cameraNearHb = function cameraNearHb() {
  if (!S.HB_TGT) return false;
  return S.camera.position.distanceTo(S.HB_TGT) < 18;
};

S.moon = new S.THREE.DirectionalLight(0x6a7ab8, 0.4);

S.moon.position.set(-40, 70, 20);
 S.moon.castShadow = true;
 S.moon.shadow.mapSize.set(2048, 2048);

Object.assign(S.moon.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 250 });

S.scene.add(S.moon);

S.rimM = new S.THREE.DirectionalLight(0xff2a6d, 0.35);
 S.rimM.position.set(40, 20, -30);
 S.scene.add(S.rimM);

S.rimC = new S.THREE.DirectionalLight(0x00f0ff, 0.3);
 S.rimC.position.set(-25, 15, 40);
 S.scene.add(S.rimC);

S.streetMag = new S.THREE.PointLight(0xff2a6d, 18, 36, 2);
 S.streetMag.position.set(-12, 4, 28);
 S.scene.add(S.streetMag);

S.streetCyan = new S.THREE.PointLight(0x00f0ff, 18, 36, 2);
 S.streetCyan.position.set(12, 4, 30);
 S.scene.add(S.streetCyan);

S.streetYel = new S.THREE.PointLight(0xfcee0a, 10, 28, 2);
 S.streetYel.position.set(0, 3.5, 36);
 S.scene.add(S.streetYel);

S.streetMag2 = new S.THREE.PointLight(0xff2a6d, 12, 28, 2);
 S.streetMag2.position.set(-8, 3, 38);
 S.scene.add(S.streetMag2);

S.streetWide1 = new S.THREE.PointLight(0x00f0ff, 14, 32, 2);
 S.streetWide1.position.set(-10, 5, 75);
 S.scene.add(S.streetWide1);

S.streetWide2 = new S.THREE.PointLight(0xff2a6d, 14, 32, 2);
 S.streetWide2.position.set(12, 5, 95);
 S.scene.add(S.streetWide2);

S.streetWide3 = new S.THREE.PointLight(0xfcee0a, 10, 26, 2);
 S.streetWide3.position.set(0, 4, 115);
 S.scene.add(S.streetWide3);
}

export function initBloom() {

// parked cars along curb
// kerb parking handled by Kenney hero cars

// ---- bloom (moderate) ----
S.composer = new S.EffectComposer(S.renderer);

S.composer.addPass(new S.RenderPass(S.scene, S.camera));

S.bloomPass = new S.UnrealBloomPass(new S.THREE.Vector2(innerWidth, innerHeight), 0.16, 0.3, 0.92);

window.__bloom = S.bloomPass;

S.composer.addPass(S.bloomPass);

S.composer.addPass(new S.OutputPass());

// Quality: local lights are isolated on every tier (that is the real fix).
// Auto steps down only after measured frame time stays above budget.
S.Q_TIERS = [
  { label: '高畫質', dpr: 1.75, shadow: true, map: 2048, soft: true, bloom: 1, coat: 1 },
  { label: '均衡', dpr: 1.25, shadow: true, map: 1024, soft: false, bloom: 0.55, coat: 0.45 },
  { label: '流暢', dpr: 1, shadow: true, map: 512, soft: false, bloom: 0.4, coat: 0 },
  { label: '流暢', dpr: 0.8, shadow: false, map: 256, soft: false, bloom: 0.35, coat: 0 },
];

S.qArg = new URLSearchParams(location.search).get('quality');

S.qMode = (S.qArg === 'high' || S.qArg === 'smooth' || S.qArg === 'auto') ? S.qArg : 'auto';

S.qTier = S.qMode === 'smooth' ? 2 : 0;

S.qGaps = [];

S.qBtn = document.getElementById('qmode');

if (S.qBtn) S.qBtn.addEventListener('click', () => {
  S.qMode = S.qMode === 'auto' ? 'high' : S.qMode === 'high' ? 'smooth' : 'auto';
  S.qTier = S.qMode === 'high' ? 0 : S.qMode === 'smooth' ? 2 : 0;
  S.qGaps = [];
  S.applyQuality();
});

window.__quality = {
  get mode() { return S.qMode; },
  get tier() { return S.qTier; },
  get label() { return S.qText(); },
  get tierCount() { return S.Q_TIERS.length; },
};

S.applyQuality();
}

export function initLoop() {


// ---- animation ----
S.v = new S.THREE.Vector3();
 S.clock = new S.THREE.Clock();
window.__clock = S.clock;


S.INTRO = 4.2;
 S.ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

S.last = 0;

S.qPrevMs = performance.now();
}


initShared();
initCamera();
initCitySky();
initOfficeBase();
initCast();
initFloors();
initLife();
initCrown();
initVehicles();
initCrowd();
initProps();
initHighway();
initDistrict();
initBloom();
initHud();
initLoop();
initProof();
S.tick();
const hsh = location.hash.slice(1);
if (hsh) { const f = S.FLOORS.find(x => x.id === hsh); if (f) S.openPanel(f); }
