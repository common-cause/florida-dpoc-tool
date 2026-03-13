# Florida DPOC Tool

> Interactive decision tree helping Florida voters determine what documentary proof of citizenship they need to vote under the 2026 DPOC law.

## Embed on commoncause.org

Paste into a WordPress **Custom HTML** block on the target page:

```html
<div id="cc-tool"></div>
<script src="https://commoncause.github.io/florida-dpoc-tool/src/embed.js"></script>
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
│   └── tree.json           # Decision tree content — edit this for content changes
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deploys to GitHub Pages on push to main
```
