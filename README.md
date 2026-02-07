# Onchain Art Wiki

A static, markdown-first reference for crypto-native and onchain art practices, mechanisms, and cultural context.

## Editorial Approach

This wiki is built to reduce tribalism, not erase differences.

- We acknowledge that tribes exist in onchain art (chains, communities, aesthetics, ideologies).
- We avoid factional framing, score-settling, and winner/loser narratives.
- We prioritize clear definitions, historical context, and steelmanned viewpoints.
- We aim to document the ecosystem so readers can understand it, not recruit into camps.

## Contributing

Contributions are welcome and expected.

1. Add or edit articles in `src/articles/**/*.md`.
2. Use YAML front matter for metadata (`title`, `tags`, `summary`, `authors`).
3. Keep writing factual, source-aware, and accessible to readers outside your immediate community.
4. If you include opinion links, use `opinions` frontmatter entries to represent substantive perspectives.
5. Run `yarn build` before opening a PR to confirm the site and search index still build cleanly.

## Living Repo

This is a living repository.

- Articles should evolve as practices, tools, and norms change.
- Corrections and reframes are part of the process, not failures.
- If a page is incomplete, publish the clearest useful version now and iterate in follow-up edits.

## Scripts

- `yarn dev`: starts Eleventy dev server and watches/builds Tailwind CSS.
- `yarn build`: builds Eleventy output, compiles/minifies CSS, and runs Pagefind indexing.
