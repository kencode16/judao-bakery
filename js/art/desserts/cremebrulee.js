/* 焦糖烤布蕾（crème brûlée）・精緻擬真插畫風
 * 白色淺烤皿（外側一圈直條摺紋的瓷盅），斜上 45 度看：
 * 頂面是一整片琥珀色、玻璃般的焦糖脆面（噴槍烤出的深色焦斑＋亮面反光），
 * 前方被湯匙敲出一道裂痕，露出底下乳黃色的卡士達。
 * 和蛋塔／布丁的差別：外圈是白瓷烤皿、頂面平整的琥珀焦糖。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100;
  const TOP = { cy: 86, rx: 82.5, ry: 46 };     // 烤皿口外緣
  const LIP = { cy: 87, rx: 73.5, ry: 40 };     // 烤皿口內緣
  const CAR = { cy: 92, rx: 72, ry: 38.5 }; // 焦糖面
  const BOT = { cy: 124, rx: 75.5, ry: 41 };    // 烤皿底（淺皿）
  const NR = 40;                              // 外側直條紋數

  function rib(th) { return Math.pow(Math.abs(Math.cos(NR * th / 2)), 0.5); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wallPt(t, th) {
    const f = 1 + 0.014 * (rib(th) - 0.5);
    const e = { cy: lerp(TOP.cy, BOT.cy, t), rx: lerp(TOP.rx, BOT.rx, t), ry: lerp(TOP.ry, BOT.ry, t) };
    return [CX + e.rx * f * Math.cos(th), e.cy + e.ry * f * Math.sin(th)];
  }
  function path(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ramp(stops, x) {
    x = Math.max(0, Math.min(1, x));
    for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i], u = (x - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map(k => Math.round(a[1][k] + (b[1][k] - a[1][k]) * u));
    }
    return stops[stops.length - 1][1];
  }
  const PORC = [[0, rgb('#A9A3A6')], [0.35, rgb('#CBC6C8')], [0.65, rgb('#EDE9E8')], [0.88, rgb('#FFFFFF')], [1, rgb('#FFFFFF')]];

  const SIL = [];
  (function () {
    for (let i = 0; i <= 180; i++) { const th = Math.PI + Math.PI * i / 180; SIL.push([CX + TOP.rx * Math.cos(th), TOP.cy + TOP.ry * Math.sin(th)]); }
    for (let i = 0; i <= 10; i++) SIL.push(wallPt(i / 10, 0));
    for (let i = 0; i <= 180; i++) SIL.push(wallPt(1, Math.PI * i / 180));
    for (let i = 10; i >= 0; i--) SIL.push(wallPt(i / 10, Math.PI));
  })();
  const STRIPS = [];
  (function () {
    const NS = 104;
    for (let i = 0; i < NS; i++) {
      const a0 = Math.PI * i / NS, a1 = Math.PI * (i + 1.3) / NS, am = (a0 + a1) / 2;
      const d = 0.002;
      const fr = (rib(am + d) - rib(am - d)) / (2 * d) * 0.014;
      const n = am - Math.atan(fr);
      const dif = 0.5 + 0.5 * Math.cos(n - 0.74 * Math.PI);
      const spec = Math.pow(Math.max(0, Math.cos(n - 0.62 * Math.PI)), 30);
      STRIPS.push({ pts: [wallPt(0, a0), wallPt(0, a1), wallPt(1, a1), wallPt(1, a0)], c: ramp(PORC, dif * 0.9 + spec * 0.3), top: wallPt(0, am), bot: wallPt(1, am) });
    }
  })();

  /* ---------- 白瓷側面 ---------- */
  function drawWall(ctx) {
    path(ctx, SIL);
    ctx.fillStyle = '#D8D3D3';
    ctx.fill();
    for (const s of STRIPS) {
      path(ctx, s.pts);
      const c = s.c;
      const g = ctx.createLinearGradient(s.top[0], s.top[1], s.bot[0], s.bot[1]);
      g.addColorStop(0, `rgb(${c[0] * 0.86 | 0},${c[1] * 0.85 | 0},${c[2] * 0.86 | 0})`);
      g.addColorStop(0.25, `rgb(${c[0]},${c[1]},${c[2]})`);
      g.addColorStop(0.8, `rgb(${c[0] * 0.97 | 0},${c[1] * 0.96 | 0},${c[2] * 0.96 | 0})`);
      g.addColorStop(1, `rgb(${c[0] * 0.84 | 0},${c[1] * 0.82 | 0},${c[2] * 0.83 | 0})`);
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.save();
    path(ctx, SIL);
    ctx.clip();
    // 盅口下方的陰影、底部暖色反光
    ctx.strokeStyle = 'rgba(110,90,96,0.28)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy + 3, TOP.rx, TOP.ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,190,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CX, BOT.cy - 2.5, BOT.rx - 1, BOT.ry - 1, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.restore();
  }

  /* ---------- 盅口 ---------- */
  function drawLip(ctx) {
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy, TOP.rx, TOP.ry, 0, 0, TAU);
    const g = ctx.createLinearGradient(CX - TOP.rx, TOP.cy - TOP.ry, CX + TOP.rx, TOP.cy + TOP.ry);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.55, '#F7F3F2');
    g.addColorStop(1, '#D9D2D2');
    ctx.fillStyle = g;
    ctx.fill();
    // 內壁（後方看得到一圈，有陰影）
    ctx.beginPath(); ctx.ellipse(CX, LIP.cy, LIP.rx, LIP.ry, 0, 0, TAU);
    const w = ctx.createLinearGradient(0, LIP.cy - LIP.ry, 0, LIP.cy + LIP.ry);
    w.addColorStop(0, '#CFC8C9');
    w.addColorStop(0.5, '#E7E2E1');
    w.addColorStop(1, '#F4F1F0');
    ctx.fillStyle = w;
    ctx.fill();
    // 盅口亮邊
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(CX, TOP.cy, (TOP.rx + LIP.rx) / 2, (TOP.ry + LIP.ry) / 2, 0, Math.PI * 1.02, Math.PI * 1.55); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,130,136,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(CX, LIP.cy, LIP.rx, LIP.ry, 0, 0, TAU); ctx.stroke();
  }

  /* ---------- 焦糖面 ---------- */
  function carPath(ctx) { ctx.beginPath(); ctx.ellipse(CX, CAR.cy, CAR.rx, CAR.ry, 0, 0, TAU); }
  // 裂痕：從右前方湯匙敲的位置往外裂
  const CRACK_O = [128, 108];
  const CRACKS = [
    [[117, 106], [108, 103.5], [99, 105], [90, 102]],
    [[139, 103], [146, 99], [154, 99.5], [160, 95]],
    [[133, 115], [135, 121], [133, 127]],
    [[121, 114], [114, 119], [108, 121]],
    [[126, 100], [124, 93], [127, 86]],
  ];
  // 敲碎掉的一小塊（露出卡士達）
  const HOLE = [[117, 106], [126, 100], [134, 101], [139, 103], [137, 110], [133, 115], [126, 116], [121, 114]];
  // 掉在洞裡、斜斜翹起的焦糖碎片
  const SHARDS = [
    [[120, 108], [127, 104], [128, 109.5], [122, 112]],
    [[129, 105], [136, 104.5], [133.5, 111]],
  ];

  function drawCaramel(ctx) {
    carPath(ctx);
    const g = ctx.createRadialGradient(84, 80, 4, 100, 90, 82);
    g.addColorStop(0, '#F6B954');
    g.addColorStop(0.45, '#E59634');
    g.addColorStop(0.8, '#C7731F');
    g.addColorStop(1, '#9E5414');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    carPath(ctx);
    ctx.clip();
    // 噴槍烤出的深色焦斑（柔邊）
    const r = K.rng(1717);
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.85;
      const x = CX + Math.cos(a) * d * CAR.rx, y = CAR.cy + Math.sin(a) * d * CAR.ry;
      const R = 6 + r() * 12;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.55);
      const s = ctx.createRadialGradient(0, 0, 0.5, 0, 0, R);
      s.addColorStop(0, `rgba(110,46,8,${0.35 + r() * 0.3})`);
      s.addColorStop(0.6, 'rgba(140,62,12,0.18)');
      s.addColorStop(1, 'rgba(150,70,14,0)');
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // 小焦點
    for (let i = 0; i < 14; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.9;
      ctx.fillStyle = `rgba(96,38,8,${0.18 + r() * 0.2})`;
      ctx.beginPath(); ctx.ellipse(CX + Math.cos(a) * d * CAR.rx, CAR.cy + Math.sin(a) * d * CAR.ry, 0.8 + r() * 1.8, 0.5 + r() * 0.9, 0, 0, TAU); ctx.fill();
    }
    // 焦糖邊緣（貼著烤皿的地方較深）
    ctx.strokeStyle = 'rgba(110,50,10,0.55)';
    ctx.lineWidth = 5;
    carPath(ctx);
    ctx.stroke();
    // 後緣：烤皿口在焦糖上的影子
    ctx.strokeStyle = 'rgba(90,40,10,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(CX, CAR.cy - 2.5, CAR.rx, CAR.ry, 0, Math.PI, TAU); ctx.stroke();

    // 裂開的小洞：卡士達
    path(ctx, HOLE);
    const cu = ctx.createLinearGradient(120, 99, 136, 110);
    cu.addColorStop(0, '#E9C98A');
    cu.addColorStop(0.4, '#FBE7B4');
    cu.addColorStop(1, '#FFF4D6');
    ctx.fillStyle = cu;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,140,0.9)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // 洞的後緣（焦糖片的厚度＋投在卡士達上的影子）
    ctx.strokeStyle = 'rgba(150,96,40,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(118, 107.5); ctx.lineTo(126, 102); ctx.lineTo(134, 103); ctx.lineTo(138, 105); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,46,8,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(117, 106); ctx.lineTo(126, 100); ctx.lineTo(134, 101); ctx.lineTo(139, 103); ctx.stroke();
    // 碎片
    for (const sh of SHARDS) {
      path(ctx, sh);
      const sg = ctx.createLinearGradient(sh[0][0], sh[0][1], sh[2][0], sh[2][1]);
      sg.addColorStop(0, '#F2B04C');
      sg.addColorStop(1, '#B9661A');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 0.8; ctx.stroke();
    }

    // 裂紋：深色縫＋一側亮邊（玻璃碎片的邊）
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of CRACKS) {
      ctx.strokeStyle = 'rgba(70,26,4,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,236,190,0.75)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0] - 0.4, p[1] - 1.1) : ctx.moveTo(p[0] - 0.4, p[1] - 1.1)); ctx.stroke();
    }
    void CRACK_O;

    // 玻璃般的反光
    ctx.save();
    ctx.translate(74, 81);
    ctx.scale(1, 0.42);
    const sh = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    sh.addColorStop(0, 'rgba(255,248,226,0.6)');
    sh.addColorStop(1, 'rgba(255,248,226,0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,253,245,0.9)';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(CX, CAR.cy, CAR.rx - 9, CAR.ry - 7, 0, Math.PI * 1.1, Math.PI * 1.36); ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(CX, CAR.cy, CAR.rx - 9, CAR.ry - 7, 0, Math.PI * 1.41, Math.PI * 1.47); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,250,0.9)';
    ctx.beginPath(); ctx.ellipse(146, 86, 2.6, 1.3, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function draw(ctx) {
    drawWall(ctx);
    drawLip(ctx);
    drawCaramel(ctx);
    path(ctx, SIL);
    ctx.strokeStyle = 'rgba(120,96,104,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  window.DESSERTS['cremebrulee'] = {
    draw,
    crumbs: ['#E59634', '#FBE7B4', '#9E5414', '#FFF4D6', '#F6B954'],
    crunchy: 0.65,
  };
})();
