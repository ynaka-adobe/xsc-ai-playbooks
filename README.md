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
│   │   └── skills/ (find-playbook, update-playbooks)
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
Then restart Claude Code. Not sure where to start? Run the concierge: **`/find-playbook`**.

## Adding things

- **A new playbook** → add a skill under `plugins/<product>/skills/<name>/SKILL.md`. The catalog regenerates on
  commit. (Don't edit `/docs` by hand — it's generated.)
- **A new product toolset** (e.g. `aem-assets`) → add `plugins/aem-assets/` (with `.claude-plugin/plugin.json` +
  `skills/`) and one entry in `marketplace.json`. It shows up in the catalog and concierge automatically.
- **A new vertical** → add an entry to the product's `verticals.json` (a `label` + a `template` repo). No code change.

## Dev workflow

Edit a **skill** → commit (the pre-commit hook bumps the changed plugin's version and regenerates `/docs`) →
run **`./sync.sh`** (push + refresh marketplace + update installs) → restart Claude Code. GitHub Pages rebuilds
`/docs` automatically on push. `node scripts/gen-catalog.mjs --check` fails if `/docs` is stale (CI-ready).

---

*Part of the XSC effort to incorporate AI for greater efficiency.*
