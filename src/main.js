import './styles/main.css';
import { Game } from './game/Game.js';
import { Renderer } from './game/Renderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { MobileControls } from './ui/MobileControls.js';

const app = document.querySelector('#app');
const game = new Game();
const renderer = new Renderer(app);

const redraw = () => {
  if (game.state === 'title') renderer.renderTitle(() => {
    game.start();
    redraw();
  });
  else renderer.render(game);
};

new InputHandler((dx, dy) => {
  game.movePlayer(dx, dy);
  redraw();
}, () => {
  game.start();
  redraw();
}).bind();

new MobileControls(app, (dx, dy) => {
  game.movePlayer(dx, dy);
  redraw();
}, () => {
  game.start();
  redraw();
}).mount();

redraw();
