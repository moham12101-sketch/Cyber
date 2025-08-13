#!/usr/bin/env python3
import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple
import numpy as np
import pandas as pd
import os

np.random.seed(42)

SYMBOLS = ['A','B','C','D','W','S']
BASE_SYMBOLS = ['A','B','C','D','W','S']

ROWS = 5
COLS = 5

@dataclass
class Outcome:
    id: str
    probability: float
    mode: str  # BASE or FREE
    initialGrid: List[List[str]]
    multiplier: int
    cascadeMultiplierBase: int
    freeSpinsTriggerCount: int
    freeSpinsAward: int
    triggers: Dict[str, bool]
    payTable: Dict[str, Dict[int, int]]

# Define a simple cluster paytable where value grows with cluster size
# Values are in base-bet units. We'll target an average return ~0.96 with weights.
DEFAULT_PAYTABLE: Dict[str, Dict[int, int]] = {
    'A': {s: int(2 + (s-4)*1.2) for s in range(4, 26)},
    'B': {s: int(2 + (s-4)*1.2) for s in range(4, 26)},
    'C': {s: int(3 + (s-4)*1.5) for s in range(4, 26)},
    'D': {s: int(4 + (s-4)*1.7) for s in range(4, 26)},
    'W': {s: 0 for s in range(4, 26)},
    'S': {s: 0 for s in range(4, 26)},
}

# Helper to build a random but controlled grid with a desired number of scatters

def build_grid(scatter_count: int, mode: str) -> List[List[str]]:
    grid = np.random.choice(['A','B','C','D','W'], size=(ROWS, COLS), p=[0.26,0.26,0.22,0.20,0.06]).astype(object)
    if scatter_count > 0:
        positions = [(r,c) for r in range(ROWS) for c in range(COLS)]
        np.random.shuffle(positions)
        for (r,c) in positions[:scatter_count]:
            grid[r,c] = 'S'
    return grid.tolist()

# Define outcome buckets with target probabilities and returns
# We'll create a mixture of no-win, small-win, medium-win, big-win, free spins, pick bonus

BUCKETS = [
    ('BASE_NOWIN', 0.45, 0.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('BASE_SMALL', 0.33, 0.6, {'scatter': 0, 'pick': False, 'free': 0}),
    ('BASE_MED', 0.15, 1.2, {'scatter': 0, 'pick': False, 'free': 0}),
    ('BASE_BIG', 0.04, 6.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('BASE_PICK', 0.02, 1.5, {'scatter': 0, 'pick': True, 'free': 0}),
    ('BASE_FREE', 0.01, 12.0, {'scatter': 3, 'pick': False, 'free': 8}),
]

BUCKETS_FREE = [
    ('FREE_NOWIN', 0.40, 0.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('FREE_SMALL', 0.35, 1.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('FREE_MED', 0.20, 3.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('FREE_BIG', 0.04, 10.0, {'scatter': 0, 'pick': False, 'free': 0}),
    ('FREE_RETRIG', 0.01, 6.0, {'scatter': 3, 'pick': False, 'free': 5}),
]

# The return multipliers above represent total win expectation per bucket in base-bet units including cascades and multipliers.
# We'll sample concrete outcomes within each bucket.

N_PER_BUCKET = 40


def create_outcomes_for(buckets, mode: str) -> List[Outcome]:
    outcomes: List[Outcome] = []
    for name, prob, expected_return, flags in buckets:
        # Divide probability across N samples uniformly
        p_each = prob / N_PER_BUCKET
        for i in range(N_PER_BUCKET):
            scatter_count = flags['scatter']
            grid = build_grid(scatter_count, mode)
            outcome = Outcome(
                id=f"{name}-{i}",
                probability=p_each,
                mode=mode,
                initialGrid=grid,
                multiplier= 2 if mode == 'FREE' else 1,
                cascadeMultiplierBase= 1 if mode == 'BASE' else 2,
                freeSpinsTriggerCount=3,
                freeSpinsAward= int(flags['free']) if flags['free'] else 0,
                triggers={ 'pickBonus': bool(flags['pick']) },
                payTable=DEFAULT_PAYTABLE,
            )
            outcomes.append(outcome)
    return outcomes


def main():
    base_outcomes = create_outcomes_for(BUCKETS, 'BASE')
    free_outcomes = create_outcomes_for(BUCKETS_FREE, 'FREE')
    outcomes = base_outcomes + free_outcomes

    # Normalize probabilities to sum to 1.0
    total_p = sum(o.probability for o in outcomes)
    for o in outcomes:
        o.probability = o.probability / total_p

    data = { 'outcomes': [ asdict(o) for o in outcomes ] }

    out_dir = os.path.join(os.getcwd(), 'public', 'outcomes')
    os.makedirs(out_dir, exist_ok=True)

    json_path = os.path.join(out_dir, 'outcomes.json')
    with open(json_path, 'w') as f:
        json.dump(data, f)

    # CSV summary
    rows: List[Tuple] = []
    for o in outcomes:
        rows.append((o.id, o.mode, o.probability, o.multiplier, o.cascadeMultiplierBase, o.freeSpinsAward, o.triggers['pickBonus']))
    df = pd.DataFrame(rows, columns=['id','mode','probability','multiplier','cascadeBase','freeSpinsAward','pickBonus'])
    csv_path = os.path.join(out_dir, 'outcomes_summary.csv')
    df.to_csv(csv_path, index=False)

    # Quick RTP check: approximate using expected return multipliers per bucket weights
    # Here we don't compute exact RTP; but probabilities and returns can be tuned to 0.96 target externally.
    print(f"Exported {len(outcomes)} outcomes to {json_path} and CSV summary to {csv_path}")

if __name__ == '__main__':
    main()