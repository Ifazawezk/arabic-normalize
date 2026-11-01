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

// Each row is text that a reader sees as the same word but a plain comparison does not.
describe("the same text in a different encoding", () => {
  it.each([
    // Invisible characters from chat apps, web pages and word processors.
    ["right-to-left mark", "مد\u200Fرسة", "مدرسه"],
    ["left-to-right mark", "مدرسة\u200E", "مدرسه"],
    ["Arabic letter mark", "مدرسة\u061C", "مدرسه"],
    ["zero width non-joiner", "مد\u200Cرسة", "مدرسه"],
    ["zero width joiner", "مد\u200Dرسة", "مدرسه"],
    ["zero width joiner after a haraka", "مَ\u200Dدرسة", "مدرسه"],
    ["zero width space", "مد\u200Bرسة", "مدرسه"],
    ["word joiner", "مد\u2060رسة", "مدرسه"],
    ["soft hyphen", "مد\u00ADرسة", "مدرسه"],
    ["byte order mark inside a word", "مد\uFEFFرسة", "مدرسه"],
    ["bidi isolates around a word", "\u2067مدرسة\u2069", "مدرسه"],
    ["bidi embedding around a word", "\u202Bمدرسة\u202C", "مدرسه"],
    // Presentation forms, which is what text extracted from many PDFs contains.
    ["contextual letter forms", "\uFEE3\uFEAA\uFEAD\uFEB3\uFE94", "مدرسه"],
    ["lam-alef ligature", "\uFEFB\uFE8E", "لاا"],
    ["lam-alef with hamza ligature", "\uFEF7\uFEE3\uFEAE", "لامر"],
    ["Allah ligature", "\uFDF2", "الله"],
    ["honorific ligature", "\uFDFA", "صلي الله عليه وسلم"],
    ["isolated haraka form does not split the word", "\uFEE3\uFE76\uFEA9", "مد"],
    ["medial haraka form does not leave a tatweel", "\uFEE3\uFE77\uFEA9", "مد"],
    ["shadda ligature does not split the word", "\uFEE3\uFC60\uFEA9", "مد"],
    // Decomposed letters, as stored by some macOS tools.
    ["waw plus hamza above", "مسو\u0654ول", "مسؤول"],
    ["alef plus hamza below", "ا\u0655سلام", "اسلام"],
    ["alef plus madda above", "ا\u0653من", "امن"],
    // Persian, Urdu and Kurdish keyboards, and legacy code pages.
    ["keheh for kaf", "\u06A9تاب", "كتاب"],
    ["swash kaf", "\u06AAتاب", "كتاب"],
    ["farsi yeh for yeh", "عل\u06CC", "علي"],
    ["farsi yeh for alef maqsura", "موس\u06CC", "موسي"],
    ["heh doachashmee", "\u06BEو", "هو"],
    ["heh goal", "م\u06C1", "مه"],
    ["teh marbuta goal", "مدرس\u06C3", "مدرسه"],
    ["presentation form of keheh", "\uFB90تاب", "كتاب"],
    // Quranic marks outside the main Arabic block.
    ["Extended-A mark", "م\u08F0ن", "من"],
    // Numbers written with Arabic punctuation.
    ["decimal separator", "٣٫١٤", "3.14"],
    ["thousands separator", "١٬٥٠٠", "1,500"],
    ["percent sign", "٥٠٪", "50%"],
  ])("%s", (_label, input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it("keeps a word boundary around an invisible character", () => {
    expect(normalize("مدرسة \u200F الكتاب")).toBe("مدرسه الكتاب");
  });

  it("can turn each new step off", () => {
    expect(normalize("مد\u200Fرسة", { invisible: false, tehMarbuta: false })).toBe("مد\u200Fرسة");
    expect(normalize("\uFEFB", { presentationForms: false })).toBe("\uFEFB");
    expect(normalize("\u06A9تاب", { lookalikes: false })).toBe("\u06A9تاب");
  });

  it("keeps teh marbuta from \u06C3 when tehMarbuta is off", () => {
    expect(normalize("مدرس\u06C3", { tehMarbuta: false })).toBe("مدرسة");
  });

  it("leaves emoji and other scripts that need joiners alone", () => {
    const technologist = "\u{1F469}\u200D\u{1F4BB}";
    expect(normalize(technologist)).toBe(technologist);
    expect(normalize(`مدرسة ${technologist} الكتاب`)).toBe(`مدرسه ${technologist} الكتاب`);
    expect(normalize("क्\u200Dष")).toBe("क्\u200Dष");
  });
});
