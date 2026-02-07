import { buildCss } from "./scripts/build-css.mjs";
import authors from "./src/_data/authors.json" with { type: "json" };

export default function (eleventyConfig) {
  const authorsById = new Map(authors.map((author) => [author.id, author]));
  const supportedChains = new Set(["bitcoin", "ethereum", "solana"]);

  eleventyConfig.addWatchTarget("src/assets/css/main.css");
  eleventyConfig.addPassthroughCopy({ "src/assets/authors": "assets/authors" });
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.svg": "assets/favicon.svg" });
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
