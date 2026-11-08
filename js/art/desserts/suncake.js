/* 太陽餅（suncake）
 * 扁圓、微微隆起，白色層層酥皮（表面有裂開、翹起的薄酥片），邊緣與底部烤成淡金色；
 * 正中間蓋一個紅色圓形店印（小圖就是「白圓餅＋中間紅點」）。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const TOP = { cy: 91, rx: 82, ry: 51 };     // 頂面外緣
  const BOT = { cy: 109, rx: 80, ry: 50 };    // 底面
  const DOME = 9;                             // 中間隆起高度

  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const nT = makeNoise(5, 0.8, [3, 5, 9, 14]);
  const nB = makeNoise(9, 0.8, [4, 7]);
  const ep = (e, th, n) => [CX + Math.cos(th) * (e.rx + n), e.cy + Math.sin(th) * (e.ry + n * e.ry / e.rx)];

  function topPath(ctx, inset) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const th = TAU * i / 120;
      const p = ep(TOP, th, nT(th) - (inset || 0));
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function silhouette(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const th = Math.PI + Math.PI * i / 60; const p = ep(TOP, th, nT(th)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 0; i <= 60; i++) { const th = Math.PI * i / 60; const p = ep(BOT, th, nB(th) + 1.5 * Math.sin(th * 9) * 0.3); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* ---------- 側面：一層層酥皮，往下烤成金黃 ---------- */
  function drawSide(ctx) {
    silhouette(ctx);
    const g = ctx.createLinearGradient(CX - 84, 0, CX + 84, 0);
    g.addColorStop(0, '#F3D9A8');
    g.addColorStop(0.3, '#F7E4BE');
    g.addColorStop(0.7, '#E8C28A');
    g.addColorStop(1, '#C99558');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    silhouette(ctx); ctx.clip();
    const v = ctx.createLinearGradient(0, TOP.cy, 0, BOT.cy + BOT.ry);
    v.addColorStop(0, 'rgba(255,248,230,0)');
    v.addColorStop(0.55, 'rgba(214,150,70,0.25)');
    v.addColorStop(1, 'rgba(184,112,40,0.65)');
    ctx.fillStyle = v;
    ctx.fillRect(0, TOP.cy, 200, 90);
    // 酥皮層次線
    const r = K.rng(71);
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      const e = { cy: TOP.cy + (BOT.cy - TOP.cy) * t, rx: TOP.rx + (BOT.rx - TOP.rx) * t, ry: TOP.ry + (BOT.ry - TOP.ry) * t };
      let th = 0.05 + r() * 0.2;
      while (th < Math.PI - 0.05) {
        const end = Math.min(Math.PI - 0.05, th + 0.3 + r() * 0.6);
        ctx.strokeStyle = `rgba(170,110,50,${0.25 + r() * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let a = th; a <= end; a += 0.05) { const p = ep(e, a, nT(a) * (1 - t) + (r() - 0.5) * 0.6); a === th ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
        th = end + 0.06 + r() * 0.2;
      }
    }
    // 頂面邊緣下方的陰影
    ctx.strokeStyle = 'rgba(160,104,48,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy + 3, TOP.rx, TOP.ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面：白色酥皮、裂紋、翹起的薄片 ---------- */
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(80, 76, 6, 100, 94, 92);
    g.addColorStop(0, '#FFFDF6');
    g.addColorStop(0.5, '#FBF1DC');
    g.addColorStop(0.82, '#F2DDB4');
    g.addColorStop(1, '#E2BE84');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 隆起：右下側稍暗
    const dm = ctx.createLinearGradient(60, 50, 160, 140);
    dm.addColorStop(0, 'rgba(210,170,110,0)');
    dm.addColorStop(0.55, 'rgba(210,170,110,0)');
    dm.addColorStop(1, 'rgba(200,150,90,0.32)');
    ctx.fillStyle = dm;
    ctx.fillRect(0, 30, 200, 130);
    // 外圈淡金烤色
    ctx.strokeStyle = 'rgba(214,160,86,0.45)';
    ctx.lineWidth = 9;
    topPath(ctx); ctx.stroke();
    ctx.strokeStyle = 'rgba(196,136,66,0.35)';
    ctx.lineWidth = 3;
    topPath(ctx); ctx.stroke();
    // 靠近邊緣一圈圈的酥皮層（斷斷續續的細環）
    const rl = K.rng(141);
    for (let k = 0; k < 3; k++) {
      const ins = 7 + k * 5;
      let th = rl() * TAU; const stop = th + TAU;
      while (th < stop) {
        const end = Math.min(stop, th + 0.4 + rl() * 0.9);
        ctx.strokeStyle = `rgba(190,140,80,${0.28 - k * 0.06})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let a = th; a <= end; a += 0.05) { const p = ep(TOP, a, nT(a) - ins); a === th ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,250,0.6)';
        ctx.beginPath();
        for (let a = th; a <= end; a += 0.05) { const p = ep(TOP, a, nT(a) - ins - 1.2); a === th ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
        th = end + 0.15 + rl() * 0.4;
      }
    }

    // 一片片酥皮：表層剝開的地方露出下一層（淡金），剝開的邊緣翹起、白亮，旁邊一道細裂縫
    const r = K.rng(333);
    const flakes = [
      [64, 78, 11, 0.2], [104, 66, 10, -0.4], [138, 80, 10, 0.9],
      [76, 114, 11, 2.8], [128, 114, 10, -2.6], [80, 94, 6, 1.4], [122, 94, 6, -1.2],
    ];
    for (const [x, y, sz, rot] of flakes) {
      const n = 11, pts = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, rr = sz * (0.7 + r() * 0.3);
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.6]);
      }
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot * 0.25);
      const path = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
      // 露出的下一層
      path();
      ctx.fillStyle = 'rgba(236,206,152,0.3)';
      ctx.fill();
      // 下緣（離光源遠的一側）細細的裂縫陰影
      ctx.strokeStyle = 'rgba(168,118,60,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 6; i++) { const p = pts[i % n]; i === 1 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
      ctx.stroke();
      // 上緣（靠光源）翹起的白亮薄邊
      ctx.strokeStyle = 'rgba(255,255,252,0.85)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 7; i <= 10; i++) { const p = pts[i % n]; i === 7 ? ctx.moveTo(p[0], p[1] - 0.6) : ctx.lineTo(p[0], p[1] - 0.6); }
      ctx.stroke();
      ctx.restore();
    }
    // 幾道細裂紋
    ctx.strokeStyle = 'rgba(176,128,72,0.4)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 10; i++) {
      const a = r() * TAU, rr = 0.35 + r() * 0.5;
      let x = CX + Math.cos(a) * rr * TOP.rx, y = TOP.cy + Math.sin(a) * rr * TOP.ry;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += (r() - 0.5) * 12; y += (r() - 0.5) * 6; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    // 細碎的掉屑痕跡
    for (let i = 0; i < 60; i++) {
      const a = r() * TAU, rr = Math.sqrt(r()) * 0.9;
      const x = CX + Math.cos(a) * rr * TOP.rx, y = TOP.cy + Math.sin(a) * rr * TOP.ry;
      ctx.fillStyle = r() < 0.5 ? 'rgba(200,150,90,0.3)' : 'rgba(255,255,252,0.8)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.8 + r() * 1.4, 0.5 + r() * 0.8, r() * 3, 0, TAU); ctx.fill();
    }
    // 左上的大塊柔光
    ctx.save();
    ctx.translate(76, 74); ctx.scale(1, 0.55);
    const hl = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
    hl.addColorStop(0, 'rgba(255,255,255,0.7)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    // 外緣細線
    ctx.strokeStyle = 'rgba(176,120,60,0.5)';
    ctx.lineWidth = 1.2;
    topPath(ctx); ctx.stroke();
  }

  /* ---------- 正中間的紅色店印 ---------- */
  function drawStamp(ctx) {
    const x = CX + 1, y = TOP.cy - 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.62);
    const R = 21;
    // 印泥滲進酥皮的淡紅暈
    const halo = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.25);
    halo.addColorStop(0, 'rgba(214,52,46,0.25)');
    halo.addColorStop(1, 'rgba(214,52,46,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.25, 0, TAU); ctx.fill();
    // 實心紅印，裡面留白的圖紋（一圈細框＋小太陽）
    ctx.fillStyle = '#D52F2A';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,244,236,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, R - 3.2, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + Math.PI / 8;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke();
    }
    // 蓋印不均勻：幾個淡掉的小點
    const r = K.rng(48);
    ctx.fillStyle = 'rgba(255,246,236,0.35)';
    for (let i = 0; i < 12; i++) {
      const a = r() * TAU, rr = r() * R;
      ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.6 + r() * 1.1, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    drawStamp(ctx);
    ctx.strokeStyle = 'rgba(168,108,48,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    silhouette(ctx);
    ctx.stroke();
  }

  window.DESSERTS['suncake'] = {
    draw,
    crumbs: ['#FBF1DC', '#FFFDF6', '#F2DDB4', '#E2BE84', '#E8C28A'],
    crunchy: 0.85,
  };
})();
