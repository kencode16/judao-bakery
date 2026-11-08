/* 日式布丁（プリン）
 * 倒扣出來的卡士達布丁：上窄下寬的圓台、蛋黃色；頂面一層深琥珀色焦糖，沿著側面往下流；
 * 頂上一小球鮮奶油和一顆紅櫻桃（喫茶店經典款）。光源左上。
 * 和義式奶酪（白色）、烤布蕾（淺皿）的分別：黃色圓台＋深色焦糖頂＋紅櫻桃。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, YB = 138;                 // 底部圓心（螢幕）
  const SP = 0.55, CP = 0.835;
  const RB = 69, RT = 47, HH = 74;          // 底半徑、頂半徑、高度
  const YT = YB - HH * CP;                  // 頂面圓心

  function rAt(z) {
    let r = RT + (RB - RT) * Math.pow(1 - z / HH, 1.2);
    if (z < 5) r += 2.2 * (1 - z / 5);      // 底部微微攤開
    if (z > HH - 4) r -= 2.5 * Math.pow((z - (HH - 4)) / 4, 2);  // 頂邊圓角
    return r;
  }
  const P = (r, a, z) => [CX + r * Math.cos(a), YB - z * CP + r * Math.sin(a) * SP];

  function envelope(z0, z1, n) {
    let mx = 0; for (let i = 0; i <= n; i++) mx = Math.max(mx, rAt(z0 + (z1 - z0) * i / n));
    const top = [], bot = [], N = 90;
    for (let i = 0; i <= N; i++) {
      const x = mx * Math.cos(Math.PI * (1 - i / N)) * 0.9999;
      let yt = Infinity, yb = -Infinity;
      for (let j = 0; j <= n; j++) {
        const z = z0 + (z1 - z0) * j / n, r = rAt(z);
        if (r < Math.abs(x)) continue;
        const h = SP * Math.sqrt(r * r - x * x), yc = YB - z * CP;
        yt = Math.min(yt, yc - h); yb = Math.max(yb, yc + h);
      }
      if (yt !== Infinity) { top.push([CX + x, yt]); bot.push([CX + x, yb]); }
    }
    return { top, bot };
  }
  function envPath(ctx, e) {
    ctx.beginPath();
    e.top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    for (let i = e.bot.length - 1; i >= 0; i--) ctx.lineTo(e.bot[i][0], e.bot[i][1]);
    ctx.closePath();
  }
  const BODY = envelope(0, HH, 40);
  const TOPR = rAt(HH);

  /* ---------- 布丁本體 ---------- */
  function drawBody(ctx) {
    envPath(ctx, BODY);
    const g = ctx.createLinearGradient(CX - RB, 0, CX + RB, 0);
    g.addColorStop(0, '#F2C653');
    g.addColorStop(0.18, '#FCE08A');
    g.addColorStop(0.32, '#F9D66C');
    g.addColorStop(0.7, '#EDB843');
    g.addColorStop(1, '#C98E25');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    envPath(ctx, BODY); ctx.clip();
    // 底部稍暗、上方被焦糖染成橘黃
    const gv = ctx.createLinearGradient(0, YT, 0, YB + RB * SP);
    gv.addColorStop(0, 'rgba(225,140,40,0.35)');
    gv.addColorStop(0.3, 'rgba(225,140,40,0)');
    gv.addColorStop(0.8, 'rgba(160,100,20,0)');
    gv.addColorStop(1, 'rgba(160,100,20,0.3)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, 200, 200);
    // 滑嫩的縱向光澤
    const gl = ctx.createLinearGradient(CX - RB * 0.75, 0, CX - RB * 0.35, 0);
    gl.addColorStop(0, 'rgba(255,255,240,0)');
    gl.addColorStop(0.5, 'rgba(255,255,240,0.6)');
    gl.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.moveTo(CX - RT * 0.72, YT + 6); ctx.lineTo(CX - RT * 0.4, YT + 6);
    ctx.lineTo(CX - RB * 0.42, YB + 12); ctx.lineTo(CX - RB * 0.8, YB + 8);
    ctx.closePath(); ctx.fill();
    // 細小的氣孔
    const rnd = K.rng(17);
    for (let i = 0; i < 40; i++) {
      const a = 0.25 + rnd() * (Math.PI - 0.5), z = 4 + rnd() * (HH - 14);
      const p = P(rAt(z) - 0.5, a, z);
      ctx.fillStyle = 'rgba(200,140,40,0.35)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.9 * Math.sin(a) + 0.3, 0.7, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    envPath(ctx, BODY);
    ctx.strokeStyle = 'rgba(165,105,25,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  }

  /* ---------- 焦糖：頂面＋往下流的糖漿 ---------- */
  const DRIPS = [
    { a: 0.32, w: 0.13, len: 26 }, { a: 0.62, w: 0.1, len: 44 }, { a: 0.95, w: 0.16, len: 18 },
    { a: 1.3, w: 0.12, len: 52 }, { a: 1.62, w: 0.1, len: 30 }, { a: 1.95, w: 0.15, len: 46 },
    { a: 2.3, w: 0.11, len: 22 }, { a: 2.62, w: 0.13, len: 38 }, { a: 2.9, w: 0.09, len: 16 },
  ];
  function dripPath(ctx, d) {
    ctx.beginPath();
    const N = 12, z0 = HH + 1, z1 = HH - d.len;
    for (let i = 0; i <= N; i++) {        // 左邊往下
      const t = i / N, z = z0 + (z1 - z0) * t;
      const ww = d.w * (1 - 0.25 * t);
      const p = P(rAt(Math.max(0, z)) + 0.6, d.a - ww, z);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    // 圓圓的底端
    const zEnd = z1, rr = rAt(Math.max(0, zEnd)) + 0.6;
    const pL = P(rr, d.a - d.w * 0.75, zEnd), pR = P(rr, d.a + d.w * 0.75, zEnd);
    const pC = P(rr, d.a, zEnd - 0.75 * d.w * rr * 0.9);
    ctx.bezierCurveTo(pL[0], pL[1] + 4, pC[0] - (pR[0] - pL[0]) * 0.3, pC[1], pC[0], pC[1]);
    ctx.bezierCurveTo(pC[0] + (pR[0] - pL[0]) * 0.3, pC[1], pR[0], pR[1] + 4, pR[0], pR[1]);
    for (let i = N; i >= 0; i--) {        // 右邊往上
      const t = i / N, z = z0 + (z1 - z0) * t;
      const ww = d.w * (1 - 0.25 * t);
      const p = P(rAt(Math.max(0, z)) + 0.6, d.a + ww, z);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function drawCaramel(ctx) {
    // 側面頂端一圈（焦糖包住頂邊）
    const band = () => {
      ctx.beginPath();
      const N = 50;
      for (let i = 0; i <= N; i++) { const a = Math.PI * i / N; const p = P(rAt(HH - 9) + 0.6, a, HH - 9 + 3 * Math.sin(a * 7)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      for (let i = N; i >= 0; i--) { const a = Math.PI * i / N; const p = P(TOPR, a, HH); ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
    };
    const sideGrad = () => {
      const g = ctx.createLinearGradient(CX - RB, 0, CX + RB, 0);
      g.addColorStop(0, 'rgba(176,82,18,0.92)');
      g.addColorStop(0.3, 'rgba(198,104,28,0.88)');
      g.addColorStop(0.75, 'rgba(150,64,12,0.94)');
      g.addColorStop(1, 'rgba(110,44,8,0.96)');
      return g;
    };
    ctx.save();
    envPath(ctx, BODY); ctx.clip();
    band(); ctx.fillStyle = sideGrad(); ctx.fill();
    for (const d of DRIPS) {
      dripPath(ctx, d);
      ctx.fillStyle = sideGrad(); ctx.fill();
      // 每一道糖漿左側的亮光
      const p0 = P(rAt(HH - 4), d.a - d.w * 0.4, HH - 4), p1 = P(rAt(HH - d.len + 6), d.a - d.w * 0.35, HH - d.len + 6);
      ctx.strokeStyle = 'rgba(255,200,130,0.55)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
    ctx.restore();
    // 頂面
    ctx.beginPath(); ctx.ellipse(CX, YT, TOPR + 0.5, (TOPR + 0.5) * SP, 0, 0, TAU);
    const gt = ctx.createRadialGradient(CX - 14, YT - 6, 2, CX, YT, TOPR);
    gt.addColorStop(0, '#9C4612');
    gt.addColorStop(0.6, '#7A320A');
    gt.addColorStop(1, '#5E2406');
    ctx.fillStyle = gt; ctx.fill();
    // 頂面邊緣的琥珀透光與反光
    ctx.save();
    ctx.beginPath(); ctx.ellipse(CX, YT, TOPR + 0.5, (TOPR + 0.5) * SP, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(214,120,40,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, YT + 1.2, TOPR - 1, (TOPR - 1) * SP, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = 'rgba(255,235,200,0.55)';
    ctx.beginPath(); ctx.ellipse(CX - TOPR * 0.45, YT - TOPR * SP * 0.35, 9, 2.6, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,225,0.85)';
    ctx.beginPath(); ctx.ellipse(CX - TOPR * 0.55, YT - TOPR * SP * 0.38, 3, 1.2, -0.2, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(CX, YT, TOPR + 0.5, (TOPR + 0.5) * SP, 0, Math.PI, TAU);
    ctx.strokeStyle = 'rgba(80,30,5,0.7)'; ctx.lineWidth = 1.8; ctx.stroke();
  }

  /* ---------- 鮮奶油小擠花 ---------- */
  function drawCream(ctx, cx, cy) {
    const R = 19, SQ = 0.55, LIFT = 13, NB = 8;
    ctx.fillStyle = 'rgba(60,20,0,0.35)';
    ctx.beginPath(); ctx.ellipse(cx + 2, cy + 2, R + 1, (R + 1) * SQ, 0, 0, TAU); ctx.fill();
    const pt = (r, phi) => [cx + Math.cos(phi) * r, cy + Math.sin(phi) * r * SQ - LIFT * (1 - r / R)];
    const scR = phi => R * (0.92 + 0.08 * Math.cos(NB * phi));
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const phi = i / 96 * TAU; const [x, y] = pt(scR(phi), phi);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx - 6, cy - 10, 1, cx, cy - 4, R * 1.1);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.6, '#FBF5EC');
    g.addColorStop(1, '#E2D2BF');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(170,130,100,0.7)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.lineCap = 'round';
    for (let k = 0; k < NB; k++) {
      const p0 = (k + 0.5) / NB * TAU;
      const line = (off, col, lw) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (let j = 0; j <= 10; j++) {
          const t = j / 10, r = R * (0.9 - 0.75 * t), phi = p0 + off + t * 1.0;
          const [x, y] = pt(r, phi); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      };
      line(0, 'rgba(185,145,115,0.65)', 0.9);
      line(-0.18, 'rgba(255,255,255,0.95)', 1.0);
    }
  }

  /* ---------- 櫻桃 ---------- */
  function drawCherry(ctx, x, y) {
    const r = 12.5;
    // 梗
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4E5A22'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x + 1, y - r + 3); ctx.bezierCurveTo(x + 2, y - r - 6, x + 8, y - r - 10, x + 16, y - r - 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(170,190,110,0.8)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x + 0.2, y - r + 2); ctx.bezierCurveTo(x + 1.2, y - r - 6, x + 7, y - r - 10, x + 15, y - r - 12.5); ctx.stroke();
    // 果實（頂端有凹）
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x, y - r + 2.5);
      ctx.bezierCurveTo(x + r * 0.5, y - r - 1.5, x + r * 1.05, y - r * 0.5, x + r, y + r * 0.05);
      ctx.bezierCurveTo(x + r * 0.95, y + r * 0.85, x + r * 0.4, y + r, x, y + r);
      ctx.bezierCurveTo(x - r * 0.4, y + r, x - r * 0.95, y + r * 0.85, x - r, y + r * 0.05);
      ctx.bezierCurveTo(x - r * 1.05, y - r * 0.5, x - r * 0.5, y - r - 1.5, x, y - r + 2.5);
      ctx.closePath();
    };
    path();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r * 1.1);
    g.addColorStop(0, '#FF6B78');
    g.addColorStop(0.35, '#E3172F');
    g.addColorStop(0.8, '#B00A22');
    g.addColorStop(1, '#7E0517');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(100,0,15,0.75)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.42, y - r * 0.3, 2.6, 3.8, 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,205,0.45)';
    ctx.beginPath(); ctx.ellipse(x + r * 0.45, y + r * 0.45, 2.2, 1.4, -0.6, 0, TAU); ctx.fill();
  }

  function draw(ctx) {
    drawBody(ctx);
    drawCaramel(ctx);
    drawCream(ctx, CX + 2, YT - 2);
    drawCherry(ctx, CX + 1, YT - 26);
  }

  window.DESSERTS['purin'] = {
    draw,
    crumbs: ['#F9D66C', '#7A320A', '#FCE08A', '#E3172F', '#FFFFFF'],
    crunchy: 0.0,
  };
})();
