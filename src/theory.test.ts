import { describe, expect, it } from "vitest";
import {
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  createQuestion,
  noteLabel,
  noteSpoken,
  pianoKeys,
  presetFor,
  relation,
  resultText,
} from "./theory";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("note names", () => {
  it("spells scientific pitch", () => {
    expect(noteLabel(60)).toBe("C4");
    expect(noteLabel(61)).toBe("C♯4");
    expect(noteLabel(67)).toBe("G4");
    expect(noteLabel(69)).toBe("A4");
    expect(noteLabel(48)).toBe("C3");
    expect(noteLabel(72)).toBe("C5");
  });

  it("speaks sharps as words", () => {
    expect(noteSpoken(61)).toBe("C sharp 4");
    expect(noteSpoken(60)).toBe("C 4");
  });
});

describe("questions", () => {
  it("plays a fifth above C when the roll stays at the bottom of the range", () => {
    const question = createQuestion([7], "up", () => 0);
    expect(question).toEqual({
      root: 60,
      target: 67,
      semitones: 7,
      direction: "up",
    });
    expect(relation(question!)).toBe("a perfect fifth above C4");
  });

  it("plays a fifth below C", () => {
    const question = createQuestion([7], "down", () => 0);
    expect(question).toMatchObject({ root: 60, target: 53, direction: "down" });
    expect(relation(question!)).toBe("a perfect fifth below C4");
  });

  it("keeps every interval on the keyboard", () => {
    for (let semitone = 1; semitone <= 12; semitone += 1) {
      for (let roll = 0; roll < 12; roll += 1) {
        const question = createQuestion(
          [semitone],
          "either",
          sequence([0, roll / 12]),
        );
        expect(question?.target).toBeGreaterThanOrEqual(KEYBOARD_LOW);
        expect(question?.target).toBeLessThanOrEqual(KEYBOARD_HIGH);
      }
    }
  });

  it("asks for a different pair than the one just heard", () => {
    const first = createQuestion([7], "up", () => 0);
    const second = createQuestion([7], "up", sequence([0, 0.99]), first);
    expect(second?.root).toBe(71);
    expect(second?.target).not.toBe(first?.target);
  });

  it("refuses an empty drill", () => {
    expect(createQuestion([], "up")).toBeNull();
  });
});

describe("scoring copy", () => {
  const fifth = {
    root: 60,
    target: 67,
    semitones: 7,
    direction: "up" as const,
  };

  it("names a correct G", () => {
    expect(resultText(fifth, 67)).toEqual({
      correct: true,
      text: "G4, a perfect fifth above C4",
    });
  });

  it("names the miss and the note that played", () => {
    expect(resultText(fifth, 64).text).toBe(
      "You played E4. The note was G4, a perfect fifth above C4.",
    );
  });
});

describe("presets and keys", () => {
  it("recognises the built-in drills", () => {
    expect(presetFor([7, 5])).toBe("fifths");
    expect(presetFor([1, 2, 3])).toBe("custom");
  });

  it("builds three octaves with sharps between the white keys", () => {
    const keys = pianoKeys();
    expect(keys).toHaveLength(37);
    const c4 = keys.find((key) => key.midi === 60);
    const csharp = keys.find((key) => key.midi === 61);
    expect(c4).toMatchObject({ black: false, name: "C", octave: 4 });
    expect(csharp).toMatchObject({ black: true, name: "C♯", octave: 4 });
  });
});
