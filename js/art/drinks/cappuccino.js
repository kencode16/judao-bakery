/* 卡布奇諾（Cappuccino）
 * 辨識：透明玻璃杯（有杯耳）看得到分層：底下深色濃縮咖啡 → 牛奶咖啡 → 厚厚白奶泡；
 *       奶泡高高隆起超出杯口，上面撒滿可可粉。
 * 剪影：杯口上方圓頂奶泡；顏色是上白下深的兩截。光源左上。
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

  const CX = 92;
  const Y = 74, R = 50;
  const PROF = [[Y, R], [Y + 2, 49.8], [154, 42]];
  const BOT = 154 + 42 * KT;
  const IN = PROF.map(p => [p[0], p[1] - 3.2]);

  function layer(ctx, y0, y1, c0, c1) {
    const pts = outline(slice(IN, y0, y1), CX, KT);
    const g = ctx.createLinearGradient(0, y0, 0, y1 + 20);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    poly(ctx, pts);
    ctx.fillStyle = g;
    ctx.fill();
    return pts;
  }

  function dome(ctx) {
    const ri = R - 3.2, top = Y - ri * KT - 15;
    ctx.beginPath();
    ctx.moveTo(CX + ri, Y);
    ctx.ellipse(CX, Y, ri, ri * KT, 0, 0, Math.PI, false);
    ctx.bezierCurveTo(CX - ri, Y - 14, CX - ri * 0.62, top, CX, top);
    ctx.bezierCurveTo(CX + ri * 0.62, top, CX + ri, Y - 14, CX + ri, Y);
    ctx.closePath();
  }

  function draw(ctx) {
    // 玻璃杯耳（透明）
    handle(ctx, CX + R - 2, Y + 14, CX + 44, Y + 58, 26, 9, '#E4EEF2', { edge: 'rgba(110,135,150,0.6)', hl: 0.9 });
    const pts = outline(PROF, CX, KT);
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(232,242,246,0.7)';
    ctx.fill();
    // 分層（由下往上畫，上層蓋住下層的頂面）
    layer(ctx, 122, 147, '#4E2410', '#26100A');
    layer(ctx, 102, 122, '#C38A58', '#8A5028');
    const foam = layer(ctx, Y, 102, '#FFFBF4', '#EAD8C0');
    // 層與層之間柔和交界
    ctx.save();
    poly(ctx, outline(slice(IN, Y, 147), CX, KT));
    ctx.clip();
    for (const [y, c] of [[102, 'rgba(214,176,134,0.7)'], [122, 'rgba(110,60,30,0.6)']]) {
      const r = rAt(IN, y);
      oval(ctx, CX, y, r, r * KT, 0, Math.PI);
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    // 奶泡裡的細泡
    const rb = K.rng(77);
    for (let i = 0; i < 26; i++) {
      const y = Y + 8 + rb() * 24, r = rAt(IN, y);
      const a = rb() * Math.PI;
      oval(ctx, CX + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * KT, 1 + rb() * 1.6, 0.8 + rb());
      ctx.strokeStyle = 'rgba(200,170,130,0.45)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.restore();
    // 玻璃：光澤、杯壁、厚杯底
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const sideG = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    sideG.addColorStop(0, 'rgba(255,255,255,0.3)');
    sideG.addColorStop(0.08, 'rgba(255,255,255,0)');
    sideG.addColorStop(0.9, 'rgba(255,255,255,0)');
    sideG.addColorStop(1, 'rgba(180,205,215,0.5)');
    ctx.fillStyle = sideG;
    ctx.fillRect(CX - R, Y - 30, 2 * R, 140);
    // 厚杯底（液面以下那一截透明玻璃）
    oval(ctx, CX, 147, rAt(IN, 147), rAt(IN, 147) * KT, 0.05, Math.PI - 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    streak(ctx, CX - 36, 84, 150, 5.5, 0.8);
    streak(ctx, CX - 27, 96, 140, 2, 0.55);
    streak(ctx, CX + 41, 88, 148, 3, 0.45);
    ctx.restore();
    edge(ctx, pts, 'rgba(100,125,140,0.6)', 1.8);
    // 圓頂奶泡＋可可粉
    dome(ctx);
    const dg = ctx.createRadialGradient(CX - 16, Y - 30, 3, CX, Y - 10, 56);
    dg.addColorStop(0, '#FFFFFF');
    dg.addColorStop(0.6, '#FBF3E8');
    dg.addColorStop(1, '#E2CDB2');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.save();
    dome(ctx);
    ctx.clip();
    blot(ctx, CX + 2, Y - 18, 38, 22, 'rgba(120,64,30,0.85)', 'rgba(150,90,50,0)');
    const r = K.rng(1919);
    for (let i = 0; i < 220; i++) {
      const a = r() * TAU, d = Math.pow(r(), 0.7);
      const x = CX + 2 + Math.cos(a) * d * 44, y = Y - 18 + Math.sin(a) * d * 22;
      ctx.fillStyle = `rgba(${90 + r() * 40 | 0},${44 + r() * 20 | 0},20,${0.35 + r() * 0.4})`;
      oval(ctx, x, y, 0.7 + r() * 1.1, 0.5 + r() * 0.8);
      ctx.fill();
    }
    // 奶泡右下暗、左上亮
    const sg = ctx.createLinearGradient(CX - 40, Y - 40, CX + 45, Y + 20);
    sg.addColorStop(0, 'rgba(255,255,255,0.3)');
    sg.addColorStop(0.55, 'rgba(255,255,255,0)');
    sg.addColorStop(1, 'rgba(120,80,50,0.22)');
    ctx.fillStyle = sg;
    ctx.fillRect(CX - R, Y - 50, 2 * R, 80);
    ctx.restore();
    dome(ctx);
    ctx.strokeStyle = 'rgba(150,115,85,0.45)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // 杯口前緣（玻璃厚邊）
    oval(ctx, CX, Y, R, R * KT, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    oval(ctx, CX, Y + 1.6, R, R * KT, 0.05, Math.PI - 0.05);
    ctx.strokeStyle = 'rgba(100,125,140,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['cappuccino'] = { draw };
})();
