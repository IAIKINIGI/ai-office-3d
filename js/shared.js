import { S } from './scope.js';


S.applyFloorRoster = function applyFloorRoster(floors) {
  for (const bot of S.FLOOR_ROSTER) {
    const f = floors.find(x => x.id === bot.floorId);
    if (!f) continue;
    const people = Array.isArray(f.people) ? f.people : (f.people = []);
    for (let i = people.length - 1; i >= 0; i--) {
      const n = String(people[i]);
      if (bot.aliases.some(a => n === a || n.startsWith(a + ' ') || n.startsWith(a + '·') || n.startsWith(a + '・'))) people.splice(i, 1);
    }
    if (!people.some(n => String(n) === bot.name || String(n).startsWith(bot.name + ' ') || String(n).startsWith(bot.name + '·') || String(n).startsWith(bot.name + '・'))) people.push(bot.name);
    const dropAlias = (text, alias) => text
      .replace(new RegExp('(^|・)' + alias + '（[^）]*）', 'g'), '$1')
      .replace(new RegExp('(^|・)' + alias + '(?=・|（|\\(|$|；)', 'g'), '$1')
      .replaceAll('・・', '・').replaceAll('・；', '；').replace(/^・/, '').replace(/・$/, '');
    if (typeof f.name === 'string') {
      for (const a of bot.aliases) f.name = dropAlias(f.name, a);
      if (!f.name.includes(bot.name)) f.name = f.name ? `${f.name}・${bot.name}` : bot.name;
    }
    const ident = `${bot.name}（${bot.title}）`;
    if (typeof f.role === 'string') {
      for (const a of bot.aliases) f.role = dropAlias(f.role, a);
      if (!f.role.includes(bot.name)) {
        const cut = f.role.indexOf('；');
        f.role = cut > 0 ? `${f.role.slice(0, cut)}・${ident}${f.role.slice(cut)}` : cut === 0 ? `${ident}${f.role}` : `${f.role} ${ident}`;
      }
    }
  }
}


S.loadTex = function loadTex(uri, { repeat, wrap, colorSpace = S.THREE.SRGBColorSpace, anisotropy = 4 } = {}) {
  const t = S.loader.load(uri);
  t.colorSpace = colorSpace;
  t.anisotropy = anisotropy;
  if (wrap) { t.wrapS = t.wrapT = S.THREE.RepeatWrapping; }
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}



// Crop helpers — neon sheet: 6 signs side by side; billboards: 4 stacked
S.cropSheet = function cropSheet(sheet, u0, v0, u1, v1) {
  const t = sheet.clone();
  t.repeat.set(u1 - u0, v1 - v0);
  t.offset.set(u0, v0);
  t.needsUpdate = true;
  t.colorSpace = S.THREE.SRGBColorSpace;
  return t;
}



