---
name: create-stash
description: Deploy Stash — a per-user key-value service on Adobe App Builder (State + Files) that gives an EDS site Favorites, My List, avatars and profile preferences behind SSO — into your own IMS org, register a site, and smoke-test it. Use when someone says "create Stash", "set up per-user storage", "add favorites to my demo", "deploy per-user-metadata", or "I need user preferences on my EDS site".
---

# Create Stash (per-user storage on App Builder)

**Stash** is a small App Builder service that stores per-user and global JSON for Edge Delivery sites. One
deployment serves many sites ("apps"); each site gets its own signing secret and isolated data.

```
Browser → <site>/api/kv/* → site's Edge Function (SSO session, HMAC-signs) → Stash action → State / Files
```

- **Runtime:** one web action `per-user-metadata/kv` (Node 22, `raw-http`, no Adobe IMS auth — every request must
  carry an HMAC signature made with the site's secret, so the URL being public is fine).
- **App Builder State** (region `amer`): JSON docs — favorites, links, avatar metadata. 365-day TTL, refreshed on read.
- **App Builder Files:** avatar images.
- **No database, no frontend, no Developer Console API subscriptions.**
- Features per site: `avatar` (user + public-by-name), `favorites` (user, max 200), `links` (user + admin-only global, max 50).

Source: **https://github.com/ynaka-adobe/per-user-metadata** (API and signing format in its README).

> **Never print or commit secrets.** Secrets live only in `.env` and as action inputs. Never `cat .env`.

## Step 0 — Prerequisites

Check, don't assume:

```bash
node -v            # >= 20
aio --version      # npm i -g @adobe/aio-cli  if missing
aio login          # browser sign-in
aio console org list
```

The org you want **must appear in `aio console org list`**. `aio login` never asks for an org — an Adobe ID that
isn't a member of the target org can sign in fine but every deploy fails later with
`403 ERR_DEPLOY_SERVICE_GET_WORKSPACE_INFO_ERROR`. If the org is missing, the user must be added to it (Admin
Console) or sign in with a different Adobe ID (`aio logout && aio login`). The org also needs App Builder
(`aio console project list` showing `jaeger` projects means it's entitled).

## Step 1 — Get the code (one checkout per org)

```bash
git clone https://github.com/ynaka-adobe/per-user-metadata.git stash-<org-short-name>
cd stash-<org-short-name>
npm ci && npm test
```

Use a **separate checkout per org/workspace**. `aio app use` rewrites `.aio` and `.env`; running it in a checkout
that already deploys elsewhere would clobber those Runtime credentials. If you already have a checkout, add a
worktree instead: `git worktree add --detach ../stash-<org> main`.

## Step 2 — Create the App Builder project and link it

Ask the user (dialog) only for anything you can't infer: the **org** (from `aio console org list`) and a
**project name**.

```bash
aio console org select <ORG_ID>
aio console project create -n <projectName> -t "Stash" -d "Per-user storage for EDS sites"
aio console project select <projectName>
aio console workspace list                       # note the Production workspace id
aio console workspace select <PRODUCTION_WS_ID>
aio app use --global --no-input --overwrite      # writes .aio + Runtime creds into .env (this checkout only)
grep '^AIO_runtime_namespace' .env               # e.g. 332794-<projectname> (not secret)
```

- The **project name** becomes part of the Runtime namespace/URL (`<orgId>-<projectname>`) and **cannot be
  changed later**. The **title** is display-only — rename it to "Stash" anytime without breaking anything.
- New projects get **Production** and **Stage** workspaces; deploy Production.

## Step 3 — Register a site (app)

Each site is an entry in `config/apps.json` plus a secret. Use a short lowercase id (e.g. `xsc-demo`):

```json
"<app-id>": {
  "secretEnv": "KV_SECRET_<APP_ID_UPPER_SNAKE>",
  "admins": ["admin@example.com"],
  "features": {
    "avatar": { "scopes": ["user", "public"] },
    "favorites": { "scopes": ["user"], "maxItems": 200 },
    "links": { "scopes": ["user", "global"], "maxItems": 50 }
  }
}
```

1. Add the entry (keep the existing one-line-per-feature formatting) and add
   `KV_SECRET_<…>: $KV_SECRET_<…>` under the action `inputs` in `app.config.yaml`, and an empty
   `KV_SECRET_<…>=` line to `.env.example`.
2. Generate the secret **straight into `.env`** without echoing it:
   ```bash
   grep -q '^KV_SECRET_<…>=' .env || printf 'KV_SECRET_<…>=%s\n' "$(openssl rand -hex 32)" >> .env
   ```
   Every `$KV_SECRET_*` referenced in `app.config.yaml` should exist in `.env` (an empty value is fine for apps this
   deployment doesn't serve — those requests just return 500 "app secret not configured").
3. `npm test`, then commit the config (not `.env`).

**Admins:** keep real emails **out of git** — the committed placeholder is `admin@example.com`. Admins are compiled
into the action at deploy time, so swap in the real email(s) only for the deploy (Step 4). Admins are the only
users allowed to `PUT`/`DELETE` global values.

## Step 4 — Deploy (real admins injected, never committed)

```bash
sed -i '' 's/"admin@example.com"/"<real-admin@company.com>"/g' config/apps.json   # macOS sed; on Linux drop ''
aio app deploy
git checkout -- config/apps.json
git status --short        # must be clean (aside from untracked local files)
```

The deploy prints the action URL:
`https://<namespace>.adobeioruntime.net/api/v1/web/per-user-metadata/kv`.

If it fails with **403 `ERR_DEPLOY_SERVICE_GET_WORKSPACE_INFO_ERROR`**: the signed-in Adobe ID isn't in that org
(see Step 0). Run `aio auth login --bare >/dev/null` once to refresh an expired token before concluding that.
`aio rt action update` goes through the same deploy service, so it is **not** a workaround.

## Step 5 — Smoke test

`scripts/kv-request.mjs` reads `KV_ACTION_URL` **from `.env` only** (not the shell), else derives it from an
uppercase `AIO_RUNTIME_NAMESPACE`, which `aio app use` doesn't write. Add the URL first:

```bash
KV_URL=https://<namespace>.adobeioruntime.net/api/v1/web/per-user-metadata/kv
echo "KV_ACTION_URL=$KV_URL" >> .env
R="node scripts/kv-request.mjs"
$R PUT /favorites/user/smoke '["/demos/a"]' --user smoke@example.com --app <app-id>   # 200
$R GET /favorites/user --user smoke@example.com --app <app-id>                       # 200 {"smoke":[...]}
$R PUT /links/global/menu '[]' --user smoke@example.com --app <app-id>                # 403 admins only
$R DELETE /favorites/user/smoke --user smoke@example.com --app <app-id>              # 204
curl -s -o /dev/null -w '%{http_code}\n' "$KV_URL/favorites/user" -H 'x-kv-app: <app-id>'   # 401 unsigned
```

All five results as shown = working. A signed request returning `{"error":"The requested resource does not
exist."}` means the URL is wrong (usually `KV_ACTION_URL` missing from `.env`).

## Step 6 — Wire the site's Edge Function

The browser never calls Stash directly. The site's SSO Edge Function (e.g. the Okta CUG function) must:

1. Route `/api/kv/*` to a KV handler **before** proxying to the EDS origin, only for signed-in sessions.
2. Strip any client `x-kv-*` headers, take the user email (and optional display name) from the **session**.
3. Reject cross-origin writes (`Origin` ≠ the site origin) and cap bodies (~300 KB).
4. Sign and forward with headers `x-kv-app`, `x-kv-user`, `x-kv-timestamp`, `x-kv-signature` (+ `x-kv-name`).
   Signature = hex HMAC-SHA256(secret) over `METHOD\npath\napp\nlowercase-email\ntimestamp\nsha256hex(body)`
   (+ `\nx-kv-name` when sent). It must stay byte-compatible with `sign()` in `actions/kv/handler.js`.

A working reference is `src/kv.js` in the Knowledge Hub CUG Edge Function — copy it, change `KV_APP` to your
app id and `KV_DEFAULT_URL` to your action URL. Configure on the Edge Function:

- `XSC_KV_SECRET` (secret) = the same value as `KV_SECRET_<…>` in Stash's `.env` — copy it between the two
  `.env` files/pipeline variables without printing it.
- `XSC_KV_URL` (optional config) = the action URL, if not hard-coded.

Then from a signed-in browser: `GET /api/kv/favorites/user` → `200 {}`.

## Limits (App Builder State, per Production workspace, defaults)

| Limit | Default | Rough meaning for Stash |
|---|---|---|
| Bandwidth | 10 MB/min (1 MB/s burst) | ≈ 2,000 req/min (~30 req/s) at ~5 KB docs — **first limit you hit** |
| Keys | 200K (ticket → 500K) | ~4 keys per user per site → ~50K users per workspace (shared across sites) |
| Storage | 1 GB (ticket → 10 GB) | Fine at a few KB per user |
| Runtime | 6,000 activations/min | Raisable via ticket |

Exceeded limits return 429/403. Beyond ~50K users or ~30 sustained req/s, raise limits via support ticket or move to
App Builder Database. Source: https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/storage/

## Done

Report: org + project, action URL, registered app id(s), smoke-test results, and whether the Edge Function is wired.
Remind the user that the app secret now exists in two places (Stash `.env` and the Edge Function config) and must be
rotated in both together.
