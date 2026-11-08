/* 鳳梨酥（pineapplecake）
 * 厚實金黃的長方塊、邊角方正。斜上 45 度、稍微轉向：看得到烤得金褐的頂面、右側面，
 * 正面是切開的斷面：奶油色酥皮包著琥珀色、帶纖維的鳳梨餡（小圖一眼就認得）。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 正投影：轉 YAW 度、俯視 ---------- */
  const YAW = 21 * Math.PI / 180, C = Math.cos(YAW), S = Math.sin(YAW);
  const SP = 0.56, CP = 0.86;         // 深度壓扁、高度比例
  const W = 128, D = 96, H = 64;      // 長、寬、高
  const CX = 100, CY = 127;           // 底面中心
  const P = (x, y, z) => [CX + x * C - y * S, CY + (x * S + y * C) * SP - z * CP];
  const onTop = (ctx, z) => ctx.transform(C, S * SP, -S, C * SP, CX, CY - z * CP);           // 局部 (x, y)
  const onFront = (ctx, y) => ctx.transform(C, S * SP, 0, CP, CX - y * S, CY + y * C * SP);  // 局部 (x, v=-z)
  const onRight = (ctx, x) => ctx.transform(-S, C * SP, 0, CP, CX + x * C, CY + x * S * SP); // 局部 (y, v=-z)

  const W2 = W / 2, D2 = D / 2, R = 9;   // 後方兩角的圓角

  // 頂面輪廓（局部座標，前緣是切面所以是直角）
  function topOutline(n) {
    const pts = [];
    const arc = (cx, cy, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } };
    pts.push([-W2, D2]);
    arc(-W2 + R, -D2 + R, Math.PI, Math.PI * 1.5);
    arc(W2 - R, -D2 + R, Math.PI * 1.5, TAU);
    pts.push([W2, D2]);
    return pts;
  }
  // 外輪廓：頂面與底面輪廓的凸包
  function hull() {
    const pts = [];
    for (const [x, y] of topOutline(8)) { pts.push(P(x, y, H)); pts.push(P(x, y, 0)); }
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const HULL = hull();
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }

  /* ---------- 右側面（模具烤出來的淡金色） ---------- */
  function drawSides(ctx) {
    poly(ctx, HULL);
    const a = P(W2, D2, 0)[0], b = P(W2, -D2, 0)[0];
    const g = ctx.createLinearGradient(a, 0, b, 0);
    g.addColorStop(0, '#E9B456');
    g.addColorStop(0.5, '#D99A3E');
    g.addColorStop(1, '#B9772A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.save();
    onRight(ctx, W2);
    // 往下越烤越深
    const v = ctx.createLinearGradient(0, -H, 0, 0);
    v.addColorStop(0, 'rgba(255,226,150,0.35)');
    v.addColorStop(0.45, 'rgba(255,226,150,0)');
    v.addColorStop(1, 'rgba(140,70,16,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(-D2 - 10, -H - 2, D + 20, H + 4);
    // 模具壓出的細直紋與烤色斑點
    const rnd = K.rng(1201);
    for (let i = 0; i < 8; i++) {
      const y = -D2 + 4 + rnd() * (D - 8);
      ctx.strokeStyle = `rgba(150,82,22,${0.05 + rnd() * 0.07})`;
      ctx.lineWidth = 0.8 + rnd() * 1.2;
      ctx.beginPath(); ctx.moveTo(y, -H + 3 + rnd() * 6); ctx.lineTo(y + (rnd() - 0.5) * 2, -3 - rnd() * 8); ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,232,170,0.35)' : 'rgba(140,72,18,0.22)';
      ctx.beginPath(); ctx.arc(-D2 + rnd() * D, -H + rnd() * H, 0.6 + rnd() * 1.3, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  /* ---------- 正面切面：酥皮外框＋鳳梨餡 ---------- */
  const T_TOP = 9, T_SIDE = 9, T_BOT = 8;
  function fillingPath(ctx, rnd) {
    // 內緣稍微不規則（酥皮與餡交界）
    const x0 = -W2 + T_SIDE, x1 = W2 - T_SIDE, y0 = -H + T_TOP, y1 = -T_BOT;
    const r = K.rng(77);
    ctx.beginPath();
    const N = 16;
    for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; const y = y0 + (i && i < N ? (r() - 0.5) * 2.2 : 2); i ? ctx.lineTo(x, y) : ctx.moveTo(x + 2, y); }
    for (let i = 1; i <= 5; i++) ctx.lineTo(x1 + (i < 5 ? (r() - 0.5) * 2 : -2), y0 + (y1 - y0) * i / 5);
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(x0 + (x1 - x0) * i / N, y1 + (i ? (r() - 0.5) * 1.8 : -2));
    for (let i = 4; i >= 1; i--) ctx.lineTo(x0 + (r() - 0.5) * 2, y0 + (y1 - y0) * i / 5);
    ctx.closePath();
  }
  function drawCut(ctx) {
    ctx.save();
    onFront(ctx, D2);
    // 酥皮斷面
    ctx.beginPath(); ctx.rect(-W2, -H, W, H);
    const g = ctx.createLinearGradient(-W2, -H, W2 * 0.6, 0);
    g.addColorStop(0, '#FFF0C2');
    g.addColorStop(0.5, '#F8DE9A');
    g.addColorStop(1, '#ECC676');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.rect(-W2, -H, W, H); ctx.clip();
    // 酥鬆的顆粒感
    const rnd = K.rng(905);
    for (let i = 0; i < 150; i++) {
      const x = -W2 + rnd() * W, y = -H + rnd() * H;
      ctx.fillStyle = rnd() < 0.55 ? `rgba(196,138,52,${0.18 + rnd() * 0.2})` : 'rgba(255,250,228,0.55)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.7 + rnd() * 1.1, 0.5 + rnd() * 0.8, rnd() * 3, 0, TAU); ctx.fill();
    }
    // 上緣金褐烤皮、下緣烤色
    ctx.fillStyle = 'rgba(190,112,34,0.55)';
    ctx.fillRect(-W2, -H, W, 2.6);
    const gb = ctx.createLinearGradient(0, -4, 0, 0);
    gb.addColorStop(0, 'rgba(176,100,30,0)');
    gb.addColorStop(1, 'rgba(176,100,30,0.55)');
    ctx.fillStyle = gb;
    ctx.fillRect(-W2, -4, W, 4);
    // 右緣（接右側面的轉角）稍暗
    const gr = ctx.createLinearGradient(W2 - 8, 0, W2, 0);
    gr.addColorStop(0, 'rgba(176,110,40,0)');
    gr.addColorStop(1, 'rgba(176,110,40,0.3)');
    ctx.fillStyle = gr;
    ctx.fillRect(W2 - 8, -H, 8, H);
    ctx.restore();

    // 鳳梨餡
    fillingPath(ctx);
    const f = ctx.createRadialGradient(-30, -36, 4, -6, -26, 78);
    f.addColorStop(0, '#FFC24A');
    f.addColorStop(0.35, '#F09520');
    f.addColorStop(0.75, '#CF6C14');
    f.addColorStop(1, '#A44C0C');
    ctx.fillStyle = f;
    ctx.fill();
    ctx.save();
    fillingPath(ctx);
    ctx.clip();
    // 鳳梨纖維：細細彎彎的絲
    const rf = K.rng(4242);
    ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const x = -W2 + 8 + rf() * (W - 16), y = -H + T_TOP + rf() * (H - T_TOP - T_BOT);
      const len = 4 + rf() * 7, ang = (rf() - 0.5) * 1.2;
      const dark = rf() < 0.55;
      ctx.strokeStyle = dark ? `rgba(140,62,8,${0.16 + rf() * 0.2})` : `rgba(255,214,120,${0.25 + rf() * 0.3})`;
      ctx.lineWidth = dark ? 0.8 + rf() * 0.6 : 0.6 + rf() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 + (rf() - 0.5) * 4, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    // 果肉小塊
    for (let i = 0; i < 14; i++) {
      const x = -W2 + 14 + rf() * (W - 28), y = -H + T_TOP + 3 + rf() * (H - T_TOP - T_BOT - 6);
      ctx.fillStyle = `rgba(250,196,80,${0.35 + rf() * 0.3})`;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + rf() * 2.5, 1.2 + rf() * 1.4, rf() * 3, 0, TAU); ctx.fill();
    }
    // 黏稠光澤（左上反光）
    ctx.strokeStyle = 'rgba(255,240,190,0.55)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-W2 + 18, -H + T_TOP + 6); ctx.quadraticCurveTo(-20, -H + T_TOP + 3, 4, -H + T_TOP + 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,190,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-W2 + 16, -H + T_TOP + 12); ctx.lineTo(-W2 + 30, -H + T_TOP + 11); ctx.stroke();
    // 內緣陰影（酥皮蓋住餡）
    ctx.strokeStyle = 'rgba(120,55,8,0.35)';
    ctx.lineWidth = 3;
    fillingPath(ctx);
    ctx.stroke();
    ctx.restore();
    // 交界細線
    ctx.strokeStyle = 'rgba(150,80,20,0.4)';
    ctx.lineWidth = 0.9;
    fillingPath(ctx);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面：金褐烤色 ---------- */
  function topPath(ctx) {
    const pts = topOutline(8).map(([x, y]) => P(x, y, H));
    poly(ctx, pts);
  }
  function drawTop(ctx) {
    topPath(ctx);
    const a = P(-W2, -D2, H), b = P(W2, D2, H);
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, '#F2C266');
    g.addColorStop(0.45, '#E3A444');
    g.addColorStop(1, '#C98330');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx);
    ctx.clip();
    ctx.save();
    onTop(ctx, H);
    // 邊緣烤得較深（外圈一圈暖褐）
    ctx.strokeStyle = 'rgba(165,88,22,0.38)';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.rect(-W2, -D2, W, D + 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,76,18,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(-W2 + 2, -D2 + 2, W - 4, D + 8); ctx.stroke();
    // 中央較亮、微微隆起
    const c = ctx.createRadialGradient(-16, -10, 4, -6, -4, 60);
    c.addColorStop(0, 'rgba(255,226,140,0.55)');
    c.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = c;
    ctx.fillRect(-W2, -D2, W, D);
    // 烤色斑駁
    const rnd = K.rng(321);
    for (let i = 0; i < 40; i++) {
      const x = -W2 + rnd() * W, y = -D2 + rnd() * D;
      const edge = Math.min(W2 - Math.abs(x), D2 - Math.abs(y)) < 14;
      ctx.fillStyle = `rgba(${150 + rnd() * 30 | 0},${74 + rnd() * 20 | 0},18,${(edge ? 0.12 : 0.05) + rnd() * 0.07})`;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + rnd() * 4, 1.5 + rnd() * 2.5, rnd() * 3, 0, TAU); ctx.fill();
    }
    // 細孔
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(140,70,16,0.32)' : 'rgba(255,238,190,0.5)';
      ctx.beginPath(); ctx.arc(-W2 + 4 + rnd() * (W - 8), -D2 + 4 + rnd() * (D - 8), 0.5 + rnd() * 0.7, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    // 切口前緣：一道亮線
    const f0 = P(-W2, D2, H), f1 = P(W2, D2, H);
    ctx.strokeStyle = 'rgba(255,236,180,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(f0[0] + 1, f0[1]); ctx.lineTo(f1[0] - 1, f1[1]); ctx.stroke();
    // 後緣左上高光
    ctx.save();
    onTop(ctx, H);
    ctx.strokeStyle = 'rgba(255,242,200,0.7)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-W2 + 3, D2 - 12);
    ctx.lineTo(-W2 + 3, -D2 + R);
    ctx.quadraticCurveTo(-W2 + 3, -D2 + 3, -W2 + R, -D2 + 3);
    ctx.lineTo(10, -D2 + 3);
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    drawSides(ctx);
    drawCut(ctx);
    drawTop(ctx);
    // 右側面與正面的轉角線
    const a = P(W2, D2, H), b = P(W2, D2, 0);
    ctx.strokeStyle = 'rgba(150,84,26,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    // 外輪廓細線
    ctx.strokeStyle = 'rgba(118,58,14,0.72)';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    poly(ctx, HULL);
    ctx.stroke();
  }

  window.DESSERTS['pineapplecake'] = {
    draw,
    crumbs: ['#E3A444', '#F8DE9A', '#D9862A', '#FFF0C2', '#B86A1E'],
    crunchy: 0.55,
  };
})();
