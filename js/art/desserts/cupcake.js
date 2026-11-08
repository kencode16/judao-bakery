/* 杯子蛋糕（Cupcake）
 * 斜上 45 度：淡紫色百褶紙杯、杯口露出一圈金黃蛋糕頂，上面用星形花嘴擠出高高的粉紅奶油霜螺旋，
 * 頂端一顆小糖珠。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, KY = 0.38;
  const RIM = { cy: 124, rx: 53, ry: 19.5 };     // 紙杯杯口
  const BOT = { cy: 173, rx: 40, ry: 14.5 };       // 紙杯底
  const PLEATS = 34;

  const rim = (th, e) => [CX + Math.cos(th) * e.rx, e.cy + Math.sin(th) * e.ry];

  /* ---------- 百褶紙杯 ---------- */
  function cupPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const p = rim(Math.PI * i / 60, BOT); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 60; i >= 0; i--) {
      const th = Math.PI * i / 60;
      const p = rim(th, RIM);
      ctx.lineTo(p[0], p[1] + 0.9 * Math.cos(th * PLEATS));
    }
    ctx.closePath();
  }
  function drawCup(ctx) {
    cupPath(ctx);
    ctx.fillStyle = '#B7A0E6'; ctx.fill();
    ctx.save();
    cupPath(ctx); ctx.clip();
    // 一條條褶子：亮暗交替
    for (let k = 0; k < PLEATS / 2; k++) {
      const a = (k / (PLEATS / 2)) * Math.PI, b = ((k + 1) / (PLEATS / 2)) * Math.PI, m = (a + b) / 2;
      const facing = Math.sin(m);                     // 越朝前越亮
      const left = -Math.cos(m);                      // 左邊受光
      const t1 = rim(a, RIM), t2 = rim(m, RIM), b1 = rim(a, BOT), b2 = rim(m, BOT);
      const t3 = rim(b, RIM), b3 = rim(b, BOT);
      // 受光的半褶
      ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]); ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.22 * Math.max(0, left) + 0.08 * facing})`; ctx.fill();
      // 背光的半褶
      ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(t3[0], t3[1]); ctx.lineTo(b3[0], b3[1]); ctx.lineTo(b2[0], b2[1]); ctx.closePath();
      ctx.fillStyle = `rgba(70,40,130,${0.1 + 0.16 * Math.max(0, -left)})`; ctx.fill();
      // 褶線
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,50,140,0.35)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(t3[0], t3[1]); ctx.lineTo(b3[0], b3[1]); ctx.stroke();
    }
    // 整體左亮右暗、底部略暗
    const g = ctx.createLinearGradient(CX - RIM.rx, 0, CX + RIM.rx, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.4, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(60,30,120,0.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    const gv = ctx.createLinearGradient(0, RIM.cy, 0, BOT.cy + BOT.ry);
    gv.addColorStop(0, 'rgba(60,30,120,0.15)');
    gv.addColorStop(0.25, 'rgba(60,30,120,0)');
    gv.addColorStop(1, 'rgba(60,30,120,0.22)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    cupPath(ctx);
    ctx.strokeStyle = 'rgba(95,65,160,0.75)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
  }

  /* ---------- 杯口露出的蛋糕頂 ---------- */
  function drawCake(ctx) {
    const cy = RIM.cy - 4;
    ctx.beginPath();
    ctx.ellipse(CX, cy, RIM.rx + 3, RIM.ry + 4, 0, 0, TAU);
    const g = ctx.createRadialGradient(CX - 20, cy - 8, 3, CX, cy, RIM.rx + 4);
    g.addColorStop(0, '#E9B567');
    g.addColorStop(0.7, '#D2913F');
    g.addColorStop(1, '#AE6D26');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(130,75,25,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    const rnd = K.rng(15);
    for (let i = 0; i < 60; i++) {
      const a = rnd() * TAU, r = 0.7 + rnd() * 0.3;
      const x = CX + Math.cos(a) * r * (RIM.rx + 1), y = cy + Math.sin(a) * r * (RIM.ry + 2);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(140,80,25,0.4)' : 'rgba(255,225,160,0.45)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.7 + rnd(), 0.5 + rnd() * 0.5, 0, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 奶油霜螺旋（球掃管子：依深度畫圓片＋花嘴稜線） ---------- */
  const SW = { z0: 7, r0: 43, r1: 3, tr0: 16, tr1: 7, turns: 2.6, rise: 62, ph0: -Math.PI * 0.5 };
  const BASE_Y = RIM.cy - 4;
  function swirlPt(t) {
    const phi = SW.ph0 + t * SW.turns * TAU;
    const r = SW.r0 + (SW.r1 - SW.r0) * Math.pow(t, 1.45);
    const z = SW.z0 + SW.rise * Math.pow(t, 1.15);
    const tr = SW.tr0 + (SW.tr1 - SW.tr0) * t;
    const px = Math.cos(phi) * r, py = Math.sin(phi) * r;
    return { phi, r, z, tr, x: CX + px, y: BASE_Y + py * KY - z, depth: py * 0.55 + z, py };
  }
  const NS = 300;
  const SL = []; for (let i = 0; i <= NS; i++) SL.push(swirlPt(i / NS));
  const CHUNK = 10;
  const CHUNKS = [];
  for (let i = 0; i < NS; i += CHUNK) {
    const a = i, b = Math.min(NS, i + CHUNK);
    let d = 0; for (let j = a; j <= b; j++) d += SL[j].depth;
    CHUNKS.push({ a, b, d: d / (b - a + 1) });
  }
  CHUNKS.sort((p, q) => p.d - q.d);

  const PINK = '#F8A9CA', PINK_L = '#FFE2EE', PINK_D = '#E07CA9';
  const RIDGES = 8;

  function ridgePt(s, psi) {
    // 截面：外向（水平）與向上兩個方向
    const ox = Math.cos(s.phi) * Math.cos(psi) * s.tr, oy = Math.sin(s.phi) * Math.cos(psi) * s.tr, oz = Math.sin(psi) * s.tr;
    return [s.x + ox, s.y + oy * KY - oz * 0.92];
  }

  function drawSwirl(ctx) {
    // 內芯：避免圈與圈之間透出縫
    ctx.beginPath();
    ctx.moveTo(CX - SW.r0 + 4, BASE_Y - SW.z0);
    ctx.quadraticCurveTo(CX - 18, BASE_Y - SW.z0 - SW.rise * 0.8, CX, BASE_Y - SW.z0 - SW.rise);
    ctx.quadraticCurveTo(CX + 18, BASE_Y - SW.z0 - SW.rise * 0.8, CX + SW.r0 - 4, BASE_Y - SW.z0);
    ctx.closePath();
    ctx.fillStyle = PINK_D; ctx.fill();

    ctx.lineCap = 'round';
    CHUNKS.forEach(ch => {
      for (let j = ch.a; j <= ch.b; j++) {
        const s = SL[j];
        const lit = 0.5 - 0.35 * Math.cos(s.phi) + 0.15 * Math.sin(s.phi);   // 左前方亮
        const g = ctx.createRadialGradient(s.x - s.tr * 0.4, s.y - s.tr * 0.5, s.tr * 0.1, s.x, s.y, s.tr * 1.05);
        g.addColorStop(0, K.shade(PINK_L, Math.max(0, lit - 0.5) * 0.6));
        g.addColorStop(0.5, K.shade(PINK, (lit - 0.5) * 0.2));
        g.addColorStop(1, K.shade(PINK_D, (lit - 0.5) * 0.15));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.tr, s.tr * 0.92, 0, 0, TAU); ctx.fill();
      }
      // 花嘴稜線（只畫朝向觀者的）
      for (let k = 0; k < RIDGES; k++) {
        const psi = (k + 0.5) / RIDGES * TAU;
        for (let j = ch.a; j < ch.b; j++) {
          const s0 = SL[j], s1 = SL[j + 1];
          const vis = Math.cos(psi) * Math.sin(s0.phi) * 0.75 + Math.sin(psi) * 0.66;
          if (vis < 0.12) continue;
          const p0 = ridgePt(s0, psi), p1 = ridgePt(s1, psi);
          ctx.strokeStyle = `rgba(200,85,135,${Math.min(0.5, vis * 0.6)})`; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
          const q0 = ridgePt(s0, psi + 0.22), q1 = ridgePt(s1, psi + 0.22);
          ctx.strokeStyle = `rgba(255,244,248,${Math.min(0.55, vis * 0.65)})`; ctx.lineWidth = 1.0;
          ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
        }
      }
    });

    // 尖端：往上收的小尖
    const e = SL[NS];
    ctx.beginPath();
    ctx.moveTo(e.x - e.tr * 0.9, e.y);
    ctx.quadraticCurveTo(e.x - 2, e.y - e.tr * 1.2, e.x + 3, e.y - e.tr * 2.2);
    ctx.quadraticCurveTo(e.x + 4, e.y - e.tr * 0.9, e.x + e.tr * 0.9, e.y + 1);
    ctx.closePath();
    const gt = ctx.createLinearGradient(e.x - 6, e.y - 14, e.x + 6, e.y);
    gt.addColorStop(0, PINK_L); gt.addColorStop(1, PINK);
    ctx.fillStyle = gt; ctx.fill();
  }

  // 頂端糖珠
  function drawPearl(ctx) {
    const e = SL[NS];
    const x = e.x + 2, y = e.y - e.tr * 1.55;
    const g = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 5.5);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.5, '#F7EEF2');
    g.addColorStop(1, '#C9B6C0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(160,120,140,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
  }

  // 奶油霜上的小糖珠
  function drawDragees(ctx) {
    const spots = [[0.18, 1.05], [0.42, 1.08], [0.63, 1.05], [0.8, 1.1], [0.3, 1.0]];
    spots.forEach(([t, k], i) => {
      const s = swirlPt(t);
      if (Math.sin(s.phi) < 0.15) return;
      const x = s.x + Math.cos(s.phi) * 2, y = s.y - s.tr * 0.55 * k;
      const g = ctx.createRadialGradient(x - 0.8, y - 0.8, 0.2, x, y, 2.4);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, i % 2 ? '#E9D9A6' : '#D8D4E6');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    });
  }

  function draw(ctx) {
    drawCup(ctx);
    drawCake(ctx);
    drawSwirl(ctx);
    drawDragees(ctx);
    drawPearl(ctx);
  }

  window.DESSERTS['cupcake'] = {
    draw,
    crumbs: ['#F59BC1', '#FFD6E6', '#D2913F', '#B7A0E6', '#E9B567'],
    crunchy: 0.15,
  };
})();
