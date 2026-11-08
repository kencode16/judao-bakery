/* 三色糰子（花見だんご）
 * 一支竹籤斜斜擺著（左下握柄 → 右上），由上而下串著粉紅、白、綠三顆糰子。
 * 糰子是霧面的米麻糬球，左上柔光；近的那顆在遠的那顆上投下淡淡的影子。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const TH = -45 * Math.PI / 180;
  const DX = Math.cos(TH), DY = Math.sin(TH);     // 竹籤方向（往右上）
  const NX = -DY, NY = DX;                         // 垂直方向
  const C = { x: 102, y: 97 };                     // 中間那顆（白）的中心
  const R = 33, S = 57;                            // 糰子半徑、間距（略小於直徑：互相擠著）
  const at = t => [C.x + DX * t, C.y + DY * t];

  const BALLS = [
    // 由遠（右上）畫到近（左下）
    { t: S, hi: '#FFE6EE', mid: '#F7A6BE', lo: '#DB7896', edge: 'rgba(170,70,105,0.7)', seed: 3, speck: 'rgba(230,120,150,0.35)' },
    { t: 0, hi: '#FFFFFF', mid: '#F8F3EE', lo: '#D9CCC2', edge: 'rgba(150,120,105,0.65)', seed: 5, speck: 'rgba(190,170,150,0.3)' },
    { t: -S, hi: '#E4F2C6', mid: '#A9CF78', lo: '#6F9A44', edge: 'rgba(70,105,40,0.75)', seed: 7, speck: 'rgba(70,110,40,0.4)' },
  ];

  function stickPath(ctx, t0, t1, w) {
    const a = at(t0), b = at(t1);
    ctx.beginPath();
    ctx.moveTo(a[0] + NX * w, a[1] + NY * w);
    ctx.lineTo(b[0] + NX * w, b[1] + NY * w);
    ctx.lineTo(b[0] - NX * w, b[1] - NY * w);
    ctx.lineTo(a[0] - NX * w, a[1] - NY * w);
    ctx.closePath();
  }
  function stickFill(ctx) {
    const a = at(0);
    const g = ctx.createLinearGradient(a[0] + NX * 4, a[1] + NY * 4, a[0] - NX * 4, a[1] - NY * 4);
    g.addColorStop(0, '#F3E0B0');
    g.addColorStop(0.5, '#DDBE80');
    g.addColorStop(1, '#B48F55');
    return g;
  }

  /* ---------- 竹籤：握柄（左下）與穿出的尖端（右上） ---------- */
  function drawHandle(ctx) {
    const t0 = -S - 52, t1 = -S - 10, w = 3.8;
    stickPath(ctx, t0, t1, w);
    ctx.fillStyle = stickFill(ctx); ctx.fill();
    // 竹纖維
    ctx.strokeStyle = 'rgba(150,115,60,0.35)'; ctx.lineWidth = 0.6;
    for (const o of [-1.4, 1.2]) {
      const a = at(t0 + 3), b = at(t1);
      ctx.beginPath(); ctx.moveTo(a[0] + NX * o, a[1] + NY * o); ctx.lineTo(b[0] + NX * o, b[1] + NY * o); ctx.stroke();
    }
    stickPath(ctx, t0, t1, w);
    ctx.strokeStyle = 'rgba(120,85,40,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    // 切口
    const a = at(t0);
    ctx.fillStyle = '#C9A56A';
    ctx.beginPath(); ctx.ellipse(a[0], a[1], w, w * 0.55, TH + Math.PI / 2, 0, TAU); ctx.fill();
  }
  function drawTip(ctx) {
    const t0 = S + 8, t1 = S + R + 7, w = 3.4;
    const a = at(t0), b = at(t1);
    ctx.beginPath();
    ctx.moveTo(a[0] + NX * w, a[1] + NY * w);
    ctx.lineTo(b[0] + NX * 0.8, b[1] + NY * 0.8);
    ctx.lineTo(b[0] - NX * 0.8, b[1] - NY * 0.8);
    ctx.lineTo(a[0] - NX * w, a[1] - NY * w);
    ctx.closePath();
    ctx.fillStyle = stickFill(ctx); ctx.fill();
    ctx.strokeStyle = 'rgba(120,85,40,0.7)'; ctx.lineWidth = 1.3; ctx.stroke();
  }

  /* ---------- 一顆糰子 ---------- */
  function drawBall(ctx, b) {
    const [x, y] = at(b.t);
    // 投在後面那顆上的柔影（只有中、近兩顆）
    ctx.save();
    ctx.shadowColor = 'rgba(90,60,50,0.28)';
    ctx.shadowBlur = 7; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
    ctx.beginPath(); ctx.ellipse(x, y, R * 0.97, R, TH, 0, TAU);
    ctx.fillStyle = b.mid; ctx.fill();
    ctx.restore();

    const g = ctx.createRadialGradient(x - R * 0.38, y - R * 0.42, 1, x - R * 0.1, y - R * 0.1, R * 1.12);
    g.addColorStop(0, b.hi);
    g.addColorStop(0.5, b.mid);
    g.addColorStop(1, b.lo);
    ctx.beginPath(); ctx.ellipse(x, y, R * 0.97, R, TH, 0, TAU);
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, R * 0.97, R, TH, 0, TAU); ctx.clip();
    // 霧面的米粒感
    const rnd = K.rng(b.seed);
    for (let i = 0; i < 30; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.95;
      ctx.fillStyle = rnd() < 0.6 ? b.speck : 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.5 + rnd() * 0.7, 0, TAU); ctx.fill();
    }
    // 右下的反光（環境光）
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x - 1, y - 1, R - 3, 0.2, 1.35); ctx.stroke();
    // 左上的柔亮
    const gh = ctx.createRadialGradient(x - R * 0.4, y - R * 0.45, 0.5, x - R * 0.4, y - R * 0.45, R * 0.45);
    gh.addColorStop(0, 'rgba(255,255,255,0.85)');
    gh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gh;
    ctx.beginPath(); ctx.arc(x - R * 0.4, y - R * 0.45, R * 0.45, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.ellipse(x, y, R * 0.97, R, TH, 0, TAU);
    ctx.strokeStyle = b.edge; ctx.lineWidth = 2; ctx.stroke();
  }

  function draw(ctx) {
    drawTip(ctx);
    drawBall(ctx, BALLS[0]);
    drawBall(ctx, BALLS[1]);
    drawHandle(ctx);
    drawBall(ctx, BALLS[2]);
  }

  window.DESSERTS['dango'] = {
    draw,
    crumbs: ['#F7A6BE', '#FFFFFF', '#A9CF78', '#F8F3EE', '#DDBE80'],
    crunchy: 0.05,
  };
})();
