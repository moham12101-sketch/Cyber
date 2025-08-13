import type { SymbolCode } from './game';

export type Cluster = { symbol: SymbolCode; positions: { r: number; c: number }[]; size: number };

export function findClusters(grid: SymbolCode[][]): Cluster[] {
  const rows = grid.length; const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const clusters: Cluster[] = [];

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c]) continue;
      const base = grid[r][c];
      if (base === 'S') { visited[r][c] = true; continue; }
      const queue = [{ r, c }];
      const cells: { r: number; c: number }[] = [];
      visited[r][c] = true;
      while (queue.length) {
        const cur = queue.shift()!;
        cells.push(cur);
        for (const [dr, dc] of dirs) {
          const nr = cur.r + dr, nc = cur.c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (visited[nr][nc]) continue;
          const sym = grid[nr][nc];
          if (sym === base || sym === 'W' || base === 'W') {
            visited[nr][nc] = true;
            queue.push({ r: nr, c: nc });
          }
        }
      }
      if (cells.length >= 4) {
        const symbol: SymbolCode = base === 'W' ? dominantSymbol(grid, cells) ?? 'W' : base;
        clusters.push({ symbol, positions: cells, size: cells.length });
      }
    }
  }

  return clusters;
}

function dominantSymbol(grid: SymbolCode[][], cells: { r: number; c: number }[]): SymbolCode | null {
  const count = new Map<SymbolCode, number>();
  for (const { r, c } of cells) {
    const s = grid[r][c];
    if (s === 'W' || s === 'S') continue;
    count.set(s, (count.get(s) ?? 0) + 1);
  }
  let best: SymbolCode | null = null; let bestN = 0;
  for (const [k, v] of count.entries()) {
    if (v > bestN) { bestN = v; best = k; }
  }
  return best;
}