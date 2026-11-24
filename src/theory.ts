export const KEYBOARD_LOW = 48;
export const KEYBOARD_HIGH = 84;
export const ROOT_LOW = 60;
export const ROOT_HIGH = 71;

const NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;
const BLACK = new Set([1, 3, 6, 8, 10]);

export interface Interval {
  semitones: number;
  short: string;
  name: string;
}

export const INTERVALS: readonly Interval[] = [
  { semitones: 1, short: "m2", name: "minor second" },
  { semitones: 2, short: "M2", name: "major second" },
  { semitones: 3, short: "m3", name: "minor third" },
  { semitones: 4, short: "M3", name: "major third" },
  { semitones: 5, short: "P4", name: "perfect fourth" },
  { semitones: 6, short: "TT", name: "tritone" },
  { semitones: 7, short: "P5", name: "perfect fifth" },
  { semitones: 8, short: "m6", name: "minor sixth" },
  { semitones: 9, short: "M6", name: "major sixth" },
  { semitones: 10, short: "m7", name: "minor seventh" },
  { semitones: 11, short: "M7", name: "major seventh" },
  { semitones: 12, short: "P8", name: "perfect octave" },
];

export const PRESETS = {
  fifths: [5, 7],
  easy: [3, 4, 5, 7, 12],
  steps: [1, 2],
  wide: [8, 9, 10, 11, 12],
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
} as const;

export type PresetId = keyof typeof PRESETS | "custom";
export type Direction = "up" | "down";
export type DirectionChoice = Direction | "either";

export interface Question {
  root: number;
  target: number;
  semitones: number;
  direction: Direction;
}

export interface PianoKey {
  midi: number;
  name: string;
  octave: number;
  black: boolean;
  style: { left: string; width: string };
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function noteName(midi: number): string {
  return NAMES[pitchClass(midi)] ?? "C";
}

export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function noteLabel(midi: number): string {
  return `${noteName(midi)}${octaveOf(midi)}`;
}

export function noteSpoken(midi: number): string {
  return `${noteName(midi).replace("♯", " sharp")} ${octaveOf(midi)}`;
}

export function intervalBySemitones(semitones: number): Interval | undefined {
  return INTERVALS.find((interval) => interval.semitones === semitones);
}

export function sameSet(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.every((value, index) => value === b[index]);
}

export function presetFor(intervals: readonly number[]): PresetId {
  for (const [id, set] of Object.entries(PRESETS) as [
    keyof typeof PRESETS,
    readonly number[],
  ][]) {
    if (sameSet(intervals, set)) return id;
  }
  return "custom";
}

export function presetTitle(id: PresetId): string {
  switch (id) {
    case "fifths":
      return "Fourths and fifths";
    case "easy":
      return "Easy intervals";
    case "steps":
      return "Seconds";
    case "wide":
      return "Sixths through the octave";
    case "all":
      return "All intervals";
    case "custom":
      return "Custom intervals";
  }
}

export function describeIntervals(semitones: readonly number[]): string {
  return [...semitones]
    .sort((a, b) => a - b)
    .map(
      (semitone) =>
        intervalBySemitones(semitone)?.name ?? `${semitone} semitones`,
    )
    .join(", ");
}

export function relation(question: Question): string {
  const name = intervalBySemitones(question.semitones)?.name ?? "interval";
  const way = question.direction === "up" ? "above" : "below";
  return `a ${name} ${way} ${noteLabel(question.root)}`;
}

export function createQuestion(
  intervals: readonly number[],
  directionChoice: DirectionChoice,
  random: () => number = Math.random,
  avoid: Question | null = null,
): Question | null {
  const pool = [
    ...new Set(intervals.filter((semitone) => semitone >= 1 && semitone <= 12)),
  ];
  if (pool.length === 0) return null;

  let last: Question | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const semitones = pool[Math.floor(random() * pool.length)] ?? pool[0]!;
    const direction: Direction =
      directionChoice === "either"
        ? random() < 0.5
          ? "up"
          : "down"
        : directionChoice;
    const root = ROOT_LOW + Math.floor(random() * (ROOT_HIGH - ROOT_LOW + 1));
    const target = direction === "up" ? root + semitones : root - semitones;
    const question = { root, target, semitones, direction };
    last = question;
    if (target < KEYBOARD_LOW || target > KEYBOARD_HIGH) continue;
    if (avoid && avoid.root === root && avoid.target === target) continue;
    return question;
  }
  return last;
}

export function pianoKeys(
  low = KEYBOARD_LOW,
  high = KEYBOARD_HIGH,
): PianoKey[] {
  const midis: number[] = [];
  for (let midi = low; midi <= high; midi += 1) midis.push(midi);
  const whites = midis.filter((midi) => !BLACK.has(pitchClass(midi)));
  const whiteCount = whites.length;

  return midis.map((midi) => {
    const black = BLACK.has(pitchClass(midi));
    const whitesBefore = whites.filter((white) => white < midi).length;
    return {
      midi,
      name: noteName(midi),
      octave: octaveOf(midi),
      black,
      style: black
        ? {
            left: `${(whitesBefore / whiteCount) * 100}%`,
            width: `${(0.58 / whiteCount) * 100}%`,
          }
        : {
            left: `${(whitesBefore / whiteCount) * 100}%`,
            width: `${(1 / whiteCount) * 100}%`,
          },
    };
  });
}

export function resultText(
  question: Question,
  choice: number,
): { correct: boolean; text: string } {
  const answer = `${noteLabel(question.target)}, ${relation(question)}`;
  if (choice === question.target) return { correct: true, text: answer };
  return {
    correct: false,
    text: `You played ${noteLabel(choice)}. The note was ${answer}.`,
  };
}
