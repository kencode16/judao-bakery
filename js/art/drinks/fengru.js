/* 風茹茶（澎湖的青草茶）
 * 辨識：細長玻璃瓶裝的深琥珀色茶湯＋綠色瓶蓋；瓶身貼米白標籤，畫一朵澎湖縣花天人菊（紅心黃邊）；
 *       瓶子右邊斜靠一枝風茹草。
 * 剪影：唯一的「細頸高瓶」（牛奶瓶是寬口矮胖）；顏色是深琥珀＋綠。光源左上。
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

  const CX = 86;
  const BODY = lathe([[38, 12], [52, 12.5], [60, 14], [68, 22], [78, 32], [90, 38], [100, 39], [150, 39], [156, 37]], 6);
  const BOT = 156 + 37 * KT;
  const LIQ_Y = 60;
  const CAP = lathe([[29, 13.5], [32, 14], [39, 14]], 3);

  function daisy(ctx, x, y, s) {
    // 天人菊：外圈黃色、內圈紅色的舌狀花，中心深紅褐
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(4.5 * s, -2.6 * s, 10 * s, -1.6 * s);
      ctx.lineTo(10.6 * s, 0);
      ctx.lineTo(10 * s, 1.6 * s);
      ctx.quadraticCurveTo(4.5 * s, 2.6 * s, 0, 0);
      ctx.fillStyle = '#F2C024';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3 * s, -2.2 * s, 6.4 * s, -1.4 * s);
      ctx.lineTo(6.4 * s, 1.4 * s);
      ctx.quadraticCurveTo(3 * s, 2.2 * s, 0, 0);
      ctx.fillStyle = '#C8322A';
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(x, y, 3 * s, 0, TAU);
    ctx.fillStyle = '#5A1E12';
    ctx.fill();
  }

  function sprig(ctx) {
    // 風茹草：細莖＋細裂的小葉
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4E7A2E';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(126, 176);
    ctx.quadraticCurveTo(146, 130, 166, 84);
    ctx.stroke();
    const leaves = [[0.12, 1], [0.22, -1], [0.34, 1], [0.44, -1], [0.56, 1], [0.66, -1], [0.78, 1], [0.88, -1], [0.97, 0]];
    for (const [t, s] of leaves) {
      const u = 1 - t;
      const x = u * u * 126 + 2 * u * t * 146 + t * t * 166, y = u * u * 176 + 2 * u * t * 130 + t * t * 84;
      const ang = -1.16 + s * 0.85;
      const len = 15 - t * 5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // 細裂葉：三片小裂片
      for (const k of [-0.35, 0, 0.35]) {
        ctx.save();
        ctx.rotate(k);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.5, -2.6, len, 0);
        ctx.quadraticCurveTo(len * 0.5, 2.6, 0, 0);
        const g = ctx.createLinearGradient(0, -3, 0, 3);
        g.addColorStop(0, '#8CC860');
        g.addColorStop(1, '#3F7A2A');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    // 頂端的小黃花
    ctx.fillStyle = '#F2D040';
    for (const [dx, dy] of [[0, 0], [5, 3], [-3, 4]]) {
      ctx.beginPath(); ctx.arc(167 + dx, 80 + dy, 2.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx) {
    sprig(ctx);
    const pts = outline(BODY, CX, KT);
    const R = 39;
    // 玻璃
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(220,230,226,0.7)';
    ctx.fill();
    // 茶湯
    const lp = outline(slice(BODY, LIQ_Y, 156).map(p => [p[0], Math.max(0, p[1] - 2)]), CX, KT);
    const lg = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    lg.addColorStop(0, '#5A2A0C');
    lg.addColorStop(0.3, '#A0561E');
    lg.addColorStop(0.55, '#7A3C12');
    lg.addColorStop(1, '#3A1806');
    poly(ctx, lp);
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.save();
    poly(ctx, lp);
    ctx.clip();
    blot(ctx, CX - 6, 150, 30, 14, 'rgba(230,140,60,0.45)', 'rgba(230,140,60,0)');
    ctx.restore();
    // 標籤
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const y0 = 100, y1 = 140;
    ctx.beginPath();
    ctx.ellipse(CX, y0, R + 1, (R + 1) * KT, 0, Math.PI, 0, true);
    ctx.ellipse(CX, y1, R + 1, (R + 1) * KT, 0, 0, Math.PI, false);
    ctx.closePath();
    const pg = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    pg.addColorStop(0, '#E8DCC0');
    pg.addColorStop(0.3, '#FFF8E8');
    pg.addColorStop(0.65, '#F2E6CC');
    pg.addColorStop(1, '#C9B898');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = '#3E8E5A';
    ctx.lineWidth = 2;
    for (const y of [y0 + 3, y1 - 3]) { oval(ctx, CX, y, R + 1, (R + 1) * KT, 0.05, Math.PI - 0.05); ctx.stroke(); }
    daisy(ctx, CX - 4, (y0 + y1) / 2 + R * KT - 2, 1.15);
    // 玻璃光澤
    streak(ctx, CX - R * 0.62, 70, 150, 5, 0.8);
    streak(ctx, CX - R * 0.45, 80, 140, 2, 0.5);
    streak(ctx, CX + R * 0.8, 80, 150, 3, 0.35);
    streak(ctx, CX - 5, 40, 60, 2.2, 0.7);
    ctx.restore();
    edge(ctx, pts, 'rgba(70,60,40,0.6)', 1.7);
    // 綠色瓶蓋
    const cp = outline(CAP, CX, KT);
    shadeBody(ctx, cp, CX, 14, 18, 44, '#3E8E5A', { dk: 0.4, spec: 0.5, bottom: 0 });
    ctx.save();
    poly(ctx, cp);
    ctx.clip();
    ctx.strokeStyle = 'rgba(20,60,30,0.45)';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { const x = CX + i * 2.2; ctx.beginPath(); ctx.moveTo(x, 31); ctx.lineTo(x, 46); ctx.stroke(); }
    ctx.restore();
    oval(ctx, CX, 29, 13.5, 13.5 * KT);
    ctx.fillStyle = '#5FAE78';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,60,30,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    edge(ctx, cp, 'rgba(20,60,30,0.6)', 1.3);
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['fengru'] = { draw };
})();
