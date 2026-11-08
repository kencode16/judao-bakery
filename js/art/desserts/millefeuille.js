/* 千層派（mille-feuille）・精緻擬真插畫風
 * 長方形一塊，斜上 45 度、微微轉向看得到右側面：
 * 由下而上 酥皮／卡士達／酥皮／卡士達／酥皮，最上面是白色翻糖淋面加巧克力羽毛紋（人字形拉花）。
 * 每個面用仿射變換直接在「面座標」上畫；光源左上：頂面最亮、正面中等、右側面較暗。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const PSI = 0.2;                    // 水平轉角（看得到右側面）
  const PHI = 47 * Math.PI / 180;     // 俯視角
  const CP = Math.cos(PSI), SPs = Math.sin(PSI), CF = Math.cos(PHI), SF = Math.sin(PHI);
  const LX = 73, LZ = 26;             // 半長、半深
  const LAYERS = [                    // 由下而上（y0, y1）
    { k: 'p', y0: 0, y1: 15 },
    { k: 'c', y0: 15, y1: 31 },
    { k: 'p', y0: 31, y1: 45 },
    { k: 'c', y0: 45, y1: 61 },
    { k: 'p', y0: 61, y1: 75 },
    { k: 'f', y0: 75, y1: 80 },
  ];
  const H = 80;
  // 3D → 畫面
  let CX = 100, CY = 100;
  function S(x, y, z) {
    const X = x * CP - z * SPs, Z = x * SPs + z * CP;
    return [CX + X, CY - y * CF + Z * SF];
  }
  // 讓整塊置中
  (function () {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const x of [-LX, LX]) for (const z of [-LZ, LZ]) for (const y of [0, H]) {
      const p = S(x, y, z);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    CX += 100 - (x0 + x1) / 2; CY += 101 - (y0 + y1) / 2;
  })();

  // 各面的仿射變換
  function front(ctx) { const o = S(0, 0, LZ); ctx.transform(CP, SPs * SF, 0, -CF, o[0], o[1]); }       // (x, y)
  function right(ctx) { const o = S(LX, 0, 0); ctx.transform(-SPs, CP * SF, 0, -CF, o[0], o[1]); }     // (z, y)
  function top(ctx) { const o = S(0, H, 0); ctx.transform(CP, SPs * SF, -SPs, CP * SF, o[0], o[1]); }  // (x, z)

  /* ---------- 酥皮 ---------- */
  function pastry(ctx, x0, x1, y0, y1, seed, dark) {
    const r = K.rng(seed);
    // 上下邊緣不平整
    const N = 40;
    const topE = [], botE = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N;
      topE.push([x, y1 + (r() - 0.5) * 1.6]);
      botE.push([x, y0 + (r() - 0.5) * 1.2]);
    }
    ctx.beginPath();
    botE.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    for (let i = N; i >= 0; i--) ctx.lineTo(topE[i][0], topE[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y1, 0, y0);
    g.addColorStop(0, '#9C4E16');
    g.addColorStop(0.16, '#D2873A');
    g.addColorStop(0.5, '#E6A753');
    g.addColorStop(0.82, '#CC8034');
    g.addColorStop(1, '#8E4614');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // 一層層酥皮：細細的明暗橫線
    const n = Math.round((y1 - y0) / 1.7);
    for (let k = 1; k < n; k++) {
      const y = y0 + (y1 - y0) * k / n;
      let x = x0 - r() * 10;
      while (x < x1) {
        const len = 8 + r() * 26, xe = Math.min(x1, x + len);
        const wob = (r() - 0.5) * 1.2;
        ctx.strokeStyle = r() < 0.55 ? `rgba(120,56,12,${0.3 + r() * 0.3})` : `rgba(255,226,160,${0.35 + r() * 0.3})`;
        ctx.lineWidth = 0.5 + r() * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y + wob);
        ctx.quadraticCurveTo((x + xe) / 2, y + wob + (r() - 0.5) * 1.4, xe, y + wob * 0.5);
        ctx.stroke();
        x = xe + r() * 4;
      }
    }
    // 焦糖化的上緣
    ctx.fillStyle = 'rgba(150,72,16,0.45)';
    ctx.fillRect(x0 - 2, y1 - 1.8, x1 - x0 + 4, 2.6);
    if (dark) { ctx.fillStyle = `rgba(70,32,8,${dark})`; ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4); }
    ctx.restore();
  }

  /* ---------- 卡士達（擠成一顆顆的圓球邊） ---------- */
  function cream(ctx, x0, x1, y0, y1, seed, dark) {
    const r = K.rng(seed);
    const h = y1 - y0, cy = (y0 + y1) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0 - 1, x1 - x0, h + 2);
    ctx.clip();
    // 底色（縫隙處）
    ctx.fillStyle = '#E9C979';
    ctx.fillRect(x0, y0, x1 - x0, h);
    const step = h * 0.92;
    for (let x = x0 + step * 0.35; x < x1 + step; x += step) {
      const rx = step * 0.58, ry = h * 0.56;
      const xx = x + (r() - 0.5) * 1.2;
      ctx.beginPath();
      ctx.ellipse(xx, cy, rx, ry, 0, 0, TAU);
      const g = ctx.createRadialGradient(xx - rx * 0.35, cy + ry * 0.35, 0.5, xx, cy, rx * 1.1);
      g.addColorStop(0, '#FFF8DC');
      g.addColorStop(0.45, '#FBE7A8');
      g.addColorStop(0.85, '#F0CF7E');
      g.addColorStop(1, '#D9AE5A');
      ctx.fillStyle = g;
      ctx.fill();
    }
    if (dark) { ctx.fillStyle = `rgba(90,50,10,${dark})`; ctx.fillRect(x0, y0 - 1, x1 - x0, h + 2); }
    ctx.restore();
  }

  /* ---------- 翻糖面＋巧克力羽毛紋 ---------- */
  const FEATHER_Z = [-18, -9, 0, 9, 18];
  const DRAG = []; for (let x = -64, s = 1; x <= 64; x += 16, s = -s) DRAG.push([x, s]);
  function fz(z0, x) {
    let d = 0;
    for (const [xj, s] of DRAG) d += s * 4.6 * Math.exp(-Math.abs(x - xj) / 4.2);
    return z0 + d;
  }
  function drawTop(ctx) {
    ctx.save();
    top(ctx);
    ctx.beginPath();
    ctx.rect(-LX, -LZ, LX * 2, LZ * 2);
    const g = ctx.createLinearGradient(-LX, -LZ, LX, LZ);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.5, '#FFFBF2');
    g.addColorStop(1, '#F2E7D6');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // 羽毛紋
    ctx.lineCap = 'round';
    for (const z0 of FEATHER_Z) {
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = -LX + 2 * LX * i / 160;
        const z = fz(z0, x);
        i ? ctx.lineTo(x, z) : ctx.moveTo(x, z);
      }
      ctx.strokeStyle = 'rgba(92,52,30,0.28)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = '#5A3220';
      ctx.lineWidth = 1.9;
      ctx.stroke();
    }
    // 光澤
    const s = ctx.createRadialGradient(-38, -12, 2, -38, -12, 46);
    s.addColorStop(0, 'rgba(255,255,255,0.65)');
    s.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s;
    ctx.fillRect(-LX, -LZ, LX * 2, LZ * 2);
    // 前緣圓角的亮線、後緣淡影
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-LX + 3, LZ - 1.6); ctx.lineTo(LX - 6, LZ - 1.6); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawFront(ctx) {
    ctx.save();
    front(ctx);
    for (const L of LAYERS) {
      if (L.k === 'p') pastry(ctx, -LX, LX, L.y0, L.y1, 100 + L.y0, 0);
      else if (L.k === 'c') cream(ctx, -LX, LX, L.y0, L.y1, 200 + L.y0, 0);
      else {
        // 翻糖層的厚度（正面）
        const g = ctx.createLinearGradient(0, L.y1, 0, L.y0 - 1);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(1, '#EDE3D3');
        ctx.fillStyle = g;
        ctx.fillRect(-LX, L.y0 - 0.5, LX * 2, L.y1 - L.y0 + 0.5);
        // 一點點往下滴
        ctx.beginPath();
        const r = K.rng(42);
        ctx.moveTo(-LX, L.y0);
        for (let x = -LX; x <= LX; x += 4) ctx.lineTo(x, L.y0 - (r() < 0.25 ? 1 + r() * 2.2 : r() * 0.6));
        ctx.lineTo(LX, L.y0); ctx.closePath();
        ctx.fillStyle = '#F4ECDF';
        ctx.fill();
      }
    }
    // 左亮右暗
    const h = ctx.createLinearGradient(-LX, 0, LX, 0);
    h.addColorStop(0, 'rgba(255,240,210,0.18)');
    h.addColorStop(0.4, 'rgba(255,240,210,0)');
    h.addColorStop(1, 'rgba(90,40,10,0.14)');
    ctx.fillStyle = h;
    ctx.fillRect(-LX, 0, LX * 2, H);
    ctx.restore();
  }

  function drawRight(ctx) {
    ctx.save();
    right(ctx);
    for (const L of LAYERS) {
      if (L.k === 'p') pastry(ctx, -LZ, LZ, L.y0, L.y1, 300 + L.y0, 0.3);
      else if (L.k === 'c') cream(ctx, -LZ, LZ, L.y0, L.y1, 400 + L.y0, 0.22);
      else { ctx.fillStyle = '#DCD0BE'; ctx.fillRect(-LZ, L.y0 - 0.5, LZ * 2, L.y1 - L.y0 + 0.5); }
    }
    ctx.restore();
  }

  function outline(ctx) {
    const pts = [S(-LX, H, -LZ), S(LX, H, -LZ), S(LX, H, LZ), S(LX, 0, LZ), S(-LX, 0, LZ), S(-LX, H, LZ)];
    // 右後方的角（右側面在後方的那條邊）
    const pr = [S(LX, H, -LZ), S(LX, 0, -LZ), S(LX, 0, LZ)];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pr[0][0], pr[0][1]);
    ctx.lineTo(pr[1][0], pr[1][1]);
    ctx.lineTo(pr[2][0], pr[2][1]);
    ctx.lineTo(pts[4][0], pts[4][1]);
    ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.closePath();
  }

  function draw(ctx) {
    drawRight(ctx);
    drawFront(ctx);
    drawTop(ctx);
    // 稜線
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.0)';
    const a = S(-LX, H, LZ), b = S(LX, H, LZ), c = S(LX, 0, LZ);
    ctx.strokeStyle = 'rgba(120,70,30,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    void a;
    outline(ctx);
    ctx.strokeStyle = 'rgba(110,56,20,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  window.DESSERTS['millefeuille'] = {
    draw,
    crumbs: ['#F0BE68', '#FBE7A8', '#FFFFFF', '#B8661E', '#5A3220'],
    crunchy: 0.85,
  };
})();
