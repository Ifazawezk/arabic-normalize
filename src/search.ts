import { normalize, type NormalizeOptions } from "./index.js";

export interface Match {
  /** Start index in the original text. */
  start: number;
  /** End index (exclusive) in the original text. */
  end: number;
  /** The matched slice of the original text, with its diacritics etc. intact. */
  text: string;
}

/**
 * Normalize text one character at a time, keeping for each output character
 * the index of the original character it came from.
 */
function normalizeWithMap(text: string, options: NormalizeOptions): { value: string; map: number[] } {
  let value = "";
  const map: number[] = [];
  let lastWasSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        value += " ";
        map.push(i);
      }
      lastWasSpace = true;
      continue;
    }
    lastWasSpace = false;
    const out = normalize(ch, { ...options, whitespace: false });
    for (const c of out) {
      value += c;
      map.push(i);
    }
  }
  return { value, map };
}

/** Find every place where `query` appears in `text`, ignoring spelling differences. */
export function findAll(text: string, query: string, options: NormalizeOptions = {}): Match[] {
  const q = normalize(query, options);
  if (!q) return [];
  const { value, map } = normalizeWithMap(text, options);
  const matches: Match[] = [];
  let from = 0;
  for (;;) {
    const at = value.indexOf(q, from);
    if (at < 0) break;
    const start = map[at];
    let end = map[at + q.length - 1] + 1;
    // Keep trailing diacritics that belong to the last matched letter.
    while (end < text.length && normalize(text[end], { ...options, whitespace: false }) === "" && !/\s/.test(text[end])) {
      end++;
    }
    matches.push({ start, end, text: text.slice(start, end) });
    from = at + q.length;
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
