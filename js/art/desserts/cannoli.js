/* 西西里卡諾里（Cannoli）
 * 一根斜放的油炸酥皮管：金褐色、表面炸出一顆顆小泡，中段有麵皮交疊的接縫，撒一點糖粉。
 * 兩端塞滿白色瑞可塔乳酪餡並鼓出管口，沾滿綠色開心果碎；近端再放半顆糖漬櫻桃。
 * 斜上 45 度、光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 104, CY = 102, ROT = -0.5;      // 管子中心與傾斜（左下→右上）
  const HL = 52, R = 27, RE = 30, EX = 0.4;   // 半長、管身半徑、管口半徑、管口橢圓的扁度

  const SHELL = '#C47A35', SHELL_LT = '#EDB46C', SHELL_DK = '#7A4216';
  const LINE = 'rgba(105,56,22,0.8)';

  // 管身上緣／下緣（v<0 是上方）：中段略細、兩端外翻
  const edge = (u) => { const t = Math.abs(u) / HL; return R + (RE - R) * Math.pow(t, 4) + Math.sin(u * 0.9) * 0.45 + Math.sin(u * 2.3 + 1) * 0.3; };

  function shellPath(ctx) {
    ctx.beginPath();
    for (let u = -HL; u <= HL; u += 4) ctx.lineTo(u, -edge(u));
    ctx.ellipse(HL, 0, RE * EX, RE, 0, -Math.PI / 2, Math.PI / 2, false);
    for (let u = HL; u >= -HL; u -= 4) ctx.lineTo(u, edge(u));
    ctx.ellipse(-HL, 0, RE * EX, RE, 0, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath();
  }

  /* ---------- 乳酪餡（鼓出管口的一團） ---------- */
  function creamPath(ctx, x0, dir, len, ry) {
    // 從管口（x0）往外鼓出 len，像一顆圓潤的饅頭；靠管子那側沿著管口橢圓
    ctx.beginPath();
    ctx.moveTo(x0, -ry);
    ctx.bezierCurveTo(x0 + dir * len * 0.72, -ry * 1.04, x0 + dir * len * 1.06, -ry * 0.62, x0 + dir * len, 0);
    ctx.bezierCurveTo(x0 + dir * len * 1.06, ry * 0.62, x0 + dir * len * 0.72, ry * 1.04, x0, ry);
    ctx.ellipse(x0, 0, RE * EX * 0.9, ry, 0, Math.PI / 2, Math.PI * 1.5, dir < 0);
    ctx.closePath();
  }
  function drawCream(ctx, x0, dir, len, ry, seed, cherry) {
    const rnd = K.rng(seed);
    creamPath(ctx, x0, dir, len, ry);
    const g = ctx.createLinearGradient(0, -ry, 0, ry);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.45, '#FBF6EC');
    g.addColorStop(1, '#D9CBB5');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(150,120,90,0.75)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.save();
    creamPath(ctx, x0, dir, len, ry); ctx.clip();
    // 瑞可塔的細顆粒
    for (let i = 0; i < 60; i++) {
      const x = x0 + dir * rnd() * len, y = (rnd() - 0.5) * ry * 1.9;
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(200,180,150,0.35)' : 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd() * 0.7, 0, TAU); ctx.fill();
    }
    // 開心果碎：鼓出來的那一面沾得最滿
    const GREENS = ['#7DB548', '#5C9A35', '#A8CF5A', '#4A7F2A', '#8CC152'];
    for (let i = 0; i < 150; i++) {
      const a = rnd() * TAU, rr = Math.pow(rnd(), 0.6);
      const x = x0 + dir * (len * 0.48 + Math.cos(a) * len * 0.62 * rr), y = Math.sin(a) * ry * 0.98 * rr;
      if (dir * (x - x0) < 4 + rnd() * 4) continue;
      const s = 0.9 + rnd() * 1.4, rot = rnd() * TAU;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = GREENS[Math.floor(rnd() * GREENS.length)];
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.3, -s * 0.9); ctx.lineTo(s, s * 0.2); ctx.lineTo(-s * 0.2, s * 0.8); ctx.closePath(); ctx.fill();
      if (rnd() < 0.2) { ctx.fillStyle = '#7E4E7A'; ctx.fillRect(s * 0.1, -s * 0.3, s * 0.6, s * 0.4); }  // 紫色薄皮
      ctx.restore();
    }
    // 管口邊的陰影（餡被管口壓著）
    const gs = ctx.createLinearGradient(x0, 0, x0 + dir * 7, 0);
    gs.addColorStop(0, 'rgba(120,80,40,0.35)'); gs.addColorStop(1, 'rgba(120,80,40,0)');
    ctx.fillStyle = gs; ctx.fillRect(Math.min(x0, x0 + dir * 7), -ry, 7, ry * 2);
    // 柔光
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(x0 + dir * len * 0.45, -ry * 0.55, len * 0.3, ry * 0.18, 0, 0, TAU); ctx.fill();
    ctx.restore();
    if (cherry) {
      const x = x0 + dir * len * 0.52, y = -4;
      const gg = ctx.createRadialGradient(x - 2.5, y - 3, 0.5, x, y, 8);
      gg.addColorStop(0, '#FF8A8A'); gg.addColorStop(0.45, '#E0193A'); gg.addColorStop(1, '#8A0A1E');
      ctx.fillStyle = 'rgba(90,40,20,0.3)';
      ctx.beginPath(); ctx.ellipse(x + 1.5, y + 2, 7.5, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(110,0,20,0.7)'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(x - 2.6, y - 2.8, 2, 1.3, -0.6, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 酥皮管 ---------- */
  function drawShell(ctx) {
    const rnd = K.rng(23);
    shellPath(ctx);
    const g = ctx.createLinearGradient(0, -RE, 0, RE);
    g.addColorStop(0, '#C9803C');
    g.addColorStop(0.2, '#E8A660');
    g.addColorStop(0.45, '#C47630');
    g.addColorStop(0.78, '#A35A22');
    g.addColorStop(1, '#6A3510');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    shellPath(ctx); ctx.clip();
    // 兩端炸得比較深
    const ge = ctx.createLinearGradient(-HL - 12, 0, HL + 12, 0);
    ge.addColorStop(0, 'rgba(110,50,15,0.35)'); ge.addColorStop(0.2, 'rgba(110,50,15,0)');
    ge.addColorStop(0.8, 'rgba(110,50,15,0)'); ge.addColorStop(1, 'rgba(110,50,15,0.4)');
    ctx.fillStyle = ge; ctx.fillRect(-HL - 15, -RE, HL * 2 + 30, RE * 2);
    // 炸出來的小泡（上亮下暗）
    for (let i = 0; i < 260; i++) {
      const u = (rnd() - 0.5) * HL * 2.1, v = (rnd() - 0.5) * 2 * R * 0.95;
      const lit = 1 - (v + R) / (2 * R);
      const rx = 0.9 + rnd() * 1.9, ry = rx * (0.55 + 0.35 * Math.sqrt(1 - Math.min(1, (v / R) ** 2)));
      ctx.fillStyle = `rgba(95,45,12,${0.14 + 0.16 * (1 - lit)})`;
      ctx.beginPath(); ctx.ellipse(u + 0.6, v + 1.0, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,${200 + Math.round(lit * 30)},${130 + Math.round(lit * 50)},${0.18 + 0.35 * lit})`;
      ctx.beginPath(); ctx.ellipse(u - 0.3, v - 0.5, rx * 0.75, ry * 0.65, 0, 0, TAU); ctx.fill();
    }
    // 麵皮交疊的接縫（斜斜一道）
    ctx.strokeStyle = 'rgba(100,48,14,0.6)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-6, -R - 2); ctx.bezierCurveTo(2, -R * 0.4, 8, R * 0.3, 14, R + 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,150,0.6)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-8, -R - 2); ctx.bezierCurveTo(0, -R * 0.4, 6, R * 0.3, 12, R + 2); ctx.stroke();
    // 管身上方的長條高光
    ctx.fillStyle = 'rgba(255,240,205,0.45)';
    ctx.beginPath(); ctx.ellipse(-8, -R * 0.62, HL * 0.78, 3.2, 0, 0, TAU); ctx.fill();
    // 糖粉
    for (let i = 0; i < 70; i++) {
      const u = (rnd() - 0.5) * HL * 1.9, v = -R + Math.pow(rnd(), 1.6) * R * 1.1;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.4})`;
      ctx.beginPath(); ctx.arc(u, v, 0.45 + rnd() * 0.75, 0, TAU); ctx.fill();
    }
    ctx.restore();
    shellPath(ctx);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.1; ctx.lineJoin = 'round'; ctx.stroke();
  }

  // 近端管口：看得到酥皮的厚度（一圈唇邊）
  function drawNearRim(ctx) {
    ctx.beginPath(); ctx.ellipse(-HL, 0, RE * EX + 1.2, RE + 0.8, 0, 0, TAU);
    const g = ctx.createLinearGradient(-HL, -RE, -HL, RE);
    g.addColorStop(0, '#F0BC78'); g.addColorStop(1, '#9A5520');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-HL - 0.6, 0, RE * EX * 0.9, RE - 2.6, 0, 0, TAU);
    ctx.fillStyle = '#8A4A1C'; ctx.fill();
  }

  function draw(ctx) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(ROT);
    // 遠端的餡（被管身擋住一部分）
    drawCream(ctx, HL - 1, 1, 26, RE - 1, 41, false);
    drawShell(ctx);
    drawNearRim(ctx);
    drawCream(ctx, -HL - 0.6, -1, 32, RE + 1, 17, true);
    ctx.restore();
  }

  window.DESSERTS['cannoli'] = {
    draw,
    crumbs: ['#C47A35', '#EDB46C', '#FBF6EC', '#6FA83A', '#7A4216'],
    crunchy: 0.85,
  };
})();
