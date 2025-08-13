import { Application, Container } from 'pixi.js';
import { createBackground } from './scene/background';
import { createUI } from './ui/ui';
import { createGame } from './game/game';
import { createCharacter } from './scene/character';
import { startMusic } from './audio/audio';

const appContainer = document.getElementById('app')!;

async function bootstrap() {
  const app = new Application();
  await app.init({
    width: 1280,
    height: 720,
    backgroundColor: 0x05060a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  appContainer.innerHTML = '';
  appContainer.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  const backgroundLayer = new Container();
  const gameLayer = new Container();
  const uiLayer = new Container();
  root.addChild(backgroundLayer, gameLayer, uiLayer);

  const bg = createBackground(app, backgroundLayer);
  const character = createCharacter(gameLayer);

  const game = createGame(app, gameLayer, { bg, character });
  createUI(app, uiLayer, game);

  startMusic(false);

  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    // Center root
    root.x = (app.renderer.width - 1280) / 2;
    root.y = (app.renderer.height - 720) / 2;
  });
  window.dispatchEvent(new Event('resize'));
}

bootstrap();