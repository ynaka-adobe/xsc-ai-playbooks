# Create Your EDS Repo — Paste this into Claude Code

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with the first phase. (Human: you can just say "walk me
> through this" — but Claude should begin even if you don't.)

**XSC teammates:** this is the **base** step for every demo. It creates your customer repo from a template,
installs **AEM Code Sync**, and completes the **bot setup wizard** — which creates the **content repository**, the
**EDS site**, and the **admin user**. It then **ends at a fork** where you choose your path. Copy this entire file,
paste it into your own **Claude Code or claude.ai chat** session, and say:

> Walk me through creating my EDS repo, one step at a time.

**Both paths start here.** When the base is done you'll pick:
- **Path A — Modernize a real site** with the Experience Modernization Agent (aemcoder) → **modernize-with-aemcoder.md**
- **Path B — Start from sample pages** (DA Block Collection) and build tool integrations → an integration playbook (e.g. **add-target.md**)

**No coding experience required.**

---

## Instructions for Claude (the assistant reading this file)

You are guiding an Adobe XSC product specialist — possibly non-technical — through creating the **base EDS repo**
that every demo builds on. The repo is created from a **base template** (the shared `ynaka-adobe/da-demo-kit`, or
the user's **own** base template from **create-repo-template.md**). This playbook **ends at a fork** — it does not
migrate content or build integrations itself; it hands off to Path A or Path B.

**How to run this:**
- **Adapt to your environment (works in both Claude Code and Claude chat).** If you have terminal / browsing tools
  (Claude Code or cowork), run the checks and, with the user's clear go-ahead, create the repo with `gh` and fetch
  the preview URL yourself. In claude.ai chat, ask the user to run commands / click through the browser and report
  back. The workflow is identical; only *who runs it* changes.
- Give **one step at a time**; confirm before moving on. Keep language plain; explain *why* each step matters in one
  sentence. Put every URL and command in its own code block.
- **Gather up front** (skip any you can infer): (1) customer/site name → repo name, lowercase, no spaces;
  (2) their GitHub owner — their **personal account** (or any org they like; no `-adobe` naming needed);
  (3) **which base template** — shared `ynaka-adobe/da-demo-kit` or their own `<owner>/<template-name>` (use it
  everywhere Phase 2 says `<TEMPLATE>`; default `ynaka-adobe/da-demo-kit`); (4) whether it's their first time
  (needs the Phase 1 setup).
- **Guardrails:** creating a repo and installing GitHub apps are outward-facing — summarize and get a clear "yes"
  first. Never have the user paste tokens into chat. The user owns their accounts — you guide, you don't sign in
  for them.

> **No GitHub org or `-adobe` naming is required.** Repos live under the user's personal GitHub account (an org is
> optional; any name works). The demo's **admin** is set by the AEM Code Sync bot wizard's **Users** step (Phase 3),
> not by an org name.

---

## Phase 1 — Prerequisites

The user needs **readiness** done: a GitHub account (Adobe email recommended, not required). No org or special
naming is needed. If not done, point them to **readiness.md** and stop here.

Confirm tools (run these, or in chat ask the user to and paste results):
```bash
gh auth status
git --version
```
`gh` isn't required — every step here can be done in the browser — but it lets Claude create the repo for you.

> **Template choice:** are you building from the **shared** `ynaka-adobe/da-demo-kit`, or **your own** base template
> (from **create-repo-template.md**)? Whichever you pick is `<TEMPLATE>` below. Default: `ynaka-adobe/da-demo-kit`.

---

## Phase 2 — Create your customer repo from the template

Your `<TEMPLATE>` bundles demo functionality (Target integration, Workfront integration, Send-to-Workfront
approval/publish).

**In the browser (recommended):**
1. Open `https://github.com/<TEMPLATE>` → **Use this template → Create a new repository**.
2. Name = customer/site name (lowercase, no spaces, e.g. `southwest`); Owner = your GitHub account (or any org);
   Visibility = **Public**.

**Or with the GitHub CLI (if `gh auth status` shows you're logged in) — confirm first:**
```bash
gh repo create <owner>/<name> --template <TEMPLATE> --public
```

---

## Phase 3 — Install AEM Code Sync & complete the bot setup wizard

This is the heart of the base: it replaces the old AEM publish server with the edge microservices **and** creates
your content repository, EDS site, and admin user.

1. Open https://github.com/apps/aem-code-sync → **Configure**.
2. Select your GitHub account (or org) → **Only select repositories** → pick the **new demo repo you just created**
   → **Install & Authorize**.
   > ⚠️ Install it on the **demo repo only — NOT your base template repo.** The base template is just a source you
   > stamp new repos from; it's never previewed or published, so it never needs Code Sync. If the app is already
   > installed, you don't reinstall — just **add this new repo** to the selected repositories (and make sure the
   > base template is *not* in that list).
3. Installing redirects to a **multi-step setup wizard** at `tools.aem.live/bot/setup` (prefilled with your
   org / site / content URL). **Complete all steps:**

| Step | What you do |
|---|---|
| **1 · Code** | Confirm AEM Code Sync is connected to your GitHub repo and **authorize** it. |
| **2 · Content** | Select **Document Authoring (DA)** as the source and confirm the content source URL (e.g. `https://content.da.live/<owner>/<site>/`). Adjust the suffix only if needed. |
| **3 · Users** | **Add your admin account here.** Add org-level users (all sites) and/or site-level users. This is what grants your admin access — it replaces the old `-adobe` org convention. |
| **4 · Finish** | Review the summary → **Save**. You'll see **"Your site is ready"** with the content portal, **Preview** (`.aem.page`) and **Live** (`.aem.live`) URLs. |

> Why this matters: the wizard's **Content** step wires your DA content repository to the site, the **Users** step
> sets your admin, and **Finish** provisions the EDS site. If you ever see **"could not find admin"** later, add your
> admin account in the **Users** step — see Troubleshooting.

> `da.live/start` is the alternative/fallback for wiring DA content if the wizard's Content step doesn't cover your
> case; normally the wizard is the primary path.

---

## Phase 4 — Sync config (from da-demo-kit)

**Do this before seeding content.** The site needs its **config store** (data, library, apps, prepare) in place
*first*, so that when content is seeded (Phase 5) it renders with the right blocks, templates, and tool/integration
wiring. An empty config = seeded content that doesn't render correctly.

Config is a **`PUT` to `admin.da.live/config`** (not a content write), so — unlike content — it needs a DA
credential **and** a per-org permission grant (handled by **sync-da-content.md** / the `sync-config` action):

1. **Grant your org `write`** — in your org's `da.live/config` → **`permissions`** sheet, add four rows (both IMS
   orgs, `write` on `CONFIG` and `/ + **`). Exact rows + screenshot in **sync-da-content.md**. Skip if already
   granted — org-level grants cover every site in the org.
