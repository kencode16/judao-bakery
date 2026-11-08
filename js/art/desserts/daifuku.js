/* 草莓大福（いちご大福）
 * 左後方一顆完整的白色大福（撒著太白粉的霧面麻糬），右前方一顆切半的，
 * 切面朝向我們：外圈白麻糬 → 深色紅豆沙 → 中央整顆草莓的縱切面（紅邊、白芯）。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;
  const SP = 0.5, CP = 0.866;          // 俯視約 30 度：看得到圓頂，也看得清切面

  // 大福的側面輪廓：底部微微下垂外鼓、上面圓頂
  function makeProfile(R, Hd) {
    return z => {
      if (z < 0 || z > Hd) return 0;
      const t = z / Hd;
      let r = R * Math.pow(1 - Math.pow(t, 2.4), 1 / 2.4);
      if (z < 7) r *= 0.93 + 0.07 * Math.sin((z / 7) * Math.PI / 2);   // 底部往內收的圓角
      return r;
    };
  }

  // 水平圓環（後半或整圈）疊出的上緣包絡
  function topEnvelope(cx, by, R, Hd, prof) {
    const pts = [], N = 90;
    for (let i = 0; i <= N; i++) {
      const x = R * Math.cos(Math.PI * (1 - i / N)) * 0.9999;
      let yt = Infinity;
      for (let j = 0; j <= 48; j++) {
        const z = Hd * j / 48, r = prof(z);
        if (r < Math.abs(x)) continue;
        yt = Math.min(yt, by - z * CP - SP * Math.sqrt(r * r - x * x));
      }
      if (yt !== Infinity) pts.push([cx + x, yt]);
    }
    return pts;
  }
  function bottomFront(cx, by, R, prof) {
    // 整顆的：底部那圈的前半弧（取最寬的一層）
    const pts = [], N = 60;
    let best = 0, zb = 0;
    for (let z = 0; z < 14; z += 0.5) if (prof(z) > best) { best = prof(z); zb = z; }
    for (let i = 0; i <= N; i++) {
      const a = Math.PI * i / N;
      pts.push([cx + Math.cos(a) * best, by - zb * CP + Math.sin(a) * best * SP]);
    }
    return pts;
  }

  /* ---------- 麻糬表面 ---------- */
  function mochiSkin(ctx, cx, topY, botY, R, seed) {
    const g = ctx.createRadialGradient(cx - R * 0.35, topY + (botY - topY) * 0.28, 2, cx, topY + (botY - topY) * 0.45, R * 1.15);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.45, '#FBF8F9');
    g.addColorStop(0.8, '#ECE4EB');
    g.addColorStop(1, '#D9CDD8');
    ctx.fillStyle = g;
    ctx.fillRect(cx - R - 4, topY - 4, R * 2 + 8, botY - topY + 8);
    // 太白粉：細細的白點與淡灰點
    const rnd = K.rng(seed);
    for (let i = 0; i < 160; i++) {
      const x = cx + (rnd() - 0.5) * 2 * R, y = topY + rnd() * (botY - topY);
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(255,255,255,0.9)' : 'rgba(180,160,180,0.22)';
      ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd() * 0.8, 0, TAU); ctx.fill();
    }
    // 左上一大片柔亮（霧面，不要太亮的反光點）
    const gh = ctx.createRadialGradient(cx - R * 0.38, topY + 16, 1, cx - R * 0.38, topY + 16, R * 0.55);
    gh.addColorStop(0, 'rgba(255,255,255,0.95)');
    gh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gh;
    ctx.beginPath(); ctx.ellipse(cx - R * 0.38, topY + 16, R * 0.55, R * 0.4, -0.3, 0, TAU); ctx.fill();
  }

  /* ---------- 完整的一顆 ---------- */
  function drawWhole(ctx, cx, by, R, Hd) {
    const prof = makeProfile(R, Hd);
    const top = topEnvelope(cx, by, R, Hd, prof);
    const bot = bottomFront(cx, by, R, prof);
    const path = () => {
      ctx.beginPath();
      top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      for (const p of bot) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
    };
    let ty = Infinity, byy = -Infinity;
    for (const p of top) ty = Math.min(ty, p[1]);
    for (const p of bot) byy = Math.max(byy, p[1]);
    ctx.save();
    path(); ctx.clip();
    mochiSkin(ctx, cx, ty, byy, R, 11);
    // 底部的陰影（麻糬下垂處）
    const gb = ctx.createLinearGradient(0, byy - 22, 0, byy);
    gb.addColorStop(0, 'rgba(150,120,150,0)');
    gb.addColorStop(1, 'rgba(150,120,150,0.35)');
    ctx.fillStyle = gb; ctx.fillRect(cx - R - 4, byy - 24, R * 2 + 8, 26);
    // 頂端隱約透出草莓的淡粉紅
    const gp = ctx.createRadialGradient(cx + 2, ty + 14, 1, cx + 2, ty + 14, 20);
    gp.addColorStop(0, 'rgba(240,150,170,0.28)');
    gp.addColorStop(1, 'rgba(240,150,170,0)');
    ctx.fillStyle = gp; ctx.fillRect(cx - 24, ty, 52, 40);
    ctx.restore();
    path();
    ctx.strokeStyle = 'rgba(140,110,140,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  }

  /* ---------- 草莓縱切面（尖端朝上） ---------- */
  function berryPath(ctx, x0, yb, w, h) {
    // yb：底部，h：高度，w：最寬處的半寬
    ctx.beginPath();
    ctx.moveTo(x0, yb - h);
    ctx.bezierCurveTo(x0 + w * 0.22, yb - h * 0.93, x0 + w * 0.92, yb - h * 0.64, x0 + w, yb - h * 0.33);
    ctx.bezierCurveTo(x0 + w * 1.03, yb - h * 0.06, x0 + w * 0.55, yb + h * 0.03, x0, yb);
    ctx.bezierCurveTo(x0 - w * 0.55, yb + h * 0.03, x0 - w * 1.03, yb - h * 0.06, x0 - w, yb - h * 0.33);
    ctx.bezierCurveTo(x0 - w * 0.92, yb - h * 0.64, x0 - w * 0.22, yb - h * 0.93, x0, yb - h);
    ctx.closePath();
  }
  function drawBerry(ctx, x0, yb, w, h) {
    berryPath(ctx, x0, yb, w, h);
    const g = ctx.createRadialGradient(x0, yb - h * 0.42, 1, x0, yb - h * 0.45, h * 0.62);
    g.addColorStop(0, '#FFE9EA');
    g.addColorStop(0.35, '#FBB6BE');
    g.addColorStop(0.68, '#EE5F75');
    g.addColorStop(0.88, '#DC2440');
    g.addColorStop(1, '#C3122E');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    berryPath(ctx, x0, yb, w, h); ctx.clip();
    // 中央淡色的芯（柔和，不要變成一條白縫）
    const gc = ctx.createRadialGradient(x0, yb - h * 0.4, 1, x0, yb - h * 0.4, h * 0.42);
    gc.addColorStop(0, 'rgba(255,248,246,0.9)');
    gc.addColorStop(0.5, 'rgba(255,225,228,0.45)');
    gc.addColorStop(1, 'rgba(255,225,228,0)');
    ctx.fillStyle = gc;
    ctx.beginPath(); ctx.ellipse(x0, yb - h * 0.4, w * 0.5, h * 0.42, 0, 0, TAU); ctx.fill();
    // 從芯往外放射的白色維管紋
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10 - 0.45) * Math.PI * 1.9;
      const sx = x0 + Math.cos(a) * w * 0.15, sy = yb - h * 0.42 + Math.sin(a) * h * 0.12;
      const ex = x0 + Math.cos(a) * w * 0.82, ey = yb - h * 0.4 + Math.sin(a) * h * 0.5;
      ctx.strokeStyle = 'rgba(255,236,236,0.32)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }
    // 外緣一圈深紅、邊上的籽
    berryPath(ctx, x0, yb, w, h);
    ctx.strokeStyle = 'rgba(180,10,40,0.85)'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#F7DB86';
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9 * Math.PI;
      const x = x0 + Math.cos(t + Math.PI) * w * 0.9 * Math.sin(t * 0.5 + 0.8);
      const y = yb - h * 0.34 - Math.sin(t) * h * 0.38 + Math.cos(t) * 0;
      if (i === 4) continue;
      ctx.beginPath(); ctx.ellipse(x, y, 0.8, 1.1, 0, 0, TAU); ctx.fill();
    }
    // 切面的水光
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x0 - w * 0.42, yb - h * 0.6, 2.2, 6, 0.35, 0, TAU); ctx.fill();
  }

  /* ---------- 切半的一顆 ---------- */
  function drawHalf(ctx, cx, by, R, Hd) {
    const prof = makeProfile(R, Hd);
    const top = topEnvelope(cx, by, R, Hd, prof);
    // 切面輪廓（側面輪廓 x=±r(z)）
    const face = [];
    const N = 50;
    for (let i = 0; i <= N; i++) { const z = Hd * i / N; face.push([cx + prof(z), by - z * CP]); }
    for (let i = N; i >= 0; i--) { const z = Hd * i / N; face.push([cx - prof(z), by - z * CP]); }
    const facePath = (inset) => {
      ctx.beginPath();
      if (!inset) { face.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); return; }
      // 內縮版：把輪廓往中心拉
      const ccx = cx, ccy = by - Hd * CP * 0.45;
      face.forEach((p, i) => {
        const dx = p[0] - ccx, dy = p[1] - ccy, d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, (d - inset) / d);
        const x = ccx + dx * k, y = ccy + dy * k;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
    };
    const silPath = () => {
      ctx.beginPath();
      top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.lineTo(cx + prof(0), by); ctx.lineTo(cx - prof(0), by);
      ctx.closePath();
    };
    let ty = Infinity; for (const p of top) ty = Math.min(ty, p[1]);

    // 後半圓頂（白麻糬）
    ctx.save();
    silPath(); ctx.clip();
    mochiSkin(ctx, cx, ty, by, R, 29);
    ctx.restore();

    // 切面：麻糬（白，微透）
    facePath(0);
    const gm = ctx.createLinearGradient(cx - R, by - Hd, cx + R, by);
    gm.addColorStop(0, '#FFFFFF');
    gm.addColorStop(0.6, '#FBF7F7');
    gm.addColorStop(1, '#EFE6EA');
    ctx.fillStyle = gm; ctx.fill();
    // 紅豆沙：沿著草莓外形包一層（底部厚、尖端薄）
    const faceH = Hd * CP;
    const bw = R * 0.44, bh = faceH - 15, bb = by - 10;      // 草莓：半寬、高、底
    ctx.save();
    facePath(7); ctx.clip();
    berryPath(ctx, cx + 1, bb + 6, bw + 8, bh + 9);
    const ga = ctx.createRadialGradient(cx - 14, bb - bh * 0.6, 4, cx, bb - bh * 0.4, R * 0.8);
    ga.addColorStop(0, '#7E3A45');
    ga.addColorStop(0.6, '#5E2430');
    ga.addColorStop(1, '#46171F');
    ctx.fillStyle = ga; ctx.fill();
    const rnd = K.rng(61);
    for (let i = 0; i < 60; i++) {
      const x = cx + (rnd() - 0.5) * (bw + 9) * 2, y = bb + 6 - rnd() * (bh + 10);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(140,70,80,0.35)' : 'rgba(40,10,15,0.3)';
      ctx.beginPath(); ctx.arc(x, y, 0.6 + rnd() * 0.9, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 草莓
    drawBerry(ctx, cx + 1, bb, bw, bh);
    // 切面邊緣：麻糬斷面的圓角亮邊
    ctx.save();
    facePath(0); ctx.clip();
    facePath(0);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    // 切面與圓頂的交界線
    ctx.beginPath();
    for (let i = 0; i <= N * 2 + 1; i++) {
      const p = face[i];
      if (p[1] > by - 1) continue;
      ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = 'rgba(170,140,165,0.55)'; ctx.lineWidth = 1.1; ctx.stroke();
    // 外輪廓
    silPath();
    ctx.strokeStyle = 'rgba(140,110,140,0.65)'; ctx.lineWidth = 2; ctx.stroke();
  }

  function draw(ctx) {
    drawWhole(ctx, 74, 110, 56, 66);
    drawHalf(ctx, 112, 173, 70, 84);
  }

  window.DESSERTS['daifuku'] = {
    draw,
    crumbs: ['#FFFFFF', '#F4EEF2', '#E0314B', '#5E2430', '#FBB6BE'],
    crunchy: 0.05,
  };
})();
