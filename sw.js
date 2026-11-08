// Service worker（F 擁有）：網路優先、失敗才用快取，讓《菊島連連烘》加到主畫面後可以離線玩。
//
// 安裝時預先快取所有遊戲檔。清單不寫死：從 index.html 出發自動掃描
//   HTML 的 src／href、JS 的 import／import()／new URL(..., import.meta.url)／相對路徑字串、CSS 的 url()／@import、
//   manifest 的 icons，美術檔清單讀 js/art/available.js（tools/list_art.py 產生），
// 所以之後新增甜點、飲品、道具美術檔或新的 JS 模組都不用改這裡。
// 平常線上玩時，每個成功抓到的檔案也會順手更新進快取（所以快取永遠是最後一次線上玩的版本）。
//
// 開發：網址加 ?nosw 的頁面完全不經過快取（main.js 也不會註冊）。
// 結構大改時把 CACHE 的版本號加一，舊快取會在啟用時刪掉。

const CACHE = 'judao-v1';
const SEEDS = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
  'assets/music/ice-cream-with-you.m4a', 'assets/music/sweet-sun.m4a', 'assets/music/go-to-the-picnic.m4a', 'assets/music/yippee.m4a',
  'js/main.js', 'js/art/available.js',
];
const SKIP_DIRS = ['tests/', 'tools/', 'style/', '圖鑑', '參考照片'];   // 開發用資料夾不預先快取
const ASSET = /\.(?:js|mjs|css|html|json|webmanifest|png|jpe?g|webp|gif|svg|m4a|mp3|ogg|wav|woff2?|ttf|otf)$/i;
const MAX_FILES = 800;
const NET_TIMEOUT = 5000; // 網路太慢（手機訊號差）時，超過這個時間就先用快取

const scopeURL = () => new URL(self.registration.scope);

/* ---------------- 安裝：自動掃描並預先快取 ---------------- */
function inScope(href) {
  const scope = scopeURL().href;
  if (!href.startsWith(scope)) return false;
  const rel = decodeURIComponent(href.slice(scope.length));
  return !SKIP_DIRS.some(d => rel.startsWith(d));
}

