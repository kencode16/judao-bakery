/* 巧克力豆餅乾（Chocolate chip cookie）
 * 斜上 45 度的一大片美式軟餅乾：邊緣烤得較深、中間金黃，表面有自然的裂紋和起伏，
 * 嵌著一顆顆半融的深色巧克力豆（有的融成亮面小池、有的還是水滴形）。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 96, RX = 82, RY = 52, TH = 11;

  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const nEdge = makeNoise(42, 2.4, [3, 5, 7, 11, 17]);
  const E = (th, k, z) => {
    const n = nEdge(th) * (k === undefined ? 1 : k);
    return [CX + Math.cos(th) * (RX + n), CY + Math.sin(th) * (RY + n * 0.63) - (z || 0)];
  };

  function topPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) { const p = E(TAU * i / 160); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }
  function silhouette(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const p = E(Math.PI + Math.PI * i / 80); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 0; i <= 80; i++) { const th = Math.PI * i / 80; const p = E(th, 0.9, -TH * (0.8 + 0.2 * Math.sin(th))); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* ---------- 側面（厚度） ---------- */
  function drawSide(ctx) {
    silhouette(ctx);
    const g = ctx.createLinearGradient(CX - RX, 0, CX + RX, 0);
    g.addColorStop(0, '#C98A42');
    g.addColorStop(0.4, '#B47432');
    g.addColorStop(1, '#8A5220');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    silhouette(ctx); ctx.clip();
    const rnd = K.rng(7);
    for (let i = 0; i < 120; i++) {
      const th = rnd() * Math.PI, z = rnd() * TH;
      const p = E(th, 0.95, -z);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(90,45,10,0.4)' : 'rgba(240,195,130,0.4)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.8 + rnd() * 1.4, 0.6 + rnd() * 0.8, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(CX - 12, CY - 8, 6, CX, CY, RX * 1.02);
    g.addColorStop(0, '#F0C37A');
    g.addColorStop(0.5, '#E2AB5E');
    g.addColorStop(0.82, '#C98A42');
    g.addColorStop(1, '#A86A2A');
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    topPath(ctx); ctx.clip();
    const rnd = K.rng(1938);
    // 表面起伏：小丘（左上亮、右下暗）
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.85;
      const x = CX + Math.cos(a) * r * RX, y = CY + Math.sin(a) * r * RY;
      const w = 9 + rnd() * 10, h = w * 0.6;
      const gg = ctx.createRadialGradient(x - w * 0.3, y - h * 0.4, 1, x, y, w);
      gg.addColorStop(0, 'rgba(255,225,160,0.4)');
      gg.addColorStop(0.6, 'rgba(255,225,160,0)');
      gg.addColorStop(0.85, 'rgba(120,60,15,0.12)');
      gg.addColorStop(1, 'rgba(120,60,15,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, TAU); ctx.fill();
    }
    // 裂紋
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 12; i++) {
      const a = rnd() * TAU, r = 0.25 + rnd() * 0.6;
      let x = CX + Math.cos(a) * r * RX, y = CY + Math.sin(a) * r * RY;
      let d = rnd() * TAU;
      const pts = [[x, y]];
      for (let k = 0; k < 5 + rnd() * 5; k++) {
        d += (rnd() - 0.5) * 1.2;
        x += Math.cos(d) * 3.6; y += Math.sin(d) * 2.4;
        pts.push([x, y]);
      }
      ctx.strokeStyle = 'rgba(255,228,170,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0] - 0.6, p[1] + 0.8) : ctx.moveTo(p[0] - 0.6, p[1] + 0.8)); ctx.stroke();
      ctx.strokeStyle = 'rgba(115,55,12,0.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    }
    // 細小顆粒（糖粒、麵團質地）
    for (let i = 0; i < 260; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd());
      const x = CX + Math.cos(a) * r * RX, y = CY + Math.sin(a) * r * RY;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(150,85,25,0.35)' : 'rgba(255,235,190,0.5)';
      ctx.fillRect(x, y, 0.8 + rnd() * 0.8, 0.6 + rnd() * 0.6);
    }
    // 外圈烤得較深
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(140,75,20,0.28)';
    ctx.beginPath(); for (let i = 0; i <= 160; i++) { const p = E(TAU * i / 160, 1, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
    // 右下陰影
    const gd = ctx.createLinearGradient(CX - RX, CY - RY, CX + RX, CY + RY);
    gd.addColorStop(0.55, 'rgba(90,40,5,0)');
    gd.addColorStop(1, 'rgba(90,40,5,0.25)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  /* ---------- 巧克力豆 ---------- */
  // 融成亮面小池
  function puddle(ctx, x, y, r, seed) {
    const rnd = K.rng(seed);
    const H = []; for (let k = 2; k <= 5; k++) H.push([k, rnd() * TAU, (0.4 + rnd() * 0.6) / k]);
    const path = (dx, dy, s) => {
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const a = TAU * i / 28;
        let d = 0; for (const h of H) d += h[2] * Math.sin(h[0] * a + h[1]);
        const rr = r * s * (1 + 0.45 * d);
        const px = x + dx + Math.cos(a) * rr * 1.25, py = y + dy + Math.sin(a) * rr * 0.75;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    };
    path(0.6, 1, 1.12); ctx.fillStyle = 'rgba(110,55,15,0.45)'; ctx.fill();     // 周圍被染深的麵團
    path(0, 0, 1);
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0.3, x, y, r * 1.3);
    g.addColorStop(0, '#6A3A20'); g.addColorStop(0.5, '#3E1F0E'); g.addColorStop(1, '#24100A');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(255,235,215,0.6)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.3, r * 0.45, r * 0.16, -0.2, 0, TAU); ctx.fill();
  }
  // 水滴形的完整巧克力豆
  function chip(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(100,50,15,0.45)';
    ctx.beginPath(); ctx.ellipse(1.2, s * 0.55, s * 1.05, s * 0.45, 0, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.35);
    ctx.quadraticCurveTo(-s * 0.9, -s * 0.5, 0, -s * 1.1);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.5, s, s * 0.35);
    ctx.quadraticCurveTo(0, s * 0.85, -s, s * 0.35);
    ctx.closePath();
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, '#6B3B1F'); g.addColorStop(0.45, '#3A1C0C'); g.addColorStop(1, '#1E0C05');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(255,230,205,0.55)';
    ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.3, s * 0.18, s * 0.42, 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawChips(ctx) {
    ctx.save();
    topPath(ctx); ctx.clip();
    const puddles = [[-44, -14, 8.5], [-8, -30, 7], [30, -18, 9.5], [52, 12, 7.5], [-22, 18, 10], [12, 30, 8], [-58, 14, 6]];
    puddles.forEach(([dx, dy, r], i) => puddle(ctx, CX + dx, CY + dy, r, 300 + i));
    const chips = [[-26, -8, 6.5, 0.2], [14, -2, 7.5, -0.3], [40, 30, 6, 0.4], [-4, 14, 5.5, 0.1], [62, -14, 5.5, -0.2], [-48, 32, 5.5, 0.3], [-30, -34, 5, -0.1], [30, 4, 4.5, 0.6]];
    chips.forEach(([dx, dy, s, r]) => chip(ctx, CX + dx, CY + dy, s, r));
    ctx.restore();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    drawChips(ctx);
    // 頂面前緣：頂面與側面交界的亮線
    ctx.strokeStyle = 'rgba(255,215,150,0.55)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) { const th = Math.PI * 0.35 + Math.PI * 0.6 * i / 50; const p = E(th, 1, -0.8); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(110,55,15,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }

  window.DESSERTS['cookie'] = {
    draw,
    crumbs: ['#E2AB5E', '#C98A42', '#3E1F0E', '#F0C37A', '#24100A'],
    crunchy: 0.85,
  };
})();
