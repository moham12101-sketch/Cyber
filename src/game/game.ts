import { Application, Container, Graphics, Text } from 'pixi.js';
import { loadOutcomes, pickOutcome, type MathOutcome } from './mathOutcomes';
import { findClusters } from './cluster';
import { performCascade, removePositions } from './cascade';
import { createSymbol } from './symbol';
import type { BackgroundController } from '@/scene/background';
import type { CharacterController } from '@/scene/character';
import { sfxSpinStart, sfxSpinStop, sfxWin, sfxBonus, startMusic } from '@/audio/audio';

export type GameApi = {
  spin: () => void;
  toggleAuto: () => void;
  cycleBet: () => void;
};

const COLS = 5;
const ROWS = 5;
const CELL = 110;
const GRID_OFFSET_X = 120;
const GRID_OFFSET_Y = 80;

const BASE_SYMBOLS = ['A','B','C','D','W','S'] as const; // W wild, S scatter
export type SymbolCode = typeof BASE_SYMBOLS[number];

type Controllers = { bg: BackgroundController; character: CharacterController };

export function createGame(app: Application, layer: Container, controllers?: Controllers): GameApi {
  const gridContainer = new Container();
  layer.addChild(gridContainer);

  const frame = new Graphics();
  frame.roundRect(GRID_OFFSET_X - 12, GRID_OFFSET_Y - 12, COLS * CELL + 24, ROWS * CELL + 24, 16)
    .stroke({ width: 3, color: 0x00ffff, alpha: 0.7 });
  layer.addChild(frame);

  const state = {
    outcomes: [] as MathOutcome[],
    grid: createEmptyGrid(),
    spinning: false,
    auto: false,
    betIndex: 0,
    balance: 10000,
    freeSpins: 0,
    inFree: false,
  };

  // Visual symbols
  const symbolViews: ReturnType<typeof createSymbol>[][] = [];
  for (let r = 0; r < ROWS; r++) {
    symbolViews[r] = [];
    for (let c = 0; c < COLS; c++) {
      const view = createSymbol('A');
      view.container.x = GRID_OFFSET_X + c * CELL + CELL/2;
      view.container.y = GRID_OFFSET_Y + r * CELL + CELL/2;
      view.container.alpha = 0.0;
      gridContainer.addChild(view.container);
      symbolViews[r][c] = view;
    }
  }

  loadOutcomes().then((o) => { state.outcomes = o; });

  function renderGridImmediate() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const s = state.grid[r][c];
        const view = symbolViews[r][c];
        view.setSymbol(s);
        view.container.alpha = 1.0;
      }
    }
  }

  function animateGridFromTop(duration = 600) {
    const start = performance.now();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const view = symbolViews[r][c];
        const startY = view.container.y - 320 - Math.random()*60;
        const endY = view.container.y;
        const delay = (c * 60) + (r * 20);
        view.container.y = startY;
        view.container.alpha = 0;
        const tick = () => {
          const t = Math.min(1, (performance.now() - start - delay) / duration);
          if (t <= 0) { requestAnimationFrame(tick); return; }
          const ease = 1 - Math.pow(1 - t, 3);
          view.container.y = startY + (endY - startY) * ease;
          view.container.alpha = t;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  }

  function applyOutcome(outcome: MathOutcome) {
    state.grid = outcome.initialGrid as SymbolCode[][];

    // Expanding wilds in free mode: expand any wild to a plus shape
    if (state.inFree) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (state.grid[r][c] === 'W') {
            if (r>0) state.grid[r-1][c] = 'W';
            if (r<ROWS-1) state.grid[r+1][c] = 'W';
            if (c>0) state.grid[r][c-1] = 'W';
            if (c<COLS-1) state.grid[r][c+1] = 'W';
          }
        }
      }
    }

    renderGridImmediate();
    animateGridFromTop();

    // Check scatters for free spins
    const scatterCount = countSymbol(state.grid, 'S');
    if (scatterCount >= outcome.freeSpinsTriggerCount) {
      state.freeSpins += outcome.freeSpinsAward;
      state.inFree = true;
      controllers?.bg.setCyberMode(true);
      controllers?.character.setCyber(true);
      sfxBonus();
      startMusic(true);
    }
  }

  async function spin() {
    if (state.spinning) return;
    state.spinning = true;
    controllers?.character.reactSpin();
    sfxSpinStart();

    const outcome = pickOutcome(state.outcomes, state.inFree);
    applyOutcome(outcome);

    await processWinsAndCascades(outcome);

    sfxSpinStop();
    state.spinning = false;

    if (state.inFree) {
      state.freeSpins--;
      if (state.freeSpins <= 0) {
        state.inFree = false;
        controllers?.bg.setCyberMode(false);
        controllers?.character.setCyber(false);
        startMusic(false);
      }
      if (state.auto || state.inFree) spin();
    } else if (state.auto) {
      setTimeout(spin, 400);
    }
  }

  async function processWinsAndCascades(outcome: MathOutcome) {
    let grid = state.grid;
    let totalWin = 0;
    let cascadeIndex = 0;

    while (true) {
      const clusters = findClusters(grid);
      if (clusters.length === 0) break;

      const win = clusters.reduce((acc, cluster) => acc + (outcome.payTable[cluster.symbol]?.[cluster.size] ?? 0), 0);
      const applied = cascadeIndex === 0 ? outcome.multiplier : outcome.cascadeMultiplierBase + cascadeIndex;
      totalWin += win * applied;

      const remove = clusterToPositions(clusters);
      await glitchOut(remove, symbolViews);
      grid = removePositions(grid, remove);
      grid = performCascade(grid);
      state.grid = grid;
      renderGridImmediate();
      animateGridFromTop(400);
      cascadeIndex++;
      await wait(500);
    }

    if (outcome.triggers.pickBonus) {
      await showPickBonus(layer);
    }

    if (totalWin > 0) {
      controllers?.character.reactWin();
      sfxWin();
      flashWinBanner(layer, totalWin);
    }
  }

  function toggleAuto() { state.auto = !state.auto; }
  function cycleBet() { state.betIndex = (state.betIndex + 1) % 5; }

  return { spin, toggleAuto, cycleBet };
}

