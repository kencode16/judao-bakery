/* 巴斯克乳酪蛋糕（Tarta de queso vasca）
 * 三角切片，尖端在左：頂面和外側弧面都是高溫烤出的焦黑（帶焦糖光澤、外圈翹起、側面有烘焙紙壓出的皺褶），
 * 切面是乳白微黃、中心濕潤滑嫩的乳酪，上緣一條焦糖色漸層，沒有餅乾底。
 * 和草莓蛋糕、紐約起司蛋糕分開的關鍵：焦黑的頂面與外皮。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;

  /* ---------- 3D 幾何：尖端在左，圓弧在右；X 右、Y 往前、Z 往上 ---------- */
  const CX = 100, YC = 132, KY = 0.56, H = 56;
  const S = 150, AX = -74, F0 = -24 * D2R, F1 = 28 * D2R;      // 半徑、尖端 X、圓弧兩端角度
  const P = (X, Y, Z) => [CX + X, YC + Y * KY - Z];
  const arc = (f, z) => P(AX + S * Math.cos(f), -S * Math.sin(f), z);
  const A0 = P(AX, 0, 0), AT = P(AX, 0, H);
  const FB = arc(F0, 0), FT = arc(F0, H);          // 切面外端
  const LB = FB, RB = FB;                           // （相容舊名）

  const LINE = 'rgba(70,32,12,0.85)';

  function topPath(ctx, dz) {
    ctx.beginPath();
    const a = P(AX, 0, H + (dz || 0)); ctx.moveTo(a[0], a[1]);
    for (let i = 0; i <= 26; i++) { const p = arc(F0 + (F1 - F0) * i / 26, H + (dz || 0)); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }
  function sidePath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const p = arc(F0 - F0 * i / 14, H); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = 14; i >= 0; i--) { const p = arc(F0 - F0 * i / 14, 0); ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }
  function silhouette(ctx) {
    ctx.beginPath();
    ctx.moveTo(AT[0], AT[1]);
    for (let i = 0; i <= 26; i++) { const p = arc(F1 - (F1 - F0) * i / 26, H); ctx.lineTo(p[0], p[1]); }
    // 右側最外緣
    const E = arc(0, H), EB = arc(0, 0);
    ctx.lineTo(FT[0], FT[1]);
    for (let i = 0; i <= 14; i++) { const p = arc(0 + F0 * i / 14, 0); ctx.lineTo(p[0], p[1]); }
    ctx.lineTo(A0[0], A0[1]);
    ctx.closePath();
    // 外側面的右緣（φ=0）也要包含
    ctx.moveTo(E[0], E[1]); ctx.lineTo(EB[0], EB[1]); ctx.lineTo(FB[0], FB[1]); ctx.lineTo(FT[0], FT[1]); ctx.closePath();
  }

  /* ---------- 切面：本地座標 u（尖端 0 → 外緣 len）、v（頂 0 → 底 H） ---------- */
  function drawFace(ctx, end, lit, seed) {
    const rnd = K.rng(seed);
    const len = Math.hypot(end[0] - A0[0], end[1] - A0[1]);
    ctx.save();
    ctx.transform((end[0] - A0[0]) / len, (end[1] - A0[1]) / len, 0, 1, AT[0], AT[1]);
    ctx.beginPath(); ctx.rect(0, 0, len, H); ctx.clip();
    // 乳酪本體：中心（尖端）較濕潤偏黃、外緣較紮實偏白
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, '#F8DE92');
    g.addColorStop(0.35, '#FBE8B4');
    g.addColorStop(0.8, '#FCF0CF');
    g.addColorStop(1, '#F3D9A6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, len, H);
    // 上緣：焦糖色漸層＋起伏的焦皮
    const gt = ctx.createLinearGradient(0, 0, 0, 18);
    gt.addColorStop(0, 'rgba(150,80,30,0.9)'); gt.addColorStop(0.45, 'rgba(205,140,70,0.55)'); gt.addColorStop(1, 'rgba(240,200,130,0)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, len, 18);
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let u = 0; u <= len; u += 3) ctx.lineTo(u, 3.2 + 1.3 * Math.sin(u * 0.33 + seed) + 0.8 * Math.sin(u * 0.9 + seed * 2) + (u / len) * 2.5);
    ctx.lineTo(len, 0); ctx.closePath();
    ctx.fillStyle = '#2E1408'; ctx.fill();
    // 外緣：焦黑外皮＋焦糖滲進來
    const go = ctx.createLinearGradient(len - 18, 0, len, 0);
    go.addColorStop(0, 'rgba(230,180,110,0)'); go.addColorStop(0.7, 'rgba(190,120,55,0.55)'); go.addColorStop(1, 'rgba(150,80,30,0.8)');
    ctx.fillStyle = go; ctx.fillRect(len - 18, 0, 18, H);
    ctx.beginPath(); ctx.moveTo(len, 0);
    for (let v = 0; v <= H; v += 3) ctx.lineTo(len - 3.2 - 1.4 * Math.sin(v * 0.5 + seed) - 0.7 * Math.sin(v * 1.3), v);
    ctx.lineTo(len, H); ctx.closePath();
    ctx.fillStyle = '#2E1408'; ctx.fill();
    // 底部薄薄的烤色
    const gb = ctx.createLinearGradient(0, H - 7, 0, H);
    gb.addColorStop(0, 'rgba(210,150,80,0)'); gb.addColorStop(1, 'rgba(170,100,40,0.75)');
    ctx.fillStyle = gb; ctx.fillRect(0, H - 7, len, 7);
    // 綿密的細小氣孔
    for (let i = 0; i < 46; i++) {
      const u = 4 + rnd() * (len - 18), v = 14 + rnd() * (H - 22), r = 0.35 + rnd() * 0.6;
      ctx.fillStyle = 'rgba(200,150,80,0.35)';
      ctx.beginPath(); ctx.ellipse(u, v, r * 1.2, r, 0, 0, TAU); ctx.fill();
    }
    // 中心濕潤的光澤
    if (lit) {
      const gm = ctx.createRadialGradient(len * 0.22, H * 0.5, 1, len * 0.22, H * 0.5, len * 0.3);
      gm.addColorStop(0, 'rgba(255,250,225,0.55)'); gm.addColorStop(1, 'rgba(255,250,225,0)');
      ctx.fillStyle = gm; ctx.fillRect(0, 0, len, H);
    }
    if (!lit) { ctx.fillStyle = 'rgba(120,70,30,0.2)'; ctx.fillRect(0, 0, len, H); }
    ctx.restore();
  }

  /* ---------- 焦黑頂面 ---------- */
  function drawTop(ctx) {
    const rnd = K.rng(29);
    topPath(ctx);
    const g = ctx.createLinearGradient(AT[0], AT[1] - 30, arc(0, H)[0], FT[1]);
    g.addColorStop(0, '#6A3417'); g.addColorStop(0.5, '#4A220E'); g.addColorStop(1, '#2C1206');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 焦糖色斑塊（不均勻的烤色）
    for (let i = 0; i < 26; i++) {
      const th = F0 + (F1 - F0) * (0.05 + rnd() * 0.9), r = 18 + rnd() * (S - 30);
      const p = P(AX + r * Math.cos(th), -r * Math.sin(th), H);
      const gg = ctx.createRadialGradient(p[0], p[1], 0.5, p[0], p[1], 6 + rnd() * 8);
      const warm = rnd() < 0.55;
      gg.addColorStop(0, warm ? 'rgba(176,96,40,0.75)' : 'rgba(20,8,2,0.6)');
      gg.addColorStop(1, warm ? 'rgba(176,96,40,0)' : 'rgba(20,8,2,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 14, 7, 0, 0, TAU); ctx.fill();
    }
    // 細細的焦裂紋
    ctx.strokeStyle = 'rgba(15,5,0,0.4)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const th = F0 + (F1 - F0) * (0.1 + rnd() * 0.8), r = 40 + rnd() * 80;
      const p = P(AX + r * Math.cos(th), -r * Math.sin(th), H);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      ctx.quadraticCurveTo(p[0] + (rnd() - 0.5) * 10, p[1] + (rnd() - 0.5) * 4, p[0] + (rnd() - 0.5) * 16, p[1] + (rnd() - 0.5) * 6);
      ctx.stroke();
    }
    // 焦糖的油亮反光（左上）
    const hp = P(AX + 70, -6, H);
    const gh = ctx.createRadialGradient(hp[0], hp[1], 1, hp[0], hp[1], 26);
    gh.addColorStop(0, 'rgba(255,200,150,0.55)'); gh.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = gh; ctx.beginPath(); ctx.ellipse(hp[0], hp[1], 30, 12, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,235,210,0.6)';
    ctx.beginPath(); ctx.ellipse(hp[0] - 4, hp[1] - 1, 8, 2, -0.15, 0, TAU); ctx.fill();
    ctx.restore();

    // 外圈翹起的焦邊（最焦、有一點起伏）
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#24100A'; ctx.lineWidth = 4.5;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const th = F0 + 0.03 + (F1 - F0 - 0.06) * i / 30, p = arc(th, H + 0.6 + Math.sin(i * 1.7) * 0.6);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,90,45,0.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const th = F0 + 0.04 + (F1 - F0 - 0.08) * i / 30, p = arc(th, H + 1.8 + Math.sin(i * 1.7) * 0.6);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
  }

  /* ---------- 外側弧面：焦黑＋烘焙紙皺褶 ---------- */
  function drawSide(ctx) {
    const rnd = K.rng(41);
    sidePath(ctx);
    const g = ctx.createLinearGradient(FB[0] - 10, 0, arc(0, 0)[0], 0);
    g.addColorStop(0, '#5A2A12'); g.addColorStop(0.5, '#3E1C0C'); g.addColorStop(1, '#241006');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); sidePath(ctx); ctx.clip();
    // 皺褶：斜斜的亮暗細紋
    for (let i = 0; i < 16; i++) {
      const f = F0 + (-F0) * rnd(), z0 = rnd() * H * 0.6, z1 = z0 + 12 + rnd() * 26;
      const p0 = arc(f, z0), p1 = arc(f + (rnd() - 0.5) * 0.06, Math.min(H, z1));
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(150,85,40,0.55)' : 'rgba(10,3,0,0.5)'; ctx.lineWidth = 0.8 + rnd() * 0.8;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(p0[0] + (rnd() - 0.5) * 4, (p0[1] + p1[1]) / 2, p1[0], p1[1]); ctx.stroke();
    }
    // 焦糖斑
    for (let i = 0; i < 10; i++) {
      const p = arc(F0 + (-F0) * rnd(), rnd() * H);
      ctx.fillStyle = 'rgba(160,90,40,0.35)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 2 + rnd() * 3, 3 + rnd() * 5, 0, 0, TAU); ctx.fill();
    }
    // 底部烤色稍淺
    const gb = ctx.createLinearGradient(0, FB[1] - 10, 0, FB[1]);
    gb.addColorStop(0, 'rgba(120,60,25,0)'); gb.addColorStop(1, 'rgba(120,60,25,0.6)');
    ctx.fillStyle = gb; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
  }

  function draw(ctx) {
    // 外輪廓（畫在後面，只露出外側一半）
    silhouette(ctx);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
    silhouette(ctx); ctx.fillStyle = '#3E1C0C'; ctx.fill();
    drawSide(ctx);
    drawFace(ctx, FB, true, 3);
    drawTop(ctx);
    // 切面與外側面交界
    ctx.strokeStyle = 'rgba(40,16,6,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(FT[0], FT[1]); ctx.lineTo(FB[0], FB[1]); ctx.stroke();
  }

  window.DESSERTS['basque'] = {
    draw,
    crumbs: ['#FBE8B4', '#3A1B0C', '#F8DE92', '#7A3E18', '#FCF0CF'],
    crunchy: 0.05,
  };
})();
