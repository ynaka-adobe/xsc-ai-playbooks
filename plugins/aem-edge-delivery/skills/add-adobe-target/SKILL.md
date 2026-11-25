---
name: add-adobe-target
description: Path B integration — add Adobe Target to a clean or existing EDS demo using bundled, pinned non-secret assets and an idempotent source-to-destination manifest. Includes client wiring, DA library templates, optional activity tools, and path-dependent secure configuration. Use when someone says "add Adobe Target", "add personalization to my demo", "set up experience targeting", or "add a targeted hero/offer".
---

# Add Adobe Target to an EDS Demo (Path B example)

Help an Adobe XSC product specialist add or complete Adobe Target on an existing EDS demo. Use
`ynaka-adobe/da-demo-kit` as the canonical code source; inspect the destination before importing anything.
Creating a GitHub repo from a template does **not** copy DA content, library configuration, or permissions.

Source code verified read-only on 2026-11-24 at
[`28d116639fd30e75c4cfccfa7cad695e284aecae`](https://github.com/ynaka-adobe/da-demo-kit/tree/28d116639fd30e75c4cfccfa7cad695e284aecae).
DA source metadata and non-secret library content were checked separately; DA config-store registration could
not be verified because the prior config GET returned **401**. Recheck the source revision and destination
configuration when executing this guide; don't invent a config path or row schema.

## Invoke with the portable bundle

With the `aem-edge-delivery` plugin loaded, invoke **`/aem-edge-delivery:add-adobe-target`** in Claude Code from
the destination EDS repo (or select `add-adobe-target` in a host that exposes the short skill name).
For an unpublished local checkout, start Claude Code in the destination with
`claude --plugin-dir /absolute/path/to/xsc-ai-playbooks/plugins/aem-edge-delivery`, then invoke the namespaced
skill. This loads the local plugin; it does not push changes or update an installed marketplace copy.
Resolve **`assets/manifest.json` relative to this loaded SKILL.md**, not to the destination working directory.
Read `assets/README.md` and the manifest before acting. The whole skill directory, including `assets/`, is inside
the marketplace's registered plugin root, so the installed skill can reach these resources without installing
another tool. Do not modify the installed resource files or the playbooks repo while integrating a destination.

The bundle includes pinned client files, the Target Offer block, optional hosted-tool UI and UE model, license
notices, merge snippets, and neutral DA library templates. Use these local resources rather than downloading
moving `main` files from da-demo-kit. Source-to-destination mappings and hashes are in the manifest.
The supported clean fixture is `adobe/aem-boilerplate` at
`9a904130e124feebeee199f35eddb8fc8931488e`; inspect equivalent lifecycle/config in other EDS variants.

**Safe repeat invocation:** for each selected copy entry, create missing files, skip byte-identical files,
and preserve differing files until a reviewed update is approved. Merge imports/calls by symbol, head metadata
by name, Sidekick plugins by ID, ignore entries by exact path, and DA rows by destination identity. If Target
values differ, resolve the requested mbox/tenant/scope explicitly; don't append a second entry.
Stop an ambiguous merge instead of overwriting existing integrations. Already satisfied merges are no-ops.
There is no standalone installer: the skill performs inspected, surgical file operations using the resources.

If this guide was copied from the web catalog without an installed plugin, it is **not** a locally invokable
bundle. Locate the skill resources in an authorized checkout of `xsc-ai-playbooks` or use the
[repository bundle](https://github.com/ynaka-adobe/xsc-ai-playbooks/tree/main/plugins/aem-edge-delivery/skills/add-adobe-target/assets)
after confirming its source manifest; do not claim the generated docs page installs assets or authorizes writes.

## How to run this

- **Ask with clickable dialogs.** Use the environment's question tool (`ask_user` / `AskUserQuestion`) for
  inputs and choices, not prose questions. Gather destination owner/site, branch, preview URL, DA workspace,
  Target tenant, mbox/selector, and whether DA library authoring, activity tools, or UE support are wanted.
- **Prerequisite:** a working EDS repo and preview, with a separately provisioned DA workspace if using DA.
  If missing, use `create-eds-repo`.
- **Detect the whole integration.** Audit all required files, helper exports, initialization calls, metadata,
  library content/config, and access. Existing `scripts/target.js` and `deps/at/` alone are not completion.
  Skip only individually verified dependencies; preserve destination changes and merge config entries by ID.
- **Skill authoring is not integration execution.** If asked to update this guide, edit this repository only.
  Do not sync DA, read credentials, install plugins, deploy, push, create activities, or publish.
- For an actual integration, explain each phase and obtain explicit approval before remote content/config writes,
  activity creation/changes, deployment, pushing, publishing, or opening/merging a PR. Do not run a blanket
  `sync-da-content` operation: this guide does not authorize copying source credentials or unrelated config.

## Step 0 — Choose the path and provision only its access

| Path | Dependencies and access |
|---|---|
| Minimum page personalization | Steps 1–3: client modules, compatible EDS helpers, metadata, an actual page-load or hero-mbox activity, and matching tenant at.js. No DA activity tool, credential sheet, or new App Builder deployment is inherently required. |
| DA block authoring | Target Offer code plus Step 4: DA library config registration, library index, authored example, and destination content/config access. |
| Hosted activity management (optional) | Step 5: three tool UI files, hosted DA SDK, reachable shared Runtime action, and authorized access to the intended Target tenant. |
| Independent backend / sheet-consuming integration (optional) | Step 6: approved backend deployment, tenant-specific credentials/config, and separately verified DA permissions and schema. |

For the shared **acsmarketing** demo tenant, request access if needed at
https://acrs.adobe.com/go/6bff542e-f709-499f-8156-57e0fc914510 and verify access in the
[Target activity library](https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary).
Do not assume a successful hosted tool listing proves the user's Target Console permissions.
For another tenant, use its approved implementation and activity-library link, not shared demo settings.

DA content access, DA config-store access, GitHub/AEM Code Sync access, EDS preview/publish rights, and Target
permissions are separate. Ask the destination admin for the least privileges needed on the relevant paths and
config entries; never copy source permissions or grant broad org-wide writes just to make the demo work.

## Step 1 — Import client components and verify existing helpers

Use `assets/eds/<source path>` for the table below, following the manifest copy policy. Copy only missing or
deliberately reviewed updates, using the same destination paths:

| Source path | Requirement |
|---|---|
| `scripts/target.js` | Client initialization, page-load offers, and optional legacy hero-mbox application. Imports `getMetadata` from `./aem.js`. |
| `deps/at/at.js` | Loader; imports `getMetadata` from `../../scripts/aem.js`. Loads the metadata-selected vendor script and optional VisitorAPI. |
| `deps/at/vendor-at.js` | Real at.js; the verified source header is 2.11.8. Confirm the approved tenant implementation before reusing it; obtain the intended tenant's download if different. |
| `blocks/target-offer/target-offer.js` | Required when using a Target Offer slot. Imports `getMetadata` from `../../scripts/aem.js`. |
| `blocks/target-offer/target-offer.css` | Styles for that block. |
| `blocks/target-offer/metadata.json` | Companion block metadata. |

Verify the destination's **existing** `scripts/aem.js` exports compatible `getMetadata`, and that normal EDS
block discovery/decoration loads `target-offer`. Do not replace the entire core helper or `scripts/scripts.js`
with source copies. Plain page-load/hero personalization targeting an existing element need not import the block.
Copy the manifest's **licenses** group into `deps/at/licenses/` with any redistributed code; retain upstream
headers and add a changed-file notice if modifying source. Merge `assets/merge/eslintignore.txt` into the
destination's `.eslintignore` exactly once, with a separating newline: the upstream minified vendor SDK is not
maintained source. Do not disable lint for your integration modules.

## Step 2 — Merge initialization into scripts/scripts.js

Add the missing imports, preserving any existing ones:

```js
import { loadTarget, applyTargetHeroMboxIfConfigured } from './target.js';
```

The verified source calls these after lazy block rendering and before delayed work:

```js
  await loadEager(document);
  await loadLazy(document);
  await loadTarget();
  await applyTargetHeroMboxIfConfigured();
  loadDelayed();
```

Merge into the existing `loadPage()`; do not duplicate calls or replace its other behavior.
Use `assets/merge/scripts-import.js` and `assets/merge/scripts-after-lazy.js` as snippets, not full-file
replacements. Keep existing analytics, consent, and other lifecycle calls in their intended order.

**Named block timing matters:** `target-offer.js` can request its first-row mbox during decoration, but only if
real `window.adobe.target.getOffers` already exists. With the source's after-lazy initialization, that request
can be skipped and is not retried. The simple slot + post-render hero helper in Steps 3–4 avoids this ordering
problem. If choosing first-row named-mbox blocks instead, explicitly arrange real at.js readiness and Target
settings before those blocks decorate (including eager/LCP blocks), retain post-render offer application, and
verify a named-mbox request. Merely copying files does not establish that flow.

## Step 3 — Merge head.html metadata and choose the page slot

Enable real Target, preserving other head entries:

```html
<meta name="target" content="1"/>
<meta name="target-at-js" content="/deps/at/vendor-at.js"/>
```

Use `assets/merge/head.html`; the optional helper metadata is in `assets/merge/hero-metadata.html`.
Substitute `DESTINATION_MBOX` and the inspected selector before applying the helper snippet.

In the verified source, `target=1` is commented out: inheriting the code does not mean Target is enabled.
Without `target-at-js`, the loader installs an empty-offer stub; that is **not** successful personalization.
If the approved implementation requires VisitorAPI, set `target-visitor-js` to its approved URL.
Set `target-server-domain` only when the chosen tenant implementation requires it.

For the post-render hero helper, select a real element and one destination mbox:

```html
<meta name="target-mbox-hero" content="<destination-mbox>"/>
<meta name="target-mbox-hero-selector" content=".target-offer__slot"/>
```

Replace `<destination-mbox>`; if targeting an existing hero instead, use its actual selector, such as
`.hero.block .hero-inner`, and omit the Target Offer block dependencies. Use matching page-level DA Metadata
when scoping to one page, and reconcile it with global head metadata; don't unintentionally personalize every page.

Review CSP for the approved script origins, Target delivery connections, and required offer assets; do not copy
the source's permissive CSP or add blanket wildcards. Check consent/privacy requirements for the destination.
`scripts/target.js` intentionally skips `*.ue.da.live` and `*.stage-ue.da.live`; verify delivery on a normal EDS
preview, not in a UE iframe.

## Step 4 — Register the DA library AND author its example

Do this for DA block authoring; code files and a Sidekick link alone do not populate the DA Library.
Open the source workspace at https://author.aem.live/#/ynaka-adobe/da-demo-kit and the destination at
`https://author.aem.live/#/<owner>/<site>`. Keep human authoring links on **author.aem.live**; keep service
URLs such as `content.da.live`, `admin.da.live`, and the hosted SDK unchanged absent evidence.

| DA dependency | Action after destination write approval |
|---|---|
| DA **library config registration** | Inspect the authorized source/destination config store or configuration UI. Locate the library entry that registers the Blocks index and merge the equivalent destination entry without replacing other entries. Its exact entry name, URL field, scope, and schema remain unverified (config GET returned 401); discover them rather than inventing a `.da/library.json` file. |
| `/docs/library/blocks.json` | Verified DA library index, separate from the config store. Preserve existing rows and merge one **Target Offer** row pointing at the destination example. |
| `/docs/library/blocks/target-offer.html` | Verified authored DA block/example content, separate from GitHub block code. Create/adapt the destination example and its Metadata block; verify insertion into a test page. |

The verified source index uses stale **`ynaka-adobe/southwest`** content URLs, including the Target Offer row.
For the destination row, use:

```json
{
  "name": "Target Offer",
  "path": "https://content.da.live/<owner>/<site>/docs/library/blocks/target-offer"
}
```

This is a row within the existing sheet's `data` array, **not** a replacement sheet. Preserve sheet metadata.
If the destination already uses another example path, align the row and authored source to that path.
Do not carry over the unrelated **Target (Persona based)** row or its implementation unless separately requested.
The same neutral row is packaged as `assets/da/library-index-row.json`; replace `<owner>` and `<site>` before
the separately authorized DA merge.

The source example contains an empty `target-offer` block and a Metadata block with `target=1`,
`target-mbox-hero=ynaka-dummy-home-mbox`, and `target-mbox-hero-selector=.target-offer`.
Replace the demo-specific mbox with `<destination-mbox>` and use `.target-offer__slot` to retain the block wrapper.
Add neutral fallback content in the offer block's content row; for this helper flow, do **not** add a first-row
mbox configuration. Confirm the generated DOM contains the selected slot. Remove/adapt demo-specific links,
assets, and tenant references without importing source secrets.
`assets/da/target-offer.html` packages this neutral adaptation with `DESTINATION_MBOX` and fallback content.
Substitute the destination mbox, then create the missing DA example or review existing differences; do not
overwrite an authored destination example by default. This template is not a DA config registration payload.

Confirm both layers: the Library's Blocks entry opens the destination index, and **Target Offer** inserts the
destination example with the correct metadata. An accessible example URL alone does not prove config registration.
If config access returns 401/403, stop that phase and obtain authorized config access; do not substitute an EDS
admin key or broaden permissions. Saving DA content/config is separate from EDS preview/publish in Step 7.

## Step 5 — Add optional activity-management tools and Sidekick entry

For the DA activity UI, copy only:

```text
tools/target/target.html
tools/target/target-v2.js
tools/target/target.css
```

These files are in `assets/eds/`. For the optional hosted UI, surgically merge the approved SDK URL from
`assets/merge/eslint-hosted-sdk.json` into the destination lint config's `settings['import/core-modules']`,
deduplicating and preserving other settings/rules. Adapt to the actual lint format; do not disable import
resolution globally. Include `tools/target/target.css` in a targeted stylesheet lint check even if the
destination's default CSS lint glob covers only blocks/styles. Merge the file-scoped BEM selector convention
from `assets/merge/stylelint-hosted-tool.json` into the destination's Stylelint overrides, preserving its existing
rules and overrides. The bundled tool CSS has documented, equivalent lint-compatible adaptations; its manifest
records both upstream and bundled hashes. The optional tool JS retains upstream console/alert lint warnings;
report them rather than disabling rules or claiming a warning-free lint result.

`target.html` and `target-v2.js` use the hosted SDK at `https://da.live/nx/utils/sdk.js`; `target-v2.js` uses:

```text
https://332794-868ceruleanwhale.adobeioruntime.net/api/v1/web/default/target-activities
```

The inspected client does **not** read `.da/adobe-target.json` directly. Keeping this approved hosted path does
not require a new App Builder deployment or copying backend credentials. Runtime availability, authorization,
and intended tenant access still need verification; no live Runtime calls were made while authoring this guide.
`target.html` has an import map for `da-lit` at `/deps/lit/dist/index.js`, but the inspected `target-v2.js` does not
import it. Do not add unrelated dependencies merely because that unused mapping exists; recheck if the UI changes.

Discover the actual DA Target tool registration in authorized config, preserving other tools and entries.
The exact config sheet/entry for this registration is **unverified**; do not infer it from the Sidekick plugin.
Use the destination tool URL `https://<branch>--<site>--<owner>.aem.live/tools/target/target.html` with actual
destination values. Validate listing in the DA context; insertion needs the SDK's `actions.sendHTML`.
Creating/updating activities or inserting into a page requires separate approval.

For the Sidekick shortcut, merge/update only the entry with `id: "target"` in
`tools/sidekick/config.json` → `plugins[]`:
```json
{
  "id": "target",
  "title": "Target",
  "url": "https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary",
  "passConfig": true,
  "environments": ["preview", "live", "edit"],
  "includePaths": ["**"]
}
```
That URL is the shared tenant's **Target Console**, not the DA tool. Substitute the approved tenant link when
needed; preserve other Sidekick plugins. Use `assets/merge/sidekick-target.json`. If the destination has no
Sidekick config, create a minimal `{"plugins": [...]}` object for this selected shortcut, not the source's
entire config. If it exists, preserve project settings and unrelated plugins.

**Optional UE authoring:** import `ue/models/blocks/target-offer.json` only if wanted and merge it into the
destination's actual model/definition/filter registration mechanism. The source's `ue/models/component-models.json`
includes `./blocks/*.json#/models`; do not assume another repo uses that registry. Validate the fields and fallback
content in UE, but validate personalization on an EDS preview outside UE.

## Step 6 — Handle hidden configuration and independent backends securely

DA metadata confirms **`.da/adobe-target.json` exists**, under
https://author.aem.live/#/ynaka-adobe/da-demo-kit/.da. This is a **folder** link, not a credential file payload.
The sheet's **schema, values, and runtime consumer were not read or verified**. There is no confirmed
`target_token` file; do not invent one or infer a schema from a filename or another guide.

Treat `.da/adobe-target.json` as a secure integration-config/credential prerequisite **when the selected
integration actually consumes it** (for example an export/send-to-Target path or independent backend).
First have an authorized maintainer identify the selected consumer, required non-secret field names, and storage
contract without exposing values. Provision destination-specific credentials/config through an approved secure
channel; never read, print, paste, commit, or blindly copy source credential values. Do not copy other `.da`
credential sheets, source tokens, or source permissions.

Keep credential sources inaccessible to public content delivery, preview/publish, library examples, and exports.
Confirm restricted DA permissions with the destination admin; do not assume a hidden folder alone is protection.
For runtime-stored credentials, use the approved secret store/runtime inputs, not Git or browser JavaScript.
If the schema or authorized provisioning method is unavailable, mark this path blocked, not completed.

Backend deployment is **separate**: do not recursively copy `tools/target/`, which also contains
`actions/target/index.js`, `action.zip`, and `refresh-token.mjs`. Their current contents and deployment contract
were not audited here. Do not import `workers/website/handlers/target.js` into a standard EDS boilerplate.
An independent runtime needs its own approved tenant credentials, action/API contract, authorization, CORS,
secret handling, and deployment validation; change the UI Runtime URL only after that deployment is verified.
Neither a local UI copy nor a credential sheet deploys an action.

## Step 7 — Preview, create/verify the experience, and publish only with approval

For an actual integration, first verify local code. With approval, push code through the destination's AEM Code
Sync workflow and check the selected branch's preview. Separately save DA content/config and preview the authored
page/index/examples/assets as needed. DA config changes are not Git commits, and EDS content preview/publish does
not provision DA permissions or deploy a Runtime backend.

Use an existing approved Target activity, or obtain approval to create an XT activity via the intended tenant's
Console or optional hosted tool. Match the page/slot's mbox, offer, audience, URL scope, and activity status;
don't accept the tool's `target-global-mbox` default for a different named slot. Activating/changing an activity
is a separate outward-facing action.

Verify all applicable outcomes, not just a downloaded script:

- Real vendor at.js loads and `window.adobe.target.getOffers` exists; no empty stub, CSP error, or skipped UE host.
- A delivery request for the intended page-load/mbox occurs **after the chosen slot exists**, with the intended
  tenant and activity response, and targeted HTML renders in the matching selector.
- The DA Library resolves destination URLs and inserts the adapted Target Offer example with the intended mbox.
- Optional Sidekick link and DA tool registration open the correct destinations; hosted failures are surfaced.
- The control/non-matching audience retains neutral fallback content. First-row named-mbox flows are explicitly
  checked for initialization timing, rather than assumed to work.
- Required secure config is provisioned only for its verified consumer; no secrets or source permissions appear
  in Git, public content, examples, logs, or the manifest.

Obtain approval separately before EDS publication; then verify the published destination if requested.
Report completed, optional/skipped, and blocked dependencies independently.

## Troubleshooting

- **No real at.js** → check enabled metadata, vendor URL, helper/module paths, CSP, Code Sync, and UE host skipping.
  Missing `target-at-js` can silently install the loader's empty stub.
- **at.js loads but no swap** → check tenant, activity status/audience, delivery response, mbox, selector, consent,
  and block initialization timing.
- **Target Offer absent or opens southwest content** → verify DA library config registration, destination index
  row, authored example, and content preview separately; copying block code is insufficient.
- **401/403 on DA config** → get authorized access to the config scope; do not retry with unrelated EDS keys or
  copy source permissions.
- **Hosted tool empty/error** → distinguish runtime/network/authorization failures from a genuinely empty tenant.
  Do not claim that copying `.da/adobe-target.json` repairs a tool that does not read it.
- **Sidekick has no Target button** → merge the `target` plugin entry; this is separate from DA tool registration.

## Integration Manifest — Adobe Target

Portable contract for `merge-back-to-base-template`. Git files use the same source/destination paths.
**DA operations are separate, approval-gated work**, not Git artifacts; placeholders require destination discovery.
Keep minimum client, block-authoring, and optional backend scopes distinct when consuming this manifest.
The executable skill's authoritative resource mapping is **`assets/manifest.json`**; this YAML is its portable
scope summary. Resolve each copied Git path under `assets/eds/`, and the licenses under `assets/licenses/`.

```yaml
integration: adobe-target
source:
  repo: ynaka-adobe/da-demo-kit
  verified_revision: 28d116639fd30e75c4cfccfa7cad695e284aecae

files:                                  # minimum page personalization
  - scripts/target.js
  - deps/at/at.js
  - deps/at/vendor-at.js                  # approved tenant embed; verified source version 2.11.8
  - "assets/licenses/* -> deps/at/licenses/" # retain Apache-2.0, Zepto MIT, and upstream notices

merge:                                  # preserve destination behavior and entries
  - scripts/scripts.js                  # imports + post-lazy/pre-delayed initialization (Step 2)
  - head.html                           # target + real at.js metadata; optional mbox/selector (Step 3)
  - .eslintignore                       # exact minified vendor path once; preserve other exclusions
  - tools/sidekick/config.json           # only plugins[id=target], if shortcut selected (Step 5)
  - "DA library config registration"     # if DA authoring selected; discover authorized schema (Step 4)
  - "DA /docs/library/blocks.json"       # if DA authoring selected; merge destination Target Offer row

optional:
  - blocks/target-offer/target-offer.js   # required for Target Offer slot / DA block-authoring path
  - blocks/target-offer/target-offer.css
  - blocks/target-offer/metadata.json
  - tools/target/target.html             # hosted activity-management UI only
  - tools/target/target-v2.js
  - tools/target/target.css
  - ue/models/blocks/target-offer.json    # UE only; merge actual model/definition/filter registration

notes:
  - "scripts/aem.js: verify existing getMetadata export; do not overwrite core helpers"
  - "DA /docs/library/blocks/target-offer.html: adapt authored example, not Git block code (Step 4)"
  - "assets/da templates require destination substitution and separately approved DA writes"
  - "Optional hosted UI: merge SDK lint core-module setting and lint tools/target/target.css explicitly"
  - "Optional hosted UI: merge file-scoped Stylelint BEM selector override; keep other lint rules"
  - "Substitute destination owner/site/branch URLs, approved tenant, mbox, selector, and neutral content"
  - "DA config and tool registration schema: unverified; authorized discovery required"
  - "Named block mbox requests need real at.js before decoration; source lazy ordering is insufficient"
  - "Hosted SDK: https://da.live/nx/utils/sdk.js"
  - "Hosted Runtime: https://332794-868ceruleanwhale.adobeioruntime.net/api/v1/web/default/target-activities"
  - "DA .da/adobe-target.json: existence verified, schema/consumer unverified; secure provisioning only if used"
  - "CSP, consent, tenant access, DA least-privilege permissions, Code Sync, and preview/publish are separate checks"
  - "Git templates do not copy DA content/config/permissions or deploy backend actions"

exclude:
  - workers/website/handlers/target.js   # not standard EDS client integration
  - tools/target/actions/               # backend source/bundle; separate deployment review
  - tools/target/refresh-token.mjs       # not a UI dependency
  - ".da credential values and source permissions; never copy/commit/export"
  - "Unrelated library rows, demo assets, and southwest URLs"
```

## Reference links

| Resource | Link |
|---|---|
| Create your EDS repo (base) | the `create-eds-repo` skill |
| Merge this into your base template | the `merge-back-to-base-template` skill |
| Target access provisioning (Step 0) | https://acrs.adobe.com/go/6bff542e-f709-499f-8156-57e0fc914510 |
| Source: da-demo-kit | https://github.com/ynaka-adobe/da-demo-kit |
| Bundled resources and source-to-destination manifest | https://github.com/ynaka-adobe/xsc-ai-playbooks/tree/main/plugins/aem-edge-delivery/skills/add-adobe-target/assets |
| DA source workspace | https://author.aem.live/#/ynaka-adobe/da-demo-kit |
| DA hidden config folder (metadata only) | https://author.aem.live/#/ynaka-adobe/da-demo-kit/.da |
| Target activity library (demo tenant) | https://experience.adobe.com/#/@acsmarketing/target/activities/activityLibrary |
