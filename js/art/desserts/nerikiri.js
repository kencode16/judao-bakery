/* 練切（練り切り）櫻花造型
 * 五瓣櫻花形的和菓子，從斜上方看：厚厚的一塊，頂面微微隆起；花瓣尖端有櫻花特有的小缺口，
 * 由中心往外從淡白粉暈染成粉紅（ぼかし），三角棒壓出的花瓣分界線，中央一撮黃色花蕊。光源左上。
 */
(function () {
  'use strict';
  const K = window.DessertKit;
  const TAU = Math.PI * 2;

  const CX = 100, CY = 110;
  const SP = 0.62, CP = 0.78;
  const R = 84, T = 25, D = 13;              // 外圍半徑、側邊厚度、頂面隆起
  const ROT = -Math.PI / 2 + 0.12;           // 第一片花瓣朝後方（略轉一點）

  // 花瓣外形：五瓣、瓣間凹、瓣尖一個小缺口
  function rOf(phi) {
    let a = ((phi - ROT) % (TAU / 5) + TAU / 5) % (TAU / 5);  // 0～72°
    const d = a - TAU / 10;                                      // -36°～36°，0 是瓣尖
    const c = Math.cos(d * 2.5);                                  // 瓣尖 1、瓣間 0
    let r = R * (0.5 + 0.5 * Math.pow(Math.max(0, c), 0.42));
    r -= R * 0.13 * Math.exp(-Math.pow(d / 0.075, 2));          // 缺口
    return r;
  }
  const NP = 300;
  const OUT = []; for (let i = 0; i < NP; i++) { const p = i / NP * TAU; OUT.push([p, rOf(p)]); }

  // 頂面上的點：s = 0（中心）～1（邊緣）
  const zTop = s => T + D * Math.pow(Math.max(0, 1 - s * s), 0.7);
  const P = (rho, phi, z) => [CX + rho * Math.cos(phi), CY + rho * Math.sin(phi) * SP - z * CP];

  function ring(ctx, s, z) {
    OUT.forEach(([p, r], i) => {
      const q = P(r * s, p, z);
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    });
    ctx.closePath();
  }
  // 頂面整塊（各高度的花形疊起來的聯集）
  function topPath(ctx) {
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) { const s = 1 - k / 12 * 0.95; ring(ctx, s, zTop(s)); }
  }

  /* ---------- 側面 ---------- */
  function drawSide(ctx) {
    // 底面花形＋每一段的側壁四邊形（兩個路徑分開填，避免繞向互相抵消）
    const top = OUT.map(([p, r]) => P(r, p, T)), bot = OUT.map(([p, r]) => P(r, p, 0));
    const sidePath = () => {
      ctx.beginPath();
      bot.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      ctx.closePath();
      for (let i = 0; i < NP; i++) {
        const j = (i + 1) % NP;
        if (Math.sin(OUT[i][0]) < -0.2) continue;      // 後面看不到
        // 和底面花形同一個繞向
        ctx.moveTo(top[j][0], top[j][1]); ctx.lineTo(top[i][0], top[i][1]);
        ctx.lineTo(bot[i][0], bot[i][1]); ctx.lineTo(bot[j][0], bot[j][1]); ctx.closePath();
      }
    };
    sidePath();
    const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
    g.addColorStop(0, '#F28CAB');
    g.addColorStop(0.35, '#EC7A9C');
    g.addColorStop(1, '#C9557C');
    ctx.fillStyle = g; ctx.fill('nonzero');
    ctx.save(); sidePath(); ctx.clip('nonzero');
    const gv = ctx.createLinearGradient(0, CY - T * CP, 0, CY + R * SP);
    gv.addColorStop(0, 'rgba(255,220,230,0.35)');
    gv.addColorStop(0.5, 'rgba(255,220,230,0)');
    gv.addColorStop(1, 'rgba(150,40,80,0.3)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, 200, 200);
    // 細緻的豆沙質感
    const rnd = K.rng(13);
    for (let i = 0; i < 60; i++) {
      const p = rnd() * Math.PI, z = rnd() * T;
      const q = P(rOf(p) - 0.5, p, z);
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,235,240,0.35)' : 'rgba(180,60,100,0.2)';
      ctx.beginPath(); ctx.arc(q[0], q[1], 0.5 + rnd() * 0.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(160,50,90,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); bot.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke();
  }

  /* ---------- 頂面 ---------- */
  function drawTop(ctx) {
    const top = P(0, 0, T + D);
    topPath(ctx);
    ctx.fillStyle = '#F6A5BD'; ctx.fill('nonzero');
    ctx.save();
    topPath(ctx); ctx.clip('nonzero');
    // ぼかし：中心淡白粉 → 花瓣尖端粉紅
    ctx.save();
    ctx.translate(top[0], top[1]); ctx.scale(1, SP * 1.05);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 1.02);
    g.addColorStop(0, '#FFF6F2');
    g.addColorStop(0.3, '#FDE1E8');
    g.addColorStop(0.62, '#F9B6CA');
    g.addColorStop(0.88, '#F18BAB');
    g.addColorStop(1, '#E8769A');
    ctx.fillStyle = g; ctx.fillRect(-R * 1.2, -R * 1.6, R * 2.4, R * 3.2);
    ctx.restore();
    // 每片花瓣的鼓起：瓣中央稍亮、邊緣稍暗
    for (let k = 0; k < 5; k++) {
      const pc = ROT + TAU / 10 + k * TAU / 5;
      const q = P(R * 0.55, pc, zTop(0.55));
      const gh = ctx.createRadialGradient(q[0] - 4, q[1] - 3, 1, q[0], q[1], 26);
      gh.addColorStop(0, 'rgba(255,245,248,0.45)');
      gh.addColorStop(1, 'rgba(255,245,248,0)');
      ctx.fillStyle = gh; ctx.fillRect(q[0] - 30, q[1] - 30, 60, 60);
    }
    // 光源：左上亮、右下暗
    const gl = ctx.createLinearGradient(CX - R, CY - R * SP - 30, CX + R, CY + R * SP);
    gl.addColorStop(0, 'rgba(255,255,255,0.3)');
    gl.addColorStop(0.5, 'rgba(255,255,255,0)');
    gl.addColorStop(1, 'rgba(140,30,70,0.18)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, 200, 200);
    // 邊緣一圈圓角的暗面
    ctx.beginPath(); ring(ctx, 1, T);
    ctx.strokeStyle = 'rgba(200,70,110,0.35)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();

    // 花瓣分界的壓線（三角棒）：中心 → 瓣間；加上每片花瓣中央一條短線
    const groove = (phi, s0, s1, w, k) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const s = s0 + (s1 - s0) * i / 14, r = rOf(phi) * s;
        pts.push(P(r, phi, zTop(s) - 0.4));
      }
      const line = (dx, dy, col, lw) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        pts.forEach((q, i) => i ? ctx.lineTo(q[0] + dx, q[1] + dy) : ctx.moveTo(q[0] + dx, q[1] + dy));
        ctx.stroke();
      };
      line(0, 0, `rgba(205,70,115,${0.75 * k})`, w);
      line(0.9, 0.9, `rgba(255,240,245,${0.8 * k})`, w * 0.55);
    };
    ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const gap = ROT + k * TAU / 5;
      groove(gap, 0.16, 0.97, 1.8, 1);
      groove(gap + TAU / 10, 0.3, 0.68, 1.3, 0.75);
    }

    // 花蕊：中央一撮黃色小粒（そぼろ）
    const rnd = K.rng(29);
    const c = P(0, 0, T + D + 1);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 7.5;
      const x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d * 0.75 - 1.5;
      ctx.fillStyle = 'rgba(170,120,20,0.5)';
      ctx.beginPath(); ctx.arc(x + 0.4, y + 0.6, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = rnd() < 0.8 ? '#F6CF45' : '#FFF2B0';
      ctx.beginPath(); ctx.arc(x, y, 1.45, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,230,0.9)';
    ctx.beginPath(); ctx.arc(c[0] - 2.5, c[1] - 3.5, 1.1, 0, TAU); ctx.fill();

    // 外輪廓（頂面）
    topPath(ctx);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath(); ring(ctx, 1, T);
    ctx.strokeStyle = 'rgba(180,60,100,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  }

  function silhouetteStroke(ctx) {
    // 後半邊的頂緣輪廓（前半由側面底線負責）
    ctx.beginPath(); ring(ctx, 1, T);
    ctx.strokeStyle = 'rgba(160,50,90,0.6)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function draw(ctx) {
    drawSide(ctx);
    drawTop(ctx);
    silhouetteStroke(ctx);
  }

  window.DESSERTS['nerikiri'] = {
    draw,
    crumbs: ['#F6A5BD', '#FDE1E8', '#F6CF45', '#E8769A', '#FFF6F2'],
    crunchy: 0.05,
  };
})();
