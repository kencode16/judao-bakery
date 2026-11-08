/* 瑪德蓮（madeleine）・精緻擬真插畫風
 * 貝殼面朝上、斜放的瑪德蓮：上寬下窄的蛋形，從窄端放射出一道道貝殼稜紋，
 * 寬端邊緣一圈小波浪；中間淺奶油黃、往邊緣烤成金褐，下方看得到一點厚度。
 * 斜上方看（壓扁成平面透視），光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 96;
  const ROT = -0.5;     // 寬端朝右上
  const SY = 0.8;       // 透視壓扁（畫面垂直方向）
  const THICK = 11;     // 厚度（畫面單位）
  const A = 53, BL = 82;        // 半寬、半長
  const F = [0, 74];            // 稜紋放射中心（窄端附近）
  const NR = 11;                // 稜紋數
  const FAN = 1.3;             // 稜紋扇形半角

  // 蛋形外輪廓（區域座標：寬端在 -y）
  const OUT = [];
  (function () {
    const n = 220;
    for (let i = 0; i < n; i++) {
      const t = TAU * i / n;
      let x = A * Math.sin(t) * (1 + 0.2 * Math.cos(t));
      let y = -BL * Math.cos(t);
      // 稜紋末端在寬端外緣形成小波浪
      const ang = Math.atan2(x - F[0], -(y - F[1]));
      if (Math.abs(ang) < FAN + 0.12) {
        const ph = (ang + FAN) / (2 * FAN) * (NR - 1);
        const bump = Math.pow(Math.abs(Math.cos(Math.PI * ph)), 0.7);
        const w = Math.min(1, (FAN + 0.12 - Math.abs(ang)) / 0.3) * Math.min(1, (-y + 30) / 50);
        const dx = x - F[0], dy = y - F[1], d = Math.hypot(dx, dy);
        const k = 1 + 0.042 * bump * Math.max(0, w);
        x = F[0] + dx * k; y = F[1] + dy * k;
        void d;
      }
      OUT.push([x, y]);
    }
  })();
  function shellPath(ctx, k) {
    k = k || 1;
    const cx = 0, cy = -6;
    ctx.beginPath();
    OUT.forEach((p, i) => {
      const x = cx + (p[0] - cx) * k, y = cy + (p[1] - cy) * k;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
  }
  function frame(ctx, dy) {
    ctx.translate(CX, CY + (dy || 0));
    ctx.scale(1, SY);
    ctx.rotate(ROT);
  }
  // 稜紋方向
  function rayAng(k) { return -FAN + 2 * FAN * k / (NR - 1); }
  function rayDir(a) { return [Math.sin(a), -Math.cos(a)]; }

  /* ---------- 厚度（側面） ---------- */
  function drawSide(ctx) {
    for (let d = THICK; d >= 0.5; d -= 1) {
      ctx.save();
      frame(ctx, d);
      shellPath(ctx);
      const t = d / THICK;
      const c = [Math.round(196 - 60 * t), Math.round(118 - 50 * t), Math.round(44 - 24 * t)];
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.restore();
    }
    // 側面下緣輪廓
    ctx.save();
    frame(ctx, THICK);
    shellPath(ctx);
    ctx.restore();
    ctx.strokeStyle = 'rgba(110,50,14,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- 貝殼面 ---------- */
  function drawTop(ctx) {
    ctx.save();
    frame(ctx);
    shellPath(ctx);
    const g = ctx.createRadialGradient(-6, -10, 6, 0, -6, 86);
    g.addColorStop(0, '#FBE6A6');
    g.addColorStop(0.35, '#F7D486');
    g.addColorStop(0.65, '#EDB560');
    g.addColorStop(0.86, '#D68E38');
    g.addColorStop(1, '#B4692A');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    shellPath(ctx);
    ctx.clip();
    // 窄端烤得較深
    const nb = ctx.createRadialGradient(F[0], F[1] - 6, 2, F[0], F[1] - 6, 40);
    nb.addColorStop(0, 'rgba(176,96,30,0.55)');
    nb.addColorStop(1, 'rgba(176,96,30,0)');
    ctx.fillStyle = nb;
    ctx.fillRect(-60, 20, 120, 70);

    // 稜紋：每一道是隆起的長條，左側受光、右側背光
    const L = 170;
    for (let k = 0; k < NR - 1; k++) {
      const a0 = rayAng(k), a1 = rayAng(k + 1), am = (a0 + a1) / 2;
      const d0 = rayDir(a0), d1 = rayDir(a1), dm = rayDir(am);
      ctx.beginPath();
      ctx.moveTo(F[0], F[1]);
      ctx.lineTo(F[0] + d0[0] * L, F[1] + d0[1] * L);
      ctx.lineTo(F[0] + d1[0] * L, F[1] + d1[1] * L);
      ctx.closePath();
      // 垂直稜紋方向的漸層（取中段寬度）
      const m = [F[0] + dm[0] * 70, F[1] + dm[1] * 70];
      const p = [Math.cos(am), Math.sin(am)];
      const w = 70 * Math.tan(FAN / (NR - 1));
      const lg = ctx.createLinearGradient(m[0] - p[0] * w, m[1] - p[1] * w, m[0] + p[0] * w, m[1] + p[1] * w);
      // 畫面的左上光：依稜紋方向決定哪一側受光
      const lit = 0.55;
      lg.addColorStop(0, 'rgba(160,84,24,0.3)');
      lg.addColorStop(0.18, `rgba(255,246,214,${lit * 0.6})`);
      lg.addColorStop(0.45, 'rgba(255,240,200,0.14)');
      lg.addColorStop(0.78, 'rgba(170,92,28,0.16)');
      lg.addColorStop(1, 'rgba(150,76,20,0.42)');
      ctx.fillStyle = lg;
      ctx.fill();
    }
    // 溝線
    ctx.lineCap = 'round';
    for (let k = 0; k < NR; k++) {
      const d = rayDir(rayAng(k));
      const s0 = 18, s1 = 160;
      const gl = ctx.createLinearGradient(F[0] + d[0] * s0, F[1] + d[1] * s0, F[0] + d[0] * 120, F[1] + d[1] * 120);
      gl.addColorStop(0, 'rgba(150,76,20,0.15)');
      gl.addColorStop(0.5, 'rgba(150,76,20,0.45)');
      gl.addColorStop(1, 'rgba(140,68,16,0.6)');
      ctx.strokeStyle = gl;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(F[0] + d[0] * s0, F[1] + d[1] * s0);
      ctx.lineTo(F[0] + d[0] * s1, F[1] + d[1] * s1);
      ctx.stroke();
    }
    // 中心淡化（稜紋在窄端匯聚處變平）
    const c = ctx.createRadialGradient(F[0], F[1], 1, F[0], F[1], 26);
    c.addColorStop(0, 'rgba(214,140,60,0.9)');
    c.addColorStop(0.6, 'rgba(226,160,80,0.45)');
    c.addColorStop(1, 'rgba(230,170,90,0)');
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(F[0], F[1], 26, 0, TAU); ctx.fill();

    // 邊緣一圈烤得金褐
    ctx.strokeStyle = 'rgba(176,96,32,0.55)';
    ctx.lineWidth = 9;
    shellPath(ctx);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,74,20,0.5)';
    ctx.lineWidth = 3.5;
    shellPath(ctx);
    ctx.stroke();

    // 細小氣孔
    const r = K.rng(606);
    for (let i = 0; i < 60; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      const x = Math.sin(a) * A * 0.9 * d, y = -6 + Math.cos(a) * BL * 0.9 * d;
      ctx.fillStyle = r() < 0.5 ? 'rgba(180,104,36,0.28)' : 'rgba(255,248,220,0.4)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.5 + r() * 0.9, 0.4 + r() * 0.6, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();

    // 左上光澤（畫面座標）
    ctx.save();
    frame(ctx);
    shellPath(ctx, 0.98);
    ctx.restore();
    ctx.save();
    ctx.clip();
    const s = ctx.createRadialGradient(72, 62, 2, 72, 62, 50);
    s.addColorStop(0, 'rgba(255,252,236,0.5)');
    s.addColorStop(1, 'rgba(255,252,236,0)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, 200, 200);
    const dk = ctx.createLinearGradient(70, 60, 160, 160);
    dk.addColorStop(0.45, 'rgba(140,70,18,0)');
    dk.addColorStop(1, 'rgba(140,70,18,0.3)');
    ctx.fillStyle = dk;
    ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    ctx.save();
    frame(ctx);
    shellPath(ctx);
    ctx.restore();
    ctx.strokeStyle = 'rgba(130,62,16,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  window.DESSERTS['madeleine'] = {
    draw,
    crumbs: ['#F7D486', '#D68E38', '#FBE6A6', '#B4692A'],
    crunchy: 0.25,
  };
})();
