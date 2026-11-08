/* 道具美術（B6）：糖霜磚、果醬、上鎖禮盒、鑰匙造型奶油餅乾
 * 都在 200×200 單位座標裡畫，光源左上，斜上俯視（和甜點、飲品同一個視角）。
 * - icing：整格大小的白色糖霜磚，頂面有珠串擠花邊和格紋擠花，前面一排垂墜擠花。
 * - jam：半透明草莓果醬，是「蓋在甜點上面那一層」：中間透明度高，看得到底下的甜點；
 *        邊緣較濃、有光澤、往下滴。⚠ 請用 Art.raw('jam', px) 疊在甜點上，
 *        不要用 renderTile／sticker（白邊貼紙會在果醬底下墊一整塊不透明白色，就看不到甜點了）。
 * - gift：整格大小的粉紅禮盒＋酒紅緞帶蝴蝶結＋正面金色小鎖頭。
 * - key：鑰匙造型的奶油餅乾（可配對的方塊），心形鑰匙孔、白色糖霜描邊。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const sh = K.shade, rg = K.rgba;

  /* ---------- 小工具（B6 共用寫法，每個檔各自一份） ---------- */
  const TAU = Math.PI * 2;
  const KT = 0.5;   // 圓口的扁度（斜上俯視；所有飲品同一個視角）
  function oval(ctx, cx, cy, rx, ry, a0, a1, ccw) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), 0, a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1, !!ccw);
  }
  // 愛心路徑（中心 x,y，大小 s；尖端朝下）
  function heart(ctx, x, y, s, sy) {
    sy = sy || 1;
    const P = (u, v) => [x + u * s, y + v * s * sy];
    ctx.beginPath();
    let p = P(0, -0.32); ctx.moveTo(p[0], p[1]);
    let a = P(0.12, -0.78), b = P(1.05, -0.72), c = P(0.92, -0.08); ctx.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    a = P(0.82, 0.35); b = P(0.25, 0.62); c = P(0, 0.95); ctx.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    a = P(-0.25, 0.62); b = P(-0.82, 0.35); c = P(-0.92, -0.08); ctx.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    a = P(-1.05, -0.72); b = P(-0.12, -0.78); c = P(0, -0.32); ctx.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]);
    ctx.closePath();
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

  /* ---------- 共用：圓角厚板（頂面＋正面） ---------- */
  function slabTop(ctx, s, dy) {
    dy = dy || 0;
    const { x0, x1, y0, y1, cr, cv } = s;
    ctx.beginPath();
    ctx.moveTo(x0 + cr, y0 + dy);
    ctx.lineTo(x1 - cr, y0 + dy);
    ctx.ellipse(x1 - cr, y0 + cv + dy, cr, cv, 0, -Math.PI / 2, 0);
    ctx.lineTo(x1, y1 - cv + dy);
    ctx.ellipse(x1 - cr, y1 - cv + dy, cr, cv, 0, 0, Math.PI / 2);
    ctx.lineTo(x0 + cr, y1 + dy);
    ctx.ellipse(x0 + cr, y1 - cv + dy, cr, cv, 0, Math.PI / 2, Math.PI);
    ctx.lineTo(x0, y0 + cv + dy);
    ctx.ellipse(x0 + cr, y0 + cv + dy, cr, cv, 0, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  }
  function slabFront(ctx, s, H) {
    const { x0, x1, y1, cr, cv } = s;
    ctx.beginPath();
    ctx.moveTo(x0, y1 - cv);
    ctx.ellipse(x0 + cr, y1 - cv, cr, cv, 0, Math.PI, Math.PI / 2, true);
    ctx.lineTo(x1 - cr, y1);
    ctx.ellipse(x1 - cr, y1 - cv, cr, cv, 0, Math.PI / 2, 0, true);
    ctx.lineTo(x1, y1 - cv + H);
    ctx.ellipse(x1 - cr, y1 - cv + H, cr, cv, 0, 0, Math.PI / 2, false);
    ctx.lineTo(x0 + cr, y1 + H);
    ctx.ellipse(x0 + cr, y1 - cv + H, cr, cv, 0, Math.PI / 2, Math.PI, false);
    ctx.closePath();
  }
  // 整塊厚板的外輪廓
  function slabAll(ctx, s, H) {
    const { x0, x1, y0, y1, cr, cv } = s;
    ctx.beginPath();
    ctx.moveTo(x0 + cr, y0);
    ctx.lineTo(x1 - cr, y0);
    ctx.ellipse(x1 - cr, y0 + cv, cr, cv, 0, -Math.PI / 2, 0);
    ctx.lineTo(x1, y1 - cv + H);
    ctx.ellipse(x1 - cr, y1 - cv + H, cr, cv, 0, 0, Math.PI / 2);
    ctx.lineTo(x0 + cr, y1 + H);
    ctx.ellipse(x0 + cr, y1 - cv + H, cr, cv, 0, Math.PI / 2, Math.PI);
    ctx.lineTo(x0, y0 + cv);
    ctx.ellipse(x0 + cr, y0 + cv, cr, cv, 0, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  }
  // 沿圓角矩形周長取等距點
  function ringPoints(s, step) {
    const { x0, x1, y0, y1, cr, cv } = s;
    const raw = [];
    const arc = (cx, cy, a0, a1) => { for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; raw.push([cx + Math.cos(a) * cr, cy + Math.sin(a) * cv]); } };
    raw.push([x0 + cr, y0], [x1 - cr, y0]);
    arc(x1 - cr, y0 + cv, -Math.PI / 2, 0);
    raw.push([x1, y1 - cv]);
    arc(x1 - cr, y1 - cv, 0, Math.PI / 2);
    raw.push([x0 + cr, y1]);
    arc(x0 + cr, y1 - cv, Math.PI / 2, Math.PI);
    raw.push([x0, y0 + cv]);
    arc(x0 + cr, y0 + cv, Math.PI, Math.PI * 1.5);
    const out = [];
    let acc = 0;
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1], b = raw[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc <= d) { const t = d ? acc / d : 0; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); acc += step; }
      acc -= d;
    }
    return out;
  }
  // 擠花珠（小白球）
  function bead(ctx, x, y, r, col) {
    ctx.fillStyle = 'rgba(90,90,130,0.22)';
    oval(ctx, x + r * 0.25, y + r * 0.4, r * 1.05, r * 0.85);
    ctx.fill();
    sphere(ctx, x, y, r, col || '#F3F3F8', { hi: 0.6, spec: 0.85 });
  }
  // 擠花線（白色立體線條）
  function piping(ctx, build, w) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.translate(0.8, 1.4);
    build(); ctx.strokeStyle = 'rgba(100,100,140,0.28)'; ctx.lineWidth = w + 0.6; ctx.stroke();
    ctx.translate(-0.8, -1.4);
    build(); ctx.strokeStyle = '#F4F4FA'; ctx.lineWidth = w; ctx.stroke();
    ctx.translate(-w * 0.15, -w * 0.18);
    build(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = w * 0.38; ctx.stroke();
    ctx.restore();
  }

  /* ---------- 糖霜磚 ---------- */
  const IC = { x0: 16, x1: 184, y0: 30, y1: 118, cr: 22, cv: 11 };
  const IC_H = 50;

  function drawIcing(ctx) {
    // 正面
    slabFront(ctx, IC, IC_H);
    const fg = ctx.createLinearGradient(IC.x0, 0, IC.x1, 0);
    fg.addColorStop(0, '#E9E9F1');
    fg.addColorStop(0.25, '#F6F6FA');
    fg.addColorStop(0.7, '#E4E4EE');
    fg.addColorStop(1, '#CACADA');
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.save();
    slabFront(ctx, IC, IC_H);
    ctx.clip();
    const vg = ctx.createLinearGradient(0, IC.y1 - 10, 0, IC.y1 + IC_H);
    vg.addColorStop(0, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(110,110,150,0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, IC.y1 - 12, 200, IC_H + 14);
    // 垂墜擠花（一彎一彎的花綵）
    const n = 6, xa = IC.x0 + 14, xb = IC.x1 - 14, sw = (xb - xa) / n;
    piping(ctx, () => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xa + i * sw;
        ctx.moveTo(x, IC.y1 + 6);
        ctx.quadraticCurveTo(x + sw / 2, IC.y1 + 24, x + sw, IC.y1 + 6);
      }
    }, 3.2);
    for (let i = 0; i <= n; i++) bead(ctx, xa + i * sw, IC.y1 + 6, 3.4);
    // 底下一排小珠
    for (let x = IC.x0 + 18; x <= IC.x1 - 18; x += 9.4) bead(ctx, x, IC.y1 + IC_H - 7, 2.6);
    ctx.restore();
    // 頂面
    slabTop(ctx, IC);
    const tg = ctx.createLinearGradient(IC.x0, IC.y0, IC.x1, IC.y1);
    tg.addColorStop(0, '#FFFFFF');
    tg.addColorStop(0.6, '#F7F7FB');
    tg.addColorStop(1, '#E6E6F0');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.save();
    slabTop(ctx, IC);
    ctx.clip();
    // 格紋擠花（頂面平面上的斜格）
    const inner = { x0: IC.x0 + 24, x1: IC.x1 - 24, y0: IC.y0 + 13, y1: IC.y1 - 13, cr: 12, cv: 6 };
    ctx.save();
    slabTop(ctx, inner);
    ctx.clip();
    const slope = (IC.y1 - IC.y0) / (IC.x1 - IC.x0);
    piping(ctx, () => {
      ctx.beginPath();
      for (let k = -8; k <= 8; k++) {
        const x = 100 + k * 17;
        ctx.moveTo(x - 90, 74 - 90 * slope); ctx.lineTo(x + 90, 74 + 90 * slope);
        ctx.moveTo(x - 90, 74 + 90 * slope); ctx.lineTo(x + 90, 74 - 90 * slope);
      }
    }, 2.6);
    ctx.restore();
    // 銀色糖珠點綴
    for (const [x, y] of [[100, 74], [66, 74], [134, 74], [83, 65], [117, 65], [83, 83], [117, 83]]) {
      sphere(ctx, x, y, 2.6, '#C9CCD8', { hi: 0.7, spec: 0.95 });
    }
    ctx.restore();
    // 頂面一圈珠串擠花邊
    const ring = ringPoints({ x0: IC.x0 + 10, x1: IC.x1 - 10, y0: IC.y0 + 5, y1: IC.y1 - 5, cr: 15, cv: 7.5 }, 9.5);
    ring.sort((a, b) => a[1] - b[1]);
    for (const p of ring) bead(ctx, p[0], p[1], 4);
    // 外輪廓
    slabAll(ctx, IC, IC_H);
    ctx.strokeStyle = 'rgba(110,110,150,0.6)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 頂面前緣的稜線
    ctx.beginPath();
    ctx.moveTo(IC.x0, IC.y1 - IC.cv);
    ctx.ellipse(IC.x0 + IC.cr, IC.y1 - IC.cv, IC.cr, IC.cv, 0, Math.PI, Math.PI / 2, true);
    ctx.lineTo(IC.x1 - IC.cr, IC.y1);
    ctx.ellipse(IC.x1 - IC.cr, IC.y1 - IC.cv, IC.cr, IC.cv, 0, Math.PI / 2, 0, true);
    ctx.strokeStyle = 'rgba(140,140,175,0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // 左上高光
    ctx.beginPath();
    ctx.moveTo(IC.x0 + 3, IC.y0 + IC.cv + 4);
    ctx.ellipse(IC.x0 + IC.cr, IC.y0 + IC.cv, IC.cr - 3, IC.cv - 2, 0, Math.PI, Math.PI * 1.5);
    ctx.lineTo(IC.x0 + 70, IC.y0 + 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* ---------- 果醬 ---------- */
  function jamShape(ctx) {
    const cx = 100, cy = 92;
    const H = [[2, 0.05, 1.3], [3, 0.06, 0.4], [5, 0.035, 2.1], [7, 0.025, 0.9]];
    ctx.beginPath();
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const a = i / N * TAU;
      let k = 1;
      for (const h of H) k += h[1] * Math.sin(h[0] * a + h[2]);
      // 下方幾道往下流的果醬
      const drips = [[0.62, 0.11, 30], [0.5, 0.07, 18], [0.37, 0.09, 24]];
      let ext = 0;
      for (const d of drips) ext += d[2] * Math.exp(-Math.pow((a / Math.PI - d[0]) / (d[1] * 0.5), 2));
      const x = cx + Math.cos(a) * 72 * k;
      const y = cy + Math.sin(a) * 60 * k + (Math.sin(a) > 0 ? ext : 0);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function drawJam(ctx) {
    // 半透明本體：中間薄、邊緣厚
    jamShape(ctx);
    const g = ctx.createRadialGradient(92, 84, 6, 100, 96, 92);
    g.addColorStop(0, 'rgba(238,52,82,0.24)');
    g.addColorStop(0.5, 'rgba(222,32,64,0.32)');
    g.addColorStop(0.85, 'rgba(196,18,50,0.56)');
    g.addColorStop(1, 'rgba(165,8,40,0.78)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    jamShape(ctx);
    ctx.clip();
    // 邊緣的濃稠一圈（表面張力）
    jamShape(ctx);
    ctx.strokeStyle = 'rgba(150,0,32,0.55)';
    ctx.lineWidth = 9;
    ctx.stroke();
    // 右下比較暗、比較厚
    const sg = ctx.createLinearGradient(60, 50, 160, 160);
    sg.addColorStop(0, 'rgba(255,120,140,0.12)');
    sg.addColorStop(0.5, 'rgba(200,20,50,0)');
    sg.addColorStop(1, 'rgba(120,0,25,0.3)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, 200, 200);
    // 草莓果肉塊（比較不透明）
    const chunks = [[56, 72, 12, 8, 0.4], [140, 64, 11, 8, -0.3], [138, 120, 12, 8, 0.2], [56, 122, 9, 6, -0.6]];
    chunks.forEach((c, i) => {
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate(c[4]);
      const r = K.rng(700 + i);
      ctx.beginPath();
      for (let j = 0; j <= 16; j++) {
        const a = j / 16 * TAU, k = 0.82 + r() * 0.3;
        const x = Math.cos(a) * c[2] * k, y = Math.sin(a) * c[3] * k;
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      const cg = ctx.createRadialGradient(-c[2] * 0.3, -c[3] * 0.3, 1, 0, 0, c[2]);
      cg.addColorStop(0, 'rgba(255,120,130,0.85)');
      cg.addColorStop(0.6, 'rgba(206,20,50,0.85)');
      cg.addColorStop(1, 'rgba(150,0,30,0.9)');
      ctx.fillStyle = cg;
      ctx.fill();
      // 草莓籽
      ctx.fillStyle = 'rgba(255,220,120,0.95)';
      for (let j = 0; j < 4; j++) {
        oval(ctx, (r() - 0.5) * c[2] * 1.1, (r() - 0.5) * c[3] * 1.1, 1.2, 0.8);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      oval(ctx, -c[2] * 0.35, -c[3] * 0.4, c[2] * 0.25, c[3] * 0.18);
      ctx.fill();
      ctx.restore();
    });
    // 小氣泡
    const rb = K.rng(99);
    for (let i = 0; i < 10; i++) {
      const x = 40 + rb() * 120, y = 50 + rb() * 90, r = 1 + rb() * 1.6;
      ctx.strokeStyle = 'rgba(255,220,225,0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // 光澤：左上一道長長的反光＋幾個亮點
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 5;
    oval(ctx, 100, 92, 62, 46, Math.PI * 1.08, Math.PI * 1.42);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2.5;
    oval(ctx, 100, 92, 54, 38, Math.PI * 1.5, Math.PI * 1.62);
    ctx.stroke();
    for (const [x, y, r] of [[60, 66, 3.4], [138, 58, 2.2], [150, 128, 2], [92, 140, 2.4]]) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      oval(ctx, x, y, r, r * 0.7);
      ctx.fill();
    }
    ctx.restore();
    // 外緣細線
    jamShape(ctx);
    ctx.strokeStyle = 'rgba(120,0,28,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  /* ---------- 上鎖禮盒 ---------- */
  const PINK = '#F59BB8';
  const RIB = '#C42E55';
  const LIDS = { x0: 16, x1: 184, y0: 28, y1: 94, cr: 16, cv: 8 };
  const LID_H = 22;
  const BOX = { x0: 26, x1: 174, y0: 40, y1: 110, cr: 12, cv: 6 };
  const BOX_H = 62;

  function dots(ctx, x0, x1, y0, y1, sy, seed) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let y = y0, row = 0; y < y1; y += 13 * sy, row++) {
      for (let x = x0 + (row % 2) * 7; x < x1; x += 14) {
        oval(ctx, x, y, 2.6, 2.6 * sy);
        ctx.fill();
      }
    }
  }

  function ribbonFill(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, sh(RIB, -0.2));
    g.addColorStop(0.3, sh(RIB, 0.35));
    g.addColorStop(0.55, RIB);
    g.addColorStop(1, sh(RIB, -0.35));
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  function drawGift(ctx) {
    // 盒身正面
    slabFront(ctx, BOX, BOX_H);
    const bg = ctx.createLinearGradient(BOX.x0, 0, BOX.x1, 0);
    bg.addColorStop(0, sh(PINK, -0.08));
    bg.addColorStop(0.25, sh(PINK, 0.2));
    bg.addColorStop(0.7, PINK);
    bg.addColorStop(1, sh(PINK, -0.25));
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    slabFront(ctx, BOX, BOX_H);
    ctx.clip();
    dots(ctx, BOX.x0 + 6, BOX.x1, BOX.y1 + 8, BOX.y1 + BOX_H + 4, 1, 1);
    ribbonFill(ctx, 87, BOX.y1 - 10, 113, BOX.y1 + BOX_H + 10);
    // 盒蓋投下的陰影
    const sh2 = ctx.createLinearGradient(0, BOX.y1, 0, BOX.y1 + 16);
    sh2.addColorStop(0, 'rgba(110,20,50,0.4)');
    sh2.addColorStop(1, 'rgba(110,20,50,0)');
    ctx.fillStyle = sh2;
    ctx.fillRect(0, BOX.y1 - 10, 200, 26);
    ctx.restore();
    slabAll(ctx, BOX, BOX_H);
    ctx.strokeStyle = 'rgba(140,40,80,0.6)';
    ctx.lineWidth = 1.7;
    ctx.stroke();
    // 盒蓋正面帶
    slabFront(ctx, LIDS, LID_H);
    const lg = ctx.createLinearGradient(LIDS.x0, 0, LIDS.x1, 0);
    lg.addColorStop(0, sh(PINK, -0.12));
    lg.addColorStop(0.25, sh(PINK, 0.12));
    lg.addColorStop(0.7, sh(PINK, -0.06));
    lg.addColorStop(1, sh(PINK, -0.3));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.save();
    slabFront(ctx, LIDS, LID_H);
    ctx.clip();
    ribbonFill(ctx, 87, LIDS.y1 - 12, 113, LIDS.y1 + LID_H + 4);
    ctx.restore();
    // 盒蓋頂面
    slabTop(ctx, LIDS);
    const tg = ctx.createLinearGradient(LIDS.x0, LIDS.y0, LIDS.x1, LIDS.y1);
    tg.addColorStop(0, sh(PINK, 0.4));
    tg.addColorStop(0.55, sh(PINK, 0.15));
    tg.addColorStop(1, PINK);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.save();
    slabTop(ctx, LIDS);
    ctx.clip();
    dots(ctx, LIDS.x0 + 8, LIDS.x1, LIDS.y0 + 6, LIDS.y1, KT, 2);
    // 十字緞帶（頂面）
    ribbonFill(ctx, 87, LIDS.y0 - 2, 113, LIDS.y1 + 2);
    const hg = ctx.createLinearGradient(0, 54, 0, 68);
    hg.addColorStop(0, sh(RIB, 0.3));
    hg.addColorStop(0.5, RIB);
    hg.addColorStop(1, sh(RIB, -0.3));
    ctx.fillStyle = hg;
    ctx.fillRect(LIDS.x0 - 2, 54, LIDS.x1 - LIDS.x0 + 4, 13);
    ctx.restore();
    slabAll(ctx, LIDS, LID_H);
    ctx.strokeStyle = 'rgba(140,40,80,0.6)';
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(LIDS.x0, LIDS.y1 - LIDS.cv);
    ctx.ellipse(LIDS.x0 + LIDS.cr, LIDS.y1 - LIDS.cv, LIDS.cr, LIDS.cv, 0, Math.PI, Math.PI / 2, true);
    ctx.lineTo(LIDS.x1 - LIDS.cr, LIDS.y1);
    ctx.ellipse(LIDS.x1 - LIDS.cr, LIDS.y1 - LIDS.cv, LIDS.cr, LIDS.cv, 0, Math.PI / 2, 0, true);
    ctx.strokeStyle = 'rgba(255,230,240,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // 蝴蝶結
    const bx = 100, by = 58;
    const loop = (s) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(s, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(10, -26, 44, -30, 40, -8);
      ctx.bezierCurveTo(38, 4, 18, 6, 0, 0);
      const g = ctx.createLinearGradient(0, -26, 0, 6);
      g.addColorStop(0, sh(RIB, 0.35));
      g.addColorStop(0.6, RIB);
      g.addColorStop(1, sh(RIB, -0.35));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,10,30,0.6)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      // 圈內的陰影摺
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.bezierCurveTo(12, -16, 30, -18, 32, -9);
      ctx.strokeStyle = 'rgba(90,10,30,0.4)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, -16);
      ctx.bezierCurveTo(18, -24, 32, -24, 36, -16);
      ctx.strokeStyle = 'rgba(255,220,230,0.6)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    };
    const tail = (s) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(s, 1);
      ctx.beginPath();
      ctx.moveTo(-2, 2);
      ctx.lineTo(16, 30);
      ctx.lineTo(22, 24);
      ctx.lineTo(26, 32);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fillStyle = sh(RIB, -0.1);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,10,30,0.55)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    };
    tail(-1); tail(1);
    loop(-1); loop(1);
    rrect(ctx, bx - 8, by - 7, 16, 13, 4);
    const kg = ctx.createLinearGradient(0, by - 7, 0, by + 6);
    kg.addColorStop(0, sh(RIB, 0.3));
    kg.addColorStop(1, sh(RIB, -0.3));
    ctx.fillStyle = kg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,10,30,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // 金色小鎖頭（掛在正面緞帶上）
    const lx = 100, ly = 146;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(lx, ly - 10, 9.5, Math.PI, 0);
    ctx.lineTo(lx + 9.5, ly - 4);
    ctx.moveTo(lx - 9.5, ly - 10);
    ctx.lineTo(lx - 9.5, ly - 4);
    ctx.strokeStyle = 'rgba(90,60,10,0.75)';
    ctx.lineWidth = 6.6;
    ctx.stroke();
    ctx.strokeStyle = '#D8D2C4';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx, ly - 10, 9.5, Math.PI * 1.1, Math.PI * 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(80,20,30,0.4)';
    ctx.shadowBlur = 3 * pxScale(ctx);
    ctx.shadowOffsetY = 1.5 * pxScale(ctx);
    rrect(ctx, lx - 15, ly - 6, 30, 26, 6);
    ctx.fillStyle = '#D9A93E';
    ctx.fill();
    ctx.restore();
    rrect(ctx, lx - 15, ly - 6, 30, 26, 6);
    const gg = ctx.createLinearGradient(lx - 15, ly - 6, lx + 15, ly + 20);
    gg.addColorStop(0, '#FFF0B0');
    gg.addColorStop(0.35, '#F2C658');
    gg.addColorStop(0.75, '#C8902A');
    gg.addColorStop(1, '#94631A');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,10,0.8)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // 鑰匙孔
    ctx.fillStyle = '#4A2E0C';
    ctx.beginPath();
    ctx.arc(lx, ly + 4, 3.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lx - 2, ly + 5); ctx.lineTo(lx + 2, ly + 5); ctx.lineTo(lx + 3, ly + 13); ctx.lineTo(lx - 3, ly + 13); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,250,220,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(lx - 11, ly - 2); ctx.lineTo(lx + 6, ly - 2); ctx.stroke();
  }

  /* ---------- 鑰匙造型奶油餅乾 ---------- */
  const KEY_CRUMBS = ['#F0C070', '#FBE2A8', '#C98432', '#FFF4DC', '#E2A24E'];

  // 鑰匙外形（在餅乾自己的平面座標裡，鑰匙頭在左、齒在右下）
  function keyShape(ctx) {
    ctx.beginPath();
    ctx.arc(-46, 0, 33, 0, TAU);
    ctx.moveTo(-22, -10);
    ctx.lineTo(54, -10);
    ctx.quadraticCurveTo(62, -10, 62, -2);
    ctx.lineTo(62, 2);
    ctx.quadraticCurveTo(62, 10, 54, 10);
    ctx.lineTo(-22, 10);
    ctx.closePath();
    // 頸部的圓環
    rrectSub(ctx, -20, -15, 11, 30, 4);
    // 鑰匙齒
    rrectSub(ctx, 30, 4, 11, 26, 3);
    rrectSub(ctx, 46, 4, 10, 18, 3);
  }
  function rrectSub(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function keyFrame(ctx, dy) {
    ctx.translate(102, 96 + dy);
    ctx.scale(1.18, 0.8 * 1.18);
    ctx.rotate(0.6);
  }

  function drawKey(ctx) {
    // 餅乾厚度（側面）：一層層往下疊出實心的邊
    for (let d = 8; d >= 1; d -= 1) {
      ctx.save();
      keyFrame(ctx, d);
      keyShape(ctx);
      ctx.fillStyle = d > 6 ? '#A9631F' : d > 3 ? '#BE7A2E' : '#CF8E3C';
      ctx.fill('nonzero');
      ctx.restore();
    }
    ctx.save();
    keyFrame(ctx, 8);
    keyShape(ctx);
    ctx.strokeStyle = 'rgba(110,55,15,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    // 頂面
    ctx.save();
    keyFrame(ctx, 0);
    keyShape(ctx);
    const g = ctx.createRadialGradient(-50, -30, 6, 0, 0, 110);
    g.addColorStop(0, '#FCE1A2');
    g.addColorStop(0.45, '#F2C46E');
    g.addColorStop(1, '#D9953F');
    ctx.fillStyle = g;
    ctx.fill('nonzero');
    ctx.save();
    keyShape(ctx);
    ctx.clip('nonzero');
    // 邊緣烤得比較深
    keyShape(ctx);
    ctx.strokeStyle = 'rgba(190,110,40,0.55)';
    ctx.lineWidth = 9;
    ctx.stroke();
    // 烤色斑、小孔、砂糖粒
    const r = K.rng(1234);
    for (let i = 0; i < 40; i++) {
      const x = -78 + r() * 140, y = -32 + r() * 64;
      ctx.fillStyle = `rgba(200,120,40,${0.15 + r() * 0.2})`;
      oval(ctx, x, y, 2 + r() * 4, 1.5 + r() * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(150,85,25,0.55)';
    for (const [x, y] of [[0, -3], [14, 3], [28, -3], [-62, -16], [-66, 12], [-30, 20], [-34, -20]]) {
      oval(ctx, x, y, 1.6, 1.6);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 26; i++) {
      oval(ctx, -78 + r() * 140, -30 + r() * 60, 0.9, 0.9);
      ctx.fill();
    }
    ctx.restore();
    // 白色糖霜描邊：鑰匙頭一圈＋柄上一條
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(150,100,60,0.35)';
    ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.arc(-46 + 0.8, 1.4, 24, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, 1.4); ctx.lineTo(24, 1.4); ctx.stroke();
    ctx.strokeStyle = '#FFFDF6';
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.arc(-46, 0, 24, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(23, 0); ctx.stroke();
    // 外輪廓
    keyShape(ctx);
    ctx.strokeStyle = 'rgba(120,62,18,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    // 心形鑰匙孔：挖穿餅乾
    ctx.save();
    keyFrame(ctx, 0);
    ctx.globalCompositeOperation = 'destination-out';
    heart(ctx, -46, -1, 14, 1);
    ctx.fill();
    ctx.restore();
    // 孔裡看得到的內壁（後緣）：孔的頂面輪廓減去往下移一個厚度的輪廓
    ctx.save();
    keyFrame(ctx, 0);
    heart(ctx, -46, -1, 14, 1);
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#B87128';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    keyFrame(ctx, 8);
    heart(ctx, -46, -1, 14, 1);
    ctx.fill();
    ctx.restore();
    ctx.save();
    keyFrame(ctx, 0);
    heart(ctx, -46, -1, 14, 1);
    ctx.strokeStyle = 'rgba(120,62,18,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // 左上光澤
    ctx.save();
    keyFrame(ctx, 0);
    ctx.strokeStyle = 'rgba(255,248,225,0.7)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-46, 0, 30, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  }

  window.PROPS_ART = window.PROPS_ART || {};
  Object.assign(window.PROPS_ART, {
    icing: { draw: drawIcing },
    jam: { draw: drawJam },
    gift: { draw: drawGift },
    key: { draw: drawKey, crumbs: KEY_CRUMBS, crunchy: 0.8 },
  });
})();
