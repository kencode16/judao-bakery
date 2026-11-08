/* 伯爵紅茶（Earl Grey）
 * 辨識：英式白瓷圓茶壺＋寶藍色花帶與金邊（伯爵茶常拌藍色矢車菊花瓣，所以用寶藍色）。
 * 剪影：唯一「左邊壺嘴、右邊把手、上面壺蓋」的圓胖茶壺。光源左上。
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

  const PORC = '#FBF7F1';
  const BLUE = '#2E5AA8';
  const GOLD = '#D2A63C';
  const CX = 100;
  const Y = 72;   // 壺口
  const BODY = lathe([[Y, 29], [Y + 6, 41], [Y + 18, 54], [Y + 34, 61], [Y + 52, 59], [Y + 68, 49], [Y + 78, 38], [Y + 82, 33]], 8)
    .concat([[Y + 83, 34], [Y + 88, 35]]);
  const BOT = Y + 88 + 35 * KT;
  const LID = lathe([[Y - 22, 0.5], [Y - 21, 9], [Y - 18, 15], [Y - 12, 22], [Y - 5, 27.5], [Y, 30.5]], 6);

  function spout(ctx) {
    ctx.beginPath();
    ctx.moveTo(52, Y + 66);
    ctx.bezierCurveTo(34, Y + 58, 30, Y + 30, 17, Y + 4);
    ctx.lineTo(29, Y + 1);
    ctx.bezierCurveTo(36, Y + 22, 42, Y + 34, 50, Y + 36);
    ctx.closePath();
  }

  function blueBand(ctx, y0, y1) {
    const r0 = rAt(BODY, y0) + 1, r1 = rAt(BODY, y1) + 1;
    ctx.beginPath();
    ctx.ellipse(CX, y0, r0, r0 * KT, 0, Math.PI, 0, true);
    ctx.ellipse(CX, y1, r1, r1 * KT, 0, 0, Math.PI, false);
    ctx.closePath();
  }

  function draw(ctx) {
    // 把手（在壺身後面）
    handle(ctx, CX + 50, Y + 14, CX + 52, Y + 64, 30, 9.5, PORC, { lift: 0.3 });
    // 壺嘴
    spout(ctx);
    const sg = ctx.createLinearGradient(20, 0, 54, 0);
    sg.addColorStop(0, sh(PORC, -0.12));
    sg.addColorStop(0.35, '#FFFFFF');
    sg.addColorStop(1, sh(PORC, -0.2));
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,90,80,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 壺嘴口（金邊）
    ctx.save();
    ctx.translate(23, Y + 2.5);
    ctx.rotate(-0.2);
    oval(ctx, 0, 0, 6.5, 2.8);
    ctx.fillStyle = '#9C8A7A';
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    // 壺身
    const pts = outline(BODY, CX, KT);
    shadeBody(ctx, pts, CX, 61, Y - 20, BOT, PORC, { dk: 0.3, spec: 0.7 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 寶藍花帶＋白色小花
    blueBand(ctx, Y + 30, Y + 46);
    const bg = ctx.createLinearGradient(CX - 61, 0, CX + 61, 0);
    bg.addColorStop(0, sh(BLUE, -0.1));
    bg.addColorStop(0.28, sh(BLUE, 0.3));
    bg.addColorStop(0.6, BLUE);
    bg.addColorStop(1, sh(BLUE, -0.45));
    ctx.fillStyle = bg;
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = 0.25 + i * (Math.PI - 0.5) / 6;
      const r = rAt(BODY, Y + 38);
      const fx = CX + Math.cos(a) * r, fy = Y + 38 + Math.sin(a) * r * KT;
      const sz = 2.4 * (0.55 + 0.45 * Math.sin(a));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let p = 0; p < 5; p++) {
        const pa = p / 5 * TAU;
        oval(ctx, fx + Math.cos(pa) * sz, fy + Math.sin(pa) * sz * 0.8, sz * 0.7, sz * 0.55);
        ctx.fill();
      }
      ctx.fillStyle = GOLD;
      oval(ctx, fx, fy, sz * 0.5, sz * 0.45);
      ctx.fill();
    }
    // 金線
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = GOLD;
    for (const y of [Y + 27, Y + 49]) { const r = rAt(BODY, y) + 1; oval(ctx, CX, y, r, r * KT, 0.03, Math.PI - 0.03); ctx.stroke(); }
    // 花帶上也要有高光
    streak(ctx, CX - 32, Y + 6, Y + 70, 7, 0.45);
    ctx.restore();
    edge(ctx, pts, 'rgba(110,90,80,0.55)', 1.8);
    // 壺口金邊
    oval(ctx, CX, Y, 30.5, 30.5 * KT);
    ctx.fillStyle = sh(PORC, -0.1);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 壺蓋
    const lp = outline(LID, CX, KT);
    shadeBody(ctx, lp, CX, 30.5, Y - 36, Y + 15, PORC, { dk: 0.25, spec: 0.6, bottom: 0 });
    ctx.save();
    poly(ctx, lp);
    ctx.clip();
    oval(ctx, CX, Y - 1, 28, 28 * KT, 0, Math.PI);
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();
    edge(ctx, lp, 'rgba(110,90,80,0.5)', 1.5);
    // 蓋鈕（金色小球）
    sphere(ctx, CX, Y - 25, 6.8, GOLD, { hi: 0.55 });
    ctx.strokeStyle = 'rgba(120,85,20,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX, Y - 25, 6.8, 0, TAU); ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['earlgrey'] = { draw };
})();
