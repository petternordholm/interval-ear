import { describe, expect, it } from "vitest";
import {
  DIAGRAM_STRINGS,
  FRET_NUMBERS,
  createBassQuestion,
  positionRole,
  positionsFor,
  spotAria,
  spotAt,
  spotLive,
} from "./bass";
import { relation, resultText } from "./theory";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("neck positions", () => {
  it("lists every fret of E2", () => {
    expect(positionsFor(40)).toEqual([
      { stringId: "D", fret: 2, midi: 40 },
      { stringId: "A", fret: 7, midi: 40 },
      { stringId: "E", fret: 12, midi: 40 },
    ]);
  });

  it("puts G on top and numbers frets from the nut to 16", () => {
    expect(DIAGRAM_STRINGS.map((string) => string.id)).toEqual([
      "G",
      "D",
      "A",
      "E",
    ]);
    expect(FRET_NUMBERS).toHaveLength(17);
    expect(FRET_NUMBERS[0]).toBe(0);
    expect(FRET_NUMBERS.at(-1)).toBe(16);
  });
});

describe("bass questions", () => {
  it("plays a fifth above E2 when the root sits at the bottom of the neck", () => {
    const question = createBassQuestion([7], "up", () => 0);
    expect(question).toEqual({
      root: 40,
      target: 47,
      semitones: 7,
      direction: "up",
    });
    expect(relation(question!)).toBe("a perfect fifth above E2");
    expect(positionsFor(question!.target)).not.toEqual([]);
  });

  it("plays a fifth below E2", () => {
    const question = createBassQuestion([7], "down", () => 0);
    expect(question).toMatchObject({
      root: 40,
      target: 33,
      direction: "down",
    });
    expect(relation(question!)).toBe("a perfect fifth below E2");
  });

  it("keeps every interval on the neck", () => {
    for (let semitone = 1; semitone <= 12; semitone += 1) {
      for (let rootRoll = 0; rootRoll < 8; rootRoll += 1) {
        for (const direction of ["up", "down"] as const) {
          const question = createBassQuestion(
            [semitone],
            direction,
            sequence([0, rootRoll / 8]),
          );
          expect(positionsFor(question!.root)).not.toEqual([]);
          expect(positionsFor(question!.target)).not.toEqual([]);
        }
      }
    }
  });

  it("asks for a different pair than the one just heard", () => {
    const first = createBassQuestion([7], "up", () => 0);
    const second = createBassQuestion(
      [7],
      "up",
      sequence([0, 0, 0, 0.99]),
      first,
    );
    expect(second?.root).toBe(47);
    expect(second?.target).not.toBe(first?.target);
  });

  it("refuses an empty drill", () => {
    expect(createBassQuestion([], "up")).toBeNull();
  });
});

describe("scoring a fret", () => {
  const fifth = {
    root: 40,
    target: 47,
    semitones: 7,
    direction: "up" as const,
  };

  it("counts every fingering of B2 as the heard tone", () => {
    expect(resultText(fifth, spotAt("G", 4).midi)).toEqual({
      correct: true,
      text: "B2, a perfect fifth above E2",
    });
    expect(resultText(fifth, spotAt("D", 9).midi).correct).toBe(true);
    expect(resultText(fifth, spotAt("A", 14).midi).correct).toBe(true);
  });

  it("counts a different pitch as a miss", () => {
    expect(resultText(fifth, spotAt("E", 0).midi)).toEqual({
      correct: false,
      text: "You played E1. The note was B2, a perfect fifth above E2.",
    });
  });
});

describe("marks on the neck", () => {
  it("marks the root before the answer", () => {
    const board = { root: 40, target: null, choice: null, answerAt: null };
    expect(positionRole(spotAt("D", 2), board)).toBe("root");
    expect(positionRole(spotAt("A", 7), board)).toBe("root");
    expect(positionRole(spotAt("G", 4), board)).toBeUndefined();
  });

  it("marks every fret of the note that played, and only the fret that missed", () => {
    const board = {
      root: 40,
      target: 47,
      choice: 45,
      answerAt: spotAt("G", 2),
    };
    expect(positionRole(spotAt("G", 4), board)).toBe("correct");
    expect(positionRole(spotAt("D", 9), board)).toBe("correct");
    expect(positionRole(spotAt("A", 14), board)).toBe("correct");
    expect(positionRole(spotAt("G", 2), board)).toBe("wrong");
    expect(positionRole(spotAt("D", 7), board)).toBeUndefined();
    expect(positionRole(spotAt("D", 2), board)).toBe("root");
    expect(spotAria(spotAt("G", 4), "correct")).toBe(
      "B 2, G string, fret 4, the note that played",
    );
    expect(spotAria(spotAt("G", 2), "wrong")).toBe(
      "A 2, G string, fret 2, your answer",
    );
  });

  it("lights every fret of the pitch that is sounding", () => {
    expect(spotLive(spotAt("D", 2), "root", 40, 47)).toBe(true);
    expect(spotLive(spotAt("E", 12), "root", 40, 47)).toBe(true);
    expect(spotLive(spotAt("G", 4), "root", 40, 47)).toBe(false);
    expect(spotLive(spotAt("A", 14), "other", 40, 47)).toBe(true);
    expect(spotLive(spotAt("G", 0), "other", 40, 47)).toBe(false);
  });
});
