// 載入所有美術檔（主代理擁有）。清單來自 tools/list_art.py 產生的 available.js，沒畫好的會畫「?」佔位。
import { Art } from './common.js';
import { AVAILABLE } from './available.js';

let loaded = null;
export function loadArt() {
  if (loaded) return loaded;
  const jobs = [
    ...AVAILABLE.desserts.map(id => import(`./desserts/${id}.js`)),
    ...AVAILABLE.drinks.map(id => import(`./drinks/${id}.js`)),
    ...(AVAILABLE.props ? [import('./props.js')] : []),
  ].map(p => p.catch(e => console.warn('美術檔載入失敗', e)));
  loaded = Promise.all(jobs).then(() => Art);
  return loaded;
}
export { Art };
