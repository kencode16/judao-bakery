// 聲音（F 擁有）。API 見 架構.md「F 聲音與 PWA」：
//   unlock()、sfx(name, opts)、setSfx(on)、setMusic(on)、playMusic(track)、stopMusic()
// 音效：Web Audio 即時合成（手感照樣品 style/index_v3.html，使用者已在 iPhone 確認）。
// 背景音樂：assets/music/ 的 CC0 曲子（出處見 assets/music/CREDITS.md），用一個 <audio> 播。
// 原則：任何聲音出問題都只 console.warn，不可以讓遊戲壞掉。

/* ================= iPhone：靜音模式也要有聲音 =================
 * iPhone 開靜音（側邊開關）時，網頁的 Web Audio 預設會被一起靜音。
 * - iOS 17 以上：把 navigator.audioSession.type 設成 'playback'。
 * - 更舊的 iOS：讓一個 <audio> 一直在播（沒有音樂時就播無聲 wav 循環），音訊工作階段就會切到「播放」模式。
 *   這裡和背景音樂共用同一個 <audio>（只要在第一次觸控時 play() 過一次，之後換曲子都能直接播）。
 * - 第一次觸控時建立並喚醒 AudioContext，再播 1 取樣的無聲緩衝區。 */
const UA = navigator.userAgent || '';
// iPad 的 Safari 會假裝成 Mac：用「Mac＋觸控螢幕＋不是 Chrome」判斷（電腦版 Chrome 開觸控模擬時不算）
const IS_IOS = /iP(hone|ad|od)/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1 && !/Chrome\//.test(UA));
const NEED_SILENT_LOOP = IS_IOS && !navigator.audioSession;

function setSession() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* 不支援就算了 */ }
}
setSession();

let silentURL = null;
function silentWavURL() {
  if (silentURL) return silentURL;
  const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  silentURL = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentURL;
}

/* ================= 音效（Web Audio 即時合成） ================= */
const S = { on: true, ctx: null, master: null, noise: null, last: Object.create(null), combo: 0, lastMatch: 0, primed: false, resumeAt: 0 };

function resumeCtx() {
  const c = S.ctx;
  if (!c || c.state === 'running' || c.state === 'closed' || document.hidden) return;
  S.resumeAt = performance.now();
  try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 舊版 Safari */ }
}

// fromGesture：在觸控事件裡呼叫（可以建立 AudioContext）。
// 不是在觸控裡、使用者也還沒碰過頁面時不建立，避免 Chrome 的「AudioContext was not allowed to start」警告。
function ensureCtx(fromGesture) {
  if (!S.ctx) {
    const ua = navigator.userActivation;
    if (!fromGesture && ua && !ua.hasBeenActive) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      S.ctx = new AC();
      S.master = S.ctx.createGain(); S.master.gain.value = 0.7;
      const comp = S.ctx.createDynamicsCompressor();
      S.master.connect(comp).connect(S.ctx.destination);
    } catch (e) { console.warn('建立 AudioContext 失敗', e); S.ctx = null; return null; }
  }
  resumeCtx();
  return S.ctx;
}

function noiseBuf() {
  if (!S.noise) {
    const c = S.ctx, len = Math.floor(c.sampleRate * 1.0);
    const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    S.noise = b;
  }
  return S.noise;
}

// 單音：f0 → f1 滑音，指數包絡
function tone({ type = 'sine', f0, f1, t = 0, attack = 0.005, dur = 0.1, peak = 0.3 }) {
  const c = S.ctx, now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + attack + dur * 0.8);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur);
  o.connect(g).connect(S.master);
  o.start(now); o.stop(now + attack + dur + 0.05);
}

// 濾波雜訊：type 'bandpass'|'lowpass'|'highpass'，頻率 f0 → f1
function hiss({ type = 'bandpass', f0, f1, q = 1, t = 0, attack = 0.01, dur = 0.15, peak = 0.1 }) {
  const c = S.ctx, now = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf(); s.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, now);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, now + attack + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur);
  s.connect(f).connect(g).connect(S.master);
  s.start(now, Math.random() * 0.5); s.stop(now + attack + dur + 0.05);
}

