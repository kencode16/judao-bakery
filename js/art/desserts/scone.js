/* 司康（Scone）
 * 斜上 45 度的一顆英式司康：矮圓柱、頂面刷蛋液烤成亮金褐，腰部有烤時膨脹裂開的「狼口」，
 * 下半部淺金色。頂上一大匙凝脂奶油（Clotted cream），再疊一匙亮紅草莓果醬（德文郡吃法）。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const T = { cy: 96, rx: 70, ry: 32 };    // 頂面邊緣
  const B = { cy: 144, rx: 72, ry: 33 };   // 底面
  const WAIST = 0.40;                        // 狼口高度（0 頂、1 底）

  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const nTop = makeNoise(3, 1.6, [3, 5, 9, 14]);     // 頂緣不平
  const nBot = makeNoise(8, 1.1, [4, 7, 12]);
  const nWaist = makeNoise(13, 2.2, [6, 11, 19, 27]);
  const nWaist2 = makeNoise(17, 1.6, [7, 13, 23]);

  // 側面上的點：θ 角度、t 高度比例
  function sideP(th, t) {
    const n = nTop(th) * (1 - t) + nBot(th) * t;
    const bulge = 3.5 * Math.sin(Math.PI * t) + (t > WAIST - 0.06 && t < WAIST + 0.1 ? 1.5 : 0);
    const rx = T.rx + (B.rx - T.rx) * t + n + bulge;
    const ry = T.ry + (B.ry - T.ry) * t + (n + bulge) * 0.5;
    const cy = T.cy + (B.cy - T.cy) * t;
    return [CX + Math.cos(th) * rx, cy + Math.sin(th) * ry];
  }
  const topP = th => [CX + Math.cos(th) * (T.rx + nTop(th)), T.cy + Math.sin(th) * (T.ry + nTop(th) * 0.5)];

  function silhouette(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const th = Math.PI + Math.PI * i / 80;
      const p = topP(th); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    for (let i = 0; i <= 20; i++) { const p = sideP(0, i / 20); ctx.lineTo(p[0], p[1]); }
    for (let i = 0; i <= 80; i++) { const p = sideP(Math.PI * i / 80, 1); ctx.lineTo(p[0], p[1]); }
    for (let i = 20; i >= 0; i--) { const p = sideP(Math.PI, i / 20); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  // 側面上一條帶狀區域（t0(θ)～t1(θ)）
  function band(ctx, f0, f1) {
    ctx.beginPath();
    const N = 90;
    for (let i = 0; i <= N; i++) { const th = Math.PI * i / N; const p = sideP(th, f0(th)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = N; i >= 0; i--) { const th = Math.PI * i / N; const p = sideP(th, f1(th)); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  const wTop = th => WAIST - 0.07 + nWaist(th) * 0.012;
  const wBot = th => WAIST + 0.08 + nWaist2(th) * 0.012;

  /* ---------- 側面 ---------- */
  function drawSide(ctx) {
    // 下半部：淺金色
    silhouette(ctx);
    let g = ctx.createLinearGradient(CX - 72, 0, CX + 72, 0);
    g.addColorStop(0, '#F6DEA6');
    g.addColorStop(0.35, '#F0D093');
    g.addColorStop(0.75, '#DDB06C');
    g.addColorStop(1, '#C4904E');
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    silhouette(ctx); ctx.clip();
    // 底部烤色
    const gb = ctx.createLinearGradient(0, B.cy + 10, 0, B.cy + B.ry + 2);
    gb.addColorStop(0, 'rgba(160,90,30,0)');
    gb.addColorStop(1, 'rgba(150,80,25,0.7)');
    ctx.fillStyle = gb; ctx.fillRect(0, B.cy, 200, 60);

    // 上半部：刷蛋液的金褐外皮（從頂緣包到狼口）
    band(ctx, () => -0.05, wTop);
    g = ctx.createLinearGradient(CX - 72, 0, CX + 72, 0);
    g.addColorStop(0, '#E2A453');
    g.addColorStop(0.3, '#D38D3A');
    g.addColorStop(0.75, '#B56C25');
    g.addColorStop(1, '#93511A');
    ctx.fillStyle = g; ctx.fill();
    // 上半部往下漸淡
    band(ctx, th => wTop(th) - 0.12, wTop);
    ctx.fillStyle = 'rgba(240,200,130,0.25)'; ctx.fill();

    // 狼口：裂開露出的鬆軟內裡
    band(ctx, wTop, wBot);
    g = ctx.createLinearGradient(CX - 72, 0, CX + 72, 0);
    g.addColorStop(0, '#FBE7BE');
    g.addColorStop(0.5, '#F3D69E');
    g.addColorStop(1, '#D7AE6C');
    ctx.fillStyle = g; ctx.fill();
    // 狼口內的組織（小孔、毛邊）
    const rnd = K.rng(29);
    for (let i = 0; i < 150; i++) {
      const th = 0.06 + rnd() * (Math.PI - 0.12);
      const t = wTop(th) + rnd() * (wBot(th) - wTop(th));
      const p = sideP(th, t);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(190,130,60,0.45)' : 'rgba(255,248,225,0.7)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.6 + rnd() * 1.2, 0.5 + rnd() * 0.7, 0, 0, TAU); ctx.fill();
    }
    // 上半部外皮在狼口上方投下的陰影
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) { const th = Math.PI * i / 90; const p = sideP(th, wTop(th)); i ? ctx.lineTo(p[0], p[1] + 1.2) : ctx.moveTo(p[0], p[1] + 1.2); }
    ctx.strokeStyle = 'rgba(120,65,20,0.55)'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) { const th = Math.PI * i / 90; const p = sideP(th, wTop(th)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.strokeStyle = 'rgba(110,55,15,0.85)'; ctx.lineWidth = 1.1; ctx.stroke();
    // 狼口下緣的淡陰影
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) { const th = Math.PI * i / 90; const p = sideP(th, wBot(th)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.strokeStyle = 'rgba(170,110,50,0.55)'; ctx.lineWidth = 1; ctx.stroke();

    // 粗糙的表面顆粒
    const rs = K.rng(41);
    for (let i = 0; i < 170; i++) {
      const th = 0.05 + rs() * (Math.PI - 0.1);
      const t = rs();
      if (t > wTop(th) - 0.01 && t < wBot(th) + 0.01) continue;
      const p = sideP(th, t);
      const lit = Math.cos(th) < 0;
      ctx.fillStyle = rs() < 0.55 ? `rgba(130,70,20,${t < WAIST ? 0.4 : 0.28})` : `rgba(255,235,190,${lit ? 0.5 : 0.25})`;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.7 + rs() * 1.4, 0.5 + rs() * 0.8, 0, 0, TAU); ctx.fill();
    }
    // 右側陰影、左側柔光
    const gs = ctx.createLinearGradient(CX - 70, 0, CX + 70, 0);
    gs.addColorStop(0, 'rgba(255,240,210,0.22)');
    gs.addColorStop(0.4, 'rgba(255,240,210,0)');
    gs.addColorStop(0.75, 'rgba(90,40,10,0)');
    gs.addColorStop(1, 'rgba(90,40,10,0.3)');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function topPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const p = topP(TAU * i / 120); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(CX - 22, T.cy - 14, 4, CX, T.cy, T.rx * 1.05);
    g.addColorStop(0, '#F2BC6C');
    g.addColorStop(0.55, '#DB9842');
    g.addColorStop(1, '#B46C24');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 蛋液烤色斑駁
    const rnd = K.rng(57);
    for (let i = 0; i < 40; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd());
      const x = CX + Math.cos(a) * r * T.rx * 0.95, y = T.cy + Math.sin(a) * r * T.ry * 0.95;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(140,70,15,0.25)' : 'rgba(255,215,150,0.25)';
      ctx.beginPath(); ctx.ellipse(x, y, 3 + rnd() * 6, 1.5 + rnd() * 3, 0, 0, TAU); ctx.fill();
    }
    // 邊緣圓角：外圈稍亮（從側面翻上來的烤色）
    ctx.strokeStyle = 'rgba(255,220,160,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX - 1, T.cy - 1, T.rx - 3, T.ry - 2, 0, Math.PI * 0.9, Math.PI * 1.7); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 凝脂奶油 ---------- */
  const CR = { x: 101, y: 96, rx: 52, ry: 24, h: 29 };
  const nCream = makeNoise(71, 3.4, [3, 5, 7, 11]);
  function creamPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const th = TAU * i / 100;
      const n = nCream(th);
      const s = Math.sin(th);
      const lift = s < 0 ? CR.h * Math.pow(-s, 0.8) : 0;         // 後半部是隆起的頂，往上抬
      const x = CR.x + Math.cos(th) * (CR.rx + n);
      const y = CR.y + s * (CR.ry + n * 0.5) - lift - (s < 0 ? 0 : 0);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawCream(ctx) {
    // 接觸陰影
    ctx.save();
    topPath(ctx); ctx.clip();
    const gs = ctx.createRadialGradient(CR.x + 6, CR.y + 8, 10, CR.x + 6, CR.y + 8, CR.rx + 10);
    gs.addColorStop(0, 'rgba(110,55,15,0.5)');
    gs.addColorStop(1, 'rgba(110,55,15,0)');
    ctx.fillStyle = gs;
    ctx.beginPath(); ctx.ellipse(CR.x + 6, CR.y + 8, CR.rx + 10, CR.ry + 6, 0, 0, TAU); ctx.fill();
    ctx.restore();

    creamPath(ctx);
    const g = ctx.createRadialGradient(CR.x - 18, CR.y - CR.h - 2, 2, CR.x - 2, CR.y - CR.h * 0.5, CR.rx * 1.15);
    g.addColorStop(0, '#FFFDF4');
    g.addColorStop(0.5, '#FFF3D0');
    g.addColorStop(0.85, '#F4DC9E');
    g.addColorStop(1, '#E2C07A');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    creamPath(ctx); ctx.clip();
    // 湯匙挖出的弧形紋路
    ctx.lineCap = 'round';
    const ridges = [[-24, -18, 20, 0.3], [-8, -6, 30, 0.1], [16, -14, 18, -0.2], [0, 6, 36, 0.04], [24, -2, 16, -0.3]];
    ridges.forEach(([dx, dy, r, rot]) => {
      ctx.strokeStyle = 'rgba(215,175,105,0.55)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(CR.x + dx, CR.y + dy, r, r * 0.38, rot, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,250,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(CR.x + dx - 0.8, CR.y + dy - 1.4, r, r * 0.38, rot, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    });
    // 凝脂奶油特有的淡黃「皮」
    const rnd = K.rng(88);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.8;
      ctx.fillStyle = 'rgba(240,200,110,0.28)';
      ctx.beginPath(); ctx.ellipse(CR.x + Math.cos(a) * r * CR.rx, CR.y - 6 + Math.sin(a) * r * CR.ry, 4 + rnd() * 5, 2 + rnd() * 2, 0, 0, TAU); ctx.fill();
    }
    // 底部暗邊
    const gd = ctx.createLinearGradient(0, CR.y + 4, 0, CR.y + CR.ry + 3);
    gd.addColorStop(0, 'rgba(200,150,80,0)');
    gd.addColorStop(1, 'rgba(190,140,70,0.45)');
    ctx.fillStyle = gd; ctx.fillRect(0, CR.y, 200, 40);
    ctx.restore();
    creamPath(ctx);
    ctx.strokeStyle = 'rgba(190,140,70,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  /* ---------- 草莓果醬 ---------- */
  const J = { x: 100, y: 72, rx: 33, ry: 15.5 };
  const nJam = makeNoise(97, 1.3, [2, 5, 7]);
  function jamPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const th = TAU * i / 120;
      const n = nJam(th);
      // 前方兩道順著奶油往下流的果醬
      const drip = Math.exp(-Math.pow((th - 2.05) / 0.17, 2)) * 13 + Math.exp(-Math.pow((th - 0.95) / 0.12, 2)) * 6;
      const x = J.x + Math.cos(th) * (J.rx + n);
      const y = J.y + Math.sin(th) * (J.ry + n * 0.45) + (Math.sin(th) > 0 ? drip : 0);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawJam(ctx) {
    // 果醬在奶油上的影子
    ctx.save();
    creamPath(ctx); ctx.clip();
    ctx.translate(3, 3);
    jamPath(ctx); ctx.fillStyle = 'rgba(150,60,40,0.25)'; ctx.fill();
    ctx.restore();

    jamPath(ctx);
    const g = ctx.createRadialGradient(J.x - 10, J.y - 6, 1, J.x, J.y, J.rx * 1.2);
    g.addColorStop(0, '#F2364E');
    g.addColorStop(0.45, '#D11633');
    g.addColorStop(0.85, '#A50D26');
    g.addColorStop(1, '#7E0A1D');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    jamPath(ctx); ctx.clip();
    // 草莓果肉塊
    const rnd = K.rng(101);
    const bits = [[-15, -1, 8, 5, 0.3], [8, -6, 9, 5.5, -0.4], [-1, 7, 7, 4.5, 0.1], [19, 4, 5.5, 3.8, 0.6]];
    bits.forEach(([dx, dy, w, h, r]) => {
      ctx.save(); ctx.translate(J.x + dx, J.y + dy); ctx.rotate(r);
      ctx.fillStyle = '#B0122C';
      ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,130,0.55)';
      ctx.beginPath(); ctx.ellipse(-w * 0.25, -h * 0.3, w * 0.55, h * 0.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F5D27A';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse((rnd() - 0.5) * w, (rnd() - 0.5) * h, 0.6, 0.45, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    // 果醬光澤
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(J.x - 11, J.y - 6, 7, 2.2, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(J.x + 9, J.y - 7, 2.2, 1.1, -0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(J.x - 13, J.y + 18, 1.4, 2.4, 0.2, 0, TAU); ctx.fill();
    ctx.restore();
    jamPath(ctx);
    ctx.strokeStyle = 'rgba(110,8,22,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    // 頂緣與側面交界的亮線（左前）
    ctx.strokeStyle = 'rgba(255,215,150,0.5)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const th = Math.PI * 0.45 + Math.PI * 0.5 * i / 40; const p = topP(th); i ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1); }
    ctx.stroke();
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(110,55,15,0.7)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
    drawCream(ctx);
    drawJam(ctx);
  }

  window.DESSERTS['scone'] = {
    draw,
    crumbs: ['#CC8434', '#F3D69E', '#FFF3D0', '#D11633', '#E9BE78'],
    crunchy: 0.45,
  };
})();
