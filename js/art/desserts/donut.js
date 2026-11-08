/* 巧克力糖霜彩色糖珠甜甜圈（donut）
 *
 * 作法：把甜甜圈當成一個「超橢圓截面的圓環」，用斜上 45 度的正投影算出
 * 外輪廓、中間的洞、糖霜邊界；體積明暗用細小四邊形網格（依深度由遠到近）上色，
 * 再疊上插畫細節：米白腰帶、糖霜滴落、光澤高光、彩色糖針。
 */
(function () {
  'use strict';
  const K = window.DessertKit;

  /* ===== 幾何參數（200×200 單位） ===== */
  const CX = 100, CY = 97;
  const RM = 57.5;        // 環中心半徑
  const TA = 24.5;        // 管截面半寬（徑向）
  const TB = 22;          // 管截面半高
  const SP = 0.82;        // 超橢圓指數（<1 側面較直）
  const EL = 45 * Math.PI / 180;
  const SN = Math.sin(EL), CS = Math.cos(EL);
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  const VIEW = [0, -CS, SN];
  const LIGHT = nrm([-0.58, -0.32, 0.75]);
  const HALF = nrm([LIGHT[0] + VIEW[0], LIGHT[1] + VIEW[1], LIGHT[2] + VIEW[2]]);

  /* ===== 小工具 ===== */
  function nrm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function spow(v, p) { return v < 0 ? -Math.pow(-v, p) : Math.pow(v, p); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function css(c, a) {
    const r = clamp(Math.round(c[0]), 0, 255), g = clamp(Math.round(c[1]), 0, 255), b = clamp(Math.round(c[2]), 0, 255);
    return a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
  }
  function ramp(stops, t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0]));
      }
    }
    return stops[stops.length - 1][1].slice();
  }

  /* ===== 圓環曲面 ===== */
  function sec(psi) { return [RM + TA * spow(Math.cos(psi), SP), TB * spow(Math.sin(psi), SP)]; }
  function secN(psi) {
    const e = 1e-3, a = sec(psi - e), b = sec(psi + e);
    const dr = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dr, dz) || 1;
    return [dz / l, -dr / l];
  }
  function pos(phi, psi) { const s = sec(psi); return [s[0] * Math.cos(phi), s[0] * Math.sin(phi), s[1]]; }
  function normal(phi, psi) { const n = secN(psi); return [n[0] * Math.cos(phi), n[0] * Math.sin(phi), n[1]]; }
  function proj(p) { return [CX + p[0], CY - p[1] * SN - p[2] * CS]; }
  function depth(p) { return p[1] * CS - p[2] * SN; }
  function scr(phi, psi) { return proj(pos(phi, psi)); }
  function facing(phi, psi) { return dot(normal(phi, psi), VIEW); }

  // 外側輪廓的 ψ（-π/2～π/2 之間，正面／背面交界）
  function silOuter(phi) {
    let lo = -HP + 1e-4, hi = HP - 1e-4;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (facing(phi, m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  // 內側（洞）輪廓的 ψ（π/2～3π/2）
  function silInner(phi) {
    let lo = HP + 1e-4, hi = 3 * HP - 1e-4;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (facing(phi, m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  // 從中心 (CX,CY) 沿角度 a 射出，與水平圓環投影（橢圓）的交點距離
  const RINGS_OUT = [], RINGS_IN = [];
  for (let i = 0; i <= 64; i++) {
    RINGS_OUT.push(sec(-HP + Math.PI * i / 64));
    RINGS_IN.push(sec(HP + Math.PI * i / 64));
  }
  function rayHit(ca, sa, ring) {
    const r = ring[0], z = ring[1];
    const u = ca / r, v = sa / (r * SN), w = z * CS / (r * SN);
    const A = u * u + v * v, Bq = v * w, Cq = w * w - 1;
    return (-Bq + Math.sqrt(Math.max(0, Bq * Bq - A * Cq))) / A;
  }
  function outT0(a) { const ca = Math.cos(a), sa = Math.sin(a); let m = 0; for (const r of RINGS_OUT) m = Math.max(m, rayHit(ca, sa, r)); return m; }
  function holeT0(a) { const ca = Math.cos(a), sa = Math.sin(a); let m = 1e9; for (const r of RINGS_IN) m = Math.min(m, rayHit(ca, sa, r)); return m; }
  // 查表版（720 個角度，線性內插）
  const NT = 720, T_OUT = new Float64Array(NT + 1), T_HOLE = new Float64Array(NT + 1);
  for (let i = 0; i <= NT; i++) { const a = TAU * i / NT; T_OUT[i] = outT0(a); T_HOLE[i] = holeT0(a); }
  function lut(tab, a) {
    let f = ((a % TAU) + TAU) % TAU / TAU * NT;
    const i = Math.floor(f); f -= i;
    return tab[i] + (tab[i + 1] - tab[i]) * f;
  }
  function outT(a) { return lut(T_OUT, a); }
  function holeT(a) { return lut(T_HOLE, a); }

  /* ===== 糖霜邊界（ψ 值，略不規則） ===== */
  function edgeOut(phi) {
    // 遠側（看不到的那半圈）往下包多一點，讓左右兩端的糖霜邊早點繞到背後
    const far = Math.pow(Math.max(0, Math.sin(phi)), 0.6);
    return 0.34 - 0.3 * far - 0.16 * Math.cos(phi) ** 2 + 0.07 * Math.sin(3 * phi + 0.6) + 0.045 * Math.sin(5 * phi + 2.1) + 0.025 * Math.sin(11 * phi + 0.3);
  }
  function edgeIn(phi) {
    return 2.5 + 0.07 * Math.sin(4 * phi + 1.3) + 0.04 * Math.sin(9 * phi + 0.5) + 0.4 * Math.max(0, -Math.sin(phi));
  }
  // 米白腰帶的中心 ψ
  function bandC(phi) { return -0.06 + 0.035 * Math.sin(4 * phi + 0.8) + 0.02 * Math.sin(9 * phi + 2); }

  /* ===== 配色 ===== */
  const DOUGH = [[0, rgb('#5a2f16')], [0.3, rgb('#94552a')], [0.55, rgb('#c47f3d')], [0.8, rgb('#e0a35c')], [1, rgb('#f2c681')]];
  const CREAM = [[0, rgb('#8a6440')], [0.45, rgb('#d4b483')], [0.8, rgb('#f0dcb2')], [1, rgb('#fbf0d6')]];
  const GLAZE = [[0, rgb('#1c0d06')], [0.35, rgb('#341a0d')], [0.65, rgb('#532a16')], [1, rgb('#764025')]];
  const SPEC = rgb('#fff3e4');

  function doughColor(psi, n, bc) {
    const ndl = dot(n, LIGHT);
    let t = 0.24 + 0.76 * Math.max(0, ndl);
    let ao = 1;
    const cp = Math.cos(psi);
    if (cp < 0) ao -= 0.5 * sstep(2.4, 3.9, psi);         // 洞內壁越深越暗
    if (psi < 0 && cp > 0) ao -= 0.22 * sstep(0, -1.0, psi); // 下緣
    t *= ao;
    let c = ramp(DOUGH, t);
    const d = Math.abs(psi - bc);
    const band = 1 - sstep(0.09, 0.17, d);
    if (band > 0) c = mix(c, ramp(CREAM, t * 1.05), band * 0.92);
    return c;
  }
  function glazeColor(n) {
    const ndl = Math.max(0, dot(n, LIGHT));
    const ndv = Math.max(0, dot(n, VIEW));
    const ndh = Math.max(0, dot(n, HALF));
    let c = ramp(GLAZE, 0.1 + 0.9 * ndl);
    c = mix(c, rgb('#8a5a40'), 0.28 * Math.pow(1 - ndv, 3));     // 邊緣反光
    c = mix(c, SPEC, 0.3 * Math.pow(ndh, 12) + 0.12 * Math.pow(ndh, 40));
    return c;
  }

  /* ===== 預先計算（只做一次） ===== */
  let G = null;
  function build() {
    const g = {};
    // 身體外輪廓與洞
    const out = [], hole = [];
    for (let i = 0; i < 360; i++) {
      const a = TAU * i / 360;
      const t1 = outT(a), t2 = holeT(a);
      out.push([CX + Math.cos(a) * t1, CY + Math.sin(a) * t1]);
      hole.push([CX + Math.cos(a) * t2, CY + Math.sin(a) * t2]);
    }
    g.out = out; g.hole = hole;

    // 糖霜外緣（看不到的部分推到輪廓外，由身體裁切）
    const N = 540;
    let eo = [], ei = [];
    for (let k = 0; k < N; k++) {
      const phi = TAU * k / N;
      const po = edgeOut(phi), so = silOuter(phi);
      let p = scr(phi, Math.max(po, so));
      const pushO = 6 * sstep(0, 0.12, so - po);
      if (pushO > 0) { const dx = p[0] - CX, dy = p[1] - CY, l = Math.hypot(dx, dy); p = [p[0] + dx / l * pushO, p[1] + dy / l * pushO]; }
      eo.push({ x: p[0], y: p[1], phi });
      const pi = edgeIn(phi), si = silInner(phi);
      let q = scr(phi, Math.min(pi, si));
      const pushI = 6 * sstep(0, 0.12, pi - si);
      if (pushI > 0) { const dx = q[0] - CX, dy = q[1] - CY, l = Math.hypot(dx, dy); q = [q[0] - dx / l * pushI, q[1] - dy / l * pushI]; }
      ei.push({ x: q[0], y: q[1], phi });
    }
    // 滴落：外側正面往下、洞內壁往下
    const rnd = K.rng(51);
    const dripsOut = [[3.62, 3.6, 7], [4.02, 4.2, 11], [4.5, 3.4, 6], [4.98, 4.4, 10], [5.45, 3.8, 12], [5.92, 3.3, 6.5]];
    g.bulbs = [];
    for (const [phi, hw, L] of dripsOut) eo = addDrip(eo, phi, hw + rnd() * 0.4, L, out, false, g.bulbs);
    const dripsIn = [[1.15, 3.0, 6.5], [2.15, 3.4, 8]];
    for (const [phi, hw, L] of dripsIn) ei = addDrip(ei, phi, hw, L, hole, true, g.bulbs);
    g.eo = eo; g.ei = ei;

    // 網格
    // 網格：行（φ）與列（ψ）各自先算好，再組合
    const NP = 210, NS = 144;
    const gx = new Float64Array((NP + 1) * (NS + 1)), gy = new Float64Array((NP + 1) * (NS + 1));
    const cR = [], cZ = [];
    for (let j = 0; j <= NS; j++) { const s = sec(-HP + TAU * j / NS); cR.push(s[0]); cZ.push(s[1]); }
    for (let i = 0; i <= NP; i++) {
      const phi = TAU * i / NP, c = Math.cos(phi), s = Math.sin(phi);
      for (let j = 0; j <= NS; j++) {
        const k = i * (NS + 1) + j;
        gx[k] = CX + cR[j] * c;
        gy[k] = CY - cR[j] * s * SN - cZ[j] * CS;
      }
    }
    const rowN = [], rowP = [];
    for (let j = 0; j < NS; j++) {
      const psi = -HP + TAU * (j + 0.5) / NS;
      rowN.push(secN(psi)); rowP.push(sec(psi));
    }
    const dq = [], gq = [];
    for (let i = 0; i < NP; i++) {
      const phi = TAU * (i + 0.5) / NP, cp = Math.cos(phi), sp = Math.sin(phi);
      const eoP = edgeOut(phi), eiP = edgeIn(phi), bc = bandC(phi);
      for (let j = 0; j < NS; j++) {
        const sn = rowN[j];
        const n = [sn[0] * cp, sn[0] * sp, sn[1]];
        if (dot(n, VIEW) < -0.1) continue;
        const psi = -HP + TAU * (j + 0.5) / NS;
        const d = rowP[j][0] * sp * CS - rowP[j][1] * SN;
        const k0 = i * (NS + 1) + j, k1 = (i + 1) * (NS + 1) + j;
        const xs = [gx[k0], gx[k1], gx[k1 + 1], gx[k0 + 1]], ys = [gy[k0], gy[k1], gy[k1 + 1], gy[k0 + 1]];
        const mx = (xs[0] + xs[1] + xs[2] + xs[3]) / 4, my = (ys[0] + ys[1] + ys[2] + ys[3]) / 4, f = 1.1;
        const pts = new Float32Array(8);
        for (let m = 0; m < 4; m++) { pts[m * 2] = mx + (xs[m] - mx) * f; pts[m * 2 + 1] = my + (ys[m] - my) * f; }
        const inGlaze = psi > eoP + 0.14 && psi < eiP - 0.14;
        if (!inGlaze) dq.push({ d, pts, col: css(doughColor(psi, n, bc)) });
        if (psi > eoP - 1.1 && psi < eiP + 0.9) gq.push({ d, pts, col: css(glazeColor(n)) });
      }
    }
    dq.sort((p, q) => q.d - p.d); gq.sort((p, q) => q.d - p.d);
    g.dq = dq; g.gq = gq;

    // 高光位置：在糖霜可見範圍找 n·H 最大處（外側一處、內側一處）
    let bestO = null, bestI = null;
    for (let i = 0; i < 240; i++) {
      const phi = TAU * i / 240;
      for (let j = 0; j < 90; j++) {
        const psi = TAU * j / 90 - 0.2;
        if (psi < edgeOut(phi) + 0.15 || psi > edgeIn(phi) - 0.2) continue;
        const n = normal(phi, psi);
        if (dot(n, VIEW) < 0.15) continue;
        const h = dot(n, HALF);
        if (Math.cos(psi) > 0) { if (!bestO || h > bestO.h) bestO = { phi, psi, h }; }
        else if (!bestI || h > bestI.h) bestI = { phi, psi, h };
      }
    }
    g.hiO = bestO; g.hiI = bestI;

    // 糖針
    const COLS = ['#ff6fa8', '#ffd23a', '#47a6f2', '#55c96a', '#fffaf0', '#ff8a2e'];
    const sr = K.rng(20261108);
    const spr = [];
    let tries = 0, ci = 0;
    while (spr.length < 40 && tries < 5000) {
      tries++;
      const phi = sr() * TAU;
      const lo = Math.max(0.6, edgeOut(phi) + 0.3), hi = Math.min(2.25, edgeIn(phi) - 0.3);
      if (hi <= lo) continue;
      const psi = lo + sr() * (hi - lo);
      const n = normal(phi, psi);
      const fv = dot(n, VIEW);
      if (fv < 0.32) continue;
      const p = scr(phi, psi);
      const dx = p[0] - CX, dy = p[1] - CY, dist = Math.hypot(dx, dy), al = Math.atan2(dy, dx);
      if (dist < holeT(al) + 6 || dist > outT(al) - 6) continue;
      if (spr.some(s => (s.x - p[0]) ** 2 + (s.y - p[1]) ** 2 < 11.5 * 11.5)) continue;
      const beta = sr() * Math.PI;
      const tphi = [-Math.sin(phi), Math.cos(phi), 0];
      const pa = pos(phi, psi - 0.01), pb = pos(phi, psi + 0.01);
      const tpsi = nrm([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]);
      const dir = [0, 1, 2].map(k => Math.cos(beta) * tphi[k] + Math.sin(beta) * tpsi[k]);
      const p3 = pos(phi, psi), h = 4.4;
      const A = proj([p3[0] + dir[0] * h, p3[1] + dir[1] * h, p3[2] + dir[2] * h]);
      const B = proj([p3[0] - dir[0] * h, p3[1] - dir[1] * h, p3[2] - dir[2] * h]);
      spr.push({ x: p[0], y: p[1], A, B, d: depth(p3), col: COLS[ci++ % COLS.length], fv });
    }
    spr.sort((p, q) => q.d - p.d);
    g.spr = spr;

    // 麵體斑點：外側下半與洞內壁
    const kr = K.rng(777);
    const specks = [];
    for (let k = 0; k < 520; k++) {
      const phi = kr() * TAU;
      const psi = kr() < 0.72 ? -0.75 + kr() * 1.25 : 2.3 + kr() * 1.5;
      const f = facing(phi, psi);
      if (f < 0.12) continue;
      const p = scr(phi, psi), dark = kr() < (psi > 2 ? 0.85 : 0.7);
      specks.push({ x: p[0], y: p[1], r: 0.35 + kr() * 0.6, a: kr() * Math.PI,
        c: dark ? `rgba(105,52,20,${(0.16 + kr() * 0.2).toFixed(2)})` : `rgba(255,232,190,${(0.18 + kr() * 0.22).toFixed(2)})` });
    }
    g.specks = specks;
    return g;
  }

  // 在邊界點列中插入一條往下（螢幕 +y）的滴落舌形
  function addDrip(pts, phi, hw, L, limitLoop, inner, bulbs) {
    let best = -1, bd = 1e9;
    for (let k = 0; k < pts.length; k++) {
      let d = Math.abs(((pts[k].phi - phi + Math.PI * 3) % TAU) - Math.PI);
      if (d < bd) { bd = d; best = k; }
    }
    const n = pts.length, A = pts[best];
    const fil = 2.6;
    // 找左右接點
    let i0 = best, i1 = best;
    for (let s = 1; s < 60; s++) { i0 = (best - s + n) % n; if (Math.abs(pts[i0].x - A.x) >= hw + fil) break; }
    for (let s = 1; s < 60; s++) { i1 = (best + s) % n; if (Math.abs(pts[i1].x - A.x) >= hw + fil) break; }
    const P0 = pts[i0], P1 = pts[i1];
    const sgn = P1.x > P0.x ? 1 : -1;
    // 長度限制：不超出底部輪廓／洞的上緣
    let maxL = L;
    if (limitLoop) {
      for (let y = A.y; y < A.y + L + 10; y += 0.5) {
        if (!inner) { const dx = A.x - CX, dy = y - CY, t = outT(Math.atan2(dy, dx)); if (Math.hypot(dx, dy) > t - 4) { maxL = Math.min(maxL, y - A.y - hw * 0.2); break; } }
        else { const dx = A.x - CX, dy = y - CY, t = holeT(Math.atan2(dy, dx)); if (Math.hypot(dx, dy) < t + 3) { maxL = Math.min(maxL, y - A.y - hw * 0.2); break; } }
      }
    }
    L = Math.max(hw * 1.6, maxL);
    const top = Math.max(P0.y, P1.y);
    const xl = A.x - sgn * hw * 0.82, xr = A.x + sgn * hw * 0.82;
    const yc = A.y + L - hw;
    if (bulbs) bulbs.push({ x: A.x, y: yc, r: hw });
    const seg = [];
    // 左側圓角
    for (let t = 0; t <= 1; t += 0.125) {
      const u = 1 - t;
      seg.push({ x: u * u * P0.x + 2 * u * t * xl + t * t * xl, y: u * u * P0.y + 2 * u * t * P0.y + t * t * (top + fil), phi: P0.phi });
    }
    // 下降到球形末端
    for (let t = 0; t <= 1; t += 0.2) seg.push({ x: xl + (A.x - sgn * hw - xl) * t, y: top + fil + (yc - top - fil) * t, phi });
    // 末端半圓
    for (let k = 0; k <= 16; k++) {
      const ang = sgn > 0 ? Math.PI - Math.PI * k / 16 : Math.PI * k / 16;
      seg.push({ x: A.x + hw * Math.cos(ang), y: yc + hw * Math.sin(ang), phi });
    }
    for (let t = 0; t <= 1; t += 0.2) seg.push({ x: A.x + sgn * hw + (xr - A.x - sgn * hw) * t, y: yc + (top + fil - yc) * t, phi });
    for (let t = 0; t <= 1; t += 0.125) {
      const u = 1 - t;
      seg.push({ x: u * u * xr + 2 * u * t * xr + t * t * P1.x, y: u * u * (top + fil) + 2 * u * t * P1.y + t * t * P1.y, phi: P1.phi });
    }
    // 組回去（i0 之前 + seg + i1 之後）
    const outPts = [];
    let k = (i1 + 1) % n;
    while (k !== i0) { outPts.push(pts[k]); k = (k + 1) % n; }
    return outPts.concat(seg);
  }

  /* ===== 路徑 ===== */
  function loop(path, pts) {
    const f = pts[0];
    path.moveTo(f.x !== undefined ? f.x : f[0], f.y !== undefined ? f.y : f[1]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      path.lineTo(p.x !== undefined ? p.x : p[0], p.y !== undefined ? p.y : p[1]);
    }
    path.closePath();
  }

  function quads(ctx, list) {
    for (const q of list) {
      const p = q.pts;
      ctx.fillStyle = q.col;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.lineTo(p[6], p[7]);
      ctx.closePath(); ctx.fill();
    }
  }

  // 沿 ψ 固定的弧畫出漸細的高光
  function streak(ctx, phi0, psi0, dPhi, dPsi, fill) {
    const top = [], bot = [];
    for (let k = 0; k <= 40; k++) {
      const t = -1 + 2 * k / 40;
      const w = dPsi * Math.pow(1 - t * t, 0.75);
      const ph = phi0 + t * dPhi;
      top.push(scr(ph, psi0 + w)); bot.push(scr(ph, psi0 - w));
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    loop(ctx, top.concat(bot.reverse()));
    ctx.fill();
  }

  function draw(ctx) {
    if (!G) G = build();
    const body = new Path2D(); loop(body, G.out); loop(body, G.hole);
    const glaze = new Path2D(); loop(glaze, G.eo); loop(glaze, G.ei);

    // 1. 麵體
    ctx.save();
    ctx.clip(body, 'evenodd');
    ctx.fillStyle = '#8a5028';
    ctx.fillRect(0, 0, 200, 200);
    quads(ctx, G.dq);
    // 油炸表面的細小斑點（被糖霜蓋住的部分之後會被蓋掉）
    for (const p of G.specks) {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, p.a, 0, TAU); ctx.fill();
    }

    // 2. 糖霜投在麵體上的陰影
    ctx.save();
    ctx.translate(0.7, 1.8);
    ctx.fillStyle = 'rgba(55,22,8,.38)';
    ctx.fill(glaze, 'evenodd');
    ctx.translate(-0.3, -0.8);
    ctx.fillStyle = 'rgba(55,22,8,.25)';
    ctx.fill(glaze, 'evenodd');
    ctx.restore();

    // 3. 糖霜
    ctx.save();
    ctx.clip(glaze, 'evenodd');
    ctx.fillStyle = '#2e170b';
    ctx.fillRect(0, 0, 200, 200);
    quads(ctx, G.gq);

    // 4. 糖霜邊緣的厚度反光（只有看得到的前緣會留在裁切內）
    ctx.save();
    ctx.translate(0, -1.1);
    ctx.strokeStyle = 'rgba(150,92,60,.3)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); loop(ctx, G.eo); ctx.stroke();
    ctx.restore();

    // 5. 光澤高光
    if (G.hiO) {
      streak(ctx, G.hiO.phi + 0.05, G.hiO.psi, 0.85, 0.26, 'rgba(255,236,220,.12)');
      streak(ctx, G.hiO.phi, G.hiO.psi, 0.5, 0.09, 'rgba(255,248,240,.8)');
    }
    if (G.hiI) {
      streak(ctx, G.hiI.phi, G.hiI.psi, 0.42, 0.18, 'rgba(255,236,220,.12)');
      streak(ctx, G.hiI.phi, G.hiI.psi, 0.3, 0.075, 'rgba(255,248,240,.68)');
    }
    // 滴落末端的小亮點
    for (const b of G.bulbs) {
      ctx.fillStyle = 'rgba(255,236,220,.32)';
      ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.45, b.y - b.r * 0.35, b.r * 0.16, b.r * 0.62, 0.12, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();

    // 6. 糖針
    ctx.lineCap = 'round';
    for (const s of G.spr) {
      const w = 2.8 + 0.5 * s.fv;
      ctx.strokeStyle = 'rgba(20,8,3,.5)'; ctx.lineWidth = w + 0.9;
      ctx.beginPath(); ctx.moveTo(s.A[0] + 0.7, s.A[1] + 1.1); ctx.lineTo(s.B[0] + 0.7, s.B[1] + 1.1); ctx.stroke();
      ctx.strokeStyle = K.shade(s.col, -0.25); ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(s.A[0], s.A[1]); ctx.lineTo(s.B[0], s.B[1]); ctx.stroke();
      ctx.strokeStyle = s.col; ctx.lineWidth = w * 0.62;
      ctx.beginPath(); ctx.moveTo(s.A[0] - 0.35, s.A[1] - 0.45); ctx.lineTo(s.B[0] - 0.35, s.B[1] - 0.45); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = w * 0.28;
      const mx = (s.A[0] + s.B[0]) / 2, my = (s.A[1] + s.B[1]) / 2;
      ctx.beginPath();
      ctx.moveTo(mx + (s.A[0] - mx) * 0.55 - 0.6, my + (s.A[1] - my) * 0.55 - 0.7);
      ctx.lineTo(mx + (s.B[0] - mx) * 0.55 - 0.6, my + (s.B[1] - my) * 0.55 - 0.7);
      ctx.stroke();
    }

    // 7. 輪廓細線
    const o1 = new Path2D(); loop(o1, G.out);
    const o2 = new Path2D(); loop(o2, G.hole);
    ctx.strokeStyle = 'rgba(70,34,14,.6)'; ctx.lineWidth = 1.8;
    ctx.stroke(o1);
    ctx.strokeStyle = 'rgba(60,28,12,.5)'; ctx.lineWidth = 1.4;
    ctx.stroke(o2);
  }

  window.DESSERTS['donut'] = { draw };
})();
