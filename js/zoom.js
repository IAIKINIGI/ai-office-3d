import { S } from './scope.js';

function ease(x) {
  return S.ease ? S.ease(x) : (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
}

S.camFlyTween = null;
S.camFlySaved = null;
S.camFlyHold = false;
S.camFlyInspect = null;

S.saveCamHomeIfNeeded = function saveCamHomeIfNeeded() {
  if (S.camFlySaved || !S.camera || !S.controls) return;
  S.camFlySaved = {
    pos: S.camera.position.clone(),
    tgt: S.controls.target.clone(),
    minDistance: S.controls.minDistance,
    fov: S.camera.fov,
  };
};

S.showBackBtn = function showBackBtn(on, title) {
  const btn = document.getElementById('back-view');
  if (!btn) return;
  btn.classList.toggle('show', !!on);
  btn.setAttribute('aria-hidden', on ? 'false' : 'true');
  const sub = btn.querySelector('.back-who');
  if (sub) sub.textContent = on && title ? title : '';
};

S.flyTo = function flyTo({ pos, tgt, minDistance, duration, inspect, title }) {
  if (!S.camera || !S.controls || !pos || !tgt) return;
  S.saveCamHomeIfNeeded();
  S.userTook = true;
  S.controls.autoRotate = false;
  S.controls.enabled = false;
  const dur = (duration == null ? 1.0 : duration);
  S.camFlyTween = {
    t0: performance.now(),
    dur: Math.max(0.6, dur) * 1000,
    fromPos: S.camera.position.clone(),
    fromTgt: S.controls.target.clone(),
    fromFov: S.camera.fov,
    toPos: pos.clone ? pos.clone() : pos,
    toTgt: tgt.clone ? tgt.clone() : tgt,
    toFov: inspect === 'hb' ? 72 : 42,
    minDistance: minDistance != null ? minDistance : 8,
    returning: false,
  };
  S.camFlyHold = true;
  S.camFlyInspect = inspect || null;
  S.hbInspect = inspect === 'hb';
  S.ceoInspect = false;
  if (S.ceoBlend != null) S.ceoBlend = 0;
  if (S.hbBlend != null && inspect !== 'hb') S.hbBlend = Math.min(S.hbBlend, 0.002);
  S.controls.minDistance = Math.min(S.controls.minDistance, S.camFlyTween.minDistance);
  S.showBackBtn(true, title);
};

S.flyBack = function flyBack() {
  if (S.panel) S.panel.classList.remove('open');
  if (S.floorTags) S.floorTags.forEach(x => x.el.classList.remove('sel'));
  S.hbInspect = false;
  S.ceoInspect = false;
  S.camFlyInspect = null;
  S.focusY = null;
  if (S.camFlyTween && S.camFlyTween.returning) return;
  if (!S.camFlySaved || !S.camera || !S.controls) {
    S.camFlyHold = false;
    S.showBackBtn(false);
    return;
  }
  const saved = S.camFlySaved;
  S.controls.enabled = false;
  S.camFlyTween = {
    t0: performance.now(),
    dur: 1000,
    fromPos: S.camera.position.clone(),
    fromTgt: S.controls.target.clone(),
    fromFov: S.camera.fov,
    toPos: saved.pos,
    toTgt: saved.tgt,
    toFov: saved.fov || 42,
    minDistance: saved.minDistance,
    returning: true,
  };
};

// Drive an in-flight tween. Returns true when inspect-camera lerps should stay off.
S.stepCamFly = function stepCamFly() {
  const tw = S.camFlyTween;
  if (!tw) return !!S.camFlyHold;
  const k = Math.min(1, (performance.now() - tw.t0) / tw.dur);
  const e = ease(k);
  S.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
  S.controls.target.lerpVectors(tw.fromTgt, tw.toTgt, e);
  const fov = tw.fromFov + (tw.toFov - tw.fromFov) * e;
  if (Math.abs(S.camera.fov - fov) > 0.01) {
    S.camera.fov = fov;
    S.camera.updateProjectionMatrix();
  }
  if (tw.minDistance != null) {
    S.controls.minDistance = Math.min(S.controls.minDistance, tw.minDistance);
  }
  if (k >= 1) {
    S.camera.position.copy(tw.toPos);
    S.controls.target.copy(tw.toTgt);
    if (tw.minDistance != null) S.controls.minDistance = tw.minDistance;
    S.camFlyTween = null;
    S.controls.enabled = true;
    S.controls.update();
    if (tw.returning) {
      S.camFlyHold = false;
      S.camFlySaved = null;
      S.showBackBtn(false);
    }
  }
  return true;
};

function doorDir() {
  const d = new S.THREE.Vector3(0, 0, 1);
  if (S.tower) d.applyQuaternion(S.tower.quaternion);
  d.y = 0;
  if (d.lengthSq() < 1e-6) d.set(0, 0, 1);
  return d.normalize();
}

S.frameAgent = function frameAgent(label) {
  if (!label || !label.obj) return;
  if (S.tower) S.tower.updateMatrixWorld(true);
  const head = new S.THREE.Vector3();
  label.obj.getWorldPosition(head);
  const chest = head.clone();
  chest.y -= 0.35;
  const tgt = chest.clone();
  tgt.y += 0.12;
  const cam = new S.THREE.Vector3();
  if (S.tower) {
    const local = S.tower.worldToLocal(chest.clone());
    // Stand in the aisle toward the door (local +Z) so we get a 3/4 view
    // and stay inside the room instead of hugging the person's back.
    const camLocal = new S.THREE.Vector3(local.x * 0.5, local.y + 1.15, Math.max(local.z + 2.6, 0.4));
    const dx = camLocal.x - local.x, dz = camLocal.z - local.z;
    const d = Math.hypot(dx, dz);
    const want = 3.1;
    if (d < 2.5 || d > 3.4) {
      const s = want / (d || 1);
      camLocal.x = local.x + dx * s;
      camLocal.z = local.z + dz * s;
    }
    S.tower.localToWorld(camLocal);
    cam.copy(camLocal);
  } else {
    cam.copy(chest).addScaledVector(doorDir(), 3.2);
    cam.y += 1.05;
  }
  S.focusY = chest.y;
  const inspect = label.floor && label.floor.id === 'hb' ? 'hb'
    : (label.floor && label.floor.id === 'exec' ? 'ceo' : null);
  S.flyTo({ pos: cam, tgt, minDistance: 2.6, duration: 1.0, inspect, title: label.text });
  if (label.floor) S.openPanel(label.floor, { fromZoom: true });
};

S.frameFloor = function frameFloor(f) {
  if (!f) return;
  if (f.id === 'hb' && S.HB_POS && S.HB_TGT) {
    S.flyTo({ pos: S.HB_POS.clone(), tgt: S.HB_TGT.clone(), minDistance: 5, duration: 1.0, inspect: 'hb', title: f.lv + 'F' });
    S.openPanel(f, { fromZoom: true });
    return;
  }
  if (f.id === 'exec' && S.CEO_POS && S.CEO_TGT) {
    S.flyTo({ pos: S.CEO_POS.clone(), tgt: S.CEO_TGT.clone(), minDistance: 8, duration: 1.0, inspect: 'ceo', title: f.lv + 'F' });
    S.openPanel(f, { fromZoom: true });
    return;
  }
  const y = (f.lv - 1) * S.FH + S.FH / 2;
  const tgt = new S.THREE.Vector3(0, y, 0);
  const cam = new S.THREE.Vector3(0, y + 1.4, (S.FD / 2) + 16);
  if (S.tower) {
    S.tower.updateMatrixWorld(true);
    S.tower.localToWorld(tgt);
    S.tower.localToWorld(cam);
  }
  S.focusY = tgt.y;
  S.flyTo({ pos: cam, tgt, minDistance: 8, duration: 1.05, inspect: null, title: f.lv + 'F' });
  S.openPanel(f, { fromZoom: true });
};

S.frameBuilding = function frameBuilding(id) {
  if (id === 'htower') {
    const x = S.TOWER_X || 0, z = S.TOWER_Z || 0;
    const midY = S.TGT_Y != null ? S.TGT_Y : ((S.ROOF_Y || 26) * 0.45);
    const tgt = new S.THREE.Vector3(x, midY, z);
    const cam = new S.THREE.Vector3(x + 12, 16, z + 42);
    S.flyTo({ pos: cam, tgt, minDistance: 18, duration: 1.1, inspect: null, title: 'H TOWER' });
    return;
  }
  if (id === 'atom') {
    const x = 42.4, z = -37.2;
    const tgt = new S.THREE.Vector3(x, 26, z);
    const cam = new S.THREE.Vector3(x - 18, 28, z + 48);
    S.flyTo({ pos: cam, tgt, minDistance: 22, duration: 1.1, inspect: null, title: 'ATOM' });
  }
};

S.findAgentLabel = function findAgentLabel(name) {
  if (!name || !S.labels) return null;
  const want = String(name).trim();
  return S.labels.find(l => l.text === want)
    || S.labels.find(l => l.text && (l.text === want || l.text.startsWith(want + ' ') || l.text.startsWith(want + '・') || l.text.startsWith(want + '·')));
};

function wireHot(el) {
  const on = () => el.classList.add('hot');
  const off = () => el.classList.remove('hot');
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
}

S.initSiteTags = function initSiteTags() {
  if (!S.labelWrap) return;
  const roofY = (S.ROOF_Y != null ? S.ROOF_Y : ((S.TOPLV || 6) * 4.2 + 6)) + 2.4;
  S.siteTags = [
    {
      id: 'htower',
      text: 'H TOWER',
      className: 'btag btag-h',
      getPos(v) { v.set(S.TOWER_X || 0, roofY, S.TOWER_Z || 0); },
    },
    {
      id: 'atom',
      text: 'ATOM',
      className: 'btag btag-atom',
      getPos(v) { v.set(42.4, 44, -37.2); },
    },
  ];
  S.siteTags.forEach(l => {
    const d = document.createElement('div');
    d.className = l.className;
    d.textContent = l.text;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', '放大 ' + l.text);
    const go = ev => { ev.preventDefault(); ev.stopPropagation(); S.frameBuilding(l.id); };
    d.addEventListener('click', go);
    d.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') go(ev); });
    wireHot(d);
    S.labelWrap.appendChild(d);
    l.el = d;
  });
};

S.wireLabelClicks = function wireLabelClicks() {
  (S.labels || []).forEach(l => {
    if (!l.el) return;
    l.el.setAttribute('role', 'button');
    l.el.setAttribute('tabindex', '0');
    l.el.setAttribute('aria-label', '放大 ' + l.text);
    l.el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); S.frameAgent(l); };
    l.el.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); S.frameAgent(l); } };
    wireHot(l.el);
  });
  (S.floorTags || []).forEach(({ f, el }) => {
    if (!el) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); S.frameFloor(f); };
    el.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); S.frameFloor(f); } };
    wireHot(el);
  });
};

