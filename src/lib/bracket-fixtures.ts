import { BracketMatchDef, GroupId } from "@/types/knockout";

const g = (group: GroupId, position: 1 | 2) =>
  ({ kind: "group_pos" as const, group, position });

const third = (
  eligible: GroupId[],
  annexColumn: "1A" | "1B" | "1D" | "1E" | "1G" | "1I" | "1K" | "1L"
) => ({ kind: "best_third" as const, eligible, annexColumn });

const w = (fromMatchId: number) => ({ kind: "winner" as const, fromMatchId });
const l = (fromMatchId: number) => ({ kind: "loser" as const, fromMatchId });

/** FIFA World Cup 2026 knockout bracket (matches 73–104) */
export const BRACKET_FIXTURES: BracketMatchDef[] = [
  // Round of 32 (73–88)
  { id: 73, stage: "round_32", slotA: g("A", 2), slotB: g("B", 2), startTime: "2026-06-28T18:00:00Z", bracketRound: 0, bracketIndex: 0 },
  { id: 74, stage: "round_32", slotA: g("E", 1), slotB: third(["A", "B", "C", "D", "F"], "1E"), startTime: "2026-06-29T18:00:00Z", bracketRound: 0, bracketIndex: 1 },
  { id: 75, stage: "round_32", slotA: g("F", 1), slotB: g("C", 2), startTime: "2026-06-29T21:00:00Z", bracketRound: 0, bracketIndex: 2 },
  { id: 76, stage: "round_32", slotA: g("C", 1), slotB: g("F", 2), startTime: "2026-06-29T18:00:00Z", bracketRound: 0, bracketIndex: 3 },
  { id: 77, stage: "round_32", slotA: g("I", 1), slotB: third(["C", "D", "F", "G", "H"], "1I"), startTime: "2026-06-30T18:00:00Z", bracketRound: 0, bracketIndex: 4 },
  { id: 78, stage: "round_32", slotA: g("E", 2), slotB: g("I", 2), startTime: "2026-06-30T21:00:00Z", bracketRound: 0, bracketIndex: 5 },
  { id: 79, stage: "round_32", slotA: g("A", 1), slotB: third(["C", "E", "F", "H", "I"], "1A"), startTime: "2026-06-30T21:00:00Z", bracketRound: 0, bracketIndex: 6 },
  { id: 80, stage: "round_32", slotA: g("L", 1), slotB: third(["E", "H", "I", "J", "K"], "1L"), startTime: "2026-07-01T18:00:00Z", bracketRound: 0, bracketIndex: 7 },
  { id: 81, stage: "round_32", slotA: g("D", 1), slotB: third(["B", "E", "F", "I", "J"], "1D"), startTime: "2026-07-01T21:00:00Z", bracketRound: 0, bracketIndex: 8 },
  { id: 82, stage: "round_32", slotA: g("G", 1), slotB: third(["A", "E", "H", "I", "J"], "1G"), startTime: "2026-07-01T21:00:00Z", bracketRound: 0, bracketIndex: 9 },
  { id: 83, stage: "round_32", slotA: g("K", 2), slotB: g("L", 2), startTime: "2026-07-02T18:00:00Z", bracketRound: 0, bracketIndex: 10 },
  { id: 84, stage: "round_32", slotA: g("H", 1), slotB: g("J", 2), startTime: "2026-07-02T21:00:00Z", bracketRound: 0, bracketIndex: 11 },
  { id: 85, stage: "round_32", slotA: g("B", 1), slotB: third(["E", "F", "G", "I", "J"], "1B"), startTime: "2026-07-02T21:00:00Z", bracketRound: 0, bracketIndex: 12 },
  { id: 86, stage: "round_32", slotA: g("J", 1), slotB: g("H", 2), startTime: "2026-07-03T18:00:00Z", bracketRound: 0, bracketIndex: 13 },
  { id: 87, stage: "round_32", slotA: g("K", 1), slotB: third(["D", "E", "I", "J", "L"], "1K"), startTime: "2026-07-03T21:00:00Z", bracketRound: 0, bracketIndex: 14 },
  { id: 88, stage: "round_32", slotA: g("D", 2), slotB: g("G", 2), startTime: "2026-07-03T21:00:00Z", bracketRound: 0, bracketIndex: 15 },

  // Round of 16 (89–96)
  { id: 89, stage: "round_16", slotA: w(74), slotB: w(77), startTime: "2026-07-04T18:00:00Z", bracketRound: 1, bracketIndex: 0 },
  { id: 90, stage: "round_16", slotA: w(73), slotB: w(75), startTime: "2026-07-04T21:00:00Z", bracketRound: 1, bracketIndex: 1 },
  { id: 91, stage: "round_16", slotA: w(76), slotB: w(78), startTime: "2026-07-05T18:00:00Z", bracketRound: 1, bracketIndex: 2 },
  { id: 92, stage: "round_16", slotA: w(79), slotB: w(80), startTime: "2026-07-05T21:00:00Z", bracketRound: 1, bracketIndex: 3 },
  { id: 93, stage: "round_16", slotA: w(83), slotB: w(84), startTime: "2026-07-06T18:00:00Z", bracketRound: 1, bracketIndex: 4 },
  { id: 94, stage: "round_16", slotA: w(81), slotB: w(82), startTime: "2026-07-06T21:00:00Z", bracketRound: 1, bracketIndex: 5 },
  { id: 95, stage: "round_16", slotA: w(86), slotB: w(88), startTime: "2026-07-07T18:00:00Z", bracketRound: 1, bracketIndex: 6 },
  { id: 96, stage: "round_16", slotA: w(85), slotB: w(87), startTime: "2026-07-07T21:00:00Z", bracketRound: 1, bracketIndex: 7 },

  // Quarter-finals (97–100)
  { id: 97, stage: "quarter_final", slotA: w(89), slotB: w(90), startTime: "2026-07-09T18:00:00Z", bracketRound: 2, bracketIndex: 0 },
  { id: 98, stage: "quarter_final", slotA: w(93), slotB: w(94), startTime: "2026-07-10T18:00:00Z", bracketRound: 2, bracketIndex: 1 },
  { id: 99, stage: "quarter_final", slotA: w(91), slotB: w(92), startTime: "2026-07-11T18:00:00Z", bracketRound: 2, bracketIndex: 2 },
  { id: 100, stage: "quarter_final", slotA: w(95), slotB: w(96), startTime: "2026-07-11T21:00:00Z", bracketRound: 2, bracketIndex: 3 },

  // Semi-finals (101–102)
  { id: 101, stage: "semi_final", slotA: w(97), slotB: w(98), startTime: "2026-07-14T18:00:00Z", bracketRound: 3, bracketIndex: 0 },
  { id: 102, stage: "semi_final", slotA: w(99), slotB: w(100), startTime: "2026-07-15T18:00:00Z", bracketRound: 3, bracketIndex: 1 },

  // Third place & Final
  { id: 103, stage: "third_place", slotA: l(101), slotB: l(102), startTime: "2026-07-18T18:00:00Z", bracketRound: 4, bracketIndex: 0 },
  { id: 104, stage: "final", slotA: w(101), slotB: w(102), startTime: "2026-07-19T18:00:00Z", bracketRound: 4, bracketIndex: 1 },
];

