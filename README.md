# Florida DPOC Tool

> Interactive decision tree helping Florida voters determine what documentary proof of citizenship they need to vote under the 2026 DPOC law.

## Status

Preview stage, pending review by Florida program staff and legal. Go-live is targeted
for after the 2026 election. Two branches are still `under_construction` placeholders
(derived citizens; no FL DL/ID), and several result links carry `(TODO)` placeholder URLs
awaiting final resources from FL program staff. The Pages root
(`https://common-cause.github.io/florida-dpoc-tool/`) serves `index.html` as the staging
preview.

## Embed on commoncause.org

Paste into a WordPress **Custom HTML** block on the target page:

```html
<div id="cc-tool"></div>
<script src="https://common-cause.github.io/florida-dpoc-tool/src/embed.js"></script>
```

## Local Development

```bash
python -m http.server 8080
# Open http://localhost:8080
```

## Updating Content

Edit `data/tree.json` — no code changes needed for content updates.
Push to `main` to deploy.

## Project Structure

```
florida-dpoc-tool/
├── index.html              # Local dev wrapper (simulates a CC page)
├── src/
│   ├── embed.js            # Widget — finds #cc-tool div and renders the tool
│   └── embed.css           # Namespaced styles (.cc-tool *)
├── data/
│   ├── tree.json           # Decision tree content — edit this for content changes
│   └── *.xlsx / *.ods      # Source spreadsheets (FL process map, outreach survey) — NOT tool inputs
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deploys to GitHub Pages on push to main
```

> **Caution:** the deploy workflow publishes the **whole repo** to GitHub Pages, so every
> tracked file (including `data/` spreadsheets) is publicly downloadable. Never commit
> files containing personal information.
