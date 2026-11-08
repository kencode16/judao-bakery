/* 熱可可（Hot cocoa）
 * 辨識：亮紅色馬克杯＋杯口堆滿白色、粉紅色棉花糖＋巧克力淋醬；杯裡是深可可色。
 * 剪影：直筒馬克杯、杯口上方隆起一堆棉花糖、右邊大杯耳。光源左上。
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
  // 杯耳：從 (x0,y0) 往右彎出去再回到 (x1,y1)；out 突出量、w 粗細
  function handle(ctx, x0, y0, x1, y1, out, w, col, o) {
    o = o || {};
    const lift = o.lift === undefined ? 0.5 : o.lift;
    const path = (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x0 + dx, y0 + dy);
      ctx.bezierCurveTo(x0 + out + dx, y0 - w * lift + dy, x1 + out * (o.k2 || 1) + dx, y1 + w * lift + dy, x1 + dx, y1 + dy);
    };
    ctx.save();
    ctx.lineCap = 'round';
    path(0, 0);
    ctx.strokeStyle = o.edge || rg(sh(col, -0.55), 0.55);
    ctx.lineWidth = w + 2.6;
    ctx.stroke();
    const g = ctx.createLinearGradient(Math.min(x0, x1), 0, Math.max(x0, x1) + out, 0);
    g.addColorStop(0, sh(col, -0.2));
    g.addColorStop(0.45, col);
    g.addColorStop(1, sh(col, -0.32));
    path(0, 0);
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.stroke();
    path(w * 0.16, w * 0.2);
    ctx.strokeStyle = rg(sh(col, -0.6), 0.22);
    ctx.lineWidth = w * 0.45;
    ctx.stroke();
    path(-w * 0.18, -w * 0.2);
    ctx.strokeStyle = `rgba(255,255,255,${o.hl === undefined ? 0.55 : o.hl})`;
    ctx.lineWidth = w * 0.26;
    ctx.stroke();
    ctx.restore();
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
  // 裁切區：杯口前緣弧線以上（浮在液面上、會被前緣擋住下半的東西用）
  function aboveFront(ctx, cx, y, r, k) {
    ctx.beginPath();
    ctx.moveTo(-50, -50); ctx.lineTo(250, -50); ctx.lineTo(250, y);
    ctx.lineTo(cx + r, y);
    ctx.ellipse(cx, y, r, r * k, 0, 0, Math.PI, false);
    ctx.lineTo(-50, y);
    ctx.closePath();
  }

  const RED = '#D63B3D';
  const CX = 88, Y = 70, R = 52;
  const PROF = lathe([[Y, R], [Y + 6, 52.6], [Y + 44, 53.2], [Y + 72, 51.6], [Y + 80, 48]], 8);
  const BOT = Y + 80 + 48 * KT;
  const RI = R - 4.2;

  function choco(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx - rx * 0.2, y - ry * 0.2, 2, cx, y, rx);
    g.addColorStop(0, '#80462A');
    g.addColorStop(0.6, '#5E301B');
    g.addColorStop(1, '#3E1D10');
    ctx.fillStyle = g;
    ctx.fill();
  }

  // 一顆棉花糖（短圓柱，斜放）
  function mallow(ctx, x, y, s, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const g = ctx.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
    g.addColorStop(0, sh(col, 0.5));
    g.addColorStop(0.55, col);
    g.addColorStop(1, sh(col, -0.2));
    rrect(ctx, -s * 0.52, -s * 0.44, s * 1.04, s * 0.9, s * 0.3);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rg(sh(col, -0.45), 0.5);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // 頂面（切面，比較亮、帶細孔）
    rrect(ctx, -s * 0.45, -s * 0.42, s * 0.9, s * 0.48, s * 0.22);
    ctx.fillStyle = rg(sh(col, 0.6), 0.85);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    oval(ctx, -s * 0.18, -s * 0.26, s * 0.2, s * 0.08);
    ctx.fill();
    ctx.restore();
  }

  const MM = [
    // u, v（液面上的位置）、lift 堆高、大小、旋轉、顏色
    [-0.5, -0.4, 4, 17, 0.3, '#FFFDF9'],
    [0.08, -0.55, 6, 18, -0.2, '#F7B9CB'],
    [0.56, -0.3, 3, 16, 0.5, '#FFFDF9'],
    [-0.62, 0.12, 3, 16, 0.7, '#F7B9CB'],
    [-0.18, -0.12, 13, 19, 0.12, '#FFFDF9'],
    [0.4, 0.08, 9, 17, -0.4, '#F7B9CB'],
    [0.66, 0.36, 2, 15, 0.2, '#FFFDF9'],
    [-0.32, 0.36, 5, 17, -0.5, '#FFFDF9'],
    [0.12, 0.3, 8, 18, 0.35, '#FFFDF9'],
    [0.1, -0.22, 24, 17, -0.15, '#F7B9CB'],
  ];

  function draw(ctx) {
    handle(ctx, CX + R - 1, Y + 16, CX + R - 1, Y + 62, 32, 11.5, RED, { lift: 0.4 });
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y - R * KT, BOT, RED, { dk: 0.42, hi: 0.4, spec: 0.5 });
    edge(ctx, pts, 'rgba(110,20,22,0.55)', 1.8);
    cupMouth(ctx, CX, Y, R, 4.2, '#F2E8E0', '#F4ECE4', 7, choco, { line: 'rgba(120,30,30,0.55)' });
    // 棉花糖堆（前緣擋住下半）
    ctx.save();
    aboveFront(ctx, CX, Y + 0.6, RI, KT);
    ctx.clip();
    const ly = Y + 7, rl = RI - 1;
    const list = MM.slice().sort((a, b) => (a[1] - b[1]) || (a[2] - b[2]));
    for (const m of list) {
      const x = CX + m[0] * rl, y = ly + m[1] * rl * KT - m[2];
      ctx.fillStyle = 'rgba(40,15,5,0.25)';
      oval(ctx, x + 2, y + m[3] * 0.35, m[3] * 0.55, m[3] * 0.22);
      ctx.fill();
      mallow(ctx, x, y, m[3], m[4], m[5]);
    }
    // 巧克力淋醬
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drip = [[CX - 36, Y - 6], [CX - 18, Y - 14], [CX - 6, Y - 4], [CX + 10, Y - 24], [CX + 22, Y - 8], [CX + 36, Y - 14]];
    ctx.beginPath();
    drip.forEach((p, i) => i ? ctx.quadraticCurveTo((drip[i - 1][0] + p[0]) / 2, (drip[i - 1][1] + p[1]) / 2 - 6, p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = '#4A2112';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,190,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['cocoa'] = { draw };
})();
