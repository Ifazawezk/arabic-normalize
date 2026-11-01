import { describe, expect, it } from "vitest";
import { stripArticle, tokenize } from "./tokens.js";

describe("tokenize", () => {
  it("splits and normalizes words, dropping punctuation", () => {
    expect(tokenize("ذهبتُ إلى المدرسةِ، صباحاً!")).toEqual(["ذهبت", "الي", "المدرسه", "صباحا"]);
  });

  it("keeps Latin words and numbers", () => {
    expect(tokenize("تعلمت Python في ٢٠٢٤")).toEqual(["تعلمت", "python", "في", "2024"]);
  });

  it("removes stop words", () => {
    expect(tokenize("ذهبت إلى المدرسة في الصباح", { removeStopwords: true })).toEqual(["ذهبت", "المدرسه", "الصباح"]);
  });

  it("strips the definite article", () => {
    expect(tokenize("الكتاب والقلم للطالب", { stripArticle: true })).toEqual(["كتاب", "قلم", "طالب"]);
  });

  it("does not strip short words that only look like an article", () => {
    expect(stripArticle("الي")).toBe("الي");
    expect(stripArticle("الله")).toBe("الله");
  });

  it("drops short tokens", () => {
    expect(tokenize("و ب كتاب", { minLength: 2 })).toEqual(["كتاب"]);
  });

  it("keeps words whole when diacritics are kept", () => {
    expect(tokenize("كِتَاب جَمِيل، صَبَاحًا", { diacritics: false })).toEqual(["كِتَاب", "جَمِيل", "صَبَاحًا"]);
  });

  it("counts letters, not marks, for minLength", () => {
    expect(tokenize("بِ كِتَاب", { diacritics: false, minLength: 2 })).toEqual(["كِتَاب"]);
  });

  it("keeps a word whole when it holds an invisible character", () => {
    expect(tokenize("مد\u200Cرسة")).toEqual(["مدرسه"]);
  });
});

describe("stop words under every option", () => {
  it.each([
    ["alef maqsura kept", "ذهبت إلى البيت", { alefMaqsura: false }, ["ذهبت", "البيت"]],
    ["alef forms kept", "ذهبت إلى البيت", { alef: false }, ["ذهبت", "البيت"]],
    ["diacritics kept", "ذَهَبْتُ إِلَى البيت", { diacritics: false }, ["ذَهَبْتُ", "البيت"]],
    ["teh marbuta kept", "هذه مدرسة", { tehMarbuta: false }, ["مدرسة"]],
    ["hamza folded", "هؤلاء أولئك طلاب", { hamza: true }, ["طلاب"]],
    ["default options", "هؤلاء أولئك طلاب", {}, ["طلاب"]],
  ])("%s", (_label, text, options, expected) => {
    expect(tokenize(text, { ...options, removeStopwords: true })).toEqual(expected);
  });
});

describe("stripArticle on text with its diacritics", () => {
  it.each([
    ["plain", "الكتاب", "كتاب"],
    ["sukun on the lam", "الْكِتَابُ", "كِتَابُ"],
    ["attached waw and ba", "وَبِالْكِتَابِ", "كِتَابِ"],
    ["lam for the article", "لِلطَّالِبِ", "طَّالِبِ"],
    ["alef wasla", "ٱلْكِتَاب", "كِتَاب"],
    ["Allah with a damma", "اللهُ", "اللهُ"],
    ["Allah with shadda and fatha", "اللَّهَ", "اللَّهَ"],
    ["only two letters remain", "الْيَد", "الْيَد"],
    ["a word without an article", "كِتَاب", "كِتَاب"],
  ])("%s", (_label, word, expected) => {
    expect(stripArticle(word)).toBe(expected);
  });
});
