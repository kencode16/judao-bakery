/* 草仔粿（caozaiguo）
 * 深綠色、Q 軟的橢圓粿，表面抹了油亮亮的，看得到鼠麴草的細纖維；底下墊一片剪成圓形的香蕉葉。
 * 小圖重點：粉紅底上的「綠色圓粿＋淺綠葉片」。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const LEAF = { cx: 100, cy: 116, rx: 82, ry: 48 };
  const BASE = { cy: 114, rx: 72, ry: 40 };     // 粿的底面
  const HT = 50;                                // 粿的高度

  /* ---------- 香蕉葉 ---------- */
  function leafPath(ctx, dy) {
    ctx.beginPath();
    const r = K.rng(5);
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * TAU;
      const n = 1 + 0.03 * Math.sin(3 * a + 1) + 0.018 * Math.sin(7 * a + 2) + (r() - 0.5) * 0.01;   // 剪刀剪的葉子，不是正圓
      const x = LEAF.cx + Math.cos(a) * LEAF.rx * n, y = LEAF.cy + (dy || 0) + Math.sin(a) * LEAF.ry * n;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawLeaf(ctx) {
    // 葉片厚度
    leafPath(ctx, 3);
    ctx.fillStyle = '#4E7F2A';
    ctx.fill();
    leafPath(ctx);
    const g = ctx.createLinearGradient(LEAF.cx - LEAF.rx, LEAF.cy - LEAF.ry, LEAF.cx + LEAF.rx, LEAF.cy + LEAF.ry);
    g.addColorStop(0, '#B5DB6E');
    g.addColorStop(0.5, '#8EC24E');
    g.addColorStop(1, '#6EA23A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    leafPath(ctx); ctx.clip();
    // 中脈＋平行側脈（斜的）
    ctx.strokeStyle = 'rgba(222,240,170,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(10, 170); ctx.lineTo(196, 88); ctx.stroke();
    ctx.lineWidth = 0.9;
    for (let k = -14; k <= 14; k++) {
      ctx.strokeStyle = k % 3 === 0 ? 'rgba(90,140,50,0.45)' : 'rgba(220,240,170,0.35)';
      ctx.beginPath();
      ctx.moveTo(10 + k * 9, 170 - k * 4 - 60); ctx.lineTo(10 + k * 9 + 120, 170 - k * 4 + 20);
      ctx.stroke();
    }
    // 葉面光澤
    ctx.fillStyle = 'rgba(255,255,230,0.25)';
    ctx.beginPath(); ctx.ellipse(LEAF.cx - 46, LEAF.cy - 18, 30, 8, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,100,30,0.6)';
    ctx.lineWidth = 1.6;
    leafPath(ctx); ctx.stroke();
  }

  /* ---------- 粿 ---------- */
  function guoPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const t = Math.PI + Math.PI * i / 48;
      const c = Math.cos(t), s = -Math.sin(t);
      const x = CX + c * BASE.rx * (1 - 0.07 * s * s);
      const y = BASE.cy - HT * Math.pow(s, 0.62) - 6 * s * c;  // 稍微往左上隆起
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.ellipse(CX, BASE.cy, BASE.rx, BASE.ry * 0.62, 0, 0, Math.PI, false);
    ctx.closePath();
  }
  function drawGuo(ctx) {
    // 粿壓在葉子上的陰影
    ctx.fillStyle = 'rgba(40,70,20,0.35)';
    ctx.beginPath(); ctx.ellipse(CX + 6, BASE.cy + 6, BASE.rx + 2, BASE.ry * 0.62, 0, 0, TAU); ctx.fill();

    guoPath(ctx);
    const g = ctx.createRadialGradient(CX - 26, BASE.cy - HT * 0.8, 4, CX + 6, BASE.cy - HT * 0.3, 86);
    g.addColorStop(0, '#7FA850');
    g.addColorStop(0.4, '#557F33');
    g.addColorStop(0.8, '#3B6224');
    g.addColorStop(1, '#2C4B1A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    guoPath(ctx); ctx.clip();
    // 鼠麴草的細纖維與小點
    const r = K.rng(606);
    ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const x = CX - BASE.rx + r() * BASE.rx * 2, y = BASE.cy - HT - 4 + r() * (HT + 26);
      const a = r() * Math.PI, l = 1.5 + r() * 3;
      ctx.strokeStyle = r() < 0.6 ? 'rgba(28,48,16,0.45)' : 'rgba(170,200,110,0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
    // 底部（接觸葉片）較暗
    const v = ctx.createLinearGradient(0, BASE.cy - 16, 0, BASE.cy + BASE.ry * 0.62);
    v.addColorStop(0, 'rgba(20,40,10,0)');
    v.addColorStop(1, 'rgba(20,40,10,0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, BASE.cy - 16, 200, 50);
    // 油亮的高光：一大片柔光＋一道亮點
    ctx.save();
    ctx.translate(CX - 24, BASE.cy - HT * 0.72);
    ctx.rotate(-0.35);
    ctx.scale(1, 0.5);
    const hl = ctx.createRadialGradient(0, 0, 1, 0, 0, 30);
    hl.addColorStop(0, 'rgba(240,255,210,0.75)');
    hl.addColorStop(0.5, 'rgba(220,245,180,0.25)');
    hl.addColorStop(1, 'rgba(220,245,180,0)');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,245,0.85)';
    ctx.beginPath(); ctx.ellipse(CX - 30, BASE.cy - HT * 0.78, 9, 3, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,245,0.6)';
    ctx.beginPath(); ctx.ellipse(CX - 14, BASE.cy - HT * 0.9, 3, 1.4, -0.2, 0, TAU); ctx.fill();
    // 右側邊緣的反光（環境光）
    ctx.strokeStyle = 'rgba(160,200,110,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, BASE.cy - 6, BASE.rx - 3, BASE.ry * 0.62 + 6, 0, -0.1, 0.9); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(26,48,14,0.65)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    guoPath(ctx); ctx.stroke();
  }

  function draw(ctx) {
    ctx.translate(0, -5);
    drawLeaf(ctx);
    drawGuo(ctx);
  }

  window.DESSERTS['caozaiguo'] = {
    draw,
    crumbs: ['#557F33', '#7FA850', '#3B6224', '#8EC24E'],
    crunchy: 0.05,
  };
})();
