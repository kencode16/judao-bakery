// 關卡畫面（畫面名稱 level，params { levelId }）。手感照樣品 style/index_v3.html：
// 點選浮起 → 奶油擠花線 → 叮 → 被咬三口吃掉；失敗搖頭；提示發光；卡死自動重排（引擎做，這裡播動畫）。
import { REGION_BY_ID, levelRegion, COLS } from '../config.js';
import { BoardView, T } from './boardView.js';
import { makeFx, drawGaillardia } from './fx.js';
import { OrdersBar } from './orders.js';
import { showIntro, showMenu, showPause, showWin, lightStar, unlockSection, winButtons } from './overlays.js';
import { TEST_LEVELS } from './testLevels.js';
import { createBoard } from '../engine/board.js';

const COMBO_GAP = 3200;     // 這麼短的時間內再配對一組，叮聲往上爬

class Game {
  constructor(root, params, app) {
    this.root = root; this.params = params; this.app = app;
    this.timers = new Set(); this.dead = false;
    this.inputLock = 0; this.locks = new Map();
    this.sel = null; this.hint = null; this.stars = 3;
    this.combo = 0; this.lastMatch = -1e9; this.slideFree = 0;
    this.told = {};
    this.log = [];   // 測試用：每次動作的 steps 種類
  }

