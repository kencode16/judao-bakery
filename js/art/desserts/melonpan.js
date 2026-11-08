/* 蜜瓜麵包（メロンパン）
 * 斜上方看的圓頂麵包：表面一層淡黃綠的餅乾酥皮，壓著斜格紋（菱形格），格子微微鼓起、撒著砂糖粒；
 * 底部露出一圈烤成金褐色的麵包。光源左上。
 * 和其他圓頂麵包（布里歐、司康、蛋黃酥…）的分別：整顆罩著「菱形格紋」的淡黃綠酥皮。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 96;
  const SP = 0.6, CP = 0.8;            // 俯視角：sinα、cosα
  const R = 80, H = 64, H2 = 23;       // 半徑、上半圓頂高、下半（麵包底，圓角柱）
  const Z_BOT = -21;                   // 平底
  const TH_CRUST = Math.PI / 2 + 0.06; // 酥皮包到赤道下方一點
  const L = 118;                       // 攤平時從頂點到赤道的距離（決定格子大小）
  const D = 39;                        // 格紋間距

  const proj = (x, y, z) => [CX + x, CY + y * SP - z * CP];
  // 方位等距：攤平的 (a, b) → 圓頂表面
  function surf(a, b) {
    const rho = Math.hypot(a, b), th = rho / L * (Math.PI / 2);
    const ca = rho > 1e-6 ? a / rho : 1, sa = rho > 1e-6 ? b / rho : 0;
    const st = Math.sin(th), ct = Math.cos(th);
    const z = ct >= 0 ? H * ct : H2 * ct;
    return { x: R * st * ca, y: R * st * sa, z, th };
  }
  function normal(p) {
    const hz = p.z >= 0 ? H : H2;
    const n = [p.x / (R * R), p.y / (R * R), p.z / (hz * hz)];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    return [n[0] / l, n[1] / l, n[2] / l];
  }
  const VIEW = [0, CP, SP];
  const LIGHT = (() => { const v = [-0.55, -0.35, 0.76]; const l = Math.hypot(...v); return v.map(c => c / l); })();
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const rAt = z => z >= 0 ? R * Math.sqrt(Math.max(0, 1 - z * z / (H * H))) : (R - 1.5) * Math.pow(Math.max(0, 1 - Math.pow(-z / H2, 6)), 1 / 6);

  // 水平圓環疊出來的外輪廓
  function envelope(z0, z1, n) {
    const rings = [];
    for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; rings.push({ y: CY - z * CP, r: rAt(z) }); }
    let mx = 0; for (const g of rings) mx = Math.max(mx, g.r);
    const top = [], bot = [], N = 100;
    for (let i = 0; i <= N; i++) {
      const x = mx * Math.cos(Math.PI * (1 - i / N)) * 0.99999;
      let yt = Infinity, yb = -Infinity;
      for (const g of rings) {
        if (g.r < Math.abs(x)) continue;
        const h = SP * Math.sqrt(g.r * g.r - x * x);
        yt = Math.min(yt, g.y - h); yb = Math.max(yb, g.y + h);
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

  const Z_CRUST = H2 * Math.cos(TH_CRUST);
  const E_ALL = envelope(Z_BOT, H, 60);
  const E_CRUST = envelope(Z_CRUST, H, 60);

  // 酥皮下緣：前半圈帶一點不規則的波浪（烤裂的邊）
  const edgeRnd = K.rng(5);
  const EDGE = []; for (let i = 0; i < 40; i++) EDGE.push((edgeRnd() - 0.5) * 2.4);
  function crustPath(ctx) {
    ctx.beginPath();
    E_CRUST.top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    const r = rAt(Z_CRUST), yc = CY - Z_CRUST * CP, N = 80;
    for (let i = 0; i <= N; i++) {
      const t = i / N, ang = t * Math.PI;               // 右 → 前 → 左
      const k = Math.floor(t * 39), f = t * 39 - k;
      const w = (EDGE[k] * (1 - f) + EDGE[k + 1] * f) * Math.sin(ang) + Math.sin(ang * 23) * 0.9 * Math.sin(ang);
      ctx.lineTo(CX + Math.cos(ang) * r, yc + Math.sin(ang) * r * SP + w + 1.5 * Math.sin(ang));
    }
    ctx.closePath();
  }

  /* ---------- 底部麵包 ---------- */
  function drawBread(ctx) {
    envPath(ctx, E_ALL);
    const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    g.addColorStop(0, '#E7B465');
    g.addColorStop(0.4, '#D79A4C');
    g.addColorStop(1, '#A4652A');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    envPath(ctx, E_ALL); ctx.clip();
    const gv = ctx.createLinearGradient(0, CY + 42, 0, CY + 70);
    gv.addColorStop(0, 'rgba(100,50,15,0.45)');
    gv.addColorStop(0.3, 'rgba(255,230,170,0.15)');
    gv.addColorStop(1, 'rgba(120,60,20,0.4)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  /* ---------- 酥皮 ---------- */
  function drawCrust(ctx) {
    crustPath(ctx);
    const g = ctx.createRadialGradient(CX - 30, CY - 42, 4, CX - 5, CY - 10, 105);
    g.addColorStop(0, '#FCFAC8');
    g.addColorStop(0.35, '#EBE88E');
    g.addColorStop(0.72, '#D6CF6A');
    g.addColorStop(1, '#B9A548');
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    crustPath(ctx); ctx.clip();

    // 每一格微微鼓起：依格子中心的法線打光
    const cells = [];
    const UMAX = Math.ceil(L * 1.6 / D);
    for (let i = -UMAX; i < UMAX; i++) {
      for (let j = -UMAX; j < UMAX; j++) {
        const uc = (i + 0.5) * D, vc = (j + 0.5) * D;
        const ac = (uc + vc) / 2, bc = (uc - vc) / 2;
        const c = surf(ac, bc);
        if (c.th > TH_CRUST + 0.3) continue;
        const n = normal(c);
        if (dot(n, VIEW) < -0.05) continue;
        const pts = [];
        const corner = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
        for (let e = 0; e < 4; e++) {
          const p0 = corner[e], p1 = corner[(e + 1) % 4];
          for (let s = 0; s < 4; s++) {
            const t = s / 4;
            const u = (p0[0] + (p1[0] - p0[0]) * t) * D, v = (p0[1] + (p1[1] - p0[1]) * t) * D;
            const q = surf((u + v) / 2, (u - v) / 2);
            pts.push(proj(q.x, q.y, q.z));
          }
        }
        cells.push({ pts, c, n, depth: dot([c.x, c.y, c.z], VIEW) });
      }
    }
    cells.sort((a, b) => a.depth - b.depth);
    for (const cell of cells) {
      const sc = proj(cell.c.x, cell.c.y, cell.c.z);
      const lam = Math.max(0, dot(cell.n, LIGHT));
      ctx.beginPath();
      cell.pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      // 格子本身：中央亮、邊緣暗（鼓起）
      let w = 0, h = 0;
      for (const p of cell.pts) { w = Math.max(w, Math.abs(p[0] - sc[0])); h = Math.max(h, Math.abs(p[1] - sc[1])); }
      const rad = Math.max(w, h) * 1.05;
      const gc = ctx.createRadialGradient(sc[0] - w * 0.25, sc[1] - h * 0.3, 0.5, sc[0], sc[1], rad);
      gc.addColorStop(0, `rgba(255,255,230,${0.15 + 0.4 * lam})`);
      gc.addColorStop(0.6, 'rgba(255,255,230,0)');
      gc.addColorStop(1, `rgba(150,135,40,${0.1 + 0.12 * (1 - lam)})`);
      ctx.fillStyle = gc; ctx.fill();
    }

    // 格紋的溝：深色線＋左上亮邊
    const grooves = (off) => {
      ctx.beginPath();
      for (let k = -UMAX; k <= UMAX; k++) {
        for (const dir of [0, 1]) {
          let pen = false;
          for (let s = -40; s <= 40; s++) {
            const t = s / 40 * L * 1.6;
            const u = dir ? k * D : t, v = dir ? t : k * D;
            const q = surf((u + v) / 2, (u - v) / 2);
            const ok = q.th <= TH_CRUST + 0.3 && dot(normal(q), VIEW) > -0.02;
            if (!ok) { pen = false; continue; }
            const p = proj(q.x, q.y, q.z);
            if (pen) ctx.lineTo(p[0] + off, p[1] + off); else { ctx.moveTo(p[0] + off, p[1] + off); pen = true; }
          }
        }
      }
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 溝的左上壁在陰影裡、右下那格的邊緣迎光
    grooves(1.1);
    ctx.strokeStyle = 'rgba(255,255,232,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
    grooves(-0.3);
    ctx.strokeStyle = 'rgba(145,128,45,0.65)'; ctx.lineWidth = 2.0; ctx.stroke();

    // 砂糖粒
    const rnd = K.rng(77);
    for (let i = 0; i < 260; i++) {
      const a = (rnd() - 0.5) * 2 * L * 1.15, b = (rnd() - 0.5) * 2 * L * 1.15;
      const q = surf(a, b);
      if (q.th > TH_CRUST || dot(normal(q), VIEW) < 0.05) continue;
      const p = proj(q.x, q.y, q.z);
      const r = 0.55 + rnd() * 0.7;
      ctx.fillStyle = 'rgba(140,128,50,0.35)';
      ctx.beginPath(); ctx.arc(p[0] + 0.4, p[1] + 0.5, r, 0, TAU); ctx.fill();
      ctx.fillStyle = rnd() < 0.7 ? 'rgba(255,255,248,0.9)' : 'rgba(255,255,255,1)';
      ctx.beginPath(); ctx.arc(p[0], p[1], r * 0.8, 0, TAU); ctx.fill();
    }

    // 圓頂左上的大片柔光、右下的陰影
    const gh = ctx.createRadialGradient(CX - 34, CY - 44, 2, CX - 34, CY - 44, 50);
    gh.addColorStop(0, 'rgba(255,255,235,0.5)');
    gh.addColorStop(1, 'rgba(255,255,235,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    const gd = ctx.createLinearGradient(CX - 30, CY - 50, CX + 70, CY + 50);
    gd.addColorStop(0, 'rgba(80,70,10,0)');
    gd.addColorStop(0.6, 'rgba(80,70,10,0)');
    gd.addColorStop(1, 'rgba(90,80,15,0.2)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();

    // 酥皮下緣的裂邊：一點陰影
    crustPath(ctx);
    ctx.strokeStyle = 'rgba(150,130,50,0.45)'; ctx.lineWidth = 1.1; ctx.stroke();
  }

  function draw(ctx) {
    drawBread(ctx);
    drawCrust(ctx);
    envPath(ctx, E_ALL);
    ctx.strokeStyle = 'rgba(120,100,35,0.7)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['melonpan'] = {
    draw,
    crumbs: ['#E8E596', '#FAF7CC', '#D79A4C', '#CDCB6E', '#FFFFFF'],
    crunchy: 0.55,
  };
})();
