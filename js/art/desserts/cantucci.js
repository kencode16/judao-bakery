/* 義式杏仁脆餅（Cantucci／Biscotti di Prato）
 * 兩片斜切的長條脆餅平放、前後錯開。每片的切面是「一邊平直、一邊圓拱」的長條，
 * 乳黃到淺金的餅體裡嵌著整顆杏仁的橫切面（白芯＋褐色薄皮），外圈是烤得金褐的硬皮。
 * 斜上方俯視、光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const SQ = 0.66, TH = 13;      // 切面俯視壓扁比、厚度

  // 切面外形（本地座標：x 沿長邊，y 往前；y=-W/2 平直邊在後，前方是圓拱邊）
  // 半個「方圓形」：後方平直、前方圓拱，兩端圓順收到平直邊
  const NA = 34;                 // 圓拱邊的點數（index 1～NA+1）
  function outlineLocal(L, W) {
    const pts = [], hl = L / 2, p = 2.8;
    pts.push([-hl, -W / 2]);
    for (let i = 0; i <= NA; i++) {
      const t = i / NA, x = hl * Math.cos(t * Math.PI);           // 右→左
      const h = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x / hl), p)), 1 / p);
      pts.push([x, -W / 2 + W * h]);
    }
    return pts;
  }
  function slice(ctx, cx, cy, rot, L, W, seed) {
    const rnd = K.rng(seed);
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const P = (x, y) => [cx + x * cr - y * SQ * sr, cy + x * sr + y * SQ * cr];
    const loc = outlineLocal(L, W);
    const face = loc.map(([x, y]) => P(x, y));
    const path = (dy) => {
      ctx.beginPath();
      face.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy));
      ctx.closePath();
    };
    const bodyPath = () => { ctx.beginPath(); for (let dy = 0; dy <= TH; dy += 1.5) {
      face.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy)); ctx.closePath(); } };

    // 外輪廓（畫在後面）
    bodyPath();
    ctx.strokeStyle = 'rgba(120,66,22,0.85)'; ctx.lineWidth = 2.3; ctx.lineJoin = 'round'; ctx.stroke();
    // 側面：硬皮
    bodyPath();
    ctx.fillStyle = '#C8843C'; ctx.fill();
    ctx.save();
    bodyPath(); ctx.clip();
    const gs = ctx.createLinearGradient(0, cy - 10, 0, cy + W * SQ + TH);
    gs.addColorStop(0, '#E0A55C'); gs.addColorStop(0.6, '#C27A34'); gs.addColorStop(1, '#94541E');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, 200, 200);
    // 硬皮上的小裂紋與烤色
    for (let i = 0; i < 22; i++) {
      const t = rnd(), idx = Math.floor(3 + t * (NA - 5));
      const p = face[Math.min(face.length - 1, idx)];
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(110,55,15,0.35)' : 'rgba(255,215,150,0.35)';
      ctx.beginPath(); ctx.ellipse(p[0] + (rnd() - 0.5) * 6, p[1] + 3 + rnd() * (TH - 4), 1.5 + rnd() * 2.5, 0.8 + rnd(), 0, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // 切面
    path(0);
    const g = ctx.createLinearGradient(P(-L / 2, -W / 2)[0], P(0, -W / 2)[1], P(L / 2, W / 2)[0], P(0, W / 2)[1]);
    g.addColorStop(0, '#F0CF8E'); g.addColorStop(0.5, '#E5B672'); g.addColorStop(1, '#D59E58');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    path(0); ctx.clip();
    // 餅體的細小氣孔與顆粒
    for (let i = 0; i < 120; i++) {
      const p = P((rnd() - 0.5) * L, (rnd() - 0.5) * W * 1.4);
      ctx.fillStyle = rnd() < 0.55 ? 'rgba(180,120,50,0.4)' : 'rgba(255,245,215,0.6)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.5 + rnd() * 0.9, 0.4 + rnd() * 0.5, rot, 0, TAU); ctx.fill();
    }
    // 外圈硬皮（圓拱邊最深）
    ctx.lineJoin = 'round';
    path(0); ctx.strokeStyle = 'rgba(196,124,52,0.9)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath();
    loc.slice(3, NA).forEach(([x, y], i) => { const p = P(x, y); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
    ctx.strokeStyle = 'rgba(160,88,30,0.8)'; ctx.lineWidth = 6; ctx.stroke();
    // 杏仁橫切面
    const n = Math.round(L / 24);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + 14 + (i + 0.15 + rnd() * 0.7) * (L - 26) / n;
      const hgt = W * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x / (L / 2)), 2.8)), 1 / 2.8);
      const y = -W / 2 + hgt * (0.3 + rnd() * 0.4);
      const p = P(x, y);
      const ax = 8.5 + rnd() * 2.5, ay = 5 + rnd() * 1.4;
      const ar = rot + (rnd() - 0.5) * 0.9;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ar); ctx.scale(1, SQ * 1.25);
      // 杏仁外形：一頭尖的淚滴
      const almond = () => {
        ctx.beginPath();
        ctx.moveTo(-ax, 0);
        ctx.bezierCurveTo(-ax * 0.6, -ay * 1.15, ax * 0.5, -ay * 1.05, ax, 0);
        ctx.bezierCurveTo(ax * 0.5, ay * 1.05, -ax * 0.6, ay * 1.15, -ax, 0);
        ctx.closePath();
      };
      almond();
      ctx.fillStyle = '#8A4E22'; ctx.fill();                       // 褐色薄皮
      ctx.scale(0.84, 0.74);
      almond();
      const ga = ctx.createLinearGradient(-ax, -ay, ax, ay);
      ga.addColorStop(0, '#FFF8E8'); ga.addColorStop(1, '#EAD6B0');
      ctx.fillStyle = ga; ctx.fill();
      ctx.strokeStyle = 'rgba(200,170,120,0.6)'; ctx.lineWidth = 0.6;   // 兩瓣之間的線
      ctx.beginPath(); ctx.moveTo(-ax * 0.8, 0); ctx.lineTo(ax * 0.75, 0); ctx.stroke();
      ctx.restore();
    }
    // 柔光
    const hl = P(-L * 0.18, -W * 0.15);
    const gh = ctx.createRadialGradient(hl[0], hl[1], 1, hl[0], hl[1], L * 0.35);
    gh.addColorStop(0, 'rgba(255,250,230,0.35)'); gh.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    // 切面與側面交界的亮線
    ctx.strokeStyle = 'rgba(255,225,170,0.6)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    loc.slice(4, NA - 1).forEach(([x, y], i) => { const p = P(x, y); i ? ctx.lineTo(p[0], p[1] + 0.8) : ctx.moveTo(p[0], p[1] + 0.8); });
    ctx.stroke();
  }

  function draw(ctx) {
    slice(ctx, 106, 58, -0.28, 140, 44, 5);
    slice(ctx, 94, 104, -0.28, 140, 44, 12);
  }

  window.DESSERTS['cantucci'] = {
    draw,
    crumbs: ['#EDC98A', '#C8843C', '#FFF8E8', '#9A5E2E', '#F6DDA8'],
    crunchy: 1.0,
  };
})();
