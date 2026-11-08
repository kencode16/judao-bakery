/* 義式冰淇淋（Gelato）
 * 金黃格紋的威化甜筒，上面兩球粉彩冰淇淋：下層開心果（淡綠）、上層草莓（粉紅）。
 * 球面有小鏟子抹出的弧形紋路，下緣是壓出來的波浪裙邊，開心果球有一點融化往下滴。
 * 甜筒微微傾斜、光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CONE = { x: 98, y: 120, rx: 36, ry: 11, tipX: 104, tipY: 178 };
  const SCOOP1 = { x: 95, y: 103, r: 43, seed: 3,                          // 開心果
    base: '#B9DB8C', lt: '#E4F4C6', dk: '#7FAE55', edge: 'rgba(80,120,45,0.8)', bits: ['#6E9B3E', '#9A7A4E', '#5C8A34'] };
  const SCOOP2 = { x: 105, y: 61, r: 38, seed: 11,                         // 草莓
    base: '#F7A9BE', lt: '#FFE0E8', dk: '#E0718E', edge: 'rgba(180,70,100,0.8)', bits: ['#D93A5E', '#C42850', '#F06A88'] };

  /* ---------- 甜筒 ---------- */
  function conePath(ctx) {
    const c = CONE;
    ctx.beginPath();
    ctx.moveTo(c.x - c.rx, c.y);
    ctx.quadraticCurveTo(c.x - c.rx * 0.5, c.y + 34, c.tipX - 2, c.tipY - 2);
    ctx.quadraticCurveTo(c.tipX, c.tipY + 1, c.tipX + 2, c.tipY - 2);
    ctx.quadraticCurveTo(c.x + c.rx * 0.55, c.y + 34, c.x + c.rx, c.y);
    ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI, false);
    ctx.closePath();
  }
  function drawCone(ctx) {
    const c = CONE;
    conePath(ctx);
    const g = ctx.createLinearGradient(c.x - c.rx, 0, c.x + c.rx, 0);
    g.addColorStop(0, '#E2AC62'); g.addColorStop(0.3, '#F2C47E'); g.addColorStop(0.65, '#D79A50'); g.addColorStop(1, '#A86A2C');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    conePath(ctx); ctx.clip();
    // 威化格紋：兩組斜線，每格中間有凸起的亮面
    const ang = 0.62;
    ctx.lineCap = 'round';
    for (const dir of [1, -1]) {
      for (let k = -8; k <= 8; k++) {
        const ox = c.x + k * 9.5;
        const x0 = ox - dir * 80 * Math.sin(ang), y0 = c.y - 10 - 80 * Math.cos(ang) + 60;
        const x1 = ox + dir * 80 * Math.sin(ang), y1 = c.y - 10 + 80 * Math.cos(ang) + 60;
        ctx.strokeStyle = 'rgba(140,82,30,0.75)'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.moveTo(x0, y0 - 60); ctx.lineTo(x1, y1 - 60); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,225,165,0.55)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(x0 - 1.4, y0 - 61); ctx.lineTo(x1 - 1.4, y1 - 61); ctx.stroke();
      }
    }
    // 右側陰影與底部尖端加深
    const gs = ctx.createLinearGradient(c.x - c.rx, 0, c.x + c.rx, 0);
    gs.addColorStop(0, 'rgba(255,240,210,0.12)'); gs.addColorStop(0.55, 'rgba(120,60,20,0)'); gs.addColorStop(1, 'rgba(110,55,15,0.35)');
    ctx.fillStyle = gs; ctx.fillRect(0, c.y - 12, 200, 80);
    const gt = ctx.createLinearGradient(0, c.y + 30, 0, c.tipY);
    gt.addColorStop(0, 'rgba(120,60,20,0)'); gt.addColorStop(1, 'rgba(120,60,20,0.35)');
    ctx.fillStyle = gt; ctx.fillRect(0, c.y + 30, 200, 40);
    // 冰淇淋壓在杯口的陰影
    const gb = ctx.createLinearGradient(0, c.y, 0, c.y + 18);
    gb.addColorStop(0, 'rgba(90,45,10,0.45)'); gb.addColorStop(1, 'rgba(90,45,10,0)');
    ctx.fillStyle = gb; ctx.fillRect(0, c.y, 200, 18);
    ctx.restore();
    conePath(ctx);
    ctx.strokeStyle = 'rgba(120,66,22,0.85)'; ctx.lineWidth = 2.1; ctx.lineJoin = 'round'; ctx.stroke();
    // 杯口捲邊
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rx + 1.5, c.ry + 3, 0, -0.08, Math.PI + 0.08, false);
    ctx.ellipse(c.x, c.y - 1, c.rx - 1, c.ry - 1, 0, Math.PI, 0, true);
    ctx.closePath();
    const gr = ctx.createLinearGradient(c.x - c.rx, 0, c.x + c.rx, 0);
    gr.addColorStop(0, '#E8B46A'); gr.addColorStop(0.3, '#F8D396'); gr.addColorStop(1, '#B07432');
    ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = 'rgba(120,66,22,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  /* ---------- 一球冰淇淋 ---------- */
  function scoopPts(S) {
    const pts = [], rnd = K.rng(S.seed);
    const N = 90;
    const ph = rnd() * TAU;
    for (let i = 0; i < N; i++) {
      const th = i / N * TAU;
      const sy = Math.sin(th);
      let r = S.r * (1 + 0.018 * Math.sin(th * 5 + ph));
      let y = sy;
      if (sy > 0.15) {                               // 下半部：壓扁＋波浪裙邊
        const w = (sy - 0.15) / 0.85;
        r *= 1 + w * (0.09 * Math.sin(th * 13 + ph) + 0.04);
        y = sy * (1 - 0.26 * w);
      }
      pts.push([S.x + Math.cos(th) * r, S.y + y * r]);
    }
    return pts;
  }
  function pathPts(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }
  function drawScoop(ctx, S, drips) {
    const rnd = K.rng(S.seed + 100);
    const pts = scoopPts(S);
    // 往下滴的融化冰淇淋（畫在球後面一點，從裙邊流到甜筒上）
    for (const d of drips || []) {
      ctx.beginPath();
      ctx.moveTo(d.x - d.w, S.y + S.r * 0.6);
      ctx.lineTo(d.x - d.w * 0.8, d.y - d.w * 0.4);
      ctx.arc(d.x, d.y, d.w * 0.95, Math.PI * 0.95, Math.PI * 0.05, true);
      ctx.lineTo(d.x + d.w, S.y + S.r * 0.6);
      ctx.closePath();
      const g = ctx.createLinearGradient(d.x - d.w, 0, d.x + d.w, 0);
      g.addColorStop(0, S.lt); g.addColorStop(0.5, S.base); g.addColorStop(1, S.dk);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = S.edge; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.ellipse(d.x - d.w * 0.35, d.y - 1, d.w * 0.22, d.w * 0.35, 0, 0, TAU); ctx.fill();
    }
    pathPts(ctx, pts);
    const g = ctx.createRadialGradient(S.x - S.r * 0.38, S.y - S.r * 0.45, 2, S.x, S.y, S.r * 1.15);
    g.addColorStop(0, S.lt); g.addColorStop(0.5, S.base); g.addColorStop(1, S.dk);
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    pathPts(ctx, pts); ctx.clip();
    // 小鏟子抹出的弧形紋（暗溝＋亮邊）
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a0 = -2.6 + rnd() * 2.2, span = 0.9 + rnd() * 0.9, rr = S.r * (0.35 + rnd() * 0.55);
      const cx = S.x + (rnd() - 0.5) * S.r * 0.5, cy = S.y + (rnd() - 0.2) * S.r * 0.4;
      ctx.strokeStyle = K.rgba(S.dk, 0.35); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy + 0.8, rr, rr * 0.62, -0.2, a0, a0 + span); ctx.stroke();
      ctx.strokeStyle = K.rgba(S.dk, 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.62, -0.2, a0, a0 + span); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(cx, cy - 1.8, rr, rr * 0.62, -0.2, a0 + 0.08, a0 + span - 0.05); ctx.stroke();
    }
    // 果粒／堅果碎
    for (let i = 0; i < 20; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * S.r * 0.85;
      const x = S.x + Math.cos(a) * d, y = S.y + Math.sin(a) * d * 0.8;
      ctx.fillStyle = S.bits[Math.floor(rnd() * S.bits.length)];
      ctx.beginPath(); ctx.ellipse(x, y, 0.7 + rnd() * 0.9, 0.5 + rnd() * 0.6, rnd() * 3, 0, TAU); ctx.fill();
    }
    // 下緣陰影
    const gb = ctx.createLinearGradient(0, S.y + S.r * 0.25, 0, S.y + S.r);
    gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, K.rgba(S.dk, 0.45));
    ctx.fillStyle = gb; ctx.fillRect(S.x - S.r - 5, S.y, S.r * 2 + 10, S.r + 5);
    // 右側反光
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(S.x - 2, S.y - 2, S.r * 0.9, -0.9, 0.25); ctx.stroke();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(S.x - S.r * 0.42, S.y - S.r * 0.5, S.r * 0.26, S.r * 0.14, -0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(S.x - S.r * 0.5, S.y - S.r * 0.55, S.r * 0.09, S.r * 0.05, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
    // 裙邊的波浪摺痕
    ctx.strokeStyle = K.rgba(S.dk, 0.75); ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i += 7) {
      const p = pts[i];
      if (p[1] < S.y + S.r * 0.35) continue;
      ctx.beginPath(); ctx.moveTo(p[0], p[1] - 1); ctx.lineTo(p[0] + (S.x - p[0]) * 0.12, p[1] - 7); ctx.stroke();
    }
    pathPts(ctx, pts);
    ctx.strokeStyle = S.edge; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function draw(ctx) {
    drawCone(ctx);
    drawScoop(ctx, SCOOP1, [{ x: 80, y: 140, w: 4.6 }, { x: 113, y: 133, w: 3.8 }]);
    // 上球壓在下球上的影子
    ctx.save();
    pathPts(ctx, scoopPts(SCOOP1)); ctx.clip();
    const S = SCOOP2;
    const gs = ctx.createRadialGradient(S.x + 4, S.y + S.r * 0.8, 4, S.x + 4, S.y + S.r * 0.8, S.r * 1.05);
    gs.addColorStop(0, 'rgba(60,90,30,0.5)'); gs.addColorStop(1, 'rgba(60,90,30,0)');
    ctx.fillStyle = gs;
    ctx.beginPath(); ctx.ellipse(S.x + 4, S.y + S.r * 0.8, S.r * 1.05, S.r * 0.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
    drawScoop(ctx, SCOOP2, [{ x: 122, y: 96, w: 4.2 }]);
  }

  window.DESSERTS['gelato'] = {
    draw,
    crumbs: ['#F7A9BE', '#B9DB8C', '#E2AC62', '#FFE0E8', '#A86A2C'],
    crunchy: 0.3,
  };
})();
