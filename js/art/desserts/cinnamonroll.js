/* 肉桂捲（Cinnamon roll）
 * 斜上 45 度的一顆肉桂捲：麵團一圈圈捲起，頂面看得到螺旋，圈與圈之間夾著深色肉桂糖，
 * 中間微微隆起；外圈側面烤成金褐，捲尾收在右後方。上面淋了幾道白色糖霜。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CYT = 94, KY = 0.58, R = 77, HS = 27, DOME = 15;
  const TURNS = 3.6, R0 = 5;
  const B = (R - R0) / TURNS;                     // 每圈往外擴的距離（麵團寬）
  const PH0 = -0.6;                               // 捲尾的位置（右後）

  // 頂面上的點（r 半徑、φ 角度）：中間隆起
  const zt = r => DOME * (1 - Math.pow(Math.min(1, r / R), 2));
  const TP = (r, phi) => [CX + Math.cos(phi) * r, CYT + Math.sin(phi) * r * KY - zt(r)];
  // 側面
  const bul = z => 3.2 * Math.sin(Math.PI * Math.max(0, Math.min(1, z / HS)));   // 側面微微鼓起
  const SP = (phi, z, rr) => { const r = (rr || R) + bul(z); return [CX + Math.cos(phi) * r, CYT + Math.sin(phi) * r * KY + HS - z]; };

  const spiralR = phi => R0 + B * (phi - PH0) / TAU;   // φ 從 PH0 開始

  function topPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 140; i++) { const th = TAU * i / 140; const p = TP(edgeR(th), th); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }
  // 外圈的半徑：在捲尾處有一個小台階
  function edgeR(th) {
    let u = ((th - PH0) % TAU + TAU) % TAU / TAU;   // 0～1，從捲尾繞一圈
    return R - B * 0.22 * u;                          // 越繞越內縮一點，回到捲尾時跳回去
  }
  function silhouette(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const th = Math.PI + Math.PI * i / 80; const p = TP(edgeR(th), th); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let k = 0; k <= 10; k++) { const p = SP(0, HS * (1 - k / 10), edgeR(0)); ctx.lineTo(p[0], p[1]); }
    for (let i = 0; i <= 80; i++) { const th = Math.PI * i / 80; const q = SP(th, 0, edgeR(th) + 1.5); ctx.lineTo(q[0], q[1]); }
    for (let k = 0; k <= 10; k++) { const p = SP(Math.PI, HS * k / 10, edgeR(Math.PI)); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* ---------- 側面 ---------- */
  function drawSide(ctx) {
    silhouette(ctx);
    const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    g.addColorStop(0, '#E7A859');
    g.addColorStop(0.35, '#D48D3C');
    g.addColorStop(0.75, '#B56C26');
    g.addColorStop(1, '#8E4D18');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    silhouette(ctx); ctx.clip();
    // 側面上的層次：外圈麵團底下透出的螺旋層（淡淡的橫向細線）
    for (let k = 1; k <= 2; k++) {
      ctx.strokeStyle = 'rgba(120,55,15,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const th = Math.PI * i / 60; const p = SP(th, HS * (k / 3) + Math.sin(th * 3 + k) * 1.2); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    // 頂緣圓角亮帶、底部深
    const gb = ctx.createLinearGradient(0, CYT + R * KY + 4, 0, CYT + R * KY + HS + 2);
    gb.addColorStop(0, 'rgba(255,220,160,0.25)');
    gb.addColorStop(0.5, 'rgba(255,220,160,0)');
    gb.addColorStop(1, 'rgba(100,45,10,0.45)');
    ctx.fillStyle = gb; ctx.fillRect(0, 0, 200, 200);
    const rnd = K.rng(4);
    for (let i = 0; i < 90; i++) {
      const th = rnd() * Math.PI, z = rnd() * HS;
      const p = SP(th, z);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,60,15,0.3)' : 'rgba(255,220,160,0.35)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.7 + rnd(), 0.5 + rnd() * 0.5, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 頂面螺旋 ---------- */
  function spiralPts(off, step) {
    const pts = [];
    const end = PH0 + TURNS * TAU;
    for (let phi = PH0; phi <= end; phi += step) {
      const r = spiralR(phi) + off;
      if (r > R - 0.5) break;
      pts.push(TP(Math.max(0, r), phi));
    }
    return pts;
  }
  function stroke(ctx, pts, col, w, dx, dy) {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + (dx || 0), p[1] + (dy || 0)) : ctx.moveTo(p[0] + (dx || 0), p[1] + (dy || 0))); ctx.stroke();
  }
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(CX - 20, CYT - DOME - 12, 4, CX, CYT - 4, R * 1.05);
    g.addColorStop(0, '#F3C47A');
    g.addColorStop(0.55, '#E2A453');
    g.addColorStop(1, '#C27C30');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 每一圈麵團的圓鼓：沿麵團中線的亮帶
    const mid = spiralPts(-B * 0.5, 0.05);
    stroke(ctx, mid, 'rgba(255,232,185,0.45)', B * 0.5, -1, -1.6);
    stroke(ctx, mid, 'rgba(255,245,215,0.35)', B * 0.18, -1.6, -2.4);
    // 肉桂糖的溝：寬的柔和陰影＋深色溝＋顆粒
    const groove = spiralPts(0, 0.04);
    stroke(ctx, groove, 'rgba(110,45,12,0.3)', 10, 0.8, 1.4);
    stroke(ctx, groove, '#8A3F17', 5);
    stroke(ctx, groove, 'rgba(70,22,6,0.9)', 2.2, 0.5, 0.8);
    // 溝的上緣亮邊（麵團邊緣受光）
    stroke(ctx, spiralPts(2.8, 0.05), 'rgba(255,228,175,0.65)', 1.2, -0.4, -0.8);
    // 肉桂糖顆粒
    const rnd = K.rng(1999);
    for (let i = 0; i < groove.length; i += 2) {
      const p = groove[i];
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(160,80,30,0.8)' : 'rgba(60,20,5,0.7)';
      ctx.fillRect(p[0] + (rnd() - 0.5) * 3, p[1] + (rnd() - 0.5) * 2, 0.9, 0.9);
    }
    // 右下陰影
    const gd = ctx.createLinearGradient(CX - R, CYT - R * KY, CX + R, CYT + R * KY);
    gd.addColorStop(0.5, 'rgba(100,45,10,0)');
    gd.addColorStop(1, 'rgba(100,45,10,0.25)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    // 捲尾的小台階線
    const a = TP(edgeR(PH0 + 0.001), PH0), b = TP(R - B * 0.9, PH0);
    ctx.strokeStyle = 'rgba(110,50,15,0.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }

  /* ---------- 白色糖霜：隨手來回淋的幾道細線 ---------- */
  function zigzag(seed, rot, gap0, gap1, span) {
    const rnd = K.rng(seed);
    const pts = [];
    let v = -span;
    for (let k = 0; v < span; k++) {
      const left = [-72 - rnd() * 8, v + (rnd() - 0.5) * 6];
      v += gap0 + rnd() * gap1;
      const right = [72 + rnd() * 8, v + (rnd() - 0.5) * 6 - 4];
      v += gap0 * 0.6 + rnd() * gap1 * 0.6;
      if (k % 2) pts.push(right, left); else pts.push(left, right);
    }
    const co = Math.cos(rot), si = Math.sin(rot);
    const proj = (u, w) => {
      const x = u * co - w * si, y = u * si + w * co;
      const r = Math.hypot(x, y), phi = Math.atan2(y, x);
      return r <= R ? TP(r, phi) : SP(phi, HS - (r - R) * 0.9);   // 超出外緣就往側面垂下
    };
    const path = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const [u0, w0] = pts[k], [u1, w1] = pts[k + 1];
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        const u = u0 + (u1 - u0) * t, w = w0 + (w1 - w0) * t + Math.sin(t * Math.PI) * 4 + Math.sin(t * 9 + k) * 1.2;
        if (Math.hypot(u, w) > R + 7) continue;
        path.push(proj(u, w));
      }
    }
    return path;
  }
  function drawIcing(ctx) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save();
    silhouette(ctx);
    ctx.clip();
    [[zigzag(1004, -0.55, 11, 8, 58), 3.4], [zigzag(2024, 0.75, 16, 10, 48), 2.6]].forEach(([path, w]) => {
      stroke(ctx, path, 'rgba(110,50,15,0.3)', w + 0.6, 0.9, 1.6);   // 影子
      stroke(ctx, path, '#EFE6DC', w);
      stroke(ctx, path, '#FFFFFF', w * 0.68, -0.4, -0.5);
      stroke(ctx, path, 'rgba(255,255,255,0.95)', 0.8, -0.7, -1);
    });
    ctx.restore();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(110,50,12,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
    drawIcing(ctx);
  }

  window.DESSERTS['cinnamonroll'] = {
    draw,
    crumbs: ['#E2A453', '#7B3A16', '#FFFFFF', '#F3C47A', '#B56C26'],
    crunchy: 0.3,
  };
})();
