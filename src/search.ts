import { expandPresentationForm, INVISIBLE, PRESENTATION_FORMS } from "./chars.js";
import { normalize, type NormalizeOptions } from "./index.js";

export interface Match {
  /** Start index in the original text. */
  start: number;
  /** End index (exclusive) in the original text. */
  end: number;
  /** The matched slice of the original text, with its diacritics etc. intact. */
  text: string;
}

// A base character with its combining marks. Normalizing these whole matters: و plus a
// combining hamza is ؤ, but normalized one at a time it would lose the hamza.
const CLUSTER = /\P{M}\p{M}*|\p{M}+/gu;

interface NormalizedText {
  value: string;
  /** For each UTF-16 unit of `value`, where its source starts in the original text. */
  starts: number[];
  /** For each UTF-16 unit of `value`, where its source ends in the original text. */
  ends: number[];
}

interface TrackedText {
  text: string;
  /** For each UTF-16 unit of `text`, its index in the original text. */
  origin: number[];
}

/** Replace every hit of `pattern`, keeping track of where each remaining unit came from. */
function rewrite(input: TrackedText, pattern: RegExp, replace: (hit: string) => string): TrackedText {
  let text = "";
  const origin: number[] = [];
  let at = 0;
  const copyUpTo = (end: number) => {
    text += input.text.slice(at, end);
    for (; at < end; at++) origin.push(input.origin[at]);
  };
  for (const hit of input.text.matchAll(pattern)) {
    copyUpTo(hit.index);
    const replacement = replace(hit[0]);
    text += replacement;
    for (let i = 0; i < replacement.length; i++) origin.push(input.origin[at]);
    at += hit[0].length;
  }
  copyUpTo(input.text.length);
  return { text, origin };
}

/**
 * Give the same string as normalize(), apart from a possible space at either end, and
 * keep a way back to the original text. One source character can give several letters
 * (ﷲ gives four) or none (a haraka), so each output unit stores a source range.
 */
function normalizeWithMap(text: string, options: NormalizeOptions): NormalizedText {
  // These two steps look at neighbouring characters, so they run before splitting into clusters.
  let tracked: TrackedText = { text, origin: Array.from({ length: text.length }, (_, i) => i) };
  if (options.invisible !== false) tracked = rewrite(tracked, INVISIBLE, () => "");
  if (options.presentationForms !== false) tracked = rewrite(tracked, PRESENTATION_FORMS, expandPresentationForm);
  const { text: prepared, origin } = tracked;

  const collapse = options.whitespace !== false;
  const perCluster: NormalizeOptions = { ...options, invisible: false, presentationForms: false, whitespace: false };
  const seen = new Map<string, string>();
  let value = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let lastWasSpace = false;
  for (const hit of prepared.matchAll(CLUSTER)) {
    const cluster = hit[0];
    let out = seen.get(cluster);
    if (out === undefined) {
      out = normalize(cluster, perCluster);
      seen.set(cluster, out);
    }
    const start = origin[hit.index];
    const end = origin[hit.index + cluster.length - 1] + 1;
    for (let i = 0; i < out.length; i++) {
      const space = collapse && /\s/.test(out[i]);
      if (space && lastWasSpace) continue;
      value += space ? " " : out[i];
      starts.push(start);
      ends.push(end);
      lastWasSpace = space;
    }
  }
  return { value, starts, ends };
}

/** Find every place where `query` appears in `text`, ignoring spelling differences. */
export function findAll(text: string, query: string, options: NormalizeOptions = {}): Match[] {
  const q = normalize(query, options);
  if (!q) return [];
  const { value, starts, ends } = normalizeWithMap(text, options);
  const matches: Match[] = [];
  let previousEnd = 0;
  let from = 0;
  for (;;) {
    const at = value.indexOf(q, from);
    if (at < 0) break;
    from = at + q.length;
    const start = starts[at];
    // Two hits inside one ligature are the same place in the original text.
    if (start < previousEnd) continue;
    const last = at + q.length - 1;
    // Run up to the next kept character, so trailing tatweel and invisible characters stay in.
    const end = Math.max(ends[last], starts[last + 1] ?? text.length);
    matches.push({ start, end, text: text.slice(start, end) });
    previousEnd = end;
  }
  return matches;
}

/** True if `query` appears in `text`, ignoring diacritics, letter forms and digits. */
export function includes(text: string, query: string, options: NormalizeOptions = {}): boolean {
  const q = normalize(query, options);
  return q !== "" && normalize(text, options).includes(q);
}

/** Wrap every match in `before` and `after`, e.g. "<mark>" and "</mark>". */
export function highlight(text: string, query: string, before = "<mark>", after = "</mark>", options: NormalizeOptions = {}): string {
  let out = "";
  let last = 0;
  for (const m of findAll(text, query, options)) {
    out += text.slice(last, m.start) + before + m.text + after;
    last = m.end;
  }
  return out + text.slice(last);
}
