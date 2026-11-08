# A 引擎：`js/engine/board.js` 用法

純邏輯、不碰 DOM，瀏覽器和 Node 都能 `import`。規則合約以 `架構.md`「A 引擎」為準，這份只講怎麼用。

## 最常用的流程

```js
import { createBoard } from './js/engine/board.js';   // 也可以 import createBoard from …（default export）
import { LEVELS } from './js/data/levels.js';

const b = createBoard(LEVELS[0]);            // seed 省略時用 levelDef.seed
// const b = createBoard(levelDef, { seed: 123 });   // 重玩想換盤面就給別的 seed

// 1. 畫盤面
for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
  const cell = b.cell(r, c);        // { hole, icing, jam, gift, tile }
  // cell.hole → 不畫格子；cell.icing → 畫糖霜磚；cell.gift → 畫禮盒（不要露出 tile.kind）
  // cell.tile → { id, kind, isDrink, isKey }；cell.jam → 甜點上面再疊一層果醬
}
// 或一次拿全部 tile：b.tiles() → [{ id, kind, isDrink, isKey, r, c, jam, gift }]

// 2. 提示
const hint = b.findHint();          // { a:[r,c], b:[r,c], path } 或 null
// 點單關優先挑能推進點單的；有鑰匙時鑰匙優先

// 3. 玩家點了兩格
if (b.canSelect(r, c)) { /* 可以選（有 tile、沒果醬、不是禮盒） */ }
const res = b.tryMatch([r1, c1], [r2, c2]);
if (!res.ok) {
  // res.reason：'same' 點同一格 | 'notPair' 不是一對 | 'noPath' 連不到 | 'locked' 果醬／禮盒／空格
  //             | 'over' 已經過關（多出來的一種，正常不會遇到）
  // 失敗不會改變任何狀態
} else {
  drawCream(res.path);              // [[r,c], …] 2～4 點，可能經過外圍 r=-1/rows、c=-1/cols
  for (const s of res.steps) {      // 依序播動畫
    switch (s.type) {
      case 'match':    /* s.a {r,c,id}、s.b、s.kind、s.path：兩個被吃掉 */ break;
      case 'jam':      /* s.cells [[r,c]…]：這些格的果醬融化 */ break;
      case 'giftOpen': /* s.tiles [{r,c,id,kind}]：禮盒打開、tile 現身 */ break;
      case 'order':    /* s.index 第幾張單、s.kind、s.got/s.need、s.done＝整張完成 */ break;
      case 'slide':    /* s.moves [{id, from:[r,c], to:[r,c]}]：FLIP 動畫 */ break;
      case 'shuffle':  /* s.tiles [{id,r,c,kind}]：每個位置的新 kind（id 跟著位置不動） */ break;
      case 'jamClear': /* s.cells：重排救不了，全部果醬融化 */ break;
      case 'win':      /* 過關 */ break;
    }
  }
}
b.status;       // 'playing' | 'won'
b.remaining;    // 剩下幾個 tile（含禮盒裡的）
```

### steps 的順序

`match` → `jam` → `giftOpen`（鑰匙）→ `order` → （過關就 `win` 然後結束）→ `slide` → 卡死處理（`shuffle`，或 `jamClear` 再 `shuffle`；極少數情況還有保底，見下面「卡死保底」）。

畫面只要照順序播就好，不需要自己算規則。播完以後 `b.tiles()` 就是最新狀態（測試有逐步比對過）。

## 其他狀態

| 名稱 | 說明 |
|---|---|
| `b.rows`、`b.cols` | 盤面大小；座標 `[r, c]`，r=0 最上面 |
| `b.orders` | `null` 或 `[{ items:[{ kind, need, got }], done }]`（每次讀都是新的副本） |
| `b.pairing` | D 關 |
| `b.pairOf(kind)` | D 關：甜點 → 飲品代號、飲品 → 甜點代號；非 D 關回傳 kind 本身；`'key'` → `'key'` |
| `b.newKind` | 本關新甜點代號或 `null` |
| `b.slide` | 本關滑動方向（`'none'` 等，額外提供，方便判斷要不要播 FLIP） |
| `b.hasMove()` | 目前有沒有能連的一組 |
| `b.clone()` | 獨立副本（含亂數狀態，副本之後的重排和本體一樣） |

`b.cell(r, c)` 在盤面外（含外圍虛擬格）回傳 `{ hole:true, …, tile:null, outside:true }`。

## 給 E（關卡模擬器）

```js
const b = createBoard(levelDef, { seed });
let moves = 0, shuffles = 0;
while (b.status === 'playing') {
  const h = b.findHint();                 // 貪心策略；隨機策略可以自己從 b.tiles() 挑兩個 tryMatch
  if (!h) throw new Error('救不了');       // 正常不會發生：引擎每步後都會保證有步
  const res = b.tryMatch(h.a, h.b);
  moves++;
  shuffles += res.steps.filter(s => s.type === 'shuffle').length;
}
```

