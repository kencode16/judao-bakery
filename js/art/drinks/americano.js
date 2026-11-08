/* 美式咖啡（Caffè americano）
 * 辨識：外帶紙杯（白色、上寬下窄）＋深咖啡色杯蓋（有喝口）＋牛皮紙隔熱套，套上印一顆咖啡豆。
 * 剪影：唯一「有杯蓋」的高杯；顏色是白＋牛皮紙褐＋深褐蓋。光源左上。
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

  const PAPER = '#FBF8F2';
  const LID = '#3E2C25';
  const CX = 98;
  const Y = 64, R = 47;
  const PROF = [[Y, R], [158, 35.5]];
  const BOT = 158 + 35.5 * KT;
  const LIDP = lathe([[46, 49], [52, 51], [60, 51], [65, 48.5]], 4);

  function band(ctx, y0, y1, r0, r1) {
    ctx.beginPath();
    ctx.ellipse(CX, y0, r0, r0 * KT, 0, Math.PI, 0, true);
    ctx.ellipse(CX, y1, r1, r1 * KT, 0, 0, Math.PI, false);
    ctx.closePath();
  }

  function draw(ctx) {
    ctx.translate(0, 1.5);
    // 杯身
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y, BOT, PAPER, { dk: 0.3, spec: 0.5 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 杯底捲邊
    oval(ctx, CX, 152, rAt(PROF, 152), rAt(PROF, 152) * KT, 0.08, Math.PI - 0.08);
    ctx.strokeStyle = 'rgba(150,125,100,0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // 隔熱套（牛皮紙）
    const s0 = 92, s1 = 132;
    band(ctx, s0, s1, rAt(PROF, s0) + 2, rAt(PROF, s1) + 2);
    const kg = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    kg.addColorStop(0, '#B98450');
    kg.addColorStop(0.22, '#DDB27C');
    kg.addColorStop(0.5, '#C99860');
    kg.addColorStop(0.85, '#9C6A38');
    kg.addColorStop(1, '#7E5228');
    ctx.fillStyle = kg;
    ctx.fill();
    // 瓦楞細紋
    ctx.strokeStyle = 'rgba(110,70,30,0.18)';
    ctx.lineWidth = 0.9;
    for (let y = s0 + 4; y < s1; y += 4) { oval(ctx, CX, y, rAt(PROF, y) + 2, (rAt(PROF, y) + 2) * KT, 0.05, Math.PI - 0.05); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,55,20,0.45)';
    ctx.lineWidth = 1.3;
    for (const y of [s0, s1]) { oval(ctx, CX, y, rAt(PROF, y) + 2, (rAt(PROF, y) + 2) * KT, 0.02, Math.PI - 0.02); ctx.stroke(); }
    // 咖啡豆印記
    const bx = CX - 3, by = (s0 + s1) / 2 + rAt(PROF, (s0 + s1) / 2) * KT - 1;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-0.5);
    oval(ctx, 0, 0, 7.5, 10.5);
    ctx.fillStyle = '#5A3418';
    ctx.fill();
    ctx.strokeStyle = '#E8C899';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.bezierCurveTo(-3.5, -3, 3.5, 3, 0, 9);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    edge(ctx, pts, 'rgba(125,100,80,0.55)', 1.7);
    // 杯蓋側邊
    const lp = outline(LIDP, CX, KT);
    shadeBody(ctx, lp, CX, 51, 20, 90, LID, { hi: 0.5, dk: 0.4, spec: 0.35, bounce: 0.1, bottom: 0 });
    edge(ctx, lp, 'rgba(30,18,12,0.7)', 1.5);
    // 杯蓋頂面：外圈凸起、中間凹下、前方喝口
    oval(ctx, CX, 46, 49, 49 * KT);
    const tg = ctx.createLinearGradient(CX - 49, 22, CX + 49, 70);
    tg.addColorStop(0, '#6E5448');
    tg.addColorStop(0.5, '#47332B');
    tg.addColorStop(1, '#2C1E19');
    ctx.fillStyle = tg;
    ctx.fill();
    oval(ctx, CX + 1, 47.5, 38, 38 * KT);
    ctx.fillStyle = 'rgba(25,14,10,0.35)';
    ctx.fill();
    oval(ctx, CX + 1, 49, 36, 36 * KT);
    const cg = ctx.createLinearGradient(0, 30, 0, 66);
    cg.addColorStop(0, '#3A2A23');
    cg.addColorStop(1, '#5A443A');
    ctx.fillStyle = cg;
    ctx.fill();
    // 喝口凸台
    ctx.save();
    ctx.translate(CX - 14, 62);
    rrect(ctx, -15, -5, 30, 10, 5);
    ctx.fillStyle = '#56403A';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,210,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    oval(ctx, 0, -0.5, 8, 2.6);
    ctx.fillStyle = '#140B08';
    ctx.fill();
    ctx.restore();
    // 杯蓋高光
    oval(ctx, CX, 46, 46.5, 46.5 * KT, Math.PI * 1.05, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255,240,225,0.55)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    oval(ctx, CX, 46, 49, 49 * KT);
    ctx.strokeStyle = 'rgba(25,14,10,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['americano'] = { draw };
})();
