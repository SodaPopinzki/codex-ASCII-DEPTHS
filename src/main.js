import './styles/main.css';
import { Game } from './game/Game.js';
import { Renderer } from './game/Renderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { MobileControls } from './ui/MobileControls.js';

const app = document.querySelector('#app');
const game = new Game();
const renderer = new Renderer(app, {
  onStart: () => {
    game.start();
    refresh();
  },
  onScores: () => {
    game.openScores();
    refresh();
  },
  onSettings: () => {
    game.openSettings();
    refresh();
  },
  onCloseMenu: () => {
    game.closeMenuScreen();
    refresh();
  },
  onPause: () => {
    game.togglePause();
    refresh();
  },
  onUpdateSetting: (key, value) => {
    game.updateSetting(key, value);
    applySettings();
    refresh();
  }
});

const applySettings = () => {
  const { fontSize, theme, scanlines, crt, mobileControls } = game.settings;
  document.documentElement.dataset.fontSize = fontSize;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('scanlines-off', !scanlines);
  document.documentElement.classList.toggle('crt-off', !crt);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const showMobile = mobileControls === 'on' || (mobileControls === 'auto' && isMobile);
  document.documentElement.classList.toggle('mobile-controls-enabled', showMobile);
};

const refresh = () => {
  game.updateAnimations();
  renderer.render(game);
};

new InputHandler((dx, dy) => {
  if (game.movePlayer(dx, dy)) refresh();
}, () => {
  game.start();
  refresh();
}, (choice) => {
  if (game.respondStairs(choice)) refresh();
}, () => {
  game.toggleInventory();
  refresh();
}, (index) => {
  if (game.handleInventorySlot(index)) refresh();
}, () => game.toggleDropMode(), () => {
  game.toggleHelp();
  refresh();
}, () => {
  game.toggleHistory();
  refresh();
}, (turns) => {
  if (game.waitTurn(turns)) refresh();
}, () => {
  if (game.togglePause()) refresh();
}, () => {
  game.openScores();
  refresh();
}, () => {
  game.openSettings();
  refresh();
}, () => {
  game.closeMenuScreen();
  refresh();
}).bind();

new MobileControls(app, (dx, dy) => {
  if (game.movePlayer(dx, dy)) refresh();
}, () => {
  if (game.state === 'title') {
    game.start();
    refresh();
  }
}, () => {
  game.toggleInventory();
  refresh();
}, () => {
  if (game.waitTurn(1)) refresh();
}, () => {
  if (game.pendingStairsPrompt) {
    game.respondStairs(true);
    refresh();
  }
}, () => {
  if (game.waitTurn(5)) refresh();
}).mount();

applySettings();
refresh();
