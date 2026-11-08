/* 牛奶（Milk）
 * 辨識：復古玻璃牛奶瓶（寬瓶口、圓肩、直筒）＋瓶口蓋著藍白格子布、綁紅白細繩；瓶身一圈天藍色印花帶。
 * 剪影：唯一的「瓶子＋布蓋」；顏色是乳白＋天藍。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const sh = K.shade, rg = K.rgba;

  /* ---------- 小工具（B6 共用寫法，每個檔各自一份） ---------- */
  const TAU = Math.PI * 2;
  const KT = 0.5;   // 圓口的扁度（斜上俯視；所有飲品同一個視角）
  function poly(ctx, pts, open) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
    if (!open) ctx.closePath();
  }
  function oval(ctx, cx, cy, rx, ry, a0, a1, ccw) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), 0, a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1, !!ccw);
  }
  // 旋轉體剖面：控制點 [[y, r], …]（y＝那一圈的投影中心，由上到下），Catmull-Rom 補密
  function lathe(ctrl, n) {
    n = n || 8;
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const f = k => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
        out.push([f(0), Math.max(0, f(1))]);
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }
  // 旋轉體的投影外輪廓：每一圈是扁度 k 的橢圓，取全部橢圓聯集的上下包絡
  function outline(prof, cx, k) {
    let R = 0;
    for (const p of prof) R = Math.max(R, p[1]);
    const N = 90, up = [], lo = [];
    for (let i = 0; i <= N; i++) {
      const x = R * (2 * i / N - 1) * 0.9999;
      let mn = 1e9, mx = -1e9;
      for (const p of prof) {
        const d = p[1] * p[1] - x * x;
        if (d < 0) continue;
        const h = k * Math.sqrt(d);
        if (p[0] - h < mn) mn = p[0] - h;
        if (p[0] + h > mx) mx = p[0] + h;
      }
      if (mn < 1e9) { up.push([cx + x, mn]); lo.push([cx + x, mx]); }
    }
    return up.concat(lo.reverse());
  }
  // 剖面切一段（y 在 y0～y1 之間），液體、色帶用
  function slice(prof, y0, y1) {
    const at = y => {
      for (let i = 0; i < prof.length - 1; i++) {
        const a = prof[i], b = prof[i + 1];
        if ((y >= a[0] && y <= b[0]) || (y <= a[0] && y >= b[0])) {
          const t = b[0] === a[0] ? 0 : (y - a[0]) / (b[0] - a[0]);
          return [y, a[1] + (b[1] - a[1]) * t];
        }
      }
      return y < prof[0][0] ? prof[0].slice() : prof[prof.length - 1].slice();
    };
    const out = [at(y0)];
    for (const p of prof) if (p[0] > y0 && p[0] < y1) out.push(p.slice());
    out.push(at(y1));
    return out;
  }
  // 直條柔光（鏡面高光）
  function streak(ctx, x, y0, y1, w, a, col) {
    const c = col || '255,255,255';
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, `rgba(${c},0)`);
    g.addColorStop(0.5, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    oval(ctx, x, (y0 + y1) / 2, w, (y1 - y0) / 2);
    ctx.fill();
  }
  // 柔邊橢圓（陰影、光暈）
  function blot(ctx, x, y, rx, ry, c0, c1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 圓柱打光（左上柔光）：先填主色漸層，再疊底部暗部、直條高光、右緣反光
  function shadeBody(ctx, pts, cx, R, y0, y1, col, o) {
    o = o || {};
    const hi = o.hi === undefined ? 0.45 : o.hi, dk = o.dk === undefined ? 0.32 : o.dk;
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, sh(col, -dk * 0.45));
    g.addColorStop(0.16, sh(col, hi * 0.4));
    g.addColorStop(0.3, sh(col, hi * 0.55));
    g.addColorStop(0.52, col);
    g.addColorStop(0.82, sh(col, -dk * 0.75));
    g.addColorStop(1, sh(col, -dk));
    poly(ctx, pts);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const v = ctx.createLinearGradient(0, y0, 0, y1);
    const bt = o.bottom === undefined ? 0.18 : o.bottom;
    v.addColorStop(0, 'rgba(70,35,15,0)');
    v.addColorStop(0.55, 'rgba(70,35,15,0)');
    v.addColorStop(1, `rgba(70,35,15,${bt})`);
    ctx.fillStyle = v;
    ctx.fillRect(cx - R - 4, y0 - 4, 2 * R + 8, y1 - y0 + 8);
    if (o.spec !== 0) {
      const h = y1 - y0;
      streak(ctx, cx - R * 0.52, y0 + h * 0.08, y1 - h * 0.12, R * 0.13, o.spec || 0.6);
    }
    if (o.bounce !== 0) {
      streak(ctx, cx + R * 0.84, y0 + (y1 - y0) * 0.2, y1 - (y1 - y0) * 0.1, R * 0.08, o.bounce || 0.16);
    }
    ctx.restore();
  }
  function edge(ctx, pts, col, w) {
    poly(ctx, pts);
    ctx.strokeStyle = col;
    ctx.lineWidth = w || 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  // 目前縮放（shadowBlur 以裝置像素計，要乘上它）
  function pxScale(ctx) {
    const m = ctx.getTransform ? ctx.getTransform() : { a: 1, b: 0 };
    return Math.hypot(m.a, m.b) || 1;
  }

  const CX = 100;
  const PROF = lathe([[44, 26], [48, 26.5], [53, 23.6], [60, 24.2], [70, 31], [82, 40.5], [94, 45.5], [130, 46.5], [148, 46], [156, 43]], 6);
  const BOT = 156 + 43 * KT;
  const MILK_Y = 57;          // 牛奶液面（瓶頸）
  const CLOTH = lathe([[26, 0.5], [27.5, 12], [30, 22], [34.5, 29], [41, 31.5], [47, 29], [51, 25.6], [55, 28.5], [61, 33], [65, 35.5]], 6);

  function gingham(ctx, pts, x0, x1, y0, y1) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.fillStyle = '#F4F8FD';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(64,118,196,0.5)';
    for (let x = x0 + 2; x < x1; x += 9) ctx.fillRect(x, y0, 4.5, y1 - y0);
    ctx.strokeStyle = 'rgba(64,118,196,0.5)';
    ctx.lineWidth = 4.5;
    for (let y = y0 - 6; y < y1 + 6; y += 9) {
      oval(ctx, CX, y, 60, 60 * KT * 0.55, 0, Math.PI);
      ctx.stroke();
    }
    // 布的體積：左亮右暗＋下緣陰影
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.1)');
    g.addColorStop(0.75, 'rgba(20,40,80,0.12)');
    g.addColorStop(1, 'rgba(20,40,80,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  }

  function draw(ctx) {
    // 整體略縮，讓布蓋頂端留在安全範圍內
    ctx.translate(100, 101.8);
    ctx.scale(0.97, 0.97);
    ctx.translate(-100, -100);
    const pts = outline(PROF, CX, KT);
    const R = 46.5;
    // 玻璃（瓶頸空的部分）
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(214,232,244,0.75)';
    ctx.fill();
    // 牛奶
    const milk = outline(slice(PROF, MILK_Y, 156).map(p => [p[0], Math.max(0, p[1] - 2.2)]), CX, KT);
    shadeBody(ctx, milk, CX, R, MILK_Y, BOT, '#FBFCFD', { dk: 0.2, hi: 0.3, spec: 0, bounce: 0, bottom: 0.1 });
    ctx.save();
    poly(ctx, milk);
    ctx.clip();
    // 牛奶偏冷的陰影
    const cool = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    cool.addColorStop(0, 'rgba(150,175,205,0.18)');
    cool.addColorStop(0.3, 'rgba(150,175,205,0)');
    cool.addColorStop(0.7, 'rgba(150,175,205,0.12)');
    cool.addColorStop(1, 'rgba(120,150,190,0.4)');
    ctx.fillStyle = cool;
    ctx.fillRect(CX - R, MILK_Y - 30, R * 2, 160);
    // 印花帶
    const by0 = 106, by1 = 128;
    ctx.beginPath();
    ctx.ellipse(CX, by0, R + 2, (R + 2) * KT, 0, Math.PI, 0, true);
    ctx.ellipse(CX, by1, R + 2, (R + 2) * KT, 0, 0, Math.PI, false);
    ctx.closePath();
    const bg = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    bg.addColorStop(0, '#5C9AD8');
    bg.addColorStop(0.3, '#8EC0EE');
    bg.addColorStop(0.6, '#5A98D6');
    bg.addColorStop(1, '#2F6AAE');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.6;
    for (const yy of [by0 + 4, by1 - 4]) { oval(ctx, CX, yy, R + 2, (R + 2) * KT, 0.05, Math.PI - 0.05); ctx.stroke(); }
    // 印花：中間一滴白色牛奶滴
    ctx.fillStyle = '#FFFFFF';
    const dx = CX - 4, dy = (by0 + by1) / 2 + R * KT - 1;
    ctx.beginPath();
    ctx.moveTo(dx, dy - 9);
    ctx.bezierCurveTo(dx + 3, dy - 4, dx + 6, dy - 1, dx + 6, dy + 2.5);
    ctx.arc(dx, dy + 2.5, 6, 0, Math.PI, false);
    ctx.bezierCurveTo(dx - 6, dy - 1, dx - 3, dy - 4, dx, dy - 9);
    ctx.fill();
    ctx.restore();
    // 玻璃光澤
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    streak(ctx, CX - R * 0.6, 86, 150, 6, 0.85);
    streak(ctx, CX - R * 0.42, 96, 140, 2.5, 0.6);
    streak(ctx, CX + R * 0.78, 92, 150, 3.5, 0.45);
    // 厚瓶底
    oval(ctx, CX, 152, 42, 42 * KT, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = 'rgba(160,190,215,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    edge(ctx, pts, 'rgba(96,124,150,0.6)', 1.8);
    // 格子布蓋
    const cp = outline(CLOTH, CX, KT);
    ctx.save();
    ctx.shadowColor = 'rgba(40,60,90,0.25)';
    ctx.shadowBlur = 3 * pxScale(ctx);
    ctx.shadowOffsetY = 1.5 * pxScale(ctx);
    poly(ctx, cp);
    ctx.fillStyle = '#F4F8FD';
    ctx.fill();
    ctx.restore();
    gingham(ctx, cp, CX - 40, CX + 40, 10, 72);
    // 下擺波浪摺痕
    ctx.strokeStyle = 'rgba(30,60,110,0.25)';
    ctx.lineWidth = 1.4;
    for (let i = -3; i <= 3; i++) {
      const x = CX + i * 10;
      ctx.beginPath(); ctx.moveTo(x, 56 + Math.abs(i) * -0.6); ctx.lineTo(x + i * 1.2, 66 - Math.abs(i) * 1.6); ctx.stroke();
    }
    edge(ctx, cp, 'rgba(40,72,120,0.55)', 1.5);
    // 頂上的亮面
    blot(ctx, CX - 10, 33, 20, 8, 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)');
    // 紅白細繩＋小蝴蝶結
    oval(ctx, CX, 51.5, 25.8, 25.8 * KT, 0.05, Math.PI - 0.05);
    ctx.strokeStyle = '#C8323A';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);
    const kx = CX - 14, ky = 51.5 + 22 * KT;
    ctx.fillStyle = '#C8323A';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.quadraticCurveTo(kx + s * 9, ky - 7, kx + s * 8, ky + 1);
      ctx.quadraticCurveTo(kx + s * 6, ky + 4, kx, ky);
      ctx.fill();
    }
    ctx.strokeStyle = '#C8323A';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx - 3, ky + 9); ctx.moveTo(kx, ky); ctx.lineTo(kx + 3, ky + 8); ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['milk'] = { draw };
})();
