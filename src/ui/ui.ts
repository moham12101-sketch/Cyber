import { Application, Container, Graphics, Text } from 'pixi.js';
import type { GameApi } from '@/game/game';

export function createUI(app: Application, layer: Container, game: GameApi) {
  const buttons = new Container();
  layer.addChild(buttons);

  const spinBtn = createNeonButton('SPIN', 0x00ffff, () => game.spin());
  const autoBtn = createNeonButton('AUTO', 0xff00ff, () => game.toggleAuto());
  const betBtn = createNeonButton('BET', 0x00ff66, () => game.cycleBet());

  const spacing = 16;
  spinBtn.x = 1280 - (180 + spacing);
  spinBtn.y = 720 - (60 + spacing);

  autoBtn.x = spinBtn.x - (180 + spacing);
  autoBtn.y = spinBtn.y;

  betBtn.x = autoBtn.x - (180 + spacing);
  betBtn.y = spinBtn.y;

  buttons.addChild(betBtn, autoBtn, spinBtn);
}

function createNeonButton(label: string, color: number, onClick: () => void): Container {
  const root = new Container();
  const w = 180;
  const h = 60;

  const bg = new Graphics();
  bg.roundRect(0, 0, w, h, 12);
  bg.fill({ color: 0x000000, alpha: 0.5 });
  bg.stroke({ width: 2, color, alpha: 0.9 });
  root.addChild(bg);

  const glow = new Graphics();
  glow.roundRect(0, 0, w, h, 12);
  glow.stroke({ width: 8, color, alpha: 0.25 });
  glow.alpha = 0.6;
  root.addChild(glow);

  const text = new Text(label, {
    fontFamily: 'Orbitron, Share Tech Mono, monospace',
    fontSize: 22,
    fill: color,
    letterSpacing: 2,
    dropShadow: true,
    dropShadowBlur: 8,
    dropShadowDistance: 0,
    dropShadowColor: '#00ffff'
  });
  text.anchor.set(0.5);
  text.x = w / 2;
  text.y = h / 2;
  root.addChild(text);

  root.eventMode = 'static';
  root.cursor = 'pointer';

  const ripple = new Graphics();
  root.addChild(ripple);

  root.on('pointerdown', (e) => {
    const local = e.getLocalPosition(root);
    playRipple(ripple, local.x, local.y, color, w, h);
    onClick();
  });

  root.on('pointerover', () => { glow.alpha = 0.9; });
  root.on('pointerout', () => { glow.alpha = 0.6; });

  return root;
}

function playRipple(g: Graphics, x: number, y: number, color: number, w: number, h: number) {
  let radius = 0;
  let alpha = 0.6;
  g.clear();
  const step = () => {
    g.clear();
    g.circle(x, y, radius).stroke({ width: 2, color, alpha });
    radius += 6;
    alpha *= 0.92;
    if (radius < Math.max(w, h)) requestAnimationFrame(step);
    else g.clear();
  };
  step();
}