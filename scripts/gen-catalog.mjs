#!/usr/bin/env node
/**
 * Generate the XSC AI Playbooks catalog (GitHub Pages, served from /docs) from the
 * plugin skills — the single source of truth. Grouped by product toolset.
 *
 * For each product plugin under plugins/ (excluding the `xsc` concierge) it emits, into
 * docs/<product>/:
 *   - <skill>.md    the paste-in markdown (copy into Claude; also used for share links)
 *   - <skill>.html  a rendered page with a "Copy for Claude" button
 * plus docs/index.html (the router landing page) and docs/style.css.
 *
 * Usage:
 *   node scripts/gen-catalog.mjs            # write into ./docs
 *   node scripts/gen-catalog.mjs --out DIR  # write into DIR/ (preview/dry-run)
 *   node scripts/gen-catalog.mjs --check     # exit 1 if any output would change
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PLUGINS_DIR = join(ROOT, 'plugins');

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const OUT = outFlag !== -1 ? resolve(args[outFlag + 1]) : join(ROOT, 'docs');
const CHECK = args.includes('--check');

// The concierge plugin is Layer 1 (routing), not a product with a playbook catalog.
const CONCIERGE = 'xsc';
// Clean display label + one-line blurb per product (falls back to plugin.json).
const PRODUCT_META = {
  'aem-edge-delivery': {
    label: 'AEM Edge Delivery',
    blurb:
      'Build an EDS demo site end to end — readiness, base template, repo creation, aemcoder modernization, Adobe Target, config sync, and merge-back. Vertical-aware (manufacturing, retail, …).',
  },
};
// Preferred skill display order per product (unlisted skills fall to the end, alpha).
const SKILL_ORDER = {
  'aem-edge-delivery': [
    'eds-readiness', 'create-base-template', 'create-eds-repo',
    'modernize-with-aemcoder', 'add-adobe-target', 'sync-da-content',
    'merge-back-to-base-template',
  ],
};

const BANNER = (skill) =>
  `> **▶ Claude — this file _is_ the task.** If it was just pasted into our conversation, don't treat it as
> background reference and don't wait for a separate instruction — **start now**: follow the steps below and guide
> the user through them one at a time, beginning with the first phase. (Human: you can just say "walk me through
> this" — but Claude should begin even if you don't.)
>
> _Auto-generated from the \`${skill}\` plugin skill. Edit the skill, not this file._`;

function stripFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  return { fm, body: src.slice(m[0].length) };
}

function transform(skill, src) {
  const { fm, body } = stripFrontmatter(src);
  let out = body.replace(/\bskill\b/g, 'playbook').replace(/\bskills\b/g, 'playbooks');
  const h1 = out.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : (fm.name || skill);
  const banner = BANNER(skill);
  if (h1) out = out.replace(/^#\s+.+$/m, (line) => `${line}\n\n${banner}`);
  else out = `# ${title}\n\n${banner}\n\n${out}`;
  const md = out.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  return { md, title };
}

const jsString = (s) => JSON.stringify(s).replace(/</g, '\\u003c');

function skillPage(title, product, md) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — XSC AI Playbooks</title>
<link rel="stylesheet" href="../style.css">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
<header class="bar">
  <a class="back" href="../index.html">← All playbooks</a>
  <span class="crumb">${product}</span>
  <button id="copy" class="copy">Copy for Claude</button>
</header>
<p class="hint">Click <b>Copy for Claude</b>, then paste into <b>Claude Code</b> or <b>claude.ai chat</b> — it starts
walking you through automatically.</p>
<main id="content" class="markdown-body"></main>
<script id="src" type="application/json">${jsString(md)}</script>
<script>
  const md = JSON.parse(document.getElementById('src').textContent);
  document.getElementById('content').innerHTML = marked.parse(md);
  const btn = document.getElementById('copy');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(md); btn.textContent = 'Copied ✓'; }
    catch (e) { btn.textContent = 'Press ⌘/Ctrl+C'; }
    setTimeout(() => (btn.textContent = 'Copy for Claude'), 2000);
  });
</script>
</body>
</html>
`;
}

function indexPage(products) {
  const sections = products
    .map(({ dir, label, description, skills }) => {
      const items = skills
        .map(
          ({ page, title }, i) =>
            `    <li><a href="${dir}/${page}.html"><span class="n">${i + 1}</span><span class="t">${title}</span>
        <code>${page}</code></a></li>`
        )
        .join('\n');
      return `  <section class="product">
    <h2>${label}</h2>
    <p class="blurb">${description}</p>
    <ul class="list">
${items}
    </ul>
  </section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>XSC AI Playbooks</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>XSC AI Playbooks</h1>
<p class="hint">AI playbooks for building AEM demos, one toolset per product. Not sure where to start? In Claude, run
the <b>xsc</b> concierge (<code>/find-playbook</code>) — it asks what you're building (product + customer vertical)
and points you to the right playbook. Or browse below: open one, click <b>Copy for Claude</b>, paste into Claude.
<b>No coding required.</b></p>
${sections}
<p class="foot">Auto-generated from the <code>xsc-ai-playbooks</code> plugin skills — do not hand-edit
<code>/docs</code>.</p>
</body>
</html>
`;
}

const CSS = `:root{--fg:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:#1473e6;--bg:#fff;--code:#f5f5f7}
*{box-sizing:border-box}body{margin:0;padding:2rem 1rem 4rem;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg);max-width:820px;margin-inline:auto}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.bar{display:flex;justify-content:space-between;align-items:center;gap:.75rem;position:sticky;top:0;background:var(--bg);padding:.5rem 0;border-bottom:1px solid var(--line);margin-bottom:1rem}
.back{font-weight:600}.crumb{color:var(--muted);font-size:.85rem;margin-right:auto}
.copy{cursor:pointer;border:0;background:var(--accent);color:#fff;font-weight:600;font-size:.95rem;padding:.5rem 1rem;border-radius:8px}
.copy:hover{filter:brightness(1.05)}
.hint{color:var(--muted);font-size:.95rem;background:var(--code);padding:.75rem 1rem;border-radius:8px}
.product{margin:2rem 0}.product h2{font-size:1.3rem;margin:0 0 .25rem}.blurb{color:var(--muted);margin:.25rem 0 1rem}
.list{list-style:none;padding:0;margin:0}.list li{margin:.5rem 0}
.list a{display:flex;align-items:center;gap:.9rem;padding:.9rem 1rem;border:1px solid var(--line);border-radius:10px;color:var(--fg)}
.list a:hover{border-color:var(--accent);text-decoration:none;background:var(--code)}
.list .n{flex:0 0 1.8rem;height:1.8rem;display:grid;place-items:center;background:var(--accent);color:#fff;border-radius:50%;font-size:.85rem;font-weight:700}
.list .t{font-weight:600;flex:1}
.list code,.foot code{background:var(--code);padding:.15rem .4rem;border-radius:5px;font-size:.85em;color:var(--muted)}
.foot{color:var(--muted);font-size:.85rem;margin-top:2rem;border-top:1px solid var(--line);padding-top:1rem}
.markdown-body h1{font-size:1.9rem;margin:.2rem 0 1rem}
.markdown-body h2{font-size:1.35rem;margin-top:2rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.markdown-body h3{font-size:1.1rem;margin-top:1.5rem}
.markdown-body code{background:var(--code);padding:.15rem .4rem;border-radius:5px;font-size:.88em}
.markdown-body pre{background:var(--code);padding:1rem;border-radius:10px;overflow:auto}
.markdown-body pre code{background:none;padding:0}
.markdown-body blockquote{margin:1rem 0;padding:.5rem 1rem;border-left:4px solid var(--accent);background:var(--code);border-radius:0 8px 8px 0;color:#333}
.markdown-body table{border-collapse:collapse;width:100%;margin:1rem 0}
.markdown-body th,.markdown-body td{border:1px solid var(--line);padding:.5rem .7rem;text-align:left;font-size:.92rem}
.markdown-body img{max-width:100%}
`;

function orderSkills(product, names) {
  const order = SKILL_ORDER[product] || [];
  return [...names].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

const results = { changed: [], unchanged: [] };
function writeIfChanged(path, content) {
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : null;
  const rel = path.slice(OUT.length + 1);
  if (prev === content) { results.unchanged.push(rel); return; }
  results.changed.push(rel);
  if (!CHECK) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }
}

// Discover product plugins (have skills/, not the concierge).
const productDirs = readdirSync(PLUGINS_DIR).filter((d) => {
  if (d === CONCIERGE) return false;
  return existsSync(join(PLUGINS_DIR, d, 'skills')) && statSync(join(PLUGINS_DIR, d)).isDirectory();
});

const products = [];
for (const dir of productDirs) {
  const pluginJson = JSON.parse(readFileSync(join(PLUGINS_DIR, dir, '.claude-plugin', 'plugin.json'), 'utf8'));
  const meta = PRODUCT_META[dir] || {};
  const label = meta.label || pluginJson.description?.split(/[.:]/)[0] || dir;
  const blurb = meta.blurb || pluginJson.description || '';
  const skillsDir = join(PLUGINS_DIR, dir, 'skills');
  const names = orderSkills(dir, readdirSync(skillsDir).filter((s) => existsSync(join(skillsDir, s, 'SKILL.md'))));

  const skills = [];
  for (const skill of names) {
    const { md, title } = transform(skill, readFileSync(join(skillsDir, skill, 'SKILL.md'), 'utf8'));
    skills.push({ page: skill, title });
    writeIfChanged(join(OUT, dir, `${skill}.md`), md);
    writeIfChanged(join(OUT, dir, `${skill}.html`), skillPage(title, label, md));
  }
  products.push({ dir, label, description: blurb, skills });
}

writeIfChanged(join(OUT, 'index.html'), indexPage(products));
writeIfChanged(join(OUT, 'style.css'), CSS);

for (const f of results.changed) console.log(`${CHECK ? '✗ stale' : '✓ wrote'}: ${f}`);
if (process.env.VERBOSE) for (const f of results.unchanged) console.log(`= ${f}`);

if (CHECK && results.changed.length) {
  console.error(`\n${results.changed.length} file(s) out of date — run: node scripts/gen-catalog.mjs`);
  process.exit(1);
}
const nSkills = products.reduce((n, p) => n + p.skills.length, 0);
console.log(`\n${CHECK ? 'checked' : 'generated'} ${products.length} product(s), ${nSkills} playbook(s) → ${OUT}`);
