/* Generates standalone transparent bank marks from the bundled official source artwork. */
const path = require("node:path");
const sharp = require("sharp");

const root = path.join(process.cwd(), "public", "lender-logos");
const symbols = [
  // The standalone Union Bank symbol sits between the Hindi and English wordmarks.
  { source: "union-bank-india.png", output: "union-bank-mark.png", left: 139, top: 0, width: 75, height: 56 },
  { source: "icici-bank.png", output: "icici-mark.png", left: 0, top: 0, width: 40, height: 40 },
  { source: "punjab-national-bank.png", output: "pnb-mark.png", left: 0, top: 0, width: 103, height: 42 },
  { source: "bank-of-baroda.png", output: "bank-of-baroda-mark.png", left: 40, top: 20, width: 80, height: 75 },
];

const wordmarks = [
  ["credila.svg", "credila-mark.png"],
  ["avanse.svg", "avanse-mark.png"],
  ["incred.svg", "incred-mark.png"],
  ["auxilo.svg", "auxilo-mark.png"],
  ["edgro.png", "edgro-mark.png"],
  ["poonawalla.svg", "poonawalla-mark.png"],
  ["jp-morgan.svg", "jp-morgan-mark.png"],
];

// Keep the full square IDFC FIRST icon (including the white F strokes) rather
// than using the earlier clipped 69px extraction.
const iconMarks = [
  { source: "idfc-first-bank.svg", output: "idfc-first-bank-mark.png", left: 0, top: 0, width: 83, height: 83 },
];

Promise.all(symbols.map(({ source, output, ...extract }) =>
  sharp(path.join(root, source))
    .extract(extract)
    .png()
    .toFile(path.join(root, output)),
).concat(iconMarks.map(({ source, output, ...extract }) =>
  sharp(path.join(root, source))
    .extract(extract)
    .png()
    .toFile(path.join(root, output)),
).concat(wordmarks.map(([source, output]) =>
  sharp(path.join(root, source))
    .png()
    .toFile(path.join(root, output)),
))).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
