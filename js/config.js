// 共用設定（主代理擁有）
export const GAME_NAME = '菊島連連烘';
export const COLS = 7;
export const MIN_TILE = 44;

/** 地區（順序就是遊玩順序）。theme：accent 主題色、soft 淡底、deep 深色字 */
export const REGIONS = [
  { id: 'fr', name: '法國', flag: '🇫🇷', levels: [1, 10], theme: { accent: '#8FB7E3', soft: '#EAF2FB', deep: '#3E5F8A' } },
  { id: 'tw', name: '台灣', flag: '🇹🇼', levels: [11, 20], theme: { accent: '#E89A6B', soft: '#FCEEE4', deep: '#9A4E27' } },
  { id: 'se', name: '義大利與南歐', flag: '🇮🇹', levels: [21, 30], theme: { accent: '#9CC48A', soft: '#EEF6E8', deep: '#4D7A3B' } },
  { id: 'us', name: '英國與美國', flag: '🇬🇧', levels: [31, 40], theme: { accent: '#C79ADB', soft: '#F5EDF9', deep: '#6E4383' } },
  { id: 'jp', name: '日本', flag: '🇯🇵', levels: [41, 50], theme: { accent: '#EE9BB0', soft: '#FDEEF2', deep: '#9B3F58' } },
];
export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
export const levelRegion = id => REGIONS.find(r => id >= r.levels[0] && id <= r.levels[1]);

/** 甜點方塊的專屬底色 */
export const TILE_BG = {
  sky: '#CFE6F5', mint: '#CDEBDC', pink: '#F9D3DC', lavender: '#E3DAF5',
  lemon: '#FCE9A8', peach: '#F8D6C4', sage: '#E1EDC2', tea: '#EADFD2',
};
/** 飲品、鑰匙方塊的底色 */
export const CREAM_BG = '#FFF6E9';
