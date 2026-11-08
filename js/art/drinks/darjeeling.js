/* 大吉嶺紅茶（Darjeeling）
 * 辨識：寬口淺身的白瓷紅茶杯＋金邊＋同款碟子；茶湯是透亮的橘金色；碟子左前方放一芽兩葉的嫩綠茶葉。
 * 剪影：大碟子上一個「開口很寬、往下收」的喇叭形杯子（和濃縮咖啡的小深杯不同）。光源左上。
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
  // 碟子：中心 (cx,cy)、半徑 R；o.th 厚度、o.well 杯座半徑比例、o.trim 金邊色
  function saucer(ctx, cx, cy, R, col, o) {
    o = o || {};
    const k = KT, th = o.th || 6, ry = R * k;
    // 側面厚度（只看得到前半）
    oval(ctx, cx, cy + th, R * 0.97, ry * 0.97);
    const sg = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    sg.addColorStop(0, sh(col, -0.18));
    sg.addColorStop(0.3, sh(col, -0.05));
    sg.addColorStop(1, sh(col, -0.35));
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = rg(sh(col, -0.6), 0.45);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 頂面
    oval(ctx, cx, cy, R, ry);
    const g = ctx.createRadialGradient(cx - R * 0.45, cy - ry * 0.7, 2, cx, cy, R * 1.1);
    g.addColorStop(0, sh(col, 0.5));
    g.addColorStop(0.55, col);
    g.addColorStop(1, sh(col, -0.16));
    ctx.fillStyle = g;
    ctx.fill();
    // 往中間凹下去的碟面
    const w = o.well || 0.62;
    oval(ctx, cx, cy + ry * 0.06, R * w, ry * w);
    const g2 = ctx.createLinearGradient(0, cy - ry * w, 0, cy + ry * w);
    g2.addColorStop(0, rg(sh(col, -0.35), 0.28));
    g2.addColorStop(0.5, rg(sh(col, -0.2), 0.06));
    g2.addColorStop(1, 'rgba(255,255,255,0.3)');
    ctx.fillStyle = g2;
    ctx.fill();
    if (o.trim) {
      oval(ctx, cx, cy, R - 3.2, ry - 3.2 * k);
      ctx.strokeStyle = o.trim;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    // 外緣亮邊與細線
    oval(ctx, cx, cy, R - 1.2, ry - 1, Math.PI * 1.02, Math.PI * 1.55);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    oval(ctx, cx, cy, R, ry);
    ctx.strokeStyle = rg(sh(col, -0.55), 0.5);
    ctx.lineWidth = 1.6;
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

  const PORC = '#FBF7F1';
  const GOLD = '#D2A63C';
  const CX = 98, SY = 132, SR = 80;
  const Y = 84, R = 60;
  const PROF = lathe([[Y, R], [Y + 5, 58.4], [Y + 16, 52], [Y + 28, 42], [Y + 36, 32], [Y + 40, 25]], 8)
    .concat([[Y + 41, 24.5], [Y + 47, 26.5]]);
  const BOT = Y + 47 + 26.5 * KT;

  function tea(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx - rx * 0.1, y - ry * 0.1, 2, cx, y, rx);
    g.addColorStop(0, '#F6A93A');
    g.addColorStop(0.55, '#E27A1C');
    g.addColorStop(0.9, '#B24E10');
    g.addColorStop(1, '#8A3A0C');
    ctx.fillStyle = g;
    ctx.fill();
    // 杯底透上來的亮光
    blot(ctx, cx + rx * 0.08, y + ry * 0.18, rx * 0.55, ry * 0.45, 'rgba(255,214,120,0.55)', 'rgba(255,214,120,0)');
    // 窗光倒影
    ctx.save();
    ctx.translate(cx - rx * 0.34, y - ry * 0.28);
    ctx.rotate(-0.08);
    rrect(ctx, -rx * 0.22, -ry * 0.2, rx * 0.44, ry * 0.36, 3);
    ctx.fillStyle = 'rgba(255,248,230,0.55)';
    ctx.fill();
    ctx.restore();
  }

  function leaf(ctx, x, y, len, wid, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.9, len, 0);
    ctx.bezierCurveTo(len * 0.75, wid * 0.9, len * 0.3, wid, 0, 0);
    const g = ctx.createLinearGradient(0, -wid, 0, wid);
    g.addColorStop(0, sh(col, 0.35));
    g.addColorStop(0.5, col);
    g.addColorStop(1, sh(col, -0.3));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rg(sh(col, -0.5), 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.quadraticCurveTo(len * 0.5, -wid * 0.12, len * 0.92, 0);
    ctx.strokeStyle = rg(sh(col, 0.5), 0.8);
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    saucer(ctx, CX, SY, SR, PORC, { th: 6, well: 0.55, trim: GOLD });
    blot(ctx, CX + 10, SY + 3, 44, 16, 'rgba(95,58,32,0.36)', 'rgba(95,58,32,0)');
    // 一芽兩葉
    ctx.save();
    ctx.shadowColor = 'rgba(70,50,20,0.3)';
    ctx.shadowBlur = 2 * pxScale(ctx);
    ctx.shadowOffsetY = 1.2 * pxScale(ctx);
    leaf(ctx, 30, 148, 30, 8.5, -0.15, '#5C9E3C');
    leaf(ctx, 32, 150, 26, 7.5, 0.42, '#4E8E32');
    leaf(ctx, 30, 149, 17, 3.6, -0.62, '#86C25A');
    ctx.restore();
    // 杯耳（金邊）
    handle(ctx, CX + R - 3, Y + 6, CX + 40, Y + 30, 20, 6.8, PORC, { lift: 0.7 });
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y - R * KT, BOT, PORC, { dk: 0.32 });
    // 杯腳金線
    oval(ctx, CX, Y + 41, 24.5, 24.5 * KT, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    edge(ctx, pts, 'rgba(125,92,70,0.55)', 1.7);
    cupMouth(ctx, CX, Y, R, 2.8, PORC, '#F2E9DE', 6, tea);
    // 杯口金邊
    oval(ctx, CX, Y, R - 0.6, (R - 0.6) * KT);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['darjeeling'] = { draw };
})();
