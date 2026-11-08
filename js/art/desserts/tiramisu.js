/* 提拉米蘇（Tiramisù）
 * 斜上 45 度看一塊方形切塊：頂面是可可粉，兩個切面看得到
 * 「馬斯卡彭奶霜（白）／咖啡手指餅乾（褐）」交錯的層次——這是和布朗尼、黑糖糕分開的關鍵。
 * 左前切面受光、右前切面背光。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;

  /* ---------- 幾何 ---------- */
  const T0 = [86, 35];                 // 頂面最後方的角
  const U = [90, 30], V = [-62, 26];   // 頂面兩條邊（U 往右前、V 往左前）
  const H = 68;                        // 切塊高度
  const add = (p, q, s = 1) => [p[0] + q[0] * s, p[1] + q[1] * s];
  const R = add(T0, U), Lc = add(T0, V), F = add(R, V);   // 右角、左角、前角
  const LU = Math.hypot(U[0], U[1]), LV = Math.hypot(V[0], V[1]);

  // 層次（v：由上往下）：可可粉、奶霜、餅乾、奶霜、餅乾
  const LAYERS = [
    { k: 'cocoa', v0: 0, v1: 5 },
    { k: 'cream', v0: 5, v1: 21 },
    { k: 'lady', v0: 21, v1: 36 },
    { k: 'cream', v0: 36, v1: 52 },
    { k: 'lady', v0: 52, v1: 68 },
  ];

  const COCOA = '#6E4128', COCOA_LT = '#8C5A38', COCOA_DK = '#4A2816';
  const CREAM = '#FFF7E6', CREAM_SH = '#EEDCC0';
  const LADY = '#9A6236', LADY_DK = '#6E3F1E', LADY_LT = '#C08A55';
  const LINE = 'rgba(84,46,24,0.78)';

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }
  const topPts = () => [T0, R, F, Lc];
  const outline = () => [T0, R, [R[0], R[1] + H], [F[0], F[1] + H], [Lc[0], Lc[1] + H], Lc];

  // 層與層之間的交界：微微起伏，像抹開的奶霜
  const wave = (u, ph, amp) => Math.sin(u * 0.19 + ph) * amp + Math.sin(u * 0.47 + ph * 1.7) * amp * 0.45;

  /* ---------- 一個切面（本地座標 u：0～len、v：0～H） ---------- */
  function drawFace(ctx, origin, dir, len, lit, seed, crossSection) {
    const rnd = K.rng(seed);
    ctx.save();
    ctx.transform(dir[0] / len, dir[1] / len, 0, 1, origin[0], origin[1]);
    ctx.beginPath(); ctx.rect(0, 0, len, H); ctx.clip();

    LAYERS.forEach((L, li) => {
      const ph = li * 1.3 + seed * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, L.v0 + (li ? wave(0, ph, 0.9) : 0));
      for (let u = 0; u <= len; u += 3) ctx.lineTo(u, L.v0 + (li ? wave(u, ph, 0.9) : 0));
      ctx.lineTo(len, L.v1 + 2); ctx.lineTo(0, L.v1 + 2);
      ctx.closePath();
      let g = ctx.createLinearGradient(0, L.v0, 0, L.v1);
      if (L.k === 'cocoa') {
        g.addColorStop(0, COCOA_DK); g.addColorStop(1, COCOA);
      } else if (L.k === 'cream') {
        g.addColorStop(0, '#FFFDF6'); g.addColorStop(0.6, CREAM); g.addColorStop(1, CREAM_SH);
      } else {
        g.addColorStop(0, LADY_LT); g.addColorStop(0.35, LADY); g.addColorStop(1, LADY_DK);
      }
      ctx.fillStyle = g;
      ctx.fill();

      if (L.k === 'lady') {
        ctx.save(); ctx.clip();
        if (crossSection) {
          // 手指餅乾的橫切面：一排圓角橢圓，外圈吸飽咖啡較深，中心淺
          const n = 5, w = len / n;
          for (let i = 0; i < n; i++) {
            const cx = (i + 0.5) * w + (rnd() - 0.5) * 2, cy = (L.v0 + L.v1) / 2 + 0.5;
            const rx = w * 0.46, ry = (L.v1 - L.v0) * 0.5;
            const gg = ctx.createRadialGradient(cx - rx * 0.25, cy - ry * 0.3, 0.5, cx, cy, rx * 1.05);
            gg.addColorStop(0, '#D7A56C'); gg.addColorStop(0.55, '#A86C3C'); gg.addColorStop(1, '#6A3B1C');
            ctx.fillStyle = gg;
            ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          // 手指餅乾的長邊：幾道淺淺的接縫
          ctx.strokeStyle = 'rgba(70,35,15,0.35)'; ctx.lineWidth = 0.9;
          for (let u = 13 + rnd() * 6; u < len - 4; u += 20 + rnd() * 6) {
            ctx.beginPath(); ctx.moveTo(u, L.v0 + 2); ctx.lineTo(u + (rnd() - 0.5) * 2, L.v1); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(220,170,110,0.35)';
          ctx.fillRect(0, L.v0 + 2, len, 2.2);
        }
        // 海綿氣孔
        for (let i = 0; i < 70; i++) {
          const u = rnd() * len, v = L.v0 + 1.5 + rnd() * (L.v1 - L.v0 - 2), r = 0.35 + rnd() * 0.7;
          ctx.fillStyle = rnd() < 0.5 ? 'rgba(60,28,10,0.38)' : 'rgba(235,190,130,0.4)';
          ctx.beginPath(); ctx.ellipse(u, v, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      } else if (L.k === 'cream') {
        // 奶霜上方被可可／咖啡染到的淡影，和抹刀的細紋
        ctx.save(); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7;
        for (let i = 0; i < 3; i++) {
          const v = L.v0 + 4 + i * 4 + rnd() * 2;
          ctx.beginPath(); ctx.moveTo(rnd() * 10, v);
          ctx.quadraticCurveTo(len * 0.5, v + (rnd() - 0.5) * 2, len - rnd() * 10, v + (rnd() - 0.5) * 1.5);
          ctx.stroke();
        }
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = 'rgba(150,100,60,0.18)';
          ctx.beginPath(); ctx.arc(rnd() * len, L.v0 + rnd() * (L.v1 - L.v0), 0.5 + rnd() * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    });

    // 可可粉從頂面往下撒落一點點
    for (let i = 0; i < 40; i++) {
      const u = rnd() * len, v = 4 + Math.pow(rnd(), 2.2) * 9;
      ctx.fillStyle = K.rgba(COCOA, 0.55 + rnd() * 0.3);
      ctx.beginPath(); ctx.arc(u, v, 0.45 + rnd() * 0.6, 0, Math.PI * 2); ctx.fill();
    }

    // 受光／背光
    const gl = ctx.createLinearGradient(0, 0, len, 0);
    if (lit) {
      gl.addColorStop(0, 'rgba(255,240,220,0.10)');
      gl.addColorStop(1, 'rgba(90,50,20,0.06)');
    } else {
      gl.addColorStop(0, 'rgba(70,35,15,0.20)');
      gl.addColorStop(1, 'rgba(70,35,15,0.32)');
    }
    ctx.fillStyle = gl; ctx.fillRect(0, 0, len, H);
    // 底部收暗
    const gb = ctx.createLinearGradient(0, H - 10, 0, H);
    gb.addColorStop(0, 'rgba(60,30,10,0)'); gb.addColorStop(1, 'rgba(60,30,10,0.35)');
    ctx.fillStyle = gb; ctx.fillRect(0, H - 10, len, 10);
    ctx.restore();
  }

  /* ---------- 頂面：可可粉 ---------- */
  function drawTop(ctx) {
    const rnd = K.rng(77);
    poly(ctx, topPts());
    const g = ctx.createLinearGradient(Lc[0], T0[1], R[0], F[1]);
    g.addColorStop(0, '#94603C');
    g.addColorStop(0.5, COCOA);
    g.addColorStop(1, '#5A321C');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, topPts()); ctx.clip();
    // 粉面的柔光
    const gh = ctx.createRadialGradient(80, 52, 2, 80, 52, 52);
    gh.addColorStop(0, 'rgba(200,150,105,0.45)');
    gh.addColorStop(1, 'rgba(200,150,105,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    // 細細的可可粉顆粒（亮暗交錯，霧面感）
    for (let i = 0; i < 520; i++) {
      const x = Lc[0] + rnd() * (R[0] - Lc[0]), y = T0[1] + rnd() * (F[1] - T0[1]);
      const r = 0.35 + rnd() * 0.8;
      ctx.fillStyle = rnd() < 0.55 ? 'rgba(60,30,14,0.45)' : 'rgba(176,124,84,0.5)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // 篩粉留下的淡淡小丘
    for (let i = 0; i < 9; i++) {
      const x = 60 + rnd() * 90, y = 45 + rnd() * 35;
      const gg = ctx.createRadialGradient(x - 2, y - 1, 0.5, x, y, 9);
      gg.addColorStop(0, 'rgba(170,118,78,0.35)'); gg.addColorStop(1, 'rgba(170,118,78,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(x, y, 10, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // 前緣可可粉堆出的毛邊
    for (const [a, b] of [[Lc, F], [F, R]]) {
      for (let i = 0; i < 26; i++) {
        const t = rnd(), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - 1.2;
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(150,100,64,0.55)' : 'rgba(80,42,20,0.5)';
        ctx.beginPath(); ctx.ellipse(x, y, 1.6 + rnd() * 1.6, 0.9 + rnd() * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 靠前緣的圓角亮邊
    ctx.strokeStyle = 'rgba(190,140,100,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Lc[0] + 2, Lc[1]); ctx.lineTo(F[0], F[1] - 1.5); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂上的巧克力捲片（點綴） ---------- */
  function curl(ctx, x, y, len, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    // 影子
    ctx.fillStyle = 'rgba(40,18,6,0.35)';
    ctx.beginPath(); ctx.ellipse(1.5, 3.2, len / 2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    // 捲筒
    const g = ctx.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, '#7A4527'); g.addColorStop(0.35, '#4E2612'); g.addColorStop(1, '#2E1408');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-len / 2, -3.2); ctx.lineTo(len / 2, -3.2);
    ctx.ellipse(len / 2, 0, 1.6, 3.2, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-len / 2, 3.2);
    ctx.ellipse(-len / 2, 0, 1.6, 3.2, 0, Math.PI / 2, Math.PI * 1.5);
    ctx.fill();
    // 捲的螺紋
    ctx.strokeStyle = 'rgba(150,90,55,0.7)'; ctx.lineWidth = 0.6;
    for (let u = -len / 2 + 2.5; u < len / 2; u += 3.2) {
      ctx.beginPath(); ctx.moveTo(u, -3); ctx.quadraticCurveTo(u + 1.6, 0, u, 3); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,220,190,0.55)';
    ctx.fillRect(-len / 2 + 1, -2.4, len - 2, 0.9);
    // 端口
    ctx.fillStyle = '#5E3019';
    ctx.beginPath(); ctx.ellipse(-len / 2, 0, 1.6, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2E1408'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.ellipse(-len / 2, 0.2, 0.9, 1.9, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    // 底色先鋪滿整個外形，避免兩個切面交界露出細縫
    poly(ctx, outline());
    ctx.fillStyle = LADY_DK; ctx.fill();
    // 兩個切面
    drawFace(ctx, Lc, U, LU, true, 5, false);
    drawFace(ctx, F, [-V[0], -V[1]], LV, false, 9, true);
    drawTop(ctx);

    // 頂面上撒一點可可的巧克力捲片
    curl(ctx, 112, 54, 22, -0.32);
    curl(ctx, 96, 63, 17, 0.42);

    // 前角的直立稜線（受光面與背光面的交界）
    ctx.strokeStyle = 'rgba(255,245,230,0.55)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(F[0] - 0.8, F[1] + 2); ctx.lineTo(F[0] - 0.8, F[1] + H - 2); ctx.stroke();
    // 頂面與切面的交界
    ctx.strokeStyle = 'rgba(60,30,14,0.45)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(Lc[0], Lc[1]); ctx.lineTo(F[0], F[1]); ctx.lineTo(R[0], R[1]); ctx.stroke();

    // 外輪廓
    poly(ctx, outline());
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['tiramisu'] = {
    draw,
    crumbs: ['#6E4128', '#FFF7E6', '#9A6236', '#C08A55', '#4A2816'],
    crunchy: 0.15,
  };
})();
