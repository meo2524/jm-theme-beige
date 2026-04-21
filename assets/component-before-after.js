customElements.get('mc-before-after') || customElements.define('mc-before-after', class extends HTMLElement {
  #size = undefined;
  #locked = false;

  #startBound = this.#start.bind(this);
  #endBound   = this.#end.bind(this);
  #moveBound  = this.#move.bind(this);

  connectedCallback() {
    this.content   = this.querySelector('.before-after');
    this.direction = this.dataset.layout || 'horizontal';

    this.content.addEventListener('mousedown',  this.#startBound);
    this.content.addEventListener('touchstart', this.#startBound, { passive: true });
    window.addEventListener('mouseup',   this.#endBound);
    window.addEventListener('touchend',  this.#endBound);
    window.addEventListener('mousemove', this.#moveBound);
    window.addEventListener('touchmove', this.#moveBound, { passive: false });
  }

  disconnectedCallback() {
    this.content?.removeEventListener('mousedown',  this.#startBound);
    this.content?.removeEventListener('touchstart', this.#startBound);
    window.removeEventListener('mouseup',   this.#endBound);
    window.removeEventListener('touchend',  this.#endBound);
    window.removeEventListener('mousemove', this.#moveBound);
    window.removeEventListener('touchmove', this.#moveBound);
  }

  #start(e) {
    if (e.target.closest('a')) return;
    this.#locked = true;
    this.#size = this.content.getBoundingClientRect();
  }

  #end() {
    this.#locked = false;
  }

  #move(e) {
    if (!this.#locked) return;
    if (e.cancelable) e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    let pct = this.direction === 'vertical'
      ? 100 - ((point.clientY - this.#size.y) / this.#size.height * 100)
      : (point.clientX - this.#size.x) / this.#size.width * 100;
    pct = Math.min(Math.max(pct, 0), 100);
    this.content.style.setProperty('--position', `${pct}%`);
  }
});
