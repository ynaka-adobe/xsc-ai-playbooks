
# Add experimentation audiences (region + group)

> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as
> background reference and don't wait for a separate instruction — **start now**: follow the steps below and guide
> the user through them one at a time, beginning with the first phase. (Human: you can just say "walk me through
> this" — but Claude should begin even if you don't.)
>
> _Auto-generated from the `add-experimentation-audiences` plugin skill. Edit the skill, not this file._

**Outcome**
- Authors personalize any section from DA without writing code.
- They add `Audience: <name> | <fragment link>` rows to the section's **Section Metadata**.
- On page load, the visitor sees the first matching fragment, or the section's own content if none match.
- Audiences that ship with this playbook:

| Audience | Matches when | Signal |
|---|---|---|
| `na` | CDN country is US, CA or MX | `/auth/geo` (CDN) |
| `jp` | CDN country is JP | `/auth/geo` (CDN) |
| `partners` | Signed in and the Okta `groups` claim contains `partners` (case-insensitive) | `/auth/me` |
| `employee` | Signed in and **not** in partners | `/auth/me` |

## Prerequisites: read these before starting
1. **The region audiences assume the CDN geo endpoint exists.**
   - `GET /auth/geo` on the site's custom domain must return JSON with `countryCode`, for example:
     `{"countryCode":"US","country":"united states","continent":"NA",...}`
   - The endpoint is `visitorGeo()` in the shared **xsc-demo-cug** edge function (AEM-p154856 `edge-functions-xsc-demo/src/index.js`). It uses Fastly `getGeolocationForIpAddress`.
   - It exists only on hosts routed through that edge function (`config-eds/cdn.yaml`). It does not exist on `*.aem.page`, `*.aem.live` or localhost.
   - Without it, `na` and `jp` never match; only the `?country=` simulation works.
   - If the site sits behind a different CDN, provide an equivalent same-origin endpoint, or change `visitorCountry()`.
   - Check: `curl -s https://<site>.ynaka-adobe.com/auth/geo` must return a `countryCode`.
2. **The group audiences need Okta sign-in:** run the `add-personal-okta` playbook first.
   - `GET /auth/me` must return `{"authenticated":false}` when signed out, and `{authenticated:true, groups:[...]}` when signed in.
   - Users must sign in again after their Okta groups change.
3. **Recommended:** the `add-abac-cug` playbook. Use it to protect group fragments so nobody can read them directly by URL.
4. **Region means where the visitor is**, from the CDN. The Okta profile country is deliberately ignored.

## Fixed facts
- Reference implementation: **ynaka-adobe/hitachienergy `main`**. It was originally ported from ynaka-adobe/suresmile, which used interest and visitor-location signals that were dropped here.
- The plugin `plugins/experimentation/` is the adobe-rnd aem-experimentation plugin. Copy the whole subtree from hitachienergy; its `src/index.js` was synced to suresmile.
- The plugin's `replaceInner` fetches the **full variant page** (not `.plain.html`) same-origin, with cookies.
  - It uses only the **first `main > div`**, so each variant page must have exactly one section.
  - Any non-OK response (401, 403 or 404) keeps the default content. This is why CUG-protected variants fail safe.
- Audience names are normalized with `toClassName`, so `Audience: Partners` becomes `partners`.
- Publishing can turn section-metadata rows into section attributes (`data-audience:-jp="<url>"`). `restoreAudienceBlocks()` rebuilds a temporary section-metadata block so the plugin still sees them.
- `applyAudiences(main)` must run in `loadEager` **before** `decorateMain`. Swapped-in content is then auto-blocked and decorated like normal content, including anchor-nav and lock icons.
- Each signal waits at most **600 ms**, after which the default content is shown.
  - `/auth/me` is cached in sessionStorage for 5 minutes and cleared on Sign in/out clicks.
  - `/auth/geo` is cached for the tab session.
- Simulation params:
  - `?audience=<name>` (plugin built-in). `?audience=default` forces the default content.
  - `?country=<CC>` (in audiences.js) is remembered for the tab. `?country=NONE` clears it.
- Push and merge with `ynakagawa`: `GH_HOST=github.com GH_TOKEN=$COPILOT_GH_ACCOUNT_github_2E_com_ynakagawa gh ...`

## Credentials (never print values)
- **DA writes:** get an IMS S2S token with `.env` keys `APP_BUILDER_AEMp154856_CLIENTID` and `_CLIENT_SECRET`:
  `POST https://ims-na1.adobelogin.com/ims/token/v3`, `grant_type=client_credentials`, scope `openid,AdobeID,read_organizations,additional_info.projectedProductContext`.
  Then `POST https://admin.da.live/source/<org>/<site>/<path>.html` with a multipart field `data` (text/html). Expect 201. **Use curl**; Python urllib gets Cloudflare `403 error code: 1010`.
- **Preview/publish:** `POST https://admin.hlx.page/{preview,live}/<org>/<site>/main/<path>` with **both** headers `x-auth-token: $ADMIN_API_KEY` and `x-content-source-authorization: Bearer <IMS>`. Either header alone returns 401.
- **Purge:** `POST https://admin.hlx.page/cache/<org>/<site>/main/<path>` with `x-auth-token`.

## Steps

### 1. Check the prerequisites (read-only)
```bash
curl -s https://<site>.ynaka-adobe.com/auth/geo   # must contain countryCode
curl -s https://<site>.ynaka-adobe.com/auth/me    # {"authenticated":false} when signed out
```
- If `/auth/geo` is missing, stop. Tell the user that region audiences need the CDN endpoint (route the host through xsc-demo-cug), or offer to ship group audiences only.

### 2. Port the code (site repo, PR, merge)
1. Copy `plugins/experimentation/` from hitachienergy main if it's missing or outdated.
2. Create `scripts/audiences.js` using the **Reference: scripts/audiences.js** section below.
   - Rename the `he.` sessionStorage prefix to the site's own prefix.
   - Adjust `NA_COUNTRIES`, or add audiences to `AUDIENCES`, if the user asks.
3. In `scripts/scripts.js`:
   - Add `import { applyAudiences } from './audiences.js';`.
   - In `loadEager`, add `await applyAudiences(main);` right before `decorateMain(main);`.
4. In `blocks/header/header.js`, clear the cached session when the user signs in or out:
   ```js
   import { clearAudienceCache } from '../../scripts/audiences.js';
   // on the auth <li>:
   li.addEventListener('click', (e) => {
     if (e.target.closest('a[href^="/auth/"]')) clearAudienceCache();
   });
   ```
5. Optional author tooling:
   - Copy `tools/audiences/{audiences.html,audiences.js,audiences.css}`. This is a Sidekick palette for simulating audiences and countries.
   - Add these two plugins to `tools/sidekick/config.json`:
   ```json
   {"id":"audiences","title":"Audiences","url":"/tools/audiences/audiences.html","isPalette":true,"passReferrer":true,
    "paletteRect":"top: 40px; right: 0; width: 400px; height: calc(100% - 40px);","environments":["preview","live","prod"],"includePaths":["**"]},
   {"id":"experimentation","title":"Experimentation","event":"experimentation","environments":["preview","live","prod"],"includePaths":["**"]}
   ```
   - The DA A/B panel also needs the `?daexperiment=` hook (`import('https://da.live/nx/public/plugins/exp/exp.js')`) and `NX_ORIGIN`/sidekick.js. Copy them from hitachienergy if missing.
6. Run `npm run lint`, then open the PR and merge it.

### 3. Author content (DA). Recommended structure
- Put each independently personalized area in **its own section**.
  - Example: the hero (by region), then a section break, then the menu (by group).
  - One section carries one set of audience rows. Mixing region and group in one section needs a fragment for every combination.
- Keep fragments **inside the language folder**; they contain translatable text and get copied when the folder is translated:
  - `/<lang>/fragments/region/<na|jp>/home-hero`
  - `/<lang>/fragments/group/<partners|employee>/home-menu`
- Each fragment is a single-section page that contains only the replacement content.
- Section Metadata on the page lists one row per audience, most specific first:

| Section Metadata | |
|---|---|
| Audience: jp | /en/fragments/region/jp/home-hero |
| Audience: na | /en/fragments/region/na/home-hero |

| Section Metadata | |
|---|---|
| Audience: partners | /en/fragments/group/partners/home-menu |
| Audience: employee | /en/fragments/group/employee/home-menu |

- A swapped-in menu needs at least one `#` link to remain an anchor-nav (if the site uses that auto-block).
- Preview and publish every fragment and the page. Index pages publish as `<lang>/`, with a trailing slash.

### 4. Protect the group fragments (if add-abac-cug is installed)
- Use the Secure (ABAC) tool, or merge into headers.json (GET first; a POST replaces the file):
  - `/<lang>/fragments/group/partners/**`: `logged-in, group:partners`
  - `/<lang>/fragments/group/employee/**`: `logged-in`
- Update and publish `protected-paths.json`.
- Region fragments stay public.
- CUG paths must match the actual URLs: `/en/partners/` does **not** match `/partners/**`.

### 5. Purge and verify
1. Wait until `main--<site>--<org>.aem.live/scripts/audiences.js` serves the new code (about 20 s).
2. Purge the changed code files, the page and the fragments.
3. Browsers cache scripts for up to 2 hours: use a hard refresh, or fetch with `cache:'reload'`.

| Where | URL | Expect |
|---|---|---|
| custom domain | `/` (no params, US visitor) | `na` hero |
| custom domain | `?country=JP` | `jp` hero |
| custom domain | `?country=FR` | default hero |
| custom domain | signed out | default menu; group fragment fetch returns 401 |
| custom domain | signed in as partner | partners menu |
| custom domain | signed in, not a partner | employee menu |
| aem.live (no CUG) | `?audience=partners` / `?audience=employee` | menu swaps |

- Wait about 3 s after load before inspecting; lock icons are added in the delayed phase.
- `window.hlx.audiences` shows the selected audience and `servedExperience`. If the selection is correct but `servedExperience` is null, the variant fetch was denied (CUG) or returned 404.
- A real signed-in check needs the user's own Okta session. Ask the user to confirm the partner and employee menus.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Region never matches on the custom domain | `/auth/geo` is missing or not JSON: the host isn't routed through xsc-demo-cug. |
| Nothing swaps on aem.page/aem.live | Expected; no `/auth/*` routes there. Use `?audience=` or `?country=`. |
| Group audience selected but the content didn't change | The variant fetch returned 401/403 (signed out or wrong group) or 404 (unpublished). Check `hlx.audiences`. |
| Partner sees the employee menu | Rows are in the wrong order, or the `groups` claim lacks `partners`. The user must sign in again after a group change. |
| Still shows the old audience after sign-in | Stale `/auth/me` cache: the header click hook is missing, or wait 5 minutes. |
| Only part of the variant appears | The variant page has more than one section; only the first is used. |
| Menu lost its styling after a swap | The variant menu has no `#` link, so the anchor-nav auto-block didn't build. |
| Shows the wrong country while testing | A `?country=` override is remembered for the tab. Visit `?country=NONE` to clear it. |

## Reference: scripts/audiences.js (from hitachienergy main)
```js
/**
 * Audiences for the experimentation plugin (plugins/experimentation).
 *
 * Authors add rows to a section's metadata table, in priority order:
 *   Audience: jp        | /fragments/hero-japan
 *   Audience: partners  | /fragments/hero-partners
 * and the plugin swaps the section for the first matching variant.
 *
 * Signals come from the xsc-demo-cug edge function on the custom domain:
 *  - /auth/me: Okta session (authenticated, groups) for the group audiences;
 *  - /auth/geo: CDN country for the region audiences (the Okta profile
 *    country is deliberately ignored: region means where the visitor is).
 * Group variants live under CUG-protected paths; the plugin fetches them
 * same-origin with the session cookie, and a 401/403 keeps the default.
 * Neither route exists on aem.page/aem.live/localhost, so only the simulation
 * params work there: ?audience=<name> (plugin) and ?country=<code> (this file).
 */

const NA_COUNTRIES = ['US', 'CA', 'MX'];
const SIGNAL_WAIT_MS = 600; // sections wait at most this long, then show default content
const ME_KEY = 'he.audience.me';
const ME_TTL_MS = 5 * 60 * 1000;
const GEO_KEY = 'he.audience.geo';
const COUNTRY_KEY = 'he.audience.country.override';

const COUNTRY_NAMES = {
  'UNITED STATES': 'US', USA: 'US', CANADA: 'CA', MEXICO: 'MX', JAPAN: 'JP',
};

function read(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

function write(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

/** Sign in/out changes the session: header links call this before navigating. */
export function clearAudienceCache() {
  try { sessionStorage.removeItem(ME_KEY); } catch { /* ignore */ }
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((resolve) => { window.setTimeout(() => resolve(null), SIGNAL_WAIT_MS); }),
  ]);
}

async function getJson(path) {
  try {
    const resp = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
    if (!resp.ok || !resp.headers.get('content-type')?.includes('json')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export function toCountryCode(value) {
  const v = String(value || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(v)) return v;
  return COUNTRY_NAMES[v] || null;
}

let mePromise;
/** Okta session, or { authenticated: false }. Cached briefly for this tab. */
function session() {
  if (!mePromise) {
    const cached = read(ME_KEY);
    mePromise = cached && Date.now() - cached.at < ME_TTL_MS
      ? Promise.resolve(cached.me)
      : withTimeout(getJson('/auth/me')).then((me) => {
        const value = me || { authenticated: false };
        if (me) write(ME_KEY, { at: Date.now(), me: value });
        return value;
      });
  }
  return mePromise;
}

let countryPromise;
/** ?country= override (remembered for the tab), else the CDN country. */
export function visitorCountry() {
  if (countryPromise) return countryPromise;
  const param = (new URLSearchParams(window.location.search).get('country') || '').toUpperCase();
  if (param === 'NONE') write(COUNTRY_KEY, null);
  else if (toCountryCode(param)) write(COUNTRY_KEY, toCountryCode(param));
  const override = read(COUNTRY_KEY);
  if (override) {
    countryPromise = Promise.resolve(override);
    return countryPromise;
  }
  countryPromise = (async () => {
    let geo = read(GEO_KEY);
    if (!geo) {
      geo = await withTimeout(getJson('/auth/geo'));
      if (geo) write(GEO_KEY, { countryCode: geo.countryCode || '' });
    }
    return toCountryCode(geo?.countryCode);
  })();
  return countryPromise;
}

async function inGroup(name) {
  const me = await session();
  return !!me?.authenticated && (me.groups || [])
    .some((g) => String(g).toLowerCase() === name);
}

export const AUDIENCES = {
  na: async () => NA_COUNTRIES.includes(await visitorCountry()),
  jp: async () => (await visitorCountry()) === 'JP',
  partners: () => inGroup('partners'),
  // signed-in users who are not partners
  employee: async () => !!(await session())?.authenticated && !(await inGroup('partners')),
};

/**
 * Some publish paths turn section-metadata rows into section attributes
 * ("Audience: jp" → data-audience:-jp="<url>"). The plugin reads
 * section-metadata blocks, so rebuild a temporary one from those attributes.
 */
function audienceNameFromAttribute(attribute) {
  const match = /^data-audience[:-]+([a-z0-9][a-z0-9-]*)$/i.exec(attribute);
  return match ? match[1].toLowerCase() : null;
}

function restoreAudienceBlocks(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const declared = section.getAttributeNames()
      .map((attribute) => [attribute, audienceNameFromAttribute(attribute)])
      .filter(([, name]) => name);
    if (!declared.length) return;
    const meta = document.createElement('div');
    meta.className = 'section-metadata';
    meta.dataset.synthetic = 'true';
    declared.forEach(([attribute, name]) => {
      const row = document.createElement('div');
      const key = document.createElement('div');
      key.textContent = `Audience ${name}`;
      const value = document.createElement('div');
      const link = document.createElement('a');
      link.href = section.getAttribute(attribute);
      link.textContent = link.href;
      value.append(link);
      row.append(key, value);
      meta.append(row);
    });
    section.append(meta);
  });
}

function hasAudienceRows(main) {
  return [...main.querySelectorAll('.section-metadata > div > div:first-child, .metadata > div > div:first-child')]
    .some((cell) => /^audience/i.test(cell.textContent.trim()));
}

/**
 * Runs the plugin only when the page declares audiences, before sections are
 * decorated so a swapped-in variant is decorated like any other content.
 * @param {HTMLElement} main
 */
export async function applyAudiences(main) {
  restoreAudienceBlocks(main);
  if (!hasAudienceRows(main)) return;
  try {
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    await loadEager(document, { audiences: AUDIENCES });
    // Sections that declare audiences but matched none keep their default content.
    main.querySelectorAll('.section-metadata').forEach((meta) => {
      const section = meta.parentElement;
      const declares = [...meta.querySelectorAll(':scope > div > div:first-child')]
        .some((cell) => /^audience/i.test(cell.textContent.trim()));
      if (declares && !section.dataset.audience) section.dataset.audience = 'default';
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('audiences: showing default content', e);
  } finally {
    main.querySelectorAll('.section-metadata[data-synthetic]').forEach((meta) => meta.remove());
  }
}
```
