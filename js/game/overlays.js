// 關卡畫面上的浮層：關卡前卡片、暫停、今日菜單、過關、新甜點解鎖卡。
import { Art } from '../art/common.js';
import { TILE_BG, REGION_BY_ID } from '../config.js';
import { DESSERT_BY_ID } from '../data/desserts.js';
import { tipBlock, menuList } from './tips.js';
import { miniTile } from './tileArt.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** 一層浮層＋卡片 */
export function overlay(host, cls = '') {
  const el = document.createElement('div');
  el.className = 'g-ov ' + cls;
  const card = document.createElement('div');
  card.className = 'card g-card';
  el.appendChild(card);
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('g-show'));
  return {
    el, card,
    close() { el.classList.remove('g-show'); el.classList.add('g-hide'); setTimeout(() => el.remove(), 220); },
  };
}

function btn(text, cls, onClick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

/** 關卡前：地區、第幾關、新甜點剪影、教學、今日菜單、開始 */
export function showIntro(host, { lv, region, title, newDessert, tips, menuKinds, onStart, sfx }) {
  const ov = overlay(host, 'g-intro');
  const c = ov.card;
  c.innerHTML = `<div class="g-ribbon">${esc(region.flag)} ${esc(region.name)}</div><h2 class="g-lvtitle">${esc(title)}</h2>` +
    (lv.shapeName ? `<div class="g-shape">今天的盤子：<b>${esc(lv.shapeName)}</b></div>` : '');
  // 這關的甜點
  const row = document.createElement('div'); row.className = 'g-kinds';
  for (const k of lv.kinds || []) row.appendChild(miniTile(k, 30, { silhouette: newDessert === k }));
  c.appendChild(row);
  if (newDessert) {
    const nd = document.createElement('div'); nd.className = 'g-newd';
    nd.innerHTML = '<div class="g-newd-pic"><canvas></canvas><i>?</i></div><div><b>這關有新甜點登場！</b><span>過關就能收進圖鑑</span></div>';
    const cv = nd.querySelector('canvas');
    c.appendChild(nd);
    Art.renderSilhouette(cv, newDessert, 92, { doily: true });
  }
  for (const key of tips) { const t = tipBlock(key, lv); if (t) c.appendChild(t); }
  if (menuKinds) {
    const m = document.createElement('section'); m.className = 'g-menubox';
    m.innerHTML = '<h3>今日菜單</h3>';
    m.appendChild(menuList(menuKinds));
    c.appendChild(m);
  }
  const go = btn('開始', 'g-start', () => { sfx('tap'); ov.close(); onStart(); });
  const foot = document.createElement('div'); foot.className = 'g-ov-foot'; foot.appendChild(go);
  c.appendChild(foot);
  return ov;
}

/** D 關遊戲中再打開的菜單 */
export function showMenu(host, kinds, onClose, sfx) {
  const ov = overlay(host, 'g-menuov');
  ov.card.innerHTML = '<h2 class="g-ovtitle">今日菜單</h2><p class="g-ovsub">甜點要配它的招牌飲品</p>';
  ov.card.appendChild(menuList(kinds));
  const foot = document.createElement('div'); foot.className = 'g-ov-foot';
  foot.appendChild(btn('知道了', '', () => { sfx('tap'); ov.close(); onClose(); }));
  ov.card.appendChild(foot);
  ov.el.addEventListener('click', e => { if (e.target === ov.el) { sfx('tap'); ov.close(); onClose(); } });
  return ov;
}

/** 暫停：繼續、重玩、回地圖、音效音樂開關 */
export function showPause(host, { settings, onResume, onRestart, onMap, onSetting, sfx }) {
  const ov = overlay(host, 'g-pauseov');
  const c = ov.card;
  c.innerHTML = '<h2 class="g-ovtitle">休息一下</h2><p class="g-ovsub">不計時，想玩再回來就好</p>';
  const list = document.createElement('div'); list.className = 'g-pause-btns';
  list.appendChild(btn('繼續', '', () => { sfx('tap'); ov.close(); onResume(); }));
  list.appendChild(btn('重玩這一關', 'ghost', () => { sfx('tap'); onRestart(); }));
  list.appendChild(btn('回地圖', 'ghost', () => { sfx('tap'); onMap(); }));
  c.appendChild(list);
  const sw = document.createElement('div'); sw.className = 'g-switches';
  for (const [key, label] of [['sfx', '音效'], ['music', '音樂']]) {
    const line = document.createElement('div'); line.className = 'g-switch';
    line.innerHTML = `<span>${label}</span><span class="seg"><button type="button" data-v="1">開</button><button type="button" data-v="0">關</button></span>`;
    const seg = line.querySelector('.seg');
    const paint = on => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === on));
    paint(!!settings[key]);
    seg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const on = b.dataset.v === '1'; paint(on); onSetting(key, on); sfx('tap');
    });
    sw.appendChild(line);
  }
  c.appendChild(sw);
  ov.el.addEventListener('click', e => { if (e.target === ov.el) { sfx('tap'); ov.close(); onResume(); } });
  return ov;
}

