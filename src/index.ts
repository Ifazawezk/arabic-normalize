import { expandPresentationForm, foldLookalike, INVISIBLE, LOOKALIKES, PRESENTATION_FORMS } from "./chars.js";

// Harakat, Quranic marks and superscript alef, plus the marks in Arabic Extended-A and B.
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0898-\u089F\u08CA-\u08FF]/g;
const TATWEEL = /ـ/g;
const ALEF_FORMS = /[أإآٱ]/g;
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
// Percent sign, decimal separator and thousands separator.
const NUMERIC_PUNCTUATION: Readonly<Record<string, string>> = { "\u066A": "%", "\u066B": ".", "\u066C": "," };

export interface NormalizeOptions {
  /** Remove characters with no visible form, such as RLM, ZWNJ and soft hyphens. Default true. */
  invisible?: boolean;
  /** Turn presentation forms and ligatures (ﻣ ﻻ ﷲ), common in PDF text, into plain letters. Default true. */
  presentationForms?: boolean;
  /** Remove harakat (fatha, damma, kasra, sukun, shadda, tanween). Default true. */
  diacritics?: boolean;
  /** Remove tatweel (ـ) used to stretch words. Default true. */
  tatweel?: boolean;
  /** Turn أ إ آ ٱ into ا. Default true. */
  alef?: boolean;
  /** Turn Persian, Urdu and Kurdish look-alikes (ک ی ہ ھ ۃ) into Arabic letters (ك ي ه ة). Default true. */
  lookalikes?: boolean;
  /** Turn ة into ه. Default true. */
  tehMarbuta?: boolean;
  /** Turn ى into ي. Default true. */
  alefMaqsura?: boolean;
  /** Turn ؤ into و and ئ into ي. Default false, since it changes meaning more often. */
  hamza?: boolean;
  /** Turn Arabic-Indic and Persian digits into 0-9, and ٫ ٬ ٪ into . , %. Default true. */
  digits?: boolean;
  /** Collapse runs of whitespace and trim. Default true. */
  whitespace?: boolean;
}

const DEFAULTS: Required<NormalizeOptions> = {
  invisible: true,
  presentationForms: true,
  diacritics: true,
  tatweel: true,
  alef: true,
  lookalikes: true,
  tehMarbuta: true,
  alefMaqsura: true,
  hamza: false,
  digits: true,
  whitespace: true,
};

export function removeDiacritics(text: string): string {
  return text.replace(DIACRITICS, "");
}

export function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹٪٫٬]/g, (d) => {
    const punctuation = NUMERIC_PUNCTUATION[d];
    if (punctuation) return punctuation;
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

export function toArabicDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/**
 * Normalize Arabic text so that different spellings of the same word compare equal.
 *
 *   normalize("أَهْلاً")        // "اهلا"
 *   normalize("مـــدرسة ١٢")    // "مدرسه 12"
 */
export function normalize(text: string, options: NormalizeOptions = {}): string {
  const o = { ...DEFAULTS, ...options };
  let s = text;
  if (o.invisible) s = s.replace(INVISIBLE, "");
  if (o.presentationForms) s = s.replace(PRESENTATION_FORMS, expandPresentationForm);
  s = s.normalize("NFC");
  if (o.diacritics) s = removeDiacritics(s);
  if (o.tatweel) s = s.replace(TATWEEL, "");
  if (o.alef) s = s.replace(ALEF_FORMS, "ا");
  if (o.lookalikes) s = s.replace(LOOKALIKES, foldLookalike);
  if (o.tehMarbuta) s = s.replace(/ة/g, "ه");
  if (o.alefMaqsura) s = s.replace(/ى/g, "ي");
  if (o.hamza) s = s.replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  if (o.digits) s = toLatinDigits(s);
  if (o.whitespace) s = s.replace(/\s+/g, " ").trim();
  return s;
}

export { findAll, highlight, includes, type Match } from "./search.js";
export { ARABIC_STOPWORDS, stripArticle, tokenize, type TokenizeOptions } from "./tokens.js";
