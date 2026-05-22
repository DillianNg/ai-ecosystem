# AI Ecosystem Map

Interactive, responsive website mapping the AI stack across **six layers** (Infrastructure, Model, Application, Integration, Security, Monetization). Built with **Next.js**, **React**, and **Tailwind CSS**, deployed as a static site on **GitHub Pages**.

Live demo: enable GitHub Pages after pushing (see [Deploy](#deploy-on-github-pages)).

## Features

- **Homepage** — 6 layer cards with funding indicators, growth stats, hover effects, and Explore links
- **Layer detail pages** — funding viz, featured top 10 companies, searchable/filterable full list, news
- **Heatmap** — compare funding %, company count, and growth; click to drill down
- **Company modals** — logo, valuation, founded year, website, social links (no page reload)
- **Dark / light mode** — persisted in `localStorage`
- **Copy link** — share layer or company URLs
- **SEO** — meta tags and Open Graph from `data.json`

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/ai-ecosystem.git
cd ai-ecosystem
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Edit data on GitHub

All content lives in JSON. You can maintain data in two places (keep them in sync, or use the generator):

| File | Purpose |
|------|---------|
| `public/data.json` | Served at runtime (`/data.json`) — primary file for GitHub edits |
| `src/data/ecosystem.json` | Bundled at build time for static pages |

### Regenerate sample data

```bash
node scripts/generate-data.mjs
```

This updates both `src/data/ecosystem.json` and `public/data.json`.

### Template

Copy `public/data.template.json` when adding a new layer or company. Required layer IDs:

- `infrastructure`
- `model`
- `application`
- `integration`
- `security`
- `monetization`

### Company fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | URL slug, unique per layer |
| `name` | string | Display name |
| `logo` | string | Image URL (UI Avatars used in samples) |
| `valuation` | string | e.g. `$10B`, `$500M`, `N/A` |
| `founded` | number | Year |
| `website` | string | Opens in new tab |
| `category` | string | Used for filters |

### Funding & heatmap fields

- `fundingStatus` — label e.g. `$124B`
- `fundingPercent` — 0–100 for ring chart
- `companyCount` — heatmap metric
- `growthTrend` — YoY % for heatmap

## Local build (GitHub Pages)

If your repo is `username.github.io`, use an empty base path:

```bash
npm run build
```

For project pages (`username.github.io/ai-ecosystem/`):

```bash
NEXT_PUBLIC_BASE_PATH=/ai-ecosystem npm run build
npx serve out
```

The GitHub Action sets `NEXT_PUBLIC_BASE_PATH` automatically from the repository name.

## Deploy on GitHub Pages

1. Push this repo to GitHub (`main` branch).
2. **Settings → Pages → Build and deployment**: Source = **GitHub Actions**.
3. Push to `main` — workflow `.github/workflows/deploy.yml` builds and deploys `out/`.

## Project structure

```
src/
  app/                 # Routes (home, layers/[id], heatmap)
  components/          # UI, layout, layer & heatmap views
  data/ecosystem.json  # Build-time data
  lib/                 # data helpers, utils, constants
  types/               # TypeScript interfaces
public/
  data.json            # Runtime-fetchable data
  data.template.json   # Schema reference
scripts/
  generate-data.mjs    # Sample data generator
```

## Data sources (reference)

Layer framing aligns with [Sequoia Capital AI](https://www.sequoiacap.com/article/generative-ai-a-creative-new-world/) ecosystem thinking. Sample valuations and news are **illustrative**—replace with your own Crunchbase, PitchBook, or editorial sources.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint |
| `node scripts/generate-data.mjs` | Refresh sample JSON |

## License

MIT — use and adapt freely.
