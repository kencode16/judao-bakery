/* 紐約起司蛋糕（New York cheesecake）
 * 一塊高挑的三角切片，尖端朝右前方：看得到受光的左切面、窄窄的右切面和淺金色頂面。
 * 切面是厚實綿密的乳黃色奶油乳酪，底下一層消化餅乾底，頂面烤成淺金褐、外緣更深。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;

  const AX = 136, AY = 171, S = 148, KY = 0.5, H = 74;
  const TL = 132 * D2R, TR = 79 * D2R;          // 左右兩條切邊的方向（平面角，往上＝往後）
  const Z_CRUST = 14, SKIN = 4;

  // 平面極座標 (θ, r) ＋高度 z → 畫面
  const P = (th, r, z) => [AX + Math.cos(th) * r, AY - Math.sin(th) * r * KY - z];

  function face(ctx, th) {
    const a = P(th, 0, 0), b = P(th, S, 0), c = P(th, S, H), d = P(th, 0, H);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
  }
  function topPath(ctx) {
    ctx.beginPath();
    const a = P(TL, 0, H);
    ctx.moveTo(a[0], a[1]);
    for (let i = 0; i <= 40; i++) { const th = TL + (TR - TL) * i / 40; const p = P(th, S, H); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }
  function silhouette(ctx) {
    ctx.beginPath();
    let p = P(TL, S, 0); ctx.moveTo(p[0], p[1]);
    p = P(TL, 0, 0); ctx.lineTo(p[0], p[1]);
    p = P(TR, S, 0); ctx.lineTo(p[0], p[1]);
    for (let i = 0; i <= 40; i++) { const th = TR + (TL - TR) * i / 40; const q = P(th, S, H); ctx.lineTo(q[0], q[1]); }
    ctx.closePath();
  }

  /* ---------- 切面（u：從尖端往外，v：高度） ---------- */
  function drawCut(ctx, th, lit, seed) {
    const co = Math.cos(th), si = -Math.sin(th) * KY;
    ctx.save();
    face(ctx, th); ctx.clip();
    ctx.transform(co, si, 0, -1, AX, AY);
    const rnd = K.rng(seed);
    // 乳酪體
    const g = ctx.createLinearGradient(0, Z_CRUST, 0, H);
    if (lit) {
      g.addColorStop(0, '#F6DD9C'); g.addColorStop(0.5, '#FBE9B6'); g.addColorStop(1, '#FCEFC6');
    } else {
      g.addColorStop(0, '#DDBB72'); g.addColorStop(0.5, '#E8CC8A'); g.addColorStop(1, '#ECD498');
    }
    ctx.fillStyle = g; ctx.fillRect(0, Z_CRUST, S, H - Z_CRUST);
    // 細小氣泡、綿密質地
    for (let i = 0; i < 70; i++) {
      const u = 4 + rnd() * (S - 10), v = Z_CRUST + 3 + rnd() * (H - Z_CRUST - SKIN - 5), r = 0.4 + rnd() * 0.7;
      ctx.fillStyle = lit ? 'rgba(215,175,95,0.35)' : 'rgba(170,130,60,0.35)';
      ctx.beginPath(); ctx.ellipse(u, v, r * 1.2, r, 0, 0, TAU); ctx.fill();
    }
    // 刀面抹過的柔和光澤（斜向）
    const gk = ctx.createLinearGradient(0, H, S * 0.6, Z_CRUST);
    gk.addColorStop(0, 'rgba(255,255,245,0)');
    gk.addColorStop(0.45, lit ? 'rgba(255,255,245,0.28)' : 'rgba(255,250,230,0.12)');
    gk.addColorStop(0.7, 'rgba(255,255,245,0)');
    ctx.fillStyle = gk; ctx.fillRect(0, Z_CRUST, S, H - Z_CRUST);
    // 外側（靠烤模）的烤色
    const go = ctx.createLinearGradient(S - 9, 0, S, 0);
    go.addColorStop(0, 'rgba(200,140,60,0)');
    go.addColorStop(0.55, 'rgba(200,140,60,0.55)');
    go.addColorStop(1, 'rgba(170,105,40,0.9)');
    ctx.fillStyle = go; ctx.fillRect(S - 9, Z_CRUST, 9, H - Z_CRUST);
    // 頂面烤皮（薄薄一層金褐）
    const gs = ctx.createLinearGradient(0, H - SKIN - 2, 0, H);
    gs.addColorStop(0, 'rgba(215,160,80,0)');
    gs.addColorStop(0.5, lit ? 'rgba(215,160,80,0.75)' : 'rgba(185,130,60,0.8)');
    gs.addColorStop(1, lit ? '#D29A4C' : '#B57F38');
    ctx.fillStyle = gs; ctx.fillRect(0, H - SKIN - 2, S, SKIN + 2);
    // 消化餅乾底
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let u = 0; u <= S; u += 4) ctx.lineTo(u, Z_CRUST + Math.sin(u * 0.37) * 0.7 + (rnd() - 0.5) * 0.9);
    ctx.lineTo(S, 0); ctx.closePath();
    const gc = ctx.createLinearGradient(0, 0, 0, Z_CRUST);
    gc.addColorStop(0, lit ? '#8A5226' : '#6E401C');
    gc.addColorStop(1, lit ? '#B97C3E' : '#946030');
    ctx.fillStyle = gc; ctx.fill();
    for (let i = 0; i < 110; i++) {
      const u = rnd() * S, v = rnd() * (Z_CRUST - 1), r = 0.4 + rnd() * 0.9;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(90,50,20,0.5)' : 'rgba(235,190,130,0.55)';
      ctx.beginPath(); ctx.ellipse(u, v, r, r * 0.8, 0, 0, TAU); ctx.fill();
    }
    // 乳酪與餅乾底交界的淡陰影
    ctx.fillStyle = 'rgba(150,100,40,0.25)'; ctx.fillRect(0, Z_CRUST, S, 1.6);
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    topPath(ctx);
    const a = P(TL, 0, H), far = P((TL + TR) / 2, S, H);
    const g = ctx.createLinearGradient(a[0], a[1], far[0], far[1]);
    g.addColorStop(0, '#F5DCA2');
    g.addColorStop(0.55, '#EDC883');
    g.addColorStop(0.85, '#DEAD62');
    g.addColorStop(1, '#C58A44');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 柔和的烤色斑
    const rnd = K.rng(1950);
    for (let i = 0; i < 20; i++) {
      const th = TR + rnd() * (TL - TR), r = 20 + rnd() * (S - 30);
      const p = P(th, r, H);
      ctx.fillStyle = `rgba(200,140,60,${0.08 + rnd() * 0.12})`;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 6 + rnd() * 10, 3 + rnd() * 4, 0, 0, TAU); ctx.fill();
    }
    // 外緣更深的烤色（弧邊）
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(170,105,40,0.35)';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const th = TL + (TR - TL) * i / 40; const p = P(th, S - 2, H); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    // 光澤
    const gh = ctx.createRadialGradient(a[0] - 34, a[1] - 26, 2, a[0] - 34, a[1] - 26, 42);
    gh.addColorStop(0, 'rgba(255,250,230,0.55)');
    gh.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  function draw(ctx) {
    drawCut(ctx, TR, false, 11);
    drawCut(ctx, TL, true, 12);
    drawTop(ctx);
    // 稜線：頂面與左切面交界的圓角亮線
    ctx.lineCap = 'round';
    const a = P(TL, 0, H), l = P(TL, S, H), r = P(TR, S, H), ab = P(TL, 0, 0);
    ctx.strokeStyle = 'rgba(255,245,215,0.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(a[0] - 1, a[1] + 1.2); ctx.lineTo(l[0] + 2, l[1] + 1.2); ctx.stroke();
    // 尖端垂直稜：左亮右暗交界
    ctx.strokeStyle = 'rgba(160,110,50,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0], a[1] + 2); ctx.lineTo(ab[0], ab[1] - 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,120,55,0.5)';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(r[0], r[1]); ctx.stroke();
    // 外輪廓
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(140,85,35,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['nycheesecake'] = {
    draw,
    crumbs: ['#FBE9B6', '#F6DD9C', '#C48A4A', '#9C6230', '#E9C07A'],
    crunchy: 0.1,
  };
})();
