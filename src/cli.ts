#!/usr/bin/env node
// Normalize Arabic text from files or stdin, line by line.
//   arabic-normalize comments.txt > clean.txt
//   cat data.csv | arabic-normalize --keep-teh-marbuta
//   arabic-normalize --tokens --no-stopwords article.txt

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { normalize, type NormalizeOptions } from "./index.js";
import { tokenize } from "./tokens.js";

const HELP = `usage: arabic-normalize [options] [FILE...]

Normalizes Arabic text line by line. Reads stdin when no file is given.

  --keep-diacritics     keep harakat
  --keep-teh-marbuta    keep ة instead of turning it into ه
  --keep-alef-maqsura   keep ى instead of turning it into ي
  --keep-digits         keep Arabic-Indic digits
  --hamza               also turn ؤ into و and ئ into ي
  --tokens              print one token per line instead of normalized lines
  --no-stopwords        with --tokens: drop common function words
  --strip-article       with --tokens: strip the definite article ال
  -h, --help            show this help`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "keep-diacritics": { type: "boolean" },
    "keep-teh-marbuta": { type: "boolean" },
    "keep-alef-maqsura": { type: "boolean" },
    "keep-digits": { type: "boolean" },
    hamza: { type: "boolean" },
    tokens: { type: "boolean" },
    "no-stopwords": { type: "boolean" },
    "strip-article": { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const options: NormalizeOptions = {
  diacritics: !values["keep-diacritics"],
  tehMarbuta: !values["keep-teh-marbuta"],
  alefMaqsura: !values["keep-alef-maqsura"],
  digits: !values["keep-digits"],
  hamza: Boolean(values.hamza),
};

async function processStream(input: NodeJS.ReadableStream) {
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) {
    if (values.tokens) {
      const tokens = tokenize(line, {
        ...options,
        removeStopwords: values["no-stopwords"],
        stripArticle: values["strip-article"],
      });
      for (const t of tokens) process.stdout.write(t + "\n");
    } else {
      process.stdout.write(normalize(line, options) + "\n");
    }
  }
}

async function main() {
  if (positionals.length === 0) {
    await processStream(process.stdin);
    return;
  }
  for (const file of positionals) {
    const stream = createReadStream(file, "utf8");
    stream.on("error", (err) => {
      console.error(`arabic-normalize: ${err.message}`);
      process.exit(2);
    });
    await processStream(stream);
  }
}

main();
