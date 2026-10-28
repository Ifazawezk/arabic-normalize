# arabic-normalize

Make Arabic text searchable. The same word can be written many ways: with or without harakat, with أ or ا, with ة or ه, with tatweel, with ١٢ or 12. A plain `includes()` treats them all as different. This library fixes that.

Zero dependencies, TypeScript types included, works in Node and the browser.

```ts
import { normalize, includes, highlight, tokenize } from "arabic-normalize";

normalize("أَهْلاً بِكُمْ فِي مَدْرَسَتِنَا ١٢");
// "اهلا بكم في مدرستنا 12"

includes("ذهبتُ إلى المَدْرَسَة", "المدرسه");
// true

highlight("قرأتُ الكِتَاب", "كتاب");
// "قرأتُ ال<mark>كِتَاب</mark>"   (original text kept, diacritics and all)

tokenize("ذهبتُ إلى المكتبةِ والجامعة", { removeStopwords: true, stripArticle: true });
// ["ذهبت", "مكتبه", "جامعه"]
```

## Install

```bash
npm install github:Ifazawezk/arabic-normalize
```

## What `normalize()` does

| Step | Example | Option (default) |
|---|---|---|
| Remove harakat and Quranic marks | مُحَمَّد → محمد | `diacritics: true` |
| Remove tatweel | مـــدرسة → مدرسة | `tatweel: true` |
| Unify alef forms | أ إ آ ٱ → ا | `alef: true` |
| Teh marbuta to heh | مدرسة → مدرسه | `tehMarbuta: true` |
| Alef maqsura to yeh | مستشفى → مستشفي | `alefMaqsura: true` |
| Hamza on waw/yeh | مسؤول → مسوول | `hamza: false` |
| Arabic-Indic and Persian digits | ٢٠٢٦ → 2026 | `digits: true` |
| Collapse whitespace | | `whitespace: true` |

Turn any step off by passing `false`, e.g. `normalize(text, { tehMarbuta: false })`.

## API

- `normalize(text, options?)`: the full normalization above.
- `includes(text, query, options?)`: true if `query` appears in `text` after normalizing both.
- `findAll(text, query, options?)`: every match as `{ start, end, text }`, with positions in the **original** string, so you can highlight or slice it.
- `highlight(text, query, before = "<mark>", after = "</mark>", options?)`: wraps every match.
- `tokenize(text, { removeStopwords?, stripArticle?, minLength?, ...options })`: normalized words with punctuation removed. Latin words and numbers are kept, lowercased.
- `stripArticle(word)`: removes ال and attached و ف ب ك ل (والكتاب → كتاب). At least 3 letters must remain, so الله and الي are left alone.
- `removeDiacritics(text)`, `toLatinDigits(text)`, `toArabicDigits(text)`.
- `ARABIC_STOPWORDS`: the stop word set, in normalized form.

## Command line

```bash
npx arabic-normalize comments.txt > clean.txt
cat comments.txt | npx arabic-normalize --keep-teh-marbuta
npx arabic-normalize --tokens --no-stopwords --strip-article article.txt
```

Run `arabic-normalize --help` for all options.

## Notes

Normalization is lossy on purpose: مدرسة and مدرسه become the same string. Use it for search keys, matching and NLP features, and keep the original text for display. `findAll()` and `highlight()` do this for you.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
