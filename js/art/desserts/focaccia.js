/* 佛卡夏（Focaccia）
 * 從烤盤切下的一塊方形扁麵包，斜上方俯視：頂面金黃、一個個手指壓出的小坑積著橄欖油，
 * 撒迷迭香、粗海鹽和幾片黑橄欖；切面看得到乳黃色、大大小小的氣孔，底部是煎得酥香的金褐色。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何 ---------- */
  const T0 = [90, 38], U = [92, 40], V = [-66, 38];   // 頂面後角、往右前、往左前
  const TH = 32, RC = 18;                              // 厚度、圓角
  const add = (p, q, s = 1) => [p[0] + q[0] * s, p[1] + q[1] * s];
  const Rr = add(T0, U), Lc = add(T0, V), F = add(Rr, V);
  const at = (u, v) => [T0[0] + U[0] * u + V[0] * v, T0[1] + U[1] * u + V[1] * v];  // 頂面參數座標 0～1

  // 圓角四邊形（頂面），dy 往下平移
  function quad(ctx, dy, inset) {
    const c = [T0, Rr, F, Lc];
    const ins = inset || 0;
    const cc = c.map(p => {
      const cx = (T0[0] + F[0]) / 2, cy = (T0[1] + F[1]) / 2;
      const d = Math.hypot(p[0] - cx, p[1] - cy);
      return [p[0] + (cx - p[0]) * ins / d, p[1] + (cy - p[1]) * ins / d];
    });
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const p0 = cc[(i + 3) % 4], p1 = cc[i], p2 = cc[(i + 1) % 4];
      const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = [p1[0] + (p0[0] - p1[0]) * RC / d0, p1[1] + (p0[1] - p1[1]) * RC / d0 + dy];
      const b = [p1[0] + (p2[0] - p1[0]) * RC / d2, p1[1] + (p2[1] - p1[1]) * RC / d2 + dy];
      i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(p1[0], p1[1] + dy, b[0], b[1]);
    }
    ctx.closePath();
  }
  // 整個外形＝頂面從 0 平移到 TH 的聯集
  function body(ctx) {
    ctx.beginPath();
    for (let dy = 0; dy <= TH; dy += 2) { quadSub(ctx, dy); }
  }
  function quadSub(ctx, dy) {
    const c = [T0, Rr, F, Lc];
    for (let i = 0; i < 4; i++) {
      const p0 = c[(i + 3) % 4], p1 = c[i], p2 = c[(i + 1) % 4];
      const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = [p1[0] + (p0[0] - p1[0]) * RC / d0, p1[1] + (p0[1] - p1[1]) * RC / d0 + dy];
      const b = [p1[0] + (p2[0] - p1[0]) * RC / d2, p1[1] + (p2[1] - p1[1]) * RC / d2 + dy];
      i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(p1[0], p1[1] + dy, b[0], b[1]);
    }
    ctx.closePath();
  }

  /* ---------- 側面（切面：乳黃氣孔＋金褐底） ---------- */
  function drawSides(ctx) {
    const rnd = K.rng(8);
    body(ctx);
    ctx.fillStyle = '#EBCB86'; ctx.fill();
    ctx.save();
    body(ctx); ctx.clip();
    // 由上往下：頂皮下緣→乳黃內裡→金褐底
    const g = ctx.createLinearGradient(0, Lc[1], 0, F[1] + TH);
    g.addColorStop(0, '#F8E6B4');
    g.addColorStop(0.5, '#F3D99C');
    g.addColorStop(1, '#E6BE6E');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 氣孔（只在前面看得到的兩個切面上）
    for (let i = 0; i < 110; i++) {
      const t = rnd(), onLeft = rnd() < 0.58;
      const a = onLeft ? Lc : F, b = onLeft ? F : Rr;
      const x = a[0] + (b[0] - a[0]) * t, y0 = a[1] + (b[1] - a[1]) * t;
      const y = y0 + 6 + rnd() * (TH - 13);
      const r = 0.7 + Math.pow(rnd(), 2.2) * 3.4;
      ctx.fillStyle = 'rgba(196,146,66,0.5)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,248,215,0.7)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.3, y + r * 0.35, r * 0.7, r * 0.4, 0, 0, TAU); ctx.fill();
    }
    // 頂皮在切面上的厚度（金褐色一圈）
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(200,128,48,0.9)';
    ctx.beginPath(); ctx.moveTo(Lc[0] - 4, Lc[1] + 2); ctx.lineTo(F[0], F[1] + 4); ctx.lineTo(Rr[0] + 4, Rr[1] + 2); ctx.stroke();
    // 底部煎得金褐的硬皮
    ctx.save();
    ctx.translate(0, TH - 4);
    ctx.lineWidth = 7; ctx.strokeStyle = '#C47F32';
    ctx.beginPath(); ctx.moveTo(Lc[0] - 4, Lc[1]); ctx.lineTo(F[0], F[1] + 3); ctx.lineTo(Rr[0] + 4, Rr[1]); ctx.stroke();
    ctx.restore();
    // 右前切面背光
    ctx.beginPath(); ctx.moveTo(F[0], F[1] - 4); ctx.lineTo(Rr[0], Rr[1] - 4); ctx.lineTo(Rr[0] + 8, Rr[1] + TH + 8); ctx.lineTo(F[0], F[1] + TH + 8); ctx.closePath();
    ctx.fillStyle = 'rgba(120,70,20,0.2)'; ctx.fill();
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    const rnd = K.rng(21);
    quad(ctx, 0);
    const g = ctx.createLinearGradient(Lc[0], T0[1], Rr[0], F[1]);
    g.addColorStop(0, '#F0BE62');
    g.addColorStop(0.45, '#DE9C40');
    g.addColorStop(1, '#B9722A');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    quad(ctx, 0); ctx.clip();
    // 烤色斑駁
    for (let i = 0; i < 45; i++) {
      const p = at(rnd(), rnd());
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(170,95,25,0.22)' : 'rgba(255,225,150,0.25)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 4 + rnd() * 8, 2.5 + rnd() * 4, 0.35, 0, TAU); ctx.fill();
    }
    // 邊緣膨起的圓角（亮邊＋內側淡影）
    quad(ctx, 0, 0);
    ctx.strokeStyle = 'rgba(150,80,20,0.35)'; ctx.lineWidth = 7; ctx.stroke();
    quad(ctx, 0, 3);
    ctx.strokeStyle = 'rgba(255,225,150,0.45)'; ctx.lineWidth = 2.2; ctx.stroke();
    // 坑與坑之間膨起的小丘（左上受光）
    for (let i = 0; i < 16; i++) {
      const p = at(0.08 + rnd() * 0.84, 0.08 + rnd() * 0.84);
      const gb = ctx.createRadialGradient(p[0] - 3, p[1] - 2, 0.5, p[0], p[1], 11);
      gb.addColorStop(0, 'rgba(255,226,150,0.55)'); gb.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = gb; ctx.beginPath(); ctx.ellipse(p[0], p[1], 12, 7, 0.3, 0, TAU); ctx.fill();
    }
    // 手指壓出的小坑（積著橄欖油）
    const holes = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      holes.push(at(0.15 + i * 0.235 + (rnd() - 0.5) * 0.07, 0.19 + j * 0.31 + (rnd() - 0.5) * 0.08));
    }
    for (const [x, y] of holes) {
      const rx = 5.6 + rnd() * 2, ry = rx * (0.5 + rnd() * 0.15), rot = 0.2 + (rnd() - 0.5) * 0.6;
      // 坑內：上緣深、下緣亮
      const gh = ctx.createLinearGradient(x, y - ry, x, y + ry);
      gh.addColorStop(0, '#7E4512'); gh.addColorStop(0.5, '#B8782E'); gh.addColorStop(1, '#E2A954');
      ctx.fillStyle = gh;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill();
      // 積著的橄欖油（黃綠油光）
      ctx.fillStyle = 'rgba(214,196,70,0.5)';
      ctx.beginPath(); ctx.ellipse(x + 0.4, y + ry * 0.25, rx * 0.66, ry * 0.5, rot, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,235,0.95)';
      ctx.beginPath(); ctx.ellipse(x - rx * 0.28, y + ry * 0.12, rx * 0.26, ry * 0.18, rot, 0, TAU); ctx.fill();
      // 下緣唇邊亮、上緣外側暗
      ctx.strokeStyle = 'rgba(255,228,150,0.8)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y + 0.5, rx + 0.8, ry + 0.8, rot, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,72,20,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y - 0.3, rx + 0.6, ry + 0.6, rot, Math.PI + 0.3, TAU - 0.3); ctx.stroke();
    }
    // 粗海鹽
    for (let i = 0; i < 26; i++) {
      const p = at(0.05 + rnd() * 0.9, 0.05 + rnd() * 0.9), s = 0.9 + rnd() * 1.1;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.moveTo(p[0] - s, p[1]); ctx.lineTo(p[0], p[1] - s * 0.8); ctx.lineTo(p[0] + s, p[1] + 0.2); ctx.lineTo(p[0] + 0.2, p[1] + s * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,140,120,0.4)';
      ctx.fillRect(p[0] - 0.2, p[1] + 0.2, s * 0.8, 0.5);
    }
    // 整面油光
    const go = ctx.createRadialGradient(Lc[0] + 40, T0[1] + 22, 2, Lc[0] + 40, T0[1] + 22, 50);
    go.addColorStop(0, 'rgba(255,245,200,0.4)'); go.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = go; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  /* ---------- 配料 ---------- */
  function olive(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.62);
    ctx.fillStyle = 'rgba(80,40,10,0.35)';
    ctx.beginPath(); ctx.arc(1, 2.5, r, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0.5, 0, 0, r);
    g.addColorStop(0, '#6A5A6E'); g.addColorStop(0.5, '#2E2232'); g.addColorStop(1, '#140C16');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.arc(0, 0, r * 0.42, 0, TAU, true); ctx.fill();
    ctx.fillStyle = '#8A5A2A';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-r * 0.55, -r * 0.4, r * 0.22, r * 0.12, -0.7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function rosemary(ctx, x, y, len, rot, seed) {
    const rnd = K.rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    // 影子
    ctx.strokeStyle = 'rgba(90,50,10,0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1, 2.5); ctx.lineTo(len + 1, 2.5); ctx.stroke();
    // 莖
    ctx.strokeStyle = '#6B5A2A'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -1.5, len, 0); ctx.stroke();
    // 一對對針狀葉
    for (let i = 0; i < 7; i++) {
      const t = 0.06 + i / 7 * 0.9, px = t * len, py = -Math.sin(t * Math.PI) * 1.5;
      for (const s of [-1, 1]) {
        const l = 6 + rnd() * 2.5 - t * 1.5, a = s * (0.55 + rnd() * 0.25);
        const ex = px + Math.cos(a) * l * 0.55, ey = py + Math.sin(a) * l;
        ctx.strokeStyle = s < 0 ? '#4E8A30' : '#2F5C1E'; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,230,170,0.55)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw(ctx) {
    drawSides(ctx);
    drawTop(ctx);
    rosemary(ctx, 46, 84, 32, -0.3, 3);
    rosemary(ctx, 108, 56, 29, 0.42, 9);
    rosemary(ctx, 116, 104, 27, -0.55, 15);
    olive(ctx, 86, 106, 7, 0.2);
    olive(ctx, 150, 82, 6.6, -0.3);
    olive(ctx, 82, 62, 6.2, 0.5);
    // 外輪廓
    body(ctx);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = 'rgba(130,72,20,0.85)'; ctx.lineWidth = 2.3; ctx.stroke();
    ctx.restore();
  }

  window.DESSERTS['focaccia'] = {
    draw,
    crumbs: ['#E2A64C', '#F6E2AE', '#C47F32', '#3B6A26', '#F2C46E'],
    crunchy: 0.45,
  };
})();
