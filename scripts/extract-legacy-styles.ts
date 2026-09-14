import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const legacyDirectory = path.join(projectRoot, "legacy");
const outputDirectory = path.join(projectRoot, "public", "legacy-styles");
const stylePattern = /<style\b[^>]*>([\s\S]*?)<\/style>\s*/gi;

async function extractStyles() {
  await mkdir(outputDirectory, { recursive: true });
  const files = (await readdir(legacyDirectory)).filter((file) => file.endsWith(".html"));

  for (const filename of files) {
    const sourcePath = path.join(legacyDirectory, filename);
    const source = await readFile(sourcePath, "utf8");
    const styles = [...source.matchAll(stylePattern)].map((match) => match[1].trim()).filter(Boolean);
    if (!styles.length) continue;

    const cssFilename = filename.replace(/\.html$/, ".css");
    await writeFile(path.join(outputDirectory, cssFilename), `${styles.join("\n\n")}\n`, "utf8");
    await writeFile(sourcePath, source.replace(stylePattern, ""), "utf8");
    console.log(`Extracted ${styles.length} style block(s): ${filename}`);
  }
}

void extractStyles();
