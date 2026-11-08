// 奶油擠花線（照樣品 v3）：沿折線擠出 → 停一下 → 淡出。
export const PIPE_DRAW = 220, PIPE_HOLD = 360, PIPE_FADE = 240;

/** 取折線的前 prog（0～1）比例 */
export function partialPath(pts, prog) {
  const segL = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segL.push(L); total += L; }
  let left = total * prog; const out = [pts[0].slice()];
  for (let i = 0; i < segL.length; i++) {
    if (left >= segL[i]) { out.push(pts[i + 1].slice()); left -= segL[i]; }
    else { const k = segL[i] ? left / segL[i] : 0; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]); break; }
  }
  return out;
}

function tracePath(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }

/** 畫一條奶油線：prog 擠到哪裡（0～1）、alpha 透明度、w 粗細、piping＝前端有一小坨奶油 */
export function drawCream(ctx, pts, prog, alpha, w, piping) {
  const p = partialPath(pts, prog);
  if (p.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // 底下的影子和奶油邊緣
  tracePath(ctx, p);
  ctx.shadowColor = 'rgba(110,70,40,.32)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.strokeStyle = '#EAD3B2'; ctx.lineWidth = w; ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#FFF9EF'; ctx.lineWidth = w * 0.8; ctx.stroke();
  // 擠花紋：星形花嘴擠出來的一圈圈斜紋
  ctx.strokeStyle = 'rgba(206,170,128,.42)'; ctx.lineWidth = Math.max(1, w * 0.1);
  const step = w * 0.62, r = w * 0.3;
  let start = step * 0.5;
  for (let i = 0; i < p.length - 1; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[i + 1];
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (!L) continue;
    const dx = (x2 - x1) / L, dy = (y2 - y1) / L, nx = -dy, ny = dx;
    let s = start;
    for (; s < L; s += step) {
      const cx = x1 + dx * s, cy = y1 + dy * s;
      ctx.beginPath();
      ctx.moveTo(cx + nx * r - dx * r * 0.55, cy + ny * r - dy * r * 0.55);
      ctx.quadraticCurveTo(cx + dx * r * 0.3, cy + dy * r * 0.3, cx - nx * r + dx * r * 0.55, cy - ny * r + dy * r * 0.55);
      ctx.stroke();
    }
    start = s - L;
  }
  // 左上的亮光
  ctx.save();
  ctx.translate(-w * 0.08, -w * 0.12);
  tracePath(ctx, p);
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = w * 0.24; ctx.stroke();
  ctx.restore();
  // 正在擠的時候，前端有一小坨奶油
  if (piping) {
    const [hx, hy] = p[p.length - 1];
    ctx.shadowColor = 'rgba(110,70,40,.3)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1.5;
    ctx.fillStyle = '#FFF9EF';
    ctx.beginPath(); ctx.arc(hx, hy, w * 0.62, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** 線頭線尾縮到甜點邊緣，不蓋住甜點 */
export function trimEnds(pts, d0) {
  const trim = (p, q) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    const d = Math.min(d0, L / 2 - 1);
    if (d > 0 && L) { p[0] += dx / L * d; p[1] += dy / L * d; }
  };
  trim(pts[0], pts[1]); trim(pts[pts.length - 1], pts[pts.length - 2]);
  return pts;
}

/** 疊在盤面上的奶油線圖層 */
export class PipeLayer {
  constructor(canvas, speed = 1) {
    this.cv = canvas; this.pipes = []; this.raf = 0; this.speed = speed; this.dpr = 1;
  }
  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.dpr = dpr;
  }
  add(pts, w) {
    this.pipes.push({ pts, w, t0: performance.now() });
    if (!this.raf) this.raf = requestAnimationFrame(t => this.frame(t));
  }
  /** 畫某個時間點（測試時可以直接呼叫 drawAt 檢查動畫中途的樣子） */
  drawAt(now) {
    const ctx = this.cv.getContext('2d'), s = this.speed;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i], e = (now - p.t0) * s;
      if (e > PIPE_DRAW + PIPE_HOLD + PIPE_FADE) { this.pipes.splice(i, 1); continue; }
      const prog = Math.min(1, Math.max(0, e) / PIPE_DRAW);
      const eased = 1 - Math.pow(1 - prog, 2.2);
      const alpha = e < PIPE_DRAW + PIPE_HOLD ? 1 : 1 - (e - PIPE_DRAW - PIPE_HOLD) / PIPE_FADE;
      drawCream(ctx, p.pts, eased, alpha, p.w, prog < 1);
    }
  }
  frame(now) {
    this.drawAt(now);
    if (this.pipes.length) this.raf = requestAnimationFrame(t => this.frame(t));
    else { this.raf = 0; const ctx = this.cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.cv.width, this.cv.height); }
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; this.pipes = []; }
}
