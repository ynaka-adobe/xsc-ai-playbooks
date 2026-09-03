# Add Adobe Target to an EDS Demo — Paste this into Claude Code or claude.ai chat

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with Step 0. (Human: you can just say "walk me through
> this" — but Claude should begin even if you don't.)

**XSC teammates:** this playbook adds **Adobe Target** to an EDS site so you can show personalization /
experience targeting (e.g. a targeted hero or a Target-driven offer). It assumes your site was built from a
**base that doesn't already include Target** — a standard EDS boilerplate (e.g. `aem-boilerplate`) or a base
template you haven't added Target to yet — so this playbook imports the Target pieces from `da-demo-kit` (the
canonical source) and wires them in. Copy this entire file, paste it into your own **Claude Code or claude.ai
chat** session, and say:

> Walk me through adding Adobe Target to my EDS demo, one step at a time.

You do **not** need to set up Target credentials or App Builder — the imported tool points at a shared demo
runtime. You **do** need one-time access to the shared demo Target instance (Step 0).

> **Base template already has Target?** If your demo was built from **`da-demo-kit`** or your **own base template
> that you already merged Target into**, every component below already ships in your repo — skip Steps 1 and 2
> (import + wiring) and go straight to Step 3 (enable in `head.html`).

> **Reuse this next time:** adding Target is exactly the kind of customization worth folding back into your base
> template. Once it works here, use the **MANIFEST** at the end of this playbook with **merge-back-to-base-template.md**
> to fold it into your base template — then every future demo already has it and you'll skip Steps 1–2 from then on.

---

## Instructions for Claude (the assistant reading this file)

You are helping an Adobe XSC product specialist — possibly non-technical — add Adobe Target to an EDS site whose
base **does not already include Target** (a standard boilerplate, or the user's own base template before Target
was merged in), so the Target code/blocks/tools must be imported from `da-demo-kit` (the canonical source) first.
The site, its GitHub repo, and its DA content already exist.

**How to run this:**
- **Detect the starting point.** Check whether the repo already has `scripts/target.js` and `deps/at/`. If yes
  (built from `da-demo-kit`, or a base template that already has Target merged in), skip the import + wiring
  steps. If no, do them.
- **Adapt to your environment (works in both Claude Code and Claude chat).** In Claude Code (or cowork), fetch
  the files from the da-demo-kit URLs below and write them into the repo, edit `scripts.js`, and verify the
  preview yourself. In claude.ai chat (no machine access), give the user the exact files to copy from the
  GitHub URLs, the exact `scripts.js` edit, and have them report back. The workflow is identical; only *who
  runs it* changes.
- **Start with Step 0 (access provisioning)** — it can take time, so have the user kick it off first.
- Go one step at a time; confirm each before the next. Keep language plain and explain *why*. Put every URL,
  command, and snippet in its own code block.
- **Guardrails:** pushing code and publishing are outward-facing — summarize and get a clear "yes" first. Never
  ask the user to paste secrets into chat (none are needed here).
- **Prerequisite check:** confirm a working demo (a repo + a preview URL that loads). If not, send them to the
  **Create an EDS Demo** playbook first.

---

## Prerequisite

A demo already built and previewing at `https://main--{repo}--{org}.aem.page/`. If you don't have one yet, run
the **Create Your EDS Repo** (`create-eds-repo.md`) playbook first.

---

## Step 0 — Get access to the shared demo Target instance (one-time)

The demo uses a shared Target instance on the **acsmarketing** org. Request access once via this automated
provisioning link:

```
https://acrs.adobe.com/go/6bff542e-f709-499f-8156-57e0fc914510
```

Provisioning isn't always instant — kick it off now, then continue while it completes. You'll know it worked
when the Target activity library (Step 6) loads for you.

> Why: the shared runtime and the Target UI both operate against the acsmarketing instance. Without access, the
> tool and the activity library come back empty.

---

## Step 1 — Import the Target components from da-demo-kit

*(Skip this whole step if your site was built from da-demo-kit — you already have these.)*

Copy these from `da-demo-kit` into the **same paths** in your repo:

