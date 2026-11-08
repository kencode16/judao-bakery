/* 閃電泡芙（éclair）・精緻擬真插畫風
 * 橫放、微微往右上斜的長條泡芙，斜上 45 度看：
 * 上半部是厚厚一層亮面黑巧克力淋面（長條反光），下半部露出金褐色泡芙殼（擠花紋、烤裂紋）。
 * 和長棍麵包的差別：橫放、短胖、圓頭，上面是深色巧克力、沒有劃痕。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 100, ROT = -0.13;
  const HL = 81;            // 半長（含圓頭）
  const TOP = -25, BOT = 32; // 泡芙上下緣（區域座標）
  const MID = (TOP + BOT) / 2, HH = (BOT - TOP) / 2;

  // 泡芙輪廓：兩端是圓頭（超橢圓），中段微微有起伏
  function bodyY(u, side) {
    const r = Math.min(1, Math.abs(u) / HL);
    const k = Math.pow(1 - Math.pow(r, 3.2), 1 / 2.4);
    const wob = 0.8 * Math.sin(u * 0.11 + (side > 0 ? 1.3 : 0.2));
    return MID + side * (HH * k + (k > 0.3 ? wob : 0));
  }
  const N = 140;
  function bodyPath(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = -HL + 2 * HL * i / N;
      const y = bodyY(u, -1);
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    for (let i = N; i >= 0; i--) {
      const u = -HL + 2 * HL * i / N;
      ctx.lineTo(u, bodyY(u, 1));
    }
    ctx.closePath();
  }
  // 淋面下緣：中段在泡芙高度約 6 成處，兩端往上收（淋面包住圓頭）
  function glazeEdge(u) {
    const r = Math.abs(u) / HL;
    return MID + 5 + 1.6 * Math.sin(u * 0.19 + 0.6) + 1.1 * Math.sin(u * 0.47) - 15 * Math.pow(r, 5);
  }
  function glazePath(ctx) {
    ctx.beginPath();
    const u0 = -HL + 2.5, u1 = HL - 2.5;
    for (let i = 0; i <= N; i++) {
      const u = u0 + (u1 - u0) * i / N;
      const y = Math.min(bodyY(u, -1) + 1, glazeEdge(u));
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    for (let i = N; i >= 0; i--) {
      const u = u0 + (u1 - u0) * i / N;
      const y = Math.min(bodyY(u, 1) - 1, glazeEdge(u));
      ctx.lineTo(u, y);
    }
    ctx.closePath();
  }

  /* ---------- 泡芙殼 ---------- */
  function drawChoux(ctx) {
    bodyPath(ctx);
    const g = ctx.createLinearGradient(0, TOP, 0, BOT);
    g.addColorStop(0, '#E8A64E');
    g.addColorStop(0.45, '#F0BA62');
    g.addColorStop(0.7, '#D99042');
    g.addColorStop(0.9, '#B36A26');
    g.addColorStop(1, '#8E4E1A');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    bodyPath(ctx);
    ctx.clip();
    // 左亮右暗
    const h = ctx.createLinearGradient(-HL, 0, HL, 0);
    h.addColorStop(0, 'rgba(255,236,190,0.28)');
    h.addColorStop(0.35, 'rgba(255,236,190,0)');
    h.addColorStop(0.7, 'rgba(120,56,14,0)');
    h.addColorStop(1, 'rgba(110,50,12,0.35)');
    ctx.fillStyle = h;
    ctx.fillRect(-HL, TOP - 5, HL * 2, BOT - TOP + 10);
    // 擠花紋：沿長邊的一道道稜線
    const r = K.rng(77);
    for (let k = 0; k < 5; k++) {
      const off = 0.25 + k * 0.17;
      ctx.lineCap = 'round';
      let u = -HL + 6 + r() * 8;
      while (u < HL - 8) {
        const len = 16 + r() * 34;
        const u1 = Math.min(HL - 6, u + len);
        const pts = [];
        for (let x = u; x <= u1; x += 2) {
          const top = Math.min(bodyY(x, 1), glazeEdge(x));
          const y = top + (bodyY(x, 1) - top) * off;
          pts.push([x, y]);
        }
        ctx.strokeStyle = 'rgba(140,72,20,0.38)';
        ctx.lineWidth = 1.1;
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,222,160,0.4)';
        ctx.lineWidth = 0.9;
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 1.3) : ctx.moveTo(p[0], p[1] - 1.3)); ctx.stroke();
        u = u1 + 4 + r() * 10;
      }
    }
    // 烤色斑點
    for (let i = 0; i < 50; i++) {
      const u = (r() * 2 - 1) * HL * 0.95;
      const y = glazeEdge(u) + r() * (bodyY(u, 1) - glazeEdge(u));
      ctx.fillStyle = r() < 0.6 ? `rgba(130,62,16,${0.15 + r() * 0.2})` : `rgba(255,226,170,${0.25 + r() * 0.2})`;
      ctx.beginPath(); ctx.ellipse(u, y, 0.8 + r() * 1.8, 0.5 + r() * 0.8, 0, 0, TAU); ctx.fill();
    }
    // 底緣陰影
    ctx.strokeStyle = 'rgba(100,46,12,0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = -HL + 2 * HL * i / N;
      const y = bodyY(u, 1) + 1;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    // 淋面下方投在泡芙上的影子
    ctx.save();
    ctx.translate(0.5, 2.6);
    glazePath(ctx);
    ctx.fillStyle = 'rgba(90,40,10,0.42)';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ---------- 巧克力淋面 ---------- */
  function drawGlaze(ctx) {
    glazePath(ctx);
    const g = ctx.createLinearGradient(0, TOP, 0, MID + 10);
    g.addColorStop(0, '#6E3D25');
    g.addColorStop(0.3, '#55301C');
    g.addColorStop(0.75, '#3A1D10');
    g.addColorStop(1, '#2A140B');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    glazePath(ctx);
    ctx.clip();
    // 左亮右暗＋兩端圓頭的暗部
    const h = ctx.createLinearGradient(-HL, 0, HL, 0);
    h.addColorStop(0, 'rgba(130,80,50,0.35)');
    h.addColorStop(0.3, 'rgba(130,80,50,0)');
    h.addColorStop(0.75, 'rgba(10,4,2,0)');
    h.addColorStop(1, 'rgba(10,4,2,0.35)');
    ctx.fillStyle = h;
    ctx.fillRect(-HL, TOP - 4, HL * 2, 60);
    // 寬而柔的光澤帶
    ctx.save();
    ctx.translate(-14, TOP + 9.5);
    ctx.scale(1, 0.13);
    const s = ctx.createRadialGradient(0, 0, 4, 0, 0, 66);
    s.addColorStop(0, 'rgba(255,225,200,0.42)');
    s.addColorStop(0.6, 'rgba(255,215,190,0.14)');
    s.addColorStop(1, 'rgba(255,215,190,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.fill();
    ctx.restore();
    // 鏡面反光：一條細長亮線＋左端一個亮點
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,248,240,0.82)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const u = -58 + 76 * i / 30;
      const y = bodyY(u, -1) + 6.5 + 0.6 * Math.sin(u * 0.08);
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,248,240,0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = 28 + 26 * i / 12;
      const y = bodyY(u, -1) + 6.8;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,244,0.85)';
    ctx.beginPath(); ctx.ellipse(-68, bodyY(-68, -1) + 9, 3.2, 2, -0.5, 0, TAU); ctx.fill();
    // 下緣的淋面厚度：一道亮邊（受光）
    ctx.strokeStyle = 'rgba(160,106,74,0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = -HL + 10 + (2 * HL - 20) * i / N;
      const y = glazeEdge(u) - 1.4;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(ROT);
    drawChoux(ctx);
    drawGlaze(ctx);
    bodyPath(ctx);
    ctx.strokeStyle = 'rgba(90,40,14,0.62)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  window.DESSERTS['eclair'] = {
    draw,
    crumbs: ['#3A1F13', '#E8A64E', '#5C3322', '#FFF1D2', '#B36A26'],
    crunchy: 0.35,
  };
})();
