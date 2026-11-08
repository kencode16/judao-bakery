/* 焙茶（Hojicha）
 * 辨識：日式土瓶（圓胖的紅褐色陶壺＋頭頂一道竹編提把＋短壺嘴），右前方一個小湯吞裝著紅褐色焙茶。
 * 剪影：唯一「提把跨在頭頂」的壺（和伯爵紅茶的側把白瓷壺分得開）；顏色是陶土紅褐＋竹黃。光源左上。
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
  function rAt(prof, y) { return slice(prof, y, y)[0][1]; }
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
  // 不透明杯口：外緣 R、壁厚 th、杯口色 col、內壁色 wall；liquid(ctx, cx, ly, rl, rlk) 畫液面（已裁在杯口內）
  function cupMouth(ctx, cx, y, R, th, col, wall, depth, liquid, o) {
    o = o || {};
    const k = KT, ri = R - th;
    oval(ctx, cx, y, R, R * k);
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, sh(col, 0.25));
    g.addColorStop(0.5, sh(col, 0.1));
    g.addColorStop(1, sh(col, -0.12));
    ctx.fillStyle = g;
    ctx.fill();
    // 內壁：後方受光、前方（靠近我們）在陰影裡
    oval(ctx, cx, y + 0.6, ri, ri * k);
    const w = ctx.createLinearGradient(cx - ri, y - ri * k, cx + ri * 0.4, y + ri * k);
    w.addColorStop(0, sh(wall, -0.22));
    w.addColorStop(0.45, wall);
    w.addColorStop(1, sh(wall, 0.12));
    ctx.fillStyle = w;
    ctx.fill();
    ctx.save();
    oval(ctx, cx, y + 0.6, ri, ri * k);
    ctx.clip();
    if (liquid) {
      const rl = o.rl || ri - 1;
      liquid(ctx, cx, y + depth, rl, rl * k);
      // 杯緣投在液面的陰影（左後方）
      const sg = ctx.createLinearGradient(cx - ri, y - ri * k, cx, y + ri * k * 0.4);
      sg.addColorStop(0, 'rgba(50,25,10,0.32)');
      sg.addColorStop(0.35, 'rgba(50,25,10,0.08)');
      sg.addColorStop(1, 'rgba(50,25,10,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(cx - ri, y - ri * k, ri * 2, ri * k * 2);
    }
    ctx.restore();
    // 杯緣高光
    oval(ctx, cx, y, R - th * 0.5, (R - th * 0.5) * k, Math.PI * 1.05, Math.PI * 1.6);
    ctx.strokeStyle = `rgba(255,255,255,${o.rimHl === undefined ? 0.85 : o.rimHl})`;
    ctx.lineWidth = Math.max(1.2, th * 0.55);
    ctx.lineCap = 'round';
    ctx.stroke();
    oval(ctx, cx, y, R, R * k);
    ctx.strokeStyle = o.line || rg(sh(col, -0.55), 0.5);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    oval(ctx, cx, y + 0.6, ri, ri * k);
    ctx.strokeStyle = rg(sh(col, -0.45), 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // 有光澤的小球（珍珠、棉花糖頂…）
  function sphere(ctx, x, y, r, col, o) {
    o = o || {};
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.08, x, y, r);
    g.addColorStop(0, sh(col, o.hi === undefined ? 0.45 : o.hi));
    g.addColorStop(0.45, col);
    g.addColorStop(1, sh(col, -0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (o.spec !== 0) {
      ctx.fillStyle = `rgba(255,255,255,${o.spec || 0.7})`;
      ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.28, r * 0.18, -0.6, 0, TAU); ctx.fill();
    }
  }

  const CLAY = '#86472A';
  const BAMBOO = '#D9B46A';
  const CX = 91, Y = 84;
  const BODY = lathe([[Y, 25], [Y + 4, 35], [Y + 14, 50], [Y + 30, 59], [Y + 46, 57], [Y + 60, 47], [Y + 67, 38], [Y + 70, 34]], 8)
    .concat([[Y + 71, 34.5], [Y + 75, 35.5]]);
  const BOT = Y + 75 + 35.5 * KT;
  const LID = lathe([[Y - 12, 0.5], [Y - 11, 8], [Y - 8, 16], [Y - 4, 22], [Y, 26.5]], 6);
  // 小湯吞
  const CUPX = 150, CUPY = 140, CUPR = 22;
  const CUP = lathe([[CUPY, CUPR], [CUPY + 4, 22.3], [CUPY + 18, 21], [CUPY + 25, 18]], 6).concat([[CUPY + 26, 16], [CUPY + 29, 16.5]]);

  function hojiTea(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx, y, 1, cx, y, rx);
    g.addColorStop(0, '#B5602A');
    g.addColorStop(0.7, '#8C4219');
    g.addColorStop(1, '#5E2A0E');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,225,190,0.45)';
    oval(ctx, cx - rx * 0.38, y - ry * 0.25, rx * 0.22, ry * 0.18);
    ctx.fill();
  }

  function spout(ctx) {
    ctx.beginPath();
    ctx.moveTo(CX - 52, Y + 48);
    ctx.quadraticCurveTo(CX - 64, Y + 36, CX - 72, Y + 14);
    ctx.lineTo(CX - 60, Y + 9);
    ctx.quadraticCurveTo(CX - 54, Y + 22, CX - 44, Y + 26);
    ctx.closePath();
  }

  function draw(ctx) {
    // 壺嘴
    spout(ctx);
    const sg = ctx.createLinearGradient(CX - 72, 0, CX - 44, 0);
    sg.addColorStop(0, sh(CLAY, -0.15));
    sg.addColorStop(0.4, sh(CLAY, 0.25));
    sg.addColorStop(1, sh(CLAY, -0.25));
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,25,10,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.save();
    ctx.translate(CX - 66, Y + 11.5);
    ctx.rotate(-0.38);
    oval(ctx, 0, 0, 6.6, 2.8);
    ctx.fillStyle = '#3A1A0C';
    ctx.fill();
    ctx.strokeStyle = sh(CLAY, 0.2);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    // 壺身
    const pts = outline(BODY, CX, KT);
    shadeBody(ctx, pts, CX, 59, Y - 13, BOT, CLAY, { dk: 0.4, hi: 0.35, spec: 0.38 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 陶土顆粒
    const r = K.rng(909);
    for (let i = 0; i < 60; i++) {
      const x = CX - 58 + r() * 116, y = Y + r() * 90;
      ctx.fillStyle = r() < 0.5 ? 'rgba(40,15,5,0.3)' : 'rgba(230,170,120,0.25)';
      oval(ctx, x, y, 0.6 + r() * 0.9, 0.5 + r() * 0.6);
      ctx.fill();
    }
    // 肩上的一圈灰白刷毛釉（刷毛目）
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * i / 40, rr = rAt(BODY, Y + 20);
      const x = CX - Math.cos(a) * rr, y = Y + 20 + Math.sin(a) * rr * KT;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = 'rgba(236,220,196,0.55)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236,220,196,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3, 2, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * i / 40, rr = rAt(BODY, Y + 27);
      const x = CX - Math.cos(a) * rr, y = Y + 27 + Math.sin(a) * rr * KT;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    edge(ctx, pts, 'rgba(60,25,10,0.6)', 1.8);
    // 壺蓋
    oval(ctx, CX, Y, 27.5, 27.5 * KT);
    ctx.fillStyle = sh(CLAY, -0.35);
    ctx.fill();
    const lp = outline(LID, CX, KT);
    shadeBody(ctx, lp, CX, 26.5, Y - 25, Y + 14, sh(CLAY, 0.08), { dk: 0.35, spec: 0.4, bottom: 0 });
    edge(ctx, lp, 'rgba(60,25,10,0.55)', 1.4);
    sphere(ctx, CX, Y - 14, 5.6, sh(CLAY, -0.1), { hi: 0.5, spec: 0.5 });
    // 竹提把的耳朵
    for (const s of [-1, 1]) {
      const ex = CX + s * 36, ey = Y + 4;
      ctx.fillStyle = sh(CLAY, -0.1);
      oval(ctx, ex, ey, 6.5, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,25,10,0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    // 竹提把（跨過壺頂）
    const arch = (dy) => {
      ctx.beginPath();
      ctx.moveTo(CX - 36, Y + 2 + dy);
      ctx.bezierCurveTo(CX - 40, 18 + dy, CX + 40, 18 + dy, CX + 36, Y + 2 + dy);
    };
    ctx.lineCap = 'round';
    arch(0); ctx.strokeStyle = 'rgba(110,70,20,0.75)'; ctx.lineWidth = 9.5; ctx.stroke();
    arch(0);
    const bg = ctx.createLinearGradient(0, 30, 0, Y);
    bg.addColorStop(0, sh(BAMBOO, 0.2));
    bg.addColorStop(1, sh(BAMBOO, -0.2));
    ctx.strokeStyle = bg; ctx.lineWidth = 7; ctx.stroke();
    arch(-1.6); ctx.strokeStyle = 'rgba(255,245,215,0.7)'; ctx.lineWidth = 1.6; ctx.stroke();
    // 竹節
    ctx.strokeStyle = 'rgba(120,80,25,0.8)';
    ctx.lineWidth = 1.4;
    for (const t of [0.22, 0.5, 0.78]) {
      const u = 1 - t;
      const x = u * u * u * (CX - 36) + 3 * u * u * t * (CX - 40) + 3 * u * t * t * (CX + 40) + t * t * t * (CX + 36);
      const y = u * u * u * (Y + 2) + 3 * u * u * t * 18 + 3 * u * t * t * 18 + t * t * t * (Y + 2);
      ctx.beginPath(); ctx.moveTo(x - 1, y - 3.6); ctx.lineTo(x + 1, y + 3.6); ctx.stroke();
    }
    // 小湯吞（裝著焙茶）
    blot(ctx, CUPX + 5, CUPY + 32, 26, 8, 'rgba(70,40,20,0.35)', 'rgba(70,40,20,0)');
    const cp = outline(CUP, CUPX, KT);
    shadeBody(ctx, cp, CUPX, CUPR, CUPY - 11, CUPY + 37, '#EDE1CC', { dk: 0.34, spec: 0.5 });
    ctx.save();
    poly(ctx, cp);
    ctx.clip();
    ctx.strokeStyle = 'rgba(134,71,42,0.75)';
    ctx.lineWidth = 2;
    oval(ctx, CUPX, CUPY + 9, 22.5, 22.5 * KT, 0.05, Math.PI - 0.05);
    ctx.stroke();
    ctx.restore();
    edge(ctx, cp, 'rgba(90,60,40,0.6)', 1.5);
    cupMouth(ctx, CUPX, CUPY, CUPR, 2.4, '#EDE1CC', '#E6D8C0', 3.5, hojiTea);
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['hojicha'] = { draw };
})();
