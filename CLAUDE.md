# Florida DPOC Tool

Interactive decision tree helping Florida voters determine what documentary proof of citizenship they need to vote under the 2026 DPOC law.

## Project Type: cc-embed

A self-contained HTML/CSS/JS embed for commoncause.org. No backend, no build step.
Hosted on GitHub Pages, embedded on WordPress pages via a two-line snippet.

## Key Files

- `index.html` — preview/host-page simulation. Also deployed at the Pages root (`https://common-cause.github.io/florida-dpoc-tool/`) since the workflow uploads the whole repo. Use it as the FL-team staging URL until the embed is on the real WordPress page.
- `src/embed.js` — widget entry point; finds the `#cc-tool` div and renders the tool
- `src/embed.css` — all styles, namespaced under `.cc-tool` to avoid host page collisions
- `data/tree.json` — decision tree content; edit this to update the tool without touching code
- `data/FL DPOC Process Map*.xlsx`, `data/HB991 Outreach Responses*.ods` — source spreadsheets
  from FL program staff (process map the tree was encoded from; outreach survey responses).
  Reference material only — the tool never loads them. **Caution:** the Pages workflow uploads
  the whole repo, so any file committed to this repo (including `data/`) is publicly
  downloadable from the Pages site. Don't commit spreadsheets containing personal info.

## Local Development

Open `index.html` directly in a browser, or run a local server to avoid CORS issues
when fetching `tree.json`:

```bash
python -m http.server 8080
```
Then open http://localhost:8080

## Content Updates

All tool content lives in `data/tree.json`. Schema reference:

- `meta.title` — displayed at the top of the embed
- `meta.start` — ID of the first node to render
- `nodes` — a map of node ID → node object

### Node types

**`question`** — asks a question and branches based on the answer:
```json
{
  "type": "question",
  "topic": "Short label (e.g. 'FL ID')",
  "text": "The question text",
  "hint": "Optional clarifying subtext",
  "choices": [
    { "label": "Yes", "next": "some_node_id" },
    { "label": "Original or certified copy of birth certificate",
      "summary": "Birth cert",
      "next": "other_node_id" }
  ]
}
```

`topic` and `summary` are optional. They feed the breadcrumb trail of answered
questions that renders above the current question — capsule format is
`{topic}: {summary}`, e.g. `FL ID: Yes › REAL ID: No`. If `topic` is missing,
the chip falls back to the question text; if `summary` is missing, it falls back
to the choice's `label`. Add them anywhere the long-form text would be too verbose
in a chip. Each chip is clickable and rewinds the user to that step.

**`result`** — terminal node with outcome content and an optional signup:
```json
{
  "type": "result",
  "status": "clear",
  "heading": "You're all set!",
  "body": "Explanatory paragraph.",
  "links": [
    { "label": "Link text", "url": "https://..." }
  ],
  "signup": {
    "heading": "Stay informed",
    "body": "Optional sub-heading for the signup block.",
    "embed_code": "<!-- Paste Action Network embed snippet here -->",
    "an_tag": "short-identifier-for-this-outcome"
  }
}
```

`status` values: `clear` (green), `action_required` (orange), `ineligible` (red),
`under_construction` (yellow diagonal stripes — for placeholder branches awaiting content).
`signup` is optional — omit the key entirely to show no signup on that result.
`an_tag` is reserved for segmenting signups by path, but is **not yet wired up** —
`renderSignup()` in `embed.js` injects the embed code as-is and does not populate any
hidden field. Implement that when real AN embed codes replace the placeholders.

## CSS Namespacing

ALL styles must be scoped under `.cc-tool`. Never use bare element selectors (`p`, `h2`, etc.)
that could bleed into the host page. Use `.cc-tool p`, `.cc-tool h2`, etc.

## Accessibility Requirements

- Questions use `aria-labelledby` pointing to the question text element
- Answer buttons are `<button>` elements — keyboard navigable by default
- Result headings use `role="alert"` so screen readers announce the outcome
- Status is conveyed by both color AND structure (heading text, border) — never color alone

## Deploying

Push to `main` — GitHub Actions auto-deploys to GitHub Pages. The workflow uploads the
**entire repo** (`path: "."` in `deploy.yml`), so every tracked file is served publicly
from the Pages site, not just `src/` and `data/tree.json`.

Embed URL after deployment:
```
https://common-cause.github.io/florida-dpoc-tool/src/embed.js
```

## WordPress Embed Snippet

Paste this into a Gutenberg "Custom HTML" block on the target CC page:

```html
<div id="cc-tool"></div>
<script src="https://common-cause.github.io/florida-dpoc-tool/src/embed.js"></script>
```

No other changes needed. Updates to `main` go live automatically on every page using the embed.

## PII / Data Handling

Row-level PII (names, emails, phones, street addresses, gift amounts) **never gets
committed to git** — repos here are org-visible via shared corpora and export pipelines.
Any directory that will receive raw dumps or query results gets gitignored BEFORE the
first file lands (allowlist known-clean file types; never enumerate known-bad files).
Committed derivatives must be masked or aggregated; fabricate example rows in docs.
Row-level people-data lives in access-controlled systems (BigQuery, ROI, Action Network,
shared Sheets) — point at it, don't copy it. Full policy: knowledge library entry
`pii-handling-policy` (`kl_get`).