2. **Run the config sync — Claude calls the action itself** (via terminal/`curl` or a fetch tool; do **not** hand
   the user a URL to click). In claude.ai chat without those tools, the user runs it and reports back:
   ```bash
   curl -s "https://332794-dademokitappbuilder.adobeioruntime.net/api/v1/web/da-demo-kit/sync-config?targetOrg=<owner>&targetRepo=<site>"
   ```
   The server-side action mints an IMS token from its stored S2S credential, reads da-demo-kit's config, and PUTs it
   to the site. Confirm `{"success":true}`.
3. **Sync the credential sheets — also Claude-invoked.** `sync-config` copies the config store but **not** the
   `.da/*` credential sheets, so sync both separately:
   ```bash
   curl -s "https://332794-dademokitappbuilder.adobeioruntime.net/api/v1/web/da-demo-kit/sync-da-sheet?targetOrg=<owner>&targetRepo=<site>&sheetPath=.da/adobe-target.json"
   curl -s "https://332794-dademokitappbuilder.adobeioruntime.net/api/v1/web/da-demo-kit/sync-da-sheet?targetOrg=<owner>&targetRepo=<site>&sheetPath=.da/adobe-workfront.json"
   ```
   **Never** sync `.da/adobe-da.json` — that's da-demo-kit's private `DA_Token` and must not be copied to a target.

Verify at `https://da.live/config#/<owner>/<site>/` — the **data / library / apps / prepare** tabs should be present,
and `<owner>/<site>`'s `.da/` folder should contain `adobe-target.json` and `adobe-workfront.json`.

> **Why config needs setup that content doesn't:** content writes go through your own DA connector (no key); **config
> needs the permission grant + credential**. A **403** on the config write = the permissions grant is missing.

---

## Phase 5 — Seed default content (from da-demo-kit)

