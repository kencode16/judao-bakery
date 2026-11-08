/* 豆漿（Soy milk，台式早餐店）
 * 辨識：早餐店的矮胖霧面塑膠杯＋紅白印花封口膜＋一根細細的紅色吸管；杯裡是米白色豆漿；
 *       杯子左前方散著三顆黃豆。
 * 剪影：矮胖的封口杯＋筆直的細吸管（珍珠奶茶是又高又粗吸管、杯底有黑珍珠）。光源左上。
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

  const CX = 100, Y = 82, R = 52;
  const PROF = [[Y, R], [Y + 3, 51.6], [152, 42]];
  const BOT = 152 + 42 * KT;
  const SX0 = 112, SY0 = 82, SX1 = 123, SY1 = 27;

  function bean(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(90,60,20,0.25)';
    oval(ctx, 1.2, 2.4, 7.5 * s, 4.6 * s);
    ctx.fill();
    const g = ctx.createRadialGradient(-2.5 * s, -2.5 * s, 0.5, 0, 0, 8 * s);
    g.addColorStop(0, '#FFF0C4');
    g.addColorStop(0.55, '#EBC97E');
    g.addColorStop(1, '#C49442');
    oval(ctx, 0, 0, 7.5 * s, 6 * s);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,100,40,0.55)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // 豆臍
    oval(ctx, 2.5 * s, 1 * s, 2.6 * s, 1 * s);
    ctx.fillStyle = '#9C7A3A';
    ctx.fill();
    ctx.restore();
  }

  function straw(ctx, x0, y0, x1, y1, w) {
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(120,20,20,0.7)'; ctx.lineWidth = w + 2; ctx.stroke();
    ctx.strokeStyle = '#E2463E'; ctx.lineWidth = w; ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
    ctx.beginPath(); ctx.moveTo(x0 + nx * w * 0.22, y0 + ny * w * 0.22); ctx.lineTo(x1 + nx * w * 0.22, y1 + ny * w * 0.22);
    ctx.strokeStyle = 'rgba(255,220,210,0.85)'; ctx.lineWidth = w * 0.28; ctx.stroke();
    oval(ctx, x1, y1, w / 2 + 0.4, w * 0.26);
    ctx.fillStyle = '#8A1E1A'; ctx.fill();
    ctx.restore();
  }

  function draw(ctx) {
    const pts = outline(PROF, CX, KT);
    // 豆漿（不透明）
    const mp = outline(slice(PROF, Y + 6, 152).map(p => [p[0], p[1] - 1.5]), CX, KT);
    shadeBody(ctx, mp, CX, R, Y, BOT, '#EFDBB4', { dk: 0.3, hi: 0.3, spec: 0, bounce: 0, bottom: 0.12 });
    // 霧面塑膠杯
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    // 液面上方的空隙（看得到透明杯壁）
    ctx.beginPath();
    ctx.ellipse(CX, Y + 6, R - 1.5, (R - 1.5) * KT, 0, Math.PI, 0, true);
    ctx.ellipse(CX, Y, R, R * KT, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(240,244,246,0.85)';
    ctx.fill();
    // 杯身細直紋
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.2;
    for (let i = -5; i <= 5; i++) {
      const t = i / 6;
      ctx.beginPath();
      ctx.moveTo(CX + t * R, Y + R * KT * Math.sqrt(1 - t * t));
      ctx.lineTo(CX + t * 42, 152 + 42 * KT * Math.sqrt(1 - t * t));
      ctx.stroke();
    }
    streak(ctx, CX - R * 0.6, Y + 6, BOT - 8, 6, 0.7);
    streak(ctx, CX + R * 0.8, Y + 10, BOT - 10, 3, 0.35);
    ctx.restore();
    edge(ctx, pts, 'rgba(120,96,70,0.65)', 1.8);
    // 封口膜（紅白印花）
    oval(ctx, CX, Y, R + 1.5, (R + 1.5) * KT);
    ctx.fillStyle = 'rgba(250,250,250,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,110,100,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    oval(ctx, CX, Y + 0.6, R - 5, (R - 5) * KT);
    const fg = ctx.createRadialGradient(CX - 16, Y - 8, 2, CX, Y, R);
    fg.addColorStop(0, '#FFFFFF');
    fg.addColorStop(1, '#EDE6DA');
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.save();
    oval(ctx, CX, Y + 0.6, R - 5, (R - 5) * KT);
    ctx.clip();
    // 紅色波浪條紋
    ctx.strokeStyle = 'rgba(214,52,46,0.85)';
    ctx.lineWidth = 3.4;
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath();
      for (let x = CX - R; x <= CX + R; x += 3) {
        const y = Y + k * 7.5 + 2 * Math.sin((x - CX) * 0.16 + k);
        x === CX - R ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // 中間白色圓標
    oval(ctx, CX - 4, Y + 1, 14, 14 * KT);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#D6342E';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    oval(ctx, CX - 4, Y + 1, 6, 6 * KT * 1.1);
    ctx.fillStyle = '#E9C778';
    ctx.fill();
    // 吸管
    ctx.fillStyle = 'rgba(110,80,60,0.4)';
    oval(ctx, SX0, SY0, 4.6, 2.2);
    ctx.fill();
    straw(ctx, SX0, SY0, SX1, SY1, 5.6);
    // 杯口亮邊
    oval(ctx, CX, Y, R, R * KT, Math.PI * 1.05, Math.PI * 1.55);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 黃豆
    bean(ctx, 38, 156, 1.1, 0.3);
    bean(ctx, 54, 164, 1.05, -0.5);
    bean(ctx, 30, 168, 1.0, 1.1);
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['soymilk'] = { draw };
})();
