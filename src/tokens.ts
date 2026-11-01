import { normalize, type NormalizeOptions } from "./index.js";

// Common function words, written in normalized form (no hamza on alef, ه for ة, ي for ى).
const STOPWORDS_RAW = `
في من الي علي عن مع ان او ثم لكن بل حتي اذا اذ لان كما قد لقد لم لن لا ما ماذا لماذا كيف
اين متي هل هو هي هم هن انا نحن انت انتم انتما هذا هذه ذلك تلك هؤلاء اولئك الذي التي الذين
اللذان اللتان كان كانت يكون تكون كل بعض غير بين عند عندما منذ خلال بعد قبل فوق تحت حيث ايضا
فقط جدا كذلك هناك هنا اي ايه ذات لدي له لها لهم به بها فيه فيها منه منها عليه عليها اليه
`;

export const ARABIC_STOPWORDS: ReadonlySet<string> = new Set(STOPWORDS_RAW.split(/\s+/).filter(Boolean));

// The same words with hamza on waw or yeh folded too, so that هؤلاء is still found when the
// caller has passed hamza: true.
const STOPWORD_KEYS: ReadonlySet<string> = new Set(
  STOPWORDS_RAW.replace(/ؤ/g, "و").replace(/ئ/g, "ي").split(/\s+/).filter(Boolean),
);

/** Compare in fully normalized form, so turning a step off cannot hide a stop word. */
function isStopword(token: string): boolean {
  return STOPWORD_KEYS.has(normalize(token, { hamza: true }));
}

export interface TokenizeOptions extends NormalizeOptions {
  /** Drop common function words such as في، من، على. Default false. */
  removeStopwords?: boolean;
  /** Strip the definite article ال and attached و/ف/ب/ك/ل before it. Default false. */
  stripArticle?: boolean;
  /** Drop tokens shorter than this. Default 1. */
  minLength?: number;
}

// و ف ب ك ل can attach before ال; "لل" is ل + ال with the alef dropped. Marks are allowed after
// every letter, because stripArticle() can be called on text that still has its harakat.
const ARTICLE = /^(?:[وف]\p{M}*)?(?:[بكل]\p{M}*)?[اٱ]\p{M}*ل\p{M}*|^(?:[وف]\p{M}*)?ل\p{M}*ل\p{M}*/u;

function letterCount(word: string): number {
  return word.replace(/\p{M}/gu, "").length;
}

/** Remove the definite article. At least 3 letters must remain, so الله and الي are left alone. */
export function stripArticle(word: string): string {
  const article = ARTICLE.exec(word);
  if (!article) return word;
  const rest = word.slice(article[0].length);
  return letterCount(rest) >= 3 ? rest : word;
}

/**
 * Split text into normalized word tokens. Punctuation (Arabic and Latin) is dropped;
 * Latin words and numbers are kept, lowercased.
 *
 *   tokenize("ذهبتُ إلى المدرسةِ، صباحاً!")  // ["ذهبت", "الي", "المدرسه", "صباحا"]
 */
export function tokenize(text: string, options: TokenizeOptions = {}): string[] {
  const { removeStopwords = false, stripArticle: strip = false, minLength = 1, ...norm } = options;
  // Marks stay inside a word, which matters when the caller keeps diacritics.
  const words = normalize(text, norm).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? [];
  const out: string[] = [];
  for (let w of words) {
    if (removeStopwords && isStopword(w)) continue;
    if (strip) w = stripArticle(w);
    if (letterCount(w) >= minLength) out.push(w);
  }
  return out;
}
