/* 澎湖鹹餅（saltycake）
 * 參考使用者提供的照片（參考照片/澎湖鹹餅/）：薄薄的小長方形、四邊一整排壓花齒紋、
 * 中間微微鼓起、表面起小泡的酥皮，有一排排小洞、零星芝麻和蔥花。
 * 畫成三片疊起來（像照片的疊放特寫），最上面一片完整露出，薄、齒紋邊一眼就認得。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 正投影 ---------- */
  const YAW = 14 * Math.PI / 180;
  const SP = 0.66, CP = 0.8;
  const CX = 100, CY = 122;
  const W = 130, D = 86, T = 11;          // 長、寬、邊緣厚度
  const W2 = W / 2, D2 = D / 2;
  const TOOTH = 8;                      // 齒距
  const AMP = 2.8;                        // 齒紋凸出量

  // 三片：位移、旋轉、底面高度
  const STACK = [
    { ox: 8, oy: 10, rot: -7, z: 0, seed: 11 },
    { ox: -5, oy: 4, rot: 5, z: T + 1.5, seed: 23 },
    { ox: 1, oy: -4, rot: -1.5, z: 2 * T + 3, seed: 37 },
  ];

  function cracker(c) {
    const yaw = YAW + c.rot * Math.PI / 180;
    const co = Math.cos(yaw), si = Math.sin(yaw);
    const ox = CX + c.ox * Math.cos(YAW) - c.oy * Math.sin(YAW);
    const oy = CY + (c.ox * Math.sin(YAW) + c.oy * Math.cos(YAW)) * SP;
    const P = (x, y, z) => [ox + x * co - y * si, oy + (x * si + y * co) * SP - (c.z + z) * CP];
    const top = (ctx, z) => ctx.transform(co, si * SP, -si, co * SP, ox, oy - (c.z + z) * CP);
    return { P, top, co, si, c };
  }

  // 齒紋外輪廓（局部座標），回傳點列與每個點所在的邊、齒的相位
  function outline() {
    const pts = [];
    const edges = [
      [[-W2, -D2], [W2, -D2], [0, -1]],
      [[W2, -D2], [W2, D2], [1, 0]],
      [[W2, D2], [-W2, D2], [0, 1]],
      [[-W2, D2], [-W2, -D2], [-1, 0]],
    ];
    edges.forEach(([a, b, n], ei) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nt = Math.round(len / TOOTH);
      const steps = nt * 6;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const ph = t * nt;                       // 第幾顆齒
        const bump = Math.pow(Math.abs(Math.sin(Math.PI * ph)), 0.7);
        // 四角內縮一點，角落圓一些
        const cornerT = Math.min(t, 1 - t) * len;
        const corner = cornerT < 6 ? (6 - cornerT) * 0.35 : 0;
        const off = AMP * bump - corner;
        pts.push({ x: a[0] + (b[0] - a[0]) * t + n[0] * off, y: a[1] + (b[1] - a[1]) * t + n[1] * off, e: ei, ph, bump });
      }
    });
    return pts;
  }
  const OUT = outline();

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

  /* ---------- 側邊：一整排齒紋 ---------- */
  function drawSide(ctx, k) {
    const { P } = k;
    // 側面範圍：上緣（z=T）與下緣（z=0）的齒紋外輪廓之間
    const sil = [];
    for (const p of OUT) { sil.push(P(p.x, p.y, T)); sil.push(P(p.x, p.y, 0)); }
    const H = hullOf(sil);
    poly(ctx, H);
    const a = P(-W2, D2, 0), b = P(W2, -D2, 0);
    const g = ctx.createLinearGradient(a[0], 0, b[0], 0);
    g.addColorStop(0, '#E8C08A');
    g.addColorStop(0.6, '#D6A56A');
    g.addColorStop(1, '#B98245');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, H);
    ctx.clip();
    // 前、右兩邊看得到的齒：每顆齒一條亮的直條，齒縫是深色
    for (const p of OUT) {
      if (p.e !== 1 && p.e !== 2) continue;
      const frac = p.ph % 1;
      if (Math.abs(frac) > 1e-6 && Math.abs(frac - 0.5) > 0.09) continue;
      const t0 = P(p.x, p.y, T - 0.5), b0 = P(p.x, p.y, 0.5);
      if (frac < 0.25) {
        // 齒縫
        ctx.strokeStyle = 'rgba(122,70,24,0.75)';
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(t0[0], t0[1] + 1); ctx.lineTo(b0[0], b0[1]); ctx.stroke();
      } else {
        // 齒的亮面
        ctx.strokeStyle = 'rgba(255,236,196,0.55)';
        ctx.lineWidth = 1.9;
        ctx.beginPath(); ctx.moveTo(t0[0] - 0.6, t0[1] + 1.4); ctx.lineTo(b0[0] - 0.6, b0[1] - 1.2); ctx.stroke();
      }
    }
    // 下緣烤得較深
    ctx.strokeStyle = 'rgba(150,86,30,0.5)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    OUT.filter(p => p.e === 1 || p.e === 2).forEach((p, i) => { const q = P(p.x, p.y, 0.6); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.stroke();
    ctx.restore();
    return H;
  }

  /* ---------- 頂面：起泡酥皮、四邊齒紋、小洞、芝麻蔥花 ---------- */
  function topPath(ctx) {
    ctx.beginPath();
    OUT.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
  }
  const BAND = 9;   // 齒紋壓痕寬度
  const PUFF = 3;   // 中間鼓起的高度
  function rr(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawTop(ctx, k, detail) {
    ctx.save();
    k.top(ctx, T);
    topPath(ctx);
    const g = ctx.createLinearGradient(-W2, -D2, W2, D2);
    g.addColorStop(0, '#F6D9A6');
    g.addColorStop(0.5, '#E9C084');
    g.addColorStop(1, '#D2A060');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx);
    ctx.clip();
    const rnd = K.rng(k.c.seed * 97);

    const ix = W2 - BAND, iy = D2 - BAND;
    // 烤色：邊緣與齒尖較深
    ctx.strokeStyle = 'rgba(190,120,52,0.55)';
    ctx.lineWidth = 5;
    topPath(ctx); ctx.stroke();

    // 齒紋壓痕：沿四邊每顆齒之間一道短溝
    ctx.lineCap = 'round';
    for (const p of OUT) {
      const frac = p.ph % 1;
      if (Math.abs(frac) > 1e-6 || p.ph < 0.5) continue;
      const n = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.e];
      const x0 = p.x - n[0] * 0.5, y0 = p.y - n[1] * 0.5;
      const x1 = p.x - n[0] * BAND, y1 = p.y - n[1] * BAND;
      ctx.strokeStyle = 'rgba(128,74,26,0.62)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      // 溝旁的亮脊
      ctx.strokeStyle = 'rgba(255,240,206,0.5)';
      ctx.lineWidth = 1.1;
      const tx = -n[1] * 1.6, ty = n[0] * 1.6;
      ctx.beginPath(); ctx.moveTo(x0 + tx, y0 + ty); ctx.lineTo(x1 + tx, y1 + ty); ctx.stroke();
    }
    // 中間鼓起的枕頭：往上浮一點，前、右露出暗的側坡
    const pill = (dz) => { ctx.beginPath(); rr(ctx, -ix + 1, -iy + 1 - dz / SP * CP, ix * 2 - 2, iy * 2 - 2, 9); };
    ctx.fillStyle = 'rgba(170,104,40,0.42)';
    pill(0); ctx.fill();
    pill(PUFF);
    const pg = ctx.createRadialGradient(-ix * 0.4, -iy * 0.6, 4, 0, -4, W2 * 1.05);
    pg.addColorStop(0, '#FAE3B4');
    pg.addColorStop(0.45, '#EFC98C');
    pg.addColorStop(1, '#D9A562');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.save();
    pill(PUFF); ctx.clip();
    ctx.translate(0, -PUFF / SP * CP);
    if (detail) {
      // 起小泡的酥皮：小泡泡＋泡泡下緣陰影
      for (let i = 0; i < 18; i++) {
        const x = -ix + 4 + rnd() * (ix * 2 - 8), y = -iy + 4 + rnd() * (iy * 2 - 8);
        const r = 1.8 + rnd() * 3;
        ctx.fillStyle = 'rgba(176,108,42,0.3)';
        ctx.beginPath(); ctx.ellipse(x + 0.7, y + 0.9, r, r * 0.75, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(236,184,110,0.9)';
        ctx.beginPath(); ctx.ellipse(x - 0.2, y - 0.2, r * 0.85, r * 0.62, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,244,214,0.7)';
        ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.25, r * 0.38, r * 0.25, 0, 0, TAU); ctx.fill();
      }
      // 酥皮脫起的薄片邊
      for (let i = 0; i < 12; i++) {
        const x = -ix + 6 + rnd() * (ix * 2 - 12), y = -iy + 6 + rnd() * (iy * 2 - 12);
        ctx.strokeStyle = 'rgba(170,106,44,0.4)';
        ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.arc(x, y, 3 + rnd() * 4, 0.2 + rnd(), 1.6 + rnd() * 1.2); ctx.stroke();
      }
      // 一排排小洞（3 排）
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          const x = -ix + 12 + c * ((ix * 2 - 24) / 5) + (rnd() - 0.5) * 1.5;
          const y = -iy + 11 + r * ((iy * 2 - 22) / 2) + (rnd() - 0.5) * 1.5;
          ctx.fillStyle = 'rgba(255,244,220,0.7)';
          ctx.beginPath(); ctx.ellipse(x - 0.4, y + 1.2, 2.5, 2.1, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(112,62,22,0.9)';
          ctx.beginPath(); ctx.ellipse(x, y, 2, 1.7, 0, 0, TAU); ctx.fill();
        }
      }
      // 芝麻
      for (let i = 0; i < 9; i++) {
        const x = -ix + 6 + rnd() * (ix * 2 - 12), y = -iy + 6 + rnd() * (iy * 2 - 12);
        ctx.fillStyle = 'rgba(150,100,50,0.4)';
        ctx.beginPath(); ctx.ellipse(x + 0.5, y + 0.6, 2.3, 1.2, rnd() * 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFF6E2';
        ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.15, rnd() * 3, 0, TAU); ctx.fill();
      }
      // 蔥花
      for (let i = 0; i < 8; i++) {
        const x = -ix + 6 + rnd() * (ix * 2 - 12), y = -iy + 6 + rnd() * (iy * 2 - 12);
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(88,128,48,0.85)' : 'rgba(64,100,36,0.8)';
        ctx.beginPath(); ctx.ellipse(x, y, 1.8 + rnd() * 1.4, 1 + rnd() * 0.6, rnd() * 3, 0, TAU); ctx.fill();
      }
      // 胡椒細點
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(96,60,30,0.45)';
        ctx.beginPath(); ctx.arc(-ix + rnd() * ix * 2, -iy + rnd() * iy * 2, 0.45 + rnd() * 0.4, 0, TAU); ctx.fill();
      }
    }
    // 枕頭邊緣：右下暗、左上亮
    ctx.strokeStyle = 'rgba(176,110,46,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ix - 2, -iy + 8); ctx.lineTo(ix - 2, iy - 2); ctx.lineTo(-ix + 8, iy - 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,248,226,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-ix + 2.5, iy - 8); ctx.lineTo(-ix + 2.5, -iy + 2.5); ctx.lineTo(ix - 8, -iy + 2.5); ctx.stroke();
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  function draw(ctx) {
    STACK.forEach((c, i) => {
      const k = cracker(c);
      const H = drawSide(ctx, k);
      drawTop(ctx, k, i === STACK.length - 1);
      // 每片的外輪廓細線
      ctx.strokeStyle = 'rgba(130,78,30,0.6)';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      poly(ctx, H);
      ctx.stroke();
      // 上一片投到這片上的柔和陰影
      if (i < STACK.length - 1) {
        const n = cracker(STACK[i + 1]);
        ctx.save();
        poly(ctx, H); ctx.clip();
        ctx.fillStyle = 'rgba(120,70,30,0.22)';
        ctx.beginPath();
        OUT.forEach((p, j) => { const q = n.P(p.x + 2, p.y + 2, -1); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
  }

  window.DESSERTS['saltycake'] = {
    draw,
    crumbs: ['#EDCC98', '#F8E2BC', '#D6A56A', '#FFF6E2', '#B98245'],
    crunchy: 0.9,
  };
})();
