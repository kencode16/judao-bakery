// 盤面畫面：木頭托盤＋烘焙紙、格子、方塊、奶油線圖層，以及被吃掉、果醬融化、禮盒打開、滑動、重排的動畫。
// 位置一律用「格子座標」：r=0 最上面；外圍虛擬格 r=-1、r=rows、c=-1、c=cols（奶油線會繞過去）。
import { Art } from '../art/common.js';
import { bgFor, paintKind, paintRaw } from './tileArt.js';
import { PipeLayer, PIPE_DRAW, trimEnds } from './cream.js';
import { BITES, biteAt } from './fx.js';

export const GAP = 4;
const EAT_STEP = 140;       // 每一口間隔
const SLIDE_MS = 300;
const SHUFFLE_MS = 560;

/** 被吃掉的時間軸（毫秒，從配對成功開始算）：給 gameScreen 排後續動畫 */
export const T = {
  pipe: PIPE_DRAW,
  eatA: PIPE_DRAW + 160, eatB: PIPE_DRAW + 220,
  swallow: PIPE_DRAW + 220 + 140 + BITES.length * EAT_STEP + 20,   // 第二個開始吞（約 1020）
  gone: PIPE_DRAW + 220 + 140 + BITES.length * EAT_STEP + 20 + 380, // 第二個完全消失（約 1400）
  slide: SLIDE_MS, shuffle: SHUFFLE_MS,
};

export class BoardView {
  /**
   * @param host  放盤面的容器（.g-stage）
   * @param opts  { rows, cols, speed, fx, sfx(name, opts), later(fn, ms), newKind, slide }
   */
  constructor(host, opts) {
    Object.assign(this, { rows: opts.rows, cols: opts.cols, speed: opts.speed || 1, fx: opts.fx, sfx: opts.sfx, later: opts.later });
    this.newKind = opts.newKind || null;
    this.tiles = new Map();   // id → { el, art, jamCv, kind, r, c, jam, gift }
    this.icings = [];
    this.size = 44; this.lp = 16; this.lane = 9;
    this.tray = document.createElement('div');
    this.tray.className = 'g-tray';
    this.tray.innerHTML = '<div class="g-liner"><div class="g-board"></div><canvas class="g-pipe"></canvas></div>';
    if (opts.slide && opts.slide !== 'none') {
      const tag = document.createElement('div');
      tag.className = `g-slidetag g-slide-${opts.slide}`;
      const arrow = { down: '↓', up: '↑', left: '←', right: '→' }[opts.slide];
      tag.innerHTML = `<b>${arrow}</b>往${{ down: '下', up: '上', left: '左', right: '右' }[opts.slide]}補位`;
      this.tray.appendChild(tag);
    }
    host.appendChild(this.tray);
    this.host = host;
    this.liner = this.tray.firstChild;
    this.boardEl = this.liner.querySelector('.g-board');
    this.pipe = new PipeLayer(this.liner.querySelector('.g-pipe'), this.speed);
  }
  D(ms) { return ms / this.speed; }

