/* 粉紅馬卡龍（覆盆子／玫瑰色），斜上方三分之四俯視
 * 做法：把馬卡龍當成由下而上疊起來的五個「旋轉體」，
 *   下殼（圓頂朝下）→ 下裙邊 → 奶油餡（內縮）→ 上裙邊 → 上殼（光滑圓頂）
 * 每層用剖面半徑 r(z) 投影出外輪廓，由下往上依序畫（畫家演算法）。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  /* ---------- 幾何 ---------- */
  const PHI = 35 * Math.PI / 180;            // 俯視角
  const SP = Math.sin(PHI), CP = Math.cos(PHI);
  const CX = 100;
  const R = 78;                              // 外殼半徑
  const RC = R * 0.94;                       // 奶油餡上下緣半徑（內縮）
  const CB = 2.6;                            // 奶油餡中段往外鼓
  const Zb0 = 0, Zb1 = 20, Zf1 = 30, Zc1 = 58, Zf2 = 68, Zt1 = 90;
  const NT = 2.7, NB = 3.5;                  // 上殼、下殼的「靠墊形」指數

  function cushion(t, n) {
    t = Math.min(1, Math.max(0, t));
    return Math.pow(1 - Math.pow(t, n), 1 / n);
  }
  const rBottom = z => R * cushion((Zb1 - z) / (Zb1 - Zb0), NB);
  const rFoot = () => R;
  const rCream = z => RC + CB * Math.sin(Math.PI * (z - Zf1) / (Zc1 - Zf1));
  const rTop = z => R * cushion((z - Zf2) / (Zt1 - Zf2), NT);
  const zTopAt = rho => Zf2 + (Zt1 - Zf2) * cushion(rho / R, NT);

  // 讓整顆馬卡龍垂直置中
  let Y0 = 0;
  (function () {
    let mn = Infinity, mx = -Infinity;
    for (let j = 0; j <= 200; j++) {
      const z = Zf2 + (Zt1 - Zf2) * j / 200;
      mn = Math.min(mn, -z * CP - rTop(z) * SP);
      const zb = Zb0 + (Zb1 - Zb0) * j / 200;
      mx = Math.max(mx, -zb * CP + rBottom(zb) * SP);
    }
    Y0 = 100 - (mn + mx) / 2;
  })();
  const yz = z => Y0 - z * CP;
  const proj = (rho, ang, z) => [CX + rho * Math.cos(ang), yz(z) + SP * rho * Math.sin(ang)];

  // 旋轉體在 z0～z1 之間的投影外輪廓：回傳上緣與下緣點列
  function sil(rf, z0, z1, rmax, nz) {
    const top = [], bot = [], NX = 110;
    for (let i = 0; i <= NX; i++) {
      const x = rmax * Math.cos(Math.PI * (1 - i / NX)) * 0.99999;
      let yt = Infinity, yb = -Infinity;
      for (let j = 0; j <= nz; j++) {
        const z = z0 + (z1 - z0) * j / nz;
        const r = rf(z);
        if (r < Math.abs(x)) continue;
        const h = SP * Math.sqrt(r * r - x * x), yc = yz(z);
        if (yc - h < yt) yt = yc - h;
        if (yc + h > yb) yb = yc + h;
      }
      if (yt !== Infinity) { top.push([CX + x, yt]); bot.push([CX + x, yb]); }
    }
    return { top, bot };
  }
  function poly(ctx, s) {
    ctx.moveTo(s.top[0][0], s.top[0][1]);
    for (const p of s.top) ctx.lineTo(p[0], p[1]);
    for (let i = s.bot.length - 1; i >= 0; i--) ctx.lineTo(s.bot[i][0], s.bot[i][1]);
    ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry, rot) {
    rot = rot || 0;
    ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  }
  // 高度 z、半徑 r 的水平圓（投影成橢圓）的前半段弧
  function frontArc(ctx, z, r, a0, a1) {
    ctx.ellipse(CX, yz(z), r, r * SP, 0, a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI : a1);
  }
  function mix(a, b, t) {
    const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
    const f = (s) => Math.round(((p >> s) & 255) + (((q >> s) & 255) - ((p >> s) & 255)) * t);
    return '#' + ((1 << 24) + (f(16) << 16) + (f(8) << 8) + f(0)).toString(16).slice(1);
  }

  /* ---------- 預先算好的形狀 ---------- */
  const S = {
    bottom: sil(rBottom, Zb0, Zb1, R, 60),
    foot1: sil(rFoot, Zb1, Zf1, R, 4),
    cream: sil(rCream, Zf1, Zc1, RC + CB, 48),
    foot2: sil(rFoot, Zc1, Zf2, R, 4),
    top: sil(rTop, Zf2, Zt1, R, 60),
  };
  // 裙邊在左右兩端往外凸的小皺褶
  function sideBumps(z0, z1, seed) {
    const rnd = K.rng(seed), out = [];
    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const z = z0 + (z1 - z0) * (0.22 + 0.6 * (k + rnd() * 0.5) / 3);
        out.push({ x: CX + side * (R + 0.1 + rnd() * 0.5), y: yz(z), rx: 1.0 + rnd() * 0.6, ry: 1.0 + rnd() * 0.5 });
      }
    }
    return out;
  }
  const B1 = sideBumps(Zb1, Zf1, 11), B2 = sideBumps(Zc1, Zf2, 23);

  // 霧面的細小顆粒（極淡，縮小時看不到）
  function speckle(ctx, seed, n, region, aLight, aDark) {
    const rnd = K.rng(seed);
    for (let i = 0; i < n; i++) {
      const p = region(rnd);
      ctx.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${aLight})` : `rgba(180,50,100,${aDark})`;
      ctx.beginPath(); ctx.arc(p[0], p[1], 0.35 + rnd() * 0.5, 0, TAU); ctx.fill();
    }
  }

  /* ---------- 各層 ---------- */
  function drawBottomShell(ctx) {
    ctx.save();
    ctx.beginPath(); poly(ctx, S.bottom); ctx.clip();
    let g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    g.addColorStop(0, '#f08cae'); g.addColorStop(0.25, '#f27ea5');
    g.addColorStop(0.65, '#e66892'); g.addColorStop(1, '#c64c7a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 往下彎進去的部分比較暗
    const yTop = yz(Zb1) + R * SP, yBot = S.bottom.bot[Math.floor(S.bottom.bot.length / 2)][1];
    g = ctx.createLinearGradient(0, yTop - 4, 0, yBot);
    g.addColorStop(0, 'rgba(160,40,90,0)'); g.addColorStop(0.55, 'rgba(160,40,90,0.12)');
    g.addColorStop(1, 'rgba(140,30,80,0.32)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 底緣的反光
    ctx.strokeStyle = 'rgba(255,200,215,0.28)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    S.bottom.bot.forEach((p, i) => { const y = p[1] - 2.6; i ? ctx.lineTo(p[0], y) : ctx.moveTo(p[0], y); });
    ctx.stroke();
    speckle(ctx, 31, 110, (rnd) => {
      const z = Zb0 + 4 + (Zb1 - Zb0 - 4) * rnd(), a = Math.PI * rnd();
      return proj(rBottom(z), a, z);
    }, 0.12, 0.09);
    ctx.restore();
  }

  function footGradient(ctx) {
    const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    g.addColorStop(0, '#efb1c4'); g.addColorStop(0.18, '#f9cad7');
    g.addColorStop(0.55, '#f3b9ca'); g.addColorStop(0.85, '#e09bb3'); g.addColorStop(1, '#c97e9b');
    return g;
  }

  function drawFoot(ctx, z0, z1, seed, bumps, isTop) {
    const s = isTop ? S.foot2 : S.foot1;
    const g = footGradient(ctx);
    const band = (z1 - z0) * CP;
    ctx.save();
    ctx.beginPath(); poly(ctx, s);
    for (const b of bumps) ell(ctx, b.x, b.y, b.rx, b.ry);
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    if (!isTop) {
      // 下殼裙邊的頂面（奶油餡前面露出的一圈），和裙邊同色、稍亮
      const gt = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
      gt.addColorStop(0, '#f6c3d1'); gt.addColorStop(0.3, '#fbd6e0'); gt.addColorStop(1, '#e3a5ba');
      ctx.beginPath(); ctx.ellipse(CX, yz(z1), R, R * SP, 0, 0, TAU);
      ctx.fillStyle = gt; ctx.fill();
      // 奶油餡貼著的接觸陰影
      ctx.strokeStyle = 'rgba(170,80,110,0.28)'; ctx.lineWidth = 2.6;
      ctx.beginPath(); frontArc(ctx, z1, RC + 0.4); ctx.stroke();
    }
    // 皺褶氣泡紋理
    const rnd = K.rng(seed);
    const N = 96;
    for (let i = 0; i < N; i++) {
      const th = Math.PI * (i + 0.5 + (rnd() - 0.5) * 0.8) / N;
      const sn = Math.sin(th), cs = Math.cos(th);
      const x = CX + R * cs;
      const yT = yz(z1) + R * SP * sn, yB = yz(z0) + R * SP * sn;
      const cw = Math.max(0.45, (Math.PI * R / N) * sn);
      const lit = (1 - cs) / 2;
      // 短短的縱向皺摺（不連到頂，避免變成梳子條紋）
      if (rnd() < 0.75) {
        const y1 = yT + band * (0.2 + 0.35 * rnd());
        ctx.strokeStyle = K.rgba('#b4557c', 0.10 + 0.20 * (1 - lit));
        ctx.lineWidth = 0.3 + 0.35 * sn;
        ctx.beginPath(); ctx.moveTo(x, y1);
        ctx.quadraticCurveTo(x + (rnd() - 0.5) * 1.4 * sn, (y1 + yB) / 2, x + (rnd() - 0.5) * 1.0 * sn, yB + 0.4);
        ctx.stroke();
      }
      // 氣泡：上中下三排，大小不一
      for (let k = 0; k < 3; k++) {
        if (rnd() < 0.18) continue;
        const by = yT + band * (0.2 + 0.3 * k + (rnd() - 0.5) * 0.16);
        const bry = band * (0.08 + 0.09 * rnd());
        const brx = cw * (0.22 + 0.28 * rnd());
        const bx = x + (rnd() - 0.5) * cw * 0.5;
        ctx.fillStyle = K.rgba(mix('#eda9bf', '#fff4f7', 0.1 + 0.85 * lit), 0.5 + 0.4 * rnd());
        ctx.beginPath(); ell(ctx, bx, by, brx, bry); ctx.fill();
        if (rnd() < 0.45) {   // 氣泡下方的小孔影
          ctx.fillStyle = K.rgba('#a9466f', 0.22 + 0.18 * rnd());
          ctx.beginPath(); ell(ctx, bx + brx * 0.2, by + bry * 1.1, brx * 0.55, bry * 0.45); ctx.fill();
        }
      }
    }
    if (isTop) {
      // 上殼邊緣壓在裙邊上的陰影
      for (const [lw, a] of [[6, 0.09], [3, 0.15]]) {
        ctx.strokeStyle = `rgba(150,40,85,${a})`; ctx.lineWidth = lw;
        ctx.beginPath(); frontArc(ctx, z1, R); ctx.stroke();
      }
    } else {
      // 下裙邊頂緣受光
      ctx.strokeStyle = 'rgba(255,236,242,0.55)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); frontArc(ctx, z1, R - 0.6, 0.35 * Math.PI, 0.97 * Math.PI); ctx.stroke();
    }
    ctx.restore();
    // 下緣：不規則的蕾絲小凸起
    const rl = K.rng(seed + 7);
    const NL = 70;
    for (let i = 0; i < NL; i++) {
      const th = Math.PI * (i + 0.5 + (rl() - 0.5) * 0.6) / NL;
      const sn = Math.sin(th), cs = Math.cos(th);
      const x = CX + R * cs, yB = yz(z0) + R * SP * sn;
      const rx = Math.max(0.45, (Math.PI * R / NL) * sn * (0.3 + 0.3 * rl()));
      const ry = 0.5 + 1.0 * rl();
      ctx.fillStyle = g;
      ctx.beginPath(); ell(ctx, x, yB - 0.3, rx, ry); ctx.fill();
      ctx.strokeStyle = 'rgba(160,55,95,0.18)'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.ellipse(x, yB - 0.3, rx, ry, 0, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    }
  }

  function drawCream(ctx) {
    ctx.save();
    ctx.beginPath(); poly(ctx, S.cream); ctx.clip();
    const w = RC + CB;
    let g = ctx.createLinearGradient(CX - w, 0, CX + w, 0);
    g.addColorStop(0, '#efd9d0'); g.addColorStop(0.1, '#fffaf5'); g.addColorStop(0.45, '#fff4ec');
    g.addColorStop(0.8, '#f4ded5'); g.addColorStop(1, '#dbb7af');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 奶油被夾扁後的細微抹痕（極淡的橫向紋）
    const rc = K.rng(55);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const z = Zf1 + 3 + (Zc1 - Zf1 - 6) * rc();
      const a0 = (0.08 + 0.7 * rc()) * Math.PI, a1 = Math.min(0.98 * Math.PI, a0 + (0.12 + 0.25 * rc()) * Math.PI);
      ctx.strokeStyle = rc() < 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(200,150,140,0.11)';
      ctx.lineWidth = 0.8 + 0.8 * rc();
      ctx.beginPath(); frontArc(ctx, z, rCream(z) - 0.2, a0, a1); ctx.stroke();
    }
    // 中段鼓起的光澤
    g = ctx.createLinearGradient(CX - w, 0, CX + w * 0.6, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.28, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    const zm = (Zf1 + Zc1) / 2 - 1;
    ctx.beginPath(); frontArc(ctx, zm, w - 0.3, 0.45 * Math.PI, 0.96 * Math.PI); ctx.stroke();
    // 上方裙邊壓下的陰影
    for (const [lw, a] of [[14, 0.05], [9, 0.07], [4.5, 0.11]]) {
      ctx.strokeStyle = `rgba(165,90,100,${a})`; ctx.lineWidth = lw;
      ctx.beginPath(); frontArc(ctx, Zc1, R); ctx.stroke();
    }
    // 底部接觸陰影
    ctx.strokeStyle = 'rgba(165,95,100,0.14)'; ctx.lineWidth = 3;
    ctx.beginPath(); frontArc(ctx, Zf1, RC); ctx.stroke();
    ctx.restore();
  }

  function drawTopShell(ctx) {
    const [hx, hy] = proj(R * 0.4, -2.2, zTopAt(R * 0.4));
    ctx.save();
    ctx.beginPath(); poly(ctx, S.top); ctx.clip();
    // 主體：左上亮、右下暗的橢圓放射漸層
    ctx.save();
    ctx.translate(hx, hy); ctx.scale(1, 0.62);
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.65);
    g.addColorStop(0, '#ffc8da'); g.addColorStop(0.25, '#fa9fbe');
    g.addColorStop(0.55, '#f27ca4'); g.addColorStop(0.82, '#e4648f'); g.addColorStop(1, '#c84d7b');
    ctx.fillStyle = g; ctx.fillRect(-300, -400, 600, 800);
    ctx.restore();
    // 殼的側壁（靠近裙邊的一圈）比較暗：沿殼面上的等高線一圈圈疊上淡淡的暗色，
    // 越低越暗，兩端自然收進輪廓裡（不會在左右兩端留下斷口）
    const NS = 16;
    for (let j = 0; j < NS; j++) {
      const z = Zf2 + j * 0.85, r = rTop(z);
      const a = 0.15 * Math.pow(1 - j / NS, 1.6);
      ctx.strokeStyle = `rgba(150,35,85,${a})`; ctx.lineWidth = 1.7;
      ctx.beginPath(); frontArc(ctx, z, r, -0.3, Math.PI + 0.3); ctx.stroke();
    }
    // 圓角肩部（左前方）微微受光，讓頂殼看起來是隆起的
    g = ctx.createLinearGradient(CX - R, 0, CX + R * 0.3, 0);
    g.addColorStop(0, 'rgba(255,214,228,0)'); g.addColorStop(0.3, 'rgba(255,214,228,0.07)');
    g.addColorStop(1, 'rgba(255,214,228,0)');
    ctx.strokeStyle = g;
    for (const lw of [9, 6, 3.5]) {
      ctx.lineWidth = lw;
      const zs = Zf2 + 9, rs = rTop(zs);
      ctx.beginPath(); frontArc(ctx, zs, rs - 1.5, 0.5 * Math.PI, 1.02 * Math.PI); ctx.stroke();
    }
    // 霧面顆粒
    speckle(ctx, 77, 300, (rnd) => {
      const rho = R * Math.sqrt(rnd()) * 0.97, a = rnd() * TAU;
      return proj(rho, a, zTopAt(rho));
    }, 0.09, 0.08);
    // 大片柔和光澤
    ctx.save();
    ctx.translate(hx, hy); ctx.rotate(-0.22); ctx.scale(1, 0.42);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.55);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,240,246,0.25)');
    g.addColorStop(1, 'rgba(255,240,246,0)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R * 2, R * 2, R * 4);
    ctx.restore();
    // 小亮點
    ctx.save();
    ctx.translate(hx - 4, hy - 2); ctx.rotate(-0.25); ctx.scale(1, 0.4);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.17);
    g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();
    // 左上邊緣的輪廓光（很淡）
    g = ctx.createLinearGradient(CX - R, 0, CX + 10, 0);
    g.addColorStop(0, 'rgba(255,225,235,0.0)'); g.addColorStop(0.25, 'rgba(255,225,235,0.32)');
    g.addColorStop(1, 'rgba(255,225,235,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    let first = true;
    for (const p of S.top.top) {
      if (p[0] > CX + 10) break;
      const dx = (CX - p[0]) / R;
      first ? ctx.moveTo(p[0] + 2.2 * dx, p[1] + 2.4) : ctx.lineTo(p[0] + 2.2 * dx, p[1] + 2.4);
      first = false;
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    // 外輪廓：先畫一圈同色系深色線，之後每層蓋上去，只留下外側一圈
    ctx.save();
    ctx.beginPath();
    for (const k of ['bottom', 'foot1', 'cream', 'foot2', 'top']) poly(ctx, S[k]);
    for (const b of B1.concat(B2)) ell(ctx, b.x, b.y, b.rx, b.ry);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(176,58,104,0.55)'; ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.restore();

    drawBottomShell(ctx);
    drawFoot(ctx, Zb1, Zf1, 101, B1, false);
    drawCream(ctx);
    drawFoot(ctx, Zc1, Zf2, 202, B2, true);
    drawTopShell(ctx);
  }

  window.DESSERTS['macaron'] = { draw };
})();
