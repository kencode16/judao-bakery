/* 修女泡芙（religieuse）・精緻擬真插畫風
 * 一大一小兩顆泡芙疊起來（大的是身體、小的是頭），上半部都淋著亮面巧克力翻糖，
 * 兩顆之間用奶油霜擠一圈直條花邊（修女的領子），頭頂一小朵奶油霜。
 * 斜上 45 度、光源左上。和閃電泡芙的差別：直立的「雪人」形、中間一圈白色領子。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const BODY = { cx: 100, cy: 136, rx: 62, ryT: 40, ryB: 34, gl: 4, seed: 11 };
  const HEAD = { cx: 100, cy: 83, rx: 35, ryT: 30, ryB: 24, gl: 21, seed: 23 };
  const COLLAR = { cx: 100, cy: 101, rx: 37, ry: 13 };

  function puffPath(ctx, P, grow) {
    grow = grow || 0;
    ctx.beginPath();
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const a = TAU * i / n;
      const s = Math.sin(a);
      const ry = s < 0 ? P.ryT : P.ryB;
      // 泡芙表面不是正圓：加一點低頻起伏
      const wob = 1 + 0.018 * Math.sin(3 * a + P.seed) + 0.012 * Math.sin(5 * a + P.seed * 2);
      const x = P.cx + (P.rx + grow) * Math.cos(a) * wob;
      const y = P.cy + (ry + grow) * s * wob * (s > 0 ? Math.pow(Math.abs(s), -0.15) : 1);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  // 淋面下緣（含幾道往下滴）
  function glazeEdge(P, x) {
    const u = (x - P.cx) / P.rx;
    const r = K.rng(P.seed * 7);
    let y = P.cy + P.gl + 2.2 * Math.sin(u * 7 + P.seed) - 6 * Math.pow(Math.abs(u), 4);
    // 滴落
    const drips = [[-0.5, 6], [0.12, 8], [0.58, 5.5], [-0.15, 4]];
    for (const [c, h] of drips) y += h * (0.8 + r() * 0.4) * Math.exp(-Math.pow((u - c) / 0.07, 2));
    return y;
  }
  function glazePath(ctx, P) {
    ctx.beginPath();
    const n = 90;
    ctx.moveTo(P.cx - P.rx - 4, P.cy - P.ryT - 10);
    ctx.lineTo(P.cx + P.rx + 4, P.cy - P.ryT - 10);
    for (let i = n; i >= 0; i--) {
      const x = P.cx - P.rx - 4 + (2 * P.rx + 8) * i / n;
      ctx.lineTo(x, glazeEdge(P, x));
    }
    ctx.closePath();
  }

  function drawPuff(ctx, P) {
    // 泡芙殼
    puffPath(ctx, P);
    const g = ctx.createRadialGradient(P.cx - P.rx * 0.4, P.cy - P.ryT * 0.2, 2, P.cx, P.cy, P.rx * 1.15);
    g.addColorStop(0, '#F6C978');
    g.addColorStop(0.5, '#E3A04C');
    g.addColorStop(0.85, '#BD7128');
    g.addColorStop(1, '#94511A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    puffPath(ctx, P);
    ctx.clip();
    // 泡芙殼的烤裂紋
    const r = K.rng(P.seed * 13);
    ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      let x = P.cx + (r() * 2 - 1) * P.rx * 0.95, y = P.cy + r() * P.ryB * 0.9;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += (r() - 0.5) * 9; y += (r() - 0.3) * 4; ctx.lineTo(x, y); }
      ctx.strokeStyle = `rgba(120,58,14,${0.35 + r() * 0.3})`;
      ctx.lineWidth = 0.7 + r() * 0.6;
      ctx.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const x = P.cx + (r() * 2 - 1) * P.rx * 0.9, y = P.cy + r() * P.ryB * 0.85;
      ctx.fillStyle = r() < 0.5 ? 'rgba(255,224,160,0.4)' : 'rgba(130,64,16,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y, 1 + r() * 2.5, 0.6 + r() * 1.2, 0, 0, TAU); ctx.fill();
    }
    // 底部暗、右側暗
    const d = ctx.createLinearGradient(P.cx - P.rx, P.cy - P.ryT, P.cx + P.rx, P.cy + P.ryB);
    d.addColorStop(0.5, 'rgba(90,40,10,0)');
    d.addColorStop(1, 'rgba(90,40,10,0.4)');
    ctx.fillStyle = d;
    ctx.fillRect(P.cx - P.rx - 4, P.cy - P.ryT - 4, P.rx * 2 + 8, P.ryT + P.ryB + 8);

    // 淋面投在泡芙殼上的影子
    ctx.save(); ctx.translate(0.6, 2.4); glazePath(ctx, P); ctx.fillStyle = 'rgba(80,34,8,0.42)'; ctx.fill(); ctx.restore();
    // 巧克力翻糖淋面
    glazePath(ctx, P);
    const gg = ctx.createLinearGradient(0, P.cy - P.ryT, 0, P.cy + P.gl + 6);
    gg.addColorStop(0, '#73422A');
    gg.addColorStop(0.4, '#5A321E');
    gg.addColorStop(0.85, '#3C1E11');
    gg.addColorStop(1, '#2C150B');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.save();
    glazePath(ctx, P);
    ctx.clip();
    const h = ctx.createLinearGradient(P.cx - P.rx, 0, P.cx + P.rx, 0);
    h.addColorStop(0, 'rgba(150,96,64,0.3)');
    h.addColorStop(0.35, 'rgba(150,96,64,0)');
    h.addColorStop(0.75, 'rgba(10,4,2,0)');
    h.addColorStop(1, 'rgba(10,4,2,0.4)');
    ctx.fillStyle = h;
    ctx.fillRect(P.cx - P.rx - 4, P.cy - P.ryT - 10, P.rx * 2 + 8, P.ryT + 30);
    // 光澤
    ctx.save();
    ctx.translate(P.cx - P.rx * 0.36, P.cy - P.ryT * 0.55);
    ctx.rotate(-0.35);
    ctx.scale(1, 0.45);
    const s = ctx.createRadialGradient(0, 0, 1, 0, 0, P.rx * 0.5);
    s.addColorStop(0, 'rgba(255,228,206,0.55)');
    s.addColorStop(1, 'rgba(255,228,206,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(0, 0, P.rx * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,250,244,0.85)';
    ctx.lineWidth = P.rx > 50 ? 2.6 : 2;
    ctx.beginPath(); ctx.ellipse(P.cx, P.cy + 2, P.rx * 0.84, P.ryT * 0.84, 0, Math.PI * 1.08, Math.PI * 1.32); ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,244,0.8)';
    const a = Math.PI * 1.4;
    ctx.beginPath(); ctx.ellipse(P.cx + P.rx * 0.84 * Math.cos(a), P.cy + 2 + P.ryT * 0.84 * Math.sin(a), 2.2, 1.4, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
    // 淋面下緣的厚度亮邊
    ctx.strokeStyle = 'rgba(170,112,80,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = P.cx - P.rx * 0.88 + P.rx * 1.76 * i / 60;
      const y = glazeEdge(P, x) - 1.3;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    puffPath(ctx, P);
    ctx.strokeStyle = 'rgba(70,32,12,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- 奶油霜領子：一圈直條小花瓣 ---------- */
  function petal(ctx, x, y, len, wid, ang, lit) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.25, wid * 0.8, -len * 0.85, 0, -len);
    ctx.bezierCurveTo(-wid * 0.8, -len * 0.85, -wid, -len * 0.25, 0, 0);
    const g = ctx.createLinearGradient(-wid, 0, wid, 0);
    const L = 0.75 + 0.25 * lit;
    g.addColorStop(0, `rgb(${255 * L | 0},${250 * L | 0},${236 * L | 0})`);
    g.addColorStop(0.5, `rgb(${248 * L | 0},${236 * L | 0},${210 * L | 0})`);
    g.addColorStop(1, `rgb(${214 * L | 0},${192 * L | 0},${156 * L | 0})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,140,100,0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-wid * 0.3, -len * 0.15); ctx.quadraticCurveTo(-wid * 0.45, -len * 0.55, -wid * 0.1, -len * 0.85); ctx.stroke();
    ctx.restore();
  }
  const NPET = 30;
  function collar(ctx, front) {
    const C = COLLAR;
    const list = [];
    for (let i = 0; i < NPET; i++) {
      const a = TAU * (i + 0.5) / NPET;
      const s = Math.sin(a);
      if (front ? s < -0.05 : s >= -0.05) continue;
      list.push(a);
    }
    list.sort((p, q) => Math.sin(p) - Math.sin(q));
    for (const a of list) {
      const x = C.cx + C.rx * Math.cos(a), y = C.cy + C.ry * Math.sin(a) + 6;
      const lit = 0.5 + 0.5 * Math.cos(a - 1.2 * Math.PI);
      petal(ctx, x, y, 17, 6.8, Math.cos(a) * 0.7, lit);
    }
  }

  /* ---------- 頭頂的小奶油花 ---------- */
  function rosette(ctx, x, y) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = TAU * i / n + 0.3;
      const px = x + Math.cos(a) * 4.6, py = y + Math.sin(a) * 2.4;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.2, 3.2, a, 0, TAU);
      const g = ctx.createRadialGradient(px - 1.5, py - 1.5, 0.3, px, py, 4.5);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.6, '#F7EBD2');
      g.addColorStop(1, '#D9C29A');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(170,140,100,0.45)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(x, y - 3.5, 4.2, 4.6, 0, 0, TAU);
    const g = ctx.createRadialGradient(x - 1.5, y - 5.5, 0.3, x, y - 3.5, 5);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.7, '#F4E6C8');
    g.addColorStop(1, '#D6BD93');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,140,100,0.5)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,160,120,0.6)';
    ctx.beginPath(); ctx.arc(x, y - 3.5, 2, 0.3, 4); ctx.stroke();
  }

  function draw(ctx) {
    drawPuff(ctx, BODY);
    // 領子後半圈（在頭後面）
    collar(ctx, false);
    // 頭投在領子上的影子
    ctx.fillStyle = 'rgba(70,30,10,0.25)';
    ctx.beginPath(); ctx.ellipse(HEAD.cx + 3, COLLAR.cy + 2, HEAD.rx * 0.95, 10, 0, 0, TAU); ctx.fill();
    drawPuff(ctx, HEAD);
    collar(ctx, true);
    rosette(ctx, HEAD.cx - 1, HEAD.cy - HEAD.ryT + 4);
  }

  window.DESSERTS['religieuse'] = {
    draw,
    crumbs: ['#5A321E', '#E3A04C', '#F7EBD2', '#3C1E11', '#FFF6E0'],
    crunchy: 0.3,
  };
})();
