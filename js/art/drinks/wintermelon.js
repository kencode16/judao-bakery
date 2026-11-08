/* 冬瓜茶（Winter melon tea）
 * 辨識：台灣柑仔店的鋁箔包（利樂包）＋插在頂上的彎頭吸管；包裝下半是冬瓜茶的焦糖琥珀色，
 *       正面畫一顆深綠色冬瓜和切開的白色瓜肉。
 * 剪影：唯一的「方盒子」；顏色是琥珀褐＋冬瓜綠。光源左上（正面亮、右側面暗）。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const sh = K.shade, rg = K.rgba;

  /* ---------- 小工具（B6 共用寫法，每個檔各自一份） ---------- */
  const TAU = Math.PI * 2;
  function oval(ctx, cx, cy, rx, ry, a0, a1, ccw) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), 0, a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1, !!ccw);
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const X0 = 42, X1 = 120, YT = 66, YB = 172;   // 正面
  const DX = 36, DY = -20;                      // 往右後方的深度
  const AMBER = '#B8692A';

  function quad(ctx, a, b, c, d) {
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
  }

  function melon(ctx, x, y, s) {
    // 一整顆冬瓜（長橢圓、深綠、帶白霜斑點）
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    oval(ctx, 0, 0, 22 * s, 12 * s);
    const g = ctx.createRadialGradient(-8 * s, -5 * s, 1, 0, 0, 24 * s);
    g.addColorStop(0, '#6FAE5A');
    g.addColorStop(0.6, '#3C7A36');
    g.addColorStop(1, '#22501F');
    ctx.fillStyle = g;
    ctx.fill();
    const r = K.rng(31);
    ctx.fillStyle = 'rgba(225,240,215,0.55)';
    for (let i = 0; i < 18; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.85;
      oval(ctx, Math.cos(a) * d * 20 * s, Math.sin(a) * d * 10 * s, 1.1 * s, 0.8 * s);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,50,20,0.55)';
    ctx.lineWidth = 1;
    oval(ctx, 0, 0, 22 * s, 12 * s);
    ctx.stroke();
    ctx.restore();
    // 切開的一塊（綠皮白肉、中間一排瓜子）
    ctx.save();
    ctx.translate(x + 20 * s, y + 9 * s);
    ctx.beginPath();
    ctx.arc(0, 0, 11 * s, Math.PI * 0.95, Math.PI * 2.05);
    ctx.closePath();
    ctx.fillStyle = '#2F6A2C';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 9 * s, Math.PI * 0.97, Math.PI * 2.03);
    ctx.closePath();
    ctx.fillStyle = '#F7F7E6';
    ctx.fill();
    ctx.fillStyle = '#E3D9A8';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (1.2 + i * 0.2);
      oval(ctx, Math.cos(a) * 4.6 * s, Math.sin(a) * 4.6 * s, 1.3 * s, 0.8 * s);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx) {
    const A = [X0, YT], B = [X1, YT], C = [X1, YB], D = [X0, YB];
    const B2 = [X1 + DX, YT + DY], C2 = [X1 + DX, YB + DY], A2 = [X0 + DX, YT + DY];
    // 右側面（背光）
    quad(ctx, B, B2, C2, C);
    const sg = ctx.createLinearGradient(X1, 0, X1 + DX, 0);
    sg.addColorStop(0, '#EAE7CF');
    sg.addColorStop(1, '#C9C6A8');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.save();
    quad(ctx, B, B2, C2, C);
    ctx.clip();
    // 側面下半琥珀色
    const mid = 118;
    ctx.beginPath(); ctx.moveTo(X1, mid); ctx.lineTo(X1 + DX, mid + DY); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB); ctx.closePath();
    ctx.fillStyle = sh(AMBER, -0.3);
    ctx.fill();
    // 側面綠色細帶
    ctx.beginPath(); ctx.moveTo(X1, mid - 7); ctx.lineTo(X1 + DX, mid - 7 + DY); ctx.lineTo(X1 + DX, mid + DY); ctx.lineTo(X1, mid); ctx.closePath();
    ctx.fillStyle = '#2F6A2C';
    ctx.fill();
    // 頂端摺角（三角形摺片）
    ctx.beginPath(); ctx.moveTo(X1, YT); ctx.lineTo(X1 + DX, YT + DY); ctx.lineTo(X1 + DX * 0.5, YT + DY * 0.5 + 12); ctx.closePath();
    ctx.fillStyle = 'rgba(90,80,50,0.18)';
    ctx.fill();
    ctx.restore();
    // 正面
    quad(ctx, A, B, C, D);
    ctx.fillStyle = '#F7F5E4';
    ctx.fill();
    ctx.save();
    quad(ctx, A, B, C, D);
    ctx.clip();
    const ag = ctx.createLinearGradient(0, 118, 0, YB);
    ag.addColorStop(0, sh(AMBER, 0.12));
    ag.addColorStop(1, sh(AMBER, -0.18));
    ctx.fillStyle = ag;
    ctx.fillRect(X0, 118, X1 - X0, YB - 118);
    // 琥珀色上緣是一道波浪（像茶湯）
    ctx.beginPath();
    ctx.moveTo(X0, 120);
    for (let x = X0; x <= X1; x += 2) ctx.lineTo(x, 118 + 2.5 * Math.sin((x - X0) * 0.12));
    ctx.lineTo(X1, 128); ctx.lineTo(X0, 128); ctx.closePath();
    ctx.fillStyle = sh(AMBER, 0.12);
    ctx.fill();
    ctx.fillStyle = '#2F6A2C';
    ctx.fillRect(X0, 109, X1 - X0, 6);
    ctx.fillStyle = '#D9A13A';
    ctx.fillRect(X0, 115, X1 - X0, 2);
    // 上方的淡綠色標題框
    rrect(ctx, X0 + 9, 76, X1 - X0 - 18, 24, 5);
    ctx.fillStyle = '#E2EDCB';
    ctx.fill();
    ctx.strokeStyle = '#7FA85A';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      rrect(ctx, X0 + 16, 82 + i * 5, (X1 - X0 - 32) * (1 - i * 0.25), 2.4, 1.2);
      ctx.fillStyle = i ? 'rgba(80,110,60,0.5)' : '#3C6E30';
      ctx.fill();
    }
    melon(ctx, (X0 + X1) / 2 - 6, 144, 1.15);
    // 正面打光：左亮右暗、下暗
    const lg = ctx.createLinearGradient(X0, 0, X1, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0.28)');
    lg.addColorStop(0.3, 'rgba(255,255,255,0.05)');
    lg.addColorStop(1, 'rgba(60,40,10,0.12)');
    ctx.fillStyle = lg;
    ctx.fillRect(X0, YT, X1 - X0, YB - YT);
    ctx.restore();
    // 頂面
    quad(ctx, A, A2, B2, B);
    const tg = ctx.createLinearGradient(X0, YT + DY, X1 + DX, YT);
    tg.addColorStop(0, '#FFFFF4');
    tg.addColorStop(1, '#E4E1C6');
    ctx.fillStyle = tg;
    ctx.fill();
    // 頂面封口的凸邊
    ctx.strokeStyle = 'rgba(150,140,100,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X0 + DX * 0.5 + 1, YT + DY * 0.5); ctx.lineTo(X1 + DX * 0.5 - 1, YT + DY * 0.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X0 + DX * 0.5 + 1, YT + DY * 0.5 - 1.5); ctx.lineTo(X1 + DX * 0.5 - 1, YT + DY * 0.5 - 1.5); ctx.stroke();
    // 輪廓
    ctx.strokeStyle = 'rgba(90,70,40,0.6)';
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(D[0], D[1]); ctx.lineTo(A[0], A[1]); ctx.lineTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(C2[0], C2[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,70,40,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.moveTo(B[0], B[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke();
    // 正面左緣高光
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X0 + 2, YT + 4); ctx.lineTo(X0 + 2, YB - 6); ctx.stroke();
    // 彎頭吸管（插在頂面右後方）
    const hx = X1 + DX * 0.55 - 6, hy = YT + DY * 0.55 + 2;
    ctx.fillStyle = 'rgba(60,50,30,0.5)';
    oval(ctx, hx, hy, 5, 2.4);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 1, 39); ctx.quadraticCurveTo(hx + 2, 32, hx + 8, 29); ctx.lineTo(hx + 18, 25); };
    path(); ctx.strokeStyle = 'rgba(40,90,40,0.75)'; ctx.lineWidth = 7.4; ctx.stroke();
    path(); ctx.strokeStyle = '#8CCB62'; ctx.lineWidth = 5.4; ctx.stroke();
    // 彎折處的皺褶
    ctx.strokeStyle = 'rgba(40,90,40,0.6)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx - 1.5 + i * 2.4, 36 - i * 2.2); ctx.lineTo(hx + 3 + i * 2.4, 37.5 - i * 2.2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(hx - 1, hy - 4); ctx.lineTo(hx, 41);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  window.DRINKS_ART = window.DRINKS_ART || {};
  window.DRINKS_ART['wintermelon'] = { draw };
})();