  /* ---------- 版面 ---------- */
  /** 依可用空間算格子大小：寬度優先（iPhone 390 寬＝44 px），高度不夠時再縮。
   *  v1.1：平板畫面大，寬度上限 480→720、格子上限 64→84 px，格子大時外圍走道跟著加寬（奶油線才不會貼著甜點） */
  measure() {
    const W = Math.min(this.host.clientWidth || 390, 720) - 16;   // 左右各留 8 px
    const H = (this.host.clientHeight || 600) - 8;
    let lp = 16, gap = GAP;
    const fit = (lp) => {
      const sw = Math.floor((W - 10 - 2 * lp - gap * (this.cols - 1)) / this.cols);
      const sh = Math.floor((H - 10 - 2 * lp - gap * (this.rows - 1)) / this.rows);
      return Math.min(sw, sh, 84);
    };
    let s = fit(lp);
    if (s > 56) { lp = Math.round(s * 0.3); s = fit(lp); }
    if (s < 44) { lp = 13; s = fit(lp); }
    this.size = Math.max(36, s); this.lp = lp; this.lane = Math.round(lp * 0.56);
  }
  layout() {
    this.measure();
    const { size, rows, cols, lp } = this;
    const bw = cols * size + (cols - 1) * GAP, bh = rows * size + (rows - 1) * GAP;
    this.bw = bw; this.bh = bh;
    this.boardEl.style.width = bw + 'px'; this.boardEl.style.height = bh + 'px';
    this.liner.style.padding = lp + 'px';
    this.pipe.resize(bw + 2 * lp, bh + 2 * lp);
    for (const s of this.boardEl.querySelectorAll('.g-slot')) this.place(s, +s.dataset.r, +s.dataset.c);
    for (const x of this.icings) { this.place(x.el, x.r, x.c); paintKind(x.cv, 'icing', size); }
    for (const t of this.tiles.values()) { this.place(t.el, t.r, t.c); this.paint(t); }
  }
  place(el, r, c) {
    const s = this.size;
    el.style.left = c * (s + GAP) + 'px'; el.style.top = r * (s + GAP) + 'px';
    el.style.width = el.style.height = s + 'px';
  }
  /** 格子中心（相對於 liner，奶油線圖層的座標） */
  cellXY(r, c) {
    const { size, lp, lane, rows, cols, bw, bh } = this;
    const x = c < 0 ? lp - lane : c >= cols ? lp + bw + lane : lp + c * (size + GAP) + size / 2;
    const y = r < 0 ? lp - lane : r >= rows ? lp + bh + lane : lp + r * (size + GAP) + size / 2;
    return [x, y];
  }

