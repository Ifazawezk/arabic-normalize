import { describe, expect, it } from "vitest";
import { findAll, highlight, includes } from "./search.js";

describe("search", () => {
  const text = "ذهبتُ إلى المَدْرَسَة، ثم عدت من المدرسه.";

  it("matches across diacritics and spellings", () => {
    expect(includes(text, "مدرسة")).toBe(true);
    expect(includes(text, "الى")).toBe(true);
    expect(includes(text, "جامعة")).toBe(false);
  });

  it("returns positions in the original text", () => {
    const matches = findAll(text, "المدرسة");
    expect(matches.map((m) => m.text)).toEqual(["المَدْرَسَة", "المدرسه"]);
    for (const m of matches) expect(text.slice(m.start, m.end)).toBe(m.text);
  });

  it("highlights matches without losing diacritics", () => {
    expect(highlight("قرأتُ الكِتَاب", "كتاب")).toBe("قرأتُ ال<mark>كِتَاب</mark>");
  });

  it("matches digits in either script", () => {
    expect(findAll("الغرفة ١٢ والغرفة 12", "12").length).toBe(2);
  });

  it("ignores empty queries", () => {
    expect(findAll(text, "  ")).toEqual([]);
    expect(includes(text, "َ")).toBe(false);
  });
});

// Each row is a real way for the text and the query to differ. The match must point at
// the original characters, so that highlight() never drops or repeats anything.
describe("search across encodings", () => {
  it.each([
    ["decomposed waw hamza", "ال\u0648\u0654ف", "الؤف", "ال\u0648\u0654ف"],
    ["decomposed yeh hamza", "قا\u064A\u0654م", "قائم", "قا\u064A\u0654م"],
    ["haraka between the letter and its hamza", "مس\u0648\u064E\u0654ول", "مسؤول", "مس\u0648\u064E\u0654ول"],
    ["right-to-left mark inside the word", "في مد\u200Fرسة النور", "مدرسة", "مد\u200Fرسة"],
    ["right-to-left mark after the word", "مدرسة\u200F النور", "مدرسة", "مدرسة\u200F"],
    ["right-to-left mark before the word stays out", "\u200Fمدرسة", "مدرسة", "مدرسة"],
    ["zero width joiner next to a letter", "مد\u200Dرسة", "مدرسة", "مد\u200Dرسة"],
    ["soft hyphen", "مد\u00ADرسة", "مدرسة", "مد\u00ADرسة"],
    ["presentation forms in the text", "\uFEE3\uFEAA\uFEAD\uFEB3\uFE94 النور", "مدرسة", "\uFEE3\uFEAA\uFEAD\uFEB3\uFE94"],
    ["presentation forms in the query", "مدرسة", "\uFEE3\uFEAA\uFEAD\uFEB3\uFE94", "مدرسة"],
    ["lam-alef ligature in the text", "\uFEFB شيء", "لا", "\uFEFB"],
    ["whole word inside a ligature", "قال \uFDF2 تعالى", "الله", "\uFDF2"],
    ["keheh in the text", "\u06A9تاب", "كتاب", "\u06A9تاب"],
    ["farsi yeh in the query", "علي", "عل\u06CC", "علي"],
    ["decimal separator in the text", "النسبة ١٢٫٥ بالمئة", "12.5", "١٢٫٥"],
    ["emoji right before the word", "\uD83D\uDE00مدرسة", "مدرسة", "مدرسة"],
    ["tatweel after the word", "مدرسةـــ", "مدرسة", "مدرسةـــ"],
  ])("%s", (_label, text, query, expected) => {
    expect(includes(text, query)).toBe(true);
    const [match] = findAll(text, query);
    expect(match?.text).toBe(expected);
    expect(text.slice(match.start, match.end)).toBe(match.text);
  });

  it("does not report the same ligature twice", () => {
    expect(findAll("\uFDF2", "ل")).toEqual([{ start: 0, end: 1, text: "\uFDF2" }]);
    expect(highlight("\uFDF2", "ل")).toBe("<mark>\uFDF2</mark>");
  });

  it("selects the whole ligature for a part of it", () => {
    expect(findAll("\uFDF2", "له")).toEqual([{ start: 0, end: 1, text: "\uFDF2" }]);
  });

  it("honours whitespace: false", () => {
    expect(findAll("من  الى", "من  الى", { whitespace: false }).length).toBe(1);
    expect(findAll("من الى", "من  الى", { whitespace: false })).toEqual([]);
  });

  it("collapses whitespace by default", () => {
    expect(findAll("من \n\t الى", "من الى").length).toBe(1);
  });

  it("honours steps that are turned off", () => {
    expect(findAll("مد\u200Fرسة", "مدرسة", { invisible: false })).toEqual([]);
    expect(findAll("\uFEFB", "لا", { presentationForms: false })).toEqual([]);
    expect(findAll("\u06A9تاب", "كتاب", { lookalikes: false })).toEqual([]);
    expect(findAll("مسؤول", "مسؤول", { diacritics: false }).length).toBe(1);
  });
});

