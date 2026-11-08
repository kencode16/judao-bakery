// 設定：音樂、音效、重置進度（頁面內二次確認）、製作資訊（D 擁有）。畫面合約見 架構.md。
import { esc, flower, sfx, music, topBar, clearedCount } from './common.js';

let off = [];

/** 把 CREDITS.md 整理成安全的 HTML（只支援標題、清單、表格、粗體、連結） */
function mdToHtml(md) {
  const links = [];
  const inline = s => {
    let t = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, txt, url) => { links.push([txt, url]); return `\u0000${links.length - 1}\u0000`; });
    t = esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/(https?:\/\/[^\s<)，。、]+)/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
    return t.replace(/\u0000(\d+)\u0000/g, (m, i) => `<a href="${esc(links[i][1])}" target="_blank" rel="noopener noreferrer">${esc(links[i][0])}</a>`);
  };
  const out = [];
  let list = false, tableHead = true;
  const closeList = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { closeList(); tableHead = true; continue; }
    let m;
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) { closeList(); out.push(`<p class="u-md-h">${inline(m[1])}</p>`); continue; }
    if (line.startsWith('|')) {
      if (/^\|[\s:|-]+\|?$/.test(line)) continue;                 // 表格分隔線
      const cells = line.replace(/^\||\|$/g, '').split('|').map(c => c.trim()).filter(Boolean);
      if (!list) { out.push('<ul>'); list = true; }
      out.push(`<li${tableHead ? ' class="u-md-th"' : ''}>${cells.map(inline).join('・')}</li>`);
      tableHead = false;
      continue;
    }
    if ((m = line.match(/^[-*+]\s+(.*)$/))) {
      if (!list) { out.push('<ul>'); list = true; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    closeList();
    const text = line.replace(/^>\s?/, '').trim();
    if (text) out.push(`<p>${inline(text)}</p>`);
  }
  closeList();
  return out.join('');
}

/** CREDITS.md 裡如果有「設定頁…製作資訊」那一節，就只顯示那段，其餘收進「完整授權資訊」；沒有就整份顯示 */
function creditsHtml(md) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l => /^#{1,6}\s+.*(設定頁|製作資訊)/.test(l.trim()));
  if (start < 0) return mdToHtml(md);
  let end = lines.findIndex((l, i) => i > start && /^#{1,6}\s/.test(l.trim()));
  if (end < 0) end = lines.length;
  const brief = lines.slice(start + 1, end).join('\n').trim();
  const rest = [...lines.slice(0, start), ...lines.slice(end)].join('\n').trim();
  if (!brief) return mdToHtml(md);
  return mdToHtml(brief) + (rest ? `<details class="u-src u-cr-more"><summary>完整授權資訊</summary>${mdToHtml(rest)}</details>` : '');
}

const sw = (key, on, label, note) => `
<div class="u-set-row">
  <div><b>${label}</b><small>${note}</small></div>
  <button class="u-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-key="${key}"><i></i></button>
</div>`;

export default {
  async mount(root, params, app) {
    const save = app.save;
    const st = save.settings();
    const got = save.unlockedList().length;

    root.innerHTML = `
${topBar({ title: '設定' })}
<div class="u-settings">
  <section class="card u-set-card">
    <h2 class="u-set-h">聲音</h2>
    ${sw('music', st.music, '背景音樂', '輕快的甜點店音樂')}
    ${sw('sfx', st.sfx, '音效', '點選、擠奶油、吃甜點的聲音')}
  </section>

  <section class="card u-set-card">
    <h2 class="u-set-h">遊戲進度</h2>
    <p class="u-set-prog">已過 <b>${clearedCount(app)}</b> 關・星星 <b>${save.totalStars()}</b>・圖鑑 <b>${got}</b>／${app.data.DESSERTS.length}</p>
    <div class="u-reset">
      <button class="btn ghost u-danger" data-reset>重置進度</button>
      <div class="u-confirm" hidden role="alertdialog" aria-label="確認重置進度">
        <p><b>真的要重新開店嗎？</b><br>星星、過關紀錄和圖鑑收集都會清空，沒辦法復原喔。</p>
        <div class="u-confirm-btns">
          <button class="btn ghost" data-cancel>我再想想</button>
          <button class="btn u-danger-solid" data-confirm>確定重置</button>
        </div>
      </div>
    </div>
  </section>

  <section class="card u-set-card u-credits">
    <h2 class="u-set-h">製作資訊</h2>
    <p class="u-cr-h">音樂與音效</p>
    <div class="u-music-credits"><p class="u-muted">讀取中…</p></div>
    <p class="u-cr-h">插畫</p>
    <p>甜點、飲品和道具都是用程式一筆一筆畫出來的原創插畫。</p>
    <p class="u-about">${flower(18)} 「菊島」是澎湖的別名，澎湖的縣花是紅心黃邊的天人菊。</p>
  </section>
</div>`;

    // 音樂、音效開關
    root.querySelectorAll('.u-switch').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.key;
      const v = !b.classList.contains('on');
      b.classList.toggle('on', v);
      b.setAttribute('aria-checked', String(v));
      save.setSetting(key, v);
      try {
        if (key === 'sfx') { app.audio?.setSfx?.(v); if (v) sfx(app, 'tap'); }
        else app.audio?.setMusic?.(v);
      } catch (e) { console.warn(e); }
    }));

    // 重置進度：頁面內二次確認
    const confirmBox = root.querySelector('.u-confirm');
    const resetBtn = root.querySelector('[data-reset]');
    resetBtn.addEventListener('click', () => {
      sfx(app, 'tap');
      confirmBox.hidden = false;
      resetBtn.hidden = true;
      root.querySelector('[data-cancel]').focus({ preventScroll: true });
    });
    root.querySelector('[data-cancel]').addEventListener('click', () => {
      sfx(app, 'tap');
      confirmBox.hidden = true;
      resetBtn.hidden = false;
    });
    root.querySelector('[data-confirm]').addEventListener('click', () => {
      sfx(app, 'tap');
      save.reset();
      const s = save.settings();
      try { app.audio?.setSfx?.(s.sfx); app.audio?.setMusic?.(s.music); } catch (e) { console.warn(e); }
      app.toast('進度已重置，歡迎重新開店！');
      app.go('home');
    });

    root.querySelector('[data-back]').addEventListener('click', () => { sfx(app, 'tap'); app.go('home'); });
    music(app, 'home');

    // 音樂出處：讀 F 建立的 CREDITS.md
    const box = root.querySelector('.u-music-credits');
    let alive = true;
    off.push(() => { alive = false; });
    try {
      const res = await fetch('assets/music/CREDITS.md', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const md = (await res.text()).trim();
      if (!alive) return;
      box.innerHTML = md ? creditsHtml(md) : '<p class="u-muted">音樂資訊準備中</p>';
    } catch (e) {
      if (alive) box.innerHTML = '<p class="u-muted">音樂資訊準備中</p>';
    }
  },
  unmount() { off.forEach(f => f()); off = []; },
};