/** 過關卡：標題、星星逐顆亮起；之後由 gameScreen 決定接解鎖卡或按鈕 */
export function showWin(host, { title, sub }) {
  const ov = overlay(host, 'g-winov');
  ov.card.innerHTML = `<div class="g-win-h"><h2 class="g-wintitle">${esc(title)}</h2>
    <div class="g-winstars"><i>★</i><i>★</i><i>★</i></div><p class="g-ovsub">${esc(sub)}</p></div>`;
  return ov;
}
export function lightStar(ov, i) {
  const s = ov.card.querySelectorAll('.g-winstars i')[i];
  if (s) s.classList.add('on');
  return s;
}

/** 新甜點解鎖卡：剪影翻成完整圖＋糖粉；多張可以左右滑 */
export function unlockSection(ov, ids, { opening, onReveal, onPage }) {
  const sec = document.createElement('section');
  sec.className = 'g-unlock';
  sec.innerHTML = `<h3 class="g-unlock-h">${opening ? `開店禮！${ids.length} 種甜點進駐展示櫃` : '新甜點收進圖鑑了！'}</h3>`;
  const track = document.createElement('div');
  track.className = 'g-cards' + (ids.length > 1 ? ' g-multi' : '');
  const dots = document.createElement('div'); dots.className = 'g-dots';
  const stage = Math.min(156, Math.round(Math.min(window.innerWidth, 480) * 0.4));
  let api = null;
  const cards = ids.map((id, i) => {
    const d = DESSERT_BY_ID[id] || { name: id, orig: '', story: '', no: 0, bg: 'tea', region: 'fr' };
    const reg = REGION_BY_ID[d.region];
    const card = document.createElement('article');
    card.className = 'g-ucard g-locked';
    card.style.setProperty('--bg', TILE_BG[d.bg] || '#EADFD2');
    card.dataset.id = id;
    card.innerHTML = `<div class="g-ustage"><span class="g-uno">No.${String(d.no).padStart(3, '0')}</span>
        <canvas class="g-usil"></canvas><canvas class="g-ufull"></canvas></div>
      <div class="g-ubody"><p class="g-uname">${esc(d.name)}</p><div class="g-uorig">${esc(d.orig)}</div>
        <span class="g-uplace">${esc(d.place || (reg ? reg.flag + ' ' + reg.name : ''))}</span>
        <p class="g-ustory">${esc(d.story)}</p></div>`;
    track.appendChild(card);
    Art.renderSilhouette(card.querySelector('.g-usil'), id, stage, { doily: true });
    Art.renderShowcase(card.querySelector('.g-ufull'), id, stage);
    const dot = document.createElement('i'); if (i === 0) dot.className = 'on'; dots.appendChild(dot);
    dot.addEventListener('click', () => api.goTo(i));
    return card;
  });
  sec.appendChild(track);
  if (ids.length > 1) { sec.appendChild(dots); sec.insertAdjacentHTML('beforeend', '<p class="g-swipe">左右滑動看看 →</p>'); }
  ov.card.appendChild(sec);
  let cur = 0;
  const reveal = i => {
    const card = cards[i]; if (!card || !card.classList.contains('g-locked')) return;
    card.classList.remove('g-locked'); card.classList.add('g-just');
    onReveal && onReveal(card, i);
  };
  let st = 0;
  track.addEventListener('scroll', () => {
    clearTimeout(st);
    st = setTimeout(() => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => { const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (dd < bd) { bd = dd; best = i; } });
      if (best !== cur) { cur = best; onPage && onPage(best); }
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === best));
      reveal(best);
    }, 90);
  }, { passive: true });
  api = {
    cards, reveal,
    current: () => ids[cur],
    goTo(i, smooth = true) { const c = cards[i]; if (c) track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' }); },
  };
  return api;
}

export function winButtons(ov, list) {
  const foot = document.createElement('div'); foot.className = 'g-ov-foot g-winbtns';
  for (const [text, cls, fn] of list) foot.appendChild(btn(text, cls, fn));
  ov.card.appendChild(foot);
  return foot;
}
