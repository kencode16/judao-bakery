/* 布朗尼（Brownie）
 * 斜上 45 度看的一塊方形布朗尼：頂面是薄脆發亮、佈滿裂紋的糖殼（比切面亮一階的可可褐），
 * 兩個切面是濕潤扎實的深巧克力色，夾著巧克力塊和核桃碎。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何：方塊轉 38 度，俯視壓扁 ---------- */
  const CX = 100, CY = 124, KY = 0.55, H = 48, HALF = 58;
  const PHI = 38 * Math.PI / 180;
  const CO = Math.cos(PHI), SI = Math.sin(PHI);
  // (u, v) 方塊本地座標 → 畫面；z 是高度
  const P = (u, v, z) => [CX + u * CO - v * SI, CY + (u * SI + v * CO) * KY - (z || 0)];

  // 頂面四角（左、前、右、後）
  const TL = P(-HALF, HALF, H), TF = P(HALF, HALF, H), TR = P(HALF, -HALF, H), TB = P(-HALF, -HALF, H);
  const BL = P(-HALF, HALF, 0), BF = P(HALF, HALF, 0), BR = P(HALF, -HALF, 0);

  // 頂邊微微不平（糖殼翹起）
  const edgeR = K.rng(5);
  const EJ = []; for (let i = 0; i < 80; i++) EJ.push((edgeR() - 0.5) * 1.6);
  function topEdge(a, b, n, seedOff) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const j = (i === 0 || i === n) ? 0 : EJ[(i + seedOff) % 80];
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + j]);
    }
    return pts;
  }
  const E_LF = topEdge(TL, TF, 16, 0);   // 左前邊
  const E_FR = topEdge(TF, TR, 16, 20);  // 右前邊

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }

  function silhouette(ctx) {
    poly(ctx, [TB, TL, BL, BF, BR, TR]);
  }

  /* ---------- 切面：濕潤扎實的巧克力蛋糕體 ---------- */
  function faceTexture(ctx, pts, base, seed, dark) {
    const rnd = K.rng(seed);
    ctx.save();
    poly(ctx, pts); ctx.clip();
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // 細緻的濕潤氣孔
    for (let i = 0; i < 260; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), r = 0.4 + rnd() * 1.1;
      ctx.fillStyle = rnd() < 0.55 ? 'rgba(20,8,3,0.42)' : 'rgba(150,95,65,' + (dark ? 0.18 : 0.26) + ')';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * 0.8, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // 切面上的巧克力塊（深色亮面小塊）
  function chunk(ctx, x, y, w, h, rot, dark) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + 1); ctx.lineTo(w / 2 - 1, -h / 2); ctx.lineTo(w / 2, h / 2 - 1); ctx.lineTo(-w / 2 + 1, h / 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, dark ? '#3A1B0D' : '#4A2412');
    g.addColorStop(1, '#170803');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(255,225,200,' + (dark ? 0.22 : 0.38) + ')';
    ctx.fillRect(-w / 2 + 1, -h / 2 + 0.6, w * 0.55, 0.9);
    ctx.restore();
  }

  // 核桃碎（淺褐不規則）
  function walnut(ctx, x, y, r, seed, dark) {
    const rnd = K.rng(seed);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, rr = r * (0.75 + rnd() * 0.45);
      const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.85;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = dark ? '#8E6440' : '#B48557';
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,20,0.6)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(110,70,40,0.7)';
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.quadraticCurveTo(x, y - r * 0.4, x + r * 0.6, y + 0.3); ctx.stroke();
  }

  function drawSides(ctx) {
    const LF = [E_LF[0], ...E_LF.slice(1), BF, BL];
    const FR = [...E_FR, BR, BF];
    // 左前切面（受光）
    poly(ctx, LF);
    let g = ctx.createLinearGradient(TL[0], TL[1], BF[0], BF[1]);
    g.addColorStop(0, '#5C3019');
    g.addColorStop(0.5, '#482413');
    g.addColorStop(1, '#341809');
    ctx.fillStyle = g; ctx.fill();
    // 右前切面（背光）
    poly(ctx, FR);
    g = ctx.createLinearGradient(TF[0], TF[1], BR[0], BR[1]);
    g.addColorStop(0, '#36190B');
    g.addColorStop(1, '#210E05');
    ctx.fillStyle = g; ctx.fill();

    faceTexture(ctx, LF, '#482413', 61, false);
    faceTexture(ctx, FR, '#2A1308', 62, true);

    // 巧克力塊與核桃（在切面上）
    ctx.save(); poly(ctx, LF); ctx.clip();
    const onLF = (t, d) => { const a = P(-HALF + 2 * HALF * t, HALF, 0); return [a[0], a[1] - d]; };
    [[0.16, 30, 6.5, 4.2, 0.4], [0.47, 16, 5.5, 3.6, 0.42], [0.74, 33, 6, 4, 0.36], [0.88, 12, 4.6, 3.4, 0.5]]
      .forEach(([t, d, w, h, r]) => { const p = onLF(t, d); chunk(ctx, p[0], p[1], w, h, r, false); });
    [[0.32, 22, 3.6, 71], [0.62, 36, 3.2, 72]].forEach(([t, d, r, s]) => { const p = onLF(t, d); walnut(ctx, p[0], p[1], r, s, false); });
    ctx.restore();
    ctx.save(); poly(ctx, FR); ctx.clip();
    const onFR = (t, d) => { const a = P(HALF, HALF - 2 * HALF * t, 0); return [a[0], a[1] - d]; };
    [[0.2, 22, 5.5, 3.6, -0.6], [0.55, 34, 6, 4, -0.62], [0.8, 14, 5, 3.4, -0.55]]
      .forEach(([t, d, w, h, r]) => { const p = onFR(t, d); chunk(ctx, p[0], p[1], w, h, r, true); });
    [[0.4, 16, 3.4, 73]].forEach(([t, d, r, s]) => { const p = onFR(t, d); walnut(ctx, p[0], p[1], r, s, true); });
    ctx.restore();

    // 糖殼的切面：頂邊下方一條淺色薄層
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(140,88,55,0.9)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); E_LF.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 2.4) : ctx.moveTo(p[0] + 1, p[1] + 2.4)); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,60,36,0.9)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); E_FR.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 2.2) : ctx.moveTo(p[0], p[1] + 2.2)); ctx.stroke();
    // 糖殼與蛋糕體間的細縫
    ctx.strokeStyle = 'rgba(15,5,2,0.55)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); E_LF.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 4) : ctx.moveTo(p[0] + 1.5, p[1] + 4)); ctx.stroke();
    ctx.beginPath(); E_FR.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 3.8) : ctx.moveTo(p[0], p[1] + 3.8)); ctx.stroke();

    // 底部稍暗
    ctx.save(); silhouette(ctx); ctx.clip();
    const gb = ctx.createLinearGradient(0, BF[1] - 18, 0, BF[1]);
    gb.addColorStop(0, 'rgba(10,3,0,0)');
    gb.addColorStop(1, 'rgba(10,3,0,0.35)');
    ctx.fillStyle = gb; ctx.fillRect(0, BF[1] - 60, 200, 60);
    ctx.restore();

    // 前方垂直稜（左亮右暗交界的細亮線）
    ctx.strokeStyle = 'rgba(150,100,70,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(TF[0] - 0.5, TF[1] + 4); ctx.lineTo(BF[0] - 0.5, BF[1] - 1); ctx.stroke();
  }

  /* ---------- 頂面：發亮的裂紋糖殼 ---------- */
  function topPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(TB[0], TB[1]);
    ctx.lineTo(TL[0], TL[1]);
    E_LF.forEach(p => ctx.lineTo(p[0], p[1]));
    E_FR.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
  }

  // 裂紋糖殼：用 Voronoi 切成一片片不規則的薄殼，邊緣用平滑位移場扭成自然的裂縫
  function clipPoly(poly, a, b, c) {           // 保留 a*u + b*v <= c 的部分
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dp = a * p[0] + b * p[1] - c, dq = a * q[0] + b * q[1] - c;
      if (dp <= 0) out.push(p);
      if (dp * dq < 0) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  const warp = (u, v) => {
    const edge = Math.min(HALF - Math.abs(u), HALF - Math.abs(v));
    const k = Math.max(0, Math.min(1, edge / 6));          // 邊上不位移
    return [u + k * (2.6 * Math.sin(v * 0.21 + 1.3) + 1.4 * Math.sin(v * 0.53 + u * 0.2)),
            v + k * (2.6 * Math.sin(u * 0.19 + 0.4) + 1.4 * Math.sin(u * 0.47 - v * 0.15))];
  };
  function makePlates() {
    const rnd = K.rng(1893);
    const seeds = [];
    const n = 4;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i * n + j) % 5 === 3) continue;
      seeds.push([-HALF + (i + 0.5) * (2 * HALF / n) + (rnd() - 0.5) * 20, -HALF + (j + 0.5) * (2 * HALF / n) + (rnd() - 0.5) * 20]);
    }
    const sq = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]];
    return seeds.map((s, i) => {
      let poly = sq;
      seeds.forEach((t, j) => {
        if (i === j) return;
        poly = clipPoly(poly, t[0] - s[0], t[1] - s[1], (t[0] * t[0] + t[1] * t[1] - s[0] * s[0] - s[1] * s[1]) / 2);
      });
      // 每條邊細分後套位移場
      const pts = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length];
        const m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
        for (let q = 0; q < m; q++) pts.push(warp(a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m));
      }
      return { pts, tone: rnd(), seed: s };
    });
  }
  const PLATES = makePlates();

  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createLinearGradient(TB[0] - 30, TB[1], TF[0] + 20, TF[1] + 10);
    g.addColorStop(0, '#8A5634');
    g.addColorStop(0.45, '#6A3C22');
    g.addColorStop(1, '#4B2716');
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    topPath(ctx); ctx.clip();

    // 糖殼的斑駁亮片
    const rnd = K.rng(77);
    for (let i = 0; i < 46; i++) {
      const u = (rnd() - 0.5) * 104, v = (rnd() - 0.5) * 104;
      const [x, y] = P(u, v, H);
      const lit = 1 - ((x - 30) / 150 + (y - 40) / 120) * 0.5;
      ctx.fillStyle = `rgba(${170 + rnd() * 30},${120 + rnd() * 20},${85},${0.12 + 0.2 * Math.max(0, lit)})`;
      ctx.beginPath(); ctx.ellipse(x, y, 4 + rnd() * 7, 2 + rnd() * 3.5, PHI * 0.3 + rnd() * 0.6, 0, TAU); ctx.fill();
    }

    // 一片片的糖殼：每片微微不同的亮度＋左上亮邊、右下暗邊（翹起的厚度）
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    PLATES.forEach(pl => {
      const scr = pl.pts.map(p => P(p[0], p[1], H));
      const path = () => { poly(ctx, scr); };
      ctx.save();
      path(); ctx.clip();
      ctx.fillStyle = pl.tone < 0.5 ? `rgba(40,16,6,${0.05 + pl.tone * 0.22})` : `rgba(200,140,100,${(pl.tone - 0.5) * 0.3})`;
      ctx.fillRect(0, 0, 200, 200);
      ctx.translate(1.3, 1.5);
      path(); ctx.strokeStyle = 'rgba(255,220,185,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.translate(-2.4, -2.6);
      path(); ctx.strokeStyle = 'rgba(25,8,2,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    });
    // 裂縫本身
    PLATES.forEach(pl => {
      poly(ctx, pl.pts.map(p => P(p[0], p[1], H)));
      ctx.strokeStyle = 'rgba(26,9,2,0.9)'; ctx.lineWidth = 0.9 + pl.tone * 0.5; ctx.stroke();
    });
    // 殼上細細的皺紋
    const rw = K.rng(404);
    ctx.strokeStyle = 'rgba(40,15,5,0.35)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 22; i++) {
      const u = (rw() - 0.5) * 100, v = (rw() - 0.5) * 100, a = rw() * TAU, l = 4 + rw() * 6;
      const p0 = P(u, v, H), p1 = P(u + Math.cos(a) * l, v + Math.sin(a) * l, H), pm = P(u + Math.cos(a + 0.5) * l * 0.5, v + Math.sin(a + 0.5) * l * 0.5, H);
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(pm[0], pm[1], p1[0], p1[1]); ctx.stroke();
    }

    // 大片光澤（左上）
    const gh = ctx.createRadialGradient(TB[0] - 8, TB[1] + 22, 2, TB[0] - 8, TB[1] + 22, 58);
    gh.addColorStop(0, 'rgba(255,230,205,0.42)');
    gh.addColorStop(0.5, 'rgba(255,220,190,0.14)');
    gh.addColorStop(1, 'rgba(255,220,190,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    // 細小反光點
    const rs = K.rng(91);
    for (let i = 0; i < 26; i++) {
      const u = (rnd() - 0.5) * 100, v = (rnd() - 0.5) * 100;
      const [x, y] = P(u, v, H);
      const a = Math.max(0, 0.75 - ((x - 20) / 160) * 0.6 - ((y - 40) / 90) * 0.35);
      ctx.fillStyle = `rgba(255,240,225,${a * (0.5 + rs() * 0.5)})`;
      ctx.beginPath(); ctx.ellipse(x, y, 1.2 + rs() * 1.6, 0.6 + rs() * 0.6, -0.2, 0, TAU); ctx.fill();
    }
    // 右前方逐漸變暗
    const gd = ctx.createLinearGradient(TL[0], TL[1], TR[0], TR[1] + 30);
    gd.addColorStop(0.5, 'rgba(30,12,4,0)');
    gd.addColorStop(1, 'rgba(30,12,4,0.3)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();

    // 頂面前緣的亮邊
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(205,150,110,0.75)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); E_LF.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 0.4) : ctx.moveTo(p[0] + 1, p[1] + 0.4)); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,105,70,0.6)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); E_FR.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + 0.4) : ctx.moveTo(p[0], p[1] + 0.4)); ctx.stroke();
  }

  function draw(ctx) {
    drawSides(ctx);
    drawTop(ctx);
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(30,12,4,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['brownie'] = {
    draw,
    crumbs: ['#3B1E12', '#6A3C22', '#8A5634', '#24110A', '#B48557'],
    crunchy: 0.35,
  };
})();
