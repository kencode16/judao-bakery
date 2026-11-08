/* 柳橙汁（Orange juice）
 * 辨識：透明玻璃杯裝滿鮮橘色果汁＋杯緣卡一片柳橙圓切片＋綠白條紋吸管。
 * 剪影：直筒玻璃杯＋右上方一個圓圓的柳橙片；顏色是全場最亮的橘。光源左上。
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
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // 裁切區：杯口前緣弧線以上（浮在液面上、會被前緣擋住下半的東西用）
  function aboveFront(ctx, cx, y, r, k) {
    ctx.beginPath();
    ctx.moveTo(-50, -50); ctx.lineTo(250, -50); ctx.lineTo(250, y);
    ctx.lineTo(cx + r, y);
    ctx.ellipse(cx, y, r, r * k, 0, 0, Math.PI, false);
    ctx.lineTo(-50, y);
    ctx.closePath();
  }

  const CX = 90, Y = 62, R = 48;
  const PROF = [[Y, R], [Y + 2, 47.8], [152, 41]];
  const BOT = 152 + 41 * KT;
  const JY = 74;

  function stripeStraw(ctx, x0, y0, x1, y1, w) {
    const L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(ang);
    rrect(ctx, 0, -w / 2, L, w, 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.save();
    rrect(ctx, 0, -w / 2, L, w, 1);
    ctx.clip();
    ctx.fillStyle = '#3FA45A';
    for (let s = -10; s < L + 10; s += 9) {
      ctx.beginPath(); ctx.moveTo(s, -w); ctx.lineTo(s + 4.5, -w); ctx.lineTo(s + 4.5 - w * 0.9, w); ctx.lineTo(s - w * 0.9, w); ctx.closePath(); ctx.fill();
    }
    const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,40,10,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, -w, L, w * 2);
    ctx.restore();
    rrect(ctx, 0, -w / 2, L, w, 1);
    ctx.strokeStyle = 'rgba(30,90,45,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function orangeSlice(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.18);
    ctx.save();
    ctx.shadowColor = 'rgba(120,60,0,0.3)';
    ctx.shadowBlur = 3 * pxScale(ctx);
    ctx.shadowOffsetX = 1.5 * pxScale(ctx);
    ctx.shadowOffsetY = 1.5 * pxScale(ctx);
    oval(ctx, 0, 0, r, r);
    ctx.fillStyle = '#E8730C';
    ctx.fill();
    ctx.restore();
    // 果皮厚度（側面）
    oval(ctx, 1.6, 0.6, r, r);
    ctx.fillStyle = '#C85A06';
    ctx.fill();
    oval(ctx, 0, 0, r, r);
    const pg = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 1, 0, 0, r);
    pg.addColorStop(0, '#FFA640');
    pg.addColorStop(1, '#E66A08');
    ctx.fillStyle = pg;
    ctx.fill();
    // 白色內皮
    oval(ctx, 0, 0, r * 0.86, r * 0.86);
    ctx.fillStyle = '#FFF2D6';
    ctx.fill();
    // 果瓣
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU + 0.06, a1 = (i + 1) / n * TAU - 0.06;
      ctx.beginPath();
      ctx.moveTo(Math.cos((a0 + a1) / 2) * r * 0.1, Math.sin((a0 + a1) / 2) * r * 0.1);
      ctx.arc(0, 0, r * 0.78, a0, a1);
      ctx.closePath();
      const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.8);
      sg.addColorStop(0, '#FFD45A');
      sg.addColorStop(1, '#FF9A1C');
      ctx.fillStyle = sg;
      ctx.fill();
    }
    // 果肉顆粒光點
    const rr = K.rng(55);
    ctx.fillStyle = 'rgba(255,250,210,0.6)';
    for (let i = 0; i < 26; i++) {
      const a = rr() * TAU, d = (0.25 + rr() * 0.5) * r;
      oval(ctx, Math.cos(a) * d, Math.sin(a) * d, 1.2, 0.6);
      ctx.fill();
    }
    ctx.fillStyle = '#FFF6E0';
    oval(ctx, 0, 0, r * 0.1, r * 0.1);
    ctx.fill();
    oval(ctx, 0, 0, r, r);
    ctx.strokeStyle = 'rgba(150,60,0,0.6)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    const pts = outline(PROF, CX, KT);
    // 吸管在杯子後半（被果汁蓋住的部分不畫）
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(232,242,246,0.75)';
    ctx.fill();
    // 果汁
    const jp = outline(slice(PROF, JY, 146).map(p => [p[0], p[1] - 3]), CX, KT);
    shadeBody(ctx, jp, CX, R - 3, JY, BOT, '#F89A1A', { dk: 0.3, hi: 0.4, spec: 0.3, bounce: 0.15, bottom: 0.1 });
    ctx.save();
    poly(ctx, jp);
    ctx.clip();
    const r = K.rng(808);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255,230,140,${0.25 + r() * 0.3})`;
      oval(ctx, CX - 44 + r() * 88, JY + 6 + r() * 78, 1 + r() * 1.6, 0.5 + r() * 0.6);
      ctx.fill();
    }
    ctx.restore();
    // 果汁液面
    const rj = rAt(PROF, JY) - 3;
    oval(ctx, CX, JY, rj, rj * KT);
    const tg = ctx.createRadialGradient(CX - 12, JY - 5, 2, CX, JY, rj);
    tg.addColorStop(0, '#FFCB5A');
    tg.addColorStop(0.7, '#FBA42A');
    tg.addColorStop(1, '#E07A10');
    ctx.fillStyle = tg;
    ctx.fill();
    // 吸管（插進果汁）
    ctx.save();
    aboveFront(ctx, CX, JY, rj, KT);
    ctx.clip();
    stripeStraw(ctx, CX + 6, JY + 6, 64, 27, 7);
    ctx.restore();
    // 玻璃：光澤、杯口、厚杯底
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    streak(ctx, CX - 35, 70, 150, 5.5, 0.8);
    streak(ctx, CX - 26, 82, 140, 2, 0.55);
    streak(ctx, CX + 41, 74, 150, 3, 0.45);
    oval(ctx, CX, 146, rAt(PROF, 146) - 3, (rAt(PROF, 146) - 3) * KT, 0.05, Math.PI - 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    edge(ctx, pts, 'rgba(110,125,135,0.6)', 1.7);
    oval(ctx, CX, Y, R, R * KT);
    ctx.strokeStyle = 'rgba(110,125,135,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    oval(ctx, CX, Y, R - 1.5, (R - 1.5) * KT, Math.PI * 1.02, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 柳橙片卡在杯緣右側
    orangeSlice(ctx, CX + 46, Y - 4, 27);
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['orangejuice'] = { draw };
})();
