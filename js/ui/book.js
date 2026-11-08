// 甜點圖鑑：5 個地區分頁＋大卡片（D 擁有）。畫面合約見 架構.md。params：{ region?, focus? }
import { esc, flower, sfx, music, topBar, regionVars, reduceMotion, debutText, levelOfDessert, fixUrl, burst, SHORT_NAME, REGION_LINE } from './common.js';

let off = [];
const pad3 = n => String(n).padStart(3, '0');

export default {
  async mount(root, params, app) {
    const { DESSERTS, DESSERT_BY_ID, DRINK_BY_ID } = app.data;
    const { REGIONS, REGION_BY_ID, TILE_BG, CREAM_BG } = app.config;
    const save = app.save;
    const byRegion = Object.fromEntries(REGIONS.map(r => [r.id, DESSERTS.filter(d => d.region === r.id).sort((a, b) => a.no - b.no)]));
    const gotIn = rid => byRegion[rid].filter(d => save.isUnlocked(d.id)).length;
    const newIn = rid => byRegion[rid].some(d => save.isNewInBook(d.id));
    const totalGot = () => DESSERTS.filter(d => save.isUnlocked(d.id)).length;

    let region = (params.region && REGION_BY_ID[params.region]) ? params.region
      : (params.focus && DESSERT_BY_ID[params.focus]) ? DESSERT_BY_ID[params.focus].region
      : (REGIONS.find(r => newIn(r.id)) || REGIONS[0]).id;

    root.innerHTML = `
${topBar({ title: '甜點圖鑑', right: '<span class="u-top-count"></span>' })}
<nav class="u-tabs" role="tablist" aria-label="地區"></nav>
<div class="u-book"></div>
<div class="u-sheet" hidden></div>`;
    const tabsEl = root.querySelector('.u-tabs');
    const pageEl = root.querySelector('.u-book');
    const sheet = root.querySelector('.u-sheet');
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearLater = () => { timers.forEach(clearTimeout); timers = []; };
    off.push(clearLater);

    const renderCount = () => {
      root.querySelector('.u-top-count').innerHTML = `收集 <b>${totalGot()}</b>／${DESSERTS.length}`;
    };

    const renderTabs = () => {
      tabsEl.innerHTML = REGIONS.map(r => `
<button class="u-tab${r.id === region ? ' on' : ''}" role="tab" aria-selected="${r.id === region}" data-region="${r.id}" style="${regionVars(r)}">
  ${r.id === 'tw' ? flower(15, 'u-tab-fl') : ''}<span class="u-tab-flag" aria-hidden="true">${r.flag}</span>
  <span class="u-tab-name">${esc(SHORT_NAME[r.id] || r.name)}</span>
  <span class="u-tab-n">${gotIn(r.id)}/${byRegion[r.id].length}</span>

</button>`).join('');
    };

    const slotHtml = d => {
      const open = save.isUnlocked(d.id);
      const lv = levelOfDessert(app, d.id);
      return `
<button class="u-slot${open ? '' : ' u-locked'}" data-id="${esc(d.id)}" style="--bg:${TILE_BG[d.bg] || '#F3E6D8'}"
  aria-label="${open ? esc(d.name) : '未解鎖甜點，' + esc(debutText(app, d.id))}">
  <span class="u-slot-tile"><canvas></canvas><span class="u-slot-no">${pad3(d.no)}</span>${open ? '' : '<span class="u-q" aria-hidden="true">?</span>'}</span>
  <span class="u-slot-name">${open ? esc(d.name) : '？？？'}</span>
  ${open ? '' : `<span class="u-slot-sub">${lv ? `第 ${lv.id} 關` : '敬請期待'}</span>`}
</button>`;
    };

    const tileSize = () => {
      const grid = pageEl.querySelector('.u-grid');
      const w = grid ? grid.clientWidth : 340;
      return Math.floor((w - 3 * 10) / 4 * 0.86);
    };
    const paintSlot = (btn, size) => {
      const id = btn.dataset.id;
      const c = btn.querySelector('canvas');
      if (save.isUnlocked(id)) app.art.renderTile(c, id, size);
      else app.art.renderSilhouette(c, id, size);
    };

    const firstDebut = list => {
      const ids = list.map(d => levelOfDessert(app, d.id)?.id).filter(Boolean);
      return ids.length ? `這一區的甜點都還在等你，第 ${Math.min(...ids)} 關起陸續登場喔` : '這一區的甜點會在之後的關卡陸續登場喔';
    };
    const renderPage = () => {
      const r = REGION_BY_ID[region];
      const list = byRegion[region];
      const n = gotIn(region);
      pageEl.innerHTML = `
<section class="u-bpage" style="${regionVars(r)}" role="tabpanel" aria-label="${esc(r.name)}">
  <header class="u-bhead">
    <span class="u-bflag" aria-hidden="true">${r.flag}</span>
    <div class="u-btext"><h2>${esc(r.name)}</h2><p>${esc(REGION_LINE[r.id] || '')}</p></div>
    <div class="u-bprog"><span><b>${n}</b>／${list.length}</span><i class="u-bar" aria-hidden="true"><i style="width:${(n / list.length * 100).toFixed(1)}%"></i></i></div>
  </header>
  <div class="u-grid">${list.map(slotHtml).join('')}</div>
  ${n === 0 ? `<p class="u-bnote">${flower(16)} ${esc(firstDebut(list))}</p>` : ''}
</section>`;
      const size = tileSize();
      pageEl.querySelectorAll('.u-slot').forEach(b => paintSlot(b, size));
    };

    /* ---------- 大卡片 ---------- */
    let openId = null;
    const cardHtml = (d, reveal) => {
      const r = REGION_BY_ID[d.region];
      const open = save.isUnlocked(d.id);
      const list = byRegion[d.region];
      const idx = list.indexOf(d);
      const drink = DRINK_BY_ID[d.drink];
      const nav = `
  ${idx > 0 ? '<button class="u-nav u-prev" data-nav="-1" aria-label="上一個">‹</button>' : ''}
  ${idx < list.length - 1 ? '<button class="u-nav u-next" data-nav="1" aria-label="下一個">›</button>' : ''}`;
      const body = open ? `
  <h2 class="u-cname">${esc(d.name)}</h2>
  <div class="u-corig">${esc(d.orig)}</div>
  <span class="u-pill">${esc(d.place)}</span>
  <dl class="u-facts">
    <dt>口感</dt><dd>${esc(d.texture)}</dd>
    <dt>搭配飲品</dt><dd class="u-drink"><span class="u-drink-tile" style="background:${CREAM_BG}"><canvas></canvas></span><span>${esc(drink ? drink.name : d.drink)}</span></dd>
    ${d.alsoDrink ? `<dt>也很搭</dt><dd>${esc(d.alsoDrink)}</dd>` : ''}
  </dl>
  <div class="u-story"><span class="u-label">小故事</span>${esc(d.story)}</div>
  ${d.origin ? `<div class="u-origin"><span class="u-label">產地說法</span>${esc(d.origin)}</div>` : ''}
` : `
  <div class="u-lockbody">
    <h2 class="u-cname u-qname">？？？</h2>
    <span class="u-pill">${r.flag} ${esc(r.name)}</span>
    <p class="u-debut">${esc(debutText(app, d.id))}</p>
    <p class="u-lockhint">過關解鎖後，就能看到它的口感、搭配飲品和小故事。</p>
    <button class="btn ghost u-tomap" data-tomap>去地圖看看</button>
  </div>`;
      return `
<div class="u-sheet-bg" data-close></div>
<article class="card u-card${open ? '' : ' u-locked'}${reveal ? ' u-pre' : ''}" style="--bg:${TILE_BG[d.bg] || '#F3E6D8'};${regionVars(r)}" role="dialog" aria-modal="true" aria-label="${open ? esc(d.name) : '未解鎖甜點'}">
  <button class="u-x" data-close aria-label="關閉">×</button>
  <div class="u-stage">
    <span class="u-no">No.${pad3(d.no)}</span>
    <canvas class="u-full"></canvas><canvas class="u-sil"></canvas>
    <div class="u-bigq" aria-hidden="true">?</div>
    ${nav}
  </div>
  <div class="u-cbody">${body}</div>
</article>`;
    };

    const openCard = (id, how = 'open') => {
      const d = DESSERT_BY_ID[id];
      if (!d) return;
      const open = save.isUnlocked(id);
      const wasNew = open && save.isNewInBook(id);
      const reveal = wasNew && !reduceMotion();
      clearLater();
      openId = id;
      sheet.innerHTML = cardHtml(d, reveal);
      sheet.hidden = false;
      document.documentElement.classList.add('u-noscroll');
      const card = sheet.querySelector('.u-card');
      const stageW = Math.min(card.clientWidth || 340, 440);
      const big = Math.round(Math.min(280, stageW * 0.74));
      const full = card.querySelector('.u-full');
      if (open) app.art.renderShowcase(full, id, big);
      else { full.width = full.height = 1; full.style.width = full.style.height = big + 'px'; }
      app.art.renderSilhouette(card.querySelector('.u-sil'), id, big, { doily: true });
      const dc = card.querySelector('.u-drink-tile canvas');
      if (dc) app.art.renderTile(dc, d.drink, 34);
      if (how === 'open') card.classList.add('u-pop');
      card.querySelector('.u-x').focus({ preventScroll: true });

      if (wasNew) {
        save.markBookSeen(id);
        card.classList.add('u-just');
        renderTabs(); renderCount();
        const slot = pageEl.querySelector(`.u-slot[data-id="${CSS.escape(id)}"] .u-new`);
        if (slot) slot.remove();
        if (reveal) {
          later(() => {
            card.classList.remove('u-pre');
            sfx(app, 'unlock');
            const rect = card.querySelector('.u-stage').getBoundingClientRect();
            for (let k = 0; k < 3; k++) later(() => burst(sheet, rect.left + rect.width / 2, rect.top + rect.height * 0.55, rect.width * 0.42), k * 130);
          }, 420);
        } else sfx(app, 'unlock');
      } else sfx(app, 'page');
    };

    const closeCard = () => {
      if (sheet.hidden) return;
      clearLater();
      sheet.hidden = true;
      sheet.innerHTML = '';
      openId = null;
      document.documentElement.classList.remove('u-noscroll');
    };
    off.push(() => document.documentElement.classList.remove('u-noscroll'));

    const step = dir => {
      if (!openId) return;
      const list = byRegion[DESSERT_BY_ID[openId].region];
      const next = list[list.indexOf(DESSERT_BY_ID[openId]) + dir];
      if (next) openCard(next.id, 'step');
    };

    const switchRegion = rid => {
      if (rid === region || !REGION_BY_ID[rid]) return;
      region = rid;
      sfx(app, 'page');
      renderTabs(); renderPage();
      const top = tabsEl.getBoundingClientRect().top + window.scrollY - (root.querySelector('.u-top')?.offsetHeight || 0);
      if (window.scrollY > top) window.scrollTo(0, top);
    };

    root.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-back]')) { sfx(app, 'tap'); app.go('home'); return; }
      if (t.closest('[data-close]')) { sfx(app, 'tap'); closeCard(); return; }
      if (t.closest('[data-tomap]')) { sfx(app, 'tap'); app.go('map'); return; }
      const nav = t.closest('[data-nav]');
      if (nav) { step(Number(nav.dataset.nav)); return; }
      const tab = t.closest('.u-tab');
      if (tab) { switchRegion(tab.dataset.region); return; }
      const slot = t.closest('.u-slot');
      if (slot) openCard(slot.dataset.id);
    });

    // 左右滑動換卡片
    let sx = null, sy = 0;
    sheet.addEventListener('pointerdown', e => { if (e.target.closest('.u-stage') && !e.target.closest('button')) { sx = e.clientX; sy = e.clientY; } });
    sheet.addEventListener('pointerup', e => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
    sheet.addEventListener('pointercancel', () => { sx = null; });

    const onKey = e => {
      if (sheet.hidden) return;
      if (e.key === 'Escape') closeCard();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    off.push(() => window.removeEventListener('keydown', onKey));

    // 寬度改變時重畫格子
    let lastW = window.innerWidth, rt = 0;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; renderPage(); } }, 150); };
    window.addEventListener('resize', onResize);
    off.push(() => { window.removeEventListener('resize', onResize); clearTimeout(rt); });

    renderCount(); renderTabs(); renderPage();
    if (params.focus && DESSERT_BY_ID[params.focus]) openCard(params.focus);
    music(app, 'home');
  },
  unmount() { off.forEach(f => f()); off = []; },
};
