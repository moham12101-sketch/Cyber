import { Container, Graphics, Text } from 'pixi.js';
import type { SymbolCode } from './game';

export function createSymbol(initial: SymbolCode) {
  const container = new Container();
  container.eventMode = 'none';

  const bg = new Graphics();
  bg.circle(0, 0, 44).fill({ color: 0x051017, alpha: 0.9 }).stroke({ width: 2, color: 0x00ffff, alpha: 0.5 });
  container.addChild(bg);

  const glow = new Graphics();
  glow.circle(0, 0, 50).stroke({ width: 10, color: 0x00ffff, alpha: 0.2 });
  container.addChild(glow);

  const text = new Text(initial, {
    fontFamily: 'Orbitron, Share Tech Mono',
    fontSize: 36,
    fill: 0x00ffcc,
    dropShadow: true,
    dropShadowBlur: 12,
    dropShadowDistance: 0,
    dropShadowColor: '#00ffff'
  });
  text.anchor.set(0.5);
  container.addChild(text);

  function setSymbol(sym: SymbolCode) {
    text.text = sym;
    const color = sym === 'W' ? 0xff00ff : sym === 'S' ? 0xffff00 : 0x00ffff;
    bg.clear();
    bg.circle(0, 0, 44).fill({ color: 0x051017, alpha: 0.9 }).stroke({ width: 2, color, alpha: 0.7 });
    glow.clear();
    glow.circle(0, 0, 50).stroke({ width: 10, color, alpha: 0.2 });
    text.style.fill = color;
  }

  setSymbol(initial);

  return { container, setSymbol };
}