- `createBoard` 遇到關卡設計錯誤會丟 `Error`（訊息有關卡編號）：mask 長度、座標超出、障礙疊在同一格、counts 不是偶數、盤面放不下、果醬＋禮盒格比甜點多、點單要的對數盤面上不夠、D 關兩個甜點配同一種飲品等。
- 發牌：可放 tile 的格子＝非 hole、非糖霜磚。格子數是奇數（或 counts 總數比格子少）時，多的格子留空（隨機挑一般格）；滑動關開局會先擠緊。
- D 關的 `counts[甜點]` 是這個甜點的張數（飲品同樣張數），不必是偶數。點單在 D 關算甜點的代號。
- 診斷用（非正式 API）：`b._diag = { shuffle, jamClear, giftForce, moveForce, stuck, opening }`。
  - `moveForce`／`giftForce` 是規則以外的保底（見下）。`moveForce` 偶爾出現可以接受（糖霜關的殘局）；`giftForce` 出現代表禮盒放法有死角。
  - `stuck > 0` 代表引擎也救不了（例如糖霜磚把格子完全隔開），這關一定要改。
  - `opening`：開局為了保證有步用了哪一招（`null` 最好；`'shuffle'` 正常；`'jamClear'`、`'move'`、`'giftOpen'` 代表開局果醬／禮盒／糖霜放得太滿）。

### 卡死保底（規則以外，只在極端狀況發生）

`架構.md` 規定：重排 200 次 → 果醬全融再試。但「重排」只換 kind、不換位置，有一種情況它救不了：
**最後剩幾塊時，糖霜磚（＋空洞）把它們隔成要三個彎才連得到**（例：第 34 關中央空洞＋四塊糖霜，200 局裡有 5 局最後 2 塊連不到）。
所以引擎另外加了保底，確保「不會出現救不了的狀態」：

1. 重排 200 次都失敗、但其實排得出來 → 直接把一對放到連得到的兩個位置（仍是 `shuffle` 事件）。
2. 果醬全融後還是不行 → **把一塊 tile 搬到「和它夥伴連得到」的最近空格**（`slide` 事件，`moves` 通常 1 個，偶爾 2 個）。
   有禮盒的關卡也先用搬的（例如搬鑰匙），禮盒照樣要用鑰匙開。
3. 還是不行（例如鑰匙被禮盒整圈包住、旁邊沒有空格）→ 禮盒全部打開（`giftOpen` 事件，鑰匙留著當普通一對）。

**給 C：`slide` 事件在不是滑動關的關卡也可能出現（上面第 2 點），`giftOpen` 也可能出現在 `shuffle`／`jamClear` 後面。照順序播就對了。**

## 效能（`tests/engine/bench.mjs`，8 列 × 7 欄，Apple M2，Node 24）

| 呼叫 | 平均 |
|---|---|
| `hasMove()` | 約 3～7 µs（沒有步、要全部掃完：約 2 µs） |
| `findHint()` | 約 4～6 µs |
| `clone()` | 約 1～3 µs |
| `tryMatch()`（含滑動、卡死檢查） | 約 5～19 µs |
| `createBoard()` | 約 0.02～0.03 ms |
| 一整局（建盤＋照提示玩到過關） | 約 0.2～0.4 ms |

E 的 50 關 × 100 seed × 2 種策略（10,000 局）約 2.7 秒。

## 測試

```
cd 專案根目錄
/opt/anaconda3/envs/hermes3d/bin/node --test "tests/engine/*.test.mjs"
/opt/anaconda3/envs/hermes3d/bin/node tests/engine/bench.mjs      # 效能數字
```

| 檔案 | 內容 |
|---|---|
| `path.test.mjs` | 路徑和 BFS 參考實作（Dijkstra on 格子＋方向）、樣品 findPath 交叉驗證 3 萬組（外圍、hole、糖霜磚、果醬、禮盒）；tryMatch／hasMove／findHint 和 BFS 一致 |
| `rules.test.mjs` | 發牌、錯誤檢查、失敗不改狀態、果醬、禮盒鑰匙、滑動四方向（手寫＋隨機對參考實作）、點單、D 關、重排、jamClear、保底、同 seed、clone |
| `play.test.mjs` | 隨機關卡 2,100 局實玩到過關，每一步用 steps 重播比對盤面、檢查永遠有步、滑動關一直擠緊 |
| `helpers.mjs` | 共用：BFS、樣品 findPath 移植、路徑檢查、steps 重播（mirror） |