S.glowTex = function glowTex(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.3, `rgba(${r},${g},${b},0.4)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new S.THREE.CanvasTexture(c); t.colorSpace = S.THREE.SRGBColorSpace; return t;
}


S.glow = function glow(tex, x, y, z, sx, sy = sx, op = 0.5, parent = S.scene) {
  const s = new S.THREE.Sprite(new S.THREE.SpriteMaterial({ map: tex, blending: S.THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false }));
  s.scale.set(sx, sy, 1); s.position.set(x, y, z); parent.add(s); return s;
}


S._matKey = function _matKey(kind, parts) {
  return kind + '\0' + parts.map(v => {
    if (v && v.isColor) return 'c' + v.getHexString();
    if (v && v.isTexture) return 't' + v.uuid;
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }).join('\0');
}

export function initShared() {
S.D = window.OFFICE_DATA;

if (!S.D) throw new Error('data.js missing');

S.TEX = window.OFFICE_TEX;

if (!S.TEX) throw new Error('textures.js missing');

S.WEATHER = S.D.weather, S.FLOORS = S.D.floors, S.USAGE = S.D.usage || null, S.TODAY = S.D.today || null;

// Identity only. Status, counts, and tasks stay in hourly data.js.
// sync_from_page.py is outside this repo and replaces data.js wholesale; this puts Hazel back
// if a refresh omits her. Ivy is the previous name of this same agent, not a second person.
S.FLOOR_ROSTER = [
  { floorId: 'hb', name: 'Hazel', aliases: ['Ivy'], id: '15bb0dad-856c-4aa7-9b7e-5c6278854e45', title: 'Halfords Bookings' },
];

S.applyFloorRoster(S.FLOORS);

S.TOPLV = Math.max(...S.FLOORS.map(f => f.lv));

S.HCOL = { run: '#3ccf7a', idle: '#aab2c8', stop: '#ffb347', vacant: '#8a8f9c' };

S.isVac = f => f.health === 'vacant';

S.hOf = f => f.health || (f.tasks.length ? 'idle' : 'stop');

S.dot = f => f.health ? `<i class="dot ${f.health}"></i>` : '';

S.useTxt = u => !u ? '' : (/%$/.test(u) ? `本週用量 ${u}` : u);

S.esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&', '<': '<', '>': '>' }[c]));


S.renderer = new S.THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });

S.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));

S.renderer.setSize(innerWidth, innerHeight);

S.renderer.shadowMap.enabled = true;
 S.renderer.shadowMap.type = S.THREE.PCFSoftShadowMap;

S.renderer.toneMapping = S.THREE.ACESFilmicToneMapping;
 S.renderer.toneMappingExposure = 1.0;

S.renderer.outputColorSpace = S.THREE.SRGBColorSpace;

document.body.appendChild(S.renderer.domElement);


S.LAYER_ACTOR = 1;
 // people / cars — local rim lights must not enter city shaders
S.LAYER_ROOM = 2;
  // office interiors only
S.LAYER_HB = 3;
  // 3F 訂車部 fill only — camera enables this layer when inspecting 3F
S.scene = new S.THREE.Scene();

window.__scene = S.scene;

S.scene.fog = new S.THREE.FogExp2(0x140828, 0.0034);

S.scene.background = new S.THREE.Color(0x0a0618);


S.loader = new S.THREE.TextureLoader();


S.texFacade = S.loadTex(S.TEX.facade, { wrap: true, repeat: [1, 2] });

S.texStreet = S.loadTex(S.TEX.street, { wrap: true, repeat: [8, 8] });

S.texSkyline = S.loadTex(S.TEX.skyline);

S.texNeonSheet = S.loadTex(S.TEX.neon_signs);

S.texBillSheet = S.loadTex(S.TEX.billboards);

S.texKoi = S.loadTex(S.TEX.koi);

S.texDancer = S.loadTex(S.TEX.dancer);

S.texEmblem = S.loadTex(S.TEX.corp_emblem);


S.neonCrops = [];

for (let i = 0; i < 6; i++) S.neonCrops.push(S.cropSheet(S.texNeonSheet, i / 6 + 0.01, 0.02, (i + 1) / 6 - 0.01, 0.98));

S.billCrops = [];

for (let i = 0; i < 4; i++) S.billCrops.push(S.cropSheet(S.texBillSheet, 0.02, 1 - (i + 1) / 4 + 0.01, 0.98, 1 - i / 4 - 0.01));

S.GLOW = { cyan: S.glowTex(0, 240, 255), mag: S.glowTex(255, 42, 109), yel: S.glowTex(252, 238, 10), white: S.glowTex(255, 245, 230), red: S.glowTex(255, 60, 80) };

S._matCache = new Map();

S.M = (c, o = {}) => {
  const keys = Object.keys(o).sort();
  const k = S._matKey('M', [c, ...keys.flatMap(key => [key, o[key]])]);
  let m = S._matCache.get(k);
  if (!m) { m = new S.THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o }); S._matCache.set(k, m); }
  return m;
};

S.E = (c, i = 1.5) => {
  const k = S._matKey('E', [c, i]);
  let m = S._matCache.get(k);
  if (!m) { m = new S.THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, toneMapped: false }); S._matCache.set(k, m); }
  return m;
};

S.box = (w, h, d, mat, x, y, z, parent = S.scene) => {
  const m = new S.THREE.Mesh(new S.THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
};
}

