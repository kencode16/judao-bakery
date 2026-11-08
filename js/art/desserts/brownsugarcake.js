/* 澎湖黑糖糕（brownsugarcake）
 * 深褐色、厚厚的方塊，頂面油亮、撒滿白芝麻；切開的側面是蓬鬆多孔的焦糖褐（Q 彈海綿感）。
 * 和布朗尼（裂紋硬殼、近黑）、提拉米蘇（可可粉＋分層）區分：重點是「白芝麻＋側面氣孔」。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 正投影 ---------- */
  const YAW = 27 * Math.PI / 180, C = Math.cos(YAW), S = Math.sin(YAW);
  const SP = 0.56, CP = 0.86;
  const W = 112, D = 104, H = 70;
  const CX = 100, CY = 132;
  const W2 = W / 2, D2 = D / 2, R = 10;
  const P = (x, y, z) => [CX + x * C - y * S, CY + (x * S + y * C) * SP - z * CP];
  const onTop = (ctx, z) => ctx.transform(C, S * SP, -S, C * SP, CX, CY - z * CP);
  const onFront = (ctx, y) => ctx.transform(C, S * SP, 0, CP, CX - y * S, CY + y * C * SP);
  const onRight = (ctx, x) => ctx.transform(-S, C * SP, 0, CP, CX + x * C, CY + x * S * SP);

  function rrect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function outline(n) {
    const pts = [];
    const arc = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + Math.PI / 2 * i / n; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } };
    arc(W2 - R, -D2 + R, -Math.PI / 2); arc(W2 - R, D2 - R, 0); arc(-W2 + R, D2 - R, Math.PI / 2); arc(-W2 + R, -D2 + R, Math.PI);
    return pts;
  }
  function hullOf(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const OUT = outline(6);
  const SIL = hullOf(OUT.flatMap(([x, y]) => [P(x, y, H), P(x * 0.99, y * 0.99, 0)]));
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }

  // 海綿氣孔：大小不一的橢圓孔（深色）＋孔下緣亮邊
  function pores(ctx, x0, w, seed, n) {
    const r = K.rng(seed);
    const holes = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + 3 + r() * (w - 6), y = -H + 5 + r() * (H - 9);
      const big = r() < 0.08;
      const rx = big ? 1.6 + r() * 1.2 : 0.55 + r() * 0.9;
      holes.push([x, y, rx, rx * (1.4 + r() * 0.9)]);
    }
    ctx.fillStyle = 'rgba(255,200,140,0.22)';
    ctx.beginPath();
    for (const [x, y, rx, ry] of holes) { ctx.moveTo(x + rx, y + 0.9); ctx.ellipse(x, y + 0.9, rx, ry, 0, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = 'rgba(56,24,8,0.62)';
    ctx.beginPath();
    for (const [x, y, rx, ry] of holes) { ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }
    ctx.fill();
  }

  /* ---------- 側面（切面） ---------- */
  function drawSides(ctx) {
    poly(ctx, SIL);
    const a = P(-W2, D2, 0)[0], m = P(W2, D2, 0)[0], b = P(W2, -D2, 0)[0];
    const cut = (m - a) / (b - a);
    const g = ctx.createLinearGradient(a, 0, b, 0);
    g.addColorStop(0, '#B07040');
    g.addColorStop(Math.max(0, cut - 0.08), '#9A5B30');
    g.addColorStop(Math.min(1, cut + 0.04), '#7E4622');
    g.addColorStop(1, '#623418');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, SIL); ctx.clip();
    ctx.save();
    onFront(ctx, D2);
    pores(ctx, -W2, W, 501, 230);
    // 上緣一圈深色油亮的頂皮
    ctx.fillStyle = 'rgba(60,26,8,0.55)';
    ctx.fillRect(-W2, -H, W, 4);
    const vg = ctx.createLinearGradient(0, -H, 0, 0);
    vg.addColorStop(0, 'rgba(255,210,150,0.18)');
    vg.addColorStop(0.5, 'rgba(255,210,150,0)');
    vg.addColorStop(1, 'rgba(50,20,6,0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(-W2, -H, W, H);
    ctx.restore();
    ctx.save();
    onRight(ctx, W2);
    pores(ctx, -D2, D, 602, 190);
    ctx.fillStyle = 'rgba(50,20,6,0.5)';
    ctx.fillRect(-D2, -H, D, 4);
    ctx.fillStyle = 'rgba(40,16,4,0.18)';
    ctx.fillRect(-D2, -H, D, H);
    ctx.restore();
    ctx.restore();
    // 轉角柔和的亮線（軟軟的圓角）
    const t = P(W2, D2, H), bt = P(W2, D2, 0);
    ctx.strokeStyle = 'rgba(190,120,70,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(t[0] - 1, t[1] + 4); ctx.lineTo(bt[0] - 1, bt[1] - 2); ctx.stroke();
  }

  /* ---------- 頂面：油亮深褐＋白芝麻 ---------- */
  function drawTop(ctx) {
    ctx.save();
    onTop(ctx, H);
    const path = () => { ctx.beginPath(); rrect(ctx, -W2, -D2, W, D, R); };
    path();
    const g = ctx.createRadialGradient(-26, -26, 4, 0, 0, 86);
    g.addColorStop(0, '#8A4824');
    g.addColorStop(0.5, '#5E2E12');
    g.addColorStop(1, '#42200B');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path(); ctx.clip();
    // 表面微微的起伏與小氣孔
    const r = K.rng(733);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(40,16,4,0.35)' : 'rgba(190,120,70,0.25)';
      ctx.beginPath(); ctx.arc(-W2 + r() * W, -D2 + r() * D, 0.7 + r() * 1.2, 0, TAU); ctx.fill();
    }
    // 油亮的反光帶
    ctx.save();
    ctx.rotate(-0.5);
    const sh = ctx.createLinearGradient(0, -30, 0, 10);
    sh.addColorStop(0, 'rgba(255,220,170,0)');
    sh.addColorStop(0.5, 'rgba(255,220,170,0.28)');
    sh.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(-80, -30, 160, 40);
    ctx.restore();
    // 白芝麻
    const seeds = [];
    for (let i = 0; i < 44; i++) seeds.push([-W2 + 8 + r() * (W - 16), -D2 + 8 + r() * (D - 16), r() * Math.PI]);
    for (const [x, y, a] of seeds) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a); ctx.scale(1.12, 1.12);
      ctx.fillStyle = 'rgba(30,12,2,0.45)';
      ctx.beginPath(); ctx.ellipse(1, 1.6, 4.8, 2.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFF4DE';
      ctx.beginPath(); ctx.moveTo(-4.8, 0); ctx.quadraticCurveTo(-1.4, -3.4, 4.6, -0.4); ctx.quadraticCurveTo(0.6, 3.2, -4.8, 0); ctx.fill();
      ctx.fillStyle = 'rgba(214,180,130,0.6)';
      ctx.beginPath(); ctx.ellipse(1.2, 0.9, 2.6, 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(-1, -0.9, 2, 0.8, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // 邊緣柔和的高光（軟圓角）
    ctx.strokeStyle = 'rgba(214,150,96,0.5)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-W2 + 2, D2 - 12); ctx.lineTo(-W2 + 2, -D2 + R); ctx.arcTo(-W2 + 2, -D2 + 2, -W2 + R, -D2 + 2, R - 2); ctx.lineTo(W2 - 14, -D2 + 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,26,8,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-W2 + 12, D2 - 1); ctx.lineTo(W2 - R, D2 - 1); ctx.arcTo(W2 - 1, D2 - 1, W2 - 1, D2 - R, R - 1); ctx.lineTo(W2 - 1, -D2 + 12); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    drawSides(ctx);
    drawTop(ctx);
    ctx.strokeStyle = 'rgba(48,20,6,0.65)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    poly(ctx, SIL);
    ctx.stroke();
  }

  window.DESSERTS['brownsugarcake'] = {
    draw,
    crumbs: ['#6E3918', '#8C4F2A', '#9E5E34', '#FBF0D8', '#4E250E'],
    crunchy: 0.15,
  };
})();
