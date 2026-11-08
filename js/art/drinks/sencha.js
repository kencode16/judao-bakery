/* 煎茶（Sencha）
 * 辨識：日式高筒湯吞（沒有杯耳），上半截是往下流淌的織部綠釉、下半是米白粗陶；
 *       茶湯是透亮的黃綠色，正中間立著一根「茶柱」（日本說茶柱立起來會有好運）。
 * 剪影：細高的直筒杯、沒有把手（和焙茶的茶壺、抹茶的寬碗不同）。光源左上。
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

  const CREAM = '#EFE4D0';
  const GREEN = '#3F7D4E';
  const CX = 100, Y = 50, R = 48;
  const PROF = lathe([[Y, R], [Y + 6, 49], [Y + 50, 49.5], [Y + 92, 46.5], [Y + 100, 42]], 8)
    .concat([[Y + 101, 38.5], [Y + 106, 39.5]]);
  const BOT = Y + 106 + 39.5 * KT;

  function tea(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx, y + ry * 0.2, 2, cx, y, rx);
    g.addColorStop(0, '#DDE36A');
    g.addColorStop(0.55, '#BCCB3C');
    g.addColorStop(0.9, '#8EA226');
    g.addColorStop(1, '#6E8418');
    ctx.fillStyle = g;
    ctx.fill();
    // 茶柱：直立浮著的一小截茶梗
    ctx.save();
    ctx.translate(cx + 3, y + 1);
    ctx.fillStyle = 'rgba(90,110,20,0.35)';
    oval(ctx, 1.5, 3.5, 4.5, 1.6);
    ctx.fill();
    const sg = ctx.createLinearGradient(-2, 0, 2, 0);
    sg.addColorStop(0, '#E7D58A');
    sg.addColorStop(1, '#A08A36');
    ctx.fillStyle = sg;
    rrect(ctx, -1.8, -9, 3.6, 12, 1.6);
    ctx.fill();
    ctx.restore();
    // 倒影
    ctx.fillStyle = 'rgba(255,255,235,0.45)';
    oval(ctx, cx - rx * 0.42, y - ry * 0.25, rx * 0.2, ry * 0.16);
    ctx.fill();
  }

  // 綠釉下緣：沿杯身前緣起伏，偶有長長的釉滴
  function glazeEdge(x) {
    const dx = (x - CX) / R;
    const base = Y + 40 + R * KT * Math.sqrt(Math.max(0, 1 - dx * dx));
    const drip = 14 * Math.exp(-Math.pow((dx + 0.35) / 0.08, 2)) + 10 * Math.exp(-Math.pow((dx - 0.25) / 0.07, 2)) + 7 * Math.exp(-Math.pow((dx - 0.65) / 0.06, 2));
    return base + 3 * Math.sin(dx * 9) + drip;
  }

  function draw(ctx) {
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y, BOT, CREAM, { dk: 0.34, spec: 0 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 粗陶小黑點
    const r = K.rng(515);
    ctx.fillStyle = 'rgba(110,80,50,0.35)';
    for (let i = 0; i < 40; i++) {
      const x = CX - R + r() * 2 * R, y = Y + 40 + r() * 80;
      oval(ctx, x, y, 0.6 + r() * 0.8, 0.6 + r() * 0.6);
      ctx.fill();
    }
    // 織部綠釉
    ctx.beginPath();
    ctx.moveTo(CX - R - 2, Y - 40);
    ctx.lineTo(CX + R + 2, Y - 40);
    for (let x = CX + R + 2; x >= CX - R - 2; x -= 2) ctx.lineTo(x, glazeEdge(x));
    ctx.closePath();
    const gg = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    gg.addColorStop(0, sh(GREEN, -0.1));
    gg.addColorStop(0.25, sh(GREEN, 0.3));
    gg.addColorStop(0.55, GREEN);
    gg.addColorStop(1, sh(GREEN, -0.5));
    ctx.fillStyle = gg;
    ctx.fill();
    // 釉的流動紋
    ctx.strokeStyle = 'rgba(160,210,170,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const x = CX - R * 0.8 + i * R * 0.32;
      ctx.beginPath(); ctx.moveTo(x, Y + 20); ctx.quadraticCurveTo(x + 3, Y + 40, x + 1, glazeEdge(x) - 4); ctx.stroke();
    }
    // 釉邊緣稍深
    ctx.beginPath();
    for (let x = CX + R + 2; x >= CX - R - 2; x -= 2) x === CX + R + 2 ? ctx.moveTo(x, glazeEdge(x)) : ctx.lineTo(x, glazeEdge(x));
    ctx.strokeStyle = 'rgba(25,60,35,0.5)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 高光（釉面比較亮）
    streak(ctx, CX - R * 0.52, Y + 4, Y + 70, R * 0.12, 0.6);
    streak(ctx, CX - R * 0.52, Y + 60, BOT - 8, R * 0.1, 0.2);
    // 右側暗部再壓一層
    const dk = ctx.createLinearGradient(CX, 0, CX + R, 0);
    dk.addColorStop(0, 'rgba(40,25,10,0)');
    dk.addColorStop(1, 'rgba(40,25,10,0.18)');
    ctx.fillStyle = dk;
    ctx.fillRect(CX, Y - 30, R + 2, 140);
    ctx.restore();
    edge(ctx, pts, 'rgba(70,70,50,0.55)', 1.8);
    cupMouth(ctx, CX, Y, R, 4.2, GREEN, '#E9E2CE', 8, tea, { line: 'rgba(25,60,35,0.6)' });
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['sencha'] = { draw };
})();
