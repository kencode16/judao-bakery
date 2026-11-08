/* 維多利亞海綿蛋糕（Victoria sponge）
 * 斜上 45 度的一整顆圓蛋糕，右前方切走一塊：兩層金黃奶油海綿蛋糕，中間夾覆盆子果醬和鮮奶油，
 * 頂上撒滿糖粉。切面看得到「海綿／紅果醬／白奶油／海綿」四層。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;

  const CX = 100, CYB = 134, R = 78, RY = 40, KR = RY / R;
  // 由下往上的高度
  const Z_SP1 = 24, Z_JAM = 30, Z_CRM = 38, H = 63;
  const A1 = 14 * D2R, A2 = 66 * D2R;    // 切走的扇形（右前方）

  const P = (th, z, r) => [CX + Math.cos(th) * (r || R), CYB + Math.sin(th) * (r || R) * KR - z];
  const C = z => [CX, CYB - z];

  function makeNoise(seed, amp, freqs) {
    const rr = K.rng(seed);
    const comps = freqs.map((f, i) => ({ f, p: rr() * TAU, a: (0.6 + rr() * 0.4) / (1 + i * 0.5) }));
    return t => { let s = 0; for (const c of comps) s += c.a * Math.sin(c.f * t + c.p); return s * amp; };
  }
  const nCream = makeNoise(5, 1.0, [9, 17, 26]);
  const nJam = makeNoise(9, 0.7, [11, 19]);

  /* ---------- 外側一圈帶狀（角度 a→b、高度 z0→z1） ---------- */
  function sideBand(ctx, a, b, z0, z1, r0, r1, n0, n1) {
    ctx.beginPath();
    const N = Math.max(8, Math.round((b - a) / TAU * 140));
    for (let i = 0; i <= N; i++) {
      const th = a + (b - a) * i / N;
      const p = P(th, z1 + (n1 ? n1(th) : 0), r1 || R);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    for (let i = N; i >= 0; i--) {
      const th = a + (b - a) * i / N;
      const p = P(th, z0 + (n0 ? n0(th) : 0), r0 || R);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  const RANGES = [[0, A1], [A2, Math.PI]];

  function spongeSide(ctx, z0, z1, top) {
    RANGES.forEach(([a, b]) => {
      sideBand(ctx, a, b, z0, z1);
      const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
      g.addColorStop(0, '#EDB866');
      g.addColorStop(0.3, '#DC9C48');
      g.addColorStop(0.7, '#C07A2C');
      g.addColorStop(1, '#9C5A1C');
      ctx.fillStyle = g; ctx.fill();
    });
    // 上下緣：頂層蛋糕上緣圓角較亮，下緣較暗
    ctx.save();
    RANGES.forEach(([a, b]) => { sideBand(ctx, a, b, z0, z1); });
    ctx.clip();
    RANGES.forEach(([a, b]) => {
      sideBand(ctx, a, b, z1 - (top ? 7 : 4), z1);
      ctx.fillStyle = top ? 'rgba(255,225,165,0.35)' : 'rgba(255,220,160,0.2)'; ctx.fill();
      sideBand(ctx, a, b, z0, z0 + 5);
      ctx.fillStyle = 'rgba(110,55,15,0.28)'; ctx.fill();
    });
    // 烤皮的細小氣孔
    const rnd = K.rng(top ? 21 : 22);
    for (let i = 0; i < 120; i++) {
      const th = rnd() * Math.PI;
      if (th > A1 && th < A2) continue;
      const z = z0 + 1 + rnd() * (z1 - z0 - 2);
      const p = P(th, z);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(130,70,20,0.35)' : 'rgba(255,225,170,0.4)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.6 + rnd() * 1.1, 0.5 + rnd() * 0.5, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function fillingSide(ctx) {
    // 果醬（紅，稍微往外擠）
    RANGES.forEach(([a, b]) => {
      sideBand(ctx, a, b, Z_SP1 - 0.5, Z_JAM + 0.5, R + 0.6, R + 0.6, null, nJam);
      const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
      g.addColorStop(0, '#E0263F');
      g.addColorStop(0.6, '#BE1230');
      g.addColorStop(1, '#8E0A22');
      ctx.fillStyle = g; ctx.fill();
    });
    // 鮮奶油（白，往外鼓、一球球的邊）
    const bump = th => 1.6 * Math.pow(Math.abs(Math.sin(th * 13)), 0.7);
    RANGES.forEach(([a, b]) => {
      ctx.beginPath();
      const N = Math.max(10, Math.round((b - a) / TAU * 260));
      for (let i = 0; i <= N; i++) {
        const th = a + (b - a) * i / N;
        const p = P(th, Z_CRM + 0.6, R + 2.2 + bump(th));
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      }
      for (let i = N; i >= 0; i--) {
        const th = a + (b - a) * i / N;
        const p = P(th, Z_JAM - 0.3 + nCream(th) * 0.4 - bump(th) * 0.5, R + 2.2 + bump(th));
        ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.5, '#FBF5EE');
      g.addColorStop(1, '#DCCFC4');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(190,160,145,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    });
    // 奶油的亮點
    for (let k = 0; k < 13; k++) {
      const th = A2 + 0.08 + k * (Math.PI - A2 - 0.12) / 12;
      const p = P(th, Z_JAM + 4.2, R + 3);
      ctx.fillStyle = `rgba(255,255,255,${0.9 - Math.cos(th) * -0.2})`;
      ctx.beginPath(); ctx.ellipse(p[0] - 0.8, p[1] - 1.2, 2.2, 1.1, 0, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 切面（角度 A1 的平面，看得到四層） ---------- */
  function drawCut(ctx) {
    const co = Math.cos(A1), si = Math.sin(A1) * KR;
    ctx.save();
    ctx.transform(co, si, 0, -1, CX, CYB);   // (u = 半徑, v = 高度)
    ctx.beginPath(); ctx.rect(0, 0, R, H); ctx.clip();
    const rnd = K.rng(77);
    function sponge(v0, v1) {
      const g = ctx.createLinearGradient(0, v0, 0, v1);
      g.addColorStop(0, '#F3D27E');
      g.addColorStop(0.5, '#F8DE97');
      g.addColorStop(1, '#F6D88A');
      ctx.fillStyle = g; ctx.fillRect(0, v0, R, v1 - v0);
      for (let i = 0; i < 150; i++) {
        const u = rnd() * R, v = v0 + rnd() * (v1 - v0), r = 0.4 + rnd() * 0.9;
        ctx.fillStyle = 'rgba(200,145,60,0.38)';
        ctx.beginPath(); ctx.ellipse(u, v, r * 1.2, r, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,248,215,0.5)';
        ctx.beginPath(); ctx.ellipse(u - 0.4, v + 0.5, r * 0.7, r * 0.5, 0, 0, TAU); ctx.fill();
      }
      // 上下烤皮
      ctx.fillStyle = '#C98A3C'; ctx.fillRect(0, v1 - 1.6, R, 1.6);
      ctx.fillStyle = '#B87530'; ctx.fillRect(0, v0, R, 1.4);
      // 外側烤皮
      ctx.fillStyle = '#C07A2C'; ctx.fillRect(R - 1.6, v0, 1.6, v1 - v0);
    }
    sponge(0, Z_SP1);
    sponge(Z_CRM, H);
    // 果醬層
    ctx.beginPath();
    ctx.moveTo(0, Z_SP1);
    for (let u = 0; u <= R + 1; u += 3) ctx.lineTo(u, Z_JAM + Math.sin(u * 0.3) * 0.5);
    ctx.lineTo(R + 1, Z_SP1); ctx.closePath();
    ctx.fillStyle = '#C8142F'; ctx.fill();
    ctx.fillStyle = 'rgba(255,120,130,0.45)'; ctx.fillRect(0, Z_JAM - 1.4, R, 1);
    // 果醬裡的覆盆子籽
    ctx.fillStyle = 'rgba(255,215,160,0.8)';
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse(3 + rnd() * (R - 6), Z_SP1 + 1 + rnd() * 2.6, 0.55, 0.4, 0, 0, TAU); ctx.fill(); }
    // 鮮奶油層
    ctx.beginPath();
    ctx.moveTo(0, Z_JAM + 0.4);
    for (let u = 0; u <= R + 1; u += 3) ctx.lineTo(u, Z_JAM + Math.sin(u * 0.3) * 0.5);
    for (let u = R + 1; u >= 0; u -= 3) ctx.lineTo(u, Z_CRM + Math.sin(u * 0.21 + 1) * 0.6);
    ctx.closePath();
    const gc = ctx.createLinearGradient(0, Z_JAM, 0, Z_CRM);
    gc.addColorStop(0, '#F3E9E0'); gc.addColorStop(0.5, '#FFFFFF'); gc.addColorStop(1, '#F6EEE6');
    ctx.fillStyle = gc; ctx.fill();
    // 靠中心略暗、靠外側亮
    const gl = ctx.createLinearGradient(0, 0, R, 0);
    gl.addColorStop(0, 'rgba(120,70,30,0.16)');
    gl.addColorStop(0.5, 'rgba(120,70,30,0)');
    gl.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, R, H);
    ctx.restore();
    // 切面邊緣細線（中心垂直線、底邊）
    ctx.strokeStyle = 'rgba(150,95,40,0.55)'; ctx.lineWidth = 0.9;
    const a = C(0), b = C(H);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    const e = P(A1, 0);
    ctx.strokeStyle = 'rgba(130,70,20,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
  }

  /* ---------- 頂面（缺一塊的橢圓）＋糖粉 ---------- */
  function topPath(ctx) {
    ctx.beginPath();
    const c = C(H);
    ctx.moveTo(c[0], c[1]);
    const N = 150;
    for (let i = 0; i <= N; i++) {
      const th = A1 - (TAU - (A2 - A1)) * i / N;   // 從 A1 往回繞到 A2
      const p = P(th, H);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function drawTop(ctx) {
    topPath(ctx);
    const g = ctx.createRadialGradient(CX - 30, CYB - H - 16, 4, CX, CYB - H, R * 1.05);
    g.addColorStop(0, '#E9AE5C');
    g.addColorStop(0.6, '#D69442');
    g.addColorStop(1, '#BC7A2E');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    topPath(ctx); ctx.clip();
    // 糖粉：一層白霧＋細顆粒（中間較密）
    const gh = ctx.createRadialGradient(CX - 6, CYB - H - 2, 6, CX, CYB - H, R);
    gh.addColorStop(0, 'rgba(255,253,248,0.72)');
    gh.addColorStop(0.6, 'rgba(255,253,248,0.5)');
    gh.addColorStop(0.88, 'rgba(255,253,248,0.18)');
    gh.addColorStop(1, 'rgba(255,253,248,0.04)');
    ctx.fillStyle = gh;
    ctx.beginPath(); ctx.ellipse(CX, CYB - H, R, RY, 0, 0, TAU); ctx.fill();
    const rnd = K.rng(1840);
    for (let i = 0; i < 900; i++) {
      const a = rnd() * TAU, r = Math.pow(rnd(), 0.7);
      const x = CX + Math.cos(a) * r * R, y = CYB - H + Math.sin(a) * r * RY;
      const al = (1 - r * 0.6) * (0.5 + rnd() * 0.5);
      ctx.fillStyle = rnd() < 0.8 ? `rgba(255,255,255,${al})` : `rgba(200,170,140,${al * 0.35})`;
      ctx.fillRect(x, y, 0.8 + rnd() * 0.9, 0.7 + rnd() * 0.6);
    }
    // 右前方淡陰影
    const gd = ctx.createLinearGradient(CX - R, CYB - H - RY, CX + R, CYB - H + RY);
    gd.addColorStop(0.55, 'rgba(120,80,60,0)');
    gd.addColorStop(1, 'rgba(120,80,60,0.18)');
    ctx.fillStyle = gd; ctx.fillRect(0, 0, 200, 200);
    ctx.restore();
    // 頂緣圓角亮邊
    ctx.strokeStyle = 'rgba(255,240,215,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const th = A2 + 0.05 + (Math.PI - A2 - 0.05) * i / 40; const p = P(th, H - 1); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    // 切口邊
    ctx.strokeStyle = 'rgba(170,110,50,0.6)'; ctx.lineWidth = 1;
    const c = C(H), p1 = P(A1, H), p2 = P(A2, H);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }

  function draw(ctx) {
    drawCut(ctx);
    spongeSide(ctx, 0, Z_SP1, false);
    spongeSide(ctx, Z_CRM, H, true);
    fillingSide(ctx);
    drawTop(ctx);
    // 外輪廓：同色系細線
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(130,70,20,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 140; i++) {
      const th = A2 + (TAU - (A2 - A1)) * i / 140;
      const p = P(th, th > Math.PI && th < TAU ? H : 0);
      if (th > Math.PI && th < TAU) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    }
    ctx.stroke();
    // 底緣
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const th = A2 + (Math.PI - A2) * i / 60; const p = P(th, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    let q = P(Math.PI, H); ctx.lineTo(q[0], q[1]);
    ctx.stroke();
    ctx.beginPath();
    q = P(0, H); ctx.moveTo(q[0], q[1]);
    q = P(0, 0); ctx.lineTo(q[0], q[1]);
    for (let i = 0; i <= 10; i++) { const th = A1 * i / 10; const p = P(th, 0); ctx.lineTo(p[0], p[1]); }
    q = P(A1, H); ctx.lineTo(q[0], q[1]);
    ctx.stroke();
    // 切口前方的垂直稜
    ctx.strokeStyle = 'rgba(130,70,20,0.6)'; ctx.lineWidth = 1.4;
    q = P(A2, H); ctx.beginPath(); ctx.moveTo(q[0], q[1]); q = P(A2, 0); ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }

  window.DESSERTS['victoria'] = {
    draw,
    crumbs: ['#F8DE97', '#DC9C48', '#C8142F', '#FFFFFF', '#FFF8EE'],
    crunchy: 0.15,
  };
})();
