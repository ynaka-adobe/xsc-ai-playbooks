# Merge Back to Base Template — Paste this into Claude Code

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with the first step. (Human: you can just say "walk me
> through this" — but Claude should begin even if you don't.)

**XSC teammates:** this is the **final step** after you build an integration on a demo repo. It folds that feature
back into your **base template** so every future demo inherits it. It works off the integration's **MANIFEST** —
the artifact list at the end of each integration playbook (Target, Workfront, Journey, …). Copy this entire file,
paste it into your own **Claude Code or claude.ai chat** session, and say:

> Walk me through merging my integration back into my base template, one step at a time.

**No coding experience required** — but this one is smoother in **Claude Code**, since it can do the git/file work
for you.

---

## Instructions for Claude (the assistant reading this file)

You are helping an Adobe XSC product specialist merge a **completed integration** from a **demo repo** into their
**base template** (the shared `ynaka-adobe/da-demo-kit`, or their own `<org>/<template-name>` from
**create-repo-template.md**), using the integration's **MANIFEST**.

**How to run this:**
- **Adapt to your environment.** In Claude Code (or cowork), clone the base template, copy the manifest's artifacts,
  apply the merge entries, and open the PR yourself (with the user's go-ahead). In claude.ai chat, give the user the
  exact files/paths and `git` commands and have them run them.
- **The MANIFEST is the contract.** Get it from the integration playbook's **## Integration Manifest** section
  (e.g. add-target.md). It lists **files** (source path → same dest path), **merge** entries (config files where you
  add an entry rather than overwrite — e.g. sidekick `plugins[]`, the DA library sheet), **optional** artifacts,
  **notes** (e.g. CSP, `head.html` metas), and **exclude** (things NOT to copy).
- **Keep it generic.** Strip customer-specific content, names, URLs, and demo data before merging — the base template
  must start clean for the next demo.
- **Guardrails:** opening a PR / pushing / merging is outward-facing — summarize what will change and get a clear
  "yes" first. Never have the user paste tokens into chat.
- Give **one step at a time**; explain *why* in one sentence.

---

## Step 1 — Gather inputs

- **Which integration** you're merging (e.g. Target, Workfront, Journey) and its **MANIFEST** (from that playbook).
- The **demo repo** you built it in: `<org>/<demo-repo>`.
- Your **base template** repo: `<org>/<template-name>` (default `ynaka-adobe/da-demo-kit`).

Confirm you can reach GitHub (Claude Code): `gh auth status`.

---

## Step 2 — Get a clone of the base template and branch

```bash
git clone https://github.com/<org>/<template-name>.git
cd <template-name>
git checkout -b add-<integration-name>
```

Add the demo repo as a source so you can pull files/commits from it:
```bash
git remote add demo https://github.com/<org>/<demo-repo>.git
git fetch demo
```

---

## Step 3 — Copy the artifacts per the MANIFEST

For each entry in the integration's manifest:

- **files** — copy each `source path → dest path` (same path in the base template). Method **A**: cherry-pick the
  commit(s) that introduced them (`git cherry-pick <sha>`). Method **B** (best for a self-contained folder like a
  new `/blocks/<name>/` or `/tools/<name>/`): copy the folder over from the demo checkout.
- **merge** — for config files you **add to, not overwrite** (e.g. `tools/sidekick/config.json` `plugins[]`, the DA
  **library sheet** row), splice in only the integration's entry, preserving everything already there.
- **optional** — include only if the user wants it (e.g. a UE model).
- **notes** — apply any required companions (e.g. add the `target` metas to `head.html`, ensure the CSP `script-src`
  allows the integration's scripts).
- **exclude** — do **not** copy anything the manifest lists as excluded.

---

## Step 4 — Genericize

Before committing, strip anything customer-specific the copy dragged along: demo copy/content, customer names,
hard-coded URLs, sample data. The base template should start **clean** for the next demo.

---

## Step 5 — Commit, PR, and merge

```bash
git add -A
git commit -m "Add <integration-name> integration to base template"
git push -u origin add-<integration-name>
```
Then open a Pull Request on the base template and merge it. *Opening/merging the PR is outward-facing — confirm with
the user first.*

**Cherry-pick conflicts?** The customization touched files the base template also changed. Resolve the listed files,
`git add` them, then `git cherry-pick --continue`. If it's messy, prefer **method B** (copy the self-contained
folder) instead.

---

## Step 6 — Verify

- The base template now contains every **files** and **merge** artifact from the manifest.
- Nothing customer-specific leaked in (Step 4).
- Your **next demo**, created from this base template via **create-eds-repo.md**, will already include the feature —
  no re-import needed.

---

## Reference links

| Resource | Link |
|---|---|
| Your base template playbook | `../create-repo-template/ONBOARDING.md` |
| Create a new demo from the base | `../create-eds-repo/ONBOARDING.md` |
| Example integration (with a MANIFEST) | `../add-target/ONBOARDING.md` |
| GitHub "Creating a repo from a template" docs | https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template |
