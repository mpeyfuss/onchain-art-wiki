import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";

const inputPath = path.resolve("src/assets/css/main.css");
const outputDir = path.resolve("_site/assets/css");
const outputPath = path.join(outputDir, "main.css");

export async function buildCss({ production = process.env.NODE_ENV === "production" } = {}) {
  const source = await fs.readFile(inputPath, "utf8");
  const plugins = [tailwindcss()];

  if (production) {
    plugins.push(cssnano());
  }

  const result = await postcss(plugins).process(source, {
    from: inputPath,
    to: outputPath
  });

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, result.css, "utf8");

  if (result.map) {
    await fs.writeFile(`${outputPath}.map`, result.map.toString(), "utf8");
  }

  console.log(`Built CSS -> ${path.relative(process.cwd(), outputPath)}`);
}

const isEntrypoint = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isEntrypoint) {
  await buildCss();
}
