/* 美式鬆餅（Pancakes）
 * 斜上 45 度的三層厚鬆餅：每片上下兩面煎成金褐、側面是淡奶油色的鬆軟組織，
 * 頂上一塊微融的奶油，琥珀色楓糖漿積在上面、順著側面往下流。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CYB = 137, KY = 0.53, T = 19;
  // 由下往上三片：水平偏移、半徑
  const CAKES = [
    { dx: -1, r: 76 },
    { dx: 2.5, r: 74 },
    { dx: -1.5, r: 73 },
  ];
  const ZTOP = CAKES.length * T;

  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const NZ = CAKES.map((c, i) => makeNoise(10 + i, 1.2, [3, 5, 8]));

  // 第 i 片的點：θ、高度比例 t（0 底、1 頂）
  function cp(i, th, t, extra) {
    const c = CAKES[i];
    const bulge = 2.6 * Math.sin(Math.PI * t);
    const r = c.r + NZ[i](th) + bulge + (extra || 0);
    return [CX + c.dx + Math.cos(th) * r, CYB + Math.sin(th) * r * KY - (i + t) * T];
  }

  function sidePath(ctx, i) {
    ctx.beginPath();
    for (let k = 0; k <= 70; k++) { const p = cp(i, Math.PI * k / 70, 1); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let k = 0; k <= 8; k++) { const p = cp(i, 0, 1 - k / 8); ctx.lineTo(p[0], p[1]); }
    for (let k = 70; k >= 0; k--) { const p = cp(i, Math.PI * k / 70, 0); ctx.lineTo(p[0], p[1]); }
    for (let k = 0; k <= 8; k++) { const p = cp(i, Math.PI, k / 8); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }
  function topPath(ctx, i) {
    ctx.beginPath();
    for (let k = 0; k <= 140; k++) { const p = cp(i, TAU * k / 140, 1); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* ---------- 一片鬆餅 ---------- */
  function drawCake(ctx, i) {
    // 側面：中間奶油色、上下煎色
    sidePath(ctx, i);
    const g = ctx.createLinearGradient(0, CYB - (i + 1) * T + 6, 0, CYB - i * T + 34);
    g.addColorStop(0, '#C47A2E');
    g.addColorStop(0.18, '#EBC488');
    g.addColorStop(0.42, '#F7E4BB');
    g.addColorStop(0.62, '#F1D7A2');
    g.addColorStop(0.85, '#C98536');
    g.addColorStop(1, '#A9621F');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    sidePath(ctx, i); ctx.clip();
    // 用帶狀方式畫上下烤色（沿著弧線）
    const band = (t0, t1, col) => {
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const p = cp(i, Math.PI * k / 60, t1); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      for (let k = 60; k >= 0; k--) { const p = cp(i, Math.PI * k / 60, t0); ctx.lineTo(p[0], p[1]); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    };
    band(0.25, 0.75, 'rgba(250,232,195,0.85)');
    band(0.33, 0.6, 'rgba(255,244,215,0.5)');
    band(-0.05, 0.14, 'rgba(160,90,30,0.75)');
    band(0.88, 1.05, 'rgba(175,100,35,0.7)');
    // 鬆軟的氣孔
    const rnd = K.rng(50 + i);
    for (let k = 0; k < 90; k++) {
      const th = 0.05 + rnd() * (Math.PI - 0.1), t = 0.2 + rnd() * 0.6;
      const p = cp(i, th, t);
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(200,150,80,0.4)' : 'rgba(255,252,235,0.7)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.6 + rnd() * 1.1, 0.4 + rnd() * 0.6, 0, 0, TAU); ctx.fill();
    }
    // 左亮右暗
    const gs = ctx.createLinearGradient(CX - 80, 0, CX + 80, 0);
    gs.addColorStop(0, 'rgba(255,245,220,0.25)');
    gs.addColorStop(0.45, 'rgba(255,245,220,0)');
    gs.addColorStop(0.8, 'rgba(110,60,20,0.05)');
    gs.addColorStop(1, 'rgba(110,60,20,0.32)');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    sidePath(ctx, i);
    ctx.strokeStyle = 'rgba(120,65,20,0.7)'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();

    // 頂面（只有最上面一片完整露出，其餘被蓋住）
    topPath(ctx, i);
    const gt = ctx.createRadialGradient(CX - 22, CYB - (i + 1) * T - 12, 4, CX, CYB - (i + 1) * T, 80);
    gt.addColorStop(0, '#DFA052');
    gt.addColorStop(0.6, '#C98436');
    gt.addColorStop(1, '#A9641F');
    ctx.fillStyle = gt; ctx.fill();
    if (i === CAKES.length - 1) {
      ctx.save();
      topPath(ctx, i); ctx.clip();
      // 煎出來的蕾絲狀斑紋
      const r2 = K.rng(99);
      for (let k = 0; k < 70; k++) {
        const a = r2() * TAU, rr = Math.sqrt(r2()) * 70;
        const x = CX + Math.cos(a) * rr, y = CYB - ZTOP + Math.sin(a) * rr * KY;
        ctx.fillStyle = r2() < 0.5 ? 'rgba(240,190,110,0.45)' : 'rgba(150,80,20,0.3)';
        ctx.beginPath(); ctx.ellipse(x, y, 1.5 + r2() * 3, 1 + r2() * 1.6, 0, 0, TAU); ctx.fill();
      }
      // 外緣亮邊（圓角）
      ctx.strokeStyle = 'rgba(255,225,170,0.45)'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const p = cp(i, Math.PI * 0.55 + Math.PI * 0.9 * k / 60, 1, -2); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------- 楓糖漿：頂上的一攤＋往下流的幾道 ---------- */
  const TOPI = CAKES.length - 1;
  const nSyr = makeNoise(77, 3.2, [3, 4, 6, 9]);
  const DRIPS = [  // 角度、長度、寬度
    [0.5, 26, 12], [1.15, 44, 15], [1.85, 30, 13], [2.5, 48, 13],
  ];
  function syrupPoolPath(ctx) {
    ctx.beginPath();
    for (let k = 0; k <= 160; k++) {
      const th = TAU * k / 160;
      let r = 58 + nSyr(th);
      const front = Math.sin(th) > 0;
      if (front) {
        // 往下流的地方延伸到邊緣
        let reach = 0;
        DRIPS.forEach(([a, , w]) => { reach = Math.max(reach, Math.exp(-Math.pow((th - a) / (w / 150), 2))); });
        r = r + (CAKES[TOPI].r + 2 - r) * reach;
      }
      const p = [CX + CAKES[TOPI].dx + Math.cos(th) * r, CYB - ZTOP + Math.sin(th) * r * KY];
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function dripPath(ctx, a, len, w) {
    // 沿著側面往下：上寬下窄、末端一顆圓珠
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const Z = ZTOP - t * len;                       // 絕對高度
      const layer = Math.max(0, Math.min(TOPI, Math.floor((Z - 0.001) / T)));
      const p = cp(layer, a, (Z - layer * T) / T, 1.6);
      pts.push([p[0], p[1], 1 - t * 0.35]);
    }
    ctx.beginPath();
    const hw = w / 2;
    ctx.moveTo(pts[0][0] - hw * 1.3, pts[0][1] - 3);
    pts.forEach(p => ctx.lineTo(p[0] - hw * p[2], p[1]));
    const end = pts[pts.length - 1];
    ctx.arc(end[0], end[1], hw * 0.82, Math.PI, 0, true);
    for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k][0] + hw * pts[k][2], pts[k][1]);
    ctx.lineTo(pts[0][0] + hw * 1.3, pts[0][1] - 3);
    ctx.closePath();
    return end;
  }
  function drawSyrup(ctx) {
    const gS = (y0, y1) => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, '#C9711C');
      g.addColorStop(0.5, '#A85512');
      g.addColorStop(1, '#7E3A08');
      return g;
    };
    // 流下來的
    DRIPS.forEach(([a, len, w]) => {
      const end = dripPath(ctx, a, len, w);
      const gx = ctx.createLinearGradient(end[0] - w / 2, 0, end[0] + w / 2, 0);
      gx.addColorStop(0, '#D27A22'); gx.addColorStop(0.35, '#B45E14'); gx.addColorStop(1, '#7E3A08');
      ctx.fillStyle = gx; ctx.fill();
      ctx.strokeStyle = 'rgba(100,40,5,0.5)'; ctx.lineWidth = 0.9; ctx.stroke();
      // 亮光條
      const top = cp(TOPI, a, 1, 1);
      ctx.strokeStyle = 'rgba(255,225,170,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(top[0] - w * 0.2, top[1] + 4); ctx.lineTo(end[0] - w * 0.22, end[1] - 5); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,210,0.9)';
      ctx.beginPath(); ctx.ellipse(end[0] - w * 0.2, end[1] - 1, 1.6, 2.2, 0, 0, TAU); ctx.fill();
    });
    // 頂上一攤
    syrupPoolPath(ctx);
    const cy = CYB - ZTOP;
    const g = ctx.createRadialGradient(CX - 10, cy - 6, 4, CX, cy, 70);
    g.addColorStop(0, '#B8601A');
    g.addColorStop(0.6, '#A04F10');
    g.addColorStop(1, '#C27020');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    syrupPoolPath(ctx); ctx.clip();
    // 邊緣較薄、透出鬆餅色
    ctx.strokeStyle = 'rgba(215,135,50,0.35)'; ctx.lineWidth = 5;
    syrupPoolPath(ctx); ctx.stroke();
    // 亮面反光
    ctx.fillStyle = 'rgba(255,235,200,0.55)';
    ctx.beginPath(); ctx.ellipse(CX - 34, cy - 10, 16, 4, -0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,225,0.8)';
    ctx.beginPath(); ctx.ellipse(CX - 38, cy - 11, 6, 1.6, -0.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(CX + 30, cy + 14, 5, 1.4, 0.1, 0, TAU); ctx.fill();
    ctx.restore();
    syrupPoolPath(ctx);
    ctx.strokeStyle = 'rgba(110,45,5,0.45)'; ctx.lineWidth = 0.9; ctx.stroke();
  }

  /* ---------- 奶油塊 ---------- */
  function drawButter(ctx) {
    const cx = CX + 2, cy = CYB - ZTOP - 2;
    const S = 15, HB = 11, ROT = 0.42, KYB = KY;
    const co = Math.cos(ROT), si = Math.sin(ROT);
    const P = (u, v, z) => [cx + u * co - v * si, cy + (u * si + v * co) * KYB - z];
    // 融化的奶油
    ctx.fillStyle = 'rgba(255,225,120,0.55)';
    ctx.beginPath(); ctx.ellipse(cx + 2, cy + 3, 27, 11, 0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,0.6)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, 21, 8, 0.05, 0, TAU); ctx.fill();
    const tl = P(-S, S, HB), tf = P(S, S, HB), tr = P(S, -S, HB), tb = P(-S, -S, HB);
    const bl = P(-S, S, 0), bf = P(S, S, 0), br = P(S, -S, 0);
    const poly = pts => { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
    ctx.lineJoin = 'round';
    // 左前面
    poly([tl, tf, bf, bl]);
    let g = ctx.createLinearGradient(tl[0], tl[1], bf[0], bf[1]);
    g.addColorStop(0, '#FBE38E'); g.addColorStop(1, '#EFC85A');
    ctx.fillStyle = g; ctx.fill();
    // 右前面
    poly([tf, tr, br, bf]);
    g = ctx.createLinearGradient(tf[0], tf[1], br[0], br[1]);
    g.addColorStop(0, '#E9C153'); g.addColorStop(1, '#D9A93C');
    ctx.fillStyle = g; ctx.fill();
    // 頂面
    poly([tb, tl, tf, tr]);
    g = ctx.createLinearGradient(tb[0], tb[1], tf[0], tf[1]);
    g.addColorStop(0, '#FFF8D2'); g.addColorStop(1, '#FCE99C');
    ctx.fillStyle = g; ctx.fill();
    // 圓角亮邊、輪廓
    ctx.strokeStyle = 'rgba(255,255,240,0.9)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tl[0] + 1, tl[1]); ctx.lineTo(tf[0], tf[1] - 0.5); ctx.lineTo(tr[0] - 1, tr[1]); ctx.stroke();
    poly([tb, tl, bl, bf, br, tr]);
    ctx.strokeStyle = 'rgba(180,130,30,0.75)'; ctx.lineWidth = 1.1; ctx.stroke();
    // 融化往下滑的一角
    ctx.fillStyle = 'rgba(255,236,150,0.85)';
    ctx.beginPath(); ctx.ellipse(bf[0] + 2, bf[1] + 1.5, 6, 2.2, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,245,0.85)';
    ctx.beginPath(); ctx.ellipse((tb[0] + tl[0]) / 2 + 3, (tb[1] + tl[1]) / 2 + 1, 4, 1.2, -0.4, 0, TAU); ctx.fill();
  }

  function draw(ctx) {
    for (let i = 0; i < CAKES.length; i++) drawCake(ctx, i);
    drawSyrup(ctx);
    drawButter(ctx);
  }

  window.DESSERTS['pancakes'] = {
    draw,
    crumbs: ['#F7E4BB', '#C98436', '#A85512', '#FCE99C', '#EBC488'],
    crunchy: 0.15,
  };
})();
