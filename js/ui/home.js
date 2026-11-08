// 首頁：甜點店門面＋展示櫃（D 擁有）。畫面合約見 架構.md。
import { esc, flower, sfx, music, currentLevelId, lastLevelId, clearedCount } from './common.js';

let off = [];

const ICON_BOOK = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 6.5C10 5 7.2 4.6 4 5v13.2c3.2-.4 6 0 8 1.5 2-1.5 4.8-1.9 8-1.5V5c-3.2-.4-6 0-8 1.5Z" fill="#FFF3F6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6.5v13.2" stroke="currentColor" stroke-width="1.8"/><path d="M16.2 9.2c.7-.9 2-.6 2 .5 0 1-1.2 1.7-2 2.3-.8-.6-2-1.3-2-2.3 0-1.1 1.3-1.4 2-.5Z" fill="currentColor"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8l1.6 2.1 2.6-.6.6 2.6 2.4 1.1-.9 2.5 1.6 2.1-2.1 1.6.2 2.7-2.7.1-1.2 2.4-2.4-1.2-2.4 1.2-1.2-2.4-2.7-.1.2-2.7-2.1-1.6 1.6-2.1-.9-2.5 2.4-1.1.6-2.6 2.6.6Z" fill="#FFF3F6" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;

/** 展示櫃層架上第 k 個甜點的位置：偶數放後排（6 格）、奇數放前排（5 格，夾在後排中間） */
function spot(k) {
  const back = k % 2 === 0;
  const i = back ? k / 2 : (k - 1) / 2;
  return { back, x: back ? (i + 0.5) / 6 * 100 : (i + 1) / 6 * 100 };
}

export default {
  async mount(root, params, app) {
    const { DESSERTS } = app.data;
    const { REGIONS } = app.config;
    const unlocked = new Set(app.save.unlockedList());
    const total = DESSERTS.length;
    const got = DESSERTS.filter(d => unlocked.has(d.id)).length;
    const stars = app.save.totalStars();
    const cur = currentLevelId(app);
    const last = lastLevelId(app);

    let mainLabel, mainSub;
    if (cur === 1 && clearedCount(app) === 0) { mainLabel = '開始營業'; mainSub = '從第 1 關開始'; }
    else if (cur) { const r = app.config.levelRegion(cur); mainLabel = `繼續第 ${cur} 關`; mainSub = r ? `${r.flag} ${r.name}` : ''; }
    else if (clearedCount(app) >= last) { mainLabel = '打開地圖'; mainSub = `${last} 關全部完成，好厲害！`; }
    else { mainLabel = '打開地圖'; mainSub = '新的關卡準備中'; }

    const shelves = REGIONS.map(r => {
      const items = DESSERTS.filter(d => d.region === r.id).sort((a, b) => a.no - b.no);
      const cells = items.map((d, k) => {
        const { back, x } = spot(k);
        const row = back ? 'u-b' : 'u-f';
        return unlocked.has(d.id)
          ? `<button class="u-item ${row}" style="left:${x.toFixed(2)}%" data-id="${esc(d.id)}" aria-label="${esc(d.name)}"><canvas></canvas></button>`
          : `<span class="u-spot ${row}" style="left:${x.toFixed(2)}%" aria-hidden="true"></span>`;
      }).join('');
      const n = items.filter(d => unlocked.has(d.id)).length;
      return `<div class="u-shelf" aria-label="${esc(r.name)}：${n} 個">${cells}<span class="u-ledge"><span class="u-shelf-tag">${r.flag}</span></span></div>`;
    }).join('');

    root.innerHTML = `
<div class="u-home">
  <div class="awning"></div>
  <div class="u-sign-wrap">
    <span class="u-rope u-rope-l"></span><span class="u-rope u-rope-r"></span>
    <div class="u-sign">
      ${flower(30, 'u-sign-fl u-sign-fl-l')}${flower(22, 'u-sign-fl u-sign-fl-r')}
      <div class="u-sign-latin">Pâtisserie · Penghu</div>
      <h1 class="u-sign-name">菊島連連烘</h1>
    </div>
  </div>
  <p class="u-greet">${got ? '歡迎光臨～今天也來烤點甜點吧' : '歡迎光臨～一起把展示櫃擺滿吧'}</p>

  <div class="u-case" aria-label="展示櫃：已收集 ${got} 個甜點">
    <div class="u-case-crown"><span>${flower(14)} 今日的展示櫃 ${flower(14)}</span></div>
    <div class="u-case-glass">
      ${shelves}
      ${got ? '' : '<div class="u-case-empty"><b>展示櫃還空空的</b><span>過關就會擺上新甜點喔</span></div>'}
    </div>
    <div class="u-case-base"></div>
    <span class="u-case-fl" aria-hidden="true">${flower(28)}${flower(20)}${flower(15)}</span>
  </div>

  <div class="u-stats">
    <span class="u-chip"><b class="u-star" aria-hidden="true">★</b> 星星 <b>${stars}</b></span>
    <span class="u-chip">收集 <b>${got}</b>/${total}<i class="u-bar" aria-hidden="true"><i style="width:${(got / total * 100).toFixed(1)}%"></i></i></span>
  </div>

  <div class="u-home-btns">
    <button class="u-round" data-act="book" aria-label="甜點圖鑑">
      <span class="u-round-ic">${ICON_BOOK}</span><span class="u-round-t">圖鑑</span>
    </button>
    <button class="btn u-main" data-act="map"><span class="u-main-l">${esc(mainLabel)}</span><span class="u-main-s">${esc(mainSub)}</span></button>
    <button class="u-round" data-act="settings" aria-label="設定">
      <span class="u-round-ic">${ICON_GEAR}</span><span class="u-round-t">設定</span>
    </button>
  </div>
</div>`;

    // 甜點畫進展示櫃（大小跟著畫面寬度）
    const caseEl = root.querySelector('.u-case');
    const paint = () => {
      const w = root.querySelector('.u-case-glass').clientWidth || 330;
      const slot = (w - 12) / 6;
      const bs = Math.round(Math.min(46, slot * 0.76));
      const fs = Math.round(Math.min(50, slot * 0.84));
      caseEl.style.setProperty('--bs', bs + 'px');
      caseEl.style.setProperty('--fs', fs + 'px');
      root.querySelectorAll('.u-item').forEach(b => {
        app.art.renderTile(b.querySelector('canvas'), b.dataset.id, b.classList.contains('u-b') ? bs : fs);
      });
    };
    paint();
    let lastW = window.innerWidth, t = 0;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; paint(); } }, 150); };
    window.addEventListener('resize', onResize);
    off.push(() => { window.removeEventListener('resize', onResize); clearTimeout(t); });

    root.addEventListener('click', e => {
      const item = e.target.closest('.u-item');
      if (item) { sfx(app, 'tap'); app.go('book', { focus: item.dataset.id }); return; }
      const b = e.target.closest('[data-act]');
      if (!b) return;
      sfx(app, 'tap');
      app.go(b.dataset.act);
    });

    music(app, 'home');
  },
  unmount() { off.forEach(f => f()); off = []; },
};
