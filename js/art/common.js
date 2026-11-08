/* 美術框架（主代理擁有）。由樣品 style/common.js 整理成 ES module。
 *
 * 每張圖一個檔（甜點 js/art/desserts/<id>.js、飲品 js/art/drinks/<id>.js、道具 js/art/props.js），
 * 用 IIFE 登記到 window.DESSERTS / window.DRINKS_ART / window.PROPS_ART：
 *   { draw(ctx), crumbs?: ['#…'], crunchy?: 0～1 }
 * draw 在 200×200 單位座標裡畫，不畫背景、不畫地面陰影。框架負責快取、白邊貼紙、投影、剪影、蕾絲紙墊。
 */
const UNIT = 200;
window.DESSERTS = window.DESSERTS || {};
window.DRINKS_ART = window.DRINKS_ART || {};
window.PROPS_ART = window.PROPS_ART || {};

/* ---------- 給美術檔用的小工具 ---------- */
const Kit = {
  // 固定種子的亂數：每次畫出來都一樣
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  // '#rrggbb' 調亮（amt>0）或調暗（amt<0），amt 介於 -1～1
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  },
};
window.DessertKit = Kit;

/* 樣品時期畫的 6 個甜點沒有寫 crumbs／crunchy，這裡補上 */
const LEGACY_META = {
  croissant: { crumbs: ['#D9963F', '#F2C27B', '#A8642A', '#FBE3B0'], crunchy: 1.0 },
  macaron: { crumbs: ['#F48FB1', '#FFE3EC', '#E86A92', '#FFF8F0'], crunchy: 0.6 },
  shortcake: { crumbs: ['#FFFFFF', '#F6D77E', '#E0314B', '#FFF4E0'], crunchy: 0.2 },
  eggtart: { crumbs: ['#F6C344', '#C98838', '#5B3418', '#FBE09A'], crunchy: 0.9 },
  donut: { crumbs: ['#4A2A1C', '#F46FA0', '#5BC0EB', '#FFE066', '#D9A35E'], crunchy: 0.4 },
  matcharoll: { crumbs: ['#7FB24A', '#FFFFFF', '#5E8C33', '#B9D98A'], crunchy: 0.2 },
};

const def = id => window.DESSERTS[id] || window.DRINKS_ART[id] || window.PROPS_ART[id] || null;
const cache = new Map();

function makeCanvas(px) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.max(1, Math.round(px));
  return c;
}

function placeholder(ctx) {
  ctx.fillStyle = 'rgba(160,120,90,.22)';
  ctx.beginPath(); ctx.arc(100, 100, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(120,80,60,.55)';
  ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 100, 104);
}

// 只有圖本身（透明背景）
function raw(id, px) {
  px = Math.round(px);
  const key = `raw|${id}|${px}`;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(px);
  const ctx = c.getContext('2d');
  ctx.scale(px / UNIT, px / UNIT);
  const d = def(id);
  ctx.save();
  try { d ? d.draw(ctx) : placeholder(ctx); }
  catch (e) { console.error(`圖 ${id} 繪製失敗`, e); }
  ctx.restore();
  cache.set(key, c);
  return c;
}

