// D 介面共用小工具（D 擁有）。只給 js/ui/* 用。

/** HTML 跳脫 */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const reduceMotion = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
};

/** 音效、音樂（F 的模組還沒好或出錯時不影響畫面） */
export function sfx(app, name, opts) { try { app.audio?.sfx?.(name, opts); } catch (e) { console.warn('sfx', e); } }
export function music(app, track) { try { app.audio?.playMusic?.(track); } catch (e) { console.warn('music', e); } }

/** 地區的 CSS 變數 */
export const regionVars = r => `--ra:${r.theme.accent};--rs:${r.theme.soft};--rd:${r.theme.deep}`;

/** 地區簡稱（圖鑑分頁用） */
export const SHORT_NAME = { fr: '法國', tw: '台灣', se: '南歐', us: '英美', jp: '日本' };
/** 地區英文（護照章用） */
export const LATIN_NAME = { fr: 'France', tw: 'Taiwan', se: 'Sud Europa', us: 'UK & USA', jp: 'Japan' };
/** 地區一句話（介面裝飾文字） */
export const REGION_LINE = {
  fr: '從巴黎街角的麵包店出發',
  tw: '還有菊島的家鄉味',
  se: '地中海的陽光和咖啡香',
  us: '英式下午茶與美式烘焙',
  jp: '細緻的和洋菓子',
};

/** 天人菊（澎湖縣花，紅心黃邊）小裝飾 SVG */
let flowerSeq = 0;
export function flower(size = 28, cls = '') {
  const id = 'u-fl' + (++flowerSeq);
  let petals = '';
  for (let i = 0; i < 12; i++) petals += `<use href="#${id}p" transform="rotate(${i * 30 + 8})"/>`;
  let dots = '';
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2, r = i % 2 ? 9.5 : 6;
    dots += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="1.6"/>`;
  }
  return `<svg class="u-flower ${cls}" width="${size}" height="${size}" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="-47">
<stop offset="0" stop-color="#9E2228"/><stop offset=".45" stop-color="#D0402E"/><stop offset=".64" stop-color="#EC8F2C"/><stop offset=".78" stop-color="#F6C440"/><stop offset="1" stop-color="#FCE07A"/>
</linearGradient>
<radialGradient id="${id}c" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#A8532C"/><stop offset="1" stop-color="#561B10"/></radialGradient>
<path id="${id}p" d="M-4-9C-10-20-13-31-12-40L-8-47-4.5-42 0-48 4.5-42 8-47 12-40C13-31 10-20 4-9Z" fill="url(#${id}g)" stroke="#8E2E1C" stroke-opacity=".28" stroke-width="1"/>
</defs>
<g>${petals}</g>
<circle r="14.5" fill="url(#${id}c)"/>
<g fill="#E0A13E" opacity=".85">${dots}</g>
</svg>`;
}

/** 子畫面頂端：細遮陽棚＋返回鈕＋標題＋右側資訊 */
export function topBar({ title, right = '', backLabel = '首頁' }) {
  return `<div class="awning u-awning-thin"></div>
<header class="u-top">
  <button class="u-back" data-back aria-label="回${esc(backLabel)}"><span aria-hidden="true">‹</span> ${esc(backLabel)}</button>
  <h1 class="u-top-title">${esc(title)}</h1>
  <div class="u-top-r">${right}</div>
</header>`;
}

/* ---------- 關卡與甜點 ---------- */

/** 最後一關的編號（依 REGIONS 的區間，不依 levels.js 目前有幾關） */
export const lastLevelId = app => Math.max(...app.config.REGIONS.map(r => r.levels[1]));

/** 關卡狀態：'nodata'（還沒有資料＝未開放）、'locked'、'open'、'cleared' */
export function levelState(app, id) {
  if (!app.levelById(id)) return 'nodata';
  if (app.save.levelStars(id) > 0) return 'cleared';
  return app.save.isLevelOpen(id) ? 'open' : 'locked';
}

/** 目前該玩的關：第一個有資料、已開放、還沒過的關；沒有就回傳 null */
export function currentLevelId(app) {
  const last = lastLevelId(app);
  for (let id = 1; id <= last; id++) if (levelState(app, id) === 'open') return id;
  return null;
}

/** 這個甜點在哪一關解鎖（找 levels 裡 unlocks 含它的關） */
export const levelOfDessert = (app, id) => app.levels.find(l => (l.unlocks || []).includes(id)) || null;

export function debutText(app, id) {
  const lv = levelOfDessert(app, id);
  if (!lv) return '之後的關卡登場';
  return lv.id === 1 ? '第 1 關登場（開店禮）' : `第 ${lv.id} 關登場`;
}

/** 已過關數 */
export const clearedCount = app => app.levels.filter(l => app.save.levelStars(l.id) > 0).length;

/** 資料裡少數網址的右括號被切掉了（例如 …Croissant_(viennoiserie），補回來 */
export function fixUrl(url) {
  let u = String(url || '');
  const open = (u.match(/\(/g) || []).length, close = (u.match(/\)/g) || []).length;
  if (open > close) u += ')'.repeat(open - close);
  return /^https?:\/\//.test(u) ? u : '#';
}

/** 糖粉＋小星星噴發（position: fixed，掛在 host 底下，畫面卸載時一起清掉） */
export function burst(host, cx, cy, dist) {
  if (reduceMotion() || !host) return;
  const colors = ['#F7B6C8', '#FFE08A', '#BFE3F5', '#CBEFD9', '#FFFFFF', '#E9D5FF'];
  for (let i = 0; i < 9; i++) {
    const s = document.createElement('div');
    const isStar = i % 3 === 0;
    s.className = isStar ? 'u-burst-star' : 'u-burst-dot';
    const col = colors[i % colors.length];
    if (isStar) { s.textContent = '✦'; s.style.color = col === '#FFFFFF' ? '#FFD36E' : col; }
    else s.style.background = col;
    s.style.left = cx - 4 + 'px'; s.style.top = cy - 4 + 'px';
    host.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = dist * (0.6 + Math.random() * 0.6);
    const anim = s.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(.3)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)' });
    anim.onfinish = () => s.remove();
  }
}
