# XSC AI Playbooks

AI toolsets that help Adobe XSC teammates build AEM demos fast — **one plugin per product**, plus a concierge that
routes you to the right one. **No coding experience required.**

**▶ Browse the catalog:** **https://ynaka-adobe.github.io/xsc-ai-playbooks/** — open a playbook, click **Copy for
Claude**, paste into Claude.

## The model: two axes

Every demo is **product × vertical**:

- **Product** — which AEM capability you're demoing → picks the **toolset (plugin)**: `aem-edge-delivery` today;
  `aem-assets`, `aem-guides` next.
- **Vertical** — which customer industry the demo is themed for → picks the **base template** the toolset stamps
  from (manufacturing, retail, financial services, …). Vertical is *data* (a base-template registry), not code, so
  the same skills build a demo for any industry.

## Layout

```
xsc-ai-playbooks/                        ← this repo = the marketplace (ynaka-adobe)
├── .claude-plugin/marketplace.json      ← lists every plugin below
├── plugins/
│   ├── xsc/                             ← Layer 1: the concierge (routing + update)
│   │   └── skills/ (create-demo, update-plugin)
│   └── aem-edge-delivery/               ← Layer 2: the EDS demo toolset
│       ├── skills/ (eds-readiness, create-base-template, create-eds-repo,
│       │            modernize-with-aemcoder, add-adobe-target, sync-da-content,
│       │            merge-back-to-base-template)
│       └── verticals.json               ← vertical → base-template registry
├── scripts/gen-catalog.mjs             ← generates /docs from the skills
└── docs/                                ← GitHub Pages catalog (generated — do not hand-edit)
```

## Install (in Claude Code)

```bash
claude plugin marketplace add ynaka-adobe/xsc-ai-playbooks
claude plugin install xsc@ynaka-adobe                 # the concierge — start here
claude plugin install aem-edge-delivery@ynaka-adobe   # the EDS toolset
```
Then restart Claude Code. Not sure where to start? Run the concierge: **`/create-demo`**.

## Adding things

- **A new playbook** → add a skill under `plugins/<product>/skills/<name>/SKILL.md`. The catalog regenerates on
  commit. (Don't edit `/docs` by hand — it's generated.)
- **Reusable skill resources** → keep them alongside `SKILL.md` in the skill's `assets/` directory, inside
  the registered plugin root. Resolve them relative to the loaded skill, not the destination repo. The
  `add-adobe-target` skill includes pinned non-secret EDS assets and a source-to-destination manifest;
  invoke `/aem-edge-delivery:add-adobe-target` in Claude Code in a clean or existing EDS repo with
  `aem-edge-delivery` loaded (or select the host's exposed `add-adobe-target` skill). To try an unpublished
  checkout, start Claude Code in the EDS repo with
  `claude --plugin-dir /absolute/path/to/xsc-ai-playbooks/plugins/aem-edge-delivery`.
  Generated catalog pages are documentation, not installed resource bundles.
- **A new product toolset** (e.g. `aem-assets`) → add `plugins/aem-assets/` (with `.claude-plugin/plugin.json` +
  `skills/`) and one entry in `marketplace.json`. It shows up in the catalog and concierge automatically.
- **A new vertical** → add an entry to the product's `verticals.json` (a `label` + a `template` repo). No code change.

## Dev workflow

Edit a **skill** → commit (the pre-commit hook bumps the changed plugin's version and regenerates `/docs`) →
run **`./sync.sh`** (push + refresh marketplace + update installs) → restart Claude Code. GitHub Pages rebuilds
`/docs` automatically on push. `node scripts/gen-catalog.mjs --check` fails if `/docs` is stale (CI-ready).

No hook installed (e.g. a PR from the web UI or an agent)? The **Bump plugin versions** GitHub Action is the
backstop: on every push to `main` it bumps the patch version of any plugin whose files changed without a version
bump, regenerates `/docs`, and commits the result.

---

*Part of the XSC effort to incorporate AI for greater efficiency.*
