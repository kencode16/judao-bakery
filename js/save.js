// 存檔（主代理擁有）。localStorage，讀寫都包 try/catch；壞掉就用預設值。
import { LEVELS } from './data/levels.js';
import { DESSERTS } from './data/desserts.js';

const KEY = 'jdlh-save-v1';
const UNLOCK_ALL = new URLSearchParams(location.search).has('unlockall');
const fresh = () => ({ stars: {}, unlocked: [], bookSeen: {}, seen: {}, settings: { music: true, sfx: true } });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw);
    return { ...fresh(), ...d, settings: { ...fresh().settings, ...(d.settings || {}) } };
  } catch (e) { return fresh(); }
}
let data = load();
function write() {
  if (UNLOCK_ALL) return;            // 開發模式不寫入
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 私密模式等，忽略 */ }
}
if (UNLOCK_ALL) {
  LEVELS.forEach(l => { data.stars[l.id] = data.stars[l.id] || 3; });
  data.unlocked = DESSERTS.map(d => d.id);
}

export const save = {
  levelStars: id => data.stars[id] || 0,
  isLevelOpen: id => id === 1 || (data.stars[id - 1] || 0) > 0,
  /** 過關時呼叫。第一次過關會依 levels.js 的 unlocks 解鎖甜點。 */
  recordLevel(id, stars) {
    const before = data.stars[id] || 0;
    const firstClear = before === 0;
    data.stars[id] = Math.max(before, stars);
    let newlyUnlocked = [];
    if (firstClear) {
      const lv = LEVELS.find(l => l.id === id);
      newlyUnlocked = (lv?.unlocks || []).filter(d => !data.unlocked.includes(d));
      data.unlocked.push(...newlyUnlocked);
    }
    write();
    return { firstClear, bestStars: data.stars[id], newlyUnlocked };
  },
  isUnlocked: id => data.unlocked.includes(id),
  unlockedList: () => [...data.unlocked],
  isNewInBook: id => data.unlocked.includes(id) && !data.bookSeen[id],
  markBookSeen(id) { if (!data.bookSeen[id]) { data.bookSeen[id] = 1; write(); } },
  totalStars: () => Object.values(data.stars).reduce((a, b) => a + b, 0),
  /** 目前該玩的關（第一個還沒過的開放關卡；全過了回傳最後一關） */
  currentLevel() {
    for (const l of LEVELS) if (!data.stars[l.id]) return l.id;
    return LEVELS.length ? LEVELS[LEVELS.length - 1].id : 1;
  },
  settings: () => ({ ...data.settings }),
  setSetting(k, v) { data.settings[k] = v; write(); },
  seen: k => !!data.seen[k],
  markSeen(k) { data.seen[k] = 1; write(); },
  reset() { data = fresh(); write(); },
};
