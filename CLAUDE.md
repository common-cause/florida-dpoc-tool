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

## Agent Automation & Dispatch

Two different mechanisms. Picking the wrong one wastes the build:

- **Deterministic pipeline → Civis.** Plain Python/dbt ETL, no judgment; tracked in
  this project's `civis/SCHEDULED_SCRIPTS.md`.
- **Judgment pass → local scheduled agent, via a dispatch contract.** Anything whose
  correctness depends on a rubric, world knowledge, or a call a human would otherwise
  make. Subscription Claude Code **cannot be invoked from Civis at all** — no API-key
  path there uses the subscription — so "a Civis job that exercises judgment" is
  unbuildable, not merely discouraged. Don't start building one.

Agent-dispatchable work is governed by the **Dispatch Treaty** (ratified 2026-08-20,
in force since 2026-08-25; law: meta-project `docs/dispatch_treaty.md`). The
rob-assistant "tower" spawns headless agents at named task types that a project
declares in a committed contract. Live fleet status — who has declared what, and what
is actually granted — is the meta-project's generated `dispatch/roster.yaml`; don't
trust a count written in prose anywhere, including here.

**To make a task type in this project dispatchable:**

1. Write `.claude/dispatch.yaml` from the meta-project's `templates/dispatch.yaml`
   (one file, all of this project's task types). **Absence of that file means
   hands-off** — eligibility is declared, never inferred, and no stub is wanted for
   an interactive-only project.
2. Package the procedure itself as the runbook the contract points at — a skill at
   `.claude/skills/<name>/SKILL.md`, or a doc under `docs/`.
3. Confirm **git can see the contract.** A blanket `.claude/*` gitignore swallows it
   silently; add `!.claude/dispatch.yaml`. A contract git can't see does not exist.
4. Validate from the meta-project: `python sync_projects.py --check`, then
   `--dispatch-roster`.
5. **Stop there.** Tiers are dated grants that live only in the meta catalog
   (`projects_index.yaml`), and **only Rob grants one** — an agent proposes, never
   self-authorizes. An ungranted contract is the correct resting state: the roster
   computes `dispatchable: false` and nothing fires.

Do not register a Windows Task Scheduler job for an agent pass either — scheduled
fires go through the tower, or they earn no track record. Background and the
scheduler mechanics: knowledge library entries `dispatch-treaty-and-the-tower` and
`local-scheduled-claude-agents-task-scheduler-the-pattern-for-recurring-agentic-p`
(`kl_get`).
