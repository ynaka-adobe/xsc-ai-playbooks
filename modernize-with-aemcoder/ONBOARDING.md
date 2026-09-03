# Modernize a Site with the Experience Modernization Agent — Paste this into Claude Code

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with the first phase. (Human: you can just say "walk me
> through this" — but Claude should begin even if you don't.)

**XSC teammates:** this is **Path A**. It migrates an existing website's pages, design, and content into your EDS
repo using the **Experience Modernization Agent** (EMA) at **https://aemcoder.adobe.io/**. Copy this entire file,
paste it into your own **Claude Code or claude.ai chat** session, and say:

> Walk me through modernizing my site with aemcoder, one step at a time.

Claude hands you the **exact prompts** to paste into the aemcoder chat, confirms each step, and pauses for you. No
coding experience required.

> **Prerequisite:** you've completed **create-eds-repo.md** — repo created from your template, **AEM Code Sync
> installed** (https://github.com/apps/aem-code-sync), and the site provisioned. If not, do that first.

---

## Instructions for Claude (the assistant reading this file)

You are coaching an Adobe XSC product specialist — possibly non-technical — through an EMA migration. You **cannot
operate aemcoder.adobe.io** in any environment — it's a hosted chat agent the user drives in their own browser.
Your job is to verify setup, hand over copy-paste prompts, confirm each step, and troubleshoot.

**How to run this:**
- **Adapt to your environment.** In Claude Code, run version checks and fetch the preview URL for HTTP 200 yourself;
  in chat, ask the user to and report back (the preview URL is public — fetch it yourself if you have browsing).
- **Give one phase at a time** and wait for confirmation. Keep language plain; explain *why* in one sentence. Put
  every URL and every aemcoder prompt in its own code block.
- **Pre-fill prompts.** Gather up front — (1) the **source site URL**; (2) the **homepage URL** (first page to
  migrate); (3) any **additional page URLs**; (4) their **org** and **repo**; (5) any **CSS selectors** for block
  work — then hand the user prompts with the **real values already filled in** (no `<...>` left to edit), and show
  what you filled so they can eyeball it before sending.
- **EMA is conversational.** After a migrate prompt it often replies with **clarifying checkboxes** the user clicks
  in the aemcoder UI (they don't type the answer). Only the initial content-scope question does this in practice;
  the design/nav prompts run straight through.
- **Order gates (enforce):** migrate **one page before** any bulk import; complete **site-wide design before**
  per-block CSS.
- **Guardrails:** pushing code, uploading content, and publishing are outward-facing — summarize and get a clear
  "yes" before **Push / Upload / Publish**. Never have the user paste tokens (GitHub, Figma) into chat; tokens go
  only into the aemcoder/Figma **Settings** UI.

---

## Phase 1 — Prerequisite gate

Confirm the base is done (**create-eds-repo.md**):
- Repo created from the template.
- **AEM Code Sync installed** — https://github.com/apps/aem-code-sync (if you jumped straight here, open it and
  confirm the app is installed on your repo; re-run **Configure** to repair).
- Site provisioned; preview loads at `https://main--{repo}--{org}.aem.page/`.

If any are missing → go back to **create-eds-repo.md** first.

---

## Phase 2 — Connect to the Experience Modernization Agent

Ask: **is this your first time using aemcoder, or have you used it before?**

### First time
1. Open https://aemcoder.adobe.io/
2. Accept the **GitHub repository connection** popup → connect your new repo.
3. Run **Code Connector** (lets the AI touch your code + content repos) and **Code Sync** (event listeners between
   them), selecting your repo.
4. Read the confirmation email. "Could not find admin" → see Troubleshooting.

### Returning user (another site is already registered)
Because a previous site is registered, you must re-point aemcoder at **this** site:
1. **Connect** — so a **fresh token is applied to the current site**.
2. Click **Switch Site** → add the **new EDS site URL** (your preview URL, `https://main--{repo}--{org}.aem.page/`)
   → click **Verify** to **register the correct git repo + content repository**.

Console orientation: **Chat** (paste prompts; ~7 tasks per migration with live status), **Code** (push to GitHub),
**Content** (upload to DA), **Settings** (reset workspace, paste Figma token).

---

## Phase 3 — Migrate content (start with a SINGLE page)

Paste (Claude: fill `<SITE_URL>` with the real value):
```
Migrate <SITE_URL> to EDS
```
e.g. `Migrate toyotafinancial.com to EDS`

> **EMA replies with a scope question** — a set of **checkboxes** you click in the aemcoder UI:
> ☐ **Homepage only** · ☐ Specific pages · ☐ Discover & catalog site · ☐ Other

**⚠️ Check "Homepage only" and send.** Do one page first — it builds the import infrastructure any later bulk import
depends on. Answer any follow-up checkboxes, keeping scope to that one page.

**Then migrate the header and footer separately.** Page migration **excludes** the header & footer blocks (they're
site-wide chrome). Once the page completes:
```
migrate header block
```
```
migrate footer block
```
Run header, let it finish, then footer.

### Refine a block (especially the header — expect to iterate)

The header is the hardest block: every site has its own nuances, so **don't expect one prompt to finish it.** Work
**one change at a time** and verify after each. The reliable pattern:

1. **Screen-grab the exact area** from the **source site** — shows EMA what "good" looks like.
2. **Describe the single change** you want, precisely.
3. Send, check the result, repeat for the next thing.

Prompt template:
```
update the <block> block. <the one change you want>.
here is the source for reference: <paste screenshot / SVG / URL>
```
Real examples (illustrations, *not* a checklist): `please update header block. add the global top nav that includes
contact us, where to buy, and a language switcher` · `please add logo. here is SVG. <svg path…>`

> This same screenshot-and-describe loop is how you polish navigation and any block later (Phase 5).

### Optional — more pages
Ask the user: **"Do you want to migrate any other pages?"**
- **No** → move to design (Phase 4).
- **Yes** → only now, bulk-import (Claude: fill the real URLs):
  ```
  Migrate these pages: <URL1>, <URL2>, ... to EDS
  ```

---

## Phase 4 — Migrate design & tokens

**Tokens first** — they're the site's CSS variables that the design then references:
```
Migrate Design Tokens from <SOURCE_URL> to EDS
```

Then migrate design (two steps, in order — **site-wide design before per-block CSS**):
```
Migrate Design from <SOURCE_URL> to EDS
```
Step 1 → global palette, typography, spacing, base styles (`/styles/styles.css`). Step 2 → per-block CSS
(`/blocks/{name}/{name}.css`).

---

## Phase 5 — Polish: navigation & blocks

Use the **Refine a block** loop above (screenshot the source region + describe one delta) for anything below.

Navigation:
```
Setup navigation from <SOURCE_URL>
```
or
```
Fix Navigation Menu
```
Nav block = 3 sections: Brand, Sections/menu, Utility links (login, cart, language).

Block enhancement (be on `main`; use the real block name + a source selector):
```
please make the first section dark, content match the element <CSS_SELECTOR> on <SOURCE_URL>
```

Figma → block (optional, block-level only): create a figma.com account → Settings → Security → generate a personal
access token → paste it into aemcoder **Settings** (never into chat). In Figma select the block → right-click →
**Copy/Paste as → Copy link to selection**, then:
```
Create new block <block-name> using figma file: <FIGMA_SELECTION_LINK>
```

---

## Phase 6 — Sync your work back

**Code → GitHub:** left menu **Code → Workspace changes**. Stage "unstaged" files with **+**, then **Push** (main, or
a `pr-xxxx` branch for a versioned checkpoint). *Confirm with the user first — outward-facing.*

**Content → DA:** left menu **Content → Upload Content**. Confirm the DA repo; include the header only if you edited
it, otherwise select **index only**.

---

## Phase 7 — Validate & publish

Preview URL (Claude: fill and check HTTP 200):
```
https://main--{repo}--{org}.aem.page/
```
Open it and confirm the migrated content renders. (An unstyled header/footer before Phase 5 is expected, not an
error.)

Publish (go live — the live domain uses `.aem.live`) two ways:
- **Browser (default):** use **Traverse** to list all page URLs → paste into **Bulk Operations** → **Publish**.
- **Admin API + token (automatable):** the admin API needs a `publish` API key — unauthenticated calls return **401**.
  Create a key once (`POST https://admin.hlx.page/config/<org>/sites/<site>/apiKeys.json` with `{"roles":["publish"]}`),
  store it in `$AEM_PUBLISH_KEY` (**never paste the key into chat**), then `POST` `preview` then `live` per path with
  header `X-Auth-Token: $AEM_PUBLISH_KEY` (or the admin bulk job for many pages).

*Confirm before publishing — it's public.*

---

## Troubleshooting

**"Could not find admin"** — add your admin account in the AEM Code Sync bot wizard's **Users** step (see
`create-eds-repo`, Phase 3). No `-adobe` org naming is needed anymore.

**Returning user: aemcoder still points at the old site** — re-run Phase 2 returning-user steps: **Connect** (fresh
token) → **Switch Site** → add the new EDS site URL → **Verify**.

**Preview won't load / shows errors** — confirm AEM Code Sync is installed and the last push to `main` succeeded;
confirm content was uploaded to DA (at least the index); re-check the URL construct.

**Universal Editor doesn't work** — da-demo-kit uses DA with a custom `ak.js` framework, so UE isn't wired up by
default. Prompt aemcoder `Setup UE support for this project`, read the reply, and continue with `continue`. UE
connects to `{branch}--{site}--{org}.ue.da.live` (which cannot be loaded directly).

**Version history** — aemcoder shows limited history; clone the repo in Cursor/Claude Code for easy change history.

---

## Reference links

| Resource | Link |
|---|---|
| Prerequisite: create your EDS repo | `../create-eds-repo/ONBOARDING.md` |
| Experience Modernization Agent | https://aemcoder.adobe.io/ |
| AEM Code Sync app (installed in the base) | https://github.com/apps/aem-code-sync |
| da-demo-kit template | https://github.com/ynaka-adobe/da-demo-kit |
| Sample repo | https://github.com/ynaka-adobe/southwest |
| Sample live site | https://main--southwest--ynaka-adobe.aem.live/ |
