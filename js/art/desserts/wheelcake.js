/* 車輪餅（紅豆餅）（wheelcake）
 * 後面一個完整的：金褐色圓頂面、外圈一道模具壓出的圈、淡黃色側面中間有一圈接縫；
 * 前面一個對半掰開：切面露出滿滿的深紅紅豆餡。小圖重點：金黃圓餅＋深紅餡。
 * 光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;
  const SQ = 0.56;

  /* ---------- 完整的一個 ---------- */
  function whole(ctx, cx, cy, R, H) {
    const ry = R * SQ;
    const side = () => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, ry, 0, Math.PI, 0, false);
      ctx.lineTo(cx + R, cy + H);
      ctx.ellipse(cx, cy + H, R, ry, 0, 0, Math.PI, false);
      ctx.closePath();
    };
    side();
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, '#F6DCA2');
    g.addColorStop(0.35, '#F3D392');
    g.addColorStop(0.8, '#DDB06A');
    g.addColorStop(1, '#C08E4C');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    side(); ctx.clip();
    // 上下兩片的烤色：靠近上下緣較深
    const v = ctx.createLinearGradient(0, cy, 0, cy + H + ry);
    v.addColorStop(0, 'rgba(190,120,50,0.45)');
    v.addColorStop(0.3, 'rgba(190,120,50,0)');
    v.addColorStop(0.75, 'rgba(190,120,50,0)');
    v.addColorStop(1, 'rgba(170,100,40,0.5)');
    ctx.fillStyle = v;
    ctx.fillRect(cx - R, cy - 2, 2 * R, H + ry + 4);
    // 中間的接縫（兩半合起來擠出的一圈薄邊）
    ctx.strokeStyle = 'rgba(168,104,40,0.75)';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(cx, cy + H * 0.52, R + 0.5, ry, 0, 0.03, Math.PI - 0.03); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,200,0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, cy + H * 0.52 - 2, R, ry, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.restore();

    // 頂面
    ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, TAU);
    const t = ctx.createRadialGradient(cx - R * 0.3, cy - ry * 0.4, 2, cx, cy, R);
    t.addColorStop(0, '#E6A452');
    t.addColorStop(0.6, '#CF8434');
    t.addColorStop(1, '#AE6220');
    ctx.fillStyle = t;
    ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, TAU); ctx.clip();
    // 烤色斑駁
    const r = K.rng(212);
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.78;
      ctx.fillStyle = r() < 0.5 ? 'rgba(150,80,20,0.2)' : 'rgba(240,180,96,0.25)';
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d * R, cy + Math.sin(a) * d * ry, 3 + r() * 6, 2 + r() * 3, 0, 0, TAU); ctx.fill();
    }
    // 圓潤的邊：左上亮、右下深；內側一道模具壓痕
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,214,150,0.6)';
    ctx.beginPath(); ctx.ellipse(cx, cy, R - 2.5, ry - 1.5, 0, Math.PI * 0.95, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(130,64,14,0.4)';
    ctx.beginPath(); ctx.ellipse(cx, cy, R - 2.5, ry - 1.5, 0, -0.2, Math.PI * 0.9); ctx.stroke();
    ctx.strokeStyle = 'rgba(130,66,16,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(cx, cy + 0.5, R - 8, ry - 5, 0, 0, TAU); ctx.stroke();
    // 光澤
    const gl = ctx.createRadialGradient(cx - R * 0.32, cy - ry * 0.38, 1, cx - R * 0.32, cy - ry * 0.38, R * 0.36);
    gl.addColorStop(0, 'rgba(255,236,190,0.4)');
    gl.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.ellipse(cx - R * 0.32, cy - ry * 0.38, R * 0.36, ry * 0.3, -0.15, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,90,30,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, TAU); ctx.stroke();
    // 外輪廓
    ctx.strokeStyle = 'rgba(130,74,22,0.6)';
    ctx.lineWidth = 2;
    side(); ctx.stroke();
  }

  /* ---------- 對半掰開的一個：切面朝前 ---------- */
  function half(ctx, cx, cy, R, H) {
    const ry = R * SQ;
    // 後半的頂面（上半橢圓）
    ctx.beginPath();
    ctx.ellipse(cx, cy, R, ry, 0, Math.PI, 0, false);
    ctx.closePath();
    const t = ctx.createRadialGradient(cx - R * 0.3, cy - ry * 0.6, 2, cx, cy - ry * 0.3, R);
    t.addColorStop(0, '#E6A452');
    t.addColorStop(0.7, '#C97C30');
    t.addColorStop(1, '#AE6220');
    ctx.fillStyle = t;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,214,150,0.6)';
    ctx.beginPath(); ctx.ellipse(cx, cy, R - 2.5, ry - 1.5, 0, Math.PI * 1.0, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(130,66,16,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(cx, cy + 0.5, R - 8, ry - 5, 0, Math.PI, TAU); ctx.stroke();
    // 掰開處的頂皮切口亮邊
    ctx.fillStyle = 'rgba(247,224,168,0.9)';
    ctx.fillRect(cx - R, cy - 2.5, 2 * R, 2.5);
    ctx.restore();
    ctx.strokeStyle = 'rgba(130,74,22,0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, Math.PI, TAU); ctx.stroke();

    // 切面：上下兩層薄餅皮夾著厚厚的紅豆餡，兩端圓弧
    const face = () => {
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.quadraticCurveTo(cx + R + 4, cy + H * 0.5, cx + R, cy + H);
      ctx.lineTo(cx - R, cy + H);
      ctx.quadraticCurveTo(cx - R - 4, cy + H * 0.5, cx - R, cy);
      ctx.closePath();
    };
    face();
    const fg = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    fg.addColorStop(0, '#F7E0A8');
    fg.addColorStop(1, '#E2BC78');
    ctx.fillStyle = fg;
    ctx.fill();
    // 紅豆餡
    const pad = 4.5;
    const fill = () => {
      ctx.beginPath();
      ctx.moveTo(cx - R + 5, cy + pad);
      ctx.lineTo(cx + R - 5, cy + pad);
      ctx.quadraticCurveTo(cx + R + 0.5, cy + H * 0.5, cx + R - 5, cy + H - pad);
      ctx.lineTo(cx - R + 5, cy + H - pad);
      ctx.quadraticCurveTo(cx - R - 0.5, cy + H * 0.5, cx - R + 5, cy + pad);
      ctx.closePath();
    };
    fill();
    const bg = ctx.createLinearGradient(0, cy, 0, cy + H);
    bg.addColorStop(0, '#7C3430');
    bg.addColorStop(0.5, '#6A2828');
    bg.addColorStop(1, '#4E1C1E');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    fill(); ctx.clip();
    // 顆粒紅豆：亮邊小橢圓
    const r = K.rng(818);
    for (let i = 0; i < 26; i++) {
      const x = cx - R + 7 + r() * (2 * R - 14), y = cy + pad + 2 + r() * (H - 2 * pad - 4), a = r() * Math.PI;
      ctx.fillStyle = '#3E1214';
      ctx.beginPath(); ctx.ellipse(x + 0.5, y + 0.8, 3.4, 2.4, a, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8E3A34';
      ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.2, a, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,210,200,0.5)';
      ctx.beginPath(); ctx.ellipse(x - 0.9, y - 0.8, 1.1, 0.5, a, 0, TAU); ctx.fill();
    }
    // 濕潤光澤
    ctx.fillStyle = 'rgba(255,200,190,0.25)';
    ctx.beginPath(); ctx.ellipse(cx - R * 0.35, cy + H * 0.32, R * 0.3, H * 0.14, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // 餅皮內側烤色與外框
    ctx.strokeStyle = 'rgba(176,112,48,0.6)';
    ctx.lineWidth = 1;
    fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(130,74,22,0.65)';
    ctx.lineWidth = 2;
    face(); ctx.stroke();
  }

  function draw(ctx) {
    whole(ctx, 80, 64, 58, 40);
    half(ctx, 124, 124, 52, 36);
  }

  window.DESSERTS['wheelcake'] = {
    draw,
    crumbs: ['#C77A2C', '#F3D392', '#6A2828', '#E09E4A', '#8E3A34'],
    crunchy: 0.3,
  };
})();
