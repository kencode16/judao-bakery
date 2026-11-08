/* 可麗露（canelé）・精緻擬真插畫風
 * 波爾多的小鐘形蛋糕：直立的短圓柱，底部略寬、往上微收，側面 10 道圓弧直溝紋，
 * 頂面是平的焦糖面（中間微凹），外殼烤成深焦褐近黑、稜線帶琥珀色光澤。
 * 斜上 45 度看：上方看得到頂面橢圓，側面用一條條細長四邊形依法線上色（光源左上）。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const T = { cy: 50, r: 41 };     // 頂緣（圓肩收進去之後）
  const B = { cy: 154, r: 57 };    // 底緣
  const KY = 0.36;                 // 圓的透視壓扁
  const NF = 10;                   // 溝紋數
  const PH = Math.PI / NF;         // 讓正前方是一道稜

  function rib(th) { return Math.pow(Math.abs(Math.cos(NF * (th + PH) / 2)), 0.55); } // 1＝稜、0＝溝
  // 側面輪廓：上窄下寬，頂端一圈圓肩往內收
  function baseR(t) {
    const lin = T.r + 6 + (B.r - T.r - 6) * Math.pow(t, 0.9) + 1.5 * Math.sin(Math.PI * t);
    const sh = t < 0.13 ? 6 * Math.pow(1 - t / 0.13, 2.2) : 0;
    return lin - sh;
  }
  function R(t, th) { return baseR(t) * (1 + 0.085 * (rib(th) - 0.62)); }
  function cyAt(t) { return T.cy + (B.cy - T.cy) * t; }
  function P(t, th) { const r = R(t, th); return [CX + r * Math.cos(th), cyAt(t) + r * KY * Math.sin(th)]; }

  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ramp(stops, x) {
    x = Math.max(0, Math.min(1, x));
    for (let i = 1; i < stops.length; i++) {
      if (x <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i], u = (x - a[0]) / (b[0] - a[0]);
        return [0, 1, 2].map(k => a[1][k] + (b[1][k] - a[1][k]) * u);
      }
    }
    return stops[stops.length - 1][1];
  }
  const SIDE = [
    [0, rgb('#1A0703')], [0.35, rgb('#341106')], [0.6, rgb('#5A1F0A')],
    [0.8, rgb('#853812')], [0.93, rgb('#B05A20')], [1, rgb('#D9893C')],
  ];
  const css = (c, k, a) => `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${a === undefined ? 1 : a})`;

  // 側面某個角度的亮度（0～1）
  const TL = 0.74 * Math.PI;   // 光的水平方向（左前）
  const TH = 0.62 * Math.PI;   // 半向量（光與視線中間）
  function shadeAt(th) {
    const d = 0.002;
    const dr = (R(0.5, th + d) - R(0.5, th - d)) / (2 * d);
    const n = th - Math.atan2(dr, R(0.5, th));
    const dif = 0.5 + 0.5 * Math.cos(n - TL);
    const spec = Math.pow(Math.max(0, Math.cos(n - TH)), 26);
    return { dif, spec };
  }

  // 側面細長條（預先算好）
  const STRIPS = [];
  (function () {
    const NS = 120, TS = 10;
    for (let i = 0; i < NS; i++) {
      const a0 = Math.PI * i / NS, a1 = Math.PI * (i + 1.3) / NS, am = (a0 + a1) / 2;
      const pts = [];
      for (let j = 0; j <= TS; j++) pts.push(P(j / TS, a0));
      for (let j = TS; j >= 0; j--) pts.push(P(j / TS, a1));
      const sh = shadeAt(am);
      STRIPS.push({ pts, dif: sh.dif, spec: sh.spec, top: P(0, am), bot: P(1, am) });
    }
  })();

  // 外輪廓
  function sideX(t, s) {
    let m = 0;
    for (let a = -0.35; a <= 0.35; a += 0.01) {
      const th = s > 0 ? a : Math.PI + a;
      m = Math.max(m, s * (P(t, th)[0] - CX));
    }
    return CX + s * m;
  }
  const SIL = [];
  for (let i = 0; i <= 120; i++) SIL.push(P(0, Math.PI + Math.PI * i / 120));
  for (let i = 0; i <= 30; i++) { const t = i / 30; SIL.push([sideX(t, 1), cyAt(t)]); }
  for (let i = 0; i <= 120; i++) SIL.push(P(1, Math.PI * i / 120));
  for (let i = 30; i >= 0; i--) { const t = i / 30; SIL.push([sideX(t, -1), cyAt(t)]); }
  function silhouette(ctx) {
    ctx.beginPath();
    SIL.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }

  /* ---------- 側面 ---------- */
  function drawSide(ctx) {
    silhouette(ctx);
    ctx.fillStyle = '#3A1507';
    ctx.fill();
    ctx.save();
    silhouette(ctx);
    ctx.clip();
    for (const S of STRIPS) {
      const { dif, spec, top, bot } = S;
      ctx.beginPath();
      S.pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
      const c = ramp(SIDE, dif * 0.82 + spec * 0.32);
      g.addColorStop(0, css(c, 0.45));
      g.addColorStop(0.12, css(c, 0.7));
      g.addColorStop(0.5, css(c, 1));
      g.addColorStop(0.86, css(c, 0.95));
      g.addColorStop(1, css(c, 0.72));
      ctx.fillStyle = g;
      ctx.fill();
      if (spec > 0.08) {
        // 稜線上的琥珀色光澤（中段最亮）
        const h = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
        h.addColorStop(0.1, 'rgba(255,190,110,0)');
        h.addColorStop(0.45, `rgba(255,196,120,${spec * 0.55})`);
        h.addColorStop(0.8, `rgba(255,190,110,${spec * 0.2})`);
        h.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = h;
        ctx.fill();
      }
    }
    // 溝紋的深色細線
    for (let k = 0; k < NF; k++) {
      const th = (2 * Math.PI * k + Math.PI) / NF - PH;
      const tn = ((th % TAU) + TAU) % TAU;
      if (tn <= 0.05 || tn >= Math.PI - 0.05) continue;
      ctx.strokeStyle = 'rgba(18,6,2,0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) { const p = P(j / 10, tn); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    // 焦糖表面的細小斑駁、氣泡
    const r = K.rng(515);
    for (let i = 0; i < 46; i++) {
      const th = 0.1 + r() * (Math.PI - 0.2), t = 0.1 + r() * 0.82;
      const p = P(t, th);
      ctx.fillStyle = r() < 0.55 ? `rgba(20,6,2,${0.12 + r() * 0.18})` : `rgba(240,160,80,${0.1 + r() * 0.14})`;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.5 + r() * 0.9, 0.8 + r() * 1.6, 0, 0, TAU); ctx.fill();
    }
    // 底部一圈較淺的烤色（接觸模具開口的地方）
    ctx.strokeStyle = 'rgba(200,110,44,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const p = P(0.965, Math.PI * i / 80); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function topPath(ctx, k, dy) {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const th = TAU * i / 160;
      const r = R(0, th) * k;
      const x = CX + r * Math.cos(th), y = T.cy + (dy || 0) + r * KY * Math.sin(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawTop(ctx) {
    // 圓肩（頂緣的稜慢慢彎進平面）
    topPath(ctx, 1);
    const g = ctx.createRadialGradient(80, 44, 4, 100, 56, 52);
    g.addColorStop(0, '#6A2A0E');
    g.addColorStop(0.6, '#3A1406');
    g.addColorStop(1, '#1E0802');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx, 1);
    ctx.clip();
    // 每道稜在圓肩上的亮點（後方左側受光較多）
    for (let k = 0; k < NF; k++) {
      const th = (2 * Math.PI * k) / NF - PH;
      const lit = 0.5 + 0.5 * Math.cos(th - 1.25 * Math.PI);
      const p0 = [CX + R(0, th) * 0.93 * Math.cos(th), T.cy + R(0, th) * 0.93 * KY * Math.sin(th)];
      ctx.fillStyle = `rgba(214,120,52,${0.12 + lit * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(p0[0], p0[1], 5.5, 2.4, th + Math.PI / 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // 平頂（稍微下凹）
    const IN = 0.7;
    topPath(ctx, IN, 1.5);
    const f = ctx.createRadialGradient(88, 50, 2, 100, 56, 34);
    f.addColorStop(0, '#7A3512');
    f.addColorStop(0.55, '#4A1A07');
    f.addColorStop(1, '#2A0C03');
    ctx.fillStyle = f;
    ctx.fill();
    ctx.save();
    topPath(ctx, IN, 1.5);
    ctx.clip();
    // 凹面：後緣暗、前緣亮
    ctx.strokeStyle = 'rgba(20,6,2,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(CX, T.cy + 0.5, T.r * IN, T.r * IN * KY, 0, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,140,70,0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(CX, T.cy + 2.5, T.r * IN - 1, T.r * IN * KY - 1, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // 焦糖光澤
    ctx.save();
    ctx.translate(86, T.cy - 3);
    ctx.scale(1, 0.38);
    const s = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    s.addColorStop(0, 'rgba(255,214,160,0.55)');
    s.addColorStop(1, 'rgba(255,214,160,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
    ctx.restore();
    const r = K.rng(808);
    for (let i = 0; i < 14; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * T.r * IN * 0.9;
      ctx.fillStyle = r() < 0.6 ? 'rgba(25,8,2,0.3)' : 'rgba(240,160,90,0.18)';
      ctx.beginPath(); ctx.ellipse(CX + Math.cos(a) * d, T.cy + 1.5 + Math.sin(a) * d * KY, 0.7 + r() * 1.4, 0.5 + r() * 0.7, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 頂緣的亮邊（左後方）
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(250,170,96,0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const th = 1.08 * Math.PI + 0.42 * Math.PI * i / 40;
      const p = P(0, th);
      const q = [CX + (p[0] - CX) * 0.95, T.cy + (p[1] - T.cy) * 0.95];
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(30,10,4,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['canele'] = {
    draw,
    crumbs: ['#3E1708', '#A2501C', '#F2D58E', '#6E2C0E', '#E8A050'],
    crunchy: 0.55,
  };
})();
