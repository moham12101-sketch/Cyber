import { Container, Graphics } from 'pixi.js';

export type CharacterController = {
  reactSpin: () => void;
  reactWin: () => void;
  setCyber: (on: boolean) => void;
};

export function createCharacter(layer: Container): CharacterController {
  const holo = new Graphics();
  holo.roundRect(30, 520, 210, 160, 16)
    .fill({ color: 0x06121a, alpha: 0.6 })
    .stroke({ width: 2, color: 0x00ffff, alpha: 0.8 });
  layer.addChild(holo);

  function pulse(color: number) {
    const start = performance.now();
    const d = 380;
    const tick = () => {
      const t = (performance.now() - start) / d;
      const a = 0.6 + Math.sin(t * Math.PI) * 0.3;
      holo.clear().roundRect(30, 520, 210, 160, 16)
        .fill({ color: 0x06121a, alpha: a })
        .stroke({ width: 3, color, alpha: 0.9 });
      if (t < 1) requestAnimationFrame(tick);
      else holo.clear().roundRect(30, 520, 210, 160, 16)
        .fill({ color: 0x06121a, alpha: 0.6 })
        .stroke({ width: 2, color: 0x00ffff, alpha: 0.8 });
    };
    tick();
  }

  return {
    reactSpin() { pulse(0x00ffff); },
    reactWin() { pulse(0x00ff66); },
    setCyber(on: boolean) {
      holo.clear().roundRect(30, 520, 210, 160, 16)
        .fill({ color: on ? 0x081e28 : 0x06121a, alpha: 0.6 })
        .stroke({ width: 2, color: on ? 0xff00ff : 0x00ffff, alpha: 0.9 });
    }
  };
}