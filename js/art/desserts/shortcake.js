/* 日式草莓鮮奶油蛋糕切片（ショートケーキ） */
(function () {
  'use strict';
  const K = window.DessertKit;
  const D2R = Math.PI / 180;

  /* ---------- 幾何：扇形切片，尖端在左後，切面朝左前方 ---------- */
  const S = 160, X0 = 18, Y0 = 80, KY = 62, H = 62;   // 半徑、尖端位置、俯視壓扁、高度
  const T0 = -30 * D2R, T1 = 25 * D2R;                 // 扇形兩邊的角度
  const tp = (th, z) => [X0 + Math.cos(th) * S, Y0 - Math.sin(th) * KY + (z || 0)];
  const P1 = tp(T0), P2 = tp(T1);
  const L = P1[0] - X0;                 // 切面水平寬
  const SL = (P1[1] - Y0) / L;          // 切面斜率

  // 切面分層（v：由上往下）
  const V_TOPCREAM = 7, V_SP1 = 25, V_MID = 44, V_SP2 = 61;

  const CREAM = '#FFFBF6', CREAM_SH = '#EFE1D9', CREAM_DK = '#D9C2BA';
  const LINE = 'rgba(170,108,104,0.85)';
  const SPONGE = '#F7D681', SPONGE_DK = '#E6B65A';

  function silhouette(ctx) {
    ctx.beginPath();
    ctx.moveTo(X0, Y0);
    ctx.lineTo(P2[0], P2[1]);
    ctx.ellipse(X0, Y0, S, KY, 0, -T1, 0, false);
    ctx.lineTo(X0 + S, Y0 + H);
    ctx.ellipse(X0, Y0 + H, S, KY, 0, 0, -T0, false);
    ctx.lineTo(X0, Y0 + H);
    ctx.closePath();
  }

  function topFace(ctx) {
    ctx.beginPath();
    ctx.moveTo(X0, Y0);
    ctx.lineTo(P1[0], P1[1]);
    ctx.ellipse(X0, Y0, S, KY, 0, -T0, -T1, true);
    ctx.closePath();
  }

  function sideBand(ctx) {
    ctx.beginPath();
    ctx.ellipse(X0, Y0, S, KY, 0, -T0, 0, true);
    ctx.lineTo(X0 + S, Y0 + H);
    ctx.ellipse(X0, Y0 + H, S, KY, 0, 0, -T0, false);
    ctx.closePath();
  }

  /* ---------- 外側弧面（光滑鮮奶油，偏暗面） ---------- */
  function drawSide(ctx) {
    sideBand(ctx);
    const g = ctx.createLinearGradient(P1[0], 0, X0 + S, 0);
    g.addColorStop(0, '#F8EEE8');
    g.addColorStop(0.55, CREAM_SH);
    g.addColorStop(1, CREAM_DK);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    sideBand(ctx); ctx.clip();
    // 底部陰影
    const gb = ctx.createLinearGradient(0, Y0 + H - 10, 0, Y0 + H + KY * 0.5);
    gb.addColorStop(0, 'rgba(180,130,120,0)');
    gb.addColorStop(1, 'rgba(180,130,120,0.35)');
    ctx.fillStyle = gb;
    ctx.fillRect(P1[0] - 2, Y0, 40, H + 60);
    // 抹刀紋
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.8;
    for (const dz of [14, 30, 47]) {
      ctx.beginPath();
      ctx.ellipse(X0, Y0 + dz, S, KY, 0, -T0 + 0.02, 0.05, true);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 切半草莓切面（橫躺的縱切面：寬肩在一端、尖端在另一端） ---------- */
  function berrySection(ctx, cx, cy, len, ht, tipRight, rot, rnd) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    if (!tipRight) ctx.scale(-1, 1);
    // 本地座標：x 從 -len/2（蒂端）到 +len/2（尖端）
    const a = len / 2, b = ht / 2;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-a, 0);
      ctx.bezierCurveTo(-a, -b * 0.95, -a * 0.35, -b * 1.05, a * 0.15, -b * 0.82);
      ctx.bezierCurveTo(a * 0.6, -b * 0.62, a, -b * 0.18, a, 0);
      ctx.bezierCurveTo(a, b * 0.18, a * 0.6, b * 0.62, a * 0.15, b * 0.82);
      ctx.bezierCurveTo(-a * 0.35, b * 1.05, -a, b * 0.95, -a, 0);
      ctx.closePath();
    };
    path();
    const g = ctx.createRadialGradient(-a * 0.2, 0, 0, -a * 0.1, 0, a * 1.0);
    g.addColorStop(0, '#FFE9E6');
    g.addColorStop(0.28, '#FAC0C2');
    g.addColorStop(0.55, '#EF6F81');
    g.addColorStop(0.78, '#DB2D45');
    g.addColorStop(1, '#C5152D');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path(); ctx.clip();
    // 從中央芯往外放射的白色維管紋
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const t = (i + 0.5) / 14;
      const sx = -a * 0.55 + t * a * 1.15;              // 芯上的起點
      const side = i % 2 ? 1 : -1;
      const ex = sx + (rnd() - 0.3) * a * 0.35, ey = side * b * (0.95 - Math.abs(t - 0.4) * 0.5);
      ctx.strokeStyle = 'rgba(255,240,238,0.7)'; ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.quadraticCurveTo((sx + ex) / 2, ey * 0.4, ex, ey); ctx.stroke();
    }
    // 中央白芯（沿長軸）
    const gc = ctx.createLinearGradient(-a, 0, a, 0);
    gc.addColorStop(0, 'rgba(255,252,248,0.95)');
    gc.addColorStop(1, 'rgba(255,240,236,0.3)');
    ctx.fillStyle = gc;
    ctx.beginPath(); ctx.ellipse(-a * 0.1, 0, a * 0.62, b * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    path();
    ctx.strokeStyle = '#B5102A'; ctx.lineWidth = 2.0;
    ctx.stroke();
    // 邊緣的小籽
    ctx.fillStyle = '#F6DA8C';
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7 * Math.PI * 2;
      const x = Math.cos(t) * a * 0.9, y = Math.sin(t) * b * (0.86 - 0.3 * Math.max(0, Math.cos(t)));
      ctx.beginPath(); ctx.ellipse(x, y, 0.75, 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 切面（分層） ---------- */
  function drawCut(ctx) {
    const rnd = K.rng(42);
    ctx.save();
    ctx.transform(1, SL, 0, 1, X0, Y0);   // 之後用切面本地座標 (u, v)
    ctx.beginPath(); ctx.rect(0, 0, L, H); ctx.clip();

    // 底色：奶油
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, L, H);

    const wave = (u, ph, amp) => Math.sin(u * 0.21 + ph) * amp + Math.sin(u * 0.53 + ph * 2) * amp * 0.5;

    function spongeLayer(v0, v1, ph) {
      ctx.beginPath();
      ctx.moveTo(0, v0 + wave(0, ph, 0.7));
      for (let u = 0; u <= L; u += 3) ctx.lineTo(u, v0 + wave(u, ph, 0.7));
      for (let u = L; u >= 0; u -= 3) ctx.lineTo(u, v1 + wave(u, ph + 1.7, 0.6));
      ctx.closePath();
      const g = ctx.createLinearGradient(0, v0, 0, v1);
      g.addColorStop(0, '#FBE29A');
      g.addColorStop(0.5, SPONGE);
      g.addColorStop(1, SPONGE_DK);
      ctx.fillStyle = g;
      ctx.fill();
      // 細緻氣孔
      ctx.save(); ctx.clip();
      for (let i = 0; i < 140; i++) {
        const u = rnd() * L, v = v0 + rnd() * (v1 - v0), r = 0.4 + rnd() * 0.9;
        ctx.fillStyle = 'rgba(205,150,60,0.38)';
        ctx.beginPath(); ctx.ellipse(u, v, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,246,210,0.55)';
        ctx.beginPath(); ctx.ellipse(u - 0.5, v - 0.6, r * 0.8, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    spongeLayer(V_TOPCREAM, V_SP1, 0.3);
    spongeLayer(V_MID, V_SP2, 2.1);

    // 底部烤色
    ctx.fillStyle = '#D29A4E';
    ctx.fillRect(0, V_SP2 - 0.2, L, H - V_SP2 + 1);
    ctx.fillStyle = 'rgba(160,100,50,0.5)';
    ctx.fillRect(0, H - 0.8, L, 1);

    // 中層鮮奶油的淡陰影
    const gm = ctx.createLinearGradient(0, V_SP1, 0, V_MID);
    gm.addColorStop(0, 'rgba(220,190,175,0.35)');
    gm.addColorStop(0.3, 'rgba(255,255,255,0)');
    gm.addColorStop(1, 'rgba(220,190,175,0.25)');
    ctx.fillStyle = gm; ctx.fillRect(0, V_SP1, L, V_MID - V_SP1);

    // 夾層草莓
    const xs = [14, 40.5, 67, 93.5, 119];
    const rots = [0.06, -0.08, 0.05, -0.05, 0.08];
    xs.forEach((u, i) => {
      berrySection(ctx, u, (V_SP1 + V_MID) / 2 + 0.4, 20.5, 15, i % 2 === 0, rots[i], rnd);
    });

    // 外側奶油塗層的切面（右端白條）
    ctx.fillStyle = CREAM;
    ctx.fillRect(L - 5, 0, 6, H - 1.5);
    ctx.fillStyle = 'rgba(200,140,70,0.55)';
    ctx.fillRect(L - 5.8, V_TOPCREAM, 0.9, V_SP2 - V_TOPCREAM);

    // 頂層奶油下緣淡陰影
    const gt = ctx.createLinearGradient(0, 0, 0, V_TOPCREAM + 2);
    gt.addColorStop(0, 'rgba(255,255,255,0)');
    gt.addColorStop(0.75, 'rgba(225,200,188,0.0)');
    gt.addColorStop(1, 'rgba(200,160,130,0.35)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, L, V_TOPCREAM + 2);

    // 左側（中心）略暗
    const gl = ctx.createLinearGradient(0, 0, L, 0);
    gl.addColorStop(0, 'rgba(255,255,255,0.18)');
    gl.addColorStop(0.6, 'rgba(255,255,255,0)');
    gl.addColorStop(1, 'rgba(150,100,80,0.10)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, L, H);
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    topFace(ctx);
    const g = ctx.createLinearGradient(X0 + 30, Y0 - 40, X0 + S, Y0 + 40);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.5, '#FCF6F1');
    g.addColorStop(1, '#F0E2DA');
    ctx.fillStyle = g;
    ctx.fill();
    // 前緣圓角亮邊
    ctx.save();
    topFace(ctx); ctx.clip();
    // 奶油表面的柔和光澤
    const gh = ctx.createRadialGradient(X0 + 62, Y0 - 6, 1, X0 + 62, Y0 - 6, 40);
    gh.addColorStop(0, 'rgba(255,255,255,0.9)');
    gh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gh;
    ctx.beginPath(); ctx.ellipse(X0 + 62, Y0 - 6, 44, 14, -0.12, 0, Math.PI * 2); ctx.fill();
    // 靠外弧的圓角：外緣一圈淡陰影
    ctx.strokeStyle = 'rgba(205,170,160,0.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(X0, Y0, S, KY, 0, -T0, -T1, true); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(X0 + 3, Y0 + 2); ctx.lineTo(P1[0] - 3, P1[1] - 1.5); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 擠花（星形花嘴：圓丘＋螺旋稜線） ---------- */
  function drawRosette(ctx, cx, cy) {
    const R = 23, SQ = 0.5, LIFT = 11, NB = 10;
    // 接觸影子
    ctx.save();
    topFace(ctx); ctx.clip();
    const gs = ctx.createRadialGradient(cx + 4, cy + 3, 6, cx + 4, cy + 3, 27);
    gs.addColorStop(0, 'rgba(150,100,95,0.28)');
    gs.addColorStop(1, 'rgba(150,100,95,0)');
    ctx.fillStyle = gs;
    ctx.beginPath(); ctx.ellipse(cx + 4, cy + 3, 28, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 螺旋點：r 由外到內、角度遞增、越內越高
    const pt = (r, phi) => [cx + Math.cos(phi) * r, cy + Math.sin(phi) * r * SQ - LIFT * (1 - r / R) * 1.0];
    const scR = (phi) => R * (0.93 + 0.07 * Math.cos(NB * phi));

    // 圓丘外形（扇貝邊）
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const phi = (i / 120) * Math.PI * 2;
      const [x, y] = pt(scR(phi), phi);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx - 9, cy - 10, 2, cx, cy - 2, R * 1.05);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.55, '#FBF4EF');
    g.addColorStop(1, '#E4D0C8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(175,125,118,0.7)'; ctx.lineWidth = 1.1;
    ctx.stroke();

    // 稜線：陰影溝＋旁邊的亮線
    ctx.lineCap = 'round';
    for (let k = 0; k < NB; k++) {
      const p0 = (k + 0.5) / NB * Math.PI * 2;      // 兩個扇貝之間的溝
      const line = (off, col, lw) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath();
        for (let j = 0; j <= 14; j++) {
          const t = j / 14, r = R * (0.92 - 0.7 * t), phi = p0 + off + t * 1.1;
          const [x, y] = pt(r, phi);
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      };
      const front = Math.sin(p0) > -0.2;
      line(0, front ? 'rgba(190,145,135,0.75)' : 'rgba(190,145,135,0.5)', 1.0);
      line(-0.17, 'rgba(255,255,255,0.95)', 1.2);
    }
  }

  /* ---------- 整顆草莓 ---------- */
  function drawBerry(ctx, bx, by) {
    const w = 37, h = 45;
    const rnd = K.rng(7);
    const hw = (t) => 0.5 * w * Math.pow(1 - t, 0.9) * (1 + 1.1 * t) / 1.06;
    const path = () => {
      ctx.beginPath();
      const N = 30;
      for (let i = 0; i <= N; i++) {
        const t = i / N; const x = hw(t), y = -t * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let i = N; i >= 0; i--) {
        const t = i / N; ctx.lineTo(-hw(t), -t * h);
      }
      ctx.ellipse(0, 0, hw(0), h * 0.1, 0, Math.PI, 0, true);
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(9 * D2R);

    // 後方的蒂
    leaves(ctx, w, true);

    path();
    const g = ctx.createRadialGradient(-w * 0.18, -h * 0.62, 1, -w * 0.05, -h * 0.4, h * 0.75);
    g.addColorStop(0, '#FF7A78');
    g.addColorStop(0.3, '#EC2D40');
    g.addColorStop(0.7, '#C8142F');
    g.addColorStop(1, '#8C0C22');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    path(); ctx.clip();
    // 草莓籽（圓柱面分布，邊緣較密）
    for (let r = 0; r < 8; r++) {
      const t = 0.08 + r * 0.105;
      const n = 7;
      for (let j = 0; j < n; j++) {
        const phi = -Math.PI / 2 + ((j + (r % 2 ? 0.5 : 0) + 0.5) / n) * Math.PI;
        const x = Math.sin(phi + (rnd() - 0.5) * 0.12) * hw(t) * 0.95;
        const y = -t * h + Math.cos(phi) * 1.2 + (rnd() - 0.5) * 1.4;
        const sc = 0.45 + 0.55 * Math.cos(phi);
        ctx.fillStyle = 'rgba(110,0,20,0.35)';
        ctx.beginPath(); ctx.ellipse(x, y + 0.3, 1.25 * sc + 0.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F7D97A';
        ctx.beginPath(); ctx.ellipse(x, y, 0.6 * sc + 0.15, 0.95, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 光澤
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.55, w * 0.07, h * 0.2, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.78, 1.6, 2.4, 0.3, 0, Math.PI * 2); ctx.fill();
    // 右下反光
    ctx.strokeStyle = 'rgba(255,170,170,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-w * 0.05, -h * 0.35, w * 0.42, 0.2, 1.1); ctx.stroke();
    ctx.restore();

    path();
    ctx.strokeStyle = 'rgba(120,10,28,0.7)'; ctx.lineWidth = 1.4;
    ctx.stroke();

    // 前方的蒂
    leaves(ctx, w, false);
    ctx.restore();
  }

  function leaves(ctx, w, back) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const isBack = Math.sin(a) < 0;
      if (isBack !== back) continue;
      const len = 11;
      const ex = Math.cos(a) * (w * 0.45 + len), ey = Math.sin(a) * 4.5 + 1;
      const sx = Math.cos(a) * w * 0.3, sy = Math.sin(a) * 2;
      const nx = -(ey - sy), ny = ex - sx, nl = Math.hypot(nx, ny) || 1;
      const k = 2.6 / nl;
      ctx.beginPath();
      ctx.moveTo(sx + nx * k, sy + ny * k);
      ctx.quadraticCurveTo((sx + ex) / 2 + nx * k * 1.3, (sy + ey) / 2 + ny * k * 1.3, ex, ey);
      ctx.quadraticCurveTo((sx + ex) / 2 - nx * k * 1.3, (sy + ey) / 2 - ny * k * 1.3, sx - nx * k, sy - ny * k);
      ctx.closePath();
      const g = ctx.createLinearGradient(sx, sy - 3, ex, ey + 3);
      g.addColorStop(0, back ? '#3E8A33' : '#5DB043');
      g.addColorStop(1, back ? '#2C6A27' : '#3E8E34');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,80,25,0.6)'; ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  function draw(ctx) {
    drawSide(ctx);
    drawCut(ctx);
    drawTop(ctx);

    // 頂面與切面交界的細線
    ctx.strokeStyle = 'rgba(200,150,140,0.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(P1[0], P1[1]); ctx.stroke();
    // 切面與外側面交界
    ctx.beginPath(); ctx.moveTo(P1[0], P1[1]); ctx.lineTo(P1[0], P1[1] + H); ctx.stroke();

    // 外輪廓
    silhouette(ctx);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.stroke();

    const cx = X0 + S * 0.64, cy = Y0 - 4;
    drawRosette(ctx, cx, cy);
    drawBerry(ctx, cx + 1, cy - 9);
  }

  window.DESSERTS['shortcake'] = { draw };
})();
