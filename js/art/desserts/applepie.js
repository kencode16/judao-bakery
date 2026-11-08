/* 蘋果派（Apple pie）
 * 斜上 45 度的一整個圓派：上面是一條條交錯編織的格子派皮（刷蛋液、撒砂糖），
 * 格子縫裡看得到琥珀色的肉桂蘋果餡和焦糖汁，外圈是捏出波浪花邊的厚派緣，側面有派盤壓出的直紋。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 90;                    // 頂面中心
  const KP = 0.56;                             // 俯視壓扁
  const OUT = 84, IN = 68;                     // 派緣外圈、內圈半徑
  const BOT = { cy: 124, rx: 74, ry: 40 };     // 派底
  const SY = CY + 0;

  const E = (r, th, z) => [CX + Math.cos(th) * r, CY + Math.sin(th) * r * KP - (z || 0)];

  /* ---------- 側面：派盤壓出的直紋 ---------- */
  function sidePath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const p = E(OUT, Math.PI * i / 60); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 60; i >= 0; i--) { const th = Math.PI * i / 60; ctx.lineTo(CX + Math.cos(th) * BOT.rx, BOT.cy + Math.sin(th) * BOT.ry); }
    ctx.closePath();
  }
  function drawSide(ctx) {
    sidePath(ctx);
    const g = ctx.createLinearGradient(CX - OUT, 0, CX + OUT, 0);
    g.addColorStop(0, '#E2A24E');
    g.addColorStop(0.35, '#D18D3A');
    g.addColorStop(0.75, '#B06C24');
    g.addColorStop(1, '#8C4E16');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    sidePath(ctx); ctx.clip();
    // 直紋
    const N = 22;
    for (let k = 0; k <= N; k++) {
      const th = Math.PI * k / N;
      const t = [CX + Math.cos(th) * OUT, CY + Math.sin(th) * OUT * KP];
      const b = [CX + Math.cos(th) * BOT.rx, BOT.cy + Math.sin(th) * BOT.ry];
      ctx.strokeStyle = 'rgba(110,55,15,0.35)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      const th2 = th + 0.05;
      const t2 = [CX + Math.cos(th2) * OUT, CY + Math.sin(th2) * OUT * KP];
      const b2 = [CX + Math.cos(th2) * BOT.rx, BOT.cy + Math.sin(th2) * BOT.ry];
      ctx.strokeStyle = 'rgba(255,215,150,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
    }
    // 底部烤深
    const gb = ctx.createLinearGradient(0, BOT.cy, 0, BOT.cy + BOT.ry);
    gb.addColorStop(0, 'rgba(100,45,10,0)');
    gb.addColorStop(1, 'rgba(100,45,10,0.45)');
    ctx.fillStyle = gb; ctx.fillRect(0, BOT.cy - 10, 200, 60);
    ctx.restore();
    sidePath(ctx);
    ctx.strokeStyle = 'rgba(110,55,15,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }

  /* ---------- 內餡：肉桂蘋果 ---------- */
  function innerPath(ctx, r) {
    ctx.beginPath(); ctx.ellipse(CX, CY, r, r * KP, 0, 0, TAU);
  }
  function drawFilling(ctx) {
    innerPath(ctx, IN + 4);
    const g = ctx.createRadialGradient(CX - 20, CY - 10, 4, CX, CY, IN + 4);
    g.addColorStop(0, '#C9802C');
    g.addColorStop(0.6, '#A85E1A');
    g.addColorStop(1, '#7E400E');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    innerPath(ctx, IN + 4); ctx.clip();
    // 一塊塊煮軟的蘋果（圓角小塊，頂面受光）＋焦糖汁
    const rnd = K.rng(1776);
    for (let i = 0; i < 40; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * IN;
      const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * KP;
      const w = 4.5 + rnd() * 3, h = 3 + rnd() * 2, rot = (rnd() - 0.5) * 1.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(90,40,5,0.45)';
      ctx.beginPath(); ctx.ellipse(1, 1.4, w, h, 0, 0, TAU); ctx.fill();
      const g2 = ctx.createLinearGradient(-w, -h, w, h);
      g2.addColorStop(0, '#F9DA88'); g2.addColorStop(0.6, '#E7B04E'); g2.addColorStop(1, '#C27E2C');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,225,0.6)';
      ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.35, w * 0.4, h * 0.25, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * IN;
      ctx.fillStyle = `rgba(150,70,15,${0.25 + rnd() * 0.3})`;
      ctx.beginPath(); ctx.ellipse(CX + Math.cos(a) * r, CY + Math.sin(a) * r * KP, 2 + rnd() * 4, 1 + rnd() * 2, 0, 0, TAU); ctx.fill();
    }
    // 焦糖汁的亮點
    for (let i = 0; i < 20; i++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * IN;
      ctx.fillStyle = 'rgba(255,240,200,0.7)';
      ctx.beginPath(); ctx.ellipse(CX + Math.cos(a) * r, CY + Math.sin(a) * r * KP, 1.2, 0.7, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 格子派皮（在平面座標裡編織） ---------- */
  const SW = 14, GAP = 29;                  // 派皮條寬、間距
  const ROT = Math.PI / 4;
  const CS = [-2, -1, 0, 1, 2].map(i => i * GAP + 1);   // 條的中心
  function stripGrad(ctx, horiz, c) {
    const g = horiz ? ctx.createLinearGradient(0, c - SW / 2, 0, c + SW / 2) : ctx.createLinearGradient(c - SW / 2, 0, c + SW / 2, 0);
    g.addColorStop(0, '#C98736');
    g.addColorStop(0.25, '#F0BD68');
    g.addColorStop(0.5, '#F8D088');
    g.addColorStop(0.8, '#E3A552');
    g.addColorStop(1, '#B06A22');
    return g;
  }
  function stripA(ctx, i, x0, x1) {     // 沿本地 x 的條
    const c = CS[i];
    ctx.fillStyle = stripGrad(ctx, true, c);
    ctx.beginPath(); ctx.roundRect ? ctx.rect(x0, c - SW / 2, x1 - x0, SW) : ctx.rect(x0, c - SW / 2, x1 - x0, SW); ctx.fill();
  }
  function stripB(ctx, j, y0, y1) {     // 沿本地 y 的條
    const c = CS[j];
    ctx.fillStyle = stripGrad(ctx, false, c);
    ctx.beginPath(); ctx.rect(c - SW / 2, y0, SW, y1 - y0); ctx.fill();
  }
  function drawLattice(ctx) {
    ctx.save();
    innerPath(ctx, IN + 5); ctx.clip();
    ctx.translate(CX, CY); ctx.scale(1, KP); ctx.rotate(ROT);
    const L = 100;
    // A 組（有影子落在內餡上）
    CS.forEach((c, i) => {
      ctx.fillStyle = 'rgba(90,40,5,0.35)';
      ctx.fillRect(-L, c - SW / 2 + 2.5, 2 * L, SW);
      stripA(ctx, i, -L, L);
    });
    // B 組蓋上去（影子落在 A 條與內餡上）
    CS.forEach((c, j) => {
      ctx.fillStyle = 'rgba(90,40,5,0.3)';
      ctx.fillRect(c - SW / 2 + 2.2, -L, SW, 2 * L);
      stripB(ctx, j, -L, L);
    });
    // 編織：(i+j) 偶數的交叉點 A 在上
    CS.forEach((ca, i) => CS.forEach((cb, j) => {
      if ((i + j) % 2) return;
      ctx.fillStyle = 'rgba(90,40,5,0.32)';
      ctx.fillRect(cb - SW / 2, ca + SW / 2, SW, 2.2);
      stripA(ctx, i, cb - SW / 2 - 0.5, cb + SW / 2 + 0.5);
    }));
    // 條邊的細線（讓縮小時格子更清楚）
    ctx.strokeStyle = 'rgba(130,65,15,0.5)'; ctx.lineWidth = 0.9;
    CS.forEach(c => {
      ctx.beginPath(); ctx.moveTo(-L, c + SW / 2); ctx.lineTo(L, c + SW / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c + SW / 2, -L); ctx.lineTo(c + SW / 2, L); ctx.stroke();
    });
    // 砂糖顆粒
    const rnd = K.rng(31);
    for (let i = 0; i < 140; i++) {
      const horiz = rnd() < 0.5, k = Math.floor(rnd() * CS.length);
      const along = (rnd() - 0.5) * 150, across = CS[k] + (rnd() - 0.5) * SW * 0.8;
      const x = horiz ? along : across, y = horiz ? across : along;
      ctx.fillStyle = `rgba(255,252,240,${0.5 + rnd() * 0.5})`;
      ctx.fillRect(x, y, 0.9, 0.9);
    }
    ctx.restore();
    // 整體受光：左上亮、右下暗
    ctx.save();
    innerPath(ctx, IN + 5); ctx.clip();
    const g = ctx.createLinearGradient(CX - IN, CY - IN * KP, CX + IN, CY + IN * KP);
    g.addColorStop(0, 'rgba(255,240,200,0.28)');
    g.addColorStop(0.5, 'rgba(255,240,200,0)');
    g.addColorStop(1, 'rgba(90,40,5,0.25)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  /* ---------- 波浪派緣：連續的厚邊，用手指捏出一道道斜向凹痕 ---------- */
  const CRIMPS = 34;
  const wav = th => 1.6 * Math.cos(th * CRIMPS);                // 外緣的波浪
  function rimPath(ctx, z) {
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const th = TAU * i / 240;
      const p = E(OUT + wav(th), th, z);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    for (let i = 240; i >= 0; i--) {
      const th = TAU * i / 240;
      const p = E(IN - 0.5 * wav(th), th, z);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function drawRim(ctx) {
    // 內緣陰影（派緣在格子上投影）
    ctx.save();
    innerPath(ctx, IN + 1); ctx.clip();
    ctx.strokeStyle = 'rgba(90,40,5,0.4)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(CX + 1, CY + 3, IN, IN * KP, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    ctx.restore();
    // 派緣厚度（往下一點的暗色）
    rimPath(ctx, 0);
    ctx.fillStyle = '#A9621F'; ctx.fill();
    // 派緣頂面：圓鼓鼓的環
    rimPath(ctx, 3.5);
    const g = ctx.createLinearGradient(CX - OUT, CY - OUT * KP, CX + OUT, CY + OUT * KP);
    g.addColorStop(0, '#F4C877');
    g.addColorStop(0.45, '#E2A553');
    g.addColorStop(1, '#B46E26');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    rimPath(ctx, 3.5); ctx.clip();
    // 環的圓鼓：中線亮、內外緣暗
    ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(255,236,190,0.5)';
    ctx.beginPath(); ctx.ellipse(CX - 1, CY - 4.5, (OUT + IN) / 2, (OUT + IN) / 2 * KP, 0, 0, TAU); ctx.stroke();
    // 一道道斜向的捏痕（凹溝＋旁邊的亮邊）
    for (let k = 0; k < CRIMPS; k++) {
      const th = (k + 0.5) / CRIMPS * TAU;
      const front = Math.sin(th);
      const p0 = E(IN - 1, th - 0.05, 3.5), p1 = E(OUT + 1, th + 0.06, 3.5);
      ctx.strokeStyle = `rgba(110,50,10,${0.45 + 0.2 * Math.max(0, front)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      const q0 = E(IN - 1, th - 0.1, 3.5), q1 = E(OUT + 1, th + 0.01, 3.5);
      ctx.strokeStyle = 'rgba(255,230,180,0.55)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
    }
    // 砂糖顆粒
    const rnd = K.rng(61);
    for (let i = 0; i < 90; i++) {
      const th = rnd() * TAU, r = IN + rnd() * (OUT - IN);
      const p = E(r, th, 3.5);
      ctx.fillStyle = `rgba(255,252,240,${0.4 + rnd() * 0.5})`;
      ctx.fillRect(p[0], p[1], 0.9, 0.9);
    }
    ctx.restore();
    // 頂環與厚度之間的前緣亮線、外輪廓
    ctx.strokeStyle = 'rgba(110,55,15,0.75)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const th = Math.PI + Math.PI * i / 120; const p = E(OUT + wav(th), th, 3.5); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130,65,15,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) { const th = TAU * i / 240; const p = E(IN - 0.5 * wav(th), th, 3.5); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawFilling(ctx);
    drawLattice(ctx);
    drawRim(ctx);
  }

  window.DESSERTS['applepie'] = {
    draw,
    crumbs: ['#EDB662', '#F6D27C', '#C07A2E', '#DFA048', '#FBE3B0'],
    crunchy: 0.75,
  };
})();
