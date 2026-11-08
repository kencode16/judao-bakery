/* 長崎蛋糕（カステラ）
 * 一片切好的長崎蛋糕，從左前上方看：正面是金黃色切面，上面一層深焦褐的頂皮、底下一層褐色底皮
 * 和一排砂糖粒（ザラメ）；頂面是光滑的深褐色，右側是淺褐色的烤模側皮。光源左上。
 * 和鳳梨酥、鹹餅等黃色長方的分別：大片鮮黃切面＋上下兩道焦褐。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const PSI = 17 * Math.PI / 180;
  const CS = Math.cos(PSI), SN = Math.sin(PSI);
  const SP = 0.56, CP = 0.83;
  const W = 148, DP = 52, HC = 82;           // 寬、厚、高
  const CX = 100, CY = 140;

  function P(x, y, z) {
    return [CX + x * CS - y * SN, CY + (x * SN + y * CS) * SP - z * CP];
  }
  const FTL = P(-W / 2, DP / 2, HC), FTR = P(W / 2, DP / 2, HC);
  const FBL = P(-W / 2, DP / 2, 0), FBR = P(W / 2, DP / 2, 0);
  const BTL = P(-W / 2, -DP / 2, HC), BTR = P(W / 2, -DP / 2, HC), BBR = P(W / 2, -DP / 2, 0);

  const V_TOP = 10, V_BOT = 6;                 // 頂皮、底皮厚

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }

  /* ---------- 正面切面 ---------- */
  function drawFront(ctx) {
    ctx.save();
    ctx.transform(CS, SN * SP, 0, CP, FTL[0], FTL[1]);   // (u, v)：u 往右 0～W，v 往下 0～HC
    ctx.beginPath(); ctx.rect(0, 0, W, HC); ctx.clip();
    // 蛋糕體
    const g = ctx.createLinearGradient(0, 0, 0, HC);
    g.addColorStop(0, '#FFE277');
    g.addColorStop(0.5, '#FBD65A');
    g.addColorStop(1, '#F0BC3E');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HC);
    // 左亮右暗
    const gx = ctx.createLinearGradient(0, 0, W, 0);
    gx.addColorStop(0, 'rgba(255,250,215,0.3)');
    gx.addColorStop(0.5, 'rgba(255,255,255,0)');
    gx.addColorStop(1, 'rgba(170,110,20,0.18)');
    ctx.fillStyle = gx; ctx.fillRect(0, 0, W, HC);
    // 細緻的氣孔
    const rnd = K.rng(37);
    for (let i = 0; i < 380; i++) {
      const u = rnd() * W, v = V_TOP + rnd() * (HC - V_TOP - V_BOT), r = 0.3 + rnd() * 0.55;
      ctx.fillStyle = 'rgba(205,145,30,0.28)';
      ctx.beginPath(); ctx.ellipse(u, v, r * 1.3, r, 0, 0, TAU); ctx.fill();
      if (rnd() < 0.5) {
        ctx.fillStyle = 'rgba(255,248,210,0.6)';
        ctx.beginPath(); ctx.ellipse(u - 0.4, v - 0.5, r * 0.8, r * 0.5, 0, 0, TAU); ctx.fill();
      }
    }
    // 頂皮：深焦褐，下緣略不規則
    const wav = u => Math.sin(u * 0.17) * 0.8 + Math.sin(u * 0.43 + 1) * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0);
    for (let u = W; u >= 0; u -= 3) ctx.lineTo(u, V_TOP + wav(u));
    ctx.closePath();
    const gt = ctx.createLinearGradient(0, 0, 0, V_TOP + 1);
    gt.addColorStop(0, '#4E2108');
    gt.addColorStop(0.55, '#6E330F');
    gt.addColorStop(1, '#94511C');
    ctx.fillStyle = gt; ctx.fill();
    // 頂皮下面一條淡淡的焦糖色過渡
    ctx.strokeStyle = 'rgba(220,140,50,0.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let u = 0; u <= W; u += 3) u ? ctx.lineTo(u, V_TOP + 1.3 + wav(u)) : ctx.moveTo(u, V_TOP + 1.3 + wav(u));
    ctx.stroke();
    // 底皮
    ctx.fillStyle = '#9A5520';
    ctx.fillRect(0, HC - V_BOT, W, V_BOT);
    ctx.fillStyle = 'rgba(70,30,8,0.45)';
    ctx.fillRect(0, HC - 1.6, W, 1.6);
    // 砂糖粒（ザラメ）：底皮上方一排半透明的白色顆粒
    for (let i = 0; i < 46; i++) {
      const u = 2 + rnd() * (W - 4), v = HC - V_BOT - 0.8 - rnd() * 2.6, s = 1.0 + rnd() * 1.3;
      ctx.fillStyle = 'rgba(255,252,240,0.92)';
      ctx.save(); ctx.translate(u, v); ctx.rotate(rnd() * 1.5);
      ctx.fillRect(-s / 2, -s / 2, s, s * 0.8);
      ctx.fillStyle = 'rgba(190,140,60,0.5)';
      ctx.fillRect(-s / 2 + 0.3, s * 0.15, s * 0.8, 0.4);
      ctx.restore();
    }
    // 頂端切邊的亮線
    ctx.restore();
  }

  /* ---------- 右側面（烤模側皮） ---------- */
  function drawSide(ctx) {
    ctx.save();
    ctx.transform(SN, -CS * SP, 0, CP, FTR[0], FTR[1]);  // (s, v)：s 往後 0～DP
    ctx.beginPath(); ctx.rect(0, 0, DP, HC); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, HC);
    g.addColorStop(0, '#B9733A');
    g.addColorStop(0.5, '#C5864A');
    g.addColorStop(1, '#A4612C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, DP, HC);
    ctx.fillStyle = 'rgba(80,35,10,0.35)'; ctx.fillRect(0, 0, DP, HC);
    // 頂皮包過來
    ctx.fillStyle = '#4E2108'; ctx.fillRect(0, 0, DP, V_TOP - 1);
    ctx.fillStyle = '#7A3A12'; ctx.fillRect(0, HC - V_BOT, DP, V_BOT);
    // 側皮的細紋（烤模紙痕）
    const rnd = K.rng(9);
    ctx.strokeStyle = 'rgba(90,40,10,0.25)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 9; i++) {
      const v = V_TOP + 4 + rnd() * (HC - V_TOP - V_BOT - 8);
      ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(DP, v + (rnd() - 0.5) * 2); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    poly(ctx, [FTL, FTR, BTR, BTL]);
    const g = ctx.createLinearGradient(BTL[0], BTL[1], FTR[0], FTR[1]);
    g.addColorStop(0, '#8A4517');
    g.addColorStop(0.45, '#6E3210');
    g.addColorStop(1, '#55240A');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    poly(ctx, [FTL, FTR, BTR, BTL]); ctx.clip();
    // 光滑頂皮的柔光（左上）與細微的烤色斑
    const hx = BTL[0] + (FTR[0] - BTL[0]) * 0.3, hy = BTL[1] + (FTR[1] - BTL[1]) * 0.35;
    const gh = ctx.createRadialGradient(hx, hy, 1, hx, hy, 46);
    gh.addColorStop(0, 'rgba(255,200,140,0.45)');
    gh.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    const rnd = K.rng(21);
    for (let i = 0; i < 30; i++) {
      const t = rnd(), s = rnd();
      const x = FTL[0] + (FTR[0] - FTL[0]) * t + (BTL[0] - FTL[0]) * s, y = FTL[1] + (FTR[1] - FTL[1]) * t + (BTL[1] - FTL[1]) * s;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(40,15,3,0.09)' : 'rgba(200,120,60,0.08)';
      ctx.beginPath(); ctx.ellipse(x, y, 2 + rnd() * 5, 1 + rnd() * 2, PSI * 0.5, 0, TAU); ctx.fill();
    }
    // 前緣的亮線（圓角）
    ctx.strokeStyle = 'rgba(255,190,120,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(FTL[0] + 2, FTL[1] - 1.2); ctx.lineTo(FTR[0] - 2, FTR[1] - 1.2); ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    drawFront(ctx);
    drawSide(ctx);
    drawTop(ctx);
    // 邊線
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(120,60,20,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(FTR[0], FTR[1]); ctx.lineTo(FBR[0], FBR[1]); ctx.stroke();
    poly(ctx, [FTL, BTL, BTR, BBR, FBR, FBL]);
    ctx.strokeStyle = 'rgba(105,50,15,0.75)'; ctx.lineWidth = 2; ctx.stroke();
  }

  window.DESSERTS['castella'] = {
    draw,
    crumbs: ['#F8D158', '#6E330F', '#FBDD6E', '#9A5520', '#FFFCF0'],
    crunchy: 0.15,
  };
})();
