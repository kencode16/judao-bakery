/* 覆盆子塔（tarte aux framboises）・精緻擬真插畫風
 * 斜上 45 度的圓形甜塔：淺淺的菊花邊塔殼（金褐酥塔皮），裡面一圈圈排滿紅色覆盆子，
 * 每顆覆盆子由許多小果粒組成，上面撒一點糖粉，中間一小撮薄荷葉。
 * 和葡式蛋塔的差別：塔殼淺而寬、邊是直的菊花摺紋，上面整片鮮紅莓果。
 * 專屬底色 tea（米色）：塔皮刻意烤深一點、外緣描邊，才不會和米色底糊在一起。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const TOP = { cy: 96, rx: 82, ry: 46 };     // 塔緣外圈
  const BOT = { cy: 117, rx: 77, ry: 43 };    // 塔底
  const INR = { cy: 96.5, rx: 72, ry: 39.5 };  // 塔緣內圈
  const NFL = 44;                              // 菊花摺紋數
  const KY = TOP.ry / TOP.rx;

  function flute(th) { return Math.pow(Math.abs(Math.cos(NFL * th / 2)), 0.6); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wallPt(t, th) {
    const rx = lerp(TOP.rx, BOT.rx, t) * (1 + 0.016 * (flute(th) - 0.5));
    const ry = lerp(TOP.ry, BOT.ry, t) * (1 + 0.016 * (flute(th) - 0.5));
    return [CX + rx * Math.cos(th), lerp(TOP.cy, BOT.cy, t) + ry * Math.sin(th)];
  }
  function rimPt(th, k) {
    const f = 1 + 0.016 * (flute(th) - 0.5);
    return [CX + TOP.rx * f * k * Math.cos(th), TOP.cy + TOP.ry * f * k * Math.sin(th)];
  }
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ramp(stops, x) {
    x = Math.max(0, Math.min(1, x));
    for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i], u = (x - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map(k => Math.round(a[1][k] + (b[1][k] - a[1][k]) * u));
    }
    return stops[stops.length - 1][1];
  }
  const CRUST = [[0, rgb('#6E3410')], [0.4, rgb('#A45C20')], [0.7, rgb('#CF8838')], [0.9, rgb('#E8AD5C')], [1, rgb('#F6CB80')]];

  // 外輪廓（塔殼）
  const SIL = [];
  (function () {
    for (let i = 0; i <= 180; i++) SIL.push(rimPt(Math.PI + Math.PI * i / 180, 1));
    for (let i = 0; i <= 8; i++) SIL.push(wallPt(i / 8, 0));
    for (let i = 0; i <= 180; i++) SIL.push(wallPt(1, Math.PI * i / 180));
    for (let i = 8; i >= 0; i--) SIL.push(wallPt(i / 8, Math.PI));
  })();
  function path(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }

  /* ---------- 塔殼側面（菊花摺紋） ---------- */
  const STRIPS = [];
  (function () {
    const NS = 132;
    for (let i = 0; i < NS; i++) {
      const a0 = Math.PI * i / NS, a1 = Math.PI * (i + 1.3) / NS, am = (a0 + a1) / 2;
      const d = 0.002;
      const fr = (flute(am + d) - flute(am - d)) / (2 * d) * 0.016;
      const n = am - Math.atan(fr);
      const dif = 0.5 + 0.5 * Math.cos(n - 0.72 * Math.PI);
      const pts = [wallPt(0, a0), wallPt(0, a1), wallPt(1, a1), wallPt(1, a0)];
      STRIPS.push({ pts, c: ramp(CRUST, dif * 0.95), top: wallPt(0, am), bot: wallPt(1, am) });
    }
  })();
  function drawWall(ctx) {
    path(ctx, SIL);
    ctx.fillStyle = '#9A531C';
    ctx.fill();
    for (const s of STRIPS) {
      path(ctx, s.pts);
      const g = ctx.createLinearGradient(s.top[0], s.top[1], s.bot[0], s.bot[1]);
      const c = s.c;
      g.addColorStop(0, `rgb(${c[0] * 0.8 | 0},${c[1] * 0.8 | 0},${c[2] * 0.8 | 0})`);
      g.addColorStop(0.3, `rgb(${c[0]},${c[1]},${c[2]})`);
      g.addColorStop(1, `rgb(${c[0] * 0.82 | 0},${c[1] * 0.8 | 0},${c[2] * 0.78 | 0})`);
      ctx.fillStyle = g;
      ctx.fill();
    }
    // 塔緣下方的影子
    ctx.save();
    path(ctx, SIL);
    ctx.clip();
    ctx.strokeStyle = 'rgba(80,34,8,0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy + 2.5, TOP.rx, TOP.ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    // 烤色小點
    const r = K.rng(71);
    for (let i = 0; i < 40; i++) {
      const p = wallPt(0.15 + r() * 0.75, 0.1 + r() * (Math.PI - 0.2));
      ctx.fillStyle = r() < 0.6 ? 'rgba(110,50,12,0.3)' : 'rgba(255,220,150,0.3)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.6 + r(), 0.5 + r() * 0.6, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 塔緣頂面 ---------- */
  function drawRim(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 220; i++) { const p = rimPt(TAU * i / 220, 1); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
    const g = ctx.createRadialGradient(64, 66, 6, 100, 100, 100);
    g.addColorStop(0, '#F6CC84');
    g.addColorStop(0.5, '#DE9C4C');
    g.addColorStop(0.85, '#B86E28');
    g.addColorStop(1, '#94501A');
    ctx.fillStyle = g;
    ctx.fill();
    // 內壁（後方看得到的一圈）
    ctx.beginPath(); ctx.ellipse(CX, INR.cy, INR.rx, INR.ry, 0, 0, TAU);
    ctx.fillStyle = '#9C561E';
    ctx.fill();
    // 卡士達底（莓果之間的縫）
    ctx.beginPath(); ctx.ellipse(CX, INR.cy + 2, INR.rx - 1.5, INR.ry - 1.5, 0, 0, TAU);
    const c = ctx.createRadialGradient(80, 84, 4, 100, 98, 76);
    c.addColorStop(0, '#FFF2C8');
    c.addColorStop(1, '#E9C47A');
    ctx.fillStyle = c;
    ctx.fill();
    // 塔緣上的高光與深色酥邊
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,240,200,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy, TOP.rx - 5, TOP.ry - 3.2, 0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,52,14,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(CX, INR.cy, INR.rx, INR.ry, 0, 0, TAU); ctx.stroke();
  }

  /* ---------- 覆盆子 ---------- */
  const BERRIES = [];
  (function () {
    const rings = [[61, 20, 0.1], [42, 14, 0.3], [22.5, 8, 0.05], [0, 1, 0]];
    const r = K.rng(5);
    for (const [R, n, ph] of rings) {
      for (let i = 0; i < n; i++) {
        const a = TAU * (i + ph) / n;
        const u = R * Math.cos(a) + (r() - 0.5) * 2.4, v = R * Math.sin(a) + (r() - 0.5) * 2.4;
        BERRIES.push({ x: CX + u, y: INR.cy + 1 + v * KY - 6.5, r: 10.2 + r() * 1.4, rot: r() * TAU, seed: 1000 + BERRIES.length });
      }
    }
    BERRIES.sort((a, b) => a.y - b.y);
  })();
  // 果粒排列（單位圓裡的六角格）
  const DRUPE = [];
  (function () {
    const s = 0.42;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const x = (i + (j & 1) * 0.5) * s, y = j * s * 0.87;
      if (x * x + y * y < 0.92) DRUPE.push([x, y]);
    }
  })();
  function berry(ctx, b) {
    const { x, y, r } = b;
    // 本體（果粒之間的深紅縫）
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, 1, x, y, r);
    g.addColorStop(0, '#C0182F');
    g.addColorStop(0.7, '#8A0C20');
    g.addColorStop(1, '#5A0714');
    ctx.fillStyle = g;
    ctx.fill();
    const cr = Math.cos(b.rot), sr = Math.sin(b.rot);
    for (const d of DRUPE) {
      const dx = d[0] * cr - d[1] * sr, dy = d[0] * sr + d[1] * cr;
      const dd = Math.hypot(dx, dy);
      // 球面：越靠邊越小、越暗；左上亮
      const k = Math.sqrt(Math.max(0, 1 - dd * dd));
      const px = x + dx * r * 0.98, py = y + dy * r * 0.98;
      const rr = r * 0.255 * (0.6 + 0.4 * k);
      const lit = Math.max(0, Math.min(1, 0.55 - dx * 0.45 - dy * 0.5)) * (0.5 + 0.5 * k);
      const R = Math.round(188 + 50 * lit), G = Math.round(22 + 48 * lit), B = Math.round(48 + 44 * lit);
      const dg = ctx.createRadialGradient(px - rr * 0.35, py - rr * 0.4, rr * 0.1, px, py, rr);
      dg.addColorStop(0, `rgb(${Math.min(255, R + 30)},${G + 34},${B + 34})`);
      dg.addColorStop(0.6, `rgb(${R},${G},${B})`);
      dg.addColorStop(1, `rgb(${R * 0.72 | 0},${G * 0.6 | 0},${B * 0.66 | 0})`);
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
      if (lit > 0.3) {
        ctx.fillStyle = `rgba(255,232,236,${0.1 + 0.35 * lit})`;
        ctx.beginPath(); ctx.arc(px - rr * 0.35, py - rr * 0.4, rr * 0.26, 0, TAU); ctx.fill();
      }
    }
    // 右下陰影＋外緣
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const s = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    s.addColorStop(0.5, 'rgba(70,0,14,0)');
    s.addColorStop(1, 'rgba(70,0,14,0.45)');
    ctx.fillStyle = s;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(80,4,18,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  function drawBerries(ctx) {
    // 莓果底下的影子
    ctx.save();
    ctx.beginPath(); ctx.ellipse(CX, INR.cy + 2, INR.rx - 1.5, INR.ry - 1.5, 0, 0, TAU); ctx.clip();
    for (const b of BERRIES) {
      ctx.fillStyle = 'rgba(120,40,20,0.35)';
      ctx.beginPath(); ctx.ellipse(b.x + 1.5, b.y + 7.5, b.r * 1.02, b.r * 0.62, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    for (const b of BERRIES) berry(ctx, b);
    // 糖粉
    const r = K.rng(909);
    for (let i = 0; i < 70; i++) {
      const b = BERRIES[(r() * BERRIES.length) | 0];
      const a = r() * TAU, d = Math.sqrt(r()) * b.r;
      const x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d - b.r * 0.15;
      if (x > 128 && y > 100) continue;   // 右下少撒
      ctx.fillStyle = `rgba(255,252,250,${0.45 + r() * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, 0.45 + r() * 0.7, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 薄荷葉 ---------- */
  function leaf(ctx, x, y, len, wid, ang, c1, c2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.9, len, 0);
    ctx.bezierCurveTo(len * 0.75, wid * 0.9, len * 0.3, wid, 0, 0);
    const g = ctx.createLinearGradient(0, -wid, 0, wid);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,80,30,0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220,255,200,0.6)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(len * 0.5, -1, len * 0.9, 0); ctx.stroke();
    ctx.restore();
  }
  function drawMint(ctx) {
    const c = BERRIES.find(b => Math.abs(b.x - CX) < 4 && Math.abs(b.y - (INR.cy - 5.5)) < 5) || { x: CX, y: INR.cy - 6, r: 10 };
    const x = c.x + 1, y = c.y - c.r * 0.6;
    leaf(ctx, x, y, 17, 6.5, -2.45, '#8FD06A', '#3F8F3A');
    leaf(ctx, x, y, 16, 6, -0.55, '#7DC35C', '#2F7A30');
    leaf(ctx, x, y + 1, 12, 5, -1.55, '#A6DC80', '#4C9A40');
  }

  function draw(ctx) {
    drawWall(ctx);
    drawRim(ctx);
    // 塔殼外輪廓（米色底上要清楚）；莓果蓋在上面
    path(ctx, SIL);
    ctx.strokeStyle = 'rgba(96,44,12,0.7)';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    drawBerries(ctx);
    drawMint(ctx);
  }

  window.DESSERTS['raspberrytart'] = {
    draw,
    crumbs: ['#D6203F', '#DE9C4C', '#FFF2C8', '#8A0C20', '#F6CC84'],
    crunchy: 0.7,
  };
})();
