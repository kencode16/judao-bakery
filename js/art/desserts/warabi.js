/* 蕨餅（わらび餅）
 * 四塊軟 Q 的圓角小方塊疊成一小堆（下排三塊、上面一塊）：半透明、透得到背後的邊（像果凍），
 * 頂面堆滿黃豆粉（きな粉），最上面那塊淋了一攤深色黑糖蜜，沿著側面往下流。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;
  const SP = 0.7, CP = 0.72;
  const S = 50, RAD = 14;                        // 方塊邊長、圓角

  const CUBES = [
    { x: 57, y: 140, yaw: 0.78, seed: 1 },
    { x: 143, y: 143, yaw: 0.32, seed: 2, syrup: 1 },
    { x: 100, y: 160, yaw: 0.56, seed: 3, syrup: 1 },
    { x: 99, y: 117, yaw: 0.44, seed: 4, z0: 44, syrup: 2 },
  ];

  function cubeGeo(c) {
    const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw), z0 = c.z0 || 0;
    const P = (x, y, z) => [c.x + x * cs - y * sn, c.y + (x * sn + y * cs) * SP - (z + z0) * CP];
    const h = S / 2;
    return {
      t: [P(-h, -h, S), P(h, -h, S), P(h, h, S), P(-h, h, S)],   // 頂面：後左、後右、前右、前左
      b: [P(-h, -h, 0), P(h, -h, 0), P(h, h, 0), P(-h, h, 0)],
    };
  }
  function rrect(ctx, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r);
    ctx.lineTo(w, h - r); ctx.arcTo(w, h, w - r, h, r);
    ctx.lineTo(r, h); ctx.arcTo(0, h, 0, h - r, r);
    ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
  }
  function hull(ctx, g) {
    const pts = [g.t[0], g.t[1], g.b[1], g.b[2], g.b[3], g.t[3]];
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  }
  // 以三點（原點、u 端、v 端）建立面座標，在 0～S 的方形裡畫
  function onFace(ctx, o, pu, pv, fn) {
    ctx.save();
    ctx.transform((pu[0] - o[0]) / S, (pu[1] - o[1]) / S, (pv[0] - o[0]) / S, (pv[1] - o[1]) / S, o[0], o[1]);
    fn();
    ctx.restore();
  }
  function blob(ctx, cx, cy, rx, ry, seed, amp) {
    const r = K.rng(seed), H = [];
    for (let k = 2; k <= 5; k++) H.push([k, r() * TAU, (0.5 + r() * 0.5) / k]);
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * TAU;
      let d = 1; for (const h of H) d += amp * h[2] * Math.sin(h[0] * a + h[1]);
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  const SYRUP = '#3E180A';

  function drawCube(ctx, c) {
    const g = cubeGeo(c);
    const rnd = K.rng(c.seed * 31);
    const [t0, t1, t2, t3] = g.t, [b0, b1, b2, b3] = g.b;

    // 圓角外形（粗描邊做圓角）＋外輪廓
    const gs = ctx.createLinearGradient(t3[0] - 6, t3[1] - 6, b1[0] + 6, b1[1] + 6);
    gs.addColorStop(0, '#F6ECD8');
    gs.addColorStop(0.45, '#DDC9A6');
    gs.addColorStop(1, '#B89C72');
    ctx.lineJoin = 'round';
    hull(ctx, g);
    ctx.strokeStyle = 'rgba(125,100,70,0.7)'; ctx.lineWidth = RAD + 3.4; ctx.stroke();
    ctx.strokeStyle = gs; ctx.lineWidth = RAD; ctx.stroke();
    ctx.fillStyle = gs; ctx.fill();

    // 半透明的果凍側面
    ctx.save();
    hull(ctx, g); ctx.clip();
    // 右側面暗一點
    ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(t1[0], t1[1]); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.closePath();
    ctx.fillStyle = 'rgba(120,98,66,0.22)'; ctx.fill();
    // 透過果凍看到的「背後的邊」
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(150,128,95,0.4)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b3[0], b3[1]); ctx.lineTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]);
    ctx.moveTo(b0[0], b0[1]); ctx.lineTo(t0[0], t0[1]);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(b3[0] + 1, b3[1] - 1.2); ctx.lineTo(b0[0] + 1, b0[1] - 1.2); ctx.lineTo(b1[0] - 1, b1[1] - 1.2);
    ctx.stroke();
    // 底部的折射亮光
    const mx = (b2[0] + b3[0]) / 2, my = (b2[1] + b3[1]) / 2 - 8;
    const gr = ctx.createRadialGradient(mx, my, 1, mx, my, 20);
    gr.addColorStop(0, 'rgba(255,252,240,0.7)');
    gr.addColorStop(1, 'rgba(255,252,240,0)');
    ctx.fillStyle = gr; ctx.fillRect(mx - 22, my - 22, 44, 44);
    // 前面兩條直邊的亮線（Q 彈的光澤）
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(t3[0] + 2.5, t3[1] + 9); ctx.lineTo(b3[0] + 2.5, b3[1] - 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(t2[0] - 1, t2[1] + 9); ctx.lineTo(b2[0] - 1, b2[1] - 6); ctx.stroke();
    ctx.restore();

    // 前面、右面上緣灑落的黃豆粉
    for (const [o, pu] of [[t3, t2], [t2, t1]]) {
      onFace(ctx, o, pu, [o[0], o[1] + S * CP], () => {
        ctx.save(); rrect(ctx, S, S, 4); ctx.clip();
        const gk = ctx.createLinearGradient(0, 0, 0, S * 0.62);
        gk.addColorStop(0, 'rgba(226,186,112,0.97)');
        gk.addColorStop(0.45, 'rgba(226,186,112,0.6)');
        gk.addColorStop(1, 'rgba(226,186,112,0)');
        ctx.fillStyle = gk; ctx.fillRect(0, 0, S, S * 0.65);
        // 粉一塊一塊黏在側面
        for (let i = 0; i < 4; i++) {
          blob(ctx, 6 + rnd() * (S - 12), S * (0.3 + rnd() * 0.35), 4 + rnd() * 5, 3 + rnd() * 3, c.seed * 50 + i, 0.5);
          ctx.fillStyle = 'rgba(226,186,112,0.7)'; ctx.fill();
        }
        for (let i = 0; i < 40; i++) {
          const x = rnd() * S, y = Math.pow(rnd(), 1.6) * S * 0.85;
          ctx.fillStyle = rnd() < 0.6 ? 'rgba(200,155,80,0.75)' : 'rgba(245,222,165,0.85)';
          ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd() * 0.8, 0, TAU); ctx.fill();
        }
        ctx.restore();
      });
    }

    // 頂面：堆滿黃豆粉（邊緣微微溢出）
    onFace(ctx, t0, t1, t3, () => {
      blob(ctx, S / 2, S / 2, S * 0.6, S * 0.6, c.seed * 7, 0.14);
      const gk = ctx.createLinearGradient(0, 0, S, S);
      gk.addColorStop(0, '#F2D79C');
      gk.addColorStop(0.5, '#E3BE77');
      gk.addColorStop(1, '#CFA25C');
      ctx.fillStyle = gk; ctx.fill();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 80; i++) {
        const x = rnd() * S, y = rnd() * S;
        ctx.fillStyle = rnd() < 0.55 ? 'rgba(178,128,58,0.45)' : 'rgba(255,242,205,0.75)';
        ctx.beginPath(); ctx.arc(x, y, 0.5 + rnd() * 1.0, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < 5; i++) {
        const x = 8 + rnd() * (S - 16), y = 8 + rnd() * (S - 16);
        const gb = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 10);
        gb.addColorStop(0, 'rgba(255,243,210,0.6)');
        gb.addColorStop(1, 'rgba(255,243,210,0)');
        ctx.fillStyle = gb; ctx.fillRect(x - 11, y - 11, 22, 22);
      }
      ctx.restore();
      // 黑糖蜜
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (c.syrup === 2) {
        // 一大攤淋下來的糖蜜，流到前緣
        const pool = () => {
          blob(ctx, S * 0.5, S * 0.55, S * 0.3, S * 0.25, 57, 0.4);
        };
        ctx.save(); ctx.translate(S * 0.02, S * 0.03); pool(); ctx.fillStyle = 'rgba(60,25,8,0.22)'; ctx.fill(); ctx.restore();
        pool(); ctx.fillStyle = SYRUP; ctx.fill();
        blob(ctx, S * 0.6, S * 0.82, S * 0.14, S * 0.12, 91, 0.25);
        ctx.fill();
        // 糖蜜表面的反光
        ctx.strokeStyle = 'rgba(255,205,160,0.6)'; ctx.lineWidth = S * 0.03;
        ctx.beginPath(); ctx.moveTo(S * 0.32, S * 0.48); ctx.quadraticCurveTo(S * 0.42, S * 0.36, S * 0.58, S * 0.38); ctx.stroke();
        ctx.fillStyle = 'rgba(255,225,190,0.8)';
        ctx.beginPath(); ctx.ellipse(S * 0.62, S * 0.8, S * 0.035, S * 0.02, 0, 0, TAU); ctx.fill();
      } else if (c.syrup === 1) {
        // 一小攤亮亮的糖蜜
        blob(ctx, S * 0.55, S * 0.55, S * 0.2, S * 0.15, c.seed * 23, 0.35);
        ctx.fillStyle = SYRUP; ctx.fill();
        ctx.fillStyle = 'rgba(255,205,160,0.55)';
        ctx.beginPath(); ctx.ellipse(S * 0.49, S * 0.5, S * 0.07, S * 0.025, -0.3, 0, TAU); ctx.fill();
      }
    });
  }

  function draw(ctx) {
    // 整堆縮到構圖範圍內（圓角描邊會往外擴）
    ctx.save();
    ctx.translate(100, 100); ctx.scale(0.88, 0.88); ctx.translate(-98, -104.5);
    for (const c of CUBES) drawCube(ctx, c);
    ctx.restore();
  }

  window.DESSERTS['warabi'] = {
    draw,
    crumbs: ['#E3BE77', '#F2D79C', '#DAD0BE', '#3E180A', '#CFA25C'],
    crunchy: 0.0,
  };
})();
