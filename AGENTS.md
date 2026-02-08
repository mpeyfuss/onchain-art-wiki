# AGENTS.md

This document describes how this repository is structured, how content is authored, and how changes should be made.  
It is intended for humans and automated agents contributing to the **Onchain Art Wiki**.

---

## Project Overview

**Onchain Art Wiki** is a static, markdown-first reference for crypto-native and onchain art practices, mechanisms, and cultural context.

- All core content lives as Markdown files
- The site is built with Eleventy (11ty)
- Styling is handled with Tailwind CSS (v4)
- Search is powered by Pagefind
- There is no runtime backend or database

The goal is long-term clarity, durability, and low maintenance.

---

## Tech Stack

- **Static Site Generator:** Eleventy (11ty)
- **Content:** Markdown with YAML front matter
- **Styling:** Tailwind CSS v4
- **Search:** Pagefind (build-time indexing)
- **Hosting:** Static hosting

---

## Directory Structure (Expected)
```
├─ src/
│ ├─ articles/ # Wiki articles (markdown)
│ ├─ _includes/
│ │ ├─ layouts/ # Page layouts (Nunjucks)
│ │ └─ opinion-cards.njk # Reusable opinion card component
│ ├─ assets/
│ │ └─ css/
│ │ └─ main.css # Tailwind entry file
│ └─ search.njk # Search page (Pagefind UI)
├─ _site/ # Build output (generated)
├─ AGENTS.md
├─ package.json
└─ .eleventy.js
```

Agents should not modify `_site/` directly.

## Content Authoring Rules

### Wiki Articles
- Live in `src/articles/`
- Written in Markdown
- Use YAML front matter for metadata

Example:

```yaml
---
title: "Onchain Auctions"
tags: ["mechanisms", "market-structure"]
summary: "How auction mechanisms function in onchain art contexts."
contributors: ["jane-doe"]
opinions:
  - title: "The Case for Onchain Auctions"
    url: "https://example.com/article"
    author: "jane-doe"
    date: 2025-06-12
    note: "Clear framing of auction mechanics."
---
```
