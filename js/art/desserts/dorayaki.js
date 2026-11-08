/* 銅鑼燒（どら焼き）
 * 斜上方俯視：上片餅皮是焦褐色光滑圓頂（邊緣一圈淡黃），中間夾一層看得到顆粒的紅豆餡，
 * 下片餅皮露出淡黃側邊和底部焦褐弧。光源左上。
 * 和馬卡龍、維多利亞海綿蛋糕的分別：大而扁的「褐色」兩片餅、中間是深紅褐色紅豆。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const RX = 82, RY = 47;            // 餅皮的橢圓（俯視壓扁）
  const TOP_Y = 87;                  // 上片頂面橢圓中心
  const TOP_RIM = 12;                // 上片側邊厚度（螢幕單位）
  const AN_Y0 = TOP_Y + TOP_RIM - 2; // 紅豆餡上緣
  const AN_H = 16;                   // 紅豆餡厚度
  const BOT_Y0 = AN_Y0 + AN_H - 3;   // 下片上緣
  const BOT_RIM = 11;                // 下片側邊
  
  const KY = RY / RX;

  // 旋轉體外輪廓：levels = [{ y, rx }]（每一層是一個水平圓投影成的橢圓），回傳上下包絡線
  function envelope(levels) {
    let mx = 0; for (const l of levels) mx = Math.max(mx, l.rx);
    const top = [], bot = [], N = 90;
    for (let i = 0; i <= N; i++) {
      const x = mx * Math.cos(Math.PI * (1 - i / N)) * 0.99999;
      let yt = Infinity, yb = -Infinity;
      for (const l of levels) {
        if (l.rx < Math.abs(x)) continue;
        const h = KY * Math.sqrt(l.rx * l.rx - x * x);
        if (l.y - h < yt) yt = l.y - h;
        if (l.y + h > yb) yb = l.y + h;
      }
      if (yt !== Infinity) { top.push([CX + x, yt]); bot.push([CX + x, yb]); }
    }
    return { top, bot };
  }
  function envPath(ctx, e) {
    ctx.beginPath();
    e.top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    for (let i = e.bot.length - 1; i >= 0; i--) ctx.lineTo(e.bot[i][0], e.bot[i][1]);
    ctx.closePath();
  }
  function levels(y0, y1, rxf, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push({ y: y0 + (y1 - y0) * t, rx: rxf(t) }); }
    return out;
  }
  // 上片：邊緣圓潤（中段最寬）；下片：側邊之後接往內收的焦褐圓底
  const rTop = t => RX - 14 * (t - 0.35) * (t - 0.35);
  const rBot = t => t <= 1 ? RX - 14 * (t - 0.3) * (t - 0.3) : RX - 6.9 - 70 * (t - 1) * (t - 1);
  const E_TOP = envelope(levels(TOP_Y, TOP_Y + TOP_RIM, rTop, 16));
  const E_AN = envelope(levels(AN_Y0, AN_Y0 + AN_H, t => RX - 5 + 2.2 * Math.sin(Math.PI * t), 12));
  const E_BOT = envelope(levels(BOT_Y0, BOT_Y0 + BOT_RIM * 1.55, t => rBot(t * 1.55), 24));
  const TOP_RX = rTop(0), TOP_RY = TOP_RX * KY;
  // 上片的圓頂：頂面不是平的，中央隆起 DOME
  const DOME = 9;
  const E_DOME = envelope(levels(TOP_Y, TOP_Y - DOME, t => TOP_RX * Math.sqrt(Math.max(0, 1 - t * t)), 14));

  const E_ALL = envelope([].concat(
    levels(TOP_Y, TOP_Y - DOME, t => TOP_RX * Math.sqrt(Math.max(0, 1 - t * t)), 14),
    levels(TOP_Y, TOP_Y + TOP_RIM, rTop, 16),
    levels(AN_Y0, AN_Y0 + AN_H, t => RX - 5 + 2.2 * Math.sin(Math.PI * t), 12),
    levels(BOT_Y0, BOT_Y0 + BOT_RIM * 1.55, t => rBot(t * 1.55), 24)));
  function silhouette(ctx) { envPath(ctx, E_ALL); }

  /* ---------- 下片餅皮 ---------- */
  function drawBottom(ctx) {
    const y0 = BOT_Y0, y1 = BOT_Y0 + BOT_RIM;
    const yEnd = E_BOT.bot[45][1];
    ctx.save();
    envPath(ctx, E_BOT);
    ctx.clip();
    // 淡黃側邊 → 底部焦褐
    const g = ctx.createLinearGradient(0, y0 + RY - 6, 0, yEnd);
    g.addColorStop(0, '#F3DCA6');
    g.addColorStop(0.45, '#E8C380');
    g.addColorStop(0.66, '#C27A36');
    g.addColorStop(1, '#8E4B1E');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 200, 200);
    // 左右明暗
    const gx = ctx.createLinearGradient(CX - RX, 0, CX + RX, 0);
    gx.addColorStop(0, 'rgba(255,240,210,0.25)');
    gx.addColorStop(0.35, 'rgba(255,255,255,0)');
    gx.addColorStop(1, 'rgba(110,55,20,0.38)');
    ctx.fillStyle = gx;
    ctx.fillRect(0, 0, 200, 200);
    // 焦褐弧上的淡淡反光
    ctx.strokeStyle = 'rgba(255,215,160,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(CX, y1 + 1, RX - 12, RY - 2, 0, 0.45, 1.45); ctx.stroke();
    ctx.restore();
    envPath(ctx, E_BOT);
    ctx.strokeStyle = 'rgba(110,55,25,0.75)'; ctx.lineWidth = 2; ctx.stroke();
  }

  /* ---------- 紅豆餡 ---------- */
  function ankoPath(ctx) { envPath(ctx, E_AN); }

  function drawAnko(ctx) {
    ankoPath(ctx);
    const g = ctx.createLinearGradient(CX - RX, 0, CX + RX, 0);
    g.addColorStop(0, '#7A3036');
    g.addColorStop(0.3, '#6A2630');
    g.addColorStop(0.7, '#561C26');
    g.addColorStop(1, '#3E121A');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ankoPath(ctx); ctx.clip();
    // 上方被餅皮壓住的陰影
    const gs = ctx.createLinearGradient(0, AN_Y0 + RY - 4, 0, AN_Y0 + RY + AN_H);
    gs.addColorStop(0, 'rgba(30,5,10,0.55)');
    gs.addColorStop(0.5, 'rgba(30,5,10,0)');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, 200, 200);
    // 紅豆顆粒（粒餡）：前半弧上的小橢圓豆子
    const rnd = K.rng(47);
    for (let i = 0; i < 46; i++) {
      const th = 0.12 + rnd() * (Math.PI - 0.24);
      const v = 0.25 + rnd() * 0.75;
      const x = CX + Math.cos(th) * (RX - 3), y = AN_Y0 + Math.sin(th) * RY + v * (AN_H + 2);
      const s = 0.65 + 0.35 * Math.sin(th);             // 兩側被透視壓窄
      const r = 2.2 + rnd() * 1.4;
      const rot = (rnd() - 0.5) * 1.2;
      ctx.fillStyle = rnd() < 0.5 ? '#8C3A44' : '#7B2F3A';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.35 * s, r, rot, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,200,0.38)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.35 * s, y - r * 0.35, r * 0.55 * s, r * 0.3, rot, 0, TAU); ctx.fill();
      // 豆子上白色的小臍
      if (rnd() < 0.35) {
        ctx.fillStyle = 'rgba(245,225,215,0.75)';
        ctx.beginPath(); ctx.ellipse(x + r * 0.3 * s, y + r * 0.1, 0.7 * s, 0.35, rot, 0, TAU); ctx.fill();
      }
    }
    // 光澤
    ctx.strokeStyle = 'rgba(255,190,190,0.28)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(CX, AN_Y0 + AN_H * 0.55, RX - 5, RY, 0, 2.0, 2.9); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 上片餅皮 ---------- */
  function drawTopRim(ctx) {
    const y0 = TOP_Y, y1 = TOP_Y + TOP_RIM;
    ctx.save();
    envPath(ctx, E_TOP);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y0 + RY - 8, 0, y1 + RY);
    g.addColorStop(0, '#E9B76C');
    g.addColorStop(0.35, '#F4DDA8');
    g.addColorStop(1, '#E8C688');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    const gx = ctx.createLinearGradient(CX - RX, 0, CX + RX, 0);
    gx.addColorStop(0, 'rgba(255,250,230,0.35)');
    gx.addColorStop(0.4, 'rgba(255,255,255,0)');
    gx.addColorStop(1, 'rgba(120,70,25,0.36)');
    ctx.fillStyle = gx; ctx.fillRect(0, 0, 200, 200);
    // 側邊鬆軟的氣孔
    const rnd = K.rng(19);
    for (let i = 0; i < 70; i++) {
      const th = 0.08 + rnd() * (Math.PI - 0.16);
      const x = CX + Math.cos(th) * (RX - 1), y = y0 + Math.sin(th) * RY + 3 + rnd() * (TOP_RIM - 5);
      ctx.fillStyle = 'rgba(190,130,60,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.9 * (0.4 + Math.sin(th) * 0.6), 0.7, 0, 0, TAU); ctx.fill();
    }
    // 下緣（貼著紅豆餡）往內捲的陰影
    const gb = ctx.createLinearGradient(0, y1 + RY - 6, 0, y1 + RY - 1);
    gb.addColorStop(0, 'rgba(120,60,30,0)');
    gb.addColorStop(1, 'rgba(120,60,30,0.4)');
    ctx.fillStyle = gb; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    envPath(ctx, E_TOP);
    ctx.strokeStyle = 'rgba(120,62,28,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
  }

  function topFace(ctx) { envPath(ctx, E_DOME); }

  function drawTopFace(ctx) {
    topFace(ctx);
    // 外圈淡黃（沒碰到鐵板的邊）
    ctx.fillStyle = '#EDCB8A';
    ctx.fill();
    ctx.save();
    topFace(ctx); ctx.clip();
    // 焦褐色的圓（中央，比外圈小一點）
    const cy = TOP_Y - DOME * 0.45;
    const g = ctx.createRadialGradient(CX - 22, cy - 14, 4, CX, cy, RX);
    g.addColorStop(0, '#C9773A');
    g.addColorStop(0.45, '#A9592A');
    g.addColorStop(0.8, '#8A421C');
    g.addColorStop(0.9, '#9E5626');
    g.addColorStop(0.96, 'rgba(214,160,92,0.9)');
    g.addColorStop(1, 'rgba(237,203,138,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(CX, cy, TOP_RX - 2.5, TOP_RY + DOME * 0.25, 0, 0, TAU); ctx.fill();
    // 烤色深淺的細斑（鐵板紋路）
    const rnd = K.rng(83);
    for (let i = 0; i < 90; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.86;
      const x = CX + Math.cos(a) * d * RX, y = cy + Math.sin(a) * d * RY;
      const r = 1.5 + rnd() * 4.5;
      ctx.fillStyle = rnd() < 0.55 ? 'rgba(110,50,18,0.08)' : 'rgba(225,155,85,0.08)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r * 0.75, 0, 0, TAU); ctx.fill();
    }
    // 細小氣孔
    for (let i = 0; i < 70; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.85;
      const x = CX + Math.cos(a) * d * RX, y = cy + Math.sin(a) * d * RY;
      ctx.fillStyle = 'rgba(90,40,15,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y, 0.75, 0.45, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,215,160,0.3)';
      ctx.beginPath(); ctx.ellipse(x - 0.5, y - 0.5, 0.6, 0.35, 0, 0, TAU); ctx.fill();
    }
    // 圓頂光澤（左上大片柔光＋一道亮邊）
    const gh = ctx.createRadialGradient(CX - 30, cy - 16, 2, CX - 30, cy - 16, 52);
    gh.addColorStop(0, 'rgba(255,236,200,0.6)');
    gh.addColorStop(0.5, 'rgba(255,225,180,0.2)');
    gh.addColorStop(1, 'rgba(255,225,180,0)');
    ctx.fillStyle = gh;
    ctx.beginPath(); ctx.ellipse(CX - 30, cy - 16, 56, 30, -0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,215,0.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(CX, cy + 2, RX - 14, RY - 9, 0, 3.55, 4.35); ctx.stroke();
    // 右下暗一點（圓頂背光面）
    const gd = ctx.createLinearGradient(CX - 20, cy - 20, CX + RX, cy + RY);
    gd.addColorStop(0, 'rgba(70,30,10,0)');
    gd.addColorStop(1, 'rgba(70,30,10,0.28)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    // 頂面與側邊的交界：淡黃的圓角亮線
    ctx.strokeStyle = 'rgba(255,240,205,0.85)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(CX, TOP_Y + 0.6, TOP_RX - 0.8, TOP_RY - 0.4, 0, 0.15, Math.PI - 0.15); ctx.stroke();
  }

  function draw(ctx) {
    drawBottom(ctx);
    drawAnko(ctx);
    drawTopRim(ctx);
    drawTopFace(ctx);
    // 外輪廓：同色系細線
    silhouette(ctx);
    ctx.strokeStyle = 'rgba(110,55,25,0.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['dorayaki'] = {
    draw,
    crumbs: ['#A9592A', '#EDCB8A', '#6A2630', '#C9773A', '#F4DDA8'],
    crunchy: 0.2,
  };
})();
