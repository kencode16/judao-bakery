/* 義式奶酪（Panna cotta）
 * 倒扣出模的白色圓頂（下寬上窄、頂緣圓角），頂上淋紅色莓果醬、往前流下幾道，
 * 放兩顆覆盆子、一顆藍莓、一片薄荷葉。斜上 45 度、光源左上。
 * 白色本體容易和白邊貼紙混在一起，所以外緣用暖灰細線收邊、右側陰影加重。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何 ---------- */
  const CX = 100, B = 156, H = 82, KY = 0.32;   // 底部中心 y、高度、俯視壓扁比
  const RB = 66, RS = 54, RR = 11;              // 底半徑、頂肩半徑、肩部圓角
  function rad(h) {                              // 高度 h 處的半徑
    const lin = RB + (RS - RB) * (h / H);
    const h0 = H - RR;
    if (h <= h0) return lin + Math.sin(h / H * Math.PI) * 2.5;   // 側面微微鼓起
    const a = Math.asin(Math.min(1, (h - h0) / RR));
    return lin - RR + RR * Math.cos(a);
  }
  const RT = rad(H);                             // 頂面半徑
  const TY = B - H;                              // 頂面中心 y
  const secPath = (ctx) => {                     // 所有橫切面的聯集 = 本體外形
    ctx.beginPath();
    for (let h = 0; h <= H; h += 1) {
      const r = rad(h);
      ctx.moveTo(CX + r, B - h);
      ctx.ellipse(CX, B - h, r, r * KY, 0, 0, TAU);
    }
  };
  // 本體表面上的點（角度 th：0 右、π/2 正前方）
  const surf = (th, h) => { const r = rad(h); return [CX + Math.cos(th) * r, B - h + Math.sin(th) * r * KY]; };

  const SAUCE = '#C8102E', SAUCE_DK = '#8E0A20', SAUCE_LT = '#F0485E';
  const EDGE = 'rgba(150,128,118,0.85)';

  /* ---------- 本體 ---------- */
  function drawBody(ctx) {
    secPath(ctx);
    ctx.fillStyle = '#F4EFE6';
    ctx.fill();
    ctx.save();
    secPath(ctx); ctx.clip();
    // 圓柱面的左右明暗
    const g = ctx.createLinearGradient(CX - RB, 0, CX + RB, 0);
    g.addColorStop(0, '#E9E2D6');
    g.addColorStop(0.18, '#FFFEFA');
    g.addColorStop(0.4, '#FBF8F1');
    g.addColorStop(0.72, '#E7DFD3');
    g.addColorStop(1, '#C9BCAE');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 底部收暗（接觸面）
    const gb = ctx.createLinearGradient(0, B - 22, 0, B + RB * KY);
    gb.addColorStop(0, 'rgba(170,150,135,0)');
    gb.addColorStop(1, 'rgba(160,138,122,0.55)');
    ctx.fillStyle = gb; ctx.fillRect(0, B - 22, 200, 60);
    // 奶酪的滑嫩光澤：左側一道直立高光＋細的反光
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(CX - RB * 0.66, B - 6);
    ctx.bezierCurveTo(CX - RB * 0.72, B - 40, CX - RS * 0.7, B - H + 22, CX - RS * 0.56, B - H + 14);
    ctx.bezierCurveTo(CX - RS * 0.46, B - H + 26, CX - RB * 0.52, B - 40, CX - RB * 0.5, B - 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(CX + RB * 0.78, B - 10); ctx.quadraticCurveTo(CX + RB * 0.8, B - 40, CX + RS * 0.82, B - H + 18); ctx.stroke();
    // 頂肩圓角的亮帶
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, TY + 4, RT + 6, (RT + 6) * KY, 0, Math.PI * 0.95, Math.PI * 1.55); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面＋莓果醬 ---------- */
  function sauceTop(ctx, grow) {
    const rnd = K.rng(19);
    ctx.beginPath();
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const th = i / N * TAU;
      const w = 1 + 0.06 * Math.sin(th * 5 + 1.2) + 0.04 * Math.sin(th * 9);
      const r = (RT + 5 + grow) * w;
      const x = CX + Math.cos(th) * r, y = TY + 1 + Math.sin(th) * r * KY;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    return rnd;
  }

  // 往下流的醬汁：先在頂肩鋪一圈醬（下緣起伏），再從裡面垂下幾道
  const DRIPS = [
    { th: 0.62, h1: 44, w: 6.5 },
    { th: 1.18, h1: 30, w: 8.5 },
    { th: 1.72, h1: 52, w: 7 },
    { th: 2.3, h1: 38, w: 6 },
  ];
  const sheetLow = th => H - 12 - 3.5 * Math.sin(th * 7 + 0.6) - 2 * Math.sin(th * 13);
  function sheetPath(ctx) {
    const a0 = 0.12, a1 = Math.PI - 0.1, N = 40;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const th = a0 + (a1 - a0) * i / N; const p = surf(th, H - 1); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = N; i >= 0; i--) {
      const th = a0 + (a1 - a0) * i / N;
      const fade = Math.min(1, Math.min(th - a0, a1 - th) / 0.35);   // 兩端收細
      const p = surf(th, H - 1 - (H - 1 - sheetLow(th)) * fade);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function dripPath(ctx, d) {
    const top = H - 8;
    const L = [], Rr = [];
    for (let h = top; h >= d.h1; h -= 2) {
      const t = (top - h) / (top - d.h1);
      const w = d.w * (1 - 0.3 * t) / rad(h);
      L.push(surf(d.th - w, h)); Rr.push(surf(d.th + w, h));
    }
    ctx.beginPath();
    L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    const end = surf(d.th, d.h1), we = d.w * 0.82;   // 末端積成一顆水珠
    ctx.arc(end[0], end[1] - 1, we, Math.PI * 0.08, Math.PI * 0.92, false);
    for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath();
    return end;
  }

  function drawSauce(ctx) {
    // 頂肩一圈醬
    sheetPath(ctx);
    const gs = ctx.createLinearGradient(CX - RS, 0, CX + RS, 0);
    gs.addColorStop(0, SAUCE_LT); gs.addColorStop(0.35, SAUCE); gs.addColorStop(1, SAUCE_DK);
    ctx.fillStyle = gs; ctx.fill();
    ctx.strokeStyle = 'rgba(110,8,25,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
    // 流下的醬汁
    for (const d of DRIPS) {
      const end = dripPath(ctx, d);
      const g = ctx.createLinearGradient(end[0] - d.w, 0, end[0] + d.w, 0);
      g.addColorStop(0, SAUCE_LT); g.addColorStop(0.4, SAUCE); g.addColorStop(1, SAUCE_DK);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(110,8,25,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
      // 水珠的亮點
      ctx.fillStyle = 'rgba(255,225,230,0.9)';
      ctx.beginPath(); ctx.ellipse(end[0] - d.w * 0.3, end[1] - d.w * 0.5, d.w * 0.17, d.w * 0.24, 0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(120,6,26,0.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(end[0], end[1] - 1, d.w * 0.7, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,205,0.55)'; ctx.lineWidth = 1;
      const a = surf(d.th + 0.35 * d.w / rad(H - 12), H - 12), b = surf(d.th + 0.4 * d.w / rad(d.h1 + 7), d.h1 + 7);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // 頂面一整片醬
    sauceTop(ctx, 0);
    const g = ctx.createRadialGradient(CX - 16, TY - 6, 2, CX, TY, RT + 8);
    g.addColorStop(0, '#F25A6E');
    g.addColorStop(0.45, '#D41936');
    g.addColorStop(1, '#9A0B22');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(110,8,25,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save();
    sauceTop(ctx, 0); ctx.clip();
    // 果醬裡的小籽與果肉
    const rnd = K.rng(5);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * (RT - 2);
      const x = CX + Math.cos(a) * rr, y = TY + 1 + Math.sin(a) * rr * KY;
      ctx.fillStyle = 'rgba(120,10,30,0.55)';
      ctx.beginPath(); ctx.ellipse(x, y, 1.1, 0.7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,190,0.55)';
      ctx.beginPath(); ctx.ellipse(x - 0.4, y - 0.4, 0.45, 0.3, 0, 0, TAU); ctx.fill();
    }
    // 鏡面反光
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(CX - 22, TY - 4, 14, 3.2, -0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(CX - 27, TY - 4.5, 4.5, 1.4, -0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- 覆盆子、藍莓、薄荷葉 ---------- */
  function raspberry(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(90,0,20,0.35)';
    ctx.beginPath(); ctx.ellipse(2, 9, 11, 4, 0, 0, TAU); ctx.fill();
    // 底色
    const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 13);
    g.addColorStop(0, '#FF6B86'); g.addColorStop(0.6, '#D81E4A'); g.addColorStop(1, '#8E0C2E');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 12, 0, 0, TAU); ctx.fill();
    // 一顆顆小果粒
    const rows = [[-7, 3], [-2.5, 4], [2.5, 4], [7, 3]];
    rows.forEach(([yy, n], ri) => {
      for (let i = 0; i < n; i++) {
        const xx = (i - (n - 1) / 2) * 5.2 + (ri % 2 ? 0 : 0.6);
        const w = Math.sqrt(Math.max(0, 1 - (yy / 12.5) ** 2)) * 11;
        if (Math.abs(xx) > w) continue;
        const gg = ctx.createRadialGradient(xx - 1, yy - 1.2, 0.2, xx, yy, 3.2);
        gg.addColorStop(0, '#FFC2CF'); gg.addColorStop(0.35, '#F04A6C'); gg.addColorStop(1, '#A3123A');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(xx, yy, 2.9, 0, TAU); ctx.fill();
      }
    });
    ctx.strokeStyle = 'rgba(110,0,30,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 12, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function blueberry(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(40,20,60,0.35)';
    ctx.beginPath(); ctx.ellipse(x + 1.5, y + r * 0.8, r, r * 0.35, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, 0.5, x, y, r);
    g.addColorStop(0, '#8E8CC9'); g.addColorStop(0.45, '#3E3A86'); g.addColorStop(1, '#1D1A4A');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    // 霧面果粉
    ctx.fillStyle = 'rgba(200,205,235,0.35)';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.55, 0, TAU); ctx.fill();
    // 頂端的花萼
    ctx.strokeStyle = '#1A1538'; ctx.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      ctx.beginPath(); ctx.moveTo(x + 1, y - r * 0.35); ctx.lineTo(x + 1 + Math.cos(a) * 2, y - r * 0.35 + Math.sin(a) * 1.2); ctx.stroke();
    }
  }
  function mint(ctx, x, y, len, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const leaf = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(len * 0.25, -len * 0.42, len * 0.8, -len * 0.3, len, 0);
      ctx.bezierCurveTo(len * 0.8, len * 0.28, len * 0.25, len * 0.38, 0, 0);
      ctx.closePath();
    };
    leaf();
    const g = ctx.createLinearGradient(0, -len * 0.3, 0, len * 0.3);
    g.addColorStop(0, '#7CC456'); g.addColorStop(1, '#3A8A2E');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(30,80,25,0.7)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.strokeStyle = 'rgba(220,255,200,0.75)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.05, len * 0.92, 0); ctx.stroke();
    for (let i = 1; i < 4; i++) {
      const t = i / 4.2 * len;
      ctx.beginPath(); ctx.moveTo(t, -len * 0.02); ctx.lineTo(t + len * 0.12, -len * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t + len * 0.12, len * 0.17); ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx) {
    drawBody(ctx);
    // 外緣收邊（白色本體和白邊貼紙分得開）
    secPath(ctx);
    ctx.strokeStyle = EDGE; ctx.lineWidth = 2.2;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.stroke();
    ctx.restore();
    drawSauce(ctx);
    mint(ctx, CX + 2, TY - 6, 28, -0.7);
    mint(ctx, CX + 4, TY - 6, 24, -2.35);
    raspberry(ctx, CX - 12, TY - 8, 1.0, -0.15);
    raspberry(ctx, CX + 14, TY - 3, 0.95, 0.25);
    blueberry(ctx, CX + 1, TY + 6, 7.2);
  }

  window.DESSERTS['pannacotta'] = {
    draw,
    crumbs: ['#FFFDF7', '#C8102E', '#F4EFE6', '#F0485E'],
    crunchy: 0.0,
  };
})();
