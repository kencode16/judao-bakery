/* 澎湖花生酥（peanutcrisp）
 * 淺黃的小方塊、酥鬆粉粉的，邊緣有點碎；旁邊放兩顆花生仁，一眼就知道是花生做的。
 * 和鳳梨酥（金黃厚塊、橘色內餡）、鹹餅（薄片、齒紋邊）區分：淺黃、方正、霧面沙沙的顆粒感。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 正投影 ---------- */
  const YAW = 28 * Math.PI / 180, C = Math.cos(YAW), S = Math.sin(YAW);
  const SP = 0.58, CP = 0.86;
  const W = 110, D = 106, H = 48;
  const CX = 110, CY = 118;
  const W2 = W / 2, D2 = D / 2;
  const P = (x, y, z) => [CX + x * C - y * S, CY + (x * S + y * C) * SP - z * CP];
  const onTop = (ctx, z) => ctx.transform(C, S * SP, -S, C * SP, CX, CY - z * CP);
  const onFront = (ctx, y) => ctx.transform(C, S * SP, 0, CP, CX - y * S, CY + y * C * SP);
  const onRight = (ctx, x) => ctx.transform(-S, C * SP, 0, CP, CX + x * C, CY + x * S * SP);

  // 碎碎的邊：沿頂面外框加一點不規則
  const jr = K.rng(808);
  const JIT = []; for (let i = 0; i < 64; i++) JIT.push((jr() - 0.5) * 2.4);
  function topOutline() {
    const pts = [], R = 7;
    const corners = [[W2 - R, -D2 + R, -Math.PI / 2], [W2 - R, D2 - R, 0], [-W2 + R, D2 - R, Math.PI / 2], [-W2 + R, -D2 + R, Math.PI]];
    let k = 0;
    corners.forEach(([cx, cy, a0], ci) => {
      for (let i = 0; i <= 4; i++) { const a = a0 + Math.PI / 2 * i / 4; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
      const nx = corners[(ci + 1) % 4];
      // 邊上加幾個碎點
      const ex = Math.cos(a0 + Math.PI / 2), ey = Math.sin(a0 + Math.PI / 2);
      const sx = cx + Math.cos(a0 + Math.PI / 2) * R, sy = cy + Math.sin(a0 + Math.PI / 2) * R;
      const tx = nx[0] + Math.cos(nx[2]) * R, ty = nx[1] + Math.sin(nx[2]) * R;
      for (let i = 1; i < 12; i++) {
        const t = i / 12, j = JIT[k++ % 64];
        pts.push([sx + (tx - sx) * t + ex * j, sy + (ty - sy) * t + ey * j]);
      }
    });
    return pts;
  }
  const TOP = topOutline();
  function hullOf(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  // 外輪廓：底邊再加一點起伏（碎鬆的下緣）
  const SIL = (() => {
    const pts = [];
    TOP.forEach(([x, y], i) => { pts.push(P(x, y, H)); pts.push(P(x * 0.985, y * 0.985, 0)); });
    return hullOf(pts);
  })();

  // 沙沙的顆粒（在目前座標系裡、給定範圍）：同色的點合成一條路徑一次填，比較快
  function grain(ctx, x0, y0, w, h, n, seed, dk) {
    const r = K.rng(seed);
    const groups = [[], [], []];
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, t = r(), rad = 0.6 + r() * 1.0;
      groups[t < 0.45 ? 0 : t < 0.8 ? 1 : 2].push([x, y, rad]);
    }
    const cols = [`rgba(178,128,58,${0.3 * dk})`, 'rgba(255,250,228,0.6)', `rgba(214,160,84,${0.45 * dk})`];
    groups.forEach((g, gi) => {
      ctx.fillStyle = cols[gi];
      ctx.beginPath();
      for (const [x, y, rad] of g) { ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, TAU); }
      ctx.fill();
    });
  }
  // 花生碎粒：不規則小塊
  function nibs(ctx, x0, y0, w, h, n, seed) {
    const r = K.rng(seed);
    const sh = [], bodyA = [], bodyB = [], hl = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, s = 1.6 + r() * 2.6, a = r() * TAU;
      const ca = Math.cos(a), sa = Math.sin(a);
      const pts = [[-1, -0.2], [-0.2, -0.75], [0.9, -0.35], [0.7, 0.55], [-0.5, 0.6]].map(([u, v]) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s]);
      sh.push(pts.map(([px, py]) => [px + 0.6, py + 0.7]));
      (r() < 0.5 ? bodyA : bodyB).push(pts);
      hl.push([x - s * 0.2, y - s * 0.25, s * 0.35]);
    }
    const fillPolys = (list, col) => { ctx.fillStyle = col; ctx.beginPath(); for (const p of list) { p.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); } ctx.fill(); };
    fillPolys(sh, 'rgba(170,112,44,0.32)');
    fillPolys(bodyA, '#DDA95E');
    fillPolys(bodyB, '#E9BE76');
    ctx.fillStyle = 'rgba(255,244,214,0.7)';
    ctx.beginPath();
    for (const [hx, hy, hr] of hl) { ctx.moveTo(hx + hr, hy); ctx.arc(hx, hy, hr, 0, TAU); }
    ctx.fill();
  }

  /* ---------- 側面 ---------- */
  function drawSides(ctx) {
    poly(ctx, SIL);
    const a = P(-W2, D2, 0)[0], m = P(W2, D2, 0)[0], b = P(W2, -D2, 0)[0];
    const g = ctx.createLinearGradient(a, 0, b, 0);
    const cut = (m - a) / (b - a);
    g.addColorStop(0, '#F4DDA0');
    g.addColorStop(Math.max(0, cut - 0.06), '#EACB86');
    g.addColorStop(Math.min(1, cut + 0.04), '#D8B06A');
    g.addColorStop(1, '#BF9450');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, SIL); ctx.clip();
    // 正面：壓製的層次細紋＋顆粒
    ctx.save();
    onFront(ctx, D2);
    for (let i = 1; i < 5; i++) {
      const v = -H + i * H / 5;
      const r = K.rng(60 + i);
      ctx.strokeStyle = 'rgba(176,124,56,0.22)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let x = -W2; x <= W2; x += 6) { const y = v + (r() - 0.5) * 1.6; x === -W2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    grain(ctx, -W2, -H, W, H, 170, 1301, 1);
    nibs(ctx, -W2 + 4, -H + 6, W - 8, H - 12, 16, 1402);
    const vg = ctx.createLinearGradient(0, -H, 0, 0);
    vg.addColorStop(0, 'rgba(255,246,220,0.35)');
    vg.addColorStop(0.5, 'rgba(255,246,220,0)');
    vg.addColorStop(1, 'rgba(170,116,48,0.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(-W2, -H, W, H);
    ctx.restore();
    // 右面
    ctx.save();
    onRight(ctx, W2);
    for (let i = 1; i < 5; i++) {
      const v = -H + i * H / 5;
      const r = K.rng(80 + i);
      ctx.strokeStyle = 'rgba(150,100,40,0.22)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let y = -D2; y <= D2; y += 6) { const yy = v + (r() - 0.5) * 1.6; y === -D2 ? ctx.moveTo(y, yy) : ctx.lineTo(y, yy); }
      ctx.stroke();
    }
    grain(ctx, -D2, -H, D, H, 150, 1501, 1.1);
    nibs(ctx, -D2 + 4, -H + 6, D - 8, H - 12, 13, 1602);
    const vg2 = ctx.createLinearGradient(0, -H, 0, 0);
    vg2.addColorStop(0, 'rgba(255,240,200,0.15)');
    vg2.addColorStop(1, 'rgba(140,92,36,0.3)');
    ctx.fillStyle = vg2;
    ctx.fillRect(-D2, -H, D, H);
    ctx.restore();
    ctx.restore();
    // 轉角
    const t = P(W2, D2, H), bt = P(W2, D2, 0);
    ctx.strokeStyle = 'rgba(176,124,60,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(t[0], t[1] + 2); ctx.lineTo(bt[0], bt[1] - 1); ctx.stroke();
  }

  /* ---------- 頂面 ---------- */
  function topPath(ctx) { ctx.beginPath(); TOP.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
  function drawTop(ctx) {
    ctx.save();
    onTop(ctx, H);
    topPath(ctx);
    const g = ctx.createRadialGradient(-30, -30, 6, -6, -6, 90);
    g.addColorStop(0, '#FFF0C4');
    g.addColorStop(0.5, '#F6DE9E');
    g.addColorStop(1, '#E6C27A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    grain(ctx, -W2, -D2, W, D, 260, 1701, 1);
    nibs(ctx, -W2 + 5, -D2 + 5, W - 10, D - 10, 30, 1802);
    // 碎鬆的邊：外圈略深、帶一點掉屑的缺口
    ctx.strokeStyle = 'rgba(196,146,72,0.4)';
    ctx.lineWidth = 4;
    topPath(ctx); ctx.stroke();
    ctx.restore();
    // 左上、後緣高光
    ctx.strokeStyle = 'rgba(255,250,232,0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-W2 + 2.5, D2 - 10); ctx.lineTo(-W2 + 2.5, -D2 + 8); ctx.quadraticCurveTo(-W2 + 2.5, -D2 + 2.5, -W2 + 8, -D2 + 2.5); ctx.lineTo(W2 - 10, -D2 + 2.5); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 花生仁 ---------- */
  function peanut(ctx, x, y, len, wid, rot, split) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const a = len / 2, b = wid / 2;
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-a, 0);
      ctx.bezierCurveTo(-a, -b * 1.1, a * 0.2, -b * 1.15, a * 0.85, -b * 0.7);
      ctx.quadraticCurveTo(a * 1.08, -b * 0.2, a, b * 0.15);
      ctx.bezierCurveTo(a * 0.85, b * 1.0, -a * 0.3, b * 1.15, -a * 0.85, b * 0.7);
      ctx.quadraticCurveTo(-a * 1.02, b * 0.4, -a, 0);
      ctx.closePath();
    };
    // 底下的陰影
    ctx.fillStyle = 'rgba(120,70,30,0.28)';
    ctx.save(); ctx.translate(1.5, 2.5); body(); ctx.fill(); ctx.restore();
    body();
    const g = ctx.createRadialGradient(-a * 0.35, -b * 0.45, 1, 0, 0, a * 1.1);
    if (split) {
      g.addColorStop(0, '#FFF2CF'); g.addColorStop(0.6, '#F2D598'); g.addColorStop(1, '#D9AE66');
    } else {
      g.addColorStop(0, '#F9E2B4'); g.addColorStop(0.55, '#E7BF7E'); g.addColorStop(1, '#C48E4A');
    }
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    body(); ctx.clip();
    if (split) {
      // 對半的平面：中間的胚芽、邊緣一圈
      ctx.strokeStyle = 'rgba(196,140,66,0.6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, a * 0.82, b * 0.72, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#E2B06A';
      ctx.beginPath(); ctx.ellipse(-a * 0.68, 0, a * 0.16, b * 0.22, 0, 0, TAU); ctx.fill();
    } else {
      // 兩瓣之間的細縫、殘留的一點紅色薄膜
      ctx.strokeStyle = 'rgba(168,110,48,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-a * 0.9, b * 0.15); ctx.quadraticCurveTo(0, b * 0.35, a * 0.92, b * 0.05); ctx.stroke();
      ctx.fillStyle = 'rgba(176,86,52,0.55)';
      ctx.beginPath(); ctx.ellipse(a * 0.35, b * 0.55, a * 0.3, b * 0.28, 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(158,70,42,0.4)';
      ctx.beginPath(); ctx.ellipse(-a * 0.6, -b * 0.5, a * 0.14, b * 0.18, 0, 0, TAU); ctx.fill();
    }
    // 高光
    ctx.fillStyle = 'rgba(255,252,236,0.75)';
    ctx.beginPath(); ctx.ellipse(-a * 0.25, -b * 0.5, a * 0.42, b * 0.2, -0.1, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,96,40,0.6)'; ctx.lineWidth = 1.2;
    body(); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 帶殼花生（葫蘆形、網紋） ---------- */
  function shellPeanut(ctx, x, y, len, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const L = len / 2;
    // 兩個鼓起的節＋中間的腰
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-L, 0);
      ctx.bezierCurveTo(-L, -L * 0.5, -L * 0.2, -L * 0.52, -L * 0.04, -L * 0.33);
      ctx.bezierCurveTo(L * 0.08, -L * 0.24, L * 0.16, -L * 0.24, L * 0.26, -L * 0.36);
      ctx.bezierCurveTo(L * 0.5, -L * 0.6, L * 1.02, -L * 0.42, L, 0);
      ctx.bezierCurveTo(L * 0.98, L * 0.42, L * 0.5, L * 0.58, L * 0.26, L * 0.36);
      ctx.bezierCurveTo(L * 0.16, L * 0.26, L * 0.08, L * 0.26, -L * 0.04, L * 0.35);
      ctx.bezierCurveTo(-L * 0.2, L * 0.54, -L, L * 0.5, -L, 0);
      ctx.closePath();
    };
    ctx.fillStyle = 'rgba(110,64,26,0.3)';
    ctx.save(); ctx.translate(2, 3.5); path(); ctx.fill(); ctx.restore();
    path();
    const g = ctx.createLinearGradient(0, -L * 0.55, 0, L * 0.55);
    g.addColorStop(0, '#F3D7A2');
    g.addColorStop(0.45, '#E2B677');
    g.addColorStop(1, '#BF8746');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path(); ctx.clip();
    // 網紋：縱向的稜線＋橫向的小格
    ctx.lineCap = 'round';
    for (let k = -3; k <= 3; k++) {
      ctx.strokeStyle = 'rgba(150,96,40,0.5)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const u = -L + 2 * L * i / 24;
        const wdt = Math.abs(u) < L * 0.2 ? 0.27 + Math.abs(u) / L * 0.2 : 0.45 - Math.max(0, Math.abs(u - (u > 0 ? L * 0.6 : -L * 0.58)) / L) * 0.5;
        const v = k / 3.6 * L * Math.max(0.2, wdt);
        i ? ctx.lineTo(u, v) : ctx.moveTo(u, v);
      }
      ctx.stroke();
    }
    const r = K.rng(515);
    ctx.strokeStyle = 'rgba(150,96,40,0.38)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 26; i++) {
      const u = -L * 0.9 + r() * L * 1.8, v = (r() - 0.5) * L * 0.7;
      ctx.beginPath(); ctx.moveTo(u, v); ctx.lineTo(u + 2 + r() * 2, v + (r() - 0.5) * 2); ctx.stroke();
    }
    // 腰部陰影、兩節的高光
    ctx.fillStyle = 'rgba(150,96,40,0.25)';
    ctx.beginPath(); ctx.ellipse(L * 0.11, 0, L * 0.12, L * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,248,226,0.55)';
    ctx.beginPath(); ctx.ellipse(-L * 0.55, -L * 0.22, L * 0.28, L * 0.1, -0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(L * 0.6, -L * 0.24, L * 0.24, L * 0.09, 0.1, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(132,82,32,0.75)';
    ctx.lineWidth = 1.5;
    path(); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    drawSides(ctx);
    drawTop(ctx);
    ctx.strokeStyle = 'rgba(150,104,44,0.62)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    poly(ctx, SIL);
    ctx.stroke();
    // 掉在旁邊的碎屑
    const r = K.rng(999);
    for (let i = 0; i < 7; i++) {
      const x = 54 + r() * 40, y = 158 + r() * 10, s = 1.2 + r() * 2;
      ctx.fillStyle = 'rgba(120,80,40,0.25)';
      ctx.beginPath(); ctx.ellipse(x + 0.5, y + 0.8, s, s * 0.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = r() < 0.5 ? '#F2D89C' : '#E6C27E';
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.7, r() * 3, 0, TAU); ctx.fill();
    }
    shellPeanut(ctx, 58, 150, 66, -0.42);
    peanut(ctx, 98, 164, 28, 17, 0.15, false);
  }

  window.DESSERTS['peanutcrisp'] = {
    draw,
    crumbs: ['#F6DE9E', '#FFF0C4', '#E6C27A', '#E7BE76', '#C48E4A'],
    crunchy: 0.5,
  };
})();