function refsOf(text, url, type) {
  const out = [];
  const add = (p, base) => {
    if (!p || p.includes('${') || /^(?:data|blob|https?|mailto|javascript):|^#|^\/\//i.test(p)) return;
    try {
      const u = new URL(p, base);
      u.hash = ''; u.search = '';
      if (/\/sw\.js$/.test(u.pathname)) return; // sw 自己不用快取
      out.push(u.href);
    } catch (e) { /* 不是網址 */ }
  };
  const each = (re, base = url) => { let m; re.lastIndex = 0; while ((m = re.exec(text))) add(m[1], base); };
  if (type === 'html') {
    each(/\s(?:src|href)\s*=\s*["']([^"'#?]+)/gi);
  } else if (type === 'css') {
    each(/url\(\s*["']?([^"')?#]+)/gi);
    each(/@import\s+["']([^"']+)["']/gi);
  } else if (type === 'js') {
    each(/\bfrom\s*["']([^"']+)["']/g);
    each(/\bimport\s*["']([^"']+)["']/g);
    each(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g);
    each(/new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g);
    // 相對於這個 JS 的資源字串，例如 '../assets/music/x.m4a'
    let m; const rel = /["'](\.{1,2}\/[^"'\s]+)["']/g;
    while ((m = rel.exec(text))) if (ASSET.test(m[1])) add(m[1], url);
    // 相對於網站根目錄的資源字串，例如 'icons/icon-512.png'
    const root = /["']((?:assets|icons|css|js)\/[^"'\s]+)["']/g;
    while ((m = root.exec(text))) if (ASSET.test(m[1])) add(m[1], scopeURL().href);
    // 美術清單：export const AVAILABLE = {"desserts":[…],"drinks":[…],"props":true}
    const av = /AVAILABLE\s*=\s*(\{[\s\S]*?\})\s*;/.exec(text);
    if (av) {
      try {
        const a = JSON.parse(av[1]);
        (a.desserts || []).forEach(id => add(`./desserts/${id}.js`, url));
        (a.drinks || []).forEach(id => add(`./drinks/${id}.js`, url));
        if (a.props) add('./props.js', url);
      } catch (e) { /* 格式不對就略過 */ }
    }
  } else if (type === 'manifest') {
    try { (JSON.parse(text).icons || []).forEach(i => add(i.src, url)); } catch (e) { /* 略過 */ }
  }
  return out;
}

function typeOf(href, res) {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const path = new URL(href).pathname;
  if (/\.webmanifest$/.test(path) || ct.includes('manifest')) return 'manifest';
  if (/\.m?js$/.test(path) || ct.includes('javascript')) return 'js';
  if (/\.css$/.test(path) || ct.includes('text/css')) return 'css';
  if (/\/$|\.html?$/.test(path) || ct.includes('text/html')) return 'html';
  return null;
}

async function precacheAll() {
  const cache = await caches.open(CACHE);
  const seen = new Set();
  let queue = SEEDS.map(p => new URL(p, scopeURL()).href);
  let ok = 0, fail = 0;
  while (queue.length && seen.size < MAX_FILES) {
    const batch = [];
    while (queue.length && batch.length < 6) {
      const href = queue.shift();
      if (seen.has(href) || !inScope(href)) continue;
      seen.add(href); batch.push(href);
    }
    const found = await Promise.all(batch.map(async href => {
      try {
        const res = await fetch(href, { cache: 'no-cache' });
        if (!res.ok) { fail++; return []; }
        await cache.put(href, res.clone());
        ok++;
        const t = typeOf(href, res);
        return t ? refsOf(await res.text(), href, t) : [];
      } catch (e) { fail++; return []; }
    }));
    found.flat().forEach(h => { if (!seen.has(h)) queue.push(h); });
  }
  return { ok, fail };
}

self.addEventListener('install', e => {
  e.waitUntil(precacheAll().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('judao-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 頁面可以叫 sw 重新掃描一次（例如新增美術檔後）：navigator.serviceWorker.controller.postMessage('precache')
self.addEventListener('message', e => {
  if (e.data === 'precache') {
    e.waitUntil(precacheAll().then(r => e.source && e.source.postMessage({ type: 'precached', ...r })).catch(() => {}));
  }
});

/* ---------------- 取檔：網路優先、失敗才用快取 ---------------- */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' && url.searchParams.has('nosw')) return; // 開發用：不經過 sw
  e.respondWith(handle(e));
});

async function handle(e) {
  const req = e.request;
  try {
    if (e.clientId) {
      const cl = await self.clients.get(e.clientId);
      if (cl && new URL(cl.url).searchParams.has('nosw')) return fetch(req);
    }
  } catch (err) { /* 略過 */ }
  if (req.headers.has('range')) return rangeFirst(req);
  return networkFirst(req);
}

function stripSearch(href) { const u = new URL(href); u.search = ''; u.hash = ''; return u.href; }

async function fromCache(req, isNav) {
  const cache = await caches.open(CACHE);
  let res = await cache.match(isNav ? stripSearch(req.url) : req);
  if (!res) res = await cache.match(req, { ignoreSearch: true });
  if (!res && isNav) res = (await cache.match(scopeURL().href)) || (await cache.match(new URL('index.html', scopeURL()).href));
  return res || null;
}

function offline(isNav) {
  return new Response(isNav ? '<meta charset="utf-8"><p style="font:16px sans-serif;padding:24px">離線中，而且這個頁面還沒存到手機裡。連上網路再打開一次就好囉。</p>' : '',
    { status: 503, statusText: 'Offline', headers: { 'Content-Type': isNav ? 'text/html; charset=utf-8' : 'text/plain' } });
}

function networkFirst(req) {
  const isNav = req.mode === 'navigate';
  let netReq = req;
  // 一般檔案向伺服器確認有沒有更新（避免瀏覽器的 HTTP 快取拿到舊檔）；導覽請求不能改設定，照原樣抓
  if (!isNav) { try { netReq = new Request(req, { cache: 'no-cache' }); } catch (e) { netReq = req; } }
  const net = fetch(netReq).then(async res => {
    if (res && res.status === 200 && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(isNav ? stripSearch(req.url) : req, copy)).catch(() => {});
    }
    return res;
  });
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done) { done = true; resolve(r); } };
    const timer = setTimeout(async () => { const c = await fromCache(req, isNav); if (c) finish(c); }, NET_TIMEOUT);
    net.then(res => { clearTimeout(timer); finish(res); },
             async () => { clearTimeout(timer); finish((await fromCache(req, isNav)) || offline(isNav)); });
  });
}

// 媒體的分段請求（Range）：先問網路；離線時從快取的完整檔案切出那一段回 206
async function rangeFirst(req) {
  try { return await fetch(req); } catch (e) { /* 離線 */ }
  const full = await fromCache(req, false);
  if (!full) return offline(false);
  const buf = await full.arrayBuffer(), size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = 0, end = size - 1;
  if (m) {
    if (m[1] === '' && m[2] !== '') { start = Math.max(0, size - Number(m[2])); }
    else { start = Number(m[1] || 0); if (m[2] !== '') end = Math.min(size - 1, Number(m[2])); }
  }
  if (start >= size || start > end) {
    return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
