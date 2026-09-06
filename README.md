# XSC AI Playbooks

Paste-into-Claude guides that help XSC teammates get more done with AI. Each playbook is a self-contained
`<topic>.md` file — copy it (or open its link), paste it into **Claude Code or claude.ai chat**, and Claude
walks you through the task step by step. **No coding experience required.**

> **These files are generated** from the `aem-demo-playbooks` plugin skills (the single source of truth) by
> `scripts/gen-onboarding.mjs` in that repo. **Don't hand-edit them here** — edit the matching skill and regenerate.

## Playbooks

| # | Playbook | What it does | Open in Claude |
|---|---|---|---|
| 1 | **Readiness** (`readiness.md`) | One-time setup: installs the tools (git, Node, AEM CLI) and creates your GitHub account. Do this once. | https://claude.ai/claude-code/onboard/qO5HVlt1cLoM |
| 2 | **Create Your Own Repo Template** (`create-repo-template.md`) | Copy a starter (e.g. da-demo-kit) into your own GitHub account as a reusable **template repo** — the base every demo starts from. Do this once. | https://claude.ai/claude-code/onboard/BlE55Ox0IDTX |
| 3 | **Create Your EDS Repo — Base** (`create-eds-repo.md`) | Repo from template → install AEM Code Sync → complete the bot setup wizard (creates the content repo, EDS site, admin). **Ends at a fork** → Path A or Path B. Run once per demo. | https://claude.ai/claude-code/onboard/AOeIi7qtej8k |
| 4 | **Modernize with aemcoder — Path A** (`modernize-with-aemcoder.md`) | Migrate a real site's pages, design & content with the Experience Modernization Agent (aemcoder.adobe.io) — migrate → design → polish → publish. | https://claude.ai/claude-code/onboard/MAGwJBquc7YJ |
| 5 | **Add Adobe Target — Path B example** (`add-target.md`) | An **integration type**: enable at.js, author a Target offer, verify an XT activity. Ends with a **MANIFEST** so it's portable. Uses a shared demo runtime (no credentials). | https://claude.ai/claude-code/onboard/CqpTPeWfx1YY |
| 6 | **Merge Back to Base Template** (`merge-back-to-base-template.md`) | The **final step**: use an integration's MANIFEST to fold the feature into your base template so every future demo inherits it. | https://claude.ai/claude-code/onboard/VhOxqKYzdbe_ |

## The two forks

The flow branches at two points:

- **End of playbook 3 (base):** choose your intent —
  - **Path A → Modernize with aemcoder** (playbook 4): migrate an existing website.
  - **Path B → Build a tool integration** (playbook 5, e.g. Add Target): start from DA Block Collection sample pages.
- **Top of playbook 4:** **first-time** vs. **returning** aemcoder user (returning users re-point aemcoder at the new site).

Integration types (playbook 5 is the Target example; Workfront, Journey, etc. are future siblings) each end with a
**MANIFEST**, which **playbook 6** consumes to merge the feature into your base template. Once merged, every new demo
built from the base template already includes it.

## How to use a playbook

1. **New to this?** Start with **Readiness** (1) — machine + GitHub setup.
2. **First demo ever?** Use **Create Your Own Repo Template** (2) once to stand up your base template.
3. **Each new demo:** run **Create Your EDS Repo** (3), then follow the fork — **Modernize with aemcoder** (4) or an
   integration playbook like **Add Adobe Target** (5).
4. **Built something reusable?** Finish with **Merge Back to Base Template** (6).
5. Open the link (or copy the playbook's `<topic>.md`), paste it into Claude, and tell Claude to walk you through
   it. It hands you exact prompts, confirms each step, and pauses for you along the way.

## Claude Code vs. claude.ai chat

Both surfaces work — the playbooks detect where they're running and adapt:

| | Claude Code (or cowork) | claude.ai chat |
|---|---|---|
| Coaching, prompts, troubleshooting | ✅ | ✅ |
| Runs your setup checks (`git`/`node`/`gh`) for you | ✅ automatically | ⚠️ you run them, paste the result |
| Auto-creates the GitHub repo (`gh`) | ✅ | ⚠️ you use the browser |
| Copies files / opens PRs for merge-back (6) | ✅ | ⚠️ you run the git steps |
| Verifies your preview URL loaded | ✅ | ⚠️ you open it (or Claude does, if it has web browsing) |

**Rule of thumb:** chat is great for being *coached through the clicks*; Claude Code is smoother because it can run
checks, create the repo, and do the git work for you. The demo work (GitHub, da.live, aemcoder) happens in your
browser either way.

**Requirements (both surfaces):** a web browser, access to **aemcoder.adobe.io** (for Path A), and a GitHub account
(no special org or `-adobe` naming needed). (git / Node / the AEM CLI are only needed for local editing.)

## Layout

```
xsc-ai-playbooks/
├── README.md                        ← you are here
├── readiness.md                     ← 1: get set up
├── create-repo-template.md          ← 2: create your base template
├── create-eds-repo.md               ← 3: base repo → fork (A or B)
├── modernize-with-aemcoder.md       ← 4: Path A — migrate a real site
├── add-target.md                    ← 5: Path B example — integration + MANIFEST
├── merge-back-to-base-template.md   ← 6: merge a feature into your base template
├── sync-da-content.md               ← helper: sync shared config/creds to a demo repo
└── assets/                          ← media (served via GitHub Pages)
```

Each playbook is one flat, topic-named `.md` file so it's easy to tell apart. When you share one via
`ShareOnboardingGuide`, it's temporarily copied to the repo root as `ONBOARDING.md` (the only name that tool reads).

## Adding / changing a playbook

**These files are generated — don't edit them here.** Each `<topic>.md` is produced from the matching
`aem-demo-playbooks/skills/<skill>/SKILL.md` by `scripts/gen-onboarding.mjs`.

1. Edit (or add) the **skill** in the `aem-demo-playbooks` repo.
2. Run `node scripts/gen-onboarding.mjs` (or `./sync.sh`) — it regenerates the paste-ins here.
3. For a **new integration type** (Workfront, Journey, …): model the skill on `add-adobe-target` and **end it with a
   MANIFEST** so `merge-back-to-base-template` can consume it. Add its name to the `MAP` in the generator.
4. Share it and add a row to the table above.

---

*Part of the XSC effort to incorporate AI for greater efficiency.*
