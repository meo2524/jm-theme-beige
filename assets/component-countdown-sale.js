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

    const days  = this.querySelector('[data-days]');
    const hours = this.querySelector('[data-hours]');
    const mins  = this.querySelector('[data-min]');
    const secs  = this.querySelector('[data-sec]');

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

      if (days)  days.innerHTML  = `${d} <em>${this.dataset.textDays}</em>`;
      if (hours) hours.innerHTML = `${h} <em>${this.dataset.textHours}</em>`;
      if (mins)  mins.innerHTML  = `${m} <em>${this.dataset.textMin}</em>`;
      if (secs)  secs.innerHTML  = `${s} <em>${this.dataset.textSec}</em>`;
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
