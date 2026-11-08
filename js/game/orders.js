// E 點單關：盤面上方 2～3 張點單（甜點小圖＋還需要幾對），完成打勾蓋章。
import { miniTile } from './tileArt.js';

export class OrdersBar {
  constructor(host, orders) {
    this.el = document.createElement('div');
    this.el.className = 'g-orders';
    this.items = [];   // [index] → [{ kind, need, got, el, badge }]
    this.tickets = [];
    orders.forEach((o, i) => {
      const t = document.createElement('div');
      t.className = 'g-ticket';
      t.innerHTML = `<div class="g-ticket-h"><i>No.${i + 1}</i>客人點單</div><div class="g-ticket-b"></div><span class="g-stamp">完成</span>`;
      const body = t.querySelector('.g-ticket-b');
      const its = o.items.map(it => {
        const row = document.createElement('span');
        row.className = 'g-oitem';
        row.appendChild(miniTile(it.kind, 30));
        const badge = document.createElement('b');
        row.appendChild(badge);
        body.appendChild(row);
        const rec = { kind: it.kind, need: it.need, got: it.got, el: row, badge };
        this.paintItem(rec);
        return rec;
      });
      if (o.done) t.classList.add('g-done');
      this.items.push(its); this.tickets.push(t);
      this.el.appendChild(t);
    });
    host.appendChild(this.el);
  }
  paintItem(rec) {
    const left = rec.need - rec.got;
    rec.el.classList.toggle('g-ok', left <= 0);
    rec.badge.textContent = left <= 0 ? '✓' : `×${left}`;
    rec.el.setAttribute('aria-label', left <= 0 ? '完成' : `還要 ${left} 對`);
  }
  /** 點單項目在畫面上的中心（飛過去的目標） */
  itemCenter(index, kind) {
    const rec = this.items[index]?.find(x => x.kind === kind);
    const el = rec ? rec.el.firstChild : this.tickets[index];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  update(step) {
    const rec = this.items[step.index]?.find(x => x.kind === step.kind);
    if (rec) {
      rec.got = step.got; rec.need = step.need; this.paintItem(rec);
      rec.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    }
    if (step.done) this.tickets[step.index]?.classList.add('g-done');
  }
  doneCount() { return this.tickets.filter(t => t.classList.contains('g-done')).length; }
}
