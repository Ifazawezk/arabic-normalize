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
});
