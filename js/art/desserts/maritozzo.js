/* 瑪莉托索（Maritozzo）
 * 橢圓形的亮褐色小圓麵包從頂上對切、往兩邊撐開，中間夾滿一大塊鮮奶油，
 * 奶油頂面用抹刀抹得平平的，整顆撒一點糖粉。斜上方俯視、光源左上。
 * 和其他圓頂麵包的分別：中間一大片平整的白色鮮奶油（像一張笑開的嘴）。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const XL = 24, XR = 176, CXm = 100;             // 麵包兩端
  const TL = 31, TR = 169;                         // 切口（奶油）兩端
  const LINE = 'rgba(120,62,20,0.85)';
  const BUN = '#D48A3C', BUN_LT = '#F4C47C', BUN_DK = '#99511A';

  const tt = x => Math.max(0, 1 - ((x - CXm) / ((TR - TL) / 2)) ** 2);
  // 奶油頂面：前後兩條弧（兩端收尖），切口裡的奶油被抹平
  const creamBack = x => 82 - 27 * Math.pow(tt(x), 0.7);
  const creamFront = x => 85 + 5 * Math.pow(tt(x), 0.9);
  // 前半顆麵包的切口上緣（中間最低）
  const bunEdge = x => 87 + 33 * Math.pow(tt(x), 0.85);

  function curve(ctx, f, x0, x1, step, first) {
    const n = Math.ceil(Math.abs(x1 - x0) / step), d = (x1 - x0) / n;
    for (let i = 0; i <= n; i++) { const x = x0 + d * i; (first && i === 0) ? ctx.moveTo(x, f(x)) : ctx.lineTo(x, f(x)); }
  }

  /* ---------- 後半顆麵包（整顆麵包的上半輪廓，往後撐開） ---------- */
  function backBunPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(XL, 116);
    ctx.bezierCurveTo(XL - 3, 62, 58, 38, CXm, 38);
    ctx.bezierCurveTo(142, 38, XR + 3, 62, XR, 116);
    ctx.closePath();
  }
  function drawBackBun(ctx) {
    backBunPath(ctx);
    const g = ctx.createRadialGradient(70, 56, 2, 104, 84, 92);
    g.addColorStop(0, BUN_LT); g.addColorStop(0.32, '#DF9746'); g.addColorStop(0.7, BUN); g.addColorStop(1, BUN_DK);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); backBunPath(ctx); ctx.clip();
    glaze(ctx, 66, 46, 22, 4.5, -0.2);
    sugar(ctx, 55, XL + 6, XR - 6, 40, 80, 5);
    // 切口後緣露出的淺色麵包心
    ctx.fillStyle = '#F7E4BC';
    ctx.beginPath(); curve(ctx, x => creamBack(x) - 6 * Math.pow(tt(x), 0.5), TL, TR, 3, true); curve(ctx, creamBack, TR, TL, 3, false); ctx.closePath(); ctx.fill();
    ctx.restore();
    backBunPath(ctx);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.stroke();
  }

  /* ---------- 鮮奶油 ---------- */
  function creamTopPath(ctx) {
    ctx.beginPath();
    curve(ctx, creamBack, TL, TR, 3, true);
    curve(ctx, creamFront, TR, TL, 3, false);
    ctx.closePath();
  }
  // 前面斜斜的奶油面，下緣微微蓋過麵包切口（起伏）
  const creamLow = x => bunEdge(x) + 2.5 * Math.pow(tt(x), 0.5) + Math.sin(x * 0.35) * 0.9 * tt(x);
  function creamFacePath(ctx) {
    ctx.beginPath();
    curve(ctx, creamFront, TL, TR, 3, true);
    curve(ctx, creamLow, TR, TL, 2, false);
    ctx.closePath();
  }
  function drawCream(ctx) {
    const rnd = K.rng(31);
    // 前面的斜面
    creamFacePath(ctx);
    const gf = ctx.createLinearGradient(0, 86, 0, 122);
    gf.addColorStop(0, '#FFFFFF'); gf.addColorStop(0.55, '#F7F2EC'); gf.addColorStop(1, '#E2D6CA');
    ctx.fillStyle = gf; ctx.fill();
    ctx.save(); creamFacePath(ctx); ctx.clip();
    const gx = ctx.createLinearGradient(TL, 0, TR, 0);
    gx.addColorStop(0, 'rgba(255,255,255,0.4)'); gx.addColorStop(0.5, 'rgba(255,255,255,0)'); gx.addColorStop(1, 'rgba(150,120,100,0.22)');
    ctx.fillStyle = gx; ctx.fillRect(0, 80, 200, 50);
    // 抹刀留下的弧線
    for (let i = 0; i < 3; i++) {
      const k = 0.3 + i * 0.22;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); curve(ctx, x => creamFront(x) + (bunEdge(x) - creamFront(x)) * k - 0.8, TL + 18 + i * 6, TR - 26 + i * 4, 4, true); ctx.stroke();
      ctx.strokeStyle = 'rgba(190,170,150,0.4)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); curve(ctx, x => creamFront(x) + (bunEdge(x) - creamFront(x)) * k + 0.6, TL + 18 + i * 6, TR - 26 + i * 4, 4, true); ctx.stroke();
    }
    ctx.restore();
    // 平整的頂面
    creamTopPath(ctx);
    const g = ctx.createLinearGradient(0, 55, 0, 92);
    g.addColorStop(0, '#F1E9E0'); g.addColorStop(0.35, '#FFFFFF'); g.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); creamTopPath(ctx); ctx.clip();
    for (let i = 0; i < 3; i++) {
      const yy = 66 + i * 7 + rnd() * 1.5, x0 = TL + 26 + rnd() * 10, x1 = TR - 26 - rnd() * 10;
      ctx.strokeStyle = 'rgba(200,185,170,0.4)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(CXm, yy + 1.2, x1, yy); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(78, 70, 28, 4.5, -0.04, 0, TAU); ctx.fill();
    ctx.restore();
    // 頂面前緣（圓角處的淡影）
    ctx.strokeStyle = 'rgba(205,188,172,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); curve(ctx, x => creamFront(x) + 1.2, TL + 8, TR - 8, 3, true); ctx.stroke();
    // 奶油外緣
    ctx.beginPath(); curve(ctx, creamBack, TL, TR, 3, true);
    ctx.strokeStyle = 'rgba(170,140,120,0.6)'; ctx.lineWidth = 1.1; ctx.stroke();
  }

  /* ---------- 前半顆麵包 ---------- */
  function frontBunPath(ctx) {
    ctx.beginPath();
    curve(ctx, creamLow, TL, TR, 2, true);
    ctx.bezierCurveTo(XR - 4, 92, XR + 3, 108, XR, 120);
    ctx.bezierCurveTo(XR - 4, 156, XR - 30, 164, CXm, 164);
    ctx.bezierCurveTo(XL + 30, 164, XL + 4, 156, XL, 120);
    ctx.bezierCurveTo(XL - 3, 108, XL + 4, 92, TL, creamLow(TL));
    ctx.closePath();
  }
  function drawFrontBun(ctx) {
    frontBunPath(ctx);
    const g = ctx.createRadialGradient(64, 118, 3, 104, 128, 92);
    g.addColorStop(0, BUN_LT); g.addColorStop(0.3, '#E09A48'); g.addColorStop(0.65, BUN); g.addColorStop(1, BUN_DK);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); frontBunPath(ctx); ctx.clip();
    // 底部側面烤色較淺（麵包腰身）
    const gb = ctx.createLinearGradient(0, 140, 0, 166);
    gb.addColorStop(0, 'rgba(240,190,120,0)'); gb.addColorStop(1, 'rgba(240,195,130,0.55)');
    ctx.fillStyle = gb; ctx.fillRect(0, 140, 200, 30);
    // 右下陰影
    const gs = ctx.createLinearGradient(80, 0, XR, 0);
    gs.addColorStop(0, 'rgba(110,50,10,0)'); gs.addColorStop(1, 'rgba(110,50,10,0.3)');
    ctx.fillStyle = gs; ctx.fillRect(80, 100, 120, 70);
    glaze(ctx, 62, 130, 28, 7, 0.28);
    // 切口邊緣：一圈淺色麵包心＋薄薄的皮
    ctx.strokeStyle = 'rgba(120,60,20,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); curve(ctx, x => creamLow(x) + 1.5, TL + 4, TR - 4, 3, true); ctx.stroke();
    sugar(ctx, 90, XL + 6, XR - 6, 104, 150, 9);
    ctx.restore();
    frontBunPath(ctx);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  }

  // 糖漿亮面
  function glaze(ctx, x, y, rx, ry, rot) {
    ctx.fillStyle = 'rgba(255,240,205,0.55)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,245,0.85)';
    ctx.beginPath(); ctx.ellipse(x - rx * 0.3, y - ry * 0.2, rx * 0.35, ry * 0.35, rot, 0, TAU); ctx.fill();
  }
  // 糖粉
  function sugar(ctx, n, x0, x1, y0, y1, seed) {
    const rnd = K.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + Math.pow(rnd(), 1.5) * (y1 - y0);
      ctx.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd() * 0.8, 0, TAU); ctx.fill();
    }
  }

  function draw(ctx) {
    drawBackBun(ctx);
    drawCream(ctx);
    drawFrontBun(ctx);
  }

  window.DESSERTS['maritozzo'] = {
    draw,
    crumbs: ['#D48A3C', '#FFFFFF', '#F4C47C', '#F6E2B8', '#99511A'],
    crunchy: 0.1,
  };
})();
