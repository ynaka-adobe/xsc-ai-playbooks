# Create Your Own Repo Template — Paste this into Claude Code

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with the first step. (Human: you can just say "walk me
> through this" — but Claude should begin even if you don't.)

**XSC teammates:** copy this entire file, paste it into your own **Claude Code or claude.ai chat** session, and say:

> Walk me through creating my own base repo template, one step at a time.

Claude will help you pick a starter, copy it into **your own GitHub account** as a reusable **template repo**, and
mark it as a template so every future demo starts from it. This is the repo you'll grow over time: each demo's
customization (like a Target library plugin) gets merged back in, so the next demo inherits it. `da-demo-kit`
(`ynaka-adobe/da-demo-kit`) is a reference example of exactly this kind of base template. **No coding experience
required.**

> **Do this once.** After your base template exists, you use **create-eds-repo.md** to spin up a new EDS repo
> *from* it for each customer.

---

## Instructions for Claude (the assistant reading this file)

You are guiding an Adobe XSC product specialist — possibly non-technical — through creating their **own reusable
base template repository** for AEM Edge Delivery (EDS) demos. The base template lives in the user's GitHub account
(no special org or `-adobe` naming needed) and is the launch point for every future demo. Over time the user merges
demo-specific customizations back into this base template so it accumulates reusable functionality.

**The lifecycle this fits into (state it plainly if the user is unsure why they're here):**
1. **This playbook** → create a base template repo in your GitHub account (once).
2. **create-eds-repo.md** → for each customer, create a new EDS repo *from* your base template, then connect it to
   the Experience Modernization Agent (aemcoder.adobe.io) to migrate a source site's blocks, design & content.
3. **Customize** → open the demo repo in Claude Code and build something new (e.g. a Target library plugin).
4. **Merge back** → once the demo lands, merge that customization into your **base template** so the next demo
   inherits it.

**How to run this:**
- **Adapt to your environment (works in both Claude Code and Claude chat).** First figure out what you can do: if
  you have terminal / file / browsing tools (Claude Code or cowork), run the checks and, with the user's clear
  go-ahead, create the repo yourself with `gh`. If you have no machine access (claude.ai chat), don't pretend to —
  ask the user to run each command and paste the result, and give them the exact browser clicks. Either way the
  workflow is identical; only *who runs it* changes.
- Give **one step at a time** and wait for the user to confirm before moving on. Keep language plain and explain
  *why* each step matters in one sentence. Put every URL and command in its own code block so it's easy to copy.
- **Guardrails:** creating a repo and marking it a template are outward-facing — summarize what will happen and get
  a clear "yes" before you create anything. Never have the user paste GitHub tokens into chat; auth happens in
  `gh auth login` or the browser. The user owns their accounts — you guide, you don't sign in for them.

---

## Step 0 — Prerequisites

The user needs the **Readiness** setup done first: a GitHub account (Adobe email recommended, not required). No org
or special naming is needed. If they haven't done that, point them to **readiness.md** and stop here.

Quick confirm (run these in Claude Code, or ask the user to run them in chat and paste the result):
```bash
gh auth status
git --version
```
`gh auth status` should show they're logged in to GitHub. If `gh` isn't installed, they can do every step in this
playbook in the browser instead — that's fine.

---

## Step 1 — Pick a starter to base your template on

Help the user choose the repo their base template will be copied from. Recommend by what they want out of the box:

| Starter | Best when | Repo |
|---|---|---|
| **da-demo-kit** (recommended) | You want demo functionality already wired up — Target integration, Workfront integration, Send-to-Workfront approval/publish, the `ak.js` framework. Fastest path to a demo-ready base. | `https://github.com/ynaka-adobe/da-demo-kit` |
| **aem-boilerplate** | You want a clean, minimal EDS starting point and plan to add your own functionality. | `https://github.com/adobe/aem-boilerplate` |
| An existing repo of your own | You've already built something you want to standardize on. | your repo |

> Recommendation for most XSC folks: start from **da-demo-kit** — it's the reference base template and already
> bundles the demo pieces you'll want.

Confirm the chosen starter with the user before continuing.

---

## Step 2 — Copy the starter into your org (copy, don't fork)

**Copy it as a template — do not fork.** Here's why, in one line: a *copy* gives you a clean, independent repo with
no upstream tie and a fresh history, so you fully own it and can mark it as a template and merge your own work into
it freely. A *fork* stays linked to the original (it's meant for contributing changes back upstream), you can only
hold one fork of a repo per account, and forks don't cleanly become reusable template repos. You want a copy.

**In the browser (works for everyone):**
1. Open your chosen starter, e.g. `https://github.com/ynaka-adobe/da-demo-kit`.
2. Click **Use this template → Create a new repository**.
3. **Owner** = your GitHub account (or any org). **Name** = your base template name (e.g. `my-demo-base` or `<username>-demo-kit`).
   **Visibility = Public**.
4. Create the repository.

**Or with the GitHub CLI (if `gh auth status` shows you're logged in) — confirm with the user first:**
```bash
gh repo create <your-org>/<template-name> --template ynaka-adobe/da-demo-kit --public
```
Swap `ynaka-adobe/da-demo-kit` for whichever starter they picked.

---

## Step 3 — Mark the repo as a template

This is what lets **create-eds-repo.md** (and the GitHub "Use this template" button) spin up new EDS repos from it.

**In the browser:**
1. Open your new repo → **Settings** (the ⚙️ tab).
2. Under the **General** section, check **✅ Template repository**.

**Or with the GitHub CLI — confirm first:**
```bash
gh repo edit <your-org>/<template-name> --template
```

Verify it took (Claude can run this, or the user pastes the output):
```bash
gh repo view <your-org>/<template-name> --json isTemplate
```
Expect `{"isTemplate": true}`.

---

## Step 4 — Confirm and record your base template

Wrap up with a short ✅ summary and capture the one thing every later playbook needs — the template's full name:

- ✅ Repo `<your-org>/<template-name>` exists, is **Public**, and is marked **Template repository**.
- 📌 Tell the user to note their template as `<your-org>/<template-name>` — they'll give this to
  **create-eds-repo.md** in place of `ynaka-adobe/da-demo-kit` whenever they start a new demo.

Then point them onward:

> Your base template is ready. To build a demo from it, open **create-eds-repo.md** and say
> "Walk me through creating an EDS demo" — and use **your** template `<your-org>/<template-name>` as the source.

---

## Step 5 — Later: grow the base template by merging customizations back in

Explain this now so the user knows how the base template grows over time; they'll actually do it *after* a demo.

When a demo produces something reusable (e.g. a Target library plugin), you fold it back into this base template so
the next demo inherits it — driven by that integration's **MANIFEST** (the artifact list at the end of each
integration playbook). This has its own guided playbook:

➡️ **merge-back-to-base-template.md** — clone the base template, copy the manifest's files, splice in the merge
entries (sidekick `plugins[]`, DA library sheet), genericize, and open a PR.

> Keep base-template changes **generic** — strip customer-specific content, names, and URLs before merging, so the
> next demo starts clean.

---

## Troubleshooting

**"Use this template" button is missing on my new repo** — the repo must be marked as a template (Step 3). Check
**Settings → Template repository**.

**`gh: could not create repository`** — run `gh auth status`; if not logged in, `gh auth login` (browser flow — no
token pasted into chat). Confirm the `<owner>` value is your GitHub account (or an org you can create repos in).

**Cherry-pick conflicts when merging back** — the customization touched files the base template also changed.
Resolve the conflicts in the listed files, `git add` them, then `git cherry-pick --continue`. If it's messy, prefer
method **B** (copy the self-contained folder) instead.

**Later demos still point at da-demo-kit** — that's fine as a fallback, but to use *your* base template, give
create-eds-repo.md your template name `<your-org>/<template-name>` explicitly when it asks for the template.

---

## Reference links

| Resource | Link |
|---|---|
| Reference base template (da-demo-kit) | https://github.com/ynaka-adobe/da-demo-kit |
| Clean EDS starter (aem-boilerplate) | https://github.com/adobe/aem-boilerplate |
| GitHub "Creating a repo from a template" docs | https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template |
| Prerequisite: get set up | readiness.md |
| Next step: build a demo from your template | create-eds-repo.md |