// 白邊貼紙版：border 為邊框粗細（裝置像素）
function sticker(id, px, border) {
  px = Math.round(px);
  const key = `stk|${id}|${px}|${border.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);
  const base = raw(id, px);
  const c = makeCanvas(px);
  const ctx = c.getContext('2d');
  const steps = 28;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.drawImage(base, Math.cos(a) * border, Math.sin(a) * border);
  }
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, px, px);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(base, 0, 0);
  cache.set(key, c);
  return c;
}

// 剪影：外形整個塗成單色
function silhouette(id, px) {
  px = Math.round(px);
  const key = `sil|${id}|${px}`;
  if (cache.has(key)) return cache.get(key);
  const base = raw(id, px);
  const c = makeCanvas(px);
  const ctx = c.getContext('2d');
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  const g = ctx.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, '#CDB9A8');
  g.addColorStop(1, '#AE9682');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  cache.set(key, c);
  return c;
}

function fitCanvas(canvas, css) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const px = Math.round(css * dpr);
  canvas.width = canvas.height = px;
  canvas.style.width = canvas.style.height = css + 'px';
  return { ctx: canvas.getContext('2d'), px, dpr };
}

// 蕾絲紙墊（從斜上方看是橢圓），在 200 單位座標裡畫
function drawDoily(ctx) {
  ctx.save();
  ctx.translate(100, 132);
  ctx.scale(1, 0.42);
  const R = 92, bumps = 36;
  ctx.beginPath();
  for (let i = 0; i <= bumps * 8; i++) {
    const a = (i / (bumps * 8)) * Math.PI * 2;
    const r = R + 5 * Math.pow(Math.abs(Math.sin(a * bumps / 2)), 0.6);
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.shadowColor = 'rgba(120,80,50,.18)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fffdf9';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(232,214,200,.75)';
  for (let ring = 0; ring < 3; ring++) {
    const rr = R - 9 - ring * 12, n = 30 - ring * 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, 3.2 - ring * 0.5, 3.2 - ring * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export const Art = {
  UNIT, Kit,
  has: id => !!def(id),
  crumbs: id => (def(id) && def(id).crumbs) || (LEGACY_META[id] && LEGACY_META[id].crumbs) || ['#E9C79A', '#F6E2C2', '#C99A66'],
  crunchy: id => {
    const d = def(id);
    if (d && typeof d.crunchy === 'number') return d.crunchy;
    return LEGACY_META[id] ? LEGACY_META[id].crunchy : 0.5;
  },
  raw, sticker, silhouette, fitCanvas, drawDoily,

  /** 盤面方塊、圖鑑小格：白邊貼紙＋柔和投影（透明背景，底色由外層元素負責） */
  renderTile(canvas, id, css) {
    const { ctx, px } = fitCanvas(canvas, css);
    ctx.clearRect(0, 0, px, px);
    const art = Math.round(px * 0.92);
    const border = Math.max(1.5, art * 0.028);
    const img = sticker(id, art, border);
    ctx.save();
    ctx.shadowColor = 'rgba(90,55,30,.28)';
    ctx.shadowBlur = Math.max(2, px * 0.05);
    ctx.shadowOffsetY = Math.max(1, px * 0.025);
    const o = (px - art) / 2;
    ctx.drawImage(img, o, o - px * 0.01);
    ctx.restore();
  },

  /** 圖鑑大圖、解鎖卡片：蕾絲紙墊＋甜點＋地面陰影 */
  renderShowcase(canvas, id, css) {
    const { ctx, px } = fitCanvas(canvas, css);
    ctx.clearRect(0, 0, px, px);
    ctx.save();
    ctx.scale(px / UNIT, px / UNIT);
    drawDoily(ctx);
    const g = ctx.createRadialGradient(100, 150, 4, 100, 150, 70);
    g.addColorStop(0, 'rgba(90,60,40,.28)');
    g.addColorStop(1, 'rgba(90,60,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(100, 150, 72, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const art = Math.round(px * 0.86);
    ctx.save();
    ctx.shadowColor = 'rgba(90,55,30,.22)';
    ctx.shadowBlur = px * 0.03;
    ctx.shadowOffsetY = px * 0.012;
    const o = (px - art) / 2;
    ctx.drawImage(raw(id, art), o, o - px * 0.02);
    ctx.restore();
  },

  /** 圖鑑未解鎖：剪影（doily:true 時下面墊蕾絲紙墊） */
  renderSilhouette(canvas, id, css, opts = {}) {
    const { ctx, px } = fitCanvas(canvas, css);
    ctx.clearRect(0, 0, px, px);
    if (opts.doily) {
      ctx.save(); ctx.scale(px / UNIT, px / UNIT); drawDoily(ctx); ctx.restore();
    }
    const art = Math.round(px * (opts.doily ? 0.86 : 0.92));
    const o = (px - art) / 2;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(silhouette(id, art), o, o - (opts.doily ? px * 0.02 : 0));
    ctx.globalAlpha = 1;
  },
};
window.Art = Art;
