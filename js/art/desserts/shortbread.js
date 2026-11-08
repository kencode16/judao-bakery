/* 蘇格蘭奶油酥餅（Shortbread fingers）
 * 斜上 45 度：兩條淡金色的長方形奶油酥餅交叉疊成 X 形。頂面有兩排叉子戳的小孔、撒了細砂糖，
 * 邊角方正、側面是酥鬆的沙狀質地，底緣烤得稍微金黃。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;

  const CX = 100, CY = 128, KY = 0.55;
  const L = 146, W = 48, T = 23;
  const FINGERS = [
    { x: 0, y: 12, z: 0, phi: -24 * D2R, seed: 1 },      // 下面那條
    { x: 2, y: 8, z: T, phi: 56 * D2R, seed: 2 },       // 交叉疊在上面那條
  ];

  function mk(f) {
    const co = Math.cos(f.phi), si = Math.sin(f.phi);
    // 本地 (u 沿長邊, v 沿短邊, 高度 h) → 畫面
    const P = (u, v, h) => {
      const x = f.x + u * co - v * si, y = f.y + u * si + v * co;
      return [CX + x, CY + y * KY - f.z - (h || 0)];
    };
    return { P, co, si };
  }
  const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };

  function drawFinger(ctx, f) {
    const { P, co, si } = mk(f);
    const hu = L / 2, hv = W / 2;
    const top = [P(-hu, -hv, T), P(hu, -hv, T), P(hu, hv, T), P(-hu, hv, T)];
    // 四個側面：法向量 (co, si)、(-si, co) 及其反向；平面 y 分量 > 0 才看得到
    const faces = [
      { n: [co, si], pts: [P(hu, -hv, T), P(hu, hv, T), P(hu, hv, 0), P(hu, -hv, 0)] },
      { n: [-co, -si], pts: [P(-hu, hv, T), P(-hu, -hv, T), P(-hu, -hv, 0), P(-hu, hv, 0)] },
      { n: [-si, co], pts: [P(hu, hv, T), P(-hu, hv, T), P(-hu, hv, 0), P(hu, hv, 0)] },
      { n: [si, -co], pts: [P(-hu, -hv, T), P(hu, -hv, T), P(hu, -hv, 0), P(-hu, -hv, 0)] },
    ].filter(fc => fc.n[1] > 0.02);

    const rnd = K.rng(100 + f.seed);
    faces.forEach(fc => {
      // 左上受光：法向量越朝左越亮
      const lit = -fc.n[0] * 0.6 + fc.n[1] * 0.4;
      poly(ctx, fc.pts);
      const g = ctx.createLinearGradient(0, fc.pts[0][1], 0, fc.pts[2][1]);
      g.addColorStop(0, K.shade('#F6DFA6', lit * 0.25));
      g.addColorStop(0.7, K.shade('#EFCF8A', lit * 0.2 - 0.04));
      g.addColorStop(1, K.shade('#D9A95E', lit * 0.15 - 0.05));
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); poly(ctx, fc.pts); ctx.clip();
      // 酥鬆的沙狀質地
      const xs = fc.pts.map(p => p[0]), ys = fc.pts.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      for (let i = 0; i < 160; i++) {
        const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
        ctx.fillStyle = rnd() < 0.55 ? 'rgba(190,130,55,0.35)' : 'rgba(255,248,225,0.6)';
        ctx.beginPath(); ctx.ellipse(x, y, 0.5 + rnd() * 0.9, 0.4 + rnd() * 0.6, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    });

    // 頂面
    poly(ctx, top);
    const g = ctx.createLinearGradient(top[0][0], top[0][1], top[2][0], top[2][1]);
    g.addColorStop(0, '#FBE7B4');
    g.addColorStop(0.5, '#F4D898');
    g.addColorStop(1, '#E9C47C');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    poly(ctx, top); ctx.clip();
    // 邊緣一圈淡淡烤色
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(215,160,80,0.35)'; poly(ctx, top); ctx.stroke();
    // 細砂糖
    for (let i = 0; i < 170; i++) {
      const p = P((rnd() - 0.5) * L, (rnd() - 0.5) * W, T);
      ctx.fillStyle = `rgba(255,255,250,${0.55 + rnd() * 0.45})`;
      ctx.fillRect(p[0], p[1], 0.9 + rnd() * 0.5, 0.8 + rnd() * 0.4);
      if (rnd() < 0.25) { ctx.fillStyle = 'rgba(205,150,75,0.4)'; ctx.fillRect(p[0] + 1.5, p[1] + 1, 0.8, 0.8); }
    }
    // 叉子小孔：兩排
    const N = 5;
    for (let r = 0; r < 2; r++) {
      for (let k = 0; k < N; k++) {
        const u = -hu + L * (k + 0.5) / N + (r ? 4 : -4), v = r ? hv * 0.42 : -hv * 0.42;
        const c = P(u, v, T);
        const rx = 2.5, ry = 2.5 * KY + 0.2;
        ctx.fillStyle = 'rgba(255,248,225,0.85)';                      // 孔的下緣受光
        ctx.beginPath(); ctx.ellipse(c[0] + 0.5, c[1] + 0.9, rx, ry, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#A47234';
        ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(80,45,10,0.75)';
        ctx.beginPath(); ctx.ellipse(c[0] - 0.4, c[1] - 0.4, rx * 0.65, ry * 0.6, 0, 0, TAU); ctx.fill();
      }
    }
    // 左上柔光
    const gh = ctx.createRadialGradient(top[0][0] + 20, top[0][1] + 6, 2, top[0][0] + 20, top[0][1] + 6, 70);
    gh.addColorStop(0, 'rgba(255,255,240,0.35)');
    gh.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();

    // 稜線：頂面前緣亮線
    ctx.lineCap = 'round';
    faces.forEach(fc => {
      ctx.strokeStyle = 'rgba(255,250,230,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(fc.pts[0][0], fc.pts[0][1] + 0.6); ctx.lineTo(fc.pts[1][0], fc.pts[1][1] + 0.6); ctx.stroke();
    });
    // 外輪廓
    const all = [...top, ...faces.flatMap(fc => fc.pts)];
    ctx.strokeStyle = 'rgba(160,105,40,0.8)'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    const hull = convexHull(all);
    poly(ctx, hull); ctx.stroke();
    // 側面之間的垂直稜
    if (faces.length === 2) {
      const a = faces[0].pts, b = faces[1].pts;
      const shared = a.find(p => b.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.01 && p[1] < Math.max(...a.map(z => z[1])) - 1));
      if (shared) {
        ctx.strokeStyle = 'rgba(190,135,60,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(shared[0], shared[1] + 1); ctx.lineTo(shared[0], shared[1] + T - 1); ctx.stroke();
      }
    }
  }

  function convexHull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // 上面那條在下面那條頂面投下的影子
  function castShadow(ctx) {
    const b = mk(FINGERS[0]), t = mk(FINGERS[1]);
    const hu = L / 2, hv = W / 2;
    ctx.save();
    poly(ctx, [b.P(-hu, -hv, T), b.P(hu, -hv, T), b.P(hu, hv, T), b.P(-hu, hv, T)]);
    ctx.clip();
    ctx.translate(3.5, 4.5);
    poly(ctx, [t.P(-hu, -hv, 0), t.P(hu, -hv, 0), t.P(hu, hv, 0), t.P(-hu, hv, 0)]);
    ctx.fillStyle = 'rgba(140,90,30,0.32)'; ctx.fill();
    ctx.restore();
  }

  function draw(ctx) {
    drawFinger(ctx, FINGERS[0]);
    castShadow(ctx);
    drawFinger(ctx, FINGERS[1]);
  }

  window.DESSERTS['shortbread'] = {
    draw,
    crumbs: ['#F4D898', '#FBE7B4', '#E9C47C', '#FFF8E6', '#D9A95E'],
    crunchy: 0.9,
  };
})();
