---
name: create-stash
description: Build Stash from scratch in your own Adobe IMS org — a tiny per-user key-value service on App Builder (Runtime + State) that powers Favorites, My List, saved links and user preferences on an Edge Delivery site behind SSO. No code to clone; the agent generates, tests and deploys it from this spec. Use when someone says "create Stash", "set up per-user storage", "add favorites to my site", "store user preferences", or "I need a key-value store for my EDS site".
---

# Create Stash — per-user key-value storage on App Builder

**The idea:** once a site knows who the user is (SSO), a tiny signed key-value service lets you add usability
features — **Favorites, My List, saved links, recently viewed, preferences** — without a database or backend team.
Every feature is just "a JSON document per user (or one shared doc), keyed by name".

**This skill contains no code to clone.** It is a spec. You (the agent) generate the service in the user's own
workspace, prove it against the tests below, and deploy it into **their** IMS org. Follow the spec exactly —
especially the signing format — so the service and the site proxy interoperate.

```
Browser ──/api/kv/*──▶ site's server-side layer (knows the user via SSO; signs) ──▶ Stash action ──▶ App Builder State
```

> **Never print or commit secrets.** Generate them straight into `.env`; never `cat .env` or echo a secret.

## Step 0 — Prerequisites (check, don't assume)

```bash
node -v                 # >= 20
aio --version           # npm i -g @adobe/aio-cli  if missing
aio login
aio console org list    # the target org MUST be listed
```

- `aio login` never asks for an org. An Adobe ID that isn't a member of the target org signs in fine, but every
  deploy then fails with `403 ERR_DEPLOY_SERVICE_GET_WORKSPACE_INFO_ERROR`. Fix: get added to the org in Admin
  Console, or `aio logout && aio login` with the right Adobe ID.
- The org needs **App Builder** entitlement.
- The site needs a **trusted server-side layer that knows the signed-in user's email** — e.g. an AEM Edge Function
  doing SSO/CUG, or a CDN worker in front of EDS. Stash trusts only that layer, never the browser.

Ask the user (one dialog each, only if not already known): **org**, **project name** (default `stash`), **site id**
(short lowercase, e.g. `acme-intranet`), **admin email(s)**, and which **features** they want (default below).

## Step 1 — Create the App Builder project

```bash
mkdir stash && cd stash
aio console org select <ORG_ID>
aio console project create -n <projectName> -t "Stash" -d "Per-user key-value storage for EDS sites"
aio console project select <projectName>
aio console workspace list                    # pick Production
aio console workspace select <PRODUCTION_WS_ID>
aio app init . --no-login -y --standalone-app --no-extensions --no-install   # if flags differ, init a bare app
aio app use --global --no-input --overwrite   # writes .aio + Runtime credentials into .env
```

- The **project name** becomes part of the URL (`<orgId>-<projectname>.adobeioruntime.net`) and **can't be
  changed**; the **title** is display-only.
- Delete any sample actions/web-src the template created. Keep `.env` and `.aio` gitignored.
- Dependencies: `@adobe/aio-sdk`, `@adobe/aio-lib-state`. Dev: `jest`. `package.json` → `"test": "jest test/"`.
- `<SITE_ID_UPPER_SNAKE>` = site id uppercased with every non-`A-Z0-9` char replaced by `_` (`acme-intranet` →
  `ACME_INTRANET`). It must equal the site's `secretEnv` in `apps.json`.

## Step 2 — Generate the service (spec)

### Files

```
app.config.yaml          # one action
config/apps.json         # site registry (committed, admin placeholder only)
actions/kv/index.js      # thin wrapper: init State, call handle()
actions/kv/handler.js    # all logic, pure + injectable (state, now) for tests
test/handler.test.js
scripts/kv-request.mjs   # signed CLI client for smoke tests (reads .env)
.env.example
```

### `app.config.yaml`

```yaml
application:
  runtimeManifest:
    packages:
      stash:
        license: Apache-2.0
        actions:
          kv:
            function: actions/kv/index.js
            web: 'yes'
            runtime: nodejs:22
            inputs:
              LOG_LEVEL: info
              KV_SECRET_<SITE_ID_UPPER_SNAKE>: $KV_SECRET_<SITE_ID_UPPER_SNAKE>
            annotations:
              require-adobe-auth: false   # auth is the HMAC signature below
              final: true
              raw-http: true              # needed: body arrives base64 in __ow_body; path in __ow_path
```

### `config/apps.json` — one entry per site

```json
{
  "<site-id>": {
    "secretEnv": "KV_SECRET_<SITE_ID_UPPER_SNAKE>",
    "admins": ["admin@example.com"],
    "features": {
      "favorites": { "scopes": ["user"], "maxItems": 200 },
      "links":     { "scopes": ["user", "global"], "maxItems": 50 },
      "prefs":     { "scopes": ["user"] }
    }
  }
}
```

