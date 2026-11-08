/* 杏仁茶（台式杏仁茶）
 * 辨識：白瓷碗（紅色雙圈碗緣）盛著米白色杏仁茶，一根金黃色、雙股的油條斜斜泡在碗裡、伸出碗外。
 * 剪影：寬碗＋往右上斜伸的長條油條；顏色是米白＋金黃。光源左上。
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

  const PORC = '#FBF7F0';
  const RED = '#C8463C';
  const CX = 88, Y = 100, R = 66;
  const PROF = lathe([[Y, R], [Y + 4, 65.4], [Y + 18, 61], [Y + 34, 50], [Y + 44, 38], [Y + 48, 31]], 8)
    .concat([[Y + 49, 28.5], [Y + 55, 29.5]]);
  const BOT = Y + 55 + 29.5 * KT;

  function almond(ctx, cx, y, rx, ry) {
    oval(ctx, cx, y, rx, ry);
    const g = ctx.createRadialGradient(cx - rx * 0.2, y - ry * 0.25, 2, cx, y, rx);
    g.addColorStop(0, '#FFFBF0');
    g.addColorStop(0.6, '#F3E7CF');
    g.addColorStop(1, '#D8C3A0');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.4;
    oval(ctx, cx - 6, y - 1, rx * 0.55, ry * 0.5, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
  }

  // 油條：兩股並排、表面鼓起的炸麵條
  function youtiao(ctx, x0, y0, x1, y1) {
    const L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(ang);
    const strand = (off, seed) => {
      const r = K.rng(seed);
      const bumps = [];
      for (let i = 0; i <= 16; i++) bumps.push(0.85 + r() * 0.3);
      const w = s => 9.2 * (0.86 + 0.14 * Math.sin(s * 0.5 + seed)) * bumps[Math.min(16, Math.round(s / L * 16))] * (s > L - 8 ? 0.85 : 1);
      ctx.beginPath();
      for (let s = 0; s <= L; s += 3) ctx.lineTo(s, off - w(s));
      ctx.quadraticCurveTo(L + 6, off, L, off + w(L));
      for (let s = L; s >= 0; s -= 3) ctx.lineTo(s, off + w(s));
      ctx.closePath();
      const g = ctx.createLinearGradient(0, off - 10, 0, off + 10);
      g.addColorStop(0, '#FDE6A8');
      g.addColorStop(0.35, '#F0BC5C');
      g.addColorStop(0.75, '#D98E36');
      g.addColorStop(1, '#A85E1C');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,60,15,0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 起泡的焦色小斑
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `rgba(150,80,20,${0.25 + r() * 0.3})`;
        oval(ctx, r() * L, off + (r() - 0.5) * 11, 1.5 + r() * 2.5, 0.8 + r());
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,240,200,0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(4, off - 5); ctx.lineTo(L - 6, off - 5); ctx.stroke();
    };
    strand(8.5, 7);
    strand(-8.5, 13);
    // 兩股中間黏在一起的縫
    ctx.strokeStyle = 'rgba(110,55,15,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(L, 0); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    const pts = outline(PROF, CX, KT);
    shadeBody(ctx, pts, CX, R, Y - R * KT, BOT, PORC, { dk: 0.32 });
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // 碗身紅色雙圈＋小花
    ctx.strokeStyle = RED;
    for (const [y, w] of [[Y + 9, 2.4], [Y + 14, 1.2]]) {
      const r = rAt(PROF, y);
      oval(ctx, CX, y, r, r * KT, 0.02, Math.PI - 0.02);
      ctx.lineWidth = w;
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const a = 0.45 + i * (Math.PI - 0.9) / 4, r = rAt(PROF, Y + 28);
      const x = CX + Math.cos(a) * r, y = Y + 28 + Math.sin(a) * r * KT;
      const s = 0.5 + 0.5 * Math.sin(a);
      ctx.fillStyle = RED;
      for (let p = 0; p < 4; p++) { const pa = p / 4 * TAU + 0.4; oval(ctx, x + Math.cos(pa) * 2.4 * s, y + Math.sin(pa) * 2 * s, 2 * s, 1.5 * s); ctx.fill(); }
      ctx.fillStyle = '#3E8A4A';
      oval(ctx, x + 5 * s, y + 1.5, 3 * s, 1.2 * s);
      ctx.fill();
    }
    ctx.restore();
    edge(ctx, pts, 'rgba(125,92,70,0.55)', 1.8);
    cupMouth(ctx, CX, Y, R, 3.4, PORC, '#EFE6DA', 6, almond);
    // 油條：泡進杯裡的那一端被茶湯蓋住
    ctx.save();
    aboveFront(ctx, CX, Y + 0.6, R - 3.4, KT);
    ctx.clip();
    youtiao(ctx, CX - 14, Y + 10, 168, 42);
    ctx.restore();
    // 油條進入茶湯處的一圈漣漪
    ctx.save();
    oval(ctx, CX, Y + 0.6, R - 3.4, (R - 3.4) * KT);
    ctx.clip();
    oval(ctx, CX - 10, Y + 9, 15, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['almondtea'] = { draw };
})();
