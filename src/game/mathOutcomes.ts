import type { SymbolCode } from './game';

export type PayTable = Record<string, Record<number, number>>;
export type MathOutcome = {
  id: string;
  probability: number; // exact probability weight
  initialGrid: SymbolCode[][];
  multiplier: number;
  cascadeMultiplierBase: number; // e.g., 1x then +1 per cascade
  freeSpinsTriggerCount: number; // min scatters
  freeSpinsAward: number;
  triggers: { pickBonus: boolean };
  payTable: PayTable;
  mode: 'BASE' | 'FREE';
};

let cached: MathOutcome[] | null = null;

export async function loadOutcomes(): Promise<MathOutcome[]> {
  if (cached) return cached;
  try {
    const res = await fetch('/outcomes/outcomes.json');
    const data = await res.json();
    cached = data.outcomes as MathOutcome[];
    return cached;
  } catch {
    // Fallback: generate simple uniform outcomes
    const simple: MathOutcome = {
      id: 'fallback-1', probability: 1, mode: 'BASE',
      initialGrid: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => randomSymbol())),
      multiplier: 1,
      cascadeMultiplierBase: 1,
      freeSpinsTriggerCount: 3,
      freeSpinsAward: 8,
      triggers: { pickBonus: false },
      payTable: defaultPayTable(),
    };
    cached = [simple];
    return cached;
  }
}

export function pickOutcome(outcomes: MathOutcome[], inFree: boolean): MathOutcome {
  const pool = outcomes.length ? outcomes.filter(o => o.mode === (inFree ? 'FREE' : 'BASE')) : [];
  const src = pool.length ? pool : outcomes;
  const total = src.reduce((a, o) => a + o.probability, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const o of src) { acc += o.probability; if (r <= acc) return o; }
  return src[src.length - 1];
}

function randomSymbol(): SymbolCode { const base: SymbolCode[] = ['A','B','C','D','W','S']; return base[Math.floor(Math.random()*base.length)]; }

function defaultPayTable() {
  return {
    'A': { 4: 2, 5: 4, 6: 6, 7: 10, 8: 15, 9: 20, 10: 30, 11: 45, 12: 60, 13: 80, 14: 100, 15: 140, 16: 190, 17: 250, 18: 320, 19: 400, 20: 500, 21: 650, 22: 800, 23: 1000, 24: 1200, 25: 1500 },
    'B': { 4: 2, 5: 4, 6: 6, 7: 10, 8: 15, 9: 20, 10: 30, 11: 45, 12: 60, 13: 80, 14: 100, 15: 140, 16: 190, 17: 250, 18: 320, 19: 400, 20: 500, 21: 650, 22: 800, 23: 1000, 24: 1200, 25: 1500 },
    'C': { 4: 3, 5: 5, 6: 8, 7: 12, 8: 18, 9: 24, 10: 36, 11: 50, 12: 70, 13: 90, 14: 120, 15: 160, 16: 220, 17: 280, 18: 360, 19: 460, 20: 580, 21: 720, 22: 880, 23: 1060, 24: 1280, 25: 1600 },
    'D': { 4: 4, 5: 6, 6: 9, 7: 14, 8: 20, 9: 28, 10: 40, 11: 60, 12: 80, 13: 100, 14: 140, 15: 180, 16: 240, 17: 320, 18: 420, 19: 540, 20: 700, 21: 860, 22: 1040, 23: 1260, 24: 1500, 25: 1800 },
    'W': { 4: 0, 5: 0 },
    'S': { 4: 0, 5: 0 }
  };
}