---
name: add-personal-okta
description: Add personal Okta sign-in and an Okta user-profile flyout to a *.ynaka-adobe.com EDS site by routing it through the shared xsc-demo-cug edge function (server-side OIDC, secret never in the browser). Use when someone says "add personal okta", "add okta login", "add sign in", or "show okta profile/groups in the header".
---

# Add personal Okta (sign-in + profile flyout)

Outcome: `https://<sub>.ynaka-adobe.com` shows **Sign in** in the header. Sign-in uses the personal Okta app. Once signed in, an avatar/name button opens a flyout with name, email, City, State, Country, Company and Okta groups, plus **Sign out**. Pages stay public.

## Fixed facts (do not re-derive)

| Item | Value |
| --- | --- |
| Okta org (personal) | `https://trial-5076725.okta.com` (org auth server) |
| Okta app | client ID `0oa18l1budg5m7Fnh698`, **Web** app (requires a client secret) |
| Redirect URIs | wildcard `https://*.ynaka-adobe.com/auth/callback` (already set; a new host needs **no Okta change**) |
| Edge function | `xsc-demo-cug` in `ynaka-adobe/AEM-p154856`, dir `edge-functions-xsc-demo` |
| CDN config | `AEM-p154856/config-eds/cdn.yaml`, deployed by the Cloud Manager Edge Delivery config pipeline on push to `main` |
| IMS org | `21BD487E5F2280130A495ECC@AdobeOrg`, program `154856` |
| Git account | push and merge as `ynakagawa` (`GH_HOST=github.com GH_TOKEN=$COPILOT_GH_ACCOUNT_github_2E_com_ynakagawa gh ...`). The `ynaka_adobe` token is denied push. |
| Adobe Okta | only `xsc-demo.ynaka-adobe.com` uses it (`XSC_DEMO_OKTA_*`). Every other host uses the personal app automatically. |

## Never do

- Do not implement browser-only PKCE against this Okta app. It's a Web app, so the token call returns `invalid_client`.
- Do not put the client secret in site code, `.env` of the EDS repo, or App Builder. It lives only in the edge-function secret store (`XSC_OKTA_CLIENT_SECRET`, a Cloud Manager secret).
- Do not change other domains' routes, and do not repoint the shared config pipeline.

## Inputs

- `SITE_HOST`, e.g. `hitachienergy.ynaka-adobe.com`. The custom domain must already be added in Cloud Manager and serving the EDS site.
- `EDS_REPO`, e.g. `ynaka-adobe/hitachienergy`.
- The EDS origin defaults to `main--<subdomain>--ynaka-adobe.aem.live`. If the repo name differs from the subdomain, add a `SITES` entry with `ORIGIN_HOSTNAME` in `edge-functions-xsc-demo/src/sites.js`.

## Step 1: Route the host through the edge function (AEM-p154856)

1. In `config-eds/cdn.yaml`, next to the other `route-*-cug` rules, add:
   ```yaml
   - name: route-<subdomain>-cug
     when:
       allOf:
         - { reqProperty: domain, equals: "<SITE_HOST>" }
     action: { type: selectAemOrigin, originName: edgefunction-xsc-demo-cug, skipCache: true }
   ```
2. Add the host to the "Additional sites" list in `edge-functions-xsc-demo/README.md`. Add a host-resolution test in `edge-functions-xsc-demo/test/sites.test.mjs`, then run `npm test`.
3. Merge to `main` as ynakagawa. The Cloud Manager config pipeline deploys it. Confirm with the user first, because the pipeline is shared by every site on this CDN.

## Step 2 (only if the function code changed): deploy the edge function

A config-pipeline run does **not** update function code. To ship changes to `src/`:

```bash
cd edge-functions-xsc-demo
# In a fresh worktree, copy the gitignored setup from the main checkout first:
#   cp /Users/ynaka/Documents/ynaka-adobe/AEM-p154856/edge-functions-xsc-demo/{.aio,.env} .
aio aem edge-functions build && aio aem edge-functions deploy xsc-demo-cug
```

The error `API endpoint not configured` means `.aio` is missing. The function is shared with xsc-demo, so confirm with the user before deploying.

## Step 3: Header UI in the EDS repo

In `blocks/header/header.js` and `header.css`, following the pattern in `ynaka-adobe/hitachienergy` (merged PRs #4 and #5):

- **Signed out:** a link `/auth/login?returnTo=<encodeURIComponent(path+search)>`. Reuse the authored "Login" icon in `.nav-tools` so the label isn't duplicated.
- **Signed in:** call `fetch('/auth/me', { credentials: 'same-origin', cache: 'no-store' })`. If `authenticated` is true, show an avatar (initials) and name button that toggles the flyout. Support Esc and click-outside to close, and set `aria-expanded`.
- **Flyout:** name, email, then City, State, Country, Company (hide empty fields), the `groups` as chips, and a **Sign out** link to `/auth/logout`.
- If `/auth/me` fails or isn't JSON (on aem.page, aem.live or localhost, where there's no edge function), show Sign in and keep the page working.
- Remove any old `scripts/auth.js` or client-side `/auth/callback` handling. The edge function owns the callback.
- Run `npm run lint`, open a PR as ynakagawa, and merge.

`/auth/me` response shape:

```json
{ "authenticated": true, "email": "", "name": "", "groups": [], "country": "", "state": "", "city": "", "company": "", "attributes": [] }
```

Signed out: `{ "authenticated": false }`.

Profile field sources, in priority order:

- **country:** custom claim `country`, then `address.country` (Okta profile **Country code**).
- **state:** claim `state`, then `address.region`.
- **city:** claim `city`, then `address.locality`.
- **company:** claim `company`, then the email domain.
- **groups:** the `groups` claim.

The `address` scope must be requested; it is in the default scopes. Missing values fall back to `/userinfo`.

## Step 4: Clear the CDN cache and verify

1. The custom domain's CDN can keep serving stale code for up to 2 hours. Purge each changed file with the admin key from the EDS repo's `.env` (`ADMIN_API_KEY`; never print it):
   ```bash
   curl -X POST -H "x-auth-token: $ADMIN_API_KEY" \
     https://admin.hlx.page/cache/<owner>/<repo>/main/<path>
   ```
2. Check the endpoints:
   - `curl -sI https://<SITE_HOST>/auth/login` should return 302 to `trial-5076725.okta.com/oauth2/v1/authorize`, with `redirect_uri=https://<SITE_HOST>/auth/callback` and a `cug_tx` cookie on `Path=/auth`.
   - `curl -s https://<SITE_HOST>/auth/me` should return `{"authenticated":false}`.
3. Ask the user to hard-refresh, or use an incognito window, sign in from the site's button, and confirm the flyout.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `invalid_client` from Okta token call | Browser PKCE code is still in use; switch to the edge-function flow |
| "Login session expired or invalid state" | Stale cached header JS sent the user straight to Okta, so there was no `cug_tx` cookie. Purge the cache, hard-refresh, and start from the site's Sign in button. |
| `/auth/callback` 404 in the network tab on aem.live | Expected: aem.live has no edge function. Only the custom domain has auth. |
| Country shows the wrong value (e.g. JP) | Set the user's **Country code** in Okta Admin → Directory → People → Profile, then sign in again |
| City or State blank | The Okta profile fields are empty, or the session is from before the field was added. Sign out and back in. |
| Site renders unstyled or broken after a deploy | The custom-domain CDN is stale; purge the changed files (Step 4) |