| Copy from da-demo-kit | Into your repo at | Why it's needed |
|---|---|---|
| [`scripts/target.js`](https://github.com/ynaka-adobe/da-demo-kit/blob/main/scripts/target.js) | `scripts/target.js` | **Required.** Client module: reads the `target` metas, loads at.js, runs the page-load / hero-mbox logic. |
| [`deps/at/`](https://github.com/ynaka-adobe/da-demo-kit/tree/main/deps/at) (both `at.js` **and** `vendor-at.js`) | `deps/at/` | **Required.** `at.js` is the loader `target.js` imports; `vendor-at.js` is at.js 2.11.8 **downloaded from the acsmarketing instance** — i.e. the Target embed code for this demo. |
| [`blocks/target-offer/`](https://github.com/ynaka-adobe/da-demo-kit/tree/main/blocks/target-offer) (`.js`, `.css`, `metadata.json`) | `blocks/target-offer/` | The authorable Target offer block. |
| [`tools/target/`](https://github.com/ynaka-adobe/da-demo-kit/tree/main/tools/target) | `tools/target/` | The DA tool that lists/creates Target activities via the shared runtime. |
| [`tools/sidekick/config.json`](https://github.com/ynaka-adobe/da-demo-kit/blob/main/tools/sidekick/config.json) — the `target` **plugin entry** only | merge into your `tools/sidekick/config.json` | Adds the sidekick **Target** deep-link. Merge this entry into your existing `plugins` array (don't overwrite the file). |
| [`ue/models/blocks/target-offer.json`](https://github.com/ynaka-adobe/da-demo-kit/blob/main/ue/models/blocks/target-offer.json) | `ue/models/blocks/` | **Optional** — only if you author the block in Universal Editor. |

The `target` sidekick plugin entry to merge:
```json
{
  "id": "target",
  "title": "Target",
  "url": "https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary",
  "passConfig": true,
  "environments": ["preview", "live", "edit"],
  "includePaths": ["**"]
}
```

> `scripts/target.js`, `deps/at/at.js`, and `blocks/target-offer/target-offer.js` all import `getMetadata` from
> `scripts/aem.js`, which a standard boilerplate already has — so they drop in without changes.
> **Do NOT import** `workers/website/handlers/target.js` — that's edge-worker infra a standard boilerplate
> doesn't use, and the demo doesn't need it.

---

## Step 2 — Wire `scripts/target.js` into `scripts/scripts.js`

*(Skip if you started from da-demo-kit — already wired.)*

The imported module does nothing until `scripts.js` calls it. Add the import near the other imports:

```js
import { loadTarget, applyTargetHeroMboxIfConfigured } from './target.js';
```

Then, inside `loadPage()` (or `loadLazy`), call both **after** the lazy phase and before `loadDelayed()`:

```js
async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await loadTarget();                       // ← add
  await applyTargetHeroMboxIfConfigured();  // ← add
  loadDelayed();
}
```

> Why: `loadTarget()` reads the `target` meta and boots at.js; `applyTargetHeroMboxIfConfigured()` applies a
> hero-mbox swap if you configured one in `head.html` (Step 3).

---

## Step 3 — Enable Target in `head.html`

Add the Target meta tags to `head.html` (in da-demo-kit these ship commented-out; in a boilerplate you add
them):

```html
<meta name="target" content="1"/>
<meta name="target-at-js" content="/deps/at/vendor-at.js"/>
```

To target a specific block, add an mbox meta + a CSS selector for the element it should replace — e.g. the hero:

```html
<meta name="target-mbox-hero" content="eds-hero-mbox"/>
<meta name="target-mbox-hero-selector" content=".hero.block .hero-inner"/>
```

- `target` = `1` is what turns Target on for the page; `target-at-js` points at the at.js you imported.
- The `-mbox-*` name is the mbox Target serves into; the `-selector` is the element it swaps — **they must
  match**, and the selector must point at an element that actually exists on the page.

> Note: if your site sets a **Content-Security-Policy**, make sure `script-src` allows at.js to run (da-demo-kit
> ships a permissive CSP for exactly this). A plain boilerplate with no CSP is fine as-is.

---

## Step 4 — Push and confirm at.js loads

Push the code, then reload the preview and confirm Target is active:

- In Claude Code (or chat with browsing): fetch the preview URL and check the page loads `/deps/at/vendor-at.js`.
- Otherwise: open the preview → DevTools → Network → reload → look for `vendor-at.js` loading without errors.

If it doesn't load: re-check `head.html` has `target` = `1`, that `scripts.js` was wired (Step 2), and that the
code was pushed.

---

## Step 5 — Author a Target offer in content (optional but recommended)

Add a **target-offer** block in DA on the page where you want the personalized offer. It's an authorable slot
Target can populate — great for the demo narrative. (First single-cell row = the mbox name, optionally.)

---

## Step 6 — Create or view the Target activity

Uses the shared acsmarketing instance through the runtime the imported tool points at — no credentials to set
(once Step 0 access is provisioned).

**Option A — DA Target tool:** open the **Target** tool in your site's DA workspace. It lists activities,
offers, and audiences, and can create an XT (experience-targeting) activity — pick the mbox (e.g.
`eds-hero-mbox` from Step 3), an offer, and an audience.

**Option B — Target UI via the sidekick:** use the sidekick **Target** plugin (added in Step 2), which deep-links to:
```
https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary
```

> Point the activity's mbox at the same mbox name you set in `head.html` (Step 3) so the two line up.

---

## Step 7 — Verify the targeted experience

Reload the preview and confirm the targeted content renders in the element your selector points at:

- The activity's mbox must match the `target-mbox-*` meta name from Step 3.
- The selector must match a real element on the page.
- Give at.js a moment; a hard reload helps.

When the targeted content appears in the right spot, Target is working in your demo.

---

## Troubleshooting

- **Nothing personalizes / `vendor-at.js` not loading** → `head.html` missing `target` = `1`, `scripts.js` not
  wired (Step 2), `deps/at/` not imported, or code not pushed.
- **`loadTarget is not a function` / import error** → `scripts/target.js` wasn't imported into `scripts.js`, or
  the file path is wrong.
- **at.js loads but no swap** → the `-mbox-*` name doesn't match the activity's mbox, or the `-selector` doesn't
  match an element that exists on the page.
- **Activity library empty / can't open the Target UI** → your access to the acsmarketing instance isn't
  provisioned yet — complete Step 0 (`https://acrs.adobe.com/go/6bff542e-f709-499f-8156-57e0fc914510`) and wait.
- **Sidekick has no Target button** → the `target` plugin entry wasn't merged into `tools/sidekick/config.json`
  (Step 1).
- **After any change** → push code and reload the preview.

---

## Integration Manifest — Adobe Target

This is the portable definition of the Target integration. Hand it to **merge-back-to-base-template.md** to fold
Target into your base template. All paths are **`source path → same dest path`** unless noted.

```
integration: adobe-target

files:
  - scripts/target.js                         # client module: reads target metas, loads at.js, page-load/hero-mbox logic
  - deps/at/at.js                             # at.js loader that target.js imports
  - deps/at/vendor-at.js                      # at.js 2.11.8 downloaded from the acsmarketing instance (the Target embed)
  - blocks/target-offer/                      # authorable Target offer block (.js, .css, metadata.json)
  - tools/target/                             # DA tool: lists/creates Target activities via the shared runtime

merge:                                        # add an entry, do NOT overwrite the file
  - tools/sidekick/config.json                # add the `target` plugin entry to plugins[] (see below)
  - DA library sheet                          # add the target-offer block row so it's authorable in DA

optional:
  - ue/models/blocks/target-offer.json        # only if you author the block in Universal Editor

notes:
  - head.html                                 # add: <meta name="target" content="1"/> and
                                              #      <meta name="target-at-js" content="/deps/at/vendor-at.js"/>
                                              #      (in da-demo-kit these ship commented-out)
  - CSP                                        # script-src must allow at.js to run (da-demo-kit ships a permissive CSP)
  - access                                     # requires Step 0 access to the shared acsmarketing Target instance

exclude:
  - workers/website/handlers/target.js        # edge-worker infra a standard boilerplate doesn't use — do NOT copy
```

The `target` sidekick plugin entry to merge into `plugins[]`:
```json
{
  "id": "target",
  "title": "Target",
  "url": "https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary",
  "passConfig": true,
  "environments": ["preview", "live", "edit"],
  "includePaths": ["**"]
}
```

---

## Reference links

| Resource | Link / path |
|---|---|
| Create your EDS repo (base) | `../create-eds-repo/ONBOARDING.md` |
| Merge this integration into your base template | `../merge-back-to-base-template/ONBOARDING.md` |
| **Target access provisioning (Step 0)** | https://acrs.adobe.com/go/6bff542e-f709-499f-8156-57e0fc914510 |
| Source: `scripts/target.js` | https://github.com/ynaka-adobe/da-demo-kit/blob/main/scripts/target.js |
| Source: `deps/at/` (at.js loader + instance vendor-at.js) | https://github.com/ynaka-adobe/da-demo-kit/tree/main/deps/at |
| Source: `blocks/target-offer/` | https://github.com/ynaka-adobe/da-demo-kit/tree/main/blocks/target-offer |
| Source: `tools/target/` | https://github.com/ynaka-adobe/da-demo-kit/tree/main/tools/target |
| Source: `tools/sidekick/config.json` | https://github.com/ynaka-adobe/da-demo-kit/blob/main/tools/sidekick/config.json |
| Target activity library (demo tenant) | https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary |

---

*Workfront and Send-to-Workfront (approval → publish) are planned as their own playbooks later.*
