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
