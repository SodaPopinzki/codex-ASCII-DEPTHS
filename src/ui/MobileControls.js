export class MobileControls {
  constructor(root, onMove, onStart) {
    this.root = root;
    this.onMove = onMove;
    this.onStart = onStart;
  }

  mount() {
    const controls = document.createElement('div');
    controls.className = 'mobile-controls';
    controls.innerHTML = `
      <div class="dpad">
        <button data-dx="0" data-dy="-1">↑</button>
        <div><button data-dx="-1" data-dy="0">←</button><button data-dx="1" data-dy="0">→</button></div>
        <button data-dx="0" data-dy="1">↓</button>
      </div>
      <div class="actions"><button data-action="start">START</button></div>
    `;
    controls.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (target.dataset.action === 'start') this.onStart();
      if (target.dataset.dx) this.onMove(Number(target.dataset.dx), Number(target.dataset.dy));
    });

    let touchStart = null;
    this.root.addEventListener('touchstart', (event) => {
      const t = event.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    });
    this.root.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) this.onMove(Math.sign(dx), 0);
      else if (Math.abs(dy) > 25) this.onMove(0, Math.sign(dy));
      touchStart = null;
    });

    this.root.appendChild(controls);
  }
}
