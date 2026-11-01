// Character tables shared by normalize() and the search helpers.

/**
 * Characters with no visible form: bidi controls, the Arabic letter mark, zero width
 * spaces, the word joiner, the byte order mark and soft hyphens. Text picks them up from
 * chat apps, web pages and word processors, and each one splits a word in two for any
 * string comparison.
 *
 * ZWNJ and ZWJ are dropped only next to Arabic, because emoji sequences and other
 * scripts depend on them.
 */
export const INVISIBLE =
  /[\u00AD\u061C\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]|(?<=\p{scx=Arabic}\p{M}*)[\u200C\u200D]+|[\u200C\u200D]+(?=\p{scx=Arabic})/gu;

/** Arabic Presentation Forms A and B, which is what text extracted from many PDFs is made of. */
export const PRESENTATION_FORMS = /[\uFB50-\uFDFF\uFE70-\uFEFC]/g;

/**
 * Turn one presentation form into plain letters: ﻣ becomes م, ﻻ becomes لا, ﷲ becomes الله.
 * NFKC writes an isolated haraka as a space plus the mark, which would split the word.
 */
export function expandPresentationForm(ch: string): string {
  return ch.normalize("NFKC").replace(/^ /, "");
}

/** Letters from Persian, Urdu and Kurdish keyboards that read as an Arabic letter. */
const LOOKALIKE_TABLE: Readonly<Record<string, string>> = {
  "\u06A9": "\u0643", // ک keheh
  "\u06AA": "\u0643", // ڪ swash kaf
  "\u06CC": "\u064A", // ی farsi yeh
  "\u06BE": "\u0647", // ھ heh doachashmee
  "\u06C0": "\u0647", // ۀ heh with yeh above
  "\u06C1": "\u0647", // ہ heh goal
  "\u06C2": "\u0647", // ۂ heh goal with hamza above
  "\u06D5": "\u0647", // ە ae
  "\u06C3": "\u0629", // ۃ teh marbuta goal
};

export const LOOKALIKES = /[\u06A9\u06AA\u06CC\u06BE\u06C0-\u06C3\u06D5]/g;

export function foldLookalike(ch: string): string {
  return LOOKALIKE_TABLE[ch];
}
