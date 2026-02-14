export class InputHandler {
  constructor(onMove, onStart, onPromptChoice, onToggleInventory, onInventorySlot, onDropMode) {
    this.onMove = onMove;
    this.onStart = onStart;
    this.onPromptChoice = onPromptChoice;
    this.onToggleInventory = onToggleInventory;
    this.onInventorySlot = onInventorySlot;
    this.onDropMode = onDropMode;
  }

  bind() {
    window.addEventListener('keydown', (event) => {
      const key = event.key;
      const dirs = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0]
      };
      if (key === 'Enter' || key === ' ') this.onStart();
      if (key === 'y' || key === 'Y') this.onPromptChoice?.(true);
      if (key === 'n' || key === 'N') this.onPromptChoice?.(false);
      if (key === 'i' || key === 'I') {
        event.preventDefault();
        this.onToggleInventory?.();
      }
      if (key === 'd' || key === 'D') {
        const consumed = this.onDropMode?.();
        if (consumed) {
          event.preventDefault();
          return;
        }
      }
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        const index = key === '0' ? 9 : Number(key) - 1;
        this.onInventorySlot?.(index);
      }
      if (dirs[key]) {
        event.preventDefault();
        this.onMove(...dirs[key]);
      }
    });
  }
}
