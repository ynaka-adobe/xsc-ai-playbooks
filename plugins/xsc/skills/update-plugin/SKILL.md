---
name: update-playbooks
description: Update the XSC demo toolsets (xsc concierge + aem-edge-delivery, plus future product plugins) to their latest published versions — refreshes the marketplace and updates installed plugins, then tells the user to restart. Use when someone says "update the playbooks", "update the toolsets", "get the latest", "am I on the latest", or reports that a new skill/feature isn't showing up.
---

# Update the XSC demo toolsets

Bring the XSC plugins up to the latest published versions and tell the user to restart. Use when the user asks to
update, or reports that a new skill/feature isn't showing.

## Run these

Refresh the marketplace, then update each installed XSC plugin (safe — they only refresh the catalog and the install):
```bash
claude plugin marketplace update ynaka-adobe
claude plugin update xsc@ynaka-adobe
claude plugin update aem-edge-delivery@ynaka-adobe
```
> Update only the plugins the user actually has installed. As more product toolsets ship (`aem-assets`,
> `aem-guides`, …), add a matching `claude plugin update <name>@ynaka-adobe` line.

Then check installed versions:
```bash
claude plugin list | grep -A1 -E "xsc|aem-"
```

## Tell the user

- **If something updated** (version changed): "Updated. **Restart Claude Code** to load the new skills — skills load
  at startup, so the restart is required."
- **If already latest**: "You're already on the latest — nothing to do."

Always end by reminding them a **restart is required**. You cannot restart Claude Code for them.

## Notes

- This updates **plugins only** — it does not touch demo content, DA repos, or GitHub repos.
- If a command errors:
  - The plugin CLI needs an **interactive Claude Code session**.
  - If the marketplace isn't added yet: `claude plugin marketplace add ynaka-adobe/xsc-ai-playbooks`, then retry.