function createEmptyGrid(): any[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 'A'));
}

function countSymbol(grid: string[][], symbol: string): number {
  let n = 0; for (const row of grid) for (const s of row) if (s === symbol) n++; return n;
}

async function glitchOut(positions: { r: number; c: number; }[], views: ReturnType<typeof createSymbol>[][]) {
  const tasks = positions.map(({ r, c }) => new Promise<void>((resolve) => {
    const v = views[r][c].container;
    const startX = v.x, startY = v.y;
    const start = performance.now();
    const d = 200 + Math.random()*150;
    const tick = () => {
      const t = (performance.now() - start) / d;
      v.alpha = 1 - t;
      v.x = startX + (Math.random()-0.5)*8;
      v.y = startY + (Math.random()-0.5)*8;
      if (t < 1) requestAnimationFrame(tick); else { v.alpha = 0; v.x = startX; v.y = startY; resolve(); }
    };
    tick();
  }));
  await Promise.all(tasks);
}

function clusterToPositions(clusters: { positions: { r: number; c: number; }[] }[]): { r: number; c: number; }[] {
  return clusters.flatMap(c => c.positions);
}

function wait(ms: number) { return new Promise<void>(res => setTimeout(res, ms)); }

async function showPickBonus(layer: Container) {
  const panel = new Graphics();
  const w = 760, h = 420;
  panel.roundRect(260, 150, w, h, 18).fill({ color: 0x000000, alpha: 0.85 }).stroke({ width: 3, color: 0x00ffff, alpha: 0.8 });
  layer.addChild(panel);

  const title = new Text('PICK & CLICK', { fontFamily: 'Orbitron', fontSize: 28, fill: 0x00ffff });
  title.x = 260 + w/2; title.y = 160; title.anchor.set(0.5, 0);
  layer.addChild(title);

  const picks: Graphics[] = [];
  const gridCols = 4, gridRows = 3, cell = 160;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const tile = new Graphics();
      const x = 260 + 40 + c * cell;
      const y = 210 + 20 + r * cell;
      tile.roundRect(x, y, 120, 120, 12).fill({ color: 0x06121a, alpha: 1 }).stroke({ width: 2, color: 0x00ffff, alpha: 0.8 });
      tile.eventMode = 'static';
      tile.cursor = 'pointer';
      tile.on('pointerdown', () => {
        tile.clear().roundRect(x, y, 120, 120, 12).fill({ color: 0x0a2a38 }).stroke({ width: 2, color: 0x00ffff });
      });
      layer.addChild(tile);
      picks.push(tile);
    }
  }

  await wait(1800);
  layer.removeChild(panel);
  layer.removeChild(title);
  for (const p of picks) layer.removeChild(p);
}

function flashWinBanner(layer: Container, amount: number) {
  const t = new Text(`WIN ${amount}`, { fontFamily: 'Orbitron', fontSize: 36, fill: 0x00ffcc });
  t.anchor.set(0.5);
  t.x = 640; t.y = 60; t.alpha = 0;
  layer.addChild(t);
  const start = performance.now();
  const tick = () => {
    const dt = (performance.now() - start) / 1200;
    t.alpha = Math.min(1, dt*2);
    t.scale.set(1 + Math.sin(performance.now()/120) * 0.05 + 0.1);
    if (dt < 1.2) requestAnimationFrame(tick); else layer.removeChild(t);
  };
  tick();
}