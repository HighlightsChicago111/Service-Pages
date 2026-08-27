# Sanity, Vercel, and repository setup

## Current state

- Sanity project: `5w5623jq`
- Sanity organization: `onvqoim97`
- Dataset: `production`
- The dataset exists, allows public reads, and was empty when checked on 2026-08-27.
- The embedded Studio is mounted at `/studio`.
- The requested GitHub repository URL is `https://github.com/HighlightsChicago111/Service-Pags.git`.

## 1. Fill `.env.local`

The repository contains an ignored `.env.local` with placeholders and a committed `.env.example`. Paste token values directly into `.env.local`; never paste secrets into chat or commit that file.

```dotenv
NEXT_SANITY_PROJECT_ID=5w5623jq
NEXT_SANITY_DATASET=production
NEXT_SANITY_API_VERSION=2026-03-01
NEXT_SANITY_STUDIO_URL=/studio
NEXT_SITE_URL=http://localhost:3000
SANITY_ORGANIZATION_ID=onvqoim97
SANITY_API_READ_TOKEN=PASTE_SANITY_VIEWER_TOKEN_HERE
SANITY_API_WRITE_TOKEN=PASTE_SANITY_EDITOR_TOKEN_HERE
SANITY_AUTH_TOKEN=PASTE_SANITY_EDITOR_TOKEN_HERE
SANITY_REVALIDATE_SECRET=PASTE_RANDOM_REVALIDATION_SECRET_HERE
LEAD_WEBHOOK_URL=
LEAD_WEBHOOK_BEARER_TOKEN=
```

Create two Sanity project tokens in **manage.sanity.io → project 5w5623jq → API → Tokens**:

1. A Viewer token for `SANITY_API_READ_TOKEN`. It supports authenticated previews and Visual Editing without write authority.
2. An Editor token for local-only `SANITY_API_WRITE_TOKEN` and `SANITY_AUTH_TOKEN`. The import script and Sanity CLI can use the same Editor token. Remove or rotate it after migration if it is no longer needed.

Generate the revalidation secret as a random value of at least 32 characters. It must match the secret configured on the Sanity webhook.

## 2. Install, validate, and import

```powershell
pnpm install
pnpm source:extract
pnpm source:validate
pnpm content:import
pnpm dev
```

The import is deterministic and currently creates/replaces 23 documents: one site settings singleton, one standard template, ten service definitions, one service area, and ten service pages.

Do not run `content:import` until the Editor token is present. The script refuses placeholder tokens.

## 3. Sanity CORS

In **manage.sanity.io → API → CORS origins**, add exact origins and enable credentials where Studio/Visual Editing requires them:

- `http://localhost:3000`
- Your final production Vercel/custom domain, for example `https://service-pages.example.com`
- Any stable preview domain you explicitly choose to support

Do not add a wildcard `*.vercel.app` origin with credentials. Add only origins that should be allowed to use the authenticated Studio or preview tooling.

## 4. Sanity webhook

After Vercel is deployed, add a Sanity webhook:

- URL: `https://YOUR_DOMAIN/api/revalidate`
- Dataset: `production`
- Trigger on: create, update, delete
- HTTP method: POST
- Secret: exactly the Vercel `SANITY_REVALIDATE_SECRET`
- Filter:

```groq
_type in ["servicePage", "serviceDefinition", "serviceArea", "siteSettings", "servicePageTemplate"]
```

- Projection:

```groq
{
  "documentType": _type
}
```

The endpoint verifies Sanity's signed webhook body and revalidates the service route tree. This broad invalidation is intentional because a service definition, area, template, or site setting may affect multiple generated pages.

## 5. Vercel environment variables

Configure variables separately for Development, Preview, and Production. Redeploy after changing any value.

| Variable | Dev | Preview | Prod | Secret? | Notes |
| --- | --- | --- | --- | --- | --- |
| `NEXT_SANITY_PROJECT_ID` | Yes | Yes | Yes | No | `5w5623jq` |
| `NEXT_SANITY_DATASET` | Yes | Yes | Yes | No | `production` |
| `NEXT_SANITY_API_VERSION` | Yes | Yes | Yes | No | `2026-03-01` |
| `NEXT_SANITY_STUDIO_URL` | Yes | Yes | Yes | No | `/studio` |
| `NEXT_SITE_URL` | Yes | Yes | Yes | No | Use the matching deployed origin; production should use the final canonical domain |
| `SANITY_API_READ_TOKEN` | Yes | Yes | Yes | Yes | Viewer token; required for drafts/Visual Editing. It remains server-side. |
| `SANITY_REVALIDATE_SECRET` | Optional | Yes | Yes | Yes | Random 32+ characters; match the webhook secret for that environment |
| `LEAD_WEBHOOK_URL` | If testing | If testing | If form is live | Yes | Destination for sanitized lead payloads |
| `LEAD_WEBHOOK_BEARER_TOKEN` | If required | If required | If required | Yes | Only if the destination authenticates with a bearer token |

Do **not** add these to Vercel unless a future server-only feature explicitly needs write access:

- `SANITY_API_WRITE_TOKEN`
- `SANITY_AUTH_TOKEN`
- `SANITY_ORGANIZATION_ID`

The write token is for local import/CLI work. The application does not write website content to Sanity at runtime.

The five `NEXT_*` values above are public application configuration even though their Vercel names do not include `NEXT_PUBLIC_`. `next.config.ts` exposes only this explicit allowlist to the embedded browser Studio. Tokens and secrets are never included in that allowlist.

## 6. Lead destination

The old source's `form_action` is deliberately ignored. Configure `LEAD_WEBHOOK_URL` to an endpoint you control (CRM, automation platform, or server function). `/api/lead` accepts only these fields and truncates each to 1,000 characters:

`name`, `phone`, `address`, `buildingType`, `issue`, `service`, `area`.

The hidden `website` honeypot is discarded. No lead data is stored in Sanity.

## 7. GitHub and Vercel connection

The supplied repository must exist under `HighlightsChicago111` and the GitHub account authenticated in `gh` must have write access. Then:

```powershell
git remote add origin https://github.com/HighlightsChicago111/Service-Pags.git
git push -u origin main
```

In Vercel, import the GitHub repository, select the Next.js preset, keep the default build command, add the environment variables above, and deploy. No custom output directory is required.

## Official references

- [Sanity API tokens](https://www.sanity.io/docs/content-lake/http-auth)
- [Sanity CORS origins](https://www.sanity.io/docs/content-lake/cors)
- [Sanity webhook revalidation with Next.js](https://www.sanity.io/docs/visual-editing/vercel-visual-editing)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