  /* ---------- 建立 ---------- */
  build(b) {
    this.boardEl.innerHTML = '';
    this.tiles.clear(); this.icings = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = b.cell(r, c);
      if (cell.hole) continue;
      const slot = document.createElement('div');
      slot.className = 'g-slot'; slot.dataset.r = r; slot.dataset.c = c;
      this.boardEl.appendChild(slot);
      if (cell.icing) {
        const el = document.createElement('div');
        el.className = 'g-icing';
        const cv = document.createElement('canvas'); el.appendChild(cv);
        this.boardEl.appendChild(el);
        this.icings.push({ el, cv, r, c });
      }
    }
    for (const t of b.tiles()) this.addTile(t);
    this.layout();
  }
  addTile(t) {
    const el = document.createElement('button');
    el.className = 'g-tile';
    el.type = 'button';
    el.dataset.id = t.id;
    const art = document.createElement('canvas'); art.className = 'g-art';
    el.appendChild(art);
    const rec = { el, art, jamCv: null, kind: t.kind, r: t.r, c: t.c, jam: !!t.jam, gift: !!t.gift, isNew: false };
    if (rec.jam) { rec.jamCv = document.createElement('canvas'); rec.jamCv.className = 'g-jam'; el.appendChild(rec.jamCv); }
    this.tiles.set(t.id, rec);
    this.boardEl.appendChild(el);
    this.decorate(rec);
    return rec;
  }
  /** 底色、NEW 標籤、禮盒樣式 */
  decorate(rec) {
    const { el } = rec;
    el.classList.toggle('g-gift', rec.gift);
    el.classList.toggle('g-locked', rec.jam || rec.gift);
    el.style.background = rec.gift ? 'transparent' : bgFor(rec.kind);
    // 2026-11-08 使用者要求：盤面不顯示 NEW，讓玩家自己發現新甜點
    el.setAttribute('aria-label', rec.gift ? '上鎖禮盒' : rec.kind);
  }
  paint(rec) {
    const s = this.size;
    if (rec.gift) paintKind(rec.art, 'gift', s);
    else paintKind(rec.art, rec.kind, Math.round(s * 0.9));
    if (rec.jamCv) paintRaw(rec.jamCv, 'jam', s);
  }

  /* ---------- 狀態樣式 ---------- */
  setSelected(id, on) { this.tiles.get(id)?.el.classList.toggle('g-sel', on); }
  setHinted(ids) {
    for (const t of this.tiles.values()) t.el.classList.remove('g-hinted');
    for (const id of ids || []) this.tiles.get(id)?.el.classList.add('g-hinted');
  }
  /** 連不到：搖頭 */
  shake(id) {
    const el = this.tiles.get(id)?.el; if (!el) return;
    el.animate([{ rotate: '0deg' }, { rotate: '-9deg' }, { rotate: '8deg' }, { rotate: '-5deg' }, { rotate: '0deg' }],
      { duration: this.D(340), easing: 'ease-in-out', composite: 'add' });
  }
  /** 點到黏住的（果醬、禮盒）：果凍一樣抖一下 */
  wobble(id) {
    const el = this.tiles.get(id)?.el; if (!el) return;
    el.animate([{ scale: '1' }, { scale: '1.08 .92' }, { scale: '.95 1.05' }, { scale: '1.02 .98' }, { scale: '1' }],
      { duration: this.D(380), easing: 'ease-out' });
  }

  /* ---------- 奶油線 ---------- */
  pipePath(path) {
    const pts = path.map(([r, c]) => this.cellXY(r, c));
    trimEnds(pts, this.size * 0.4);
    this.pipe.add(pts, Math.max(8, this.size * 0.26));
  }

  /* ---------- 被吃掉 ---------- */
  /** 咬三口（齒痕＋碎屑＋喀滋），最後一口吞掉；結束後移除方塊。withSound：兩塊同時吃時只讓一塊出聲 */
  eat(id, delay, withSound, done) {
    const rec = this.tiles.get(id); if (!rec) return;
    this.tiles.delete(id);
    rec.el.classList.add('g-eating');
    rec.el.classList.remove('g-hinted');
    const c = rec.art, ctx = c.getContext('2d'), W = c.width;
    const colors = Art.crumbs(rec.kind), crunchy = Art.crunchy(rec.kind);
    const flip = Math.random() < 0.5;
    const lift = 'translateY(-3px) scale(1.07)';
    BITES.forEach(([x, y, r], i) => this.later(() => {
      const bx = flip ? 1 - x : x;
      biteAt(ctx, W, bx, y, r);
      const rc = c.getBoundingClientRect();
      this.fx.crumbs(rc.left + bx * rc.width, rc.top + y * rc.height, colors, 6);
      if (withSound) this.sfx('crunch', { bite: i, crunchy });
      rec.el.animate([{ transform: lift }, { transform: 'translateY(-1px) scale(.94,1.02)' }, { transform: lift }], { duration: this.D(120) });
    }, delay + 140 + i * EAT_STEP));
    this.later(() => {
      const rc = c.getBoundingClientRect();
      this.fx.crumbs(rc.left + rc.width / 2, rc.top + rc.height / 2, colors, 9);
      if (withSound) this.sfx('crunch', { bite: BITES.length, crunchy });
      c.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.82) translateY(-6%)', opacity: 0.9, offset: 0.35 },
        { transform: 'scale(.15) translateY(-30%)', opacity: 0 }], { duration: this.D(260), easing: 'ease-in', fill: 'forwards' });
      rec.el.animate([{ transform: lift, opacity: 1 }, { transform: lift, opacity: 1, offset: 0.5 },
        { transform: 'scale(.6)', opacity: 0 }], { duration: this.D(380), easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        rec.el.remove(); done && done();
      };
    }, delay + 140 + BITES.length * EAT_STEP + 20);
    return rec;
  }
  /** 吃到一半的樣子（測試用）：直接在方塊上咬 n 口 */
  biteNow(id, n) {
    const rec = this.tiles.get(id); if (!rec) return;
    const ctx = rec.art.getContext('2d');
    for (let i = 0; i < n; i++) { const [x, y, r] = BITES[i]; biteAt(ctx, rec.art.width, x, y, r, 0.3); }
    rec.el.classList.add('g-sel');
  }

  /* ---------- 果醬融化 ---------- */
  meltJam(id, done) {
    const rec = this.tiles.get(id); if (!rec) { done && done(); return; }
    rec.jam = false; this.decorate(rec);
    const cv = rec.jamCv; rec.jamCv = null;
    if (!cv) { done && done(); return; }
    const rc = rec.el.getBoundingClientRect();
    this.fx.crumbs(rc.left + rc.width / 2, rc.top + rc.height * 0.7, ['#E8546E', '#F27A90', '#C9334F', '#FFB3C1'], 7);
    cv.animate([{ transform: 'translateY(0) scaleY(1)', opacity: 1 },
      { transform: 'translateY(6%) scaleY(1.08)', opacity: 0.85, offset: 0.4 },
      { transform: 'translateY(26%) scaleY(1.25)', opacity: 0 }], { duration: this.D(460), easing: 'ease-in', fill: 'forwards' })
      .onfinish = () => { cv.remove(); done && done(); };
    rec.el.animate([{ scale: '1' }, { scale: '1.06' }, { scale: '1' }], { duration: this.D(300), delay: this.D(300) });
  }

  /* ---------- 禮盒打開 ---------- */
  openGift(id, kind, done) {
    const rec = this.tiles.get(id); if (!rec) { done && done(); return; }
    const old = rec.art;
    const rc = rec.el.getBoundingClientRect();
    old.animate([{ transform: 'scale(1) rotate(0)', opacity: 1 }, { transform: 'scale(1.18) rotate(-6deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.35) rotate(8deg)', opacity: 0 }], { duration: this.D(360), easing: 'ease-in', fill: 'forwards' });
    this.later(() => {
      this.fx.burst(rc.left + rc.width / 2, rc.top + rc.height / 2, rc.width * 0.9, 10, ['#F7B6C8', '#FFE08A', '#FFFFFF', '#F48FB1']);
      rec.kind = kind; rec.gift = false;
      const art = document.createElement('canvas'); art.className = 'g-art';
      rec.el.replaceChild(art, old); rec.art = art;
      this.decorate(rec); this.paint(rec);
      rec.el.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }],
        { duration: this.D(380), easing: 'ease-out' }).onfinish = () => done && done();
    }, 300);
  }

  /* ---------- 滑動補位（FLIP） ---------- */
  slide(moves, done) {
    const s = this.size;
    for (const m of moves) {
      const rec = this.tiles.get(m.id); if (!rec) continue;
      const el = rec.el;
      // 目前看到的位置（含還在進行中的上一段滑動）
      let ox = parseFloat(el.style.left), oy = parseFloat(el.style.top);
      const cur = getComputedStyle(el).translate;
      if (cur && cur !== 'none') { const [tx, ty = '0'] = cur.split(' '); ox += parseFloat(tx) || 0; oy += parseFloat(ty) || 0; }
      el.getAnimations().filter(a => a.id === 'slide').forEach(a => a.cancel());
      rec.r = m.to[0]; rec.c = m.to[1];
      this.place(el, rec.r, rec.c);
      const dx = ox - rec.c * (s + GAP), dy = oy - rec.r * (s + GAP);
      const a = el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }],
        { duration: this.D(SLIDE_MS), easing: 'cubic-bezier(.3,1.25,.5,1)' });
      a.id = 'slide';
    }
    this.later(() => done && done(), SLIDE_MS + 20);
  }

  /* ---------- 卡死自動重排：轉一圈換圖 ---------- */
  shuffle(list, done) {
    for (const t of list) {
      const rec = this.tiles.get(t.id); if (!rec) continue;
      rec.el.classList.remove('g-sel', 'g-hinted');
      rec.el.animate([{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(.45) rotate(-120deg)', offset: 0.48 },
        { transform: 'scale(.45) rotate(120deg)', offset: 0.52 }, { transform: 'scale(1) rotate(0deg)' }],
      { duration: this.D(SHUFFLE_MS), easing: 'ease-in-out' });
      this.later(() => { rec.kind = t.kind; this.decorate(rec); this.paint(rec); }, SHUFFLE_MS * 0.48);
    }
    this.later(() => done && done(), SHUFFLE_MS + 20);
  }

  /** 方塊在畫面上的中心（viewport 座標） */
  centerOf(id) {
    const rec = this.tiles.get(id); if (!rec) return null;
    const r = rec.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  destroy() { this.pipe.stop(); }
}
