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
