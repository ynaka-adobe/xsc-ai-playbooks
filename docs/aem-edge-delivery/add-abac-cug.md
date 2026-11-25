
# Add ABAC page access (Secure (ABAC) plugin + lock icons)

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as
> background reference and don't wait for a separate instruction — **start now**: follow the steps below and guide
> the user through them one at a time, beginning with the first phase. (Human: you can just say "walk me through
> this" — but Claude should begin even if you don't.)
>
> _Auto-generated from the `add-abac-cug` plugin skill. Edit the skill, not this file._

**Outcome**
- In da.live, authors open **Secure (ABAC)** on any page.
- They pick a path pattern plus Country and/or Group, then **Save** and **Apply**.
- Visitors who aren't signed in are redirected to Okta.
- Signed-in visitors who don't match get the shared 403 "Access denied" page.
- Links to protected pages show a 🔒 everywhere on the site.

**Prerequisite:** run the `add-personal-okta` playbook first. The site must already be routed through
the `xsc-demo-cug` edge function (CDN route in AEM-p154856 `config-eds/cdn.yaml`), and
`/auth/login` must work. No edge-function change or deploy is needed for this playbook.

## Fixed facts
- Reference implementation: **ynaka-adobe/hitachienergy**. Copy from its `main`, not from
  xsc-demo.
  - It has the Groups dropdown and protected-paths publishing.
  - Files:
    - `tools/cug/` (cug.html, cug.js, cug.css, rules.js)
    - `scripts/protected-links.js`, loaded from `scripts/delayed.js`
    - the `.restricted-icon` CSS in `styles/lazy-styles.css`
- Enforcement: AEM-p154856 `edge-functions-xsc-demo/src/index.js` and `src/abac.js`.
  - It reads the `x-aem-cug-required`, `x-aem-cug-groups` and `x-aem-cug-login-path` response
    headers for every routed host.
  - It lowercases groups, so matching is case-insensitive.
- Rule syntax (the Groups cell): `,` = AND, `|` = OR. Tokens are `logged-in`, `country:XX`,
  `group:name` and `company:name`. The UI writes things like `logged-in, country:JP, group:xsc`.
- Supported attributes: country, group and company only. City and state are NOT enforced yet;
  that needs an abac.js change plus `aio aem edge-functions build && aio aem edge-functions deploy xsc-demo-cug`.
- The UI dropdowns are in `rules.js`:
  - COUNTRIES: US, JP, DE.
  - GROUPS: na, partners, XSC, auth-group. Company was removed from the UI.
  - Ask the user whether this site needs different lists.
- Group rules only match if the Okta app sends those names in the `groups` claim. Users must sign
  in again after a group change.
- Git: push and merge with the `ynakagawa` account:
  `GH_HOST=github.com GH_TOKEN=$COPILOT_GH_ACCOUNT_github_2E_com_ynakagawa gh ...`
  The default token is denied push.

## Credentials (never print values)
- **DA user token:** `aio config get ims.contexts.cli.access_token.token`. Use it as a Bearer
  token on admin.da.live.
- **DA unattended token (S2S):** in the site `.env`, `APP_BUILDER_AEMp154856_CLIENTID` and
  `APP_BUILDER_AEMp154856_CLIENT_SECRET`. If the site lacks them, copy them from the hitachienergy
  `.env`.
  ```bash
  curl -s https://ims-na1.adobelogin.com/ims/token/v3 \
    -d grant_type=client_credentials -d client_id="$CID" -d client_secret="$SECRET" \
    -d scope=openid,AdobeID,read_organizations,additional_info.projectedProductContext
  ```
  - Technical account `A3E0819B6A63805E0A495C71@techacct.adobe.com` already has write access on
    the ynaka-adobe org's DA `CONFIG` and `/ + **`.
- **Admin API:** `ADMIN_API_KEY` in the site `.env`, sent as `x-auth-token`. Use it for cache
  purge, and for preview/publish together with `x-content-source-authorization: Bearer <S2S token>`.
  admin.hlx.page rejects the S2S bearer token alone with 401.
- **Use curl for admin.da.live.** Python urllib's default User-Agent gets Cloudflare
  `403 error code: 1010`, which looks like a permissions error.
- The aem-da MCP tools can reach DA `/source` only, not `/config`.

## Never do
- Restyle or brand the 403 "Access denied" page per site. It is shared by all sites in the edge
  function's `forbidden()`.
- POST a DA config without first GETting it and merging. A POST replaces the whole config.
- Publish groups or countries publicly. `protected-paths.json` holds paths only.
- Put a CUG rule on `/protected-paths.json`, `/tools/**`, `/scripts/**`, `/styles/**`,
  `/blocks/**`, `/nav*` or `/footer*`.
- Edit the user's local checkouts. Do the work in a session worktree.

## Inputs
- Site repo `ynaka-adobe/<site>` and host `<site>.ynaka-adobe.com`.
- Optional: custom COUNTRIES/GROUPS lists, and initial rules to apply.

## Steps

### 1. Check current state (read-only)
```bash
curl -s -H "x-auth-token: $ADMIN_API_KEY" https://admin.hlx.page/config/ynaka-adobe/sites/<site>/headers.json
curl -s -o /dev/null -w "%{http_code}\n" https://<site>.ynaka-adobe.com/auth/me
curl -s -H "Authorization: Bearer $DA_TOKEN" https://admin.da.live/config/ynaka-adobe/<site>
```
- `/auth/me` must return 200 JSON. If not, run add-personal-okta first.
- A 404 on headers.json means no rules yet, so all pages are public.

### 2. Port the code (site repo, PR, merge to main)
1. Copy these from hitachienergy `main`:
   - `tools/cug/*`
   - `scripts/protected-links.js`
   - its import/call in `scripts/delayed.js`
   - the `.restricted-icon` rules in `styles/lazy-styles.css`

   Adjust anything that hardcodes `hitachienergy`; the tool should derive org/site from the DA
   SDK context.
2. If the site has an anchor-nav auto-block (`buildAnchorNavBlocks` in scripts.js), make sure it
   builds when the list has 2 or more links and at least one `#` link, not only when every link
   is `#`. Otherwise adding page links like `/partners/` leaves the nav unstyled.
3. Run `npm run lint`, open a PR, and merge it as ynakagawa.

### 3. Register the plugin in DA config
- GET `https://admin.da.live/config/ynaka-adobe/<site>`.
- If it returns 404, create it. If it exists, merge these rows into the existing sheets.
- POST it back as multipart `-F "config=<json>"`.
```json
{":names":["library","prepare"],":version":3,":type":"multi-sheet",
 "library":{"total":1,"limit":1,"offset":0,"data":[{"title":"Secure (ABAC)","path":"/tools/cug/cug.html","format":"https://da.live/img/icons/s2-icon-key-20-n.svg#icon","icon":"","experience":"","ref":""}]},
 "prepare":{"total":1,"limit":1,"offset":0,"data":[{"title":"Secure (ABAC)","path":"https://main--<site>--ynaka-adobe.aem.page/tools/cug/cug.html","icon":"https://da.live/img/icons/s2-icon-key-20-n.svg#icon","experience":""}]}}
```
- Then GET the config again to confirm.

### 4. Optional: seed rules and the lock list
The user normally does this in DA: open a page, choose **Secure (ABAC)**, **Save**, then **Apply**.
- `closed-user-groups.json` is created on the first Save.
- Apply POSTs `admin.hlx.page/config/ynaka-adobe/sites/<site>/headers.json`, merging with the
  existing non-CUG headers.
- Apply also writes and publishes `protected-paths.json`.

To seed `protected-paths.json` unattended:
1. PUT the sheet into DA with the S2S token.
2. Preview and publish it:
   ```bash
   for op in preview live; do
     curl -s -X POST -H "x-auth-token: $ADMIN_API_KEY" -H "x-content-source-authorization: Bearer $S2S" \
       https://admin.hlx.page/$op/ynaka-adobe/<site>/main/protected-paths.json
   done
   ```

### 5. Purge and verify
1. Purge each changed file on the custom domain. The managed CDN caches code for up to 2 hours
   (`max-age=7200`).
   ```bash
   curl -s -X POST -H "x-auth-token: $ADMIN_API_KEY" https://admin.hlx.page/cache/ynaka-adobe/<site>/main/<path>
   ```
2. Check:
   - `https://<site>.ynaka-adobe.com/tools/cug/cug.html` returns 200.
   - `/protected-paths.json` returns 200 publicly.
   - A protected path returns 401 or a redirect to `/auth/login` when signed out.
   - Links to protected paths show the lock icon. Check with Playwright or a screenshot.
3. Tell the user: reload da.live, then open **Secure (ABAC)**. Browsers that loaded the site in
   the last 2 hours need a hard refresh to see the icons.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| "Secure (ABAC)" not in DA | The DA config rows are missing. Re-check step 3 and reload da.live. |
| 403 "Access denied … Missing: group X" | Working as intended. Add the user to Okta group X, then sign out and back in. |
| Country shows the wrong value (e.g. JP) | It comes from the Okta profile's Country code. Fix it in Okta Admin, then sign in again. |
| Rule applied but page is still public | The host isn't routed through the edge function (cdn.yaml), or headers.json wasn't posted. |
| admin.da.live returns 403 with "error code: 1010" | Cloudflare blocked the client. Use curl. |
| admin.hlx.page preview/publish returns 401 with the S2S token | Use `x-auth-token: ADMIN_API_KEY` plus `x-content-source-authorization`. |
| In-page nav suddenly unstyled | The anchor-nav auto-block required all `#` links. See step 2.2. |
| Lock icons missing | `/protected-paths.json` is 404 or stale; re-Apply or seed it (step 4), purge, then hard refresh. |
