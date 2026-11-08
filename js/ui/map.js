// 地圖：5 個地區由上往下的旅行路線（D 擁有）。畫面合約見 架構.md。
import { esc, flower, sfx, music, topBar, regionVars, levelState, currentLevelId, LATIN_NAME, REGION_LINE } from './common.js';

const ROW_H = 98;          // 每一排的高度（px）
const COL_X = [17, 50, 83]; // 一排 3 關的水平位置（%）
let off = [];

/** 第 i 關（區內 0 起算）的位置：每排 3 關、蛇行；最後一排只有 1 關時置中 */
function nodePos(i, n) {
  const row = Math.floor(i / 3), col = i % 3;
  const inRow = Math.min(3, n - row * 3);
  let x = COL_X[row % 2 ? 2 - col : col];
  if (inRow === 1) x = 50;
  else if (inRow === 2) x = (row % 2 ? [67, 33] : [33, 67])[col];
  return { x, y: row * ROW_H + 40, row };
}

/** 咖啡杯（每區第 10 關，D 關） */
const CUP = `<svg class="u-cup-svg" viewBox="0 0 72 64" aria-hidden="true" focusable="false">
  <path class="u-steam" d="M27 15c-4-4 4-6 0-11M37 15c-4-4 4-6 0-11M47 15c-4-4 4-6 0-11" fill="none" stroke-width="2.6" stroke-linecap="round"/>
  <ellipse class="u-saucer" cx="36" cy="56" rx="30" ry="6.5"/>
  <path class="u-handle" d="M56 27c10-2 12 12 0 15" fill="none" stroke-width="5" stroke-linecap="round"/>
  <path class="u-cupbody" d="M11 21h48v5c0 15-9 27-24 27S11 41 11 26z"/>
  <ellipse class="u-cuprim" cx="35" cy="21" rx="24" ry="4.5"/>
</svg>`;
const LOCK = `<svg class="u-lock" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor"/></svg>`;

const starRow = n => `<span class="u-nstars" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

/** Catmull-Rom 曲線穿過所有點 → SVG path */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export default {
  async mount(root, params, app) {
    const { REGIONS } = app.config;
    const cur = currentLevelId(app);
    const total = app.save.totalStars();

    const sections = REGIONS.map((r, ri) => {
      const [a, b] = r.levels;
      const n = b - a + 1;
      const rows = Math.ceil(n / 3);
      let rStars = 0, cleared = 0, anyOpen = false;
      const nodes = [];
      for (let i = 0; i < n; i++) {
        const id = a + i;
        const st = levelState(app, id);
        const lv = app.levelById(id);
        const s = app.save.levelStars(id);
        rStars += s; if (st === 'cleared') cleared++;
        if (st === 'open' || st === 'cleared') anyOpen = true;
        const cup = id === b || !!lv?.pairing;
        const { x, y } = nodePos(i, n);
        const isCur = id === cur;
        const label = `第 ${id} 關` + (cup ? '（飲品搭配關）' : '') +
          ({ cleared: `，${s} 顆星`, open: isCur ? '，目前這關' : '', locked: '，還沒開放', nodata: '，未開放' }[st]);
        nodes.push(`<button class="u-node u-${st}${isCur ? ' u-cur' : ''}${cup ? ' u-cupnode' : ''}" style="left:${x}%;top:${y}px" data-level="${id}" aria-label="${esc(label)}">
  ${isCur ? '<span class="u-here">在這裡</span>' : ''}
  <span class="u-face">${cup ? CUP : ''}<b>${id}</b>${st === 'locked' ? LOCK : ''}</span>
  ${st === 'cleared' ? starRow(s) : st === 'nodata' ? '<span class="u-nnote">未開放</span>' : cup ? '<span class="u-nnote u-cupnote">飲品搭配</span>' : ''}
</button>`);
      }
      const done = cleared === n;
      const next = REGIONS[ri + 1];
      return `
