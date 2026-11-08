/* 烏龍茶（Oolong，台灣高山烏龍）
 * 辨識：青瓷蓋杯（蓋碗）＋小碟；杯蓋微微斜開，左邊露出一彎金黃色茶湯。
 * 剪影：唯一「杯上有圓頂蓋子和蓋鈕」的形狀；顏色是淡青綠＋金黃。光源左上。
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
  // 裁切區：杯口前緣弧線以上（浮在液面上、會被前緣擋住下半的東西用）
  function aboveFront(ctx, cx, y, r, k) {
    ctx.beginPath();
    ctx.moveTo(-50, -50); ctx.lineTo(250, -50); ctx.lineTo(250, y);
    ctx.lineTo(cx + r, y);
    ctx.ellipse(cx, y, r, r * k, 0, 0, Math.PI, false);
    ctx.lineTo(-50, y);
    ctx.closePath();
  }

  const CEL = '#A9D2BF';
  const CX = 100, SY = 136, SR = 70;
  const Y = 98, R = 57;
  const PROF = lathe([[Y, R], [Y + 4, 56], [Y + 14, 51], [Y + 26, 41], [Y + 33, 31], [Y + 36, 24]], 8)
    .concat([[Y + 37, 23.5], [Y + 42, 25]]);
  const BOT = Y + 42 + 25 * KT;
  const RI = R - 3;
  // 杯蓋（以蓋緣中心為原點）
  const LID = lathe([[-37, 0.5], [-36.5, 9], [-32, 11], [-29, 11.5], [-27, 16], [-20, 33], [-10, 45], [-3, 50], [0, 51.5]], 6);

  function tea(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx, y, 2, cx, y, rx);
    g.addColorStop(0, '#F2CD5A');
    g.addColorStop(0.6, '#DDAA32');
    g.addColorStop(1, '#A87418');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,215,0.6)';
    oval(ctx, cx - rx * 0.62, y - ry * 0.1, rx * 0.16, ry * 0.18);
    ctx.fill();
  }

  function draw(ctx) {
    saucer(ctx, CX, SY, SR, CEL, { th: 7, well: 0.5 });
    blot(ctx, CX + 10, SY + 2, 40, 14, 'rgba(40,70,55,0.38)', 'rgba(40,70,55,0)');
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y - R * KT, BOT, CEL, { dk: 0.35, spec: 0.65 });
    edge(ctx, pts, 'rgba(50,95,75,0.6)', 1.8);
    cupMouth(ctx, CX, Y, R, 3, CEL, '#DCEDE3', 5, tea, { line: 'rgba(50,95,75,0.6)' });
    // 杯蓋：往右後方斜開，左邊露出茶湯
    ctx.save();
    aboveFront(ctx, CX, Y + 0.6, RI, KT);
    ctx.clip();
    ctx.translate(CX + 13, Y - 6);
    ctx.rotate(-0.21);
    // 蓋子投在茶湯上的影子
    blot(ctx, -8, 8, 50, 22, 'rgba(60,40,10,0.35)', 'rgba(60,40,10,0)');
    const lp = outline(LID, 0, KT);
    shadeBody(ctx, lp, 0, 51.5, -60, 26, CEL, { dk: 0.32, spec: 0.7, bottom: 0 });
    // 蓋緣（底面的一圈厚邊）
    oval(ctx, 0, 0, 51.5, 51.5 * KT, 0, Math.PI);
    ctx.strokeStyle = sh(CEL, -0.2);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    edge(ctx, lp, 'rgba(50,95,75,0.6)', 1.6);
    // 蓋鈕：小碟形，頂面凹
    oval(ctx, 0, -36.5, 9, 9 * KT);
    ctx.fillStyle = sh(CEL, 0.25);
    ctx.fill();
    oval(ctx, 0, -36, 6, 6 * KT);
    ctx.fillStyle = sh(CEL, -0.15);
    ctx.fill();
    oval(ctx, 0, -36.5, 9, 9 * KT);
    ctx.strokeStyle = 'rgba(50,95,75,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['oolong'] = { draw };
})();
