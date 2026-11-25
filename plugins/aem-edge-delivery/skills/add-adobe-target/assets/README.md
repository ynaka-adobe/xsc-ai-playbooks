# Portable Adobe Target resources

This directory travels with the `add-adobe-target` skill inside the `aem-edge-delivery` plugin.
Resolve it relative to the loaded `SKILL.md`, **not** relative to the destination site's working directory.
The marketplace registers the whole `plugins/aem-edge-delivery` directory; no separate installer or plugin
dependency is needed. A standalone generated catalog page is documentation, not an installed skill bundle.

`manifest.json` is the source-to-destination contract. `eds/` contains only the allowlisted Git assets from
`ynaka-adobe/da-demo-kit` revision `28d116639fd30e75c4cfccfa7cad695e284aecae`; file hashes detect accidental
changes. The optional tool stylesheet has documented lint-compatible adaptations; its upstream and bundled
hashes are both recorded. `merge/` holds snippets for surgical edits, **not** replacement destination files. `da/` contains
neutral destination templates, **not** a DA config export or credential sheet.

## Apply with the skill

Invoke `/aem-edge-delivery:add-adobe-target` in Claude Code in an existing EDS repo with the plugin loaded
(or use the host's exposed `add-adobe-target` skill). An unpublished checkout can be loaded with
`claude --plugin-dir /absolute/path/to/xsc-ai-playbooks/plugins/aem-edge-delivery` from the destination repo.
This does not install/update a marketplace copy or push the playbooks repo. Tell the agent the destination
owner/site, branch, approved tenant, mbox, selector, and selected optional paths. The agent reads this manifest
and follows Steps 0-7 in `../SKILL.md`. No network fetch of da-demo-kit is needed to obtain the packaged files.

For every selected copy entry: create a missing file; skip a byte-identical existing file; if different, preserve
it and ask whether to keep it or review a surgical update. Never overwrite a customized file by default.
Apply each merge snippet to the existing destination syntax; deduplicate by import/export name, metadata name,
plugin ID, ignore-line value, or DA row identity. If the structure is incompatible or ambiguous, stop that phase
with the exact conflict. Do not use global string replacement or copy an entire config from the source repo.

On a repeat invocation, audit and skip already satisfied entries. A changed mbox/tenant/URL is a requested
configuration update, not permission to replace unrelated settings. Preview and external writes remain gated.

## Scope and licensing

- `client` is the minimum Git integration. `block`, `hosted-tool`, and `ue` copy groups are opt-in.
- The optional hosted UI needs its narrow ESLint SDK resolution setting and Stylelint BEM selector convention
  merged into existing configuration. Preserve other rules and overrides; do not disable lint globally.
- `licenses` accompanies any redistributed code. Retain upstream headers, including Adobe at.js and Zepto
  notices. The source repository supplies Apache-2.0; the embedded Zepto component also carries MIT terms.
  Copies of both licenses are included. Do not rewrite/minify the vendor file or imply its notices disappeared.
- `da/library-index-row.json` and `da/target-offer.html` are newly authored, neutral adaptations of the verified
  DA example structure. Substitute every `<owner>`, `<site>`, and `DESTINATION_MBOX` before use. Merge the row
  into the existing index; do not replace the sheet.
- DA config registration, authorized DA writes, destination credentials, tenant access, and backend deployment
  are **not installed** by copying this directory. Their discovery/provisioning gates remain in the skill.
- No `.da` credential content, tokens, permission exports, backend archives, or refresh-token scripts are included.

The supported clean fixture is `adobe/aem-boilerplate` revision
`9a904130e124feebeee199f35eddb8fc8931488e`, using its `scripts/aem.js`, `loadPage()` lifecycle, and existing lint
configuration. Other EDS variants require inspecting equivalent lifecycle and authoring registration first.
