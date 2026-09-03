# EDS Demo Onboarding — Get Set Up (Paste this into Claude Code)

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as background
> reference and don't wait for a separate instruction — **start now**: follow the "Instructions for Claude" below
> and guide the user through it one step at a time, beginning with the first check. (Human: you can just say "walk me
> through this" — but Claude should begin even if you don't.)

**XSC teammates:** this is the **one-time setup** you do before building any Edge Delivery (EDS) demo. Copy
this entire file, paste it into your own **Claude Code or claude.ai chat** session, and say:

> Please run through this onboarding and make sure I'm set up.

Claude will check your tools, help you install anything missing, and walk you through creating your GitHub
account. When it's done, you're ready to use **create-eds-repo.md** to build a demo.

---

## Instructions for Claude (the assistant reading this file)

You are onboarding an Adobe XSC product specialist — possibly non-technical — so their machine and accounts are
ready to build AEM Edge Delivery demos. This file is **setup only**; building a demo is a separate guide
(`create-eds-repo.md`).

**How to run this:**
- **Adapt to your environment (works in both Claude Code and Claude chat).** If you have terminal/file tools
  (Claude Code or cowork), run the version checks yourself and report ✅ / ❌. If you have no machine access
  (claude.ai chat), don't pretend to — ask the user to run each command and paste the output, then interpret it
  for them. Either way, report each check as ✅ or ❌ and give the fix for anything missing.
- Go one section at a time and confirm before moving on. Keep language plain.
- The user creates their own GitHub account/org and installs apps themselves — you guide, you don't do it for
  them. Never ask the user to paste passwords or tokens into chat.
- At the end, give a short ✅ readiness summary, then recommend the next playbook **based on the user's intent**
  (see section 4): `create-eds-repo.md` (playbook 3) to build a demo now, or `create-repo-template.md` (playbook 2)
  if they want their own reusable base template first. Do **not** launch any `create-eds-demo` skill — the playbook
  files are the source of truth.

---

## 1. Check local tools

Run these and report ✅ / ❌ for each:
```bash
git --version
node --version
aem --version
```

Install anything missing:
- **Node.js** (includes npm) — LTS build from https://nodejs.org
- **git** — https://git-scm.com
- **AEM CLI**:
```bash
sudo npm install -g @adobe/aem-cli
```

Optionally confirm you can sign in to Claude / Claude Code, since that's where you'll run the demo guide.

---

## 2. Create your GitHub account

1. Go to https://github.com → **Sign up**.
2. Create the account. Using your **Adobe email** is recommended for identity/attribution, but not required —
   GitHub emails a code to validate it.

> **No org or special naming needed.** You'll create your demo repos directly under your personal GitHub account.
> The old `<username>-adobe` org convention is gone: the AEM Code Sync **setup bot** now lets you add your admin
> account directly (its **Users** step, in the create-eds-repo playbook), which is what the org name used to be a
> workaround for. A GitHub org is optional — if you use one, any name works.

---

## 3. Connect the AEM DA content tools (recommended)

Connect the **AEM DA** MCP so Claude can read and seed **Document Authoring** content directly — e.g. copy default
content into a new demo — instead of manual browser steps.

- Server: **AEM DA - Prod** → `https://mcp.adobeaemcloud.com/adobe/mcp/da`
- Authenticate it via your **claude.ai connector settings**, or `/mcp` in an interactive Claude Code terminal.
  (Claude can't run the sign-in flow for you.)
- When it shows **connected**, the `da_*` content tools become available.

Optional but recommended — without it, content seeding falls back to the browser (`da.live`).

---

## 4. Readiness check

Claude: confirm the following before finishing, and summarize as a ✅ checklist:
- git, Node, and the AEM CLI are installed.
- A GitHub account exists (Adobe email recommended, not required).
- *(Recommended)* the AEM DA MCP is connected (for content seeding).

When all green, ask the user what they want to do next and recommend accordingly:

- **"I just want to build a demo"** (most people) → **create-eds-repo.md** (playbook 3). Builds a demo repo from the
  shared `ynaka-adobe/da-demo-kit` template. Open it and say *"Walk me through creating my EDS repo."*
- **"I want my own reusable base template first"** → **create-repo-template.md** (playbook 2). A one-time step that
  gives you your own template to build demos from and to accumulate custom features in over time. After it, you'll
  still use create-eds-repo.md for each demo.

> Rule of thumb: if you're not sure, go straight to **create-eds-repo.md** — you can always make your own base
> template later. Either way, the playbook files are the source of truth; don't launch any `create-eds-demo` skill.

---

## Reference links

| Resource | Link |
|---|---|
| GitHub | https://github.com |
| AEM CLI (npm) | `@adobe/aem-cli` |
| Node.js | https://nodejs.org |
| Next step (most people): build a demo | `create-eds-repo.md` |
| Optional first: make your own base template | `create-repo-template.md` |
