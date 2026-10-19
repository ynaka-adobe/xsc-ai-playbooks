---
name: edge-commerce-write
description: Write or update a product record in Edge Commerce (Adobe Commerce Optimizer's Data Ingestion API) for an EDS demo site, including minting a durable service token and the routing fix needed for nested/SKU-level product paths. Use when someone says "add a product to Edge Commerce", "write a new SKU", "create a product record", or an AI agent is attempting an Edge Commerce POST/PUT and needs the correct auth and body shape.
---

# Write a Product to Edge Commerce (Data Ingestion API)

Create or update a catalog record in **Edge Commerce** — Adobe Commerce Optimizer's tenant-scoped **Data Ingestion
API** — for an EDS demo site, and make sure the new path actually renders (a routing gotcha silently 404s nested
SKU pages even when the catalog write succeeded).

**Edge Commerce is NOT classic Adobe Commerce.** Don't reach for `/rest/V1/products` or an admin-token login flow
from classic Commerce — that's the wrong product. Full reference: https://main--edge-commerce-docs--aemsites.aem.page/

## Before you start: check the token, and use a service token

All writes need `Authorization: Bearer <token>`. There are two token types — **use the right one**:

| Type | Lifetime | Get it from |
|---|---|---|
| Session token | 24 hours | OTP login (`/auth/login` + `/auth/callback`) — for humans, or to bootstrap a service token |
| **Service token** (recommended) | up to 1 year | `POST /auth/service_token`, called **using a session token** |

If `EDGE_COMMERCE_TOKEN` in `.env` is a 24h session token, it expires constantly — mint a **service token** once
and use that instead. Decode whatever token you have first to check its expiry, without ever printing the raw
secret:

```bash
python3 - <<'EOF'
import base64, json, datetime
tok = "$EDGE_COMMERCE_TOKEN"  # sourced from .env, never pasted/typed literally
payload = json.loads(base64.urlsafe_b64decode(tok.split('.')[1] + '=='))
print('expires', datetime.datetime.utcfromtimestamp(payload['exp']).isoformat() + 'Z')
EOF
```

### Mint a durable service token (do this once per integration)

1. Get a session token via OTP (needs an email already registered as a site admin):
   ```bash
   curl -X POST "https://${HOST}/${ORG}/sites/${SITE}/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com"}'
   # -> {"email", "hash", "exp"} — retrieve the emailed OTP code, then:
   curl -X POST "https://${HOST}/${ORG}/sites/${SITE}/auth/callback" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "code": "{otp-code}", "hash": "{hash}", "exp": {exp}}'
   # -> {"token": "{admin-session-token}", "roles": ["admin"], ...}
   ```
2. Use that session token to create a scoped, long-lived service token:
   ```bash
   curl -X POST "https://${HOST}/${ORG}/sites/${SITE}/auth/service_token" \
     -H "Authorization: Bearer {admin-session-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Catalog ingestion",
       "permissions": ["catalog:read", "catalog:write", "index:write"],
       "ttl": 31536000,
       "contactEmails": ["ops@example.com"]
     }'
   # -> {"token": "eyJhbGci...", "ttl": 31536000} — returned ONCE, store it (e.g. as EDGE_COMMERCE_TOKEN) now
   ```
   `${HOST}` is `api.adobecommerce.live` (production) or `api-stage.adobecommerce.live` (staging) — staging and
   production are provisioned separately, so sign in and mint tokens in whichever environment you're targeting.
3. Store the returned token in `.env` as `EDGE_COMMERCE_TOKEN` (or similar) — it's only shown once. Use it for all
   subsequent catalog writes below until it expires (up to a year later) or is revoked.

If OTP login fails with "not a site administrator" or a 403 on step 1, the Adobe-side org/site/initial-admin
provisioning hasn't been done yet for that environment — that's a one-time setup step done by Adobe, not something
this skill can self-serve; ask your Adobe contact.

## 1. Write the catalog record

```bash
curl -sf -X PUT "https://${HOST}/${ORG}/sites/${SITE}/catalog${PATH}.json" \
  -H "Authorization: Bearer $EDGE_COMMERCE_TOKEN" \
  -H "Content-Type: application/json" \
  -d @product.json
```

- `${ORG}` / `${SITE}` — e.g. `ynaka-adobe` / `parker`.
- `${PATH}` — the EDS route **with** a leading slash, e.g. `/us/en/products/ultra-dry-gas-generator`. For a SKU
  nested under a series, append the SKU segment: `/us/en/products/ultra-dry-gas-generator/uda-300`.

**`PUT` is a full replacement, not a merge.** Omitted fields are deleted from the stored record. To change one
field on an existing product: `GET` the current record first, edit the one field, then `PUT` the whole object
back. If the body includes a `path` field it must exactly match the URL path (no `.json`) or the write 400s.

### Body shape

Top-level fields are validated; everything else goes in a **free-form `custom` object** that the
`product-enrichment` block reads directly — field names must match exactly:

```json
{
  "sku": "UDA-300",
  "name": "UDA-300 Ultra Dry Gas Generator",
  "path": "/us/en/products/ultra-dry-gas-generator/uda-300",
  "url": "/us/en/products/ultra-dry-gas-generator/uda-300",
  "description": "Short teaser/summary shown in listings.",
  "brand": "Parker Hannifin",
  "images": [{ "url": "https://.../product.png" }],
  "custom": {
    "fullDescription": "Long-form body copy for the detail page.",
    "partNumber": "UDA-300",
    "seriesName": "Ultra Dry Gas Generator Series",
    "seriesPath": "us/en/products/ultra-dry-gas-generator",
    "numberOfSKUs": 4,
    "technicalSpecifications": [{ "label": "Flow Rate", "value": "300 scfh" }],
    "relatedDocuments": { "Datasheet": "https://.../datasheet.pdf" },
    "parts": [{ "name": "UDA-300", "path": "us/en/products/ultra-dry-gas-generator/uda-300" }],
    "relatedSeries": [{ "name": "...", "path": "...", "description": "..." }],
    "divisionContact": { "name": "...", "email": "...", "phone": "..." },
    "whereToBuyUrl": "https://..."
  }
}
```

Use `relatedSeries`/`parts`/`numberOfSKUs` only on a **series-level** record; a **SKU-level** record nested under
a series typically needs `seriesName` + `seriesPath` + `partNumber` instead. Check
`blocks/product-enrichment/product-enrichment.js` in the target repo if a new field doesn't render — it reads
`custom.*` by exact key name with no fallback.

## 2. Fix routing for nested paths (required for any path with a `/` beyond `/products/{slug}`)

`public.json`'s `mixerConfig.patterns` needs **both** a single-level and multi-level glob mapped to the
`adobe_productbus` backend, or nested/SKU paths 404 on render even though the catalog record exists (verify the
record exists first with a plain `GET` on the same catalog URL — a 404 there is a real write failure; a 404 only
on the rendered page is this routing gap):

```bash
# 1. GET first — overwriting this file wholesale will wipe unrelated config
curl -s -H "X-Auth-Token: $ORG_ADMIN_API_KEY" \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}/public.json" > public.json

# 2. Ensure mixerConfig.patterns has BOTH, pointing at adobe_productbus:
#    "/us/en/products/*"   (single segment, e.g. /us/en/products/ultra-dry-gas-generator)
#    "/us/en/products/**"  (multi segment,  e.g. /us/en/products/ultra-dry-gas-generator/uda-300)

# 3. POST the merged file back (this is the Helix Admin API — X-Auth-Token, NOT Authorization: Bearer)
curl -sf -X POST "https://admin.hlx.page/config/${ORG}/sites/${SITE}/public.json" \
  -H "X-Auth-Token: $ORG_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  --data @public.json
```

These are **two separate auth layers** — don't cross them: the catalog API uses `Authorization: Bearer
$EDGE_COMMERCE_TOKEN`; the Helix Admin API uses `X-Auth-Token: $ORG_ADMIN_API_KEY` (an `Authorization: Bearer`
header 401s there).

## 3. Verify

Rendering only resolves via the **`.aem.network`** domain for Edge Commerce-backed paths — `.aem.page` /
`.aem.live` won't reflect catalog data:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://${BRANCH}--${SITE}--${ORG}.aem.network${PATH}"
```

A `200` with the expected `custom.*` content rendered means both the catalog write and the routing config are
correct. A `404` here with a successful catalog `GET` means step 2's glob patterns are still missing or didn't
save.

## Reference

Full docs: https://main--edge-commerce-docs--aemsites.aem.page/ — see `/authentication/overview`,
`/authentication/setup`, `/authentication/service-tokens`, and `/api-reference` for authoritative detail beyond
this summary.