With config in place, seed the content. Every new demo's content repo starts **empty**, so the preview is blank
until seeded. Seed it with da-demo-kit's sample content (homepage, nav, footer) so the demo renders immediately —
Path A then migrates real content over it; Path B builds integrations on it.

**Content gate** — first check whether content already exists (list the DA sources for the new site, or fetch the
preview URL for HTTP 200). If it already has content, skip this phase.

**Preferred — AEM DA content tools (when the DA MCP is connected):** the copy is **cross-org**, and `da_copy_content`
only works *within* one site, so **read from the source and write to the new site**:
- Source (`da_list_sources` / `da_get_source`): org `ynaka-adobe`, repo `da-demo-kit` — root files `index.html`,
  `nav.html`, `footer.html`, `metadata.json`, plus the `docs/` folder.
- Destination (`da_create_source`): org `<owner>`, repo `<demo>`, same paths.

**Browser fallback (always works):**
- In `da.live`, open `https://da.live/#/ynaka-adobe/da-demo-kit`, select the pages → **Copy** → open
  `https://da.live/#/<owner>/<demo>` → **Paste**; **or**
- `https://da.live/start` → enter the repo → **Go** → step 2 select **AEM Block Collection** (**do NOT use Author
  Kit** with this template) → creates the same sample pages.

**Publish** the seeded pages (*confirm first — it's public*), then **verify** `https://main--<demo>--<owner>.aem.page/`
returns HTTP 200 with the homepage. Two ways to publish:
- **Browser (default):** Sidekick or Traverse → **Bulk Operations → Publish** (works because you're logged in).
  📹 **Video tutorial — bulk publish with the DA app:**
  https://ynaka-adobe.github.io/xsc-ai-playbooks/assets/bulk-publish.mp4
  Offer this link whenever the user needs to publish manually (e.g. programmatic publish isn't set up).
- **Admin API + token (automatable):** the admin API needs a `publish` API key — unauthenticated calls return **401**.
  Create a key once (`POST https://admin.hlx.page/config/<owner>/sites/<site>/apiKeys.json` with
  `{"roles":["publish"]}`, shown once), store it in `$AEM_PUBLISH_KEY` (**never paste the key into chat**), then for
  each path `POST` `preview` then `live` with header `X-Auth-Token: $AEM_PUBLISH_KEY` (or use the admin bulk job for
  many pages).

---

## Phase 6 — Fork: state your intention

The base is done and the site has config **and** default content. Ask the user which path they want, and hand off:

### Path A — Modernize a real site with the Experience Modernization Agent
> You want to migrate an existing website's pages, design, and content into this repo.

➡️ **Continue in `modernize-with-aemcoder.md`.** This base playbook ends here.

### Path B — Build tool integrations
> You want to build integrations (Target, Workfront, etc.) on the default content seeded in Phase 5.

➡️ **Continue in an integration playbook** (e.g. **add-target.md**). When the integration works, finish with
**merge-back-to-base-template.md** to fold it into your base template.

---

## Troubleshooting

**"Could not find admin" after the wizard** — add your admin account in the bot wizard's **Users** step (Phase 3).
Re-run https://tools.aem.live/bot/setup if you skipped it. (No `-adobe` org naming is needed anymore.)

**Preview won't load** — confirm the bot wizard's **Finish** step saved, the last push to `main` succeeded, and (Path B)
that content was published. Re-check the URL construct `https://main--{repo}--{owner}.aem.page/`.

**Wizard didn't appear after install** — open it directly: `https://tools.aem.live/bot/setup` (it reads your
org/site), or re-run **Configure** on https://github.com/apps/aem-code-sync.

---

## Reference links

| Resource | Link |
|---|---|
| Shared base template (default) | https://github.com/ynaka-adobe/da-demo-kit |
| Make your own base template | `../create-repo-template/ONBOARDING.md` |
| AEM Code Sync app | https://github.com/apps/aem-code-sync |
| Bot setup wizard | https://tools.aem.live/bot/setup |
| Document Authoring wizard (Path B sample content) | https://da.live/start |
| Path A: modernize with aemcoder | `../modernize-with-aemcoder/ONBOARDING.md` |
| Path B example: add Adobe Target | `../add-target/ONBOARDING.md` |
| Final step: merge a feature into your base template | `../merge-back-to-base-template/ONBOARDING.md` |
