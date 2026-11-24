import {
  type Direction,
  type DirectionChoice,
  type Question,
  noteLabel,
  noteSpoken,
} from "./theory";

export const BASS_FRETS = 16;

export const STRINGS = [
  { id: "E", open: 28, gauge: 4 },
  { id: "A", open: 33, gauge: 3 },
  { id: "D", open: 38, gauge: 2.5 },
  { id: "G", open: 43, gauge: 2 },
] as const;

// High string on top, the usual diagram orientation.
export const DIAGRAM_STRINGS = [...STRINGS].reverse();

export const FRET_NUMBERS = Array.from(
  { length: BASS_FRETS + 1 },
  (_, fret) => fret,
);

export type BassString = (typeof STRINGS)[number];
export type StringId = BassString["id"];

export interface FretPosition {
  stringId: StringId;
  fret: number;
  midi: number;
}

export function positionsFor(midi: number): FretPosition[] {
  const spots: FretPosition[] = [];
  for (const string of STRINGS) {
    const fret = midi - string.open;
    if (fret >= 0 && fret <= BASS_FRETS) {
      spots.push({ stringId: string.id, fret, midi });
    }
  }
  spots.sort((left, right) => left.fret - right.fret);
  return spots;
}

export function sameSpot(
  left: FretPosition | null,
  right: FretPosition,
): boolean {
  return (
    left !== null &&
    left.stringId === right.stringId &&
    left.fret === right.fret
  );
}

export function placeLabel(spot: FretPosition): string {
  const fret = spot.fret === 0 ? "open" : `fret ${spot.fret}`;
  return `${spot.stringId} string, ${fret}`;
}

export function fretPhrase(spot: FretPosition): string {
  return `${placeLabel(spot)} · ${noteLabel(spot.midi)}`;
}

export function canonical(midi: number): FretPosition | null {
  return positionsFor(midi)[0] ?? null;
}

export function inlayCount(fret: number): 0 | 1 | 2 {
  if (fret === 12) return 2;
  if (fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 15) {
    return 1;
  }
  return 0;
}

export function spotLive(
  spot: FretPosition,
  sounding: "root" | "other" | null,
  root: number | null,
  target: number | null,
): boolean {
  if (sounding === "root" && spot.midi === root) return true;
  if (sounding === "other" && target !== null && spot.midi === target) {
    return true;
  }
  return false;
}

export function positionRole(
  spot: FretPosition,
  board: {
    root: number | null;
    target: number | null;
    choice: number | null;
    answerAt: FretPosition | null;
  },
): "correct" | "wrong" | "root" | undefined {
  if (board.target !== null && spot.midi === board.target) return "correct";
  if (
    board.answerAt &&
    board.choice !== null &&
    board.choice !== board.target &&
    sameSpot(board.answerAt, spot)
  ) {
    return "wrong";
  }
  if (board.root !== null && spot.midi === board.root) return "root";
  return undefined;
}

export function spotAria(
  spot: FretPosition,
  role: ReturnType<typeof positionRole>,
): string {
  const where = `${noteSpoken(spot.midi)}, ${placeLabel(spot)}`;
  if (role === "correct") return `${where}, the note that played`;
  if (role === "wrong") return `${where}, your answer`;
  if (role === "root") return `${where}, the root`;
  return where;
}

export function spotAt(stringId: StringId, fret: number): FretPosition {
  const string = STRINGS.find((item) => item.id === stringId);
  if (!string) throw new Error(`Unknown string ${stringId}`);
  return { stringId, fret, midi: string.open + fret };
}

const BASS_LOW = STRINGS[0].open;
const BASS_HIGH = STRINGS[STRINGS.length - 1].open + BASS_FRETS;

export function createBassQuestion(
  intervals: readonly number[],
  directionChoice: DirectionChoice,
  random: () => number = Math.random,
  avoid: Question | null = null,
): Question | null {
  const pool = [
    ...new Set(intervals.filter((semitone) => semitone >= 1 && semitone <= 12)),
  ];
  if (pool.length === 0) return null;

  const rootLow = BASS_LOW + 12;
  const rootHigh = BASS_HIGH - 12;
  let last: Question | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const semitones = pool[Math.floor(random() * pool.length)] ?? pool[0]!;
    const direction: Direction =
      directionChoice === "either"
        ? random() < 0.5
          ? "up"
          : "down"
        : directionChoice;
    const root = rootLow + Math.floor(random() * (rootHigh - rootLow + 1));
    const target = direction === "up" ? root + semitones : root - semitones;
    const question = { root, target, semitones, direction };
    last = question;
    if (target < BASS_LOW || target > BASS_HIGH) continue;
    if (positionsFor(root).length === 0 || positionsFor(target).length === 0) {
      continue;
    }
    if (avoid && avoid.root === root && avoid.target === target) continue;
    return question;
  }
  return last;
}
