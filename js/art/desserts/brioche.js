/* 布里歐（brioche à tête）・精緻擬真插畫風
 * 用菊花模烤的圓胖奶油麵包：下半部是窄底、往上張開的一圈圓弧摺紋，
 * 上面鼓成一瓣一瓣的飽滿圓頂，正中間頂著一顆小圓球（tête，頭），刷蛋液烤得油亮的深金褐色。
 * 做法：側面用細長條依法線上色；圓頂用小四邊形網格（3D 法線＋左上光＋鏡面高光）上色。
 * 和可麗露的差別：亮金褐不是焦黑、上寬下窄、頂上一顆圓球；
 * 和修女泡芙的差別：沒有巧克力和白色領子，下半部是喇叭形摺紋。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const RIM = { cy: 116, r: 74 };    // 摺紋最上緣（最寬）
  const BASE = { cy: 157, r: 50 };   // 底
  const KY = 0.34, KZ = Math.sqrt(1 - KY * KY);   // 透視：水平圓壓扁、高度縮短
  const NF = 12;
  const PH = Math.PI / NF;
  const DOMEH = 34;                  // 圓頂高度（3D）
  const HEAD = { cx: 100, cy: 62, rx: 27.5, ry: 25.5 };

  function lobe(th) { return Math.pow(Math.abs(Math.cos(NF * (th + PH) / 2)), 0.55); }
  const AMP = 0.085;
  // 側面（t：0 上緣～1 底）
  function baseR(t) { return BASE.r + (RIM.r - BASE.r) * Math.pow(1 - t, 1.15); }
  function sideR(t, th) { return baseR(t) * (1 + AMP * (lobe(th) - 0.65) * (0.35 + 0.65 * (1 - t))); }
  function cyAt(t) { return RIM.cy + (BASE.cy - RIM.cy) * t; }
  function SP(t, th) { const r = sideR(t, th); return [CX + r * Math.cos(th), cyAt(t) + r * KY * Math.sin(th)]; }
  // 圓頂（u：0 邊緣～1 中心）：每一瓣在邊緣鼓得最明顯，往中心漸平
  function dome3(u, th) {
    const a = u * Math.PI / 2;
    const r = RIM.r * (1 + AMP * (lobe(th) - 0.65) * Math.pow(1 - u, 0.6)) * Math.cos(a) * (1 + 0.04 * Math.sin(a * 2));
    const h = DOMEH * Math.pow(Math.sin(a), 0.85) + 4 * (lobe(th) - 0.65) * Math.sin(a * 2);
    return [r * Math.cos(th), r * Math.sin(th), h];
  }
  function proj(p) { return [CX + p[0], RIM.cy + p[1] * KY - p[2] * KZ]; }

  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ramp(stops, x) {
    x = Math.max(0, Math.min(1, x));
    for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i], u = (x - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map(k => Math.round(a[1][k] + (b[1][k] - a[1][k]) * u));
    }
    return stops[stops.length - 1][1];
  }
  const GLOSS = [[0, rgb('#4E1F07')], [0.3, rgb('#7E3410')], [0.55, rgb('#AE5418')], [0.75, rgb('#D6802E')], [0.9, rgb('#EFA850')], [1, rgb('#FFD58E')]];
  const SIDE = [[0, rgb('#4A1E07')], [0.35, rgb('#77320E')], [0.62, rgb('#A2521A')], [0.85, rgb('#C9782E')], [1, rgb('#E6A456')]];
  function nrm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  const LIGHT = nrm([-0.55, 0.3, 0.78]);
  const VIEW = [0, KZ, KY];
  const HALF = nrm([LIGHT[0] + VIEW[0], LIGHT[1] + VIEW[1], LIGHT[2] + VIEW[2]]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function path(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  /* ---------- 預先算好：側面細長條 ---------- */
  const STRIPS = [];
  (function () {
    const NS = 120, TS = 8;
    for (let i = 0; i < NS; i++) {
      const a0 = Math.PI * i / NS, a1 = Math.PI * (i + 1.3) / NS, am = (a0 + a1) / 2;
      const pts = [];
      for (let j = 0; j <= TS; j++) pts.push(SP(j / TS, a0));
      for (let j = TS; j >= 0; j--) pts.push(SP(j / TS, a1));
      const d = 0.002, t = 0.3;
      const dr = (sideR(t, am + d) - sideR(t, am - d)) / (2 * d);
      const n = am - Math.atan2(dr, sideR(t, am));
      const dif = 0.5 + 0.5 * Math.cos(n - 0.74 * Math.PI);
      const spec = Math.pow(Math.max(0, Math.cos(n - 0.62 * Math.PI)), 22);
      STRIPS.push({ pts, c: ramp(SIDE, dif * 0.85 + spec * 0.3), top: SP(0, am), bot: SP(1, am) });
    }
  })();

  /* ---------- 預先算好：圓頂的每一瓣（平滑漸層） ---------- */
  const LOBES = [];
  (function () {
    for (let k = 0; k < NF; k++) {
      const thc = (2 * Math.PI * k) / NF - PH;          // 瓣中心
      const t0 = thc - Math.PI / NF, t1 = thc + Math.PI / NF;
      // 切成幾圈細帶，避免後方的瓣投影時折疊、填色出現破洞
      const bands = [];
      const NB = 7;
      for (let b = 0; b < NB; b++) {
        const ua = 0.95 * b / NB, ub = 0.95 * (b + 1) / NB;
        const pts = [];
        for (let i = 0; i <= 12; i++) pts.push(proj(dome3(ua, t0 + (t1 - t0) * i / 12)));
        for (let i = 12; i >= 0; i--) pts.push(proj(dome3(ub, t0 + (t1 - t0) * i / 12)));
        bands.push(pts);
      }
      // 這一瓣鼓起處的法線（朝外上方）決定亮度
      const n = nrm([Math.cos(thc) * 0.85, Math.sin(thc) * 0.85, 0.75]);
      const lit = Math.max(0, dot(n, LIGHT));
      const spec = Math.pow(Math.max(0, dot(n, HALF)), 6);
      const peak = proj(dome3(0.22, thc));
      const hi = [peak[0] - 7 * Math.max(0.2, 1 - Math.abs(Math.cos(thc))) - 3, peak[1] - 6];
      LOBES.push({
        bands, peak, hi, ord: Math.sin(thc), lit, thc,
        c0: css(ramp(GLOSS, 0.42 + lit * 0.42 + spec * 0.22)),
        c1: css(ramp(GLOSS, 0.3 + lit * 0.34)),
        c2: css(ramp(GLOSS, 0.12 + lit * 0.22)),
      });
    }
    LOBES.sort((p, q) => p.ord - q.ord);
  })();

  /* ---------- 外輪廓：所有表面點的上下包絡 ---------- */
  const SIL = [];
  (function () {
    const lo = {}, hi = {};
    const add = (p) => {
      const k = Math.round(p[0] * 2);
      if (!(k in lo) || p[1] < lo[k]) lo[k] = p[1];
      if (!(k in hi) || p[1] > hi[k]) hi[k] = p[1];
    };
    for (let j = 0; j <= 30; j++) for (let i = 0; i < 360; i++) add(proj(dome3(j / 30, TAU * i / 360)));
    const ks = Object.keys(lo).map(Number).sort((a, b) => a - b);
    for (const k of ks) SIL.push([k / 2, lo[k]]);
    // 右側、底部前緣、左側（解析式，邊緣才平順）
    const sideX = (t, sg) => {
      let m = 0;
      for (let a = -0.3; a <= 0.3; a += 0.01) m = Math.max(m, sg * (SP(t, sg > 0 ? a : Math.PI + a)[0] - CX));
      return CX + sg * m;
    };
    for (let i = 0; i <= 20; i++) SIL.push([sideX(i / 20, 1), cyAt(i / 20)]);
    for (let i = 0; i <= 120; i++) SIL.push(SP(1, Math.PI * i / 120));
    for (let i = 20; i >= 0; i--) SIL.push([sideX(i / 20, -1), cyAt(i / 20)]);
    void hi;
  })();

  /* ---------- 側面摺紋 ---------- */
  function drawSide(ctx) {
    ctx.save();
    path(ctx, SIL);
    ctx.clip();
    ctx.fillStyle = '#9A4C18';
    ctx.fillRect(0, RIM.cy - 30, 200, 90);
    for (const S of STRIPS) {
      path(ctx, S.pts);
      const c = S.c;
      const g = ctx.createLinearGradient(S.top[0], S.top[1], S.bot[0], S.bot[1]);
      g.addColorStop(0, `rgb(${c[0] * 0.55 | 0},${c[1] * 0.5 | 0},${c[2] * 0.45 | 0})`);
      g.addColorStop(0.28, css(c));
      g.addColorStop(0.8, css(c));
      g.addColorStop(1, `rgb(${c[0] * 0.85 | 0},${c[1] * 0.82 | 0},${c[2] * 0.8 | 0})`);
      ctx.fillStyle = g;
      ctx.fill();
    }
    for (let k = 0; k < NF; k++) {
      const th = (2 * Math.PI * k + Math.PI) / NF - PH;
      const tn = ((th % TAU) + TAU) % TAU;
      if (tn <= 0.08 || tn >= Math.PI - 0.08) continue;
      ctx.strokeStyle = 'rgba(70,26,6,0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let j = 0; j <= 8; j++) { const p = SP(0.02 + 0.88 * j / 8, tn); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 圓頂 ---------- */
  function drawDome(ctx) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.8;
    for (const L of LOBES) {
      const g = ctx.createRadialGradient(L.hi[0], L.hi[1], 1, L.peak[0], L.peak[1] + 4, 38);
      g.addColorStop(0, L.c0);
      g.addColorStop(0.45, L.c1);
      g.addColorStop(1, L.c2);
      ctx.fillStyle = g;
      ctx.strokeStyle = g;
      for (const pts of L.bands) { path(ctx, pts); ctx.fill(); ctx.stroke(); }
    }
    // 蛋液的油亮反光（朝光的幾瓣）
    for (const L of LOBES) {
      if (L.lit < 0.55 || L.ord < -0.2) continue;
      const a = (L.lit - 0.55) / 0.45;
      ctx.save();
      ctx.translate(L.hi[0] + 2, L.hi[1] + 2);
      ctx.rotate(Math.cos(L.thc) * 0.5);
      ctx.scale(0.55, 1);
      const g = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 9);
      g.addColorStop(0, `rgba(255,248,230,${0.35 + a * 0.5})`);
      g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // 整體圓頂明暗：左上亮、右下暗
    ctx.save();
    path(ctx, SIL);
    ctx.clip();
    const sh = ctx.createLinearGradient(40, 60, 160, 140);
    sh.addColorStop(0, 'rgba(255,220,160,0.18)');
    sh.addColorStop(0.5, 'rgba(255,220,160,0)');
    sh.addColorStop(1, 'rgba(50,16,2,0.25)');
    ctx.fillStyle = sh;
    ctx.fillRect(0, 40, 200, RIM.cy - 40 + 6);
    ctx.restore();
    // 瓣與瓣之間的凹縫（邊緣最深，往中心淡掉）
    ctx.lineCap = 'round';
    for (let k = 0; k < NF; k++) {
      const th = (2 * Math.PI * k + Math.PI) / NF - PH;
      const pts = [];
      for (let j = 0; j <= 10; j++) pts.push(proj(dome3(0.05 + 0.5 * j / 10, th)));
      const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[10][0], pts[10][1]);
      g.addColorStop(0, 'rgba(60,20,4,0.55)');
      g.addColorStop(1, 'rgba(60,20,4,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    }
    // 圓頂和摺紋交界：麵團膨出、底下一道陰影
    ctx.strokeStyle = 'rgba(60,22,4,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) { const p = proj(dome3(0, Math.PI * i / 90)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    // 細小斑駁（蛋液）
    const r = K.rng(4242);
    for (let i = 0; i < 50; i++) {
      const p = proj(dome3(r() * 0.8, r() * TAU));
      ctx.fillStyle = r() < 0.5 ? 'rgba(70,26,6,0.18)' : 'rgba(255,220,160,0.2)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.7 + r() * 1.5, 0.5 + r() * 0.8, 0, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 頭（小圓球） ---------- */
  function headPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const a = TAU * i / 80, s = Math.sin(a);
      const kx = s > 0 ? 1 - 0.12 * s * s : 1;
      const x = HEAD.cx + HEAD.rx * Math.cos(a) * kx, y = HEAD.cy + HEAD.ry * s;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawHead(ctx) {
    const by = HEAD.cy + HEAD.ry - 3;
    // 頭和身體接縫：影子＋一圈沒刷到蛋液的淺色裂口
    ctx.fillStyle = 'rgba(50,18,2,0.4)';
    ctx.beginPath(); ctx.ellipse(HEAD.cx + 5, by + 3, HEAD.rx * 0.98, 9.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(246,206,140,0.85)';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(HEAD.cx - 1, by - 1, HEAD.rx * 0.86, 6, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

    headPath(ctx);
    const g = ctx.createRadialGradient(HEAD.cx - 11, HEAD.cy - 11, 2, HEAD.cx, HEAD.cy, HEAD.rx * 1.12);
    g.addColorStop(0, '#F2B460');
    g.addColorStop(0.3, '#D27E2E');
    g.addColorStop(0.7, '#9A4616');
    g.addColorStop(1, '#5E2408');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    headPath(ctx);
    ctx.clip();
    const r = K.rng(321);
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.9;
      ctx.fillStyle = r() < 0.5 ? 'rgba(80,30,6,0.18)' : 'rgba(255,214,150,0.2)';
      ctx.beginPath(); ctx.ellipse(HEAD.cx + Math.cos(a) * d * HEAD.rx, HEAD.cy + Math.sin(a) * d * HEAD.ry, 0.8 + r() * 1.4, 0.6 + r(), 0, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.translate(HEAD.cx - 11, HEAD.cy - 12);
    ctx.rotate(-0.6);
    ctx.scale(1, 0.55);
    const s = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 10);
    s.addColorStop(0, 'rgba(255,252,240,0.95)');
    s.addColorStop(0.4, 'rgba(255,240,210,0.5)');
    s.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,160,80,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(HEAD.cx, HEAD.cy, HEAD.rx - 3, HEAD.ry - 3, 0, 0.2 * Math.PI, 0.6 * Math.PI); ctx.stroke();
    ctx.restore();
    headPath(ctx);
    ctx.strokeStyle = 'rgba(70,26,6,0.6)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawDome(ctx);
    path(ctx, SIL);
    ctx.strokeStyle = 'rgba(70,26,6,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    drawHead(ctx);
  }

  window.DESSERTS['brioche'] = {
    draw,
    crumbs: ['#AE5418', '#F8E3B8', '#7E3410', '#F8D9A0', '#D6802E'],
    crunchy: 0.2,
  };
})();
