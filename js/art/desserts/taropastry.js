/* 芋頭酥（taropastry）
 * 圓圓的酥餅，頂面是紫白相間的螺旋酥皮（一圈圈從中心捲出來），側面是一層層紫色酥皮。
 * 小圖重點：黃底上的「紫色螺旋圓」。和抹茶蛋糕捲（綠）、肉桂捲（褐＋白糖霜）區分。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const TOP = { cy: 86, rx: 80, ry: 54 };
  const BOT = { cy: 114, rx: 74, ry: 47 };
  const SQ = TOP.ry / TOP.rx;

  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const nT = makeNoise(17, 1.3, [3, 6, 11, 17]);
  const ep = (e, th, n) => [CX + Math.cos(th) * (e.rx + n), e.cy + Math.sin(th) * (e.ry + n * e.ry / e.rx)];

  function topPath(ctx, inset) {
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const th = TAU * i / 120; const p = ep(TOP, th, nT(th) - (inset || 0)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }
  // 外輪廓：頂面上半＋鼓起的側面＋底面下半
  function sideX(t, side) {
    const e = { rx: TOP.rx + (BOT.rx - TOP.rx) * t };
    return CX + side * (e.rx + 6 * Math.sin(Math.PI * t * 0.9));
  }
  function silhouette(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const th = Math.PI + Math.PI * i / 60; const p = ep(TOP, th, nT(th)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 0; i <= 12; i++) { const t = i / 12; ctx.lineTo(sideX(t, 1), TOP.cy + (BOT.cy - TOP.cy) * t); }
    for (let i = 0; i <= 60; i++) { const th = Math.PI * i / 60; const p = ep(BOT, th, 0); ctx.lineTo(p[0], p[1]); }
    for (let i = 12; i >= 0; i--) { const t = i / 12; ctx.lineTo(sideX(t, -1), TOP.cy + (BOT.cy - TOP.cy) * t); }
    ctx.closePath();
  }

  /* ---------- 側面：一層層紫色酥皮 ---------- */
  function drawSide(ctx) {
    silhouette(ctx);
    const g = ctx.createLinearGradient(CX - 84, 0, CX + 84, 0);
    g.addColorStop(0, '#B892D6');
    g.addColorStop(0.35, '#C7A6E0');
    g.addColorStop(0.75, '#9A6CC0');
    g.addColorStop(1, '#6F4394');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    silhouette(ctx); ctx.clip();
    // 一層層的酥皮線（淺、深交錯，略為斷續）
    const r = K.rng(29);
    for (let k = 0; k < 9; k++) {
      const t = (k + 0.6) / 9;
      const e = { cy: TOP.cy + (BOT.cy - TOP.cy) * t, rx: (sideX(t, 1) - CX), ry: TOP.ry + (BOT.ry - TOP.ry) * t };
      let th = 0.02;
      while (th < Math.PI - 0.02) {
        const end = Math.min(Math.PI - 0.02, th + 0.35 + r() * 0.7);
        const light = k % 2 === 0;
        ctx.strokeStyle = light ? `rgba(246,236,250,${0.5 + r() * 0.3})` : `rgba(88,46,120,${0.35 + r() * 0.2})`;
        ctx.lineWidth = light ? 1.4 : 1;
        ctx.beginPath();
        for (let a = th; a <= end; a += 0.05) { const p = [CX + Math.cos(a) * e.rx, e.cy + Math.sin(a) * e.ry + (r() - 0.5) * 0.5]; a === th ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
        th = end + 0.04 + r() * 0.12;
      }
    }
    // 底部烤得微微金黃、右下暗
    const v = ctx.createLinearGradient(0, BOT.cy, 0, BOT.cy + BOT.ry);
    v.addColorStop(0, 'rgba(90,46,120,0)');
    v.addColorStop(0.7, 'rgba(90,46,120,0.25)');
    v.addColorStop(1, 'rgba(176,120,70,0.35)');
    ctx.fillStyle = v;
    ctx.fillRect(0, BOT.cy, 200, 60);
    const d = ctx.createLinearGradient(CX, 0, CX + 84, 0);
    d.addColorStop(0, 'rgba(60,24,80,0)');
    d.addColorStop(1, 'rgba(60,24,80,0.3)');
    ctx.fillStyle = d;
    ctx.fillRect(CX, TOP.cy, 90, 90);
    // 頂面邊緣下的陰影
    ctx.strokeStyle = 'rgba(70,30,96,0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy + 3, TOP.rx, TOP.ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面：紫白螺旋 ---------- */
  const TURNS = 3.7;
  function spiralPts(off) {
    const pts = [];
    const end = TURNS * TAU;
    for (let a = 0.3; a <= end; a += 0.06) {
      const r = Math.pow(a / end, 0.92) * 0.97 + off + 0.012 * Math.sin(5 * a) * (a / end);
      const th = a + 0.6;
      pts.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    return pts;
  }
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(80, 70, 4, 100, 86, 84);
    g.addColorStop(0, '#EFE2F8');
    g.addColorStop(0.6, '#CDB0E6');
    g.addColorStop(1, '#A57CC8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 螺旋：在單位圓座標裡畫，再壓成橢圓
    ctx.save();
    ctx.translate(CX + 2, TOP.cy - 2);
    ctx.scale(TOP.rx, TOP.rx * SQ);
    const pitch = 0.97 / TURNS;
    const line = (pts, w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 深紫的寬帶
    line(spiralPts(0), pitch * 0.64, '#8752B2');
    // 帶子外緣的陰影（層與層之間的落差）
    line(spiralPts(pitch * 0.2), pitch * 0.2, 'rgba(92,48,130,0.8)');
    // 帶子內緣的亮脊（酥皮鼓起）
    line(spiralPts(-pitch * 0.14), pitch * 0.2, 'rgba(196,160,228,0.85)');
    // 白色細層（兩帶之間）
    line(spiralPts(pitch * 0.47), pitch * 0.13, 'rgba(250,244,252,0.95)');
    // 酥層斷續的小裂口：沿螺旋隔一段點一點白
    const sp = spiralPts(pitch * 0.02), rb = K.rng(61);
    ctx.fillStyle = 'rgba(244,234,250,0.45)';
    for (let i = 8; i < sp.length; i += 9 + Math.floor(rb() * 8)) {
      ctx.beginPath(); ctx.ellipse(sp[i][0], sp[i][1], pitch * 0.1, pitch * 0.04, Math.atan2(sp[i][1], sp[i][0]) + Math.PI / 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 酥皮斷裂的小缺口
    const r = K.rng(404);
    for (let i = 0; i < 28; i++) {
      const a = r() * TAU, d = 0.2 + r() * 0.75;
      const x = CX + Math.cos(a) * d * TOP.rx, y = TOP.cy + Math.sin(a) * d * TOP.ry;
      ctx.fillStyle = r() < 0.5 ? 'rgba(250,244,252,0.7)' : 'rgba(96,52,130,0.4)';
      ctx.beginPath(); ctx.ellipse(x, y, 1.2 + r() * 1.8, 0.6 + r() * 0.8, a + Math.PI / 2, 0, TAU); ctx.fill();
    }
    // 隆起：左上亮、右下暗
    const hl = ctx.createRadialGradient(78, 66, 2, 78, 66, 52);
    hl.addColorStop(0, 'rgba(255,255,255,0.5)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 20, 200, 120);
    const dm = ctx.createLinearGradient(70, 50, 170, 130);
    dm.addColorStop(0, 'rgba(70,30,100,0)');
    dm.addColorStop(0.55, 'rgba(70,30,100,0)');
    dm.addColorStop(1, 'rgba(70,30,100,0.4)');
    ctx.fillStyle = dm;
    ctx.fillRect(0, 20, 200, 120);
    // 外緣一圈
    ctx.strokeStyle = 'rgba(110,64,150,0.5)';
    ctx.lineWidth = 3;
    topPath(ctx); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(250,244,252,0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy + 0.5, TOP.rx - 4, TOP.ry - 3, 0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    ctx.strokeStyle = 'rgba(84,40,116,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    silhouette(ctx);
    ctx.stroke();
  }

  window.DESSERTS['taropastry'] = {
    draw,
    crumbs: ['#8A57B4', '#D2B6E8', '#F6EEF5', '#B892D6', '#6F4394'],
    crunchy: 0.8,
  };
})();