// 鐵琴般的鈴聲（金屬片的泛音比例 1 : 2.76 : 5.40 : 8.93）
function bell(f, t = 0, dur = 0.8, peak = 0.15) {
  [[1, 1, 1], [2.76, 0.32, 0.45], [5.4, 0.14, 0.25], [8.93, 0.06, 0.14]].forEach(([m, a, d]) => {
    if (f * m < 15000) tone({ f0: f * m, t, attack: 0.002, dur: dur * d, peak: peak * a });
  });
}

// 糖粉般的細碎閃光
function sparkle(t = 0, n = 5, spread = 0.05, peak = 0.03) {
  for (let i = 0; i < n; i++) bell(2200 + Math.random() * 2600, t + i * spread + Math.random() * 0.02, 0.28, peak);
}

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // 五聲音階（半音數）
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SFX = {
  // UI 按鈕：輕輕的木頭「篤」（比點甜點的「啵」短、低一點）
  tap() {
    tone({ f0: 620, f1: 470, dur: 0.06, peak: 0.16 });
    tone({ type: 'triangle', f0: 1240, f1: 1000, dur: 0.02, peak: 0.035 });
  },
  // 點選甜點：軟軟的「啵」（樣品原樣）
  select() {
    tone({ f0: 760, f1: 240, dur: 0.09, peak: 0.32 });
    tone({ type: 'triangle', f0: 1500, f1: 900, dur: 0.03, peak: 0.05 });
  },
  // 擠奶油：「噗咻」（樣品原樣）
  pipe() {
    hiss({ type: 'lowpass', f0: 420, f1: 1500, q: 4, attack: 0.03, dur: 0.22, peak: 0.18 });
    tone({ f0: 330, f1: 520, dur: 0.2, peak: 0.05 });
  },
  // 配對成功：「叮」＋泡泡，opts.combo（0～10）沿五聲音階往上爬（樣品原樣）
  ding(o) {
    let combo;
    if (typeof o.combo === 'number' && isFinite(o.combo)) combo = clamp(Math.round(o.combo), 0, 10);
    else { // 沒給 combo：自己算（3.2 秒內接著配對就往上爬）
      const now = performance.now();
      S.combo = now - S.lastMatch < 3200 ? Math.min(S.combo + 1, 10) : 0;
      S.lastMatch = now; combo = S.combo;
    }
    const f = 659.25 * Math.pow(2, PENTA[combo] / 12);
    tone({ f0: f, dur: 0.75, attack: 0.004, peak: 0.26 });
    tone({ f0: f * 2, dur: 0.35, attack: 0.004, peak: 0.07 });
    tone({ type: 'triangle', f0: f * 3, dur: 0.15, attack: 0.002, peak: 0.03 });
    for (let i = 0; i < 3; i++) {
      const b = 500 + Math.random() * 500;
      tone({ f0: b, f1: b * 1.9, t: 0.05 + i * 0.055, dur: 0.06, peak: 0.08 });
    }
  },
  // 咬一口：opts.bite 第幾口（0、1、2；3＝最後整塊吞掉，會自動小聲一點），opts.crunchy 酥脆度 0～1
  // 酥脆的「喀滋」多一點，軟的「啊姆」多一點（樣品原樣）
  crunch(o) {
    const bite = clamp(Math.round(o.bite ?? 0), 0, 3);
    let crunchy = clamp(Number(o.crunchy ?? 0.5) || 0, 0, 1);
    if (bite >= 3) crunchy *= 0.6;
    const c = S.ctx, now = c.currentTime;
    const grains = 2 + Math.round(crunchy * 3);
    for (let k = 0; k < grains; k++) {
      const s = c.createBufferSource(); s.buffer = noiseBuf();
      const f = c.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 1300 + Math.random() * 2200; f.Q.value = 1.1;
      const g = c.createGain(), t = now + k * 0.016 + Math.random() * 0.006;
      const peak = 0.08 + crunchy * 0.32;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + (1 - crunchy) * 0.03);
      s.connect(f).connect(g).connect(S.master);
      s.start(t, Math.random() * 0.8, 0.08);
    }
    tone({ f0: 200 - bite * 14, f1: 110, dur: 0.08, peak: 0.07 + (1 - crunchy) * 0.13 });
  },
  // 連不到：輕輕的軟彈，不刺耳（樣品原樣）
  fail() {
    tone({ f0: 300, f1: 190, dur: 0.13, peak: 0.16 });
    tone({ f0: 240, f1: 170, t: 0.07, dur: 0.12, peak: 0.1 });
  },
  // 滑動補位：「咻」
  slide() {
    hiss({ type: 'bandpass', f0: 600, f1: 2200, q: 0.9, attack: 0.07, dur: 0.17, peak: 0.13 });
    tone({ f0: 520, f1: 320, t: 0.02, dur: 0.18, peak: 0.03 });
  },
  // 自動重排：轉一圈的「咻嚕嚕」＋往上的小音階
  shuffle() {
    hiss({ type: 'bandpass', f0: 500, f1: 1800, q: 0.8, attack: 0.12, dur: 0.16, peak: 0.08 });
    hiss({ type: 'bandpass', f0: 1800, f1: 600, q: 0.8, t: 0.26, attack: 0.08, dur: 0.18, peak: 0.07 });
    [0, 2, 4, 7, 9, 12].forEach((s, i) => tone({ type: 'triangle', f0: 784 * Math.pow(2, s / 12), t: 0.05 + i * 0.055, dur: 0.12, peak: 0.07 }));
    tone({ f0: 380, f1: 760, t: 0.08, dur: 0.32, peak: 0.06 });
  },
  // 果醬融化：黏黏的「嚕～」＋兩顆小泡泡「啵啵」
  jam() {
    const c = S.ctx, now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(170, now); o.frequency.exponentialRampToValueAtTime(430, now + 0.28);
    lfo.frequency.value = 22; lg.gain.value = 28; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.33);
    o.connect(g).connect(S.master);
    o.start(now); lfo.start(now); o.stop(now + 0.36); lfo.stop(now + 0.36);
    tone({ f0: 420, f1: 820, t: 0.2, dur: 0.05, peak: 0.08 });
    tone({ f0: 560, f1: 1100, t: 0.29, dur: 0.05, peak: 0.06 });
  },
  // 禮盒打開：緞帶沙沙＋開蓋「啵」＋往上的鈴聲琶音＋閃光
  giftOpen() {
    hiss({ type: 'bandpass', f0: 2600, f1: 4200, q: 1.4, attack: 0.02, dur: 0.12, peak: 0.07 });
    tone({ f0: 520, f1: 980, t: 0.1, dur: 0.07, peak: 0.16 });
    [0, 4, 7, 12].forEach((s, i) => bell(784 * Math.pow(2, s / 12), 0.16 + i * 0.07, i === 3 ? 0.9 : 0.5, 0.11));
    sparkle(0.42, 5, 0.05, 0.025);
  },
  // 點單完成：店門口小鈴鐺「叮鈴」
  order() {
    bell(1318.5, 0, 0.7, 0.14);
    bell(1760, 0.11, 0.9, 0.13);
    tone({ f0: 659.25, t: 0.11, dur: 0.4, peak: 0.05 });
  },
  // 提示：輕柔的魔法閃光（不搶戲）
  hint() {
    [2093, 1760, 1568, 2349].forEach((f, i) => tone({ type: 'triangle', f0: f, t: i * 0.06, dur: 0.16, peak: 0.045 }));
    bell(1568, 0.22, 0.5, 0.05);
  },
  // 過關小旋律（樣品原樣）
  win() {
    [0, 4, 7, 12, 16].forEach((s, i) => {
      const f = 523.25 * Math.pow(2, s / 12);
      tone({ f0: f, t: i * 0.11, dur: i === 4 ? 0.9 : 0.35, peak: 0.22 });
      tone({ f0: f * 2, t: i * 0.11, dur: 0.2, peak: 0.05 });
    });
  },
  // 星星亮起：opts.n 第幾顆（1～3），一顆比一顆高；第三顆多一個和弦
  star(o) {
    const n = clamp(Math.round(o.n ?? 1), 1, 3);
    const f = [1046.5, 1318.5, 1568][n - 1];
    tone({ f0: f * 0.5, f1: f, dur: 0.06, peak: 0.06 });
    bell(f, 0.03, 0.9, 0.17);
    sparkle(0.06, 2 + n, 0.04, 0.022);
    if (n === 3) { bell(f * 1.335, 0.12, 1.0, 0.08); bell(f * 2, 0.2, 1.1, 0.06); }
  },
  // 新甜點解鎖：糖粉沙沙＋鈴聲琶音＋柔和和弦「噹啷～」
  unlock() {
    hiss({ type: 'highpass', f0: 5000, f1: 7000, q: 0.7, attack: 0.25, dur: 0.6, peak: 0.025 });
    [0, 4, 7, 12, 16].forEach((s, i) => bell(1046.5 * Math.pow(2, s / 12), i * 0.075, 0.6, 0.1));
    [523.25, 659.25, 783.99].forEach(f => tone({ f0: f, t: 0.38, attack: 0.08, dur: 1.1, peak: 0.07 }));
    sparkle(0.45, 6, 0.06, 0.022);
  },
  // 翻圖鑑：紙張「唰」
  page() {
    hiss({ type: 'highpass', f0: 1800, f1: 3600, q: 0.6, attack: 0.025, dur: 0.09, peak: 0.08 });
    hiss({ type: 'lowpass', f0: 500, f1: 260, q: 0.7, t: 0.06, attack: 0.005, dur: 0.05, peak: 0.05 });
  },
};

