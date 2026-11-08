/* 珍珠奶茶（Bubble tea）
 * 辨識：透明高杯（上寬下窄）＋封口膜＋粗吸管（粉紅）＋杯底一層黑亮珍珠；奶茶是奶褐色。
 * 剪影：最高的杯子＋斜斜伸出去的粗吸管。光源左上。
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

  const CX = 92;
  const Y = 62, R = 53;
  const PROF = [[Y, R], [Y + 3, 52.6], [155, 40]];
  const BOT = 155 + 40 * KT;
  const TEA_Y = 68;
  const SX0 = 116, SY0 = 66, SX1 = 143, SY1 = 28;   // 吸管

  function pearls(ctx, inner) {
    ctx.save();
    poly(ctx, inner);
    ctx.clip();
    const r = K.rng(4242);
    const list = [];
    for (let row = 0; row < 4; row++) {
      const y = 170 - row * 10;
      const half = rAt(PROF, Math.min(155, y)) - 4;
      const n = Math.ceil(half * 2 / 12.5) + 1;
      for (let i = 0; i < n; i++) {
        const x = CX - half + (i + (row % 2) * 0.5) * (half * 2 / (n - 1 || 1)) + (r() - 0.5) * 3;
        list.push([x, y + (r() - 0.5) * 3, 5.6 + r() * 1.2]);
      }
    }
    // 往上飄的幾顆
    for (let i = 0; i < 5; i++) list.push([CX - 30 + r() * 60, 112 + r() * 14, 5.4 + r()]);
    list.sort((a, b) => a[1] - b[1]);
    for (const p of list) {
      ctx.fillStyle = 'rgba(30,14,8,0.35)';
      oval(ctx, p[0] + 0.8, p[1] + 1.2, p[2] + 0.8, p[2] + 0.6);
      ctx.fill();
      sphere(ctx, p[0], p[1], p[2], '#3A2118', { hi: 0.35, spec: 0.75 });
    }
    ctx.restore();
  }

  function straw(ctx, x0, y0, x1, y1, w) {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const g = ctx.createLinearGradient(x0 - nx * w / 2, y0 - ny * w / 2, x0 + nx * w / 2, y0 + ny * w / 2);
    g.addColorStop(0, '#FBB3CB');
    g.addColorStop(0.35, '#F07AA2');
    g.addColorStop(1, '#B83A68');
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(130,30,70,0.6)'; ctx.lineWidth = w + 2.2; ctx.stroke();
    ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + nx * w * 0.28, y0 + ny * w * 0.28); ctx.lineTo(x1 + nx * w * 0.28, y1 + ny * w * 0.28);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = w * 0.18; ctx.stroke();
    // 斜切的吸管口
    oval(ctx, x1, y1, w / 2 + 0.6, w * 0.3);
    ctx.fillStyle = '#7A1E44'; ctx.fill();
    ctx.strokeStyle = '#F7A0BE'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    const pts = outline(PROF, CX, KT);
    // 後方杯壁
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(236,244,248,0.7)';
    ctx.fill();
    // 奶茶
    const teaProf = slice(PROF, TEA_Y, 158).map(p => [p[0], p[1] - 2]);
    const tea = outline(teaProf, CX, KT);
    shadeBody(ctx, tea, CX, R - 2, TEA_Y, BOT, '#C9946A', { dk: 0.3, hi: 0.32, spec: 0.22, bounce: 0.1, bottom: 0.1 });
    pearls(ctx, tea);
    // 杯壁：細橫紋、高光
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let y = 132; y < 156; y += 6) { oval(ctx, CX, y, rAt(PROF, y), rAt(PROF, y) * KT, 0.15, Math.PI - 0.15); ctx.stroke(); }
    streak(ctx, CX - 36, 76, 160, 6, 0.75);
    streak(ctx, CX - 26, 86, 150, 2.2, 0.5);
    streak(ctx, CX + 42, 80, 156, 3.2, 0.4);
    ctx.restore();
    edge(ctx, pts, 'rgba(110,120,130,0.55)', 1.7);
    // 封口膜
    oval(ctx, CX, Y, R + 1.5, (R + 1.5) * KT);
    ctx.fillStyle = 'rgba(244,248,250,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,120,130,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    oval(ctx, CX, Y + 0.5, R - 4, (R - 4) * KT);
    const fg = ctx.createRadialGradient(CX - 14, Y - 8, 2, CX, Y, R);
    fg.addColorStop(0, 'rgba(255,255,255,0.95)');
    fg.addColorStop(1, 'rgba(214,196,176,0.9)');
    ctx.fillStyle = fg;
    ctx.fill();
    // 膜上的印花：一圈粉紅小點
    ctx.fillStyle = 'rgba(232,96,140,0.75)';
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU;
      oval(ctx, CX + Math.cos(a) * (R - 12), Y + Math.sin(a) * (R - 12) * KT, 2.4, 1.4);
      ctx.fill();
    }
    // 吸管戳破的洞
    ctx.fillStyle = 'rgba(120,80,60,0.45)';
    oval(ctx, SX0, SY0, 8.5, 4);
    ctx.fill();
    // 吸管在膜上方的那一段蓋回去
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 200, SY0 - 2); ctx.clip();
    straw(ctx, SX0, SY0, SX1, SY1, 13);
    ctx.restore();
    // 杯口亮邊
    oval(ctx, CX, Y, R, R * KT, Math.PI * 1.05, Math.PI * 1.55);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['bubbletea'] = { draw };
})();
