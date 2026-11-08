/* 豆花（douhua）
 * 白瓷碗（碗口一圈藍邊）裝著一片片白嫩豆花，淋上琥珀色糖水，
 * 加紅豆、花生、芋圓、粉圓。小圖重點：碗＋白豆花＋彩色配料。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const RIM = { cy: 76, rx: 86, ry: 45 };     // 碗口外緣
  const LIP = { cy: 77, rx: 80, ry: 41 };   // 碗口內緣
  const SOUP = { cy: 83, rx: 74, ry: 36 };    // 糖水液面
  const FOOT = { cy: 164, rx: 32, ry: 11 };   // 碗腳

  // 碗身外輪廓：碗口下半 → 弧形碗身 → 碗腳
  function bodyPath(ctx) {
    ctx.beginPath();
    ctx.ellipse(CX, RIM.cy, RIM.rx, RIM.ry, 0, Math.PI, 0, true);
    ctx.bezierCurveTo(CX + RIM.rx, RIM.cy + 50, CX + FOOT.rx + 22, FOOT.cy - 14, CX + FOOT.rx, FOOT.cy - 6);
    ctx.lineTo(CX + FOOT.rx, FOOT.cy);
    ctx.ellipse(CX, FOOT.cy, FOOT.rx, FOOT.ry, 0, 0, Math.PI, false);
    ctx.lineTo(CX - FOOT.rx, FOOT.cy - 6);
    ctx.bezierCurveTo(CX - FOOT.rx - 22, FOOT.cy - 14, CX - RIM.rx, RIM.cy + 50, CX - RIM.rx, RIM.cy);
    ctx.closePath();
  }

  function drawBowl(ctx) {
    bodyPath(ctx);
    const g = ctx.createLinearGradient(CX - RIM.rx, 0, CX + RIM.rx, 0);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.3, '#F8F6F2');
    g.addColorStop(0.75, '#DCD8D2');
    g.addColorStop(1, '#BDB7AF');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    bodyPath(ctx); ctx.clip();
    // 下方較暗
    const v = ctx.createLinearGradient(0, RIM.cy, 0, FOOT.cy + 10);
    v.addColorStop(0, 'rgba(120,110,100,0)');
    v.addColorStop(1, 'rgba(120,110,100,0.35)');
    ctx.fillStyle = v;
    ctx.fillRect(0, RIM.cy, 200, 110);
    // 碗口下的藍色寬帶＋細線（青花風）
    ctx.strokeStyle = '#3F6FB5';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(CX, RIM.cy + 11, RIM.rx - 1.5, RIM.ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    ctx.strokeStyle = 'rgba(63,111,181,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(CX, RIM.cy + 19, RIM.rx - 4, RIM.ry - 1, 0, 0.06, Math.PI - 0.06); ctx.stroke();
    // 藍帶上的小白點花紋
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 1; i < 14; i++) {
      const a = Math.PI * i / 14;
      ctx.beginPath(); ctx.arc(CX + Math.cos(a) * (RIM.rx - 1.5), RIM.cy + 11 + Math.sin(a) * RIM.ry, 1.2, 0, TAU); ctx.fill();
    }
    // 碗腳上方的細藍線
    ctx.strokeStyle = 'rgba(63,111,181,0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(CX, FOOT.cy - 8, FOOT.rx + 6, FOOT.ry + 1, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    // 瓷器反光
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(CX - RIM.rx + 14, RIM.cy + 30); ctx.quadraticCurveTo(CX - RIM.rx + 26, RIM.cy + 58, CX - 46, FOOT.cy - 18); ctx.stroke();
    ctx.restore();
    // 碗腳
    ctx.beginPath(); ctx.ellipse(CX, FOOT.cy, FOOT.rx, FOOT.ry, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(140,130,120,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
    // 外輪廓
    ctx.strokeStyle = 'rgba(120,108,96,0.65)';
    ctx.lineWidth = 2;
    bodyPath(ctx); ctx.stroke();

    // 碗口：外緣到內緣的一圈（上面平平的瓷）
    ctx.beginPath();
    ctx.ellipse(CX, RIM.cy, RIM.rx, RIM.ry, 0, 0, TAU);
    ctx.fillStyle = '#FBFAF7';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,108,96,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 碗內壁（後方看得到）
    ctx.beginPath();
    ctx.ellipse(CX, LIP.cy, LIP.rx, LIP.ry, 0, 0, TAU);
    const w = ctx.createLinearGradient(0, LIP.cy - LIP.ry, 0, LIP.cy + LIP.ry);
    w.addColorStop(0, '#E2DED8');
    w.addColorStop(0.5, '#F4F2EE');
    w.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = w;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,140,128,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 內壁上的藍色細線
    ctx.strokeStyle = 'rgba(63,111,181,0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(CX, LIP.cy + 2, LIP.rx - 3, LIP.ry - 2, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  }

  /* ---------- 糖水與豆花 ---------- */
  function soupPath(ctx) { ctx.beginPath(); ctx.ellipse(CX, SOUP.cy, SOUP.rx, SOUP.ry, 0, 0, TAU); }
  function drawSoup(ctx) {
    soupPath(ctx);
    const g = ctx.createLinearGradient(0, SOUP.cy - SOUP.ry, 0, SOUP.cy + SOUP.ry);
    g.addColorStop(0, '#B8732C');
    g.addColorStop(1, '#DDA157');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    soupPath(ctx); ctx.clip();
    ctx.save();
    ctx.translate(0, SOUP.cy); ctx.scale(1, 1.2); ctx.translate(0, -86);   // 配料原本以液面 cy=86、ry=30 擺位
    // 一片片豆花（舀成薄片，邊緣圓潤），由後往前畫
    const slabs = [
      [68, 70, 32, 11, -0.15], [108, 68, 30, 10, 0.1], [50, 84, 26, 10, 0.25], [88, 84, 33, 12, -0.05],
      [62, 97, 28, 9, 0.1], [104, 97, 27, 10, 0.05],
    ];
    for (const [x, y, rx, ry, rot] of slabs) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      // 厚度（前緣較暗）
      ctx.fillStyle = '#E6DDCB';
      ctx.beginPath(); ctx.ellipse(0, 2.2, rx, ry, 0, 0, TAU); ctx.fill();
      const sg = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 1, 0, 0, rx);
      sg.addColorStop(0, '#FFFFFF');
      sg.addColorStop(0.6, '#FFFCF3');
      sg.addColorStop(1, '#F1EADA');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
      // 嫩滑光澤
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(-rx * 0.3, -ry * 0.35, rx * 0.35, ry * 0.18, -0.1, 0, TAU); ctx.fill();
      // 淋到的糖水
      ctx.fillStyle = 'rgba(206,140,62,0.35)';
      ctx.beginPath(); ctx.ellipse(rx * 0.35, ry * 0.3, rx * 0.4, ry * 0.3, 0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,140,0.6)';
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.restore();
    }
    // 配料：紅豆一堆（右後）、花生（右）、芋圓（前）、粉圓（右前）
    const r = K.rng(919);
    // 紅豆
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      const x = 138 + Math.cos(a) * d * 16, y = 76 + Math.sin(a) * d * 8;
      ctx.fillStyle = '#4A1414';
      ctx.beginPath(); ctx.ellipse(x + 0.6, y + 1, 4.2, 3, a, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8E2B26';
      ctx.beginPath(); ctx.ellipse(x, y, 4, 2.8, a, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,210,0.6)';
      ctx.beginPath(); ctx.ellipse(x - 1.2, y - 1, 1.3, 0.6, a, 0, TAU); ctx.fill();
    }
    // 花生（軟花生，米黃）
    for (let i = 0; i < 9; i++) {
      const x = 140 + (r() - 0.5) * 26, y = 96 + (r() - 0.5) * 10, a = r() * Math.PI;
      ctx.fillStyle = '#B98A55';
      ctx.beginPath(); ctx.ellipse(x + 0.6, y + 1, 5.2, 3.4, a, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F0D8AE';
      ctx.beginPath(); ctx.ellipse(x, y, 5, 3.2, a, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(190,140,90,0.6)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4); ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); ctx.stroke();
    }
    // 芋圓（紫、橘、米白的小圓柱）
    const taro = [[120, 104, '#A884C9'], [134, 106, '#F2A65A'], [148, 102, '#F3E6CC'], [80, 108, '#A884C9'], [100, 109, '#F2A65A']];
    for (const [x, y, col] of taro) {
      ctx.fillStyle = K.shade(col, -0.25);
      ctx.beginPath(); ctx.ellipse(x, y + 2.5, 6.4, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x, y, 6.2, 3.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(x - 2, y - 1.2, 2.4, 1, 0, 0, TAU); ctx.fill();
    }
    // 粉圓
    for (let i = 0; i < 8; i++) {
      const x = 156 + (r() - 0.5) * 14, y = 88 + (r() - 0.5) * 12;
      ctx.fillStyle = '#2B1A14';
      ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(x - 1.1, y - 1.1, 1, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 液面反光
    ctx.strokeStyle = 'rgba(255,240,210,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(CX, SOUP.cy, SOUP.rx - 4, SOUP.ry - 3, 0, Math.PI * 0.62, Math.PI * 0.85); ctx.stroke();
    // 後緣：內壁投下的陰影
    ctx.strokeStyle = 'rgba(90,50,20,0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(CX, SOUP.cy + 2, SOUP.rx, SOUP.ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    // 碗口稍寬，整體縮一點留給白邊貼紙
    ctx.translate(100, 100); ctx.scale(0.95, 0.95); ctx.translate(-100, -100);
    drawBowl(ctx);
    drawSoup(ctx);
  }

  window.DESSERTS['douhua'] = {
    draw,
    crumbs: ['#FFFCF3', '#DDA157', '#8E2B26', '#F0D8AE', '#A884C9'],
    crunchy: 0.05,
  };
})();
