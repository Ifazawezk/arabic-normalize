import { describe, expect, it } from "vitest";
import { normalize, removeDiacritics, toArabicDigits, toLatinDigits } from "./index.js";

describe("normalize", () => {
  it("removes diacritics", () => {
    expect(normalize("أَهْلاً وَسَهْلاً")).toBe("اهلا وسهلا");
    expect(removeDiacritics("مُحَمَّد")).toBe("محمد");
  });

  it("removes tatweel and unifies letter forms", () => {
    expect(normalize("مـــدرسة")).toBe("مدرسه");
    expect(normalize("إسلام آمن أحمد")).toBe("اسلام امن احمد");
    expect(normalize("مستشفى")).toBe("مستشفي");
  });

  it("converts digits", () => {
    expect(toLatinDigits("٢٠٢٦ و ۱۲")).toBe("2026 و 12");
    expect(toArabicDigits("Doha 2026")).toBe("Doha ٢٠٢٦");
  });

  it("collapses whitespace", () => {
    expect(normalize("  مرحبا \n\t بكم ")).toBe("مرحبا بكم");
  });

  it("respects options", () => {
    expect(normalize("مدرسة", { tehMarbuta: false })).toBe("مدرسة");
    expect(normalize("مسؤول", { hamza: true })).toBe("مسوول");
    expect(normalize("مسؤول")).toBe("مسؤول");
  });

  it("leaves non-Arabic text alone", () => {
    expect(normalize("Hello, world!")).toBe("Hello, world!");
  });
});
