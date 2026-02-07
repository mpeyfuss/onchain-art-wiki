import { buildCss } from "./scripts/build-css.mjs";
import authors from "./src/_data/authors.json" with { type: "json" };
import { statSync } from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  const authorsById = new Map(authors.map((author) => [author.id, author]));
  const supportedChains = new Set(["bitcoin", "ethereum", "solana"]);
  const slugify = (value = "") => {
    return String(value)
      .toLowerCase()
      .replace(/&amp;|&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };
  const stripTags = (value = "") => {
    return String(value)
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'");
  };

  eleventyConfig.addWatchTarget("src/assets/css/main.css");
  eleventyConfig.addPassthroughCopy({ "src/assets/articles/images": "assets/articles/images" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon-light.svg": "assets/favicon-light.svg" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon-dark.svg": "assets/favicon-dark.svg" });
  eleventyConfig.on("eleventy.before", async () => {
    await buildCss({ production: process.env.NODE_ENV === "production" });
  });
  eleventyConfig.addFilter("resolveAuthors", (authorIds = []) => {
    return authorIds
      .map((authorId) => authorsById.get(authorId))
      .filter((author) => Boolean(author));
  });
  eleventyConfig.addFilter("resolveAuthor", (authorId) => {
    if (!authorId) {
      return null;
    }

    return authorsById.get(authorId) || null;
  });
  eleventyConfig.addFilter("formatDateOnly", (value) => {
    if (!value) {
      return "";
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC"
    }).format(parsed);
  });
  eleventyConfig.addFilter("fileLastModified", (inputPath) => {
    if (!inputPath) {
      return "";
    }

    try {
      const absolutePath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
      return statSync(absolutePath).mtime;
    } catch {
      return "";
    }
  });
  eleventyConfig.addFilter("addHeadingIds", (html = "") => {
    const usedIds = new Set();
    return String(html).replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = "", inner = "") => {
      const existingIdMatch = attrs.match(/\sid=(["'])(.*?)\1/i);
      let headingId = existingIdMatch ? existingIdMatch[2] : "";

      if (!headingId) {
        const base = slugify(stripTags(inner)) || `section-${level}`;
        headingId = base;
        let duplicateCount = 2;
        while (usedIds.has(headingId)) {
          headingId = `${base}-${duplicateCount}`;
          duplicateCount += 1;
        }
        usedIds.add(headingId);
        return `<h${level}${attrs} id="${headingId}">${inner}</h${level}>`;
      }

      if (usedIds.has(headingId)) {
        const base = headingId;
        let duplicateCount = 2;
        while (usedIds.has(`${base}-${duplicateCount}`)) {
          duplicateCount += 1;
        }
        const dedupedId = `${base}-${duplicateCount}`;
        usedIds.add(dedupedId);
        return `<h${level}${attrs.replace(/\sid=(["'])(.*?)\1/i, ` id="${dedupedId}"`)}>${inner}</h${level}>`;
      }

      usedIds.add(headingId);
      return match;
    });
  });
  eleventyConfig.addFilter("extractTocHeadings", (html = "") => {
    const headings = [];
    const usedIds = new Set();
    const pattern = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;
    let headingMatch = pattern.exec(String(html));

    while (headingMatch) {
      const level = Number(headingMatch[1]);
      const attrs = headingMatch[2] || "";
      const text = stripTags(headingMatch[3] || "").trim();
      const idMatch = attrs.match(/\sid=(["'])(.*?)\1/i);
      let id = idMatch ? idMatch[2] : slugify(text);

      if (!id) {
        headingMatch = pattern.exec(String(html));
        continue;
      }

      if (usedIds.has(id)) {
        let duplicateCount = 2;
        while (usedIds.has(`${id}-${duplicateCount}`)) {
          duplicateCount += 1;
        }
        id = `${id}-${duplicateCount}`;
      }

      usedIds.add(id);
      headings.push({ id, text, level });
      headingMatch = pattern.exec(String(html));
    }

    return headings;
  });

  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/articles/**/*.md")
      .map((article) => {
        const pathParts = article.inputPath.split("/");
        const articlesDirIndex = pathParts.indexOf("articles");
        const maybeChain = articlesDirIndex >= 0 ? pathParts[articlesDirIndex + 1] : undefined;

        article.data.chain = supportedChains.has(maybeChain) ? maybeChain : "general";
        return article;
      })
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