A **feature** is a named JSON document. `user` scope = one private doc per user. `global` scope = one shared doc
for the site that everyone can read and only `admins` can write. Adding a feature later = edit this file and redeploy.

### HTTP API (paths are relative to the action URL)

| Request | Result |
|---|---|
| `GET /{feature}/{scope}` | `200` whole doc (`{}` if none) |
| `GET /{feature}/{scope}/{key}` | `200` value, or `404 {"error":"not found"}` |
| `PUT /{feature}/{scope}/{key}` with JSON body | `200` echo of stored value |
| `DELETE /{feature}/{scope}/{key}` | `204` |

- Paths with fewer than 2 segments → `400 bad path`.
- `{feature}` must exist in the site's config → else `404 unknown feature`; `{scope}` must be in its `scopes` →
  else `404 unknown scope`. `{key}` must match `^[A-Za-z0-9_-]{1,64}$` → else `400 bad key`. Extra segments → `400`.
- `PUT`/`DELETE` without a key → `405`. Other methods → `405`.
- `PUT` needs a `content-type` whose media type is `application/json` (ignore `; charset=…`) and a parseable body → else `400`. If the value is an array longer
  than `maxItems` → `413` (`maxItems` applies to arrays only; no `maxItems` = no item limit).
- `global` + `PUT`/`DELETE` by a non-admin (case-insensitive email compare) → `403 {"error":"admins only"}`.
- All responses are JSON `{"error": "..."}` on failure, with `cache-control: private, no-store`.
- Unexpected exceptions → `500 {"error":"internal error"}` (log the detail, never return it).

### Request authentication (the important part)

Every request must carry these headers, added by the site's server-side layer:

| Header | Value |
|---|---|
| `x-kv-app` | site id (unknown → `401 unknown app`) |
| `x-kv-user` | signed-in user's email |
| `x-kv-timestamp` | unix seconds |
| `x-kv-signature` | hex HMAC-SHA256 (see below) |

**Signature** = `hex(HMAC_SHA256(secret, payload))` where `payload` is these 6 lines joined by `\n` (no trailing newline):

```
METHOD (uppercase)
path          (the action-relative path, e.g. /favorites/user/main)
app           (site id)
user email    (lowercased)
timestamp     (string, as sent)
sha256 hex of the raw body bytes (empty body → hash of zero bytes)
```

The secret is the action input named by the site's `secretEnv`. Order of checks: resolve `x-kv-app` (unknown → `401 unknown app`) → verify signature → then method, path and
routing. Verify **before** any routing or storage access:

- missing secret → `500 app secret not configured`
- missing signature/user/timestamp → `401 unsigned request`
- timestamp not a number, or `|now − timestamp| > 300 s` → `401 stale request`
- mismatch → `401 bad signature` — compare with `crypto.timingSafeEqual` (check lengths first)

**Test vector (both the service and the proxy must reproduce this exactly):**

```
secret    = test-secret
METHOD    = PUT
path      = /favorites/user/main
app       = my-site
user      = Jane@Example.com        (→ jane@example.com in the payload)
timestamp = 1700000000
body      = ["/a"]                  (5 bytes, sha256 0e17f6e6bd49eea9fdbc2a5a81225a8347ec40087e6a28352b28cc6f0667a881)
signature = 7f5b70f7517fb6e253f3595dc79322ac94fa0204f83807fbfc586c4a263fc1c0
```

### Storage (App Builder State)

- Keys: user doc `{app}.{feature}.u.{userHash}`, global doc `{app}.{feature}.g`, where
  `userHash = sha256hex(email.trim().toLowerCase()).slice(0, 32)` — no raw emails in keys.
- Values: the whole feature doc as a JSON string; `PUT` sets `doc[key]`, `DELETE` removes it; an empty doc deletes
  the State key. Doc > 256 KB → `413 document too large`.
- Body: with `raw-http`, `__ow_body` is a base64 string (absent = empty body); sign/hash the decoded bytes.
- TTL: write with `ttl: 365 days`; on read, `get()` returns `{ value, expiration }` (`expiration` is an ISO
  date string); if fewer than 335 days remain, re-put with a fresh 365-day TTL (active
  users never expire, abandoned data ages out).
- `index.js` creates the State client once per invocation with `require('@adobe/aio-lib-state').init()` and passes
  it to `handle(params, { apps, state, logger })`.

### Tests (`npm test` must pass before deploy)

Use an in-memory fake State (`get` → `{ value, expiration }`, `put`, `delete`). Cover at least:

1. The test vector above → exact signature.
2. Signed `PUT` then `GET` round-trips; `DELETE` → `204` and the doc is gone.
3. Two users don't see each other's `user` docs.
4. Unsigned → 401; bad signature → 401; timestamp 301 s old → 401; tampered body → 401.
5. Global `PUT` by non-admin → 403; by admin → 200; global `GET` by anyone → 200.
6. Unknown feature/scope → 404; bad key → 400; over `maxItems` → 413.

