/* 可頌（croissant）・精緻擬真插畫風
 * 月牙形法式奶油可頌：一條彎曲的中軸，外形是平順的月牙包絡線，
 * 再用弧形「凹摺線」切成 7 節捲紋；從兩端往中間疊，中間最胖那節在最上層。
 */
(function () {
  'use strict';
  const K = window.DessertKit;

  /* ---------- 中軸（彎曲的脊線） ---------- */
  const CX = 100, CY = 112;           // 中軸最高點
  const A1 = 0.0105;                  // 切線角 θ(u) = A1·u（圓弧形的月牙）
  const UE = 92;                      // 尖端位置
  const H0 = 42;                      // 中間最胖處的「基準半高」
  function theta(u) { return A1 * u; }
  // 中軸往外凸側（上）與內凹側（下）的厚度比。中間那節在後方、下緣往上收，
  // 內緣才會是一道凹弧（月牙），不會像鐘或安全帽。
  function sstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function UPf(u) { return 1.45 - 0.1 * sstep(0, 50, Math.abs(u)); }
  function DNf(u) { return 0.1 + 0.25 * sstep(0, 50, Math.abs(u)); }
  const STEP = 0.25, UMAX = 110, NS = Math.round(UMAX / STEP);
  const TX = new Float64Array(NS + 1), TY = new Float64Array(NS + 1);
  for (let i = 1; i <= NS; i++) {
    const th = theta((i - 0.5) * STEP);
    TX[i] = TX[i - 1] + Math.cos(th) * STEP;
    TY[i] = TY[i - 1] + Math.sin(th) * STEP;
  }
  function P(u) {
    const s = u < 0 ? -1 : 1, f = Math.min(Math.abs(u) / STEP, NS - 1e-6);
    const i = Math.floor(f), t = f - i;
    return [CX + s * (TX[i] + (TX[i + 1] - TX[i]) * t), CY + TY[i] + (TY[i + 1] - TY[i]) * t];
  }
  // 月牙包絡線：中間胖、往兩端收尖
  function env(u) {
    const r = Math.min(Math.abs(u) / UE, 1);
    return H0 * Math.pow(1 - Math.pow(r, 1.6), 1.3);
  }

  /* ---------- 七節捲紋 ---------- */
  // a0~a1：該節在中軸上的範圍（往尖端方向為正）、c：凹摺弧往外凸多少、pf：鼓起程度
  const RIGHT = [
    { a0: 51, a1: UE, c: 0, pf: 0.16, tip: true },
    { a0: 32, a1: 56, c: 7, pf: 0.2 },
    { a0: 13, a1: 38, c: 7.5, pf: 0.16 },
  ];
  const SEGS = [];
  for (const r of RIGHT) {
    SEGS.push(Object.assign({ dir: -1 }, r));
    SEGS.push(Object.assign({ dir: 1 }, r));
  }
  SEGS.push({ a0: -18, a1: 18, c: 8.5, pf: 0.07, dir: 1, center: true });

  // 該節「看得到的部分」中心（給鼓起與漸層用）
  for (const sg of SEGS) {
    if (sg.center) { sg.vm = 0; sg.vw = sg.a1 + sg.c; }
    else {
      const visIn = sg.a0 + 6, visOut = sg.tip ? UE : sg.a1 + sg.c * 0.6;
      sg.vm = (visIn + visOut) / 2; sg.vw = (visOut - visIn) / 2;
    }
  }

  // 節內某點：U 為沿中軸位置（以「往尖端為正」表示）、v 為 -1（內凹側下緣）~1（外凸側上緣），0 是身體中線
  function hL(sg, U) {
    const d = (U - sg.vm) / (sg.vw * 1.1);
    return env(U) * (1 + sg.pf * Math.exp(-d * d * 1.6));
  }
  function pt(sg, U, v) {
    const u = sg.center ? U : U * sg.dir;
    const hh = hL(sg, Math.abs(u));
    const p = P(u), th = theta(u), h = ((1 + v) / 2) * UPf(u) * hh - ((1 - v) / 2) * DNf(u) * hh;
    return [p[0] + Math.sin(th) * h, p[1] - Math.cos(th) * h, env(Math.abs(u))];
  }

  // 節的輪廓點
  function lobePts(sg) {
    const pts = [], M = 28;
    const capOut = (v) => sg.a1 + sg.c * Math.sqrt(Math.max(0, 1 - v * v));
    const capIn = (v) => sg.a0 - 8 * Math.sqrt(Math.max(0, 1 - v * v));
    if (sg.center) {
      // 上緣（左→右）、右凹摺弧、下緣（右→左）、左凹摺弧
      for (let i = 0; i <= M; i++) { const U = -sg.a1 + (2 * sg.a1 * i) / M; pts.push(pt(sg, U, 1)); }
      for (let i = 1; i < M; i++) { const v = 1 - (2 * i) / M; pts.push(pt(sg, capOut(v), v)); }
      for (let i = 0; i <= M; i++) { const U = sg.a1 - (2 * sg.a1 * i) / M; pts.push(pt(sg, U, -1)); }
      for (let i = 1; i < M; i++) { const v = -1 + (2 * i) / M; pts.push(pt(sg, -capOut(v), v)); }
      return pts;
    }
    for (let i = 0; i <= M; i++) { const U = sg.a0 + ((sg.a1 - sg.a0) * i) / M; pts.push(pt(sg, U, 1)); }
    if (!sg.tip) for (let i = 1; i < M; i++) { const v = 1 - (2 * i) / M; pts.push(pt(sg, capOut(v), v)); }
    for (let i = 0; i <= M; i++) { const U = sg.a1 - ((sg.a1 - sg.a0) * i) / M; pts.push(pt(sg, U, -1)); }
    for (let i = 1; i < M; i++) { const v = -1 + (2 * i) / M; pts.push(pt(sg, capIn(v), v)); }
    return pts;
  }
  // 凹摺弧（往外偏移 off），回傳一串點（開放曲線）
  function capPts(sg, off, sideSign, vmax) {
    vmax = vmax || 1;
    const pts = [], M = 24;
    for (let i = 0; i <= M; i++) {
      const v = vmax - (2 * vmax * i) / M;
      const U = sg.a1 + sg.c * Math.sqrt(Math.max(0, 1 - v * v)) + off;
      pts.push(pt(sg, sideSign * U, v));
    }
    return pts;
  }
  function poly(ctx, pts, dx, dy, open) {
    dx = dx || 0; dy = dy || 0;
    ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
    if (!open) ctx.closePath();
  }
  // 側面：每一點往下移，移多少跟當地粗細成比例（尖端幾乎不移，才會尖）
  const SIDE_K = 0.14;
  function polySide(ctx, pts) {
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i], dy = SIDE_K * q[2] + 0.6, dx = 0.03 * q[2];
      i ? ctx.lineTo(q[0] + dx, q[1] + dy) : ctx.moveTo(q[0] + dx, q[1] + dy);
    }
    ctx.closePath();
  }
  // 讓線條微微抖動（酥皮不會是完美的弧）
  function jitter(pts, R, amp) {
    return pts.map((q) => [q[0] + (R() - 0.5) * amp * 2, q[1] + (R() - 0.5) * amp * 2, q[2]]);
  }
  // 進入某節的區域座標：x 沿中軸（往右）、y 往下
  function local(ctx, sg, sx, sy) {
    const u = sg.center ? 0 : sg.vm * sg.dir;
    const p = P(u), th = theta(u), mid = ((UPf(u) - DNf(u)) / 2) * env(Math.abs(u));
    ctx.translate(p[0] + Math.sin(th) * mid, p[1] - Math.cos(th) * mid);
    ctx.rotate(th);
    ctx.scale(sx, sy * (UPf(u) + DNf(u)) / 2);
  }
  const sideOf = (sg) => SIDE_K * env(Math.abs(sg.vm)) + 0.6;
  // 該節的凹摺弧（中間那節兩邊都有）
  const capSides = (sg) => (sg.center ? [1, -1] : sg.tip ? [] : [1]);

  function drawLobe(ctx, sg, S) {
    const pts = lobePts(sg);
    const side = sideOf(sg);
    const H = env(Math.abs(sg.vm));

    /* 1. 凹摺處的酥皮層次＋接觸陰影（畫在外側那節上） */
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const R = K.rng(1000 + Math.round(sg.a0 * 7 + sg.dir * 3));
    for (const s of capSides(sg)) {
      // 凹摺處較淺的奶油色（沒烤到的麵皮）
      ctx.lineCap = 'round';
      const bw = Math.min(7, 0.2 * env(sg.a1));   // 凹摺寬度跟著粗細走，細的尖端不會整個變白
      ctx.strokeStyle = 'rgba(248,220,150,0.45)'; ctx.lineWidth = bw;
      ctx.beginPath(); poly(ctx, capPts(sg, bw * 0.46, s, 0.88), 0, 0, true); ctx.stroke();
      ctx.strokeStyle = 'rgba(252,230,172,0.5)'; ctx.lineWidth = bw * 0.5;
      ctx.beginPath(); poly(ctx, capPts(sg, bw * 0.32, s, 0.86), 0, 0, true); ctx.stroke();
      // 一層一層的酥皮（斷斷續續、微微抖動）
      const nl = bw > 5 ? 4 : 3;
      for (let j = 1; j <= nl; j++) {
        const light = j % 2 === 1;
        ctx.lineWidth = light ? 0.8 : 0.55;
        ctx.strokeStyle = light ? 'rgba(255,242,204,0.7)' : 'rgba(168,94,30,0.38)';
        ctx.setLineDash([6 + R() * 8, 0.6 + R() * 1.0, 3 + R() * 5, 0.6 + R() * 0.8]);
        ctx.lineDashOffset = R() * 10;
        ctx.beginPath(); poly(ctx, jitter(capPts(sg, 0.9 + j * 1.35, s, 0.84 - j * 0.05), R, 0.35), 0, 0, true); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.shadowColor = 'rgba(110,48,10,0.6)';
    ctx.shadowBlur = 2.6 * S;
    ctx.shadowOffsetX = 0.4 * S; ctx.shadowOffsetY = 0.6 * S;
    ctx.fillStyle = '#D98A2C';
    ctx.beginPath(); poly(ctx, pts); ctx.fill();
    ctx.restore();

    /* 2. 側面（斜上方看得到的底部厚度） */
    const tb = pts.reduce((m, q) => [Math.min(m[0], q[1]), Math.max(m[1], q[1])], [1e9, -1e9]);
    let g = ctx.createLinearGradient(0, tb[0] + side, 0, tb[1] + side);
    g.addColorStop(0, '#C47A2C'); g.addColorStop(0.65, '#A35A1C'); g.addColorStop(1, '#7A3A10');
    ctx.fillStyle = g;
    ctx.beginPath(); polySide(ctx, pts); ctx.fill();
    // 側面的酥皮橫紋
    ctx.save();
    ctx.clip();
    const bot = [];
    const u0 = sg.center ? -sg.a1 - sg.c : sg.a0, u1 = sg.center ? sg.a1 + sg.c : sg.a1;
    for (let i = 0; i <= 30; i++) bot.push(pt(sg, u0 + ((u1 - u0) * i) / 30, -1));
    for (let j = 1; j <= 2; j++) {
      ctx.beginPath();
      bot.forEach((q, i) => {
        const y = q[1] + (SIDE_K * q[2] + 0.6) * j * 0.36;
        i ? ctx.lineTo(q[0] + 0.03 * q[2] * j * 0.36, y) : ctx.moveTo(q[0], y);
      });
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = j === 1 ? 'rgba(236,170,90,0.45)' : 'rgba(225,150,70,0.3)';
      ctx.stroke();
    }
    ctx.restore();

    /* 3. 主體：頂端琥珀褐 → 亮金黃 → 凹摺處淺奶油色 */
    ctx.save();
    ctx.beginPath(); poly(ctx, pts);
    ctx.save();
    local(ctx, sg, sg.vw * 1.12, H * 1.45);
    g = ctx.createRadialGradient(0, -0.04, 0, 0, 0, 1);
    g.addColorStop(0, '#BC5E1C');
    g.addColorStop(0.4, '#C96E22');
    g.addColorStop(0.6, '#DE9334');
    g.addColorStop(0.83, '#EEBB64');
    g.addColorStop(1, '#F8DA9C');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();

    /* 尖端烤得比較深 */
    if (sg.tip) {
      const a = P(sg.dir * (sg.a0 + 14)), b = P(sg.dir * (UE - 2));
      g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, 'rgba(150,66,14,0.12)');
      g.addColorStop(0.5, 'rgba(135,56,12,0.42)');
      g.addColorStop(1, 'rgba(100,38,8,0.9)');
      ctx.fillStyle = g; ctx.fill();
    }

    /* 尖端最後一圈捲紋 */
    if (sg.tip) {
      for (const [off, col, w] of [[0, 'rgba(120,50,10,0.45)', 0.9], [1.4, 'rgba(255,228,170,0.45)', 0.8]]) {
        const q = [];
        for (let i = 0; i <= 16; i++) {
          const v = 0.95 - (1.9 * i) / 16;
          q.push(pt(sg, UE - 17 + 4 * Math.sqrt(Math.max(0, 1 - v * v)) + off, v));
        }
        ctx.lineWidth = w; ctx.strokeStyle = col;
        ctx.beginPath(); poly(ctx, q, 0, 0, true); ctx.stroke();
      }
    }

    /* 4. 體積：光從左上來，右下邊緣變暗 */
    ctx.save();
    local(ctx, sg, sg.vw * 1.15, H);
    g = ctx.createRadialGradient(-0.2, -0.3, 0, -0.1, -0.12, 1.3);
    g.addColorStop(0, 'rgba(120,52,12,0)');
    g.addColorStop(0.55, 'rgba(120,52,12,0)');
    g.addColorStop(1, 'rgba(105,44,10,0.5)');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();

    /* 斜上方視角：上緣受光、下半部較暗 */
    g = ctx.createLinearGradient(0, tb[0], 0, tb[1]);
    g.addColorStop(0, 'rgba(255,238,196,0.22)');
    g.addColorStop(0.4, 'rgba(255,238,196,0)');
    g.addColorStop(0.68, 'rgba(120,55,12,0)');
    g.addColorStop(1, 'rgba(105,45,10,0.42)');
    ctx.fillStyle = g; ctx.fill();

    /* 5. 節末端的酥皮紋（跟凹摺平行） */
    ctx.clip();
    for (const s of capSides(sg)) {
      for (let j = 1; j <= 2; j++) {
        ctx.lineWidth = j % 2 ? 0.8 : 0.6;
        ctx.strokeStyle = j % 2 ? 'rgba(255,230,176,0.22)' : 'rgba(150,76,18,0.2)';
        ctx.beginPath(); poly(ctx, jitter(capPts(sg, -j * 2.4, s, 0.82 - j * 0.06), R, 0.25), 0, 0, true); ctx.stroke();
      }
    }

    /* 6. 蛋液光澤高光（左上） */
    ctx.save();
    local(ctx, sg, sg.vw, H);
    ctx.save();
    ctx.translate(-0.32, -0.3);
    ctx.rotate(0.12);
    ctx.scale(0.2, 0.55);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(255,250,232,0.5)');
    g.addColorStop(0.5, 'rgba(255,246,222,0.2)');
    g.addColorStop(1, 'rgba(255,246,222,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 小而亮的反光點
    ctx.translate(-0.36, -0.62);
    ctx.rotate(0.2);
    ctx.scale(0.07, 0.15);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(255,255,248,0.85)');
    g.addColorStop(1, 'rgba(255,255,248,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();

    /* 7. 凹摺邊的細線，讓每節分得開 */
    ctx.lineCap = 'round';
    for (const s of capSides(sg)) {
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(125,56,12,0.55)';
      ctx.beginPath(); poly(ctx, capPts(sg, 0, s, 0.97), 0, 0, true); ctx.stroke();
    }
  }

  function details(ctx) {
    const R = K.rng(20261108);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    // 烤色小斑點
    for (let i = 0; i < 70; i++) {
      const sg = SEGS[Math.floor(R() * SEGS.length)];
      const U = sg.vm + (R() * 2 - 1) * sg.vw * 0.6, v = (R() * 2 - 1) * 0.65;
      const p = pt(sg, U, v);
      ctx.fillStyle = `rgba(120,52,12,${0.15 + R() * 0.25})`;
      ctx.beginPath(); ctx.arc(p[0], p[1], 0.35 + R() * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // 翹起的酥皮小碎片
    for (let i = 0; i < 9; i++) {
      const sg = SEGS[2 + Math.floor(R() * (SEGS.length - 2))];   // 尖端太細，不放
      const U = sg.vm + (R() * 2 - 1) * sg.vw * 0.5, v = 0.1 + R() * 0.7;
      const p = pt(sg, U, v);
      const s = 0.9 + R() * 1.1, a = R() * Math.PI;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,232,178,0.7)';
      ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.7, s, -0.1); ctx.quadraticCurveTo(0, s * 0.25, -s, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,66,16,0.35)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, s * 0.25, s, -0.1); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function outline(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.beginPath();
    for (const sg of SEGS) {
      const pts = lobePts(sg);
      poly(ctx, pts);
      polySide(ctx, pts);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = 'rgba(112,52,14,0.6)';
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    const m = ctx.getTransform ? ctx.getTransform() : { a: 1, b: 0 };
    const S = Math.hypot(m.a, m.b) || 1;      // 陰影模糊用裝置像素，要乘上縮放
    for (const sg of SEGS) drawLobe(ctx, sg, S);
    details(ctx);
    outline(ctx);
  }

  window.DESSERTS['croissant'] = { draw };
})();
