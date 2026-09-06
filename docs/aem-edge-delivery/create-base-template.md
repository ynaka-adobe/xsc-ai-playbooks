
# Create Your Own Base Template

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as
> background reference and don't wait for a separate instruction — **start now**: follow the steps below and guide
> the user through them one at a time, beginning with the first phase. (Human: you can just say "walk me through
> this" — but Claude should begin even if you don't.)
>
> _Auto-generated from the `create-base-template` plugin skill. Edit the skill, not this file._

Guide an Adobe XSC product specialist — possibly non-technical — through creating a **reusable base template
repository** for AEM Edge Delivery (EDS) demos. Most commonly this is a **vertical base template** — a template
themed for a customer industry (retail, financial services, public sector, …) that doesn't have one yet — but it can
also just be the user's personal template. The base template is the launch point for every demo; over time the user
merges demo customizations back into it so it accumulates reusable functionality. A vertical template, once created,
is registered in `verticals.json` so `create-eds-repo` offers it automatically.

**Lifecycle (state it plainly if the user is unsure why they're here):**
1. **This playbook** → create a base template repo (once).
2. **`create-eds-repo`** → for each customer, create a demo repo *from* the base template.
3. **Customize** → build something new in the demo (e.g. a Target integration).
4. **`merge-back-to-base-template`** → fold that customization into the base template so the next demo inherits it.

## How to run this

- **MANDATORY — ask with clickable dialogs.** You MUST call the AskUserQuestion tool for these and NEVER present a numbered/bulleted prose option list. Whenever you need input or a choice from the user (starter, template name), ask
  via a clickable AskUserQuestion dialog — use the free-text box for open answers and options for choices — instead
  of prose questions.
- Adapt to your environment: if you have terminal tools, run checks and (with a clear go-ahead) create the repo with
  `gh`; otherwise give exact browser clicks and have the user report back.
- One step at a time; confirm before moving on. Explain *why* in one sentence.
- Guardrails: creating a repo and marking it a template are outward-facing — summarize and get a clear "yes" first.
  Never have the user paste tokens into chat.

## Step 0 — Prerequisites

The user needs the `eds-readiness` setup done (a GitHub account). Confirm:
```bash
gh auth status
```
If `gh` isn't installed, every step here can be done in the browser.

## Step 1 — Pick a starter

| Starter | Best when | Repo |
|---|---|---|
| **da-demo-kit** (recommended) | Want demo functionality wired up (Target, Workfront, Send-to-Workfront, the `ak.js` framework). | `https://github.com/ynaka-adobe/da-demo-kit` |
| **aem-boilerplate** | Want a clean, minimal EDS start and to add your own functionality. | `https://github.com/adobe/aem-boilerplate` |
| An existing repo of your own | You've already built something to standardize on. | your repo |

## Step 2 — Copy the starter (copy, don't fork)

**Copy as a template — do not fork.** A *copy* gives a clean, independent repo with no upstream tie and a fresh
history, so you fully own it, can mark it as a template, and merge your own work in freely. A *fork* stays linked
upstream, is capped at one per account, and can't cleanly become a template repo.

**Browser:** open the starter → **Use this template → Create a new repository** → Owner = your GitHub account (or
any org) → Name = your base template name (e.g. `<username>-demo-kit`) → Visibility **Public** → create.

**GitHub CLI (confirm first):**
```bash
gh repo create <owner>/<template-name> --template ynaka-adobe/da-demo-kit --public
```

## Step 3 — Mark the repo as a template

**Browser:** repo → **Settings** → **General** → check **✅ Template repository**.
**CLI (confirm first):** `gh repo edit <owner>/<template-name> --template`
Verify: `gh repo view <owner>/<template-name> --json isTemplate` → expect `{"isTemplate": true}`.

## Step 4 — Confirm and register

- ✅ Repo `<owner>/<template-name>` exists, is **Public**, marked **Template repository**.
- **If this is a vertical template, register it** so `create-eds-repo` offers it automatically: add/update the
  vertical's entry in **`plugins/aem-edge-delivery/verticals.json`** — set its `template` to `<owner>/<template-name>`
  and `status` to `ready`. (Ask which vertical via an AskUserQuestion dialog; if it's a brand-new vertical not in the
  file, add a new entry with a `label`.) Example:
  ```json
  "retail": { "label": "Retail", "template": "<owner>/<template-name>", "status": "ready" }
  ```
  Then commit that change to the `xsc-ai-playbooks` repo (or open a PR) so every XSC's `create-eds-repo` sees it.
- 📌 If it's just a **personal** (non-vertical) template, no registration needed — the user picks "my own template"
  in `create-eds-repo` and supplies `<owner>/<template-name>`.

## Step 5 — Later: grow the base template

When a demo produces something reusable, fold it back into the base template with the `merge-back-to-base-template`
playbook (driven by that integration's MANIFEST). Keep base-template changes **generic** — strip customer content,
names, and URLs before merging.

## Reference links

| Resource | Link |
|---|---|
| Reference base template (da-demo-kit) | https://github.com/ynaka-adobe/da-demo-kit |
| Clean EDS starter (aem-boilerplate) | https://github.com/adobe/aem-boilerplate |
| GitHub "create a repo from a template" | https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template |