export const ANNEX_COLUMN_TO_SLOT_CODE: Record<string, string> = {
  "1E": "3X1",
  "1I": "3X2",
  "1A": "3X3",
  "1L": "3X4",
  "1D": "3X5",
  "1G": "3X6",
  "1B": "3X7",
  "1K": "3X8",
};

export const KNOCKOUT_MATCH_IDS = BRACKET_FIXTURES.map((m) => m.id);

export function getFixtureByMatchId(id: number): BracketMatchDef | undefined {
  return BRACKET_FIXTURES.find((m) => m.id === id);
}

export function getDownstreamMatchIds(fromMatchId: number): number[] {
  const result: number[] = [];
  const queue = [fromMatchId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const fixture of BRACKET_FIXTURES) {
      const refsWinner =
        (fixture.slotA.kind === "winner" && fixture.slotA.fromMatchId === current) ||
        (fixture.slotB.kind === "winner" && fixture.slotB.fromMatchId === current);
      const refsLoser =
        (fixture.slotA.kind === "loser" && fixture.slotA.fromMatchId === current) ||
        (fixture.slotB.kind === "loser" && fixture.slotB.fromMatchId === current);

      if (refsWinner || refsLoser) {
        result.push(fixture.id);
        queue.push(fixture.id);
      }
    }
  }
  return result;
}
