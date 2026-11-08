/* 法式長棍麵包（baguette）・精緻擬真插畫風
 * 一條細長、兩端微尖的麵包斜放（左下→右上），斜上 45 度看。
 * 金褐硬皮＋ 5 道斜劃痕（grigne）：每道劃痕裂開露出淺金色的內皮，一側翹起深色「耳朵」。
 * 光源左上：麵包上緣亮、下緣暗，兩端烤得較深。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何（區域座標：u 沿長軸、v 垂直長軸，v<0 是朝光的上緣） ---------- */
  const CX = 100, CY = 101, ROT = -0.6;   // 斜放角度
  const L = 89;                           // 半長
  const W = 25.5;                           // 最粗處半寬
  const BOW = 3.5;                        // 微微彎（中間往下鼓）

  function half(u) {
    const r = Math.min(1, Math.abs(u) / L);
    return W * Math.pow(1 - Math.pow(r, 2.1), 0.68);
  }
  function mid(u) { const r = u / L; return BOW * (1 - r * r); }
  const N = 120;
  function loafPath(ctx, grow) {
    grow = grow || 0;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = -L + 2 * L * i / N;
      const p = [u, mid(u) - half(u) - grow];
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    for (let i = N; i >= 0; i--) {
      const u = -L + 2 * L * i / N;
      ctx.lineTo(u, mid(u) + half(u) + grow);
    }
    ctx.closePath();
  }

  /* ---------- 劃痕 ---------- */
  // c：中心 u；len：長；ang：與長軸夾角；wd：裂開寬度
  const CUTS = [
    { c: -57, len: 37, ang: 0.27, wd: 9.0 },
    { c: -28.5, len: 42, ang: 0.27, wd: 10.5 },
    { c: 0, len: 43, ang: 0.27, wd: 11 },
    { c: 28.5, len: 42, ang: 0.27, wd: 10.5 },
    { c: 57, len: 37, ang: 0.27, wd: 9.0 },
  ];
  // 劃痕的「葉形」：沿自己的方向 s∈[-1,1]，寬度 wd·(1-s²)^0.8；中線稍微往朝光側偏
  function cutFrame(ct) {
    const v0 = mid(ct.c) - 2.5;
    return { x: ct.c, y: v0, ca: Math.cos(-ct.ang), sa: Math.sin(-ct.ang) };
  }
  function cutPt(ct, f, s, side) {
    const w = ct.wd * Math.pow(Math.max(0, 1 - s * s), 0.8) * 0.5;
    const lx = s * ct.len / 2, ly = side * w;
    return [f.x + lx * f.ca - ly * f.sa, f.y + lx * f.sa + ly * f.ca];
  }
  function cutPath(ctx, ct, f, k) {
    k = k === undefined ? 1 : k;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const s = -1 + 2 * i / 24;
      const p = cutPt(ct, f, s, -k);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    for (let i = 24; i >= 0; i--) {
      const s = -1 + 2 * i / 24;
      const p = cutPt(ct, f, s, k);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function edge(ctx, ct, f, side, s0, s1, off) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const s = s0 + (s1 - s0) * i / 20;
      const p = cutPt(ct, f, s, side);
      const q = [p[0] - f.sa * off, p[1] + f.ca * off];
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
  }

  /* ---------- 麵包皮 ---------- */
  function drawCrust(ctx) {
    loafPath(ctx);
    const g = ctx.createLinearGradient(0, -W, 0, W + BOW);
    g.addColorStop(0, '#E9A447');
    g.addColorStop(0.18, '#F3BE62');
    g.addColorStop(0.36, '#E6A24A');
    g.addColorStop(0.62, '#CB7A2C');
    g.addColorStop(0.86, '#A65A1C');
    g.addColorStop(1, '#7E3F12');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    loafPath(ctx);
    ctx.clip();
    // 兩端烤得較深
    for (const s of [-1, 1]) {
      const rg = ctx.createRadialGradient(s * L, 0, 2, s * L, 0, 46);
      rg.addColorStop(0, 'rgba(110,50,12,0.75)');
      rg.addColorStop(0.5, 'rgba(140,66,18,0.35)');
      rg.addColorStop(1, 'rgba(150,70,20,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(s * L - 50, -40, 100, 80);
    }
    // 下緣陰影帶
    ctx.strokeStyle = 'rgba(96,42,10,0.35)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = -L + 2 * L * i / N;
      const y = mid(u) + half(u) + 1.5;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    // 上緣的亮脊（反光）
    ctx.strokeStyle = 'rgba(255,232,170,0.45)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const u = -L * 0.82 + 1.64 * L * i / 60;
      const y = mid(u) - half(u) * 0.62;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    // 細小的烤色斑點、氣泡、麵粉
    const r = K.rng(311);
    for (let i = 0; i < 140; i++) {
      const u = (r() * 2 - 1) * L * 0.95;
      const h = half(u);
      const v = mid(u) + (r() * 2 - 1) * h * 0.92;
      const t = r();
      if (t < 0.45) ctx.fillStyle = `rgba(120,56,14,${0.18 + r() * 0.2})`;
      else if (t < 0.85) ctx.fillStyle = `rgba(255,214,140,${0.2 + r() * 0.25})`;
      else ctx.fillStyle = `rgba(255,248,232,${0.3 + r() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(u, v, 0.6 + r() * 1.6, 0.4 + r() * 0.9, r() * Math.PI, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCuts(ctx) {
    ctx.save();
    loafPath(ctx, -1.5);
    ctx.clip();
    for (const ct of CUTS) {
      const f = cutFrame(ct);
      // 耳朵外側烤得較深的一道（劃痕之間的硬皮）
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(128,58,14,0.32)';
      ctx.lineWidth = 6;
      edge(ctx, ct, f, 1, -0.8, 0.85, 3.2);
      ctx.stroke();
      ctx.restore();
      // 劃痕下方（耳朵翹起的那一側）先畫一點陰影
      ctx.fillStyle = 'rgba(90,40,10,0.35)';
      cutPath(ctx, ct, f, 1.18);
      ctx.save(); ctx.translate(0.6, 1.6); ctx.fill(); ctx.restore();
      // 裂開露出的淺金色內皮
      cutPath(ctx, ct, f);
      const p0 = cutPt(ct, f, 0, -1), p1 = cutPt(ct, f, 0, 1);
      const g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      g.addColorStop(0, '#FBE6B0');
      g.addColorStop(0.45, '#F4D08A');
      g.addColorStop(0.8, '#E3AE5E');
      g.addColorStop(1, '#B8722E');
      ctx.fillStyle = g;
      ctx.fill();
      // 內皮的粗糙紋（沿劃痕方向）
      ctx.save();
      cutPath(ctx, ct, f);
      ctx.clip();
      const r = K.rng(900 + ct.c);
      for (let i = 0; i < 10; i++) {
        const s0 = -0.85 + r() * 1.3, s1 = s0 + 0.15 + r() * 0.35;
        const side = (r() * 2 - 1) * 0.6;
        ctx.strokeStyle = r() < 0.5 ? 'rgba(255,250,225,0.55)' : 'rgba(190,120,50,0.35)';
        ctx.lineWidth = 0.6 + r() * 0.5;
        edge(ctx, ct, f, side, s0, Math.min(0.9, s1), 0);
        ctx.stroke();
      }
      ctx.restore();
      // 耳朵：下側翹起的深色硬皮邊
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(112,50,12,0.85)';
      ctx.lineWidth = 2.2;
      edge(ctx, ct, f, 1, -0.92, 0.95, 0);
      ctx.stroke();
      // 耳朵頂端的反光
      ctx.strokeStyle = 'rgba(255,214,140,0.7)';
      ctx.lineWidth = 1.2;
      edge(ctx, ct, f, 1, -0.7, 0.8, 1.6);
      ctx.stroke();
      // 上側切口的細縫
      ctx.strokeStyle = 'rgba(150,80,24,0.45)';
      ctx.lineWidth = 0.9;
      edge(ctx, ct, f, -1, -0.9, 0.9, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(ROT);
    drawCrust(ctx);
    drawCuts(ctx);
    // 外輪廓細線
    loafPath(ctx);
    ctx.strokeStyle = 'rgba(105,46,12,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  window.DESSERTS['baguette'] = {
    draw,
    crumbs: ['#C9782E', '#F4D08A', '#A65A1C', '#FBE6B0', '#E6A24A'],
    crunchy: 0.95,
  };
})();