### `scripts/kv-request.mjs`

`node scripts/kv-request.mjs <METHOD> <path> [jsonBody] --user <email> --app <site-id>` — loads `.env` (no dotenv
dependency needed), looks up the app's `secretEnv` in `config/apps.json` and signs with that `.env` value (empty body
for `GET`/`DELETE`; `content-type: application/json` only on `PUT`), calls `KV_ACTION_URL`, prints status + body. Never prints the secret.

## Step 3 — Secret, deploy, smoke test

```bash
grep -q '^KV_SECRET_<…>=' .env || printf 'KV_SECRET_<…>=%s\n' "$(openssl rand -hex 32)" >> .env
npm test
# Admins are compiled in at deploy time; keep real emails out of git:
sed -i.bak 's/"admin@example.com"/"<real-admin@company.com>"/' config/apps.json && rm config/apps.json.bak
aio app deploy
git checkout -- config/apps.json 2>/dev/null || sed -i.bak 's/"<real-admin@company.com>"/"admin@example.com"/' config/apps.json
echo "KV_ACTION_URL=https://<namespace>.adobeioruntime.net/api/v1/web/stash/kv" >> .env
```

Smoke test (all five must match):

```bash
R="node scripts/kv-request.mjs"; A="--user smoke@example.com --app <site-id>"
$R PUT /favorites/user/smoke '["/a"]' $A     # 200
$R GET /favorites/user $A                    # 200 {"smoke":["/a"]}
$R PUT /links/global/menu '[]' $A            # 403 admins only
$R DELETE /favorites/user/smoke $A           # 204
curl -s -o /dev/null -w '%{http_code}\n' "<action-url>/favorites/user" -H 'x-kv-app: <site-id>'   # 401
```

A `403 ERR_DEPLOY_SERVICE_GET_WORKSPACE_INFO_ERROR` on deploy = wrong Adobe ID for the org (Step 0).

## Step 4 — Site proxy (`/api/kv/*`)

In the site's server-side layer (e.g. the AEM Edge Function that does SSO), before proxying to the EDS origin:

1. Match `/api/kv` and `/api/kv/*`; allow only `GET`, `PUT`, `DELETE` (else `405`).
2. Require a signed-in session with an email (else `401`). **Take identity only from the session**; drop any
   client-sent `x-kv-*` headers.
3. For `PUT`/`DELETE`, reject if `Origin` is present and ≠ the site origin (`403`). Cap bodies at 300 KB (`413`).
4. Strip the `/api/kv` prefix to get `path`, sign with the spec above (Web Crypto `crypto.subtle` works in edge
   runtimes), forward to `<action-url><path>` with the 4 `x-kv-*` headers and the original `content-type`.
5. Return the upstream status/body with `cache-control: private, no-store`.
6. Unit-test the signer against the **same test vector**.

Config on the proxy: the site secret (store as a **secret**, same value as `KV_SECRET_<…>` — copy it between config
stores without printing it) and the action URL.

Verify from a signed-in browser: `fetch('/api/kv/favorites/user').then(r => r.json())` → `{}`.

## Step 5 — Build a feature

Example — Favorites button on any page:

```js
const key = 'main';
const list = (await (await fetch('/api/kv/favorites/user')).json())[key] || [];
const on = list.includes(location.pathname);
// toggle:
const next = on ? list.filter((p) => p !== location.pathname) : [...list, location.pathname];
await fetch(`/api/kv/favorites/user/${key}`, {
  method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next),
});
```

Same pattern for "My List", recently viewed (`prefs`/`recent`), theme or language preference (`prefs`/`theme`), and
admin-curated quick links (`links/global/menu`, read by all, written by admins).

## Limits (App Builder State defaults, per Production workspace)

| Limit | Default | Rough meaning |
|---|---|---|
| Bandwidth | 10 MB/min (1 MB/s burst) | ≈ 30 req/s at ~5 KB docs — **first limit you hit** |
| Keys | 200K (ticket → 500K) | ~4 keys per user → ~50K users |
| Storage | 1 GB (ticket → 10 GB) | fine at a few KB per user |
| Value size | 1 MB | Stash caps docs at 256 KB |
| Runtime | 6,000 activations/min | raisable |

Over the limit → `429` (rate) or `403` (storage). Beyond that, raise limits via Adobe support or move to App Builder
Database. Source: https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/storage/

## Done

Report: org + project, action URL, site id, `npm test` result, the five smoke results, and whether `/api/kv` is wired.
Remind the user the site secret lives in two places (Stash `.env`/action input and the proxy's secret store) and must
be rotated in both together.
