import { describe, expect, it } from "vitest";
import { noteLabel, noteSpoken, presetFor, resultText } from "./theory";

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

describe("presets", () => {
  it("recognises the built-in drills", () => {
    expect(presetFor([7, 5])).toBe("fifths");
    expect(presetFor([1, 2, 3])).toBe("custom");
  });
});