/* ================= 背景音樂 =================
 * 先用 fetch 把整首抓成 blob（約 0.6～0.9 MB），再交給 <audio> 播 blob 網址：
 * 這樣不需要伺服器支援 Range（python http.server 不支援，iPhone Safari 播媒體卻需要），離線也能從 service worker 快取讀。
 * 檔案本身已經把音量壓小（平均約 −35 dBFS，比音效小聲），因為 iPhone 不能用程式調 <audio> 的音量。 */
const FILES = {
  iceCream: '../assets/music/ice-cream-with-you.m4a',
  sweetSun: '../assets/music/sweet-sun.m4a',
  picnic: '../assets/music/go-to-the-picnic.m4a',
  yippee: '../assets/music/yippee.m4a',
};
const PLAYLISTS = {
  home: ['iceCream'],
  map: ['iceCream'],            // 和首頁同一首：首頁 → 地圖不會中斷
  level: ['sweetSun', 'picnic'], // 兩首輪流（每次從別的畫面回到關卡就換下一首）
  clear: ['yippee'],
};
const CLEAR_DELAY = 1700; // 過關時先讓「過關小旋律＋星星」播完，再進音樂

const M = {
  on: true, track: null, list: null, idx: 0, levelTurn: 0,
  el: null, blessed: false, timer: 0, blobs: Object.create(null), loading: Object.create(null), want: null,
  curURL: null, watch: 0,
};

