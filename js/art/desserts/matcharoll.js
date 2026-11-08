/* 抹茶蛋糕捲（matcharoll）
 * 橫躺的圓柱、斜上方看：圓形切面朝左前方，往右後方露出一小段外皮。
 * 切面：鮮綠抹茶海綿與白色鮮奶油捲約 2.3 圈；頂上一小團擠花奶油＋兩顆蜜紅豆。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何：切面是旋轉過的橢圓，用「局部單位圓」座標來畫 ---------- */
  const CX = 89, CY = 116;            // 切面中心
  const ROT = 50 * Math.PI / 180;     // 長軸角度（左上 → 右下）
  const RA = 63, RB = 54;             // 長半軸、短半軸
  const DLEN = 28;                    // 蛋糕捲往右後方露出的長度（螢幕單位）
  const D = DLEN / RB;                // 局部座標中往 -y 的位移
  const COS = Math.cos(ROT), SIN = Math.sin(ROT);

  // 局部（單位圓）→ 螢幕
  function S(lx, ly) {
    return [CX + lx * RA * COS - ly * RB * SIN, CY + lx * RA * SIN + ly * RB * COS];
  }
  function toLocal(ctx) {
    ctx.translate(CX, CY);
    ctx.rotate(ROT);
    ctx.scale(RA, RB);
  }

  const SPONGE = '#93C243';
  const CRUST = '#7A8A31';
  const RIM = 0.955;       // 切面外圈烤皮內緣

  /* ---------- 螺旋參數（奶油帶） ---------- */
  const P = 0.30;          // 每圈半徑增加量（海綿＋奶油）
  const E0 = 0.0;          // 奶油帶起點半徑（藏在中心奶油芯裡）
  const CORE = 0.165;      // 中心奶油芯半徑
  const TURNS = 2.25;
  const PHI_END = TURNS * TAU;
  const OFF = -1.0;        // 整個螺旋旋轉角，讓尾端落在下方
  const SCX = -0.03, SCY = -0.04;   // 螺旋中心略偏上（真實蛋糕捲常見）

  function creamThick(phi) {
    const base = 0.17 - 0.045 * (phi / PHI_END);
    const tail = Math.max(0, Math.min(1, (PHI_END - phi) / (0.42 * TAU)));
    const a = phi + OFF;
    return base * Math.sqrt(tail) * (1 + 0.12 * Math.sin(a - 0.6));
  }
  function innerR(phi) {
    const a = phi + OFF;
    return E0 + P * phi / TAU + 0.011 * Math.sin(3 * a + 1.3) + 0.007 * Math.sin(5 * a);
  }
  function pt(phi, r) {
    const a = phi + OFF;
    return [SCX + Math.cos(a) * r, SCY + Math.sin(a) * r];
  }

  // 奶油芯＋螺旋帶合併成一個簡單多邊形（沒有內部交界線，描邊才乾淨）
  let PHI_X = 0;   // 奶油帶內緣離開奶油芯的位置
  for (let phi = 0.5; phi < TAU * 1.2; phi += 0.005) {
    if (innerR(phi) >= CORE) { PHI_X = phi; break; }
  }
  function creamPath(ctx) {
    const N = 420;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const phi = PHI_X + (PHI_END - PHI_X) * i / N;
      const [x, y] = pt(phi, innerR(phi));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const phi = PHI_END * i / N;
      const [x, y] = pt(phi, Math.max(CORE, innerR(phi) + creamThick(phi)));
      ctx.lineTo(x, y);
    }
    // 沿奶油芯往回接到起點
    const a0 = OFF, a1 = OFF + PHI_X - TAU;
    ctx.arc(SCX, SCY, CORE, a0, a1, true);
    ctx.closePath();
  }
  // 海綿外皮那一側的細線（沿奶油帶內緣，離開奶油芯之後才畫）
  function skinLinePath(ctx, from, to) {
    const N = 300;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const phi = from + (to - from) * i / N;
      const [x, y] = pt(phi, innerR(phi) - 0.004);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  }

  function bodyPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, -D);
    ctx.arc(0, -D, 1, 0, -Math.PI, true);
    ctx.lineTo(-1, 0);
    ctx.arc(0, 0, 1, Math.PI, 0, true);
    ctx.closePath();
  }

  /* ---------- 外皮（側面） ---------- */
  function drawBody(ctx) {
    ctx.save();
    toLocal(ctx);
    bodyPath(ctx);
    // 圓柱明暗：局部 x=-1 是頂側（受光），x=+1 是底側
    const g = ctx.createLinearGradient(-1, 0, 1, 0);
    g.addColorStop(0, K.shade(CRUST, 0.02));
    g.addColorStop(0.12, K.shade(CRUST, 0.3));
    g.addColorStop(0.32, K.shade(CRUST, 0.14));
    g.addColorStop(0.65, CRUST);
    g.addColorStop(0.85, K.shade('#6E7430', -0.12));
    g.addColorStop(1, K.shade('#5F5F28', -0.2));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const rnd = K.rng(311);
    // 烤皮細紋：柔和的大斑＋細點
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 2 - 1, y = -rnd() * (D + 1);
      const r = 0.04 + rnd() * 0.06;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(80,80,25,0.07)' : 'rgba(200,210,120,0.07)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r, 0, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 700; i++) {
      const x = rnd() * 2 - 1, y = -rnd() * (D + 1);
      const r = 0.004 + rnd() * 0.008;
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(60,62,18,0.25)' : 'rgba(205,215,130,0.22)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r, 0, 0, TAU); ctx.fill();
    }
    // 頂部撒抹茶粉：先一層粉霧，再細顆粒
    const hz = ctx.createLinearGradient(-1, 0, 0, 0);
    hz.addColorStop(0, 'rgba(160,200,80,0)');
    hz.addColorStop(0.18, 'rgba(160,200,80,0.35)');
    hz.addColorStop(0.45, 'rgba(160,200,80,0.18)');
    hz.addColorStop(1, 'rgba(160,200,80,0)');
    ctx.fillStyle = hz;
    ctx.fillRect(-1, -D - 1.1, 1, D + 1.2);
    for (let i = 0; i < 1400; i++) {
      const x = -1 + rnd() * 1.1;
      const y = -rnd() * (D + 1);
      const w = Math.exp(-Math.pow((x + 0.74) / 0.26, 2));
      if (rnd() > w) continue;
      const r = 0.004 + rnd() * 0.009;
      ctx.fillStyle = rnd() < 0.7 ? 'rgba(170,210,85,0.8)' : 'rgba(120,160,50,0.75)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    bodyPath(ctx);
    ctx.restore();
    ctx.strokeStyle = K.rgba('#3E4A15', 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- 切面 ---------- */
  function drawFace(ctx) {
    ctx.save();
    toLocal(ctx);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU);
    ctx.save();
    ctx.clip();

    // 海綿底色
    const g = ctx.createLinearGradient(-1, -0.3, 1, 0.3);
    g.addColorStop(0, K.shade(SPONGE, 0.22));
    g.addColorStop(0.45, SPONGE);
    g.addColorStop(1, K.shade(SPONGE, -0.18));
    ctx.fillStyle = g;
    ctx.fillRect(-1.1, -1.1, 2.2, 2.2);

    // 海綿氣孔：細密小孔＋少量較大的氣泡
    const rnd = K.rng(77);
    for (let i = 0; i < 1300; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd());
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      const r = 0.004 + rnd() * 0.009;
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(55,90,15,0.26)' : 'rgba(230,248,180,0.26)';
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, rnd() * 3, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 40; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * 0.92;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      const r = 0.012 + rnd() * 0.01;
      ctx.fillStyle = 'rgba(60,95,20,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.75, rnd() * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(230,248,180,0.3)';
      ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.35, r * 0.6, r * 0.3, 0, 0, TAU); ctx.fill();
    }

    // 海綿大塊柔和明暗（打破均勻感）
    for (let i = 0; i < 28; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * 0.9;
      const r = 0.08 + rnd() * 0.12;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(70,110,20,0.05)' : 'rgba(235,250,190,0.055)';
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, r, r * 0.45, rnd() * 3, 0, TAU); ctx.fill();
    }

    // 奶油：中心芯＋螺旋帶
    const cg = ctx.createLinearGradient(-0.8, -0.3, 0.8, 0.3);
    cg.addColorStop(0, '#FFFFFC');
    cg.addColorStop(0.6, '#FCF8EE');
    cg.addColorStop(1, '#EFE8D6');
    ctx.fillStyle = cg;
    creamPath(ctx);
    ctx.fill();
    // 奶油邊緣柔和陰影（只在奶油裡面）
    ctx.save();
    creamPath(ctx);
    ctx.clip();
    creamPath(ctx);
    ctx.strokeStyle = 'rgba(150,150,110,0.22)';
    ctx.lineWidth = 0.045;
    ctx.stroke();
    // 奶油光澤
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 30; i++) {
      const phi = 0.5 + i * 0.4;
      if (phi > PHI_END - 1.5) break;
      const r = innerR(phi) + creamThick(phi) * 0.4;
      const a = phi + OFF;
      if (Math.cos(a - 3.6) < 0.35) continue;   // 只在受光的左上側
      const [gx, gy] = pt(phi, r);
      ctx.beginPath(); ctx.ellipse(gx, gy, 0.03, 0.011, a + Math.PI / 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 奶油與海綿交界細線
    creamPath(ctx);
    ctx.strokeStyle = 'rgba(80,115,30,0.3)';
    ctx.lineWidth = 0.01;
    ctx.stroke();
    // 海綿外皮側的深色細線
    skinLinePath(ctx, PHI_X + 0.15, PHI_END - 0.25);
    ctx.strokeStyle = 'rgba(95,110,30,0.5)';
    ctx.lineWidth = 0.016;
    ctx.stroke();

    // 外圈烤皮
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.arc(0, 0, RIM, 0, TAU, true);
    ctx.fillStyle = K.shade(CRUST, -0.12);
    ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, RIM - 0.006, 0, TAU);
    ctx.strokeStyle = 'rgba(70,90,20,0.18)';
    ctx.lineWidth = 0.012;
    ctx.stroke();

    // 整體光影：左上亮、右下暗
    const lg = ctx.createRadialGradient(-0.5, -0.1, 0.05, -0.5, -0.1, 1.1);
    lg.addColorStop(0, 'rgba(255,255,240,0.16)');
    lg.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
    const dg = ctx.createLinearGradient(0.1, 0, 1, 0.2);
    dg.addColorStop(0, 'rgba(40,50,10,0)');
    dg.addColorStop(1, 'rgba(40,50,10,0.14)');
    ctx.fillStyle = dg;
    ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
    ctx.restore();

    // 切口邊緣在左上受光
    ctx.beginPath(); ctx.arc(0, 0, 0.982, 2.4, 4.2);
    ctx.strokeStyle = 'rgba(220,235,165,0.3)';
    ctx.lineWidth = 0.02;
    ctx.stroke();

    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU);
    ctx.restore();
    ctx.strokeStyle = K.rgba('#3E4A15', 0.5);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  /* ---------- 頂上擠花奶油＋蜜紅豆 ---------- */
  function drawTopping(ctx) {
    // 放在頂部略偏右後方，避免正中央像個蓋子
    const [bx, by] = S(-0.6, -0.8 - D * 0.5);
    ctx.save();
    ctx.translate(bx, by + 1);
    const s = 1.7;
    ctx.scale(s, s);

    // 接觸陰影
    const sg = ctx.createRadialGradient(1, 1.5, 1, 1, 1.5, 13);
    sg.addColorStop(0, 'rgba(40,50,10,0.38)');
    sg.addColorStop(1, 'rgba(40,50,10,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(1, 1.5, 13, 5.2, -0.2, 0, TAU); ctx.fill();

    // 擠花：星形花嘴擠出的三層漩渦，每層有斜向溝紋
    function tier(cx, cy, rx, ry, grooves, seed) {
      // 本體
      const g = ctx.createRadialGradient(cx - rx * 0.4, cy - ry * 0.7, 0.3, cx, cy, rx * 1.05);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.55, '#FBF7ED');
      g.addColorStop(1, '#DDD3BD');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
      // 斜向溝紋：前半圈看得到
      for (let k = 0; k < grooves; k++) {
        const t = (k + 0.5) / grooves;
        const th = Math.PI * (0.06 + 0.88 * t);
        const x0 = cx - Math.cos(th) * rx * 1.02, y0 = cy + Math.sin(th) * ry * 1.02;
        const x1 = cx - Math.cos(th) * rx * 0.55 + rx * 0.22, y1 = cy - ry * 0.35;
        ctx.strokeStyle = 'rgba(175,160,125,0.5)';
        ctx.lineWidth = 0.55;
        ctx.beginPath(); ctx.moveTo(x0 + 0.35, y0); ctx.quadraticCurveTo(x0 + rx * 0.05, (y0 + y1) / 2, x1 + 0.35, y1); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x0 - 0.45, y0); ctx.quadraticCurveTo(x0 + rx * 0.05 - 0.8, (y0 + y1) / 2, x1 - 0.45, y1); ctx.stroke();
      }
      // 右下陰影
      const sh = ctx.createLinearGradient(cx - rx * 0.2, cy - ry, cx + rx * 0.8, cy + ry);
      sh.addColorStop(0, 'rgba(150,135,100,0)');
      sh.addColorStop(1, 'rgba(150,135,100,0.32)');
      ctx.fillStyle = sh;
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(150,135,100,0.45)';
      ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    }
    tier(0, -3.0, 11.2, 4.8, 8);
    tier(0.5, -7.2, 8.4, 4.0, 6);
    tier(0.9, -10.8, 5.4, 3.2, 4);
    // 尖頂（往右捲）
    const tg = ctx.createLinearGradient(-1, -15.5, 3, -11);
    tg.addColorStop(0, '#FFFFFF');
    tg.addColorStop(1, '#E4DAC4');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-1.6, -12.4);
    ctx.quadraticCurveTo(-0.4, -16.2, 3.6, -15.8);
    ctx.quadraticCurveTo(1.9, -14.6, 2.8, -12.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,135,100,0.4)';
    ctx.lineWidth = 0.45;
    ctx.stroke();
    // 撒在奶油上的少許抹茶粉
    const r2 = K.rng(905);
    for (let i = 0; i < 18; i++) {
      const x = -7 + r2() * 13, y = -12 + r2() * 9;
      ctx.fillStyle = r2() < 0.6 ? 'rgba(125,170,50,0.7)' : 'rgba(95,140,35,0.65)';
      ctx.beginPath(); ctx.arc(x, y, 0.2 + r2() * 0.22, 0, TAU); ctx.fill();
    }

    // 蜜紅豆
    function bean(x, y, rx, ry, rot) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(70,50,25,0.22)';
      ctx.beginPath(); ctx.ellipse(0.5, 1.1, rx, ry * 0.8, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 0.3, 0, 0, rx * 1.1);
      g.addColorStop(0, '#A33C2C');
      g.addColorStop(0.5, '#701C16');
      g.addColorStop(1, '#3C0B08');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,8,6,0.5)'; ctx.lineWidth = 0.45; ctx.stroke();
      // 種臍白線
      ctx.strokeStyle = 'rgba(250,235,220,0.75)'; ctx.lineWidth = 0.45;
      ctx.beginPath(); ctx.moveTo(-rx * 0.1, ry * 0.66); ctx.quadraticCurveTo(rx * 0.3, ry * 0.76, rx * 0.6, ry * 0.5); ctx.stroke();
      // 糖漿光澤：一點亮光＋一抹柔光
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.ellipse(-rx * 0.15, -ry * 0.3, rx * 0.55, ry * 0.32, -0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(-rx * 0.4, -ry * 0.42, rx * 0.17, ry * 0.12, -0.3, 0, TAU); ctx.fill();
      ctx.restore();
    }
    bean(-1.4, -12.6, 3.3, 2.5, -0.3);
    bean(2.4, -11.0, 3.6, 2.7, 0.7);
    ctx.restore();
  }

  function draw(ctx) {
    drawBody(ctx);
    drawFace(ctx);
    drawTopping(ctx);
  }

  window.DESSERTS['matcharoll'] = { draw };
})();
