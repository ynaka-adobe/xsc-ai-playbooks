#!/bin/sh
# One-shot release/sync for the XSC AI Playbooks monorepo.
# Run AFTER you commit an edit (the pre-commit hook already bumped versions + regenerated /docs):
#   push to GitHub -> refresh the marketplace -> update your local installs.
# Then restart Claude Code to load the new skills. GitHub Pages rebuilds /docs on push.
set -e

MARKETPLACE="ynaka-adobe"

echo "→ Regenerating /docs catalog (in case it drifted)…"
node scripts/gen-catalog.mjs
if [ -n "$(git status --porcelain docs)" ]; then
  git add docs && git commit -m "Regenerate /docs catalog" && echo "  ✓ committed catalog changes"
fi

echo "→ Pushing to GitHub…"
git push

echo "→ Refreshing marketplace ($MARKETPLACE)…"
claude plugin marketplace update "$MARKETPLACE"

echo "→ Updating installed XSC plugins…"
for p in xsc aem-edge-delivery; do
  claude plugin update "$p@$MARKETPLACE" 2>/dev/null || true
done

echo ""
echo "✅ Done. Installed versions:"
claude plugin list 2>/dev/null | grep -A1 -E "xsc|aem-" || true
echo ""
echo "⚠️  Restart Claude Code to load new skills. GitHub Pages (/docs) rebuilds automatically on push."