function musicEl() {
  if (!M.el) {
    const a = document.createElement('audio');
    a.preload = 'auto';
    a.setAttribute('playsinline', ''); a.setAttribute('webkit-playsinline', ''); a.setAttribute('x-webkit-airplay', 'deny');
    a.addEventListener('ended', () => {
      if (M.list && M.list.length > 1 && a.dataset.kind === 'music') { M.idx = (M.idx + 1) % M.list.length; startMusic(); }
    });
    a.addEventListener('error', () => { if (a.dataset.kind === 'music') console.warn('背景音樂播放失敗', a.dataset.key); });
    M.el = a;
  }
  return M.el;
}

function loadTrack(key) {
  if (M.blobs[key]) return Promise.resolve(M.blobs[key]);
  if (!M.loading[key]) {
    const url = new URL(FILES[key], import.meta.url).href;
    M.loading[key] = fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      // 型別直接指定 audio/mp4：有的伺服器（python http.server）回 audio/mp4a-latm，iPhone 可能不認得
      .then(buf => (M.blobs[key] = new Blob([buf], { type: 'audio/mp4' })))
      .catch(e => { console.warn('背景音樂載入失敗', key, e); delete M.loading[key]; return null; });
  }
  return M.loading[key];
}

// 換成某首曲子：每次都用新的 blob 網址（舊的釋放掉）
function setMusicSrc(a, key, tries = 0) {
  const u = URL.createObjectURL(M.blobs[key]);
  a.dataset.kind = 'music'; a.dataset.key = key;
  a.loop = !!M.list && M.list.length === 1;
  a.src = u;
  if (M.curURL) URL.revokeObjectURL(M.curURL);
  M.curURL = u;
  M.want = key;
  // 看門狗：換曲子後 6 秒還卡在載入（偶爾會發生），就重新載入，最多再試 2 次
  clearTimeout(M.watch);
  M.watch = setTimeout(() => {
    if (!M.el || !M.blessed || !M.on || document.hidden || M.want !== key) return;
    if (a.dataset.kind !== 'music' || a.dataset.key !== key) return;
    const stuck = (!a.paused && a.currentTime < 0.05) || a.error;
    if (stuck && tries < 2) { setMusicSrc(a, key, tries + 1); playEl(a); }
  }, 6000);
}

