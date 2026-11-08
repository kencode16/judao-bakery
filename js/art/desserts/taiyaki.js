/* 鯛魚燒（たい焼き）
 * 魚頭朝左、尾巴朝右，平躺著從斜上方看（稍微壓扁、下方露出一圈厚度）。
 * 金褐色餅皮，模具壓出的凸紋（眼睛、鰓、魚鱗、背鰭、尾鰭的放射紋）烤色較深。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  // 魚的外形（本地座標：x 向右、y 向下，頭在左）
  const OUTLINE = [
    [-84, 1], [-79, -17], [-67, -35], [-49, -47], [-29, -52],
    [-19, -56], [-11, -64], [1, -67], [13, -65], [25, -60], [35, -51],
    [42, -38], [51, -27],
    [61, -38], [73, -52], [86, -57],
    [88, -40], [84, -20], [82, 0], [84, 20], [88, 40], [86, 57],
    [73, 52], [61, 39], [51, 27],
    [42, 36],
    [34, 47], [22, 57], [8, 58], [-3, 52],
    [-21, 53], [-45, 50], [-65, 40], [-78, 25], [-86, 13], [-82, 7],
  ];

  const T = { x: 97, y: 95, rot: -0.12, sx: 0.93, sy: 0.92 };
  const THICK = 11;                 // 下方露出的厚度（螢幕單位）

  function smooth(ctx, P, closed, tension) {
    const n = P.length, k = (tension || 1) / 6;
    const at = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    ctx.moveTo(P[0][0], P[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  }
  function fish(ctx) { ctx.beginPath(); smooth(ctx, OUTLINE, true); }
  function local(ctx, dy) {
    ctx.translate(T.x, T.y + (dy || 0));
    ctx.rotate(T.rot);
    ctx.scale(T.sx, T.sy);
  }

  // 凸紋：深色線（右下）＋亮線（左上），看起來像壓出來的浮雕
  function emboss(ctx, pathFn, w, dark, light) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.translate(0.9, 1.1); pathFn(); ctx.strokeStyle = dark || 'rgba(120,58,18,0.55)'; ctx.lineWidth = w; ctx.stroke();
    ctx.translate(-1.6, -1.8); pathFn(); ctx.strokeStyle = light || 'rgba(255,226,170,0.55)'; ctx.lineWidth = w * 0.7; ctx.stroke();
    ctx.restore();
  }

  /* ---------- 下方厚度（側面＋接縫） ---------- */
  function drawSide(ctx) {
    ctx.save();
    local(ctx, THICK);
    fish(ctx);
    const g = ctx.createLinearGradient(-80, -40, 80, 60);
    g.addColorStop(0, '#C47A34');
    g.addColorStop(0.6, '#A65E24');
    g.addColorStop(1, '#7E4318');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(100,48,16,0.8)'; ctx.lineWidth = 2.3; ctx.stroke();
    ctx.restore();
    // 上下兩片模具接合處的淡色薄邊（羽根）
    ctx.save();
    local(ctx, THICK * 0.45);
    fish(ctx);
    ctx.strokeStyle = 'rgba(232,180,104,0.75)'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    ctx.save();
    local(ctx, 0);
    fish(ctx);
    const g = ctx.createLinearGradient(-70, -60, 70, 60);
    g.addColorStop(0, '#EEB462');
    g.addColorStop(0.45, '#D88A3A');
    g.addColorStop(1, '#A95B22');
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    fish(ctx); ctx.clip();
    // 身體中央鼓起的柔光
    const gh = ctx.createRadialGradient(-34, -22, 4, -20, -10, 70);
    gh.addColorStop(0, 'rgba(255,232,170,0.75)');
    gh.addColorStop(0.5, 'rgba(255,215,140,0.25)');
    gh.addColorStop(1, 'rgba(255,215,140,0)');
    ctx.fillStyle = gh; ctx.fillRect(-100, -80, 200, 160);
    // 邊緣烤得較深、往下圓
    fish(ctx);
    ctx.strokeStyle = 'rgba(140,70,22,0.35)'; ctx.lineWidth = 14; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,58,18,0.35)'; ctx.lineWidth = 6; ctx.stroke();
    // 烤色斑點
    const rnd = K.rng(53);
    for (let i = 0; i < 70; i++) {
      const x = -80 + rnd() * 165, y = -60 + rnd() * 120, r = 1.5 + rnd() * 5;
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(150,75,25,0.12)' : 'rgba(255,220,150,0.12)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, rnd() * 3, 0, TAU); ctx.fill();
    }
    ctx.restore();

    /* --- 凸紋 --- */
    // 背鰭與身體的分界、鰭條
    emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(-24, -47); ctx.quadraticCurveTo(8, -54, 38, -38); }, 2.2);
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const bx = -20 + t * 56, by = -48 - Math.sin(t * Math.PI) * 4 + t * 8;
      const ex = bx + 4 + t * 4, ey = -60 - Math.sin(t * Math.PI) * 5 + t * 10;
      emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); }, 1.6);
    }
    // 腹鰭（下緣）
    emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(-4, 47); ctx.quadraticCurveTo(20, 46, 38, 33); }, 2);
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.5) / 4;
      const bx = -2 + t * 38, by = 47 - t * 12;
      emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 2 + t * 4, by + 8 - t * 2); }, 1.5);
    }
    // 尾巴根部與放射紋
    emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(49, -27); ctx.quadraticCurveTo(43, 0, 49, 27); }, 2.4);
    for (let i = 0; i < 7; i++) {
      const a = -0.95 + i * (1.9 / 6);
      emboss(ctx, () => {
        ctx.beginPath(); ctx.moveTo(52 + Math.cos(a) * 6, Math.sin(a) * 14);
        ctx.quadraticCurveTo(64 + Math.cos(a) * 10, Math.sin(a) * 30, 80 + Math.cos(a) * 2, Math.sin(a) * 50);
      }, 1.6);
    }
    // 鰓蓋
    emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(-42, -42); ctx.bezierCurveTo(-30, -18, -30, 18, -44, 40); }, 2.6);
    // 胸鰭
    emboss(ctx, () => {
      ctx.beginPath(); ctx.moveTo(-30, 10); ctx.quadraticCurveTo(-16, 4, -4, 12);
      ctx.moveTo(-30, 10); ctx.quadraticCurveTo(-16, 22, -6, 24);
      ctx.moveTo(-28, 12); ctx.lineTo(-8, 18);
    }, 1.6);
    // 魚鱗：一排排向頭部凸出的弧（全部合成一條路徑，畫得快）
    ctx.save();
    fish(ctx); ctx.clip();
    const scales = () => {
      ctx.beginPath();
      for (let row = -3; row <= 3; row++) {
        for (let col = 0; col < 5; col++) {
          const x = -22 + col * 13 + (row % 2 ? 6.5 : 0);
          const y = row * 11;
          if (x > 40) continue;
          const ell = (x + 5) * (x + 5) / (50 * 50) + (y * y) / (40 * 40);
          if (ell > 1 || (x < -14 && Math.abs(y) > 20)) continue;
          if (x < 2 && y > 2 && y < 26 && x > -28) continue;   // 讓出胸鰭
          const a0 = Math.PI * 0.55, a1 = Math.PI * 1.45;
          ctx.moveTo(x + Math.cos(a0) * 6.2, y + Math.sin(a0) * 6.2);
          ctx.arc(x, y, 6.2, a0, a1);
        }
      }
    };
    emboss(ctx, scales, 1.7);
    ctx.restore();
    // 嘴巴
    emboss(ctx, () => { ctx.beginPath(); ctx.moveTo(-84, 5); ctx.quadraticCurveTo(-76, 6, -72, 10); }, 1.8);
    // 眼睛：凸起的圓＋深色眼珠
    const ex = -58, ey = -16;
    ctx.fillStyle = 'rgba(130,62,20,0.5)';
    ctx.beginPath(); ctx.arc(ex + 1, ey + 1.3, 10, 0, TAU); ctx.fill();
    const ge = ctx.createRadialGradient(ex - 3, ey - 3, 1, ex, ey, 9);
    ge.addColorStop(0, '#F6C77A');
    ge.addColorStop(1, '#C47A34');
    ctx.fillStyle = ge;
    ctx.beginPath(); ctx.arc(ex, ey, 9.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5A2A10';
    ctx.beginPath(); ctx.arc(ex + 1, ey + 0.8, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,215,0.9)';
    ctx.beginPath(); ctx.arc(ex - 0.4, ey - 0.8, 1.7, 0, TAU); ctx.fill();

    // 外輪廓
    fish(ctx);
    ctx.strokeStyle = 'rgba(110,52,16,0.75)'; ctx.lineWidth = 2.3; ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
  }

  window.DESSERTS['taiyaki'] = {
    draw,
    crumbs: ['#DE9644', '#B9692A', '#F0B866', '#5C2430', '#8E4B1E'],
    crunchy: 0.6,
  };
})();
