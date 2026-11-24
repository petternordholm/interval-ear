import { PRESETS, type DirectionChoice } from "./theory";

export interface Settings {
  intervals: number[];
  direction: DirectionChoice;
  gap: number;
  volume: number;
}

export interface Stats {
  heard: number;
  correct: number;
  streak: number;
  best: number;
}

const SETTINGS_KEY = "interval-ear.settings";
const STATS_KEY = "interval-ear.stats";

export function defaultSettings(): Settings {
  return {
    intervals: [...PRESETS.fifths],
    direction: "up",
    gap: 0.7,
    volume: 0.8,
  };
}

export function emptyStats(): Stats {
  return { heard: 0, correct: 0, streak: 0, best: 0 };
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode can refuse storage. The session still works.
  }
}

export function loadSettings(): Settings {
  const fallback = defaultSettings();
  const raw = read(SETTINGS_KEY);
  if (!raw || typeof raw !== "object") return fallback;
  const record = raw as Partial<Settings>;
  const intervals = Array.isArray(record.intervals)
    ? [
        ...new Set(
          record.intervals.filter(
            (value) => typeof value === "number" && value >= 1 && value <= 12,
          ),
        ),
      ].sort((a, b) => a - b)
    : [];
  const direction =
    record.direction === "up" ||
    record.direction === "down" ||
    record.direction === "either"
      ? record.direction
      : fallback.direction;
  const gap =
    typeof record.gap === "number"
      ? Math.min(1.5, Math.max(0.2, record.gap))
      : fallback.gap;
  const volume =
    typeof record.volume === "number"
      ? Math.min(1, Math.max(0, record.volume))
      : fallback.volume;
  return {
    intervals: intervals.length > 0 ? intervals : fallback.intervals,
    direction,
    gap,
    volume,
  };
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings);
}

export function loadStats(): Stats {
  const raw = read(STATS_KEY);
  if (!raw || typeof raw !== "object") return emptyStats();
  const record = raw as Partial<Stats>;
  const number = (value: unknown) =>
    typeof value === "number" && value >= 0 ? value : 0;
  return {
    heard: number(record.heard),
    correct: number(record.correct),
    streak: number(record.streak),
    best: number(record.best),
  };
}

export function saveStats(stats: Stats): void {
  write(STATS_KEY, stats);
}
