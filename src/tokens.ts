import { normalize, type NormalizeOptions } from "./index.js";

// Common function words, written in normalized form (no hamza on alef, ه for ة, ي for ى).
const STOPWORDS_RAW = `
في من الي علي عن مع ان او ثم لكن بل حتي اذا اذ لان كما قد لقد لم لن لا ما ماذا لماذا كيف
اين متي هل هو هي هم هن انا نحن انت انتم انتما هذا هذه ذلك تلك هؤلاء اولئك الذي التي الذين
اللذان اللتان كان كانت يكون تكون كل بعض غير بين عند عندما منذ خلال بعد قبل فوق تحت حيث ايضا
فقط جدا كذلك هناك هنا اي ايه ذات لدي له لها لهم به بها فيه فيها منه منها عليه عليها اليه
`;

export const ARABIC_STOPWORDS: ReadonlySet<string> = new Set(STOPWORDS_RAW.split(/\s+/).filter(Boolean));

export interface TokenizeOptions extends NormalizeOptions {
  /** Drop common function words such as في، من، على. Default false. */
  removeStopwords?: boolean;
  /** Strip the definite article ال and attached و/ف/ب/ك/ل before it. Default false. */
  stripArticle?: boolean;
  /** Drop tokens shorter than this. Default 1. */
  minLength?: number;
}

// و ف ب ك ل can attach before ال; "لل" is ل + ال with the alef dropped.
// At least 3 letters must remain, so words like الله and الي are left alone.
const ARTICLE = /^(?:[وف]?[بكل]?ال|[وف]?لل)(?=.{3,})/;

export function stripArticle(word: string): string {
  return word.replace(ARTICLE, "");
}

/**
 * Split text into normalized word tokens. Punctuation (Arabic and Latin) is dropped;
 * Latin words and numbers are kept, lowercased.
 *
 *   tokenize("ذهبتُ إلى المدرسةِ، صباحاً!")  // ["ذهبت", "الي", "المدرسه", "صباحا"]
 */
export function tokenize(text: string, options: TokenizeOptions = {}): string[] {
  const { removeStopwords = false, stripArticle: strip = false, minLength = 1, ...norm } = options;
  const words = normalize(text, norm).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const out: string[] = [];
  for (let w of words) {
    if (removeStopwords && ARABIC_STOPWORDS.has(w)) continue;
    if (strip) w = stripArticle(w);
    if (w.length >= minLength) out.push(w);
  }
  return out;
}