function playEl(a) {
  const ok = () => {
    M.blessed = true;
    // 只是為了「在觸控裡 play() 過一次」而播的無聲檔：不需要無聲循環的裝置就馬上停（電腦分頁才不會一直顯示喇叭）
    if (a.dataset.kind === 'silent' && !NEED_SILENT_LOOP) a.pause();
  };
  try {
    const p = a.play();
    if (p && p.then) p.then(ok, () => { /* 還沒觸控過：等 unlock() 再播 */ });
    else ok();
  } catch (e) { /* 忽略 */ }
}

// 沒有音樂要播時：舊版 iPhone 播無聲循環（維持「播放」模式），其他裝置就暫停
function idle() {
  const a = M.el;
  if (!a) return;
  if (NEED_SILENT_LOOP && M.blessed && !document.hidden) {
    if (a.dataset.kind !== 'silent') { a.dataset.kind = 'silent'; a.dataset.key = ''; a.loop = true; a.src = silentWavURL(); }
    if (a.paused) playEl(a);
  } else if (!a.paused) a.pause();
}

function currentKey() { return M.list ? M.list[M.idx % M.list.length] : null; }

// 播目前曲目（同一首正在播就不重來）
function startMusic() {
  clearTimeout(M.timer); M.timer = 0;
  const key = currentKey();
  if (!M.on || !key) { idle(); return; }
  M.want = key;
  const a = musicEl();
  if (a.dataset.kind === 'music' && a.dataset.key === key) {
    if (a.paused && !document.hidden) playEl(a);
    return;
  }
  loadTrack(key).then(blob => {
    if (!blob || M.want !== key || !M.on || currentKey() !== key || M.timer) return;
    if (!(a.dataset.kind === 'music' && a.dataset.key === key)) setMusicSrc(a, key);
    if (!document.hidden) playEl(a);
  });
}

function pauseMusic() {
  clearTimeout(M.timer); M.timer = 0;
  M.want = null;
  const a = M.el;
  if (a && a.dataset.kind === 'music' && !a.paused) a.pause(); // 保留曲目和位置：再打開時從暫停的地方接著播
  idle();
}

// 切到背景（換 App、鎖螢幕）就停，回來再繼續
function onVisibility() {
  if (document.hidden) {
    if (M.el && !M.el.paused) M.el.pause();
    if (S.ctx && S.ctx.state === 'running') { try { S.ctx.suspend().catch(() => {}); } catch (e) { /* 忽略 */ } }
  } else {
    resumeCtx();
    if (M.on && M.list && !M.timer) startMusic(); else idle();
  }
}
document.addEventListener('visibilitychange', onVisibility);
window.addEventListener('pagehide', () => { if (M.el && !M.el.paused) M.el.pause(); });

function setMediaInfo() {
  try {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: '菊島連連烘', artist: '音樂：Loyalty Freak Music（CC0）',
      artwork: [{ src: new URL('../icons/icon-512.png', import.meta.url).href, sizes: '512x512', type: 'image/png' }],
    });
  } catch (e) { /* 忽略 */ }
}

