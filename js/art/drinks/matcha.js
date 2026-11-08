/* 抹茶（Matcha）
 * 辨識：黑色樂燒茶碗裡一整面鮮綠色、細細泡沫的抹茶，右後方立著一支竹製茶筅。
 * 剪影：寬口深碗＋右邊燈泡形的茶筅；顏色是深黑碗＋亮綠。光源左上。
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

  const BOWL = '#3A2E29';
  const BAMBOO = '#E6D2A0';
  const CX = 84, Y = 78, R = 60;
  const PROF = lathe([[Y, R], [Y + 5, 60.6], [Y + 24, 58], [Y + 46, 50], [Y + 62, 38], [Y + 68, 30]], 8)
    .concat([[Y + 69, 26], [Y + 76, 27]]);
  const BOT = Y + 76 + 27 * KT;

  function foam(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx - rx * 0.1, y - ry * 0.1, 2, cx, y, rx);
    g.addColorStop(0, '#B8E06A');
    g.addColorStop(0.55, '#93C840');
    g.addColorStop(0.92, '#6F9E28');
    g.addColorStop(1, '#4E7418');
    ctx.fillStyle = g;
    ctx.fill();
    // 細泡
    const r = K.rng(6060);
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.9;
      const x = cx + Math.cos(a) * d * rx, yy = y + Math.sin(a) * d * ry;
      const s = 0.6 + r() * 1.5;
      ctx.fillStyle = `rgba(230,250,190,${0.25 + r() * 0.35})`;
      oval(ctx, x, yy, s, s * 0.7);
      ctx.fill();
    }
    // 刷過的弧形紋
    ctx.strokeStyle = 'rgba(220,245,170,0.45)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      oval(ctx, cx + 4, y + 1, rx * (0.3 + i * 0.18), ry * (0.3 + i * 0.18), Math.PI * (1.1 + i * 0.1), Math.PI * (1.7 + i * 0.1));
      ctx.stroke();
    }
  }

  function chasen(ctx) {
    const x = 160, top = 44, neck = 100, bot = 168;
    // 握柄
    const hg = ctx.createLinearGradient(x - 6, 0, x + 6, 0);
    hg.addColorStop(0, sh(BAMBOO, -0.15));
    hg.addColorStop(0.35, sh(BAMBOO, 0.35));
    hg.addColorStop(1, sh(BAMBOO, -0.35));
    rrect(ctx, x - 6, top, 12, neck - top + 6, 4);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,40,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // 綁線
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(x - 6.5, neck - 4, 13, 3);
    // 穗：外圈往外彎再往內捲，像燈泡
    const W = 19;
    ctx.beginPath();
    ctx.moveTo(x - 6, neck);
    ctx.bezierCurveTo(x - W * 1.15, neck + 20, x - W * 1.1, bot - 14, x - 6, bot);
    ctx.lineTo(x + 6, bot);
    ctx.bezierCurveTo(x + W * 1.1, bot - 14, x + W * 1.15, neck + 20, x + 6, neck);
    ctx.closePath();
    const tg = ctx.createLinearGradient(x - W, 0, x + W, 0);
    tg.addColorStop(0, sh(BAMBOO, -0.1));
    tg.addColorStop(0.3, sh(BAMBOO, 0.3));
    tg.addColorStop(1, sh(BAMBOO, -0.3));
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,40,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // 一根根穗線
    ctx.strokeStyle = 'rgba(140,105,50,0.55)';
    ctx.lineWidth = 0.8;
    for (let i = -6; i <= 6; i++) {
      const t = i / 6;
      ctx.beginPath();
      ctx.moveTo(x + t * 5.5, neck + 1);
      ctx.bezierCurveTo(x + t * W * 1.1, neck + 20, x + t * W * 1.05, bot - 14, x + t * 5, bot);
      ctx.stroke();
    }
    // 中心的內穗
    ctx.fillStyle = 'rgba(200,175,110,0.8)';
    rrect(ctx, x - 4, neck + 6, 8, bot - neck - 20, 3);
    ctx.fill();
  }

  function draw(ctx) {
    chasen(ctx);
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y - R * KT, BOT, BOWL, { dk: 0.5, hi: 0.32, spec: 0.35, bounce: 0.12 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 樂燒釉：微微的褐色流痕與光點
    const r = K.rng(3131);
    for (let i = 0; i < 9; i++) {
      const x = CX - R + 12 + r() * (2 * R - 24), y = Y + 30 + r() * 30;
      blot(ctx, x, y, 8 + r() * 10, 4 + r() * 4, 'rgba(120,80,50,0.35)', 'rgba(120,80,50,0)');
    }
    // 碗腳上方的一圈土色
    oval(ctx, CX, Y + 69, 27, 27 * KT, 0, Math.PI);
    ctx.strokeStyle = 'rgba(160,110,70,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    edge(ctx, pts, 'rgba(20,12,8,0.6)', 1.8);
    cupMouth(ctx, CX, Y, R, 4.2, sh(BOWL, 0.12), '#4A3A32', 6, foam, { line: 'rgba(20,12,8,0.65)', rimHl: 0.5 });
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['matcha'] = { draw };
})();
