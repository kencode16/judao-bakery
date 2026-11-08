/* 潘娜朵妮（Panettone）
 * 高高的圓頂麵包站在咖啡色金紋紙模裡，頂部烤成深褐亮面、十字切口裂開，邊緣像香菇一樣微微外翻。
 * 正前方切掉一塊，露出金黃蓬鬆、一絲絲直向氣孔的內裡和葡萄乾、糖漬橙皮——
 * 這是和布里歐、司康等其他圓頂麵包分開的關鍵。斜上方俯視、光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;

  /* ---------- 3D 幾何（X 右、Y 往前、Z 往上），投影到畫面 ---------- */
  const CX = 100, B = 146, KY = 0.42;
  const P = (X, Y, Z) => [CX + X, B + Y * KY - Z];
  const RP = 62, HP = 46;                 // 紙模半徑、高度
  const RD = 68, ZC = 54, HD = 58;        // 圓頂最寬處半徑、高度位置、圓頂高
  const TOP = ZC + HD;
  function rOut(z) {                      // 高度 z 的外半徑
    if (z <= HP) return RP;
    if (z <= ZC) return RP + (RD - RP) * Math.sin((z - HP) / (ZC - HP) * Math.PI / 2);
    const t = (z - ZC) / HD;
    return RD * Math.sqrt(Math.max(0, 1 - t * t));
  }
  const domeZ = r => ZC + HD * Math.sqrt(Math.max(0, 1 - (r / RD) ** 2));   // 圓頂表面高度
  const surf = (th, z) => { const r = rOut(z); return P(Math.cos(th) * r, Math.sin(th) * r, z); };
  const TH1 = 26 * D2R, TH2 = 96 * D2R;  // 切掉的那一塊（90° 是正前方）

  const LINE = 'rgba(80,40,14,0.82)';

  /* ---------- 外形 ---------- */
  function paperPath(ctx) {
    ctx.beginPath();
    const a = P(-RP, 0, HP), b = P(-RP, 0, 0);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.ellipse(CX, B, RP, RP * KY, 0, Math.PI, 0, true);
    const c = P(RP, 0, HP); ctx.lineTo(c[0], c[1]);
    ctx.ellipse(CX, B - HP, RP, RP * KY, 0, 0, Math.PI, false);
    ctx.closePath();
  }
  function domePath(ctx) {
    ctx.beginPath();
    for (let z = HP - 3; z <= TOP; z += 1.5) {
      const r = rOut(z);
      if (r < 1) continue;
      const c = P(0, 0, z);
      ctx.moveTo(c[0] + r, c[1]);
      ctx.ellipse(c[0], c[1], r, r * KY, 0, 0, TAU);
    }
  }

  /* ---------- 紙模 ---------- */
  function drawPaper(ctx) {
    paperPath(ctx);
    const g = ctx.createLinearGradient(CX - RP, 0, CX + RP, 0);
    g.addColorStop(0, '#5E3519');
    g.addColorStop(0.2, '#9A6136');
    g.addColorStop(0.45, '#82502B');
    g.addColorStop(0.8, '#5A3216');
    g.addColorStop(1, '#3E200C');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    paperPath(ctx); ctx.clip();
    // 金色印花：直條＋小菱形
    for (let i = 0; i < 26; i++) {
      const th = (i + 0.5) / 26 * Math.PI;
      const fs = Math.sin(th);                        // 越靠側邊越窄
      const lit = 0.55 + 0.45 * Math.cos(th - 0.8);
      const top = P(Math.cos(th) * RP, Math.sin(th) * RP, HP - 4), bot = P(Math.cos(th) * RP, Math.sin(th) * RP, 2);
      ctx.strokeStyle = `rgba(232,190,100,${0.35 * lit})`; ctx.lineWidth = 0.9 * fs + 0.2;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.stroke();
      if (i % 2 === 0) {
        for (const z of [14, 30]) {
          const p = P(Math.cos(th + 0.06) * RP, Math.sin(th + 0.06) * RP, z);
          ctx.fillStyle = `rgba(240,200,110,${0.85 * lit})`;
          ctx.beginPath();
          ctx.moveTo(p[0], p[1] - 3.2); ctx.lineTo(p[0] + 2.4 * fs, p[1]); ctx.lineTo(p[0], p[1] + 3.2); ctx.lineTo(p[0] - 2.4 * fs, p[1]);
          ctx.closePath(); ctx.fill();
        }
      }
    }
    // 上下兩道金邊
    ctx.strokeStyle = 'rgba(236,196,110,0.9)'; ctx.lineWidth = 1.6;
    for (const z of [6, HP - 8]) {
      const c = P(0, 0, z);
      ctx.beginPath(); ctx.ellipse(c[0], c[1], RP, RP * KY, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    }
    // 圓頂外翻壓出來的陰影
    const c = P(0, 0, HP);
    const gs = ctx.createLinearGradient(0, c[1] + RP * KY - 6, 0, c[1] + RP * KY + 10);
    gs.addColorStop(0, 'rgba(30,12,2,0.55)'); gs.addColorStop(1, 'rgba(30,12,2,0)');
    ctx.fillStyle = gs; ctx.fillRect(0, c[1] - 30, 200, RP * KY + 42);
    ctx.restore();
  }

  /* ---------- 圓頂 ---------- */
  function drawDome(ctx) {
    const rnd = K.rng(61);
    domePath(ctx);
    ctx.fillStyle = '#6E3512'; ctx.fill();
    ctx.save();
    domePath(ctx); ctx.clip();
    const hl = P(-30, -6, TOP - 14);
    const g = ctx.createRadialGradient(hl[0], hl[1], 2, CX + 10, B - ZC - 10, RD * 1.15);
    g.addColorStop(0, '#C98745');
    g.addColorStop(0.35, '#9A5424');
    g.addColorStop(0.75, '#6E3512');
    g.addColorStop(1, '#4A2008');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
    // 外翻的側緣烤色較淺（金黃）
    const lip = P(0, 0, ZC);
    const gl = ctx.createLinearGradient(0, lip[1] + 4, 0, lip[1] + RD * KY + 6);
    gl.addColorStop(0, 'rgba(214,150,72,0)');
    gl.addColorStop(0.6, 'rgba(214,150,72,0.75)');
    gl.addColorStop(1, 'rgba(160,96,40,0.9)');
    ctx.fillStyle = gl; ctx.fillRect(0, lip[1], 200, 60);
    // 蛋液光澤的斑駁
    for (let i = 0; i < 40; i++) {
      const th = rnd() * TAU, r = Math.sqrt(rnd()) * RD * 0.95;
      const p = P(Math.cos(th) * r, Math.sin(th) * r, domeZ(r));
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(60,24,6,0.22)' : 'rgba(230,160,90,0.18)';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 3 + rnd() * 6, 1.5 + rnd() * 2.5, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // 十字切口：沿圓頂表面裂開，露出淺色麵包
    for (const th of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
      const pts = [], wobble = K.rng(Math.round(th * 100) + 3);
      for (let r = 1; r <= 34; r += 2.5) {
        const w = 6.5 * (1 - r / 48) + (wobble() - 0.5) * 2.2;
        pts.push({ r, w });
      }
      const side = s => pts.map(({ r, w }) => {
        const nx = -Math.sin(th) * w * s, ny = Math.cos(th) * w * s;
        const X = Math.cos(th) * r + nx, Y = Math.sin(th) * r + ny;
        return P(X, Y, domeZ(Math.hypot(X, Y)));
      });
      const L = side(1), Rr = side(-1);
      // 翻起的硬皮邊
      ctx.beginPath();
      L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      Rr.reverse().forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fillStyle = '#E7B465'; ctx.fill();
      ctx.strokeStyle = 'rgba(70,30,8,0.75)'; ctx.lineWidth = 1.3; ctx.stroke();
      // 中間一道淺色
      ctx.strokeStyle = 'rgba(255,232,170,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      pts.forEach(({ r }, i) => { const p = P(Math.cos(th) * r, Math.sin(th) * r, domeZ(r)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
    }

    // 表面露出的葡萄乾、橙皮
    for (let i = 0; i < 9; i++) {
      const th = Math.PI * (-0.05 + rnd() * 1.1), r = 34 + rnd() * 32;
      const z = domeZ(Math.min(r, RD - 1));
      const p = P(Math.cos(th) * Math.min(r, rOut(z) - 2), Math.sin(th) * Math.min(r, rOut(z) - 2), z);
      if (rnd() < 0.75) raisin(ctx, p[0], p[1], 2.0 + rnd() * 0.9, rnd() * 3);
      else peel(ctx, p[0], p[1], 2.2 + rnd(), rnd() < 0.7);
    }
  }

  function raisin(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#3A1418';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 1.3, s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6E2E34';
    ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.15, s * 0.9, s * 0.6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(25,8,10,0.6)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-s * 0.8, 0.2); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.8, 0.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,220,0.6)';
    ctx.beginPath(); ctx.ellipse(-s * 0.45, -s * 0.4, s * 0.35, s * 0.2, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function peel(ctx, x, y, s, orange) {
    ctx.fillStyle = orange ? '#E8781E' : '#C9CC5A';
    ctx.fillRect(x - s, y - s * 0.8, s * 2, s * 1.6);
    ctx.fillStyle = orange ? 'rgba(255,200,120,0.75)' : 'rgba(240,245,170,0.75)';
    ctx.fillRect(x - s, y - s * 0.8, s * 1.2, s * 0.6);
    ctx.strokeStyle = 'rgba(120,50,10,0.45)'; ctx.lineWidth = 0.5;
    ctx.strokeRect(x - s, y - s * 0.8, s * 2, s * 1.6);
  }

  /* ---------- 切面 ---------- */
  function facePath(ctx, th) {
    ctx.beginPath();
    let p = P(0, 0, 0); ctx.moveTo(p[0], p[1]);
    for (let z = 0; z <= TOP; z += 2) { p = surf(th, z); ctx.lineTo(p[0], p[1]); }
    p = P(0, 0, TOP); ctx.lineTo(p[0], p[1]);
    ctx.closePath();
  }
  function drawFace(ctx, th, lit, seed) {
    const rnd = K.rng(seed);
    facePath(ctx, th);
    ctx.fillStyle = lit ? '#F8D47C' : '#E2B45A'; ctx.fill();
    ctx.save();
    facePath(ctx, th); ctx.clip();
    // 本地座標：(r, z)
    ctx.save();
    ctx.transform(Math.cos(th), Math.sin(th) * KY, 0, -1, CX, B);
    const g = ctx.createLinearGradient(0, 0, 0, TOP);
    g.addColorStop(0, lit ? '#F0C466' : '#D6A24A');
    g.addColorStop(0.6, lit ? '#FBDC8A' : '#E8BC62');
    g.addColorStop(1, lit ? '#FFE7A4' : '#EEC772');
    ctx.fillStyle = g; ctx.fillRect(0, 0, RD + 2, TOP + 2);
    // 一絲絲直向的氣孔（潘娜朵妮的招牌組織）
    for (let i = 0; i < 90; i++) {
      const r = 3 + rnd() * (RD - 6), z = 4 + rnd() * (TOP - 10);
      if (r > rOut(z) - 4) continue;
      const len = 4 + rnd() * 8, w = 0.6 + rnd() * 1.2;
      ctx.fillStyle = `rgba(190,128,40,${0.25 + rnd() * 0.25})`;
      ctx.beginPath(); ctx.ellipse(r, z, w, len / 2, (rnd() - 0.5) * 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,200,0.55)';
      ctx.beginPath(); ctx.ellipse(r - w * 0.8, z + 0.6, w * 0.45, len / 2.4, 0, 0, TAU); ctx.fill();
    }
    // 葡萄乾、糖漬橙皮、香櫞
    for (let i = 0; i < 12; i++) {
      const r = 8 + rnd() * (RD - 18), z = 8 + rnd() * (TOP - 30);
      if (r > rOut(z) - 7) continue;
      const k = rnd();
      ctx.save(); ctx.translate(r, z); ctx.scale(1, -1);
      if (k < 0.55) raisin(ctx, 0, 0, 3.4 + rnd() * 1.2, rnd() * 3);
      else peel(ctx, 0, 0, 2.8 + rnd() * 0.8, k < 0.85);
      ctx.restore();
    }
    // 外皮（圓頂）與紙模的厚度
    ctx.strokeStyle = '#7A3C14'; ctx.lineWidth = 5;
    ctx.beginPath();
    for (let z = HP; z <= TOP; z += 2) { const r = rOut(z); z === HP ? ctx.moveTo(r, z) : ctx.lineTo(r, z); }
    ctx.stroke();
    ctx.strokeStyle = '#B87A3A'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let z = HP; z <= TOP; z += 2) { const r = rOut(z) - 3; z === HP ? ctx.moveTo(r, z) : ctx.lineTo(r, z); }
    ctx.stroke();
    ctx.fillStyle = '#5A3216'; ctx.fillRect(RP - 2.2, 0, 2.2, HP);
    ctx.fillStyle = '#C68E4E'; ctx.fillRect(RP - 4.5, 0, 2.3, HP);   // 底部烤色
    ctx.fillStyle = 'rgba(150,90,30,0.55)'; ctx.fillRect(0, 0, RP, 3);
    ctx.restore();
    if (!lit) { ctx.fillStyle = 'rgba(120,70,20,0.12)'; ctx.fillRect(0, 0, 200, 200); }
    ctx.restore();
    facePath(ctx, th);
    ctx.strokeStyle = 'rgba(120,70,25,0.6)'; ctx.lineWidth = 0.9; ctx.stroke();
  }

  // 切掉那塊之後露出的「地面」區域（要挖空）
  function floorPath(ctx, grow) {
    ctx.beginPath();
    const o = P(0, 0, 0); ctx.moveTo(o[0], o[1]);
    for (let i = 0; i <= 16; i++) {
      const th = TH1 + (TH2 - TH1) * i / 16;
      const p = P(Math.cos(th) * RP, Math.sin(th) * RP, 0);
      ctx.lineTo(p[0], p[1] + grow * Math.sin(th));
    }
    ctx.closePath();
  }

  function draw(ctx) {
    drawPaper(ctx);
    drawDome(ctx);
    // 挖掉前方那一塊，畫兩個切面
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    floorPath(ctx, 3); ctx.fill();
    ctx.restore();
    drawFace(ctx, TH2, false, 7);
    drawFace(ctx, TH1, true, 13);
    // 外輪廓：畫在後面，只露出外側一半
    ctx.save();
    const clipP = new Path2D();
    clipP.rect(0, 0, 200, 200);
    const o = P(0, 0, 0); clipP.moveTo(o[0], o[1]);
    for (let i = 0; i <= 16; i++) {
      const th = TH1 + (TH2 - TH1) * i / 16;
      const p = P(Math.cos(th) * RP, Math.sin(th) * RP, 0);
      clipP.lineTo(p[0], p[1] + 6 * Math.sin(th));
    }
    clipP.closePath();
    ctx.clip(clipP, 'evenodd');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.3; ctx.lineJoin = 'round';
    paperPath(ctx); ctx.stroke();
    domePath(ctx); ctx.stroke();
    ctx.restore();
    // 切口底邊
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
    const o2 = P(0, 0, 0), f1 = P(Math.cos(TH1) * RP, Math.sin(TH1) * RP, 0), f2 = P(Math.cos(TH2) * RP, Math.sin(TH2) * RP, 0);
    ctx.beginPath(); ctx.moveTo(f1[0], f1[1]); ctx.lineTo(o2[0], o2[1]); ctx.lineTo(f2[0], f2[1]); ctx.stroke();
    ctx.restore();
  }

  window.DESSERTS['panettone'] = {
    draw,
    crumbs: ['#F8D47C', '#7A3C14', '#3A1418', '#E8781E', '#FFE7A4'],
    crunchy: 0.25,
  };
})();
