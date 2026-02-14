import './styles/main.css';
import { Game } from './game/Game.js';
import { Renderer } from './game/Renderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { MobileControls } from './ui/MobileControls.js';

const app = document.querySelector('#app');
const game = new Game();
const renderer = new Renderer(app);
let dirty = true;
let rafPending = false;

const redraw = () => {
  rafPending = false;
  if (!dirty) return;
  dirty = false;
  if (game.state === 'title') renderer.renderTitle(() => {
    game.start();
    dirty = true;
    scheduleRender();
  });
  else renderer.render(game);
};

const scheduleRender = () => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(redraw);
};

new InputHandler((dx, dy) => {
  if (game.movePlayer(dx, dy)) {
    dirty = true;
    scheduleRender();
  }
}, () => {
  game.start();
  dirty = true;
  scheduleRender();
}, (choice) => {
  if (game.respondStairs(choice)) {
    dirty = true;
    scheduleRender();
  }
}).bind();

new MobileControls(app, (dx, dy) => {
  if (game.movePlayer(dx, dy)) {
    dirty = true;
    scheduleRender();
  }
}, () => {
  game.start();
  dirty = true;
  scheduleRender();
}).mount();

scheduleRender();
