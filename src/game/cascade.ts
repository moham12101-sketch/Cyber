import type { SymbolCode } from './game';

export function performCascade(grid: SymbolCode[][]): SymbolCode[][] {
  const rows = grid.length, cols = grid[0].length;
  const toRemove: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  // Mark cells belonging to any cluster-like removal where value is undefined (we expect caller removed via alpha)
  // For simplicity, treat any cell with placeholder '_' as removed; if none, randomly remove none.
  // Here we'll remove cells set to '*' by caller; but our caller passes positions directly and handles visuals only.
  // Implement removal by identifying gaps where alpha==0 is not available; so we simulate removal by removing lowest win-like group: none. Instead, we rebuild using filtered columns.

  // Actual cascade: collapse each column removing cells that were part of last glow (tracked externally). Since we don't have that, rebuild by dropping a random symbol when encountering empty marker.

  const newGrid: SymbolCode[][] = Array.from({ length: rows }, () => Array(cols).fill('A' as SymbolCode));

  for (let c = 0; c < cols; c++) {
    const column: SymbolCode[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const val = grid[r][c];
      // We treat value 'X' as removed marker if present; otherwise keep
      if (val !== 'X') column.push(val);
    }
    while (column.length < rows) column.push(randomSymbol());
    for (let r = rows - 1, i = 0; r >= 0; r--, i++) newGrid[r][c] = column[i];
  }

  return newGrid;
}

export function removePositions(grid: SymbolCode[][], positions: { r: number; c: number }[]): SymbolCode[][] {
  const copy = grid.map(row => row.slice());
  for (const { r, c } of positions) copy[r][c] = 'X' as SymbolCode;
  return copy;
}

function randomSymbol(): SymbolCode {
  const base: SymbolCode[] = ['A','B','C','D','W'];
  return base[Math.floor(Math.random()*base.length)];
}