  /* ---------- 小工具 ---------- */
  later(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); if (!this.dead) fn(); }, Math.max(0, ms) / this.speed);
    this.timers.add(id);
    return id;
  }
  gnow() { return performance.now() * this.speed; }   // 遊戲時間（加速測試時一起變快）
  sfx(name, opts) { try { this.app.audio.sfx(name, opts); } catch (e) { /* 聲音壞了不影響遊戲 */ } }
  lock(id) { this.locks.set(id, (this.locks.get(id) || 0) + 1); }
  unlock(id) { const n = (this.locks.get(id) || 0) - 1; if (n > 0) this.locks.set(id, n); else this.locks.delete(id); }

  resolveLevel() {
    const q = new URLSearchParams(location.search);
    const test = this.params.test || (this.params.levelId == null && !this.params.levelDef ? q.get('test') : null);
    if (this.params.levelDef) { this.isTest = true; return this.params.levelDef; }
    if (test && TEST_LEVELS[test]) { this.isTest = true; this.params = { ...this.params, test }; return TEST_LEVELS[test]; }
    this.isTest = false;
    return this.app.levelById(Number(this.params.levelId) || 1) || this.app.levels[0];
  }

  async start() {
    const { app } = this;
    const q = new URLSearchParams(location.search);
    this.speed = Math.max(0.1, Number(q.get('gspeed')) || 1);
    const lv = this.lv = this.resolveLevel();
    const region = this.region = REGION_BY_ID[lv.region] || levelRegion(lv.id) || { name: '', flag: '', theme: {} };
    const restart = this.params.restart || 0;
    try {
      this.b = createBoard({ cols: COLS, ...lv }, { seed: (lv.seed ?? 1) + restart * 7919 });
    } catch (e) {
      // 關卡資料有問題時不要整個畫面空白：提示一下，讓玩家回地圖
      console.error('關卡建立失敗', lv && lv.id, e);
      this.root.innerHTML = '<div class="g-screen g-broken"><div class="g-awning"></div><div class="card g-card"><h2 class="g-ovtitle">這一關還在烤</h2><p class="g-ovsub">請先玩其他關卡～</p><div class="g-ov-foot"><button class="btn" type="button">回地圖</button></div></div></div>';
      this.root.querySelector('.btn').addEventListener('click', () => app.go('map'));
      return;
    }
    this.firstTime = this.isTest || app.save.levelStars(lv.id) === 0;
    this.title = `${region.name}・第 ${lv.id} 關`;
    const th = region.theme || {};

    const s = document.createElement('div');
    s.className = 'g-screen';
    if (th.accent) { s.style.setProperty('--g-accent', th.accent); s.style.setProperty('--g-soft', th.soft); s.style.setProperty('--g-deep', th.deep); }
    s.innerHTML = `
      <div class="g-awning"></div>
      <header class="g-hud">
        <button class="g-round g-pausebtn" type="button" aria-label="暫停"><span></span></button>
        <div class="g-title"><b><span class="g-flag"></span><span class="g-tt"></span></b></div>
        <div class="g-stars" aria-label="星星"><i>★</i><i>★</i><i>★</i></div>
      </header>
      <div class="g-ordershost"></div>
      <main class="g-stage"></main>
      <footer class="g-foot">
        <canvas class="g-flower" aria-hidden="true"></canvas><span class="g-left"></span>
        <button class="btn ghost g-menubtn" type="button" hidden>菜單</button>
        <button class="btn gold g-hintbtn" type="button"><span class="g-bulb">✦</span>提示</button>
      </footer>
      <div class="g-fx"></div>`;
    s.querySelector('.g-flag').textContent = region.flag || '';
    s.querySelector('.g-tt').textContent = this.title;
    if (this.title.length > 9) s.querySelector('.g-title').classList.add('g-long');
    this.root.appendChild(s);
    this.el = s;
    this.fx = makeFx(s.querySelector('.g-fx'), this.speed);
    drawGaillardia(s.querySelector('.g-flower'), 22);
    this.ovHost = s;

    if (this.b.orders) this.orders = new OrdersBar(s.querySelector('.g-ordershost'), this.b.orders);
    this.view = new BoardView(s.querySelector('.g-stage'), {
      rows: this.b.rows, cols: this.b.cols, speed: this.speed, fx: this.fx,
      sfx: (n, o) => this.sfx(n, o), later: (fn, ms) => this.later(fn, ms),
      newKind: this.firstTime ? (this.b.newKind || lv.newDessert || null) : null, slide: lv.slide,
    });
    this.view.build(this.b);
    this.syncPos();
    this.initMirror();
    this.updateLeft(); this.updateStars();

    // 操作
    this.view.boardEl.addEventListener('click', e => {
      const t = e.target.closest('.g-tile'); if (t) this.onTap(Number(t.dataset.id));
    });
    s.querySelector('.g-hintbtn').addEventListener('click', () => this.useHint());
    s.querySelector('.g-pausebtn').addEventListener('click', () => this.pause());
    const menuBtn = s.querySelector('.g-menubtn');
    if (this.b.pairing) {
      menuBtn.hidden = false;
      menuBtn.addEventListener('click', () => { if (this.inputLock) return; this.sfx('tap'); this.inputLock++; showMenu(this.ovHost, lv.kinds, () => this.inputLock--, n => this.sfx(n)); });
    }
    this.onResize = () => {
      clearTimeout(this.rt);
      this.rt = setTimeout(() => {
        const w = window.innerWidth, h = window.innerHeight;
        if (w !== this.lastW || Math.abs(h - this.lastH) > 80) { this.lastW = w; this.lastH = h; this.view.layout(); }
      }, 200);
    };
    this.lastW = window.innerWidth; this.lastH = window.innerHeight;
    window.addEventListener('resize', this.onResize);

    try { app.audio.playMusic('level'); } catch (e) { /* 沒音樂也能玩 */ }
    window.__game = this;

    // 關卡前卡片（重玩時跳過）
    if (restart) return;
    const tips = [];
    if (lv.tip && (this.isTest || !app.save.seen('tip:' + lv.tip))) tips.push(lv.tip);
    const showNew = lv.newDessert && (this.isTest || !app.save.isUnlocked(lv.newDessert)) ? lv.newDessert : null;
    this.inputLock++;
    this.intro = showIntro(this.ovHost, {
      lv, region, title: `第 ${lv.id} 關`, newDessert: showNew, tips,
      menuKinds: this.b.pairing ? lv.kinds : null, sfx: n => this.sfx(n),
      onStart: () => {
        tips.forEach(k => { if (!this.isTest) app.save.markSeen('tip:' + k); });
        this.intro = null;
        this.later(() => { this.inputLock--; }, 120);
      },
    });
  }

  /* ---------- 引擎狀態對照 ---------- */
  syncPos() { this.pos = new Map(this.b.tiles().map(t => [t.id, t])); }
  initMirror() {
    this.grid = Array.from({ length: this.b.rows }, () => Array(this.b.cols).fill(null));
    for (const t of this.b.tiles()) this.grid[t.r][t.c] = t.id;
  }
  /** 開發檢查：畫面這邊推算的位置要和引擎一致 */
  checkMirror() {
    const bad = [];
    for (const t of this.b.tiles()) if (this.grid[t.r][t.c] !== t.id) bad.push(t.id);
    let n = 0; for (const row of this.grid) for (const x of row) if (x != null) n++;
    if (bad.length || n !== this.b.tiles().length) console.warn('盤面對照不一致', bad, n, this.b.tiles().length);
    return !bad.length;
  }

  updateLeft() {
    const el = this.el.querySelector('.g-left');
    if (this.b.orders) el.textContent = `點單完成 ${this.b.orders.filter(o => o.done).length}／${this.b.orders.length}`;
    else el.textContent = `剩下 ${this.b.remaining} 個`;
  }
  updateStars() {
    this.el.querySelectorAll('.g-stars i').forEach((s, i) => s.classList.toggle('off', i >= this.stars));
  }

  /* ---------- 點擊 ---------- */
  select(id) { this.sel = id; this.view.setSelected(id, true); }
  deselect() { if (this.sel != null) this.view.setSelected(this.sel, false); this.sel = null; }

  onTap(id) {
    if (this.inputLock > 0 || this.locks.has(id) || this.dead) return;
    const p = this.pos.get(id);
    if (!p) return;
    if (!this.b.canSelect(p.r, p.c)) {
      this.view.wobble(id); this.sfx('fail');
      const cell = this.b.cell(p.r, p.c);
      if (cell.gift && !this.told.gift) { this.told.gift = 1; this.app.toast('禮盒上鎖了，把兩塊鑰匙餅乾連起來就能打開'); }
      else if (cell.jam && !this.told.jam) { this.told.jam = 1; this.app.toast('果醬黏住了～在旁邊吃掉一組就會融化'); }
      return;
    }
    if (this.sel === id) { this.deselect(); this.sfx('select'); return; }
    if (this.sel == null) { this.select(id); this.sfx('select'); return; }
    const a = this.sel, pa = this.pos.get(a);
    const res = pa ? this.b.tryMatch([pa.r, pa.c], [p.r, p.c]) : { ok: false, reason: 'notPair' };
    if (!res.ok) {
      // 連不到：輕彈聲，兩個搖頭，後點的變成新的選取
      this.sfx('fail');
      this.view.shake(a); this.view.shake(id);
      this.deselect(); this.select(id);
      return;
    }
    this.sel = null;
    this.play(res.steps);
  }

  /** 依 steps 依序播動畫（引擎狀態已經是最後結果；畫面跟著時間軸慢慢追上） */
  play(steps) {
    this.log.push(steps.map(s => s.type));
    const g0 = this.gnow();
    let cursor = 0, jamEnd = 0, giftEnd = 0, late = false;   // late：滑動／重排之後才發生的事（引擎保底），接在後面播
    const eatenIds = [];
    for (const st of steps) {
      switch (st.type) {
        case 'match': {
          const { a, b } = st;
          eatenIds.push(a.id, b.id);
          this.view.setSelected(a.id, true); this.view.setSelected(b.id, true);
          this.lock(a.id); this.lock(b.id);
          this.grid[a.r][a.c] = null; this.grid[b.r][b.c] = null;
          const now = this.gnow();
          this.combo = now - this.lastMatch < COMBO_GAP ? Math.min(this.combo + 1, 10) : 0;
          this.lastMatch = now;
          const combo = this.combo;
          this.sfx('pipe');
          this.view.pipePath(st.path);
          this.later(() => this.sfx('ding', { combo }), T.pipe);
          this.orderFrom = { a: this.view.centerOf(a.id), b: this.view.centerOf(b.id) };
          this.view.eat(a.id, T.eatA, true, () => this.unlock(a.id));
          this.view.eat(b.id, T.eatB, false, () => this.unlock(b.id));
          cursor = T.gone;
          break;
        }
        case 'jam': {
          const ids = st.cells.map(([r, c]) => this.grid[r][c]).filter(x => x != null);
          ids.forEach(id => this.lock(id));
          const t = late ? cursor + 100 : T.swallow - 60;
          this.later(() => { this.sfx('jam'); ids.forEach(id => this.view.meltJam(id, () => this.unlock(id))); }, t);
          jamEnd = t + 470;
          break;
        }
        case 'giftOpen': {
          st.tiles.forEach(x => this.lock(x.id));
          const t = late ? cursor + 100 : T.swallow;
          this.later(() => { this.sfx('giftOpen'); st.tiles.forEach(x => this.view.openGift(x.id, x.kind, () => this.unlock(x.id))); }, t);
          giftEnd = t + 700;
          if (late) cursor = giftEnd;
          break;
        }
        case 'order': {
          const from = this.orderFrom && (this.orderFrom.a || this.orderFrom.b);
          this.later(() => {
            const to = this.orders?.itemCenter(st.index, st.kind);
            const done = () => {
              this.orders?.update(st);
              this.updateLeft();
              if (st.done) this.sfx('order');
            };
            if (from && to) {
              const heart = document.createElement('div'); heart.className = 'g-heart'; heart.textContent = '♥';
              this.fx.fly(heart, from, to, 420).finished.then(done, done);
            } else done();
          }, T.swallow - 60);
          break;
        }
        case 'slide': {
          for (const m of st.moves) this.lock(m.id);
          // 畫面對照：先全部拿起來再放下
          const ids = st.moves.map(m => this.grid[m.from[0]][m.from[1]]);
          st.moves.forEach(m => { this.grid[m.from[0]][m.from[1]] = null; });
          st.moves.forEach((m, i) => { this.grid[m.to[0]][m.to[1]] = ids[i] ?? m.id; });
          let t = Math.max(T.gone - 200, jamEnd - 150, giftEnd, late ? cursor + 100 : 0);
          // 一次一次照順序滑，不能讓後面那次先播
          const gStart = Math.max(g0 + t, this.slideFree + 10);
          t = gStart - g0;
          this.slideFree = gStart + T.slide;
          this.later(() => {
            this.sfx('slide');
            this.view.slide(st.moves, () => st.moves.forEach(m => this.unlock(m.id)));
          }, gStart - this.gnow());
          cursor = Math.max(cursor, t + T.slide);
          late = true;
          break;
        }
        case 'shuffle': {
          // 種類全部換過：馬上取消選取和提示，重排動畫播完前不能點
          this.deselect(); this.clearHint();
          this.inputLock++;
          const t = Math.max(cursor, T.gone) + 200;
          this.later(() => {
            this.app.toast('沒有可以連的了，幫你重新擺一下～');
            this.sfx('shuffle');
            this.view.shuffle(st.tiles, () => { this.inputLock--; });
          }, t);
          cursor = t + T.shuffle;
          late = true;
          break;
        }
        case 'jamClear': {
          const ids = st.cells.map(([r, c]) => this.grid[r][c]).filter(x => x != null);
          ids.forEach(id => this.lock(id));
          const t = cursor + 100;
          this.later(() => { this.sfx('jam'); ids.forEach(id => this.view.meltJam(id, () => this.unlock(id))); }, t);
          cursor = t + 470;
          late = true;
          break;
        }
        case 'win': {
          this.inputLock++;
          this.won = true;
          const t = Math.max(cursor, T.gone, giftEnd, jamEnd) + 350;
          this.later(() => this.win(), t);
          break;
        }
        default: break;
      }
    }
    this.syncPos();
    this.checkMirror();
    this.updateLeft();
    // 提示：被吃掉了就熄掉；還在的話確認還連得到
    if (this.hint) {
      if (this.hint.some(id => eatenIds.includes(id)) || !this.hintStillValid()) this.clearHint();
    }
  }

  /* ---------- 提示 ---------- */
  hintStillValid() {
    const [x, y] = this.hint.map(id => this.pos.get(id));
    if (!x || !y) return false;
    try { return this.b.clone().tryMatch([x.r, x.c], [y.r, y.c]).ok; } catch (e) { return true; }
  }
  clearHint() { this.hint = null; this.view.setHinted(null); }
  useHint() {
    if (this.inputLock > 0 || this.dead) return;
    this.sfx('hint');
    const h = this.b.findHint();
    if (!h) { this.app.toast('找找看～'); return; }
    const ids = [this.b.cell(h.a[0], h.a[1]).tile?.id, this.b.cell(h.b[0], h.b[1]).tile?.id].filter(x => x != null);
    this.hint = ids;
    this.view.setHinted(ids);
    if (this.stars > 2) { this.stars = 2; this.updateStars(); this.app.toast('用了提示，這關最多兩顆星'); }
  }

  /* ---------- 暫停 ---------- */
  pause() {
    if (this.dead || this.pauseOv || this.won || this.intro) return;
    this.sfx('tap');
    this.inputLock++;
    const { app } = this;
    this.pauseOv = showPause(this.ovHost, {
      settings: app.save.settings(), sfx: n => this.sfx(n),
      onResume: () => { this.pauseOv = null; this.inputLock--; },
      onRestart: () => this.restart(),
      onMap: () => app.go('map'),
      onSetting: (key, on) => {
        app.save.setSetting(key, on);
        try { key === 'sfx' ? app.audio.setSfx(on) : app.audio.setMusic(on); } catch (e) { /* 忽略 */ }
        if (key === 'music' && on) try { app.audio.playMusic('level'); } catch (e) { /* 忽略 */ }
      },
    });
  }
  restart() { this.app.go('level', { ...this.params, restart: (this.params.restart || 0) + 1 }); }

  /* ---------- 過關 ---------- */
  win() {
    const { app, lv } = this;
    this.deselect(); this.clearHint();
    const stars = this.stars;
    let res;
    if (this.isTest) res = { firstClear: true, bestStars: stars, newlyUnlocked: [...(lv.unlocks || [])] };
    else res = app.save.recordLevel(lv.id, stars);
    this.result = res;
    this.sfx('win');
    try { app.audio.playMusic('clear'); } catch (e) { /* 忽略 */ }
    const r = this.view.tray.getBoundingClientRect();
    for (let k = 0; k < 4; k++) this.later(() => this.fx.burst(r.left + r.width * (0.2 + 0.2 * k), r.top + r.height * 0.4, r.width * 0.25, 12), k * 120);
    const title = this.b.orders ? '點單都送完了！' : '全部吃光了！';
    const sub = stars >= 3 ? '今天的甜點都賣完囉' : '用了提示也很棒！下次挑戰三顆星';
    const ov = this.winOv = showWin(this.ovHost, { title, sub });
    for (let i = 0; i < stars; i++) {
      this.later(() => {
        const s = lightStar(ov, i);
        this.sfx('star', { n: i + 1 });
        if (s) { const q = s.getBoundingClientRect(); this.fx.burst(q.left + q.width / 2, q.top + q.height / 2, 36, 7); }
      }, 500 + i * 380);
    }
    const after = 500 + stars * 380 + 350;
    const next = this.isTest ? null : app.levelById(lv.id + 1);
    const goNext = () => { this.sfx('tap'); app.go('level', { levelId: next.id }); };
    const goMap = () => { this.sfx('tap'); app.go('map'); };
    this.later(() => {
      const ids = res.newlyUnlocked || [];
      if (ids.length) {
        const u = this.unlockUI = unlockSection(ov, ids, {
          opening: lv.id === 1 && ids.length > 1,
          onPage: () => this.sfx('page'),
          onReveal: card => {
            this.sfx('unlock');
            this.later(() => {
              const q = card.querySelector('.g-ustage').getBoundingClientRect();
              this.fx.sugar(q, 30);
              this.fx.burst(q.left + q.width / 2, q.top + q.height * 0.5, q.width * 0.4, 12);
            }, 260);
          },
        });
        this.later(() => u.reveal(0), 300);
        const list = [];
        if (next) list.push(['下一關', 'g-primary', goNext]);
        list.push(['看圖鑑', 'ghost', () => { this.sfx('tap'); app.go('book', { focus: u.current() }); }]);
        list.push(['回地圖', 'ghost', goMap]);
        winButtons(ov, list);
      } else {
        const list = [];
        if (next) list.push(['下一關', 'g-primary', goNext]);
        list.push(['再玩一次', 'ghost', () => { this.sfx('tap'); this.restart(); }]);
        list.push(['回地圖', 'ghost', goMap]);
        winButtons(ov, list);
      }
    }, after);
  }

  destroy() {
    this.dead = true;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    clearTimeout(this.rt);
    window.removeEventListener('resize', this.onResize);
    this.view?.destroy();
    if (window.__game === this) window.__game = null;
  }
}

let game = null;
export default {
  async mount(root, params, app) {
    game?.destroy();
    game = new Game(root, params || {}, app);
    await game.start();
  },
  unmount() { game?.destroy(); game = null; },
};