<section class="u-region${anyOpen ? '' : ' u-far'}${done ? ' u-done' : ''}" style="${regionVars(r)}" data-region="${r.id}">
  <header class="u-rhead">
    <span class="u-rflag" aria-hidden="true">${r.flag}</span>
    <div class="u-rtext"><h2>${esc(r.name)}</h2><p>第 ${a}～${b} 關・${esc(REGION_LINE[r.id] || '')}</p></div>
    <div class="u-stamp${done ? ' on' : ''}" aria-label="${done ? '已蓋章' : '還沒蓋章'}">
      <span class="u-stamp-in"><small>${esc(LATIN_NAME[r.id] || r.id)}</small><b>${done ? '已集章' : '★ ' + rStars + '/' + n * 3}</b></span>
    </div>
  </header>
  <div class="u-path" style="height:${rows * ROW_H}px" data-n="${n}">
    <svg class="u-route" aria-hidden="true"><path class="u-road"/><path class="u-dots"/><path class="u-trail"/></svg>
    ${nodes.join('')}
  </div>
</section>
${next ? `<div class="u-hop" style="${regionVars(next)}"><span>✈︎</span> 下一站：${next.flag} ${esc(next.name)}</div>` : ''}`;
    }).join('');

    root.innerHTML = `
${topBar({ title: '旅行地圖', right: `<span class="u-top-stars"><b class="u-star" aria-hidden="true">★</b> ${total}</span>` })}
<div class="u-map">
  <p class="u-map-intro">${flower(20)} 從菊島出發，到世界各地收集甜點 ${flower(20)}</p>
  ${sections}
  <p class="u-map-end">${flower(18)} 每一站都有新甜點等著你 ${flower(18)}</p>
</div>`;

    // 路線：量實際寬度再畫（寬度改變時重畫）
    const drawRoutes = () => {
      root.querySelectorAll('.u-path').forEach(p => {
        const w = p.clientWidth, h = p.clientHeight;
        const svg = p.querySelector('.u-route');
        svg.setAttribute('width', w); svg.setAttribute('height', h);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const btns = [...p.querySelectorAll('.u-node')];
        const pts = btns.map(btn => [parseFloat(btn.style.left) / 100 * w, parseFloat(btn.style.top)]);
        if (!pts.length) return;
        const full = [[pts[0][0], 0], ...pts, [pts[pts.length - 1][0], h]];
        const d = smoothPath(full);
        svg.querySelector('.u-road').setAttribute('d', d);
        svg.querySelector('.u-dots').setAttribute('d', d);
        // 走過的路：從入口走到最後一個「已過關或目前」的關卡
        let k = -1;
        btns.forEach((btn, i) => { if (btn.classList.contains('u-cleared') || btn.classList.contains('u-cur')) k = i; });
        const trail = svg.querySelector('.u-trail');
        if (k >= 0) {
          const part = [[pts[0][0], 0], ...pts.slice(0, k + 1)];
          // 這區全部過完就連到出口
          if (k === pts.length - 1 && btns[k].classList.contains('u-cleared')) part.push([pts[k][0], h]);
          trail.setAttribute('d', smoothPath(part));
        } else trail.removeAttribute('d');
      });
    };
    drawRoutes();
    let ro = null;
    if ('ResizeObserver' in window) {
      let lastW = 0;
      ro = new ResizeObserver(() => { const w = root.clientWidth; if (w !== lastW) { lastW = w; drawRoutes(); } });
      ro.observe(root);
      off.push(() => ro.disconnect());
    }

    root.addEventListener('click', e => {
      if (e.target.closest('[data-back]')) { sfx(app, 'tap'); app.go('home'); return; }
      const node = e.target.closest('[data-level]');
      if (!node) return;
      const id = Number(node.dataset.level);
      const st = levelState(app, id);
      if (st === 'nodata') { sfx(app, 'tap'); app.toast('這關還在準備中～'); return; }
      if (st === 'locked') { sfx(app, 'tap'); app.toast(`先完成第 ${id - 1} 關喔～`); return; }
      sfx(app, 'tap');
      app.go('level', { levelId: id });
    });

    // 捲到目前關卡（沒有的話捲到最後一個過關的）
    const target = root.querySelector('.u-node.u-cur') || [...root.querySelectorAll('.u-node.u-cleared')].pop();
    if (target) target.scrollIntoView({ block: 'center' });

    music(app, 'map');
  },
  unmount() { off.forEach(f => f()); off = []; },
};
