export class InputHandler {
  constructor(onMove, onStart) {
    this.onMove = onMove;
    this.onStart = onStart;
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
      if (dirs[key]) {
        event.preventDefault();
        this.onMove(...dirs[key]);
      }
    });
  }
}