// A small seeded generator, so a failure here is the same on every run.
function randomInt(state: { seed: number }, limit: number): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return (state.seed >>> 8) % limit;
}

const ALPHABET = [
  ..."ابتدرسمنلوهيكةىأإآؤئء ",
  ..."٠١٢٫",
  ..."ab1 ",
  "\u064E",
  "\u0651",
  "\u0653",
  "\u0654",
  "\u0655",
  "\u0670",
  "ـ",
  "\u200C",
  "\u200D",
  "\u200F",
  "\u00AD",
  "\uFEFF",
  "\u2067",
  "\uFEE3",
  "\uFEFB",
  "\uFDF2",
  "\uFDFA",
  "\uFE76",
  "\uFE77",
  "\uFC60",
  "\u06A9",
  "\u06CC",
  "\u06C3",
  "\n",
  "\u{1F600}",
];

const OPTION_SETS = [
  {},
  { hamza: true },
  { diacritics: false },
  { tatweel: false },
  { invisible: false },
  { presentationForms: false },
  { lookalikes: false },
  { whitespace: false },
  { alef: false, tehMarbuta: false, alefMaqsura: false },
];

describe("findAll and normalize stay in step", () => {
  it("agrees with includes() and returns ordered, exact ranges on random text", () => {
    const state = { seed: 20261101 };
    let withMatches = 0;
    for (let round = 0; round < 3000; round++) {
      const options = OPTION_SETS[round % OPTION_SETS.length];
      const pick = (length: number) => Array.from({ length }, () => ALPHABET[randomInt(state, ALPHABET.length)]);
      const pieces = pick(1 + randomInt(state, 24));
      const text = pieces.join("");
      // Half of the queries are taken from the text, so most rounds do have a match.
      const from = randomInt(state, pieces.length);
      const query = round % 2 ? pieces.slice(from, from + 1 + randomInt(state, 5)).join("") : pick(2).join("");

      const matches = findAll(text, query, options);
      const context = JSON.stringify({ text, query, options });
      expect(matches.length > 0, context).toBe(includes(text, query, options));

      let previousEnd = 0;
      for (const m of matches) {
        expect(m.start, context).toBeGreaterThanOrEqual(previousEnd);
        expect(m.end, context).toBeGreaterThan(m.start);
        expect(m.text, context).toBe(text.slice(m.start, m.end));
        previousEnd = m.end;
      }
      const marked = highlight(text, query, "\uE000", "\uE001", options);
      expect(marked.replaceAll("\uE000", "").replaceAll("\uE001", ""), context).toBe(text);
      if (matches.length) withMatches++;
    }
    // Guards against a generator that quietly stops producing matches.
    expect(withMatches).toBeGreaterThan(1000);
  });
});
