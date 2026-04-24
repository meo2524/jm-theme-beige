customElements.get('mc-countdown') || customElements.define('mc-countdown', class extends HTMLElement {
  #tick = null;

  connectedCallback() {
    const fixedTime      = this.dataset.time;
    const infiniteMinutes = Number(this.dataset.infiniteMinute || 0);

    if (!fixedTime && !infiniteMinutes) {
      this.textContent = 'Add a Unix timestamp or infinite minutes in settings.';
      return;
    }

    const hideOnExpired    = this.dataset.hideOnExpired === 'true';
    const sectionSelector  = this.dataset.sectionId;

    const days  = this.querySelector('[data-days] b');
    const hours = this.querySelector('[data-hours] b');
    const mins  = this.querySelector('[data-min] b');
    const secs  = this.querySelector('[data-sec] b');

    let target = infiniteMinutes
      ? this.#addMinutes(infiniteMinutes)
      : Number(fixedTime) * 1000;

    this.#tick = setInterval(() => {
      const remaining = target - Date.now();

      if (remaining <= 0) {
        if (infiniteMinutes) {
          target = this.#addMinutes(infiniteMinutes);
          return;
        }
        clearInterval(this.#tick);
        this.#tick = null;
        if (hideOnExpired && sectionSelector) {
          document.querySelector(sectionSelector)?.classList.add('hidden');
        }
        this.textContent = this.dataset.textExpired || 'This offer has ended.';
        this.classList.add('expired');
        return;
      }

      const d = Math.floor(remaining / 86400000);
      const h = Math.floor((remaining % 86400000) / 3600000);
      const m = Math.floor((remaining % 3600000)  / 60000);
      const s = Math.floor((remaining % 60000)    / 1000);

      if (days)  days.textContent  = d;
      if (hours) hours.textContent = h;
      if (mins)  mins.textContent  = m;
      if (secs)  secs.textContent  = s;
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.#tick);
    this.#tick = null;
  }

  #addMinutes(minutes) {
    return Date.now() + minutes * 60000;
  }
});
