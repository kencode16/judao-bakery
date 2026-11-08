/* 吉拿棒（Churros）
 * 三根星形紋長條排成扇形：表面一道道直的星形稜線（亮稜＋暗溝），裹滿砂糖粒，
 * 左下的切口露出星星形狀的斷面；兩根的另一頭沾了亮亮的巧克力醬。
 * 這是和長棍麵包、閃電泡芙等長條形分開的關鍵：星形紋＋星形斷面＋巧克力醬。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const R = 13.5, NR = 8;                  // 半徑、稜數
  const LIGHT = [-0.55, 0.83];             // 斷面座標（y 往上為負、z 朝向觀眾）的光線方向

  function churro(ctx, cx, cy, rot, L, choc, seed) {
    const rnd = K.rng(seed);
    const hl = L / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot);
    // 本地座標：x 沿長邊（-hl 是左下的斷面端），y 垂直

    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(-hl, -R);
      // 上緣微微的稜線起伏
      for (let x = -hl; x <= hl; x += 6) ctx.lineTo(x, -R + Math.sin(x * 0.4 + seed) * 0.25);
      ctx.ellipse(hl, 0, R * 0.42, R, 0, -Math.PI / 2, Math.PI / 2, false);
      for (let x = hl; x >= -hl; x -= 6) ctx.lineTo(x, R + Math.sin(x * 0.37 + seed) * 0.25);
      ctx.closePath();
    };
    // 外輪廓（後面）
    bodyPath();
    ctx.strokeStyle = 'rgba(110,56,18,0.85)'; ctx.lineWidth = 2.3; ctx.stroke();
    bodyPath();
    ctx.fillStyle = '#B86E28'; ctx.fill();
    ctx.save();
    bodyPath(); ctx.clip();
    // 星形稜線：每一條稜依法線方向決定亮暗，溝是暗線
    const off = 0.2;
    for (let k = 0; k < NR * 2; k++) {
      const ph = off + k / (NR * 2) * TAU;          // 偶數 = 稜線、奇數 = 溝
      const z = Math.cos(ph), y = -Math.sin(ph);
      if (z < -0.05) continue;
      const yy = y * R;
      const ridge = k % 2 === 0;
      const lit = Math.max(0, LIGHT[0] * y + LIGHT[1] * z);
      const w = (R * TAU / (NR * 2)) * Math.max(0.15, z) * 1.05;
      if (ridge) {
        const c = Math.round(168 + lit * 76), c2 = Math.round(96 + lit * 92), c3 = Math.round(36 + lit * 62);
        ctx.fillStyle = `rgb(${c},${c2},${c3})`;
        ctx.fillRect(-hl - 2, yy - w / 2, L + 4, w);
        ctx.fillStyle = `rgba(255,226,170,${0.15 + lit * 0.5})`;     // 稜線最亮的一條
        ctx.fillRect(-hl - 2, yy - w * 0.12, L + 4, Math.max(0.6, w * 0.22));
      } else {
        ctx.fillStyle = `rgba(92,40,8,${0.65 + (1 - z) * 0.2})`;
        ctx.fillRect(-hl - 2, yy - Math.max(0.5, w * 0.16), L + 4, Math.max(1, w * 0.32));
      }
    }
    // 整體立體感
    const gv = ctx.createLinearGradient(0, -R, 0, R);
    gv.addColorStop(0, 'rgba(255,240,210,0.12)'); gv.addColorStop(0.6, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(90,40,10,0.35)');
    ctx.fillStyle = gv; ctx.fillRect(-hl - 2, -R, L + 4, R * 2);
    // 砂糖粒
    for (let i = 0; i < 70; i++) {
      const x = -hl + rnd() * L, y = (rnd() * 2 - 1) * R * 0.9;
      const s = 0.55 + rnd() * 0.85;
      ctx.fillStyle = `rgba(255,255,255,${0.65 + rnd() * 0.35})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (rnd() < 0.3) { ctx.fillStyle = 'rgba(140,80,30,0.5)'; ctx.fillRect(x + s, y + 0.3, 0.7, 0.7); }  // 肉桂
    }
    ctx.restore();

    // 另一頭沾巧克力醬
    if (choc) {
      const x0 = hl - choc;
      const cp = () => {
        ctx.beginPath();
        ctx.moveTo(x0 + 3, -R - 1.2);
        ctx.lineTo(hl, -R - 1.2);
        ctx.ellipse(hl, 0, R * 0.42 + 1.2, R + 1.2, 0, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(x0 + 6, R + 1.2);
        // 下緣多一滴往下流
        ctx.quadraticCurveTo(x0 + 4, R + 7, x0 + 1, R + 6.5);
        ctx.quadraticCurveTo(x0 - 2, R + 6, x0 - 1, R - 2);
        for (let y = R - 2; y >= -R; y -= 3) ctx.lineTo(x0 + Math.sin(y * 0.5 + seed) * 2.2, y);
        ctx.closePath();
      };
      cp();
      const g = ctx.createLinearGradient(0, -R, 0, R + 6);
      g.addColorStop(0, '#7A4128'); g.addColorStop(0.3, '#4E2414'); g.addColorStop(1, '#2A1008');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(30,10,4,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
      // 巧克力下透出的稜線起伏
      ctx.save(); cp(); ctx.clip();
      for (let k = 0; k < NR; k++) {
        const ph = 0.2 + k / NR * TAU, z = Math.cos(ph);
        if (z < 0) continue;
        const yy = -Math.sin(ph) * R;
        ctx.fillStyle = 'rgba(160,100,70,0.22)';
        ctx.fillRect(x0 - 4, yy - 0.8, choc + 10, 1.6);
      }
      // 鏡面反光
      ctx.fillStyle = 'rgba(255,230,210,0.75)';
      ctx.beginPath(); ctx.ellipse(x0 + choc * 0.5, -R * 0.55, choc * 0.32, 1.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(x0 + choc * 0.36, -R * 0.58, 2.6, 0.9, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // 左下端：星形斷面
    ctx.save();
    ctx.translate(-hl, 0);
    ctx.scale(0.5, 1);
    const star = (ro, ri) => {
      ctx.beginPath();
      for (let i = 0; i < NR * 2; i++) {
        const a = 0.2 + i / (NR * 2) * TAU, r = i % 2 ? ri : ro;
        const x = Math.cos(a) * r, y = -Math.sin(a) * r;
        i ? ctx.lineTo(-Math.abs(x) * 0 + x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
    };
    star(R + 1.5, R * 0.72);
    ctx.fillStyle = '#B36A26'; ctx.fill();
    ctx.strokeStyle = 'rgba(100,48,14,0.9)'; ctx.lineWidth = 1.8; ctx.stroke();
    star(R - 1.2, R * 0.6);
    const gi = ctx.createRadialGradient(-2, -2, 0.5, 0, 0, R);
    gi.addColorStop(0, '#FFF1C8'); gi.addColorStop(0.6, '#F4D28C'); gi.addColorStop(1, '#D9A055');
    ctx.fillStyle = gi; ctx.fill();
    // 中心的空心小孔
    ctx.fillStyle = 'rgba(190,130,60,0.6)';
    ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function draw(ctx) {
    churro(ctx, 100, 70, -0.28, 146, 42, 3);
    churro(ctx, 92, 88, -0.6, 148, 0, 7);
    churro(ctx, 84, 102, -0.94, 136, 40, 11);
  }

  window.DESSERTS['churros'] = {
    draw,
    crumbs: ['#D99A4E', '#F2C27E', '#FFFFFF', '#4E2414', '#9A5A22'],
    crunchy: 0.8,
  };
})();