S.wireZoomChrome = function wireZoomChrome() {
  const btn = document.getElementById('back-view');
  if (btn) btn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); S.flyBack(); });

  addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (S.camFlyHold || S.camFlySaved || (S.panel && S.panel.classList.contains('open'))) {
      ev.preventDefault();
      S.flyBack();
    }
  });

  let lastTap = 0, lastX = 0, lastY = 0;
  const canvas = S.renderer && S.renderer.domElement;
  if (canvas) {
    canvas.addEventListener('dblclick', ev => {
      if (!S.camFlyHold && !S.camFlySaved) return;
      ev.preventDefault();
      S.flyBack();
    });
    canvas.addEventListener('pointerup', ev => {
      if (ev.button != null && ev.button !== 0) return;
      const now = performance.now();
      const close = Math.hypot(ev.clientX - lastX, ev.clientY - lastY) < 18;
      if (close && now - lastTap < 350 && (S.camFlyHold || S.camFlySaved)) {
        // Empty-space double-tap. A pick on a floor/person is handled in ui.js
        // and will have set a short suppress window.
        if (!S._zoomSuppressBack) S.flyBack();
      }
      lastTap = now;
      lastX = ev.clientX;
      lastY = ev.clientY;
    });
  }

  window.__flyBack = S.flyBack;
  window.__frameAgent = S.frameAgent;
  window.__frameFloor = S.frameFloor;
  window.__frameBuilding = S.frameBuilding;
};

export function initZoom() {
  S.initSiteTags();
  S.wireLabelClicks();
  S.wireZoomChrome();
}
