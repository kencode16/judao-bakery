// 特效：咬一口的齒痕、碎屑、糖粉星星（照樣品 v3）。全部畫在畫面自己的 .g-fx 圖層，離開畫面就一起清掉。

/** 從邊緣咬三口的位置（canvas 比例座標 x, y, 半徑） */
export const BITES = [[0.92, 0.36, 0.22], [0.08, 0.58, 0.23], [0.66, 0.90, 0.22]];

/** 在 canvas 上咬一口：月牙缺口＋一圈小齒痕（destination-out） */
export function biteAt(ctx, W, x, y, r, off = Math.random()) {
  const cx = x * W, cy = y * W, R = r * W;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  const n = 9;
  for (let k = 0; k < n; k++) {
    const a = ((k + off) / n) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, R * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function makeFx(layer, speed = 1) {
  const D = ms => ms / speed;
  /** 碎屑往上彈一點再往下掉 */
  function crumbs(x, y, colors, n) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'g-crumb';
      const sz = 2.5 + Math.random() * 3.5;
      d.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz * (0.7 + Math.random() * 0.6)}px;` +
        `background:${colors[i % colors.length]};border-radius:${30 + Math.random() * 40}% ${40 + Math.random() * 40}%`;
      layer.appendChild(d);
      const dx = (Math.random() - 0.5) * 38, up = -8 - Math.random() * 14, fall = 30 + Math.random() * 34;
      const rot = (Math.random() - 0.5) * 540;
      d.animate([{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.6}px,${up}px) rotate(${rot * 0.4}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px,${fall}px) rotate(${rot}deg)`, opacity: 0 }],
      { duration: D(600 + Math.random() * 260), easing: 'cubic-bezier(.3,.1,.7,1)' }).onfinish = () => d.remove();
    }
  }
  /** 噴糖粉和小星星 */
  function burst(cx, cy, dist, n = 9, colors = ['#F7B6C8', '#FFE08A', '#BFE3F5', '#CBEFD9', '#FFFFFF', '#E9D5FF']) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      const isStar = i % 3 === 0;
      s.className = isStar ? 'g-star' : 'g-spark';
      const col = colors[i % colors.length];
      if (isStar) { s.textContent = '✦'; s.style.color = col === '#FFFFFF' ? '#FFD36E' : col; }
      else s.style.background = col;
      s.style.left = cx - 4 + 'px'; s.style.top = cy - 4 + 'px';
      layer.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = dist * (0.6 + Math.random() * 0.6);
      s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(.3)`, opacity: 0 }],
      { duration: D(520 + Math.random() * 200), easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => s.remove();
    }
  }
  /** 糖粉從上面輕輕飄下（解鎖卡片用） */
  function sugar(rect, n = 26) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'g-sugar';
      const sz = 2 + Math.random() * 3;
      s.style.cssText = `left:${rect.left + Math.random() * rect.width}px;top:${rect.top + Math.random() * rect.height * 0.25}px;width:${sz}px;height:${sz}px`;
      layer.appendChild(s);
      const fall = rect.height * (0.45 + Math.random() * 0.5), dx = (Math.random() - 0.5) * 30;
      s.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${fall}px)`, opacity: 0 }],
      { duration: D(1100 + Math.random() * 900), delay: D(Math.random() * 300), easing: 'cubic-bezier(.2,.4,.5,1)', fill: 'backwards' }).onfinish = () => s.remove();
    }
  }
  /** 小東西從 from 飛到 to（點單用） */
  function fly(el, from, to, ms = 420) {
    el.classList.add('g-fly');
    el.style.left = from.x + 'px'; el.style.top = from.y + 'px';
    layer.appendChild(el);
    const dx = to.x - from.x, dy = to.y - from.y;
    const a = el.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 40}px)) scale(1.1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: 0.2 }],
    { duration: D(ms), easing: 'cubic-bezier(.4,.1,.6,1)', fill: 'forwards' });
    a.onfinish = () => el.remove();
    return a;
  }
  return { crumbs, burst, sugar, fly };
}

/** 天人菊（澎湖縣花）：紅心、花瓣紅底黃尖的小花，小裝飾用 */
export function drawGaillardia(canvas, css) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = canvas.height = Math.round(css * dpr);
  canvas.style.width = canvas.style.height = css + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(canvas.width / 100, canvas.height / 100);
  ctx.translate(50, 50);
  const n = 12;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.rotate((i / n) * Math.PI * 2);
    const g = ctx.createLinearGradient(0, -14, 0, -47);
    g.addColorStop(0, '#B8322B'); g.addColorStop(0.5, '#D9482E'); g.addColorStop(0.68, '#F2A93B'); g.addColorStop(1, '#FFD45C');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.quadraticCurveTo(-11, -32, -8, -44);
    ctx.lineTo(-4, -40); ctx.lineTo(0, -46); ctx.lineTo(4, -40); ctx.lineTo(8, -44);
    ctx.quadraticCurveTo(11, -32, 5, -12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const c = ctx.createRadialGradient(-4, -4, 2, 0, 0, 17);
  c.addColorStop(0, '#9A3B22'); c.addColorStop(1, '#5E2414');
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,120,.55)';
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 4 + (i % 3) * 3.5; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.4, 0, Math.PI * 2); ctx.fill(); }
}
