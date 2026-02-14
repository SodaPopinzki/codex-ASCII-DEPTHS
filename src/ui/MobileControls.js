export class MobileControls {
  constructor(root, onMove, onStart, onInventory, onWait, onUseStairs, onRest) {
    this.root = root;
    this.onMove = onMove;
    this.onStart = onStart;
    this.onInventory = onInventory;
    this.onWait = onWait;
    this.onUseStairs = onUseStairs;
    this.onRest = onRest;
  }

  mount() {
    if (document.querySelector('.mobile-controls')) return;
    const controls = document.createElement('div');
    controls.className = 'mobile-controls';
    controls.innerHTML = `
      <div class="dpad">
        <button data-dx="0" data-dy="-1" aria-label="Move up">↑</button>
        <div class="dpad-row"><button data-dx="-1" data-dy="0" aria-label="Move left">←</button><button data-dx="1" data-dy="0" aria-label="Move right">→</button></div>
        <button data-dx="0" data-dy="1" aria-label="Move down">↓</button>
      </div>
      <div class="actions">
        <button data-action="inventory" aria-label="Open inventory">i</button>
        <button data-action="wait" aria-label="Wait one turn">wait</button>
        <button data-action="stairs" aria-label="Use stairs">&gt;</button>
      </div>
    `;

    controls.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (target.dataset.action === 'inventory') this.onInventory?.();
      if (target.dataset.action === 'wait') this.onWait?.();
      if (target.dataset.action === 'stairs') this.onUseStairs?.();
      if (target.dataset.dx) this.onMove(Number(target.dataset.dx), Number(target.dataset.dy));
    });

    let touchStart = null;
    let longPressTimer = null;
    this.root.addEventListener('touchstart', (event) => {
      const t = event.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
      longPressTimer = setTimeout(() => {
        this.onRest?.();
        touchStart = null;
      }, 450);
    }, { passive: true });

    this.root.addEventListener('touchend', (event) => {
      clearTimeout(longPressTimer);
      if (!touchStart) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) this.onMove(Math.sign(dx), 0);
      else if (Math.abs(dy) > 25) this.onMove(0, Math.sign(dy));
      touchStart = null;
    }, { passive: true });

    document.body.appendChild(controls);
    this.root.addEventListener('click', () => this.onStart?.(), { once: true });
  }
}