/* ================= 對外 API ================= */
const audio = {
  // 第一次觸控時呼叫（main.js 每次觸控都會呼叫，所以要很便宜、可重複呼叫）
  unlock() {
    try {
      setSession();
      // Chrome／Android：手指按下（pointerdown）還不算「使用者手勢」，等放開（touchend／click）再解鎖，
      // 才不會跳出「AudioContext was not allowed to start」警告。iPhone 照樣品的做法每次都試（實機已確認有效）。
      const ua = navigator.userActivation;
      if (!IS_IOS && ua && !ua.isActive) return;
      const c = ensureCtx(true);
      if (c && !S.primed) {
        S.primed = true;
        const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource();
        src.buffer = b; src.connect(c.destination); src.start(0);
      }
      const a = musicEl();
      if (document.hidden) return;
      if (!M.blessed) {
        // 在觸控事件裡對 <audio> play() 一次，之後換曲子、換回來才能自動播
        const key = M.on && !M.timer ? currentKey() : null;
        if (key && M.blobs[key]) {
          if (!(a.dataset.kind === 'music' && a.dataset.key === key)) setMusicSrc(a, key);
        } else if (a.dataset.kind !== 'music' || !a.src) {
          if (a.dataset.kind !== 'silent') { a.dataset.kind = 'silent'; a.loop = true; a.src = silentWavURL(); }
        }
        playEl(a);
        if (!setMediaInfo.done) { setMediaInfo.done = true; setMediaInfo(); }
        return;
      }
      if (a.paused) {
        if (M.on && M.list && !M.timer) startMusic(); else idle();
      }
    } catch (e) { console.warn('audio.unlock', e); }
  },

  sfx(name, opts) {
    try {
      if (!S.on) return;
      const fn = SFX[name];
      if (!fn) { console.warn('沒有這個音效', name); return; }
      const c = ensureCtx(false);
      if (!c) return;
      const now = performance.now();
      // 還沒喚醒（不在剛 resume 的那一下）就不排程，避免喚醒時一次爆出一堆聲音
      if (c.state !== 'running' && now - S.resumeAt > 400) return;
      if (now - (S.last[name] || 0) < 25) return; // 同一個音效同時被叫兩次只響一次
      S.last[name] = now;
      fn(opts || {});
    } catch (e) { console.warn('sfx', name, e); }
  },

  setSfx(on) { S.on = !!on; },

  setMusic(on) {
    try {
      M.on = !!on;
      if (!M.on) pauseMusic();
      else if (M.list) {
        if (M.track === 'clear' && M.timer) return;
        startMusic();
      }
    } catch (e) { console.warn('setMusic', e); }
  },

  // 'home' | 'map' | 'level' | 'clear'；音樂關著時只記住曲目，打開時播
  playMusic(track) {
    try {
      const list = PLAYLISTS[track];
      if (!list) { console.warn('沒有這首背景音樂', track); return; }
      if (M.track !== track) {
        M.track = track; M.list = list;
        M.idx = track === 'level' ? (M.levelTurn++ % list.length) : 0;
        // 預先抓下一首會用到的
        list.forEach(k => loadTrack(k));
      }
      if (!M.on) return;
      if (track === 'clear') {
        if (M.timer) return;
        const a = M.el;
        if (a && a.dataset.kind === 'music' && a.dataset.key === currentKey() && !a.paused) return;
        pauseMusic();
        M.timer = setTimeout(() => { M.timer = 0; if (M.track === 'clear') startMusic(); }, CLEAR_DELAY);
        return;
      }
      startMusic();
    } catch (e) { console.warn('playMusic', e); }
  },

  stopMusic() {
    try { M.track = null; M.list = null; pauseMusic(); } catch (e) { console.warn('stopMusic', e); }
  },

  // ---- 以下是測試／除錯用（不是合約 API） ----
  _names: Object.keys(SFX),
  _tracks: { files: FILES, playlists: PLAYLISTS },
  _el: () => M.el,
  _state() {
    const a = M.el;
    return {
      sfxOn: S.on, musicOn: M.on, track: M.track, key: currentKey(), ctx: S.ctx ? S.ctx.state : null,
      el: a ? { kind: a.dataset.kind || '', key: a.dataset.key || '', paused: a.paused, t: +a.currentTime.toFixed(2), loop: a.loop, rs: a.readyState, err: a.error ? a.error.code : 0 } : null,
      blessed: M.blessed, activated: navigator.userActivation ? navigator.userActivation.hasBeenActive : null, iosSilentLoop: NEED_SILENT_LOOP, audioSession: navigator.audioSession ? navigator.audioSession.type : null,
    };
  },
};

export default audio;
