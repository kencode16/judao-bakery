/* 蛋黃酥（eggyolkpastry）
 * 一顆完整的（圓頂、刷蛋液的亮金褐頂、黑芝麻、下半部淡色酥皮）＋前方一顆切半，
 * 切面露出白色酥皮、深色紅豆沙、正中間橘紅的鹹蛋黃（小圖一眼就認得）。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 共用：圓頂外形 ---------- */
  // 以底面中心 (cx, by) 為準：頂部弧線高 ht、半寬 R、底面橢圓扁 rb
  function domePath(ctx, cx, by, R, ht, rb) {
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = Math.PI + Math.PI * i / 40;                 // 上半：左→右
      const c = Math.cos(t), s = -Math.sin(t);
      const bulge = Math.pow(s, 0.62);
      const x = cx + c * R * (1 + 0.04 * s), y = by - ht * bulge + rb * 0.15 * (1 - bulge);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.ellipse(cx, by, R, rb, 0, 0, Math.PI, false);
    ctx.closePath();
  }

  function sesame(ctx, x, y, a, s) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#211714';
    ctx.beginPath(); ctx.ellipse(0, 0, 2.5 * s, 1.35 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-0.6 * s, -0.45 * s, 1 * s, 0.4 * s, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- 完整的一顆 ---------- */
  function whole(ctx, cx, by, R, ht, rb) {
    // 下半部：淡色酥皮（沒刷蛋液）
    domePath(ctx, cx, by, R, ht, rb);
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, '#F7E4BC');
    g.addColorStop(0.5, '#F1D6A2');
    g.addColorStop(1, '#D9B074');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    domePath(ctx, cx, by, R, ht, rb);
    ctx.clip();
    // 酥皮側邊的層次線
    const r = K.rng(31);
    for (let k = 0; k < 5; k++) {
      ctx.strokeStyle = `rgba(184,130,64,${0.14 + r() * 0.12})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(cx, by - 4 - k * 4.2, R * (0.99 - k * 0.012), rb, 0, 0.12 + r() * 0.2, Math.PI - 0.12 - r() * 0.2);
      ctx.stroke();
    }
    // 上半部刷蛋液：亮金褐，邊界不規則
    const gy = by - ht * 0.36;
    ctx.beginPath();
    ctx.moveTo(cx - R - 4, by - ht - 10);
    ctx.lineTo(cx + R + 4, by - ht - 10);
    ctx.lineTo(cx + R + 4, gy - 2);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, x = cx + R + 4 - t * (2 * R + 8);
      const y = gy + Math.sin(t * Math.PI) * rb * 0.75 + Math.sin(t * 23) * 1.6 + Math.sin(t * 9) * 1.2;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gl = ctx.createRadialGradient(cx - R * 0.35, by - ht * 0.8, 3, cx, by - ht * 0.45, R * 1.15);
    gl.addColorStop(0, '#F2B358');
    gl.addColorStop(0.35, '#D98A2E');
    gl.addColorStop(0.75, '#B2601A');
    gl.addColorStop(1, '#8C4310');
    ctx.fillStyle = gl;
    ctx.fill();
    // 刷蛋液的邊緣稍深
    ctx.strokeStyle = 'rgba(140,70,18,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 頂部大片光澤
    ctx.save();
    ctx.translate(cx - R * 0.34, by - ht * 0.78);
    ctx.rotate(-0.35);
    const sh = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.42);
    sh.addColorStop(0, 'rgba(255,246,220,0.85)');
    sh.addColorStop(0.5, 'rgba(255,230,170,0.3)');
    sh.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = sh;
    ctx.scale(1, 0.55);
    ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    // 黑芝麻：集中在頂上
    const rs = K.rng(77);
    for (let i = 0; i < 16; i++) {
      const a = rs() * TAU, d = Math.sqrt(rs());
      const x = cx + 2 + Math.cos(a) * d * R * 0.38, y = by - ht * 0.86 + Math.sin(a) * d * R * 0.2;
      sesame(ctx, x, y, rs() * Math.PI, 1);
    }
    ctx.strokeStyle = 'rgba(120,62,20,0.6)';
    ctx.lineWidth = 2;
    domePath(ctx, cx, by, R, ht, rb);
    ctx.stroke();
  }

  /* ---------- 切半的一顆 ---------- */
  function half(ctx, cx, by, R, ht, rb) {
    const hc = ht * 0.84;     // 切面高度（比外輪廓矮一點，上面露出一條頂皮）
    const cutTop = (x) => by - hc * Math.pow(Math.max(0, 1 - Math.pow((x - cx) / R, 2)), 0.55);
    // 後半的外皮（只露出上方一條）
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = Math.PI + Math.PI * i / 40;
      const c = Math.cos(t), s = -Math.sin(t);
      const x = cx + c * R, y = by - ht * Math.pow(s, 0.62);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.lineTo(cx + R, by);
    ctx.lineTo(cx - R, by);
    ctx.closePath();
    const gl = ctx.createLinearGradient(cx - R, by - ht, cx + R, by);
    gl.addColorStop(0, '#E9A346');
    gl.addColorStop(0.5, '#C2701F');
    gl.addColorStop(1, '#94480F');
    ctx.fillStyle = gl;
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,62,20,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 頂皮上的芝麻
    const rs = K.rng(91);
    for (let i = 0; i < 6; i++) sesame(ctx, cx - 14 + rs() * 28, by - ht + 3 + rs() * 4, rs() * Math.PI, 0.85);
    ctx.restore();

    // 切面
    const face = () => {
      ctx.beginPath();
      ctx.moveTo(cx - R, by);
      for (let i = 0; i <= 40; i++) { const x = cx - R + 2 * R * i / 40; ctx.lineTo(x, cutTop(x)); }
      ctx.lineTo(cx + R, by);
      ctx.ellipse(cx, by, R, rb * 0.5, 0, 0, Math.PI, false);
      ctx.closePath();
    };
    face();
    const fg = ctx.createLinearGradient(cx - R, by - hc, cx + R, by);
    fg.addColorStop(0, '#FFF6DE');
    fg.addColorStop(1, '#EFD9A8');
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.save();
    face(); ctx.clip();
    // 酥皮的一圈圈層次
    ctx.strokeStyle = 'rgba(196,150,86,0.45)';
    ctx.lineWidth = 0.8;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const x = cx - R + k * 2.4 + (2 * R - k * 4.8) * i / 30;
        const y = by - (by - cutTop(x)) * (1 - k * 0.07) + 0;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    // 頂端的蛋液皮
    ctx.strokeStyle = '#B5651C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 4; i <= 36; i++) { const x = cx - R + 2 * R * i / 40; i === 4 ? ctx.moveTo(x, cutTop(x) + 1) : ctx.lineTo(x, cutTop(x) + 1); }
    ctx.stroke();
    ctx.restore();
    // 紅豆沙：跟著切面形狀往內縮一圈（酥皮約 6 單位厚）
    const pR = R - 6.5, pTop = (x) => by - 5 - (hc - 12) * Math.pow(Math.max(0, 1 - Math.pow((x - cx) / pR, 2)), 0.5);
    const paste = () => {
      ctx.beginPath();
      ctx.moveTo(cx - pR, by - 5);
      for (let i = 0; i <= 36; i++) { const x = cx - pR + 2 * pR * i / 36; ctx.lineTo(x, pTop(x)); }
      ctx.quadraticCurveTo(cx + pR, by - 3, cx + pR - 4, by - 3);
      ctx.lineTo(cx - pR + 4, by - 3);
      ctx.closePath();
    };
    const bx = cx, byy = by - hc * 0.44, bR = pR, bH = hc * 0.45;
    paste();
    const rg = ctx.createRadialGradient(bx - bR * 0.4, byy - bH * 0.5, 2, bx, byy, bR);
    rg.addColorStop(0, '#7E433A');
    rg.addColorStop(0.6, '#5E2C2A');
    rg.addColorStop(1, '#4A2020');
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,30,26,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 豆沙的細顆粒
    const rq = K.rng(55);
    for (let i = 0; i < 30; i++) {
      const a = rq() * TAU, d = Math.sqrt(rq()) * 0.92;
      ctx.fillStyle = rq() < 0.5 ? 'rgba(140,80,70,0.45)' : 'rgba(40,14,14,0.4)';
      ctx.beginPath(); ctx.arc(bx + Math.cos(a) * d * bR * 0.9, byy + Math.sin(a) * d * bH * 0.8, 0.6 + rq() * 0.8, 0, TAU); ctx.fill();
    }
    // 鹹蛋黃
    const yR = R * 0.36;
    ctx.beginPath(); ctx.arc(bx + 1, byy + 2, yR, 0, TAU);
    const yg = ctx.createRadialGradient(bx - yR * 0.35, byy - yR * 0.35, 1, bx, byy, yR);
    yg.addColorStop(0, '#FFC35A');
    yg.addColorStop(0.55, '#F58F1C');
    yg.addColorStop(1, '#D9620E');
    ctx.fillStyle = yg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,60,10,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 沙沙的蛋黃顆粒與油光
    for (let i = 0; i < 14; i++) {
      const a = rq() * TAU, d = Math.sqrt(rq()) * 0.85;
      ctx.fillStyle = 'rgba(255,214,130,0.6)';
      ctx.beginPath(); ctx.arc(bx + 1 + Math.cos(a) * d * yR, byy + Math.sin(a) * d * yR, 0.6 + rq() * 0.6, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,250,230,0.7)';
    ctx.beginPath(); ctx.ellipse(bx - yR * 0.35, byy - yR * 0.45, yR * 0.32, yR * 0.16, -0.5, 0, TAU); ctx.fill();
    // 切面外框
    ctx.strokeStyle = 'rgba(150,96,40,0.6)';
    ctx.lineWidth = 1.8;
    face(); ctx.stroke();
  }

  function draw(ctx) {
    whole(ctx, 80, 110, 58, 74, 22);
    half(ctx, 128, 152, 50, 60, 16);
  }

  window.DESSERTS['eggyolkpastry'] = {
    draw,
    crumbs: ['#D98A2E', '#F7E4BC', '#5E2C2A', '#F58F1C', '#211714'],
    crunchy: 0.6,
  };
})();
