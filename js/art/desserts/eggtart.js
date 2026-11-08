/* 葡式蛋塔（Pastel de nata）
 * 斜上 45 度：頂面橢圓（千層酥皮塔緣＋奶黃蛋奶餡＋焦糖烤斑），下方看得到螺旋層次的側壁。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const TOP = { cy: 84, rx: 82, ry: 51 };      // 塔緣外圈（頂面）
  const BOT = { cy: 129, rx: 64, ry: 39 };     // 塔底
  const RIM_IN = { cy: 85.5, rx: 69, ry: 42.5 }; // 塔緣內圈
  const CUS = { cy: 88, rx: 67.5, ry: 40 };    // 蛋奶餡

  // 固定種子的平滑雜訊：t 為角度
  function makeNoise(seed, amp, freqs) {
    const r = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: r() * TAU, a: (0.6 + r() * 0.4) / (1 + i * 0.6) }));
    return (t) => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }

  const nTop = makeNoise(11, 1.1, [3, 5, 8, 13, 21]);
  const nBot = makeNoise(23, 0.8, [4, 7, 11]);
  const jagR = K.rng(31);
  const JAG = []; for (let i = 0; i < 160; i++) JAG.push((jagR() - 0.5) * 1.8);
  function jag(th) {
    const u = ((th % TAU) + TAU) % TAU / TAU * 160;
    const i = Math.floor(u), f = u - i;
    return JAG[i % 160] * (1 - f) + JAG[(i + 1) % 160] * f;
  }

  function ep(e, th, n) {
    return [CX + Math.cos(th) * (e.rx + n), e.cy + Math.sin(th) * (e.ry + n * e.ry / e.rx)];
  }
  function lerpE(a, b, t) {
    return { cy: a.cy + (b.cy - a.cy) * t, rx: a.rx + (b.rx - a.rx) * t, ry: a.ry + (b.ry - a.ry) * t };
  }
  function poly(ctx, pts, close) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (close) ctx.closePath();
  }

  // 整個外輪廓（頂面上半＋右側壁＋塔底下半＋左側壁）
  function silhouette(ctx) {
    ctx.beginPath();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const th = Math.PI + Math.PI * i / N;
      const p = ep(TOP, th, nTop(th) + jag(th));
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    sidePts(1).forEach(p => ctx.lineTo(p[0], p[1]));
    for (let i = 0; i <= N; i++) {
      const th = Math.PI * i / N;
      const p = ep(BOT, th, nBot(th));
      ctx.lineTo(p[0], p[1]);
    }
    sidePts(-1).reverse().forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
  }

  // 側壁左右邊：微微外鼓，每一層酥皮在邊上稍微凸出一點（層層疊疊的剪影）
  const LAYERS = 10;
  function sidePts(side) {
    const pts = [];
    const n0 = side > 0 ? nTop(0) : nTop(Math.PI);
    const n1 = side > 0 ? nBot(0) : nBot(Math.PI);
    const phase = side > 0 ? 0.25 : 0.25 + 1.2;
    for (let i = 0; i <= 42; i++) {
      const t = i / 42;
      const e = lerpE(TOP, BOT, t);
      let u = (t * LAYERS - phase) % 1; if (u < 0) u += 1;
      const lip = (t > 0.08 && t < 0.95) ? 1.1 * Math.pow(u, 3) : 0;
      const off = (n0 * (1 - t) + n1 * t) + 3 * Math.sin(Math.PI * t) + lip;
      pts.push([CX + side * (e.rx + off), e.cy]);
    }
    return pts;
  }

  function topPath(ctx, e, noise, jitter) {
    ctx.beginPath();
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const th = TAU * i / N;
      const p = ep(e, th, (noise ? noise(th) : 0) + (jitter ? jag(th) : 0));
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.closePath();
  }

  // 不規則斑塊：半徑用幾個低頻諧波擾動，形狀圓潤自然；sx 拉長、sy 透視壓扁
  function blob(ctx, x, y, r, sx, sy, rot, seed, n, vari) {
    const rnd = K.rng(seed);
    const H = [];
    for (let k = 2; k <= 6; k++) H.push([k, rnd() * TAU, (0.4 + rnd() * 0.6) / k]);
    const N = Math.max(24, n * 3);
    const cr = Math.cos(rot), sr = Math.sin(rot);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = TAU * i / N;
      let d = 0; for (const h of H) d += h[2] * Math.sin(h[0] * a + h[1]);
      const rr = r * (1 + vari * 0.55 * d);
      const lx = Math.cos(a) * rr * sx, ly = Math.sin(a) * rr;
      const px = x + lx * cr - ly * sr, py = y + (lx * sr + ly * cr) * sy;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  /* ---------- 側壁 ---------- */
  function drawWall(ctx) {
    silhouette(ctx);
    const g = ctx.createLinearGradient(18, 0, 182, 0);
    g.addColorStop(0, '#BE6514');
    g.addColorStop(0.15, '#E89C34');
    g.addColorStop(0.32, '#F6BC4C');
    g.addColorStop(0.55, '#E2922E');
    g.addColorStop(0.8, '#B95E14');
    g.addColorStop(1, '#8F400A');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    silhouette(ctx);
    ctx.clip();

    // 往下越烤越深
    const v = ctx.createLinearGradient(0, TOP.cy + 30, 0, BOT.cy + BOT.ry);
    v.addColorStop(0, 'rgba(120,50,10,0)');
    v.addColorStop(1, 'rgba(125,48,0,0.48)');
    ctx.fillStyle = v;
    ctx.fillRect(0, TOP.cy, 200, 120);

    // 烤色斑駁
    const rb = K.rng(404);
    for (let i = 0; i < 26; i++) {
      const a = 0.1 + rb() * (Math.PI - 0.2);
      const t = 0.15 + rb() * 0.8;
      const p = ep(lerpE(TOP, BOT, t), a, 0);
      ctx.fillStyle = `rgba(${110 + rb() * 30 | 0},${45 + rb() * 15 | 0},8,${0.12 + rb() * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], 4 + rb() * 7, 1.6 + rb() * 2, 0, 0, TAU);
      ctx.fill();
    }

    // 螺旋千層：一圈圈稍微斜、會起伏的層次線
    const rnd = K.rng(57);
    const L = LAYERS;
    for (let k = 0; k < L; k++) {
      const t0 = (k + 0.25) / L;
      const slope = 1.2 / L;
      const wob = makeNoise(100 + k, 1, [5, 9, 15]);
      const tAt = (a) => Math.min(0.97, t0 + slope * (a / Math.PI) + wob(a) / 55 * Math.sin(a));
      // 每層的下半部稍暗（上一層蓋住的陰影帶）
      const band = [];
      for (let a = 0; a <= Math.PI + 1e-6; a += 0.05) band.push(ep(lerpE(TOP, BOT, tAt(a)), a, 0));
      for (let a = Math.PI; a >= -1e-6; a -= 0.05) band.push(ep(lerpE(TOP, BOT, Math.max(0, tAt(a) - 0.045)), a, 0));
      ctx.fillStyle = 'rgba(120,52,10,0.1)';
      poly(ctx, band, true);
      ctx.fill();
      let th = 0.0;
      while (th < Math.PI) {
        const len = 0.7 + rnd() * 1.2;
        const end = Math.min(Math.PI, th + len);
        const pts = [];
        for (let a = th; a <= end + 1e-6; a += 0.03) pts.push(ep(lerpE(TOP, BOT, tAt(a)), a, 0));
        // 層與層之間的陰影縫
        ctx.strokeStyle = `rgba(112,44,6,${0.32 + rnd() * 0.2})`;
        ctx.lineWidth = 0.7 + rnd() * 0.5;
        poly(ctx, pts);
        ctx.stroke();
        // 下一層的亮脊（只有部分段落）
        if (rnd() < 0.6) {
          ctx.strokeStyle = `rgba(255,206,112,${0.2 + rnd() * 0.16})`;
          ctx.lineWidth = 0.8;
          poly(ctx, pts.map(p => [p[0], p[1] + 1]));
          ctx.stroke();
        }
        th = end + 0.03 + rnd() * 0.1;
      }
    }

    // 塔緣下方的陰影
    ctx.strokeStyle = 'rgba(95,40,8,0.38)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(CX, TOP.cy + 3.5, TOP.rx - 1, TOP.ry - 1, 0, 0.03, Math.PI - 0.03);
    ctx.stroke();

    // 左側亮面
    const hl = ctx.createLinearGradient(22, 0, 92, 0);
    hl.addColorStop(0, 'rgba(255,238,190,0)');
    hl.addColorStop(0.45, 'rgba(255,238,190,0.3)');
    hl.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(20, TOP.cy, 72, 90);
    ctx.restore();
  }

  /* ---------- 塔緣頂面 ---------- */
  function drawRim(ctx) {
    topPath(ctx, TOP, nTop, true);
    const g = ctx.createRadialGradient(60, 50, 6, 100, 92, 108);
    g.addColorStop(0, '#F7D27E');
    g.addColorStop(0.45, '#E8A447');
    g.addColorStop(0.8, '#C4772A');
    g.addColorStop(1, '#9A5016');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    topPath(ctx, TOP, nTop, true);
    ctx.clip();
    // 塔緣上的一圈圈酥層
    const rnd = K.rng(77);
    for (let k = 0; k < 5; k++) {
      const s = (k + 0.5) / 5;
      const e = lerpE(TOP, RIM_IN, s);
      let th = rnd() * TAU;
      const stop = th + TAU;
      while (th < stop) {
        const len = 0.3 + rnd() * 0.7;
        const end = Math.min(stop, th + len);
        const dark = (k % 2 === 0);
        ctx.strokeStyle = dark ? 'rgba(115,52,12,0.45)' : 'rgba(255,230,160,0.6)';
        ctx.lineWidth = dark ? 1.2 : 1;
        const pts = [];
        for (let a = th; a <= end + 1e-6; a += 0.04) pts.push(ep(e, a, nTop(a) * (1 - s) * 0.8));
        poly(ctx, pts);
        ctx.stroke();
        th = end + 0.05 + rnd() * 0.25;
      }
    }
    // 烤得較深的酥皮尖端
    for (let i = 0; i < 56; i++) {
      const th = rnd() * TAU;
      const s = 0.02 + rnd() * 0.45;
      const e = lerpE(TOP, RIM_IN, s);
      const p = ep(e, th, nTop(th) * (1 - s));
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(Math.atan2(Math.cos(th) * e.ry, -Math.sin(th) * e.rx));
      ctx.fillStyle = `rgba(${85 + rnd() * 30 | 0},${34 + rnd() * 18 | 0},8,${0.35 + rnd() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5 + rnd() * 4.5, 0.9 + rnd() * 1.1, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // 外緣深色酥脆邊
    ctx.strokeStyle = 'rgba(110,46,10,0.5)';
    ctx.lineWidth = 2.6;
    topPath(ctx, TOP, nTop, true);
    ctx.stroke();
    // 左上高光
    ctx.strokeStyle = 'rgba(255,246,215,0.6)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(CX, TOP.cy + 0.5, TOP.rx - 6.5, TOP.ry - 4.5, 0, Math.PI * 1.06, Math.PI * 1.42);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 蛋奶餡 ---------- */
  function drawCustard(ctx) {
    // 塔緣內壁（後方看得到一點）
    ctx.beginPath();
    ctx.ellipse(CX, RIM_IN.cy, RIM_IN.rx, RIM_IN.ry, 0, 0, TAU);
    const w = ctx.createLinearGradient(0, RIM_IN.cy - RIM_IN.ry, 0, RIM_IN.cy + RIM_IN.ry);
    w.addColorStop(0, '#8C4A16');
    w.addColorStop(0.2, '#B06A26');
    w.addColorStop(1, '#C98232');
    ctx.fillStyle = w;
    ctx.fill();

    // 餡底色：中間淺、邊緣偏橙，做出微微隆起
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy, CUS.rx, CUS.ry, 0, 0, TAU);
    const g = ctx.createRadialGradient(86, 76, 4, 100, 90, 72);
    g.addColorStop(0, '#FFEB8A');
    g.addColorStop(0.35, '#FFD84E');
    g.addColorStop(0.75, '#F8C232');
    g.addColorStop(1, '#E9A42A');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy, CUS.rx, CUS.ry, 0, 0, TAU);
    ctx.clip();

    // 柔和光澤（畫在焦斑下面，小圖才不會變灰）
    ctx.save();
    ctx.translate(72, 73);
    ctx.scale(1, 0.5);
    const s = ctx.createRadialGradient(0, 0, 1, 0, 0, 32);
    s.addColorStop(0, 'rgba(255,255,240,0.6)');
    s.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fill();
    ctx.restore();

    // 小氣泡（大圖才看得到）
    const rb = K.rng(303);
    for (let i = 0; i < 46; i++) {
      const a = rb() * TAU, r = Math.sqrt(rb()) * 0.93;
      const x = CX + Math.cos(a) * r * CUS.rx, y = CUS.cy + Math.sin(a) * r * CUS.ry;
      ctx.fillStyle = 'rgba(255,250,220,0.32)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.8 + rb() * 0.9, 0.5 + rb() * 0.5, 0, 0, TAU); ctx.fill();
    }

    drawSpots(ctx);
    // 後緣內陰影（塔緣擋光）
    ctx.strokeStyle = 'rgba(150,72,12,0.32)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy + 1.8, CUS.rx, CUS.ry, 0, Math.PI * 0.92, Math.PI * 2.08);
    ctx.stroke();
    // 隆起的右下側稍暗（光從左上來）
    const dm = ctx.createLinearGradient(70, 62, 150, 122);
    dm.addColorStop(0, 'rgba(200,110,20,0)');
    dm.addColorStop(0.55, 'rgba(200,110,20,0)');
    dm.addColorStop(1, 'rgba(196,100,16,0.28)');
    ctx.fillStyle = dm;
    ctx.fillRect(CX - CUS.rx, CUS.cy - CUS.ry, CUS.rx * 2, CUS.ry * 2);
    // 前緣柔和暗部（往下彎）
    ctx.strokeStyle = 'rgba(190,100,20,0.25)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy - 2.5, CUS.rx, CUS.ry, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();

    // 光澤：邊緣的鏡面反光
    ctx.strokeStyle = 'rgba(255,255,240,0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy, CUS.rx - 7, CUS.ry - 6, 0, Math.PI * 1.13, Math.PI * 1.34);
    ctx.stroke();
    ctx.restore();

    // 餡與塔緣交界的細縫
    ctx.strokeStyle = 'rgba(125,58,12,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(CX, CUS.cy, CUS.rx, CUS.ry, 0, 0, TAU);
    ctx.stroke();
  }

  /* ---------- 焦糖烤斑（豹紋） ---------- */
  function drawSpots(ctx) {
    const ox = CX + 2, oy = CUS.cy - 4; // 隆起的頂點略偏
    // 中央一大片烤得較熟的琥珀色
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(1, 0.6);
    const c = ctx.createRadialGradient(0, 0, 2, 0, 0, 58);
    c.addColorStop(0, 'rgba(210,108,22,0.55)');
    c.addColorStop(0.55, 'rgba(226,138,38,0.3)');
    c.addColorStop(1, 'rgba(240,170,60,0)');
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fill();
    ctx.restore();

    const rnd = K.rng(2024);
    const P = (u, v, r) => ({ x: ox + u * CUS.rx, y: oy + 4 * (u * u + v * v) + v * CUS.ry, r, rr: Math.hypot(u, v) });
    // 大塊焦斑：手動擺位，中間聚成一片豹紋（小尺寸也看得到）
    const big = [
      P(-0.06, -0.06, 11), P(0.22, 0.1, 9.5), P(-0.3, 0.14, 9), P(0.06, -0.42, 8.5),
      P(0.38, -0.24, 8), P(-0.3, -0.36, 7.5), P(0.0, 0.42, 7.5), P(-0.54, -0.06, 6),
      P(0.52, 0.26, 6), P(0.3, 0.52, 4.8), P(-0.36, 0.5, 5), P(0.6, -0.08, 5),
    ];
    // 中小斑：越外圈越稀、越小
    const mid = [];
    for (let i = 0; i < 16; i++) {
      const a = rnd() * TAU, r = 0.35 + Math.pow(rnd(), 0.9) * 0.48;
      mid.push(P(Math.cos(a) * r, Math.sin(a) * r, (4.6 - r * 3) * (0.7 + rnd() * 0.5)));
    }
    const tiny = [];
    for (let i = 0; i < 30; i++) {
      const a = rnd() * TAU, r = 0.12 + Math.pow(rnd(), 0.8) * 0.78;
      tiny.push(P(Math.cos(a) * r, Math.sin(a) * r, 0.9 + rnd() * 1.2));
    }
    const all = big.concat(mid);
    all.concat(tiny).forEach((s, i) => {
      const r2 = K.rng(7000 + i);
      s.sx = 1 + r2() * 0.5; s.rot = r2() * Math.PI; s.sy = 0.6 + 0.1 * (1 - Math.min(1, s.rr));
      s.seed = 9000 + i; s.d = 1 - 0.3 * Math.min(1, s.rr);
    });

    // 1. 琥珀色暈（柔邊）
    for (const s of all) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(1, s.sy);
      const R = s.r * 1.8;
      const g = ctx.createRadialGradient(0, 0, s.r * 0.4, 0, 0, R);
      g.addColorStop(0, `rgba(188,88,20,${0.5 * s.d})`);
      g.addColorStop(1, 'rgba(222,132,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // 2. 栗褐色的柔和外緣
    // 用陰影模糊做出柔邊（shadowBlur 以裝置像素計，要乘上縮放）
    const m = ctx.getTransform ? ctx.getTransform() : { a: 1, b: 0 };
    const sc = Math.hypot(m.a, m.b) || 1;
    ctx.save();
    ctx.shadowColor = 'rgba(160,70,16,0.55)';
    ctx.shadowBlur = 3.2 * sc;
    for (const s of all) {
      ctx.fillStyle = `rgba(150,64,16,${0.45 * s.d})`;
      blob(ctx, s.x, s.y, s.r * 1.14, s.sx, s.sy, s.rot, s.seed, 12, 0.8);
      ctx.fill();
    }
    ctx.restore();
    // 3. 深褐斑塊本體
    for (const s of all) {
      ctx.fillStyle = `rgba(88,36,10,${0.9 * s.d})`;
      blob(ctx, s.x, s.y, s.r, s.sx, s.sy, s.rot, s.seed, 12, 0.8);
      ctx.fill();
    }
    // 4. 斑塊裡更黑的焦心（不完全同心）＋稍亮的褐色斑駁
    all.forEach((s, i) => {
      if (s.r < 3.2) return;
      const r3 = K.rng(30000 + i);
      const a = r3() * TAU, d = r3() * 0.18 * s.r;
      const cx = s.x + Math.cos(a) * d, cy = s.y + Math.sin(a) * d * s.sy;
      ctx.fillStyle = 'rgba(48,19,6,0.72)';
      blob(ctx, cx, cy, s.r * 0.66, s.sx * (0.85 + r3() * 0.3), s.sy, s.rot + (r3() - 0.5) * 0.8, 40000 + i, 11, 0.75);
      ctx.fill();
      ctx.fillStyle = 'rgba(26,10,3,0.55)';
      blob(ctx, cx + s.r * 0.06, cy + s.r * 0.04, s.r * 0.38, s.sx, s.sy, s.rot + r3(), 45000 + i, 9, 0.8);
      ctx.fill();
      if (s.r > 6) {
        const a2 = r3() * TAU, d2 = (0.45 + r3() * 0.25) * s.r;
        ctx.fillStyle = 'rgba(158,72,20,0.45)';
        blob(ctx, s.x + Math.cos(a2) * d2 * 0.8, s.y + Math.sin(a2) * d2 * s.sy * 0.8, s.r * 0.2, 1.4, s.sy, r3() * Math.PI, 50000 + i, 8, 0.6);
        ctx.fill();
      }
    });
    // 5. 細小焦點
    for (const s of tiny) {
      ctx.fillStyle = `rgba(112,46,10,${0.85 * s.d})`;
      blob(ctx, s.x, s.y, s.r, s.sx, s.sy, s.rot, s.seed, 7, 0.6);
      ctx.fill();
    }
  }

  function draw(ctx) {
    drawWall(ctx);
    drawRim(ctx);
    drawCustard(ctx);
    // 外輪廓細線
    ctx.strokeStyle = 'rgba(105,46,10,0.55)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    silhouette(ctx);
    ctx.stroke();
  }

  window.DESSERTS['eggtart'] = { draw };
})();
