import type { SymbolCode } from './game';

type Cell = SymbolCode | 'X';

export function performCascade(grid: Cell[][]): SymbolCode[][] {
  const rows = grid.length, cols = grid[0].length;
  const newGrid: SymbolCode[][] = Array.from({ length: rows }, () => Array(cols).fill('A' as SymbolCode));

  for (let c = 0; c < cols; c++) {
    const column: SymbolCode[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const val = grid[r][c];
      if (val !== 'X') column.push(val as SymbolCode);
    }
    while (column.length < rows) column.push(randomSymbol());
    for (let r = rows - 1, i = 0; r >= 0; r--, i++) newGrid[r][c] = column[i];
  }

  return newGrid;
}

export function removePositions(grid: SymbolCode[][], positions: { r: number; c: number }[]): Cell[][] {
  const copy: Cell[][] = grid.map(row => row.slice()) as Cell[][];
  for (const { r, c } of positions) copy[r][c] = 'X';
  return copy;
}

function randomSymbol(): SymbolCode {
  const base: SymbolCode[] = ['A','B','C','D','W'];
  return base[Math.floor(Math.random()*base.length)];
}