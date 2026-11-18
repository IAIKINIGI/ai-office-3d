import { S } from './scope.js';


S.openPanel = function openPanel(f) {
  const rows = f.tasks.length ? f.tasks.map(t => `<li><span class="t">${t[0]}</span><span class="d">${t[1]}</span><span class="s ${t[2] === '完成' ? 'ok' : t[2] === '等緊' ? 'wait' : 'go'}">${t[2]}</span></li>`).join('')
    : `<li class="empty">${f.id === 'hall' ? '會議廳暫時冇會議進行中。' : S.isVac(f) ? '空置樓層。' : '閒置。'}</li>`;
  S.panel.innerHTML = `<button class="x" onclick="document.getElementById('panel').classList.remove('open')">✕</button>
  <div class="lv">${f.lv}F</div><h2>${S.isVac(f) ? '空置' : `${f.dept}・${f.name}`}</h2><p class="role">${f.role}</p>
  <div class="cards">${f.health ? `<div class="kv"><b>狀態</b><span>${S.dot(f)}${f.healthLabel || ''}</span></div>` : ''}${f.usage ? `<div class="kv"><b>本週用量</b><span>${f.usage}</span></div>` : ''}${f.seen ? `<div class="kv"><b>上次活動</b><span>${f.seen}</span></div>` : ''}${f.last ? `<div class="kv"><b>最後工作</b><span>${f.last}</span></div>` : ''}</div>
  ${f.stats ? `<div class="kv warn"><b>今日數字</b><span>${f.stats}</span></div>` : ''}
  <h3>工作報告</h3><ul>${rows}</ul>`;
  S.panel.classList.add('open'); S.focusY = (f.lv - 1) * S.FH + S.FH / 2;
  S.ceoInspect = f.id === 'exec' && !S.userTook;
  S.floorTags.forEach(x => x.el.classList.toggle('sel', x.f === f));
}

export function initHud() {


// ---- HUD / labels ----
S.labelWrap = document.getElementById('labels');

S.labels.forEach(l => { const d = document.createElement('div'); d.className = 'tag'; d.textContent = l.text; d.onclick = () => S.openPanel(l.floor); S.labelWrap.appendChild(d); l.el = d; });

S.floorTags = S.FLOORS.map(f => {
  const d = document.createElement('div'); d.className = `ftag h-${S.hOf(f)}`;
  d.innerHTML = S.isVac(f) ? `<b>${f.lv}F</b><span class="dp">空置</span>${S.dot(f)}`
    : `<b>${f.lv}F</b><span class="dp">${S.esc(f.dept)}</span>${f.health ? `${S.dot(f)}<span class="hl">${S.esc(f.healthLabel || '')}</span>${f.usage ? `<span class="u">${S.esc(S.useTxt(f.usage))}</span>` : ''}` : ''}`;
  d.onclick = () => S.openPanel(f); S.labelWrap.appendChild(d); return { f, el: d };
});


S.wxIcon = (() => {
  const sun = `<circle cx="11" cy="10" r="5" fill="#ffc94d"/>`;
  const cl = (S.WEATHER.cloud || 0) >= 30 ? `<path d="M6 19h13a4 4 0 0 0-1-7.9A5 5 0 0 0 8.4 12 3.5 3.5 0 0 0 6 19z" fill="#e8ecff"/>` : '';
  return `<svg viewBox="0 0 26 26" width="26" height="26">${sun}${cl}</svg>`;
})();

S.todayHtml = '';

if (S.TODAY) {
  const pct = Math.min(1, S.TODAY.booked / S.TODAY.target), C = 2 * Math.PI * 15;
  S.todayHtml = `<div class="today"><svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="4"/><circle class="arc" cx="20" cy="20" r="15" fill="none" stroke="#FCEE0A" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - pct)}" transform="rotate(-90 20 20)"/></svg><div><small>今日訂車</small><b>${S.TODAY.booked} / ${S.TODAY.target}</b><small>仲差 ${S.TODAY.target - S.TODAY.booked}・截至 ${String(S.TODAY.asOf).slice(11)}</small></div></div>`;
}

document.getElementById('top').innerHTML = `<div class="wx">${S.wxIcon}<div><b>倫敦 ${S.WEATHER.temp}°C</b><span>${S.esc(S.WEATHER.desc)}</span></div></div>${S.USAGE ? `<div class="use"><small>Grok Bot ${S.esc(S.USAGE.plan)}</small><b>用量 ${S.esc(S.USAGE.used)}</b></div>` : ''}${S.todayHtml}`;

S.btns = document.getElementById('btns');
 // left list removed — right ftags only
if (S.btns) S.btns.innerHTML = '';

S.panel = document.getElementById('panel');

S.focusY = null;

window.openPanel = S.openPanel;

S.ray = new S.THREE.Raycaster(), S.mouse = new S.THREE.Vector2();
 S.down;

S.renderer.domElement.addEventListener('pointerdown', e => S.down = [e.clientX, e.clientY]);

S.renderer.domElement.addEventListener('pointerup', e => {
  if (!S.down || Math.hypot(e.clientX - S.down[0], e.clientY - S.down[1]) > 5) return;
  S.mouse.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
  S.ray.setFromCamera(S.mouse, S.camera);
  const hit = S.ray.intersectObjects(S.pickables, false)[0];
  if (hit) S.openPanel(hit.object.userData.floor);
});

addEventListener('resize', () => {
  S.camera.aspect = innerWidth / innerHeight; S.camera.updateProjectionMatrix();
  S.applyQuality();
});
}

