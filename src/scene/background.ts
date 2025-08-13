import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

export type BackgroundController = { setCyberMode: (enabled: boolean) => void };

export function createBackground(app: Application, layer: Container): BackgroundController {
  const grid = new Graphics();
  const gridSize = 32;
  const width = 1280;
  const height = 720;

  grid.alpha = 0.35;
  grid.stroke({ width: 1, color: 0x00ffff, alpha: 0.25 });
  for (let x = 0; x <= width; x += gridSize) {
    grid.moveTo(x, 0).lineTo(x, height);
  }
  for (let y = 0; y <= height; y += gridSize) {
    grid.moveTo(0, y).lineTo(width, y);
  }
  layer.addChild(grid);

  const binaryLayer = new Container();
  layer.addChild(binaryLayer);

  const style = new TextStyle({
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: 16,
    fill: 0x00ffcc,
    dropShadow: true,
    dropShadowDistance: 0,
    dropShadowColor: '#00ffff',
    dropShadowBlur: 6,
  });

  interface RainBit { text: Text; speed: number; }
  const bits: RainBit[] = [];
  for (let i = 0; i < 120; i++) {
    const t = new Text(generateBits(), style);
    t.x = Math.random() * width;
    t.y = Math.random() * height;
    t.alpha = 0.4 + Math.random() * 0.6;
    binaryLayer.addChild(t);
    bits.push({ text: t, speed: 0.5 + Math.random() * 1.5 });
  }

  let cyber = false;
  app.ticker.add(() => {
    for (const b of bits) {
      b.text.y += b.speed * (cyber ? 2.0 : 1.0);
      if (Math.random() < (cyber ? 0.05 : 0.02)) b.text.text = generateBits();
      if (b.text.y > height) {
        b.text.y = -20;
        b.text.x = Math.random() * width;
      }
    }
    grid.alpha = (cyber ? 0.45 : 0.25) + 0.1 * (1 + Math.sin(performance.now() / 1000));
  });

  return {
    setCyberMode(enabled: boolean) { cyber = enabled; }
  };
}

function generateBits(): string {
  let s = '';
  const len = 6 + Math.floor(Math.random() * 6);
  for (let i = 0; i < len; i++) s += Math.random() > 0.5 ? '1' : '0';
  return s;
}