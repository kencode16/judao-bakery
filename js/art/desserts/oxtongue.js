/* 牛舌餅（oxtongue）
 * 像牛舌頭的長橢圓薄片（宜蘭薄脆款）：金黃、邊緣烤得較深、表面細小起泡、中間一道縱向的切痕。
 * 兩片疊放斜擺，看得出又薄又長；和長棍（斜劃痕、圓胖）、閃電泡芙（巧克力）、吉拿棒（星形紋）區分。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;
  const SP = 0.6;              // 平放的東西從斜上方看：縱深壓扁
  const T = 6;                 // 厚度（螢幕單位）

  // 舌形：一頭稍寬、一頭稍窄，邊緣有一點不規則
  function tongue(seed, L, Wd) {
    const r = K.rng(seed);
    const ph = [r() * TAU, r() * TAU];
    const pts = [];
    const N = 64;
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      const wide = 1 + 0.1 * c;                         // u>0 那頭寬一點
      const sq = Math.pow(Math.abs(s), 0.95) * Math.sign(s);
      const n = 1 + 0.018 * Math.sin(5 * a + ph[0]) + 0.012 * Math.sin(9 * a + ph[1]);
      pts.push([Math.sign(c) * Math.pow(Math.abs(c), 0.92) * L / 2 * n, sq * Wd / 2 * wide * n]);
    }
    return pts;
  }

  function place(ctx, cx, cy, rot) {
    ctx.translate(cx, cy);
    ctx.transform(1, 0, 0, SP, 0, 0);
    ctx.rotate(rot);
  }
  const path = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };

  function cookie(ctx, cx, cy, rot, L, Wd, seed, shade) {
    const pts = tongue(seed, L, Wd);
    // 側邊（厚度）：同一個形狀往下錯開
    ctx.save();
    ctx.translate(0, T);
    place(ctx, cx, cy, rot);
    path(ctx, pts);
    ctx.fillStyle = K.shade('#A9652A', shade);
    ctx.fill();
    ctx.restore();
    // 側邊的亮暗：中間幾層
    for (let k = 1; k < T; k += 1.5) {
      ctx.save();
      ctx.translate(0, k);
      place(ctx, cx, cy, rot);
      path(ctx, pts);
      ctx.fillStyle = k < 3 ? K.shade('#D99A50', shade) : K.shade('#C07E3C', shade);
      ctx.fill();
      ctx.restore();
    }

    // 頂面
    ctx.save();
    place(ctx, cx, cy, rot);
    path(ctx, pts);
    const g = ctx.createRadialGradient(-L * 0.12, -Wd * 0.2, 4, 0, 0, L * 0.55);
    g.addColorStop(0, K.shade('#FADF9E', shade));
    g.addColorStop(0.45, K.shade('#EEBF6C', shade));
    g.addColorStop(0.8, K.shade('#D18E3E', shade));
    g.addColorStop(1, K.shade('#B06C28', shade));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path(ctx, pts); ctx.clip();
    // 邊緣一圈烤得較深
    ctx.strokeStyle = 'rgba(150,80,24,0.45)';
    ctx.lineWidth = 9;
    path(ctx, pts); ctx.stroke();
    // 細小起泡：亮點＋下緣小陰影
    const r = K.rng(seed * 7 + 1);
    for (let i = 0; i < 46; i++) {
      const u = (r() - 0.5) * L * 0.86, v = (r() - 0.5) * Wd * 0.75 * Math.sqrt(1 - Math.pow(2 * u / L, 2));
      const rr = 1.2 + r() * 2.4;
      ctx.fillStyle = 'rgba(160,92,30,0.3)';
      ctx.beginPath(); ctx.ellipse(u + 0.6, v + 1.2, rr, rr * 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,232,170,0.7)';
      ctx.beginPath(); ctx.ellipse(u - 0.2, v - 0.2, rr * 0.8, rr * 0.6, 0, 0, TAU); ctx.fill();
    }
    // 烤色斑點
    for (let i = 0; i < 10; i++) {
      const u = (r() - 0.5) * L * 0.8, v = (r() - 0.5) * Wd * 0.6;
      ctx.fillStyle = `rgba(170,96,30,${0.06 + r() * 0.08})`;
      ctx.beginPath(); ctx.ellipse(u, v, 4 + r() * 7, 2 + r() * 3, r() * 3, 0, TAU); ctx.fill();
    }
    // 中間一道縱向切痕：深色縫＋兩側亮唇
    const sl = L * 0.32;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,230,170,0.85)';
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(-sl, -2.2); ctx.quadraticCurveTo(0, -3.6, sl, -1.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,56,16,0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-sl, 0); ctx.quadraticCurveTo(0, -1.4, sl, 0.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(176,104,40,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-sl + 2, 2.6); ctx.quadraticCurveTo(0, 1.4, sl - 2, 2.8); ctx.stroke();
    // 左上高光
    ctx.strokeStyle = 'rgba(255,246,214,0.6)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 36; i < 56; i++) { const p = pts[i]; i === 36 ? ctx.moveTo(p[0] * 0.93, p[1] * 0.8) : ctx.lineTo(p[0] * 0.93, p[1] * 0.8); }
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 外輪廓（頂面＋側面）
    ctx.save();
    place(ctx, cx, cy, rot);
    path(ctx, pts);
    ctx.restore();
    ctx.save();
    ctx.translate(0, T);
    place(ctx, cx, cy, rot);
    path(ctx, pts);
    ctx.restore();
    ctx.strokeStyle = 'rgba(122,62,18,0.55)';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.save(); place(ctx, cx, cy, rot); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.restore();
    ctx.stroke();
    ctx.beginPath();
    ctx.save(); ctx.translate(0, T); place(ctx, cx, cy, rot); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.restore();
    ctx.stroke();
  }

  function draw(ctx) {
    cookie(ctx, 86, 90, -0.72, 158, 78, 3, -0.05);
    cookie(ctx, 107, 110, -0.62, 166, 84, 7, 0);
  }

  window.DESSERTS['oxtongue'] = {
    draw,
    crumbs: ['#EBB863', '#F7D58E', '#D18E3E', '#B06C28', '#FFE8B0'],
    crunchy: 0.85,
  };
})();
