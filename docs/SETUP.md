# Sanity, Vercel, and repository setup

## Current state

- Sanity project: `5w5623jq`
- Sanity organization: `onvqoim97`
- Dataset: `production` (public reads). As of 2026-10-10 it holds 40 published service pages, 40 service definitions, one area (Chicago), the site settings and the standard template.
- The app is served under the `/services` basePath at `https://www.highlightschicago.com/services`; the site root is Webflow.
- The embedded Studio is mounted at `/services/studio`.
- GitHub repository: `https://github.com/HighlightsChicago111/Service-Pages.git`. Vercel's Git integration deploys every push to `main` to production.

## 1. Fill `.env.local`

The repository contains an ignored `.env.local` with placeholders and a committed `.env.example`. Paste token values directly into `.env.local`; never paste secrets into chat or commit that file.

```dotenv
NEXT_SANITY_PROJECT_ID=5w5623jq
NEXT_SANITY_DATASET=production
NEXT_SANITY_API_VERSION=2026-03-01
NEXT_SANITY_STUDIO_URL=/services/studio
NEXT_SITE_URL=http://localhost:3000
SANITY_ORGANIZATION_ID=onvqoim97
SANITY_API_READ_TOKEN=PASTE_SANITY_VIEWER_TOKEN_HERE
SANITY_API_WRITE_TOKEN=PASTE_SANITY_EDITOR_TOKEN_HERE
SANITY_AUTH_TOKEN=PASTE_SANITY_EDITOR_TOKEN_HERE
SANITY_REVALIDATE_SECRET=PASTE_RANDOM_REVALIDATION_SECRET_HERE
RESEND_API_KEY=PASTE_RESEND_SENDING_API_KEY_HERE
LEAD_FROM_EMAIL=Highlights Chicago <leads@updates.highlightschicago.com>
LEAD_NOTIFICATION_EMAIL=YOUR_LEAD_INBOX@example.com
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

The import builds 63 documents from `data/source-content.json`: one site settings singleton, one standard template, 30 service definitions, one service area, and 30 service pages. Sanity is the source of truth once pages are live (it now has 40 pages, several edited in the Studio), so the import is non-destructive by default:

- `pnpm content:import` only creates documents that are missing from the dataset. Existing documents are left untouched.
- `pnpm content:import --dry-run` reports what would be created or replaced and writes nothing. It needs no token.
- `pnpm content:import --overwrite` replaces existing documents with the file's version (the old behaviour). It discards edits made in the Studio, so only use it on a dataset you intend to reset.

A real import needs the Editor token; the script refuses placeholder tokens.

## 3. Sanity CORS

In **manage.sanity.io → API → CORS origins**, add exact origins and enable credentials where Studio/Visual Editing requires them:

- `http://localhost:3000`
- `https://www.highlightschicago.com` (the production domain that serves `/services/studio`)
- Any stable preview domain you explicitly choose to support

Until the production origin is added, the Studio at `https://www.highlightschicago.com/services/studio` shows Sanity's "Connect this Studio to your project" screen. A project admin can also click **Register Studio** on that screen, which adds the origin. As of 2026-10-10 only `http://localhost:3333` was allowed. Public pages are unaffected because they fetch from the server.

Do not add a wildcard `*.vercel.app` origin with credentials. Add only origins that should be allowed to use the authenticated Studio or preview tooling.

## 4. Sanity webhook

After Vercel is deployed, add a Sanity webhook:

- URL: `https://www.highlightschicago.com/services/api/revalidate`
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
| `NEXT_SANITY_PROJECT_ID` | Yes | Recommended | Yes | No | `5w5623jq` |
| `NEXT_SANITY_DATASET` | Yes | Recommended | Yes | No | `production` |
| `NEXT_SANITY_API_VERSION` | Yes | Yes | Yes | No | `2026-03-01` |
| `NEXT_SANITY_STUDIO_URL` | Yes | Yes | Yes | No | `/services/studio` |
| `NEXT_SITE_URL` | Yes | Yes | Yes | No | Use the matching deployed origin; production should use the final canonical domain |
| `SANITY_API_READ_TOKEN` | Yes | Yes | Yes | Yes | Viewer token; required for drafts/Visual Editing. It remains server-side. |
| `SANITY_REVALIDATE_SECRET` | Optional | Yes | Yes | Yes | Random 32+ characters; match the webhook secret for that environment |
| `RESEND_API_KEY` | If testing | If testing | If form is live | Yes | Resend API key restricted to sending email |
| `LEAD_FROM_EMAIL` | If testing | If testing | If form is live | No | Sender on the exact domain or subdomain verified in Resend |
| `LEAD_NOTIFICATION_EMAIL` | If testing | If testing | If form is live | Yes | Recipient inbox; comma-separate up to 50 addresses |
| `LEAD_WEBHOOK_URL` | Optional | Optional | If CRM forwarding is live | Yes | GHL/Zapier catch-hook URL; see §6a |

Do **not** add these to Vercel unless a future server-only feature explicitly needs write access:

- `SANITY_API_WRITE_TOKEN`
- `SANITY_AUTH_TOKEN`
- `SANITY_ORGANIZATION_ID`

The write token is for local import/CLI work. The application does not write website content to Sanity at runtime.

The five `NEXT_*` values above are public application configuration even though their Vercel names do not include `NEXT_PUBLIC_`. `next.config.ts` exposes only this explicit allowlist to the embedded browser Studio. Tokens and secrets are never included in that allowlist.

The application has checked-in defaults for the public Sanity project ID and dataset, so a Preview deployment still builds if those two variables are scoped only to Production. Add them to Preview as well when testing a different Sanity project or dataset. Tokens and secrets never have checked-in defaults.

## 6. Resend lead delivery

The old source's `form_action` is deliberately ignored. `/api/lead` sends a plain-text notification directly through Resend and does not create or consume a Sanity webhook. It accepts only these fields and truncates each to 1,000 characters:

`name`, `phone`, `address`, `buildingType`, `issue`, `service`, `area`.

The hidden `website` honeypot is discarded. No lead data is stored in Sanity. The API request uses a unique Resend idempotency key and has a ten-second timeout.

Before enabling the form:

1. Create a Resend account and add a sending subdomain such as `updates.highlightschicago.com`.
2. Add Resend's SPF and DKIM records to DNS and wait for the domain to show as verified.
3. Create a Resend API key with sending access and add it to Vercel as `RESEND_API_KEY`.
4. Set `LEAD_FROM_EMAIL` to a sender on that exact verified domain, for example `Highlights Chicago <leads@updates.highlightschicago.com>`.
5. Set `LEAD_NOTIFICATION_EMAIL` to the inbox that should receive leads. Multiple recipients may be comma-separated.
6. Redeploy, then submit one clearly labelled test request from the deployed page.

## 6a. GHL/CRM webhook forwarding (optional)

`/api/lead` can also forward every accepted lead to a CRM automation catch hook — currently a Zapier "Catch Hook" that a teammate's GoHighLevel (GHL) Zap listens on — in addition to (never instead of) the Resend email above. It is intentionally best-effort: the webhook call starts at the same time as the email and its result is only ever logged server-side, so a slow or unreachable webhook can never turn a real lead into a failed submission and never delays the email. The response waits for the webhook (up to its 10-second timeout) so the serverless function is not stopped before the forward is sent.

The forwarded JSON body is the same accepted fields (`name`, `phone`, `address`, `buildingType`, `issue`, `service`, `area`; `email` when the form collects it) plus:

- `sourceUrl` — the `Referer` header, i.e. which page the lead came from (a specific service page or the footer form).
- `submittedAt` — server-side ISO 8601 timestamp.

To enable it:

1. Get the catch-hook URL from whoever owns the Zap/GHL workflow (Zapier: **Trigger → Catch Hook → Copy webhook URL**).
2. Set `LEAD_WEBHOOK_URL` to that URL in `.env.local` for local testing, and in Vercel (Preview/Production as needed) to go live. Never commit the real URL — only the placeholder in `.env.example`.
3. In Zapier/GHL, map the incoming JSON fields above to contact fields (name, phone, address, etc.) and to whatever pipeline/tag should receive service-page leads.
4. Redeploy, then submit one clearly labelled test request and confirm it lands in GHL before pointing the team at real leads.

Leave `LEAD_WEBHOOK_URL` unset to keep this disabled; nothing else changes.

## 6b. Thank-you page (conversion tracking)

Every successful submission — the service-page form and the sitewide footer form — sends the visitor to `https://www.highlightschicago.com/services/thank-you` instead of showing a popup. The team can track conversions by page view on that URL, while the webhook above continues to carry the lead's details (including `sourceUrl`, so you can still tell which page it came from).

- The redirect is a full page load, not client-side routing, so URL-based trackers fire reliably.
- The page is `noindex, nofollow` and is not in the sitemap.
- The URL is a public contract (`THANK_YOU_PATH` in `src/lib/service-urls.ts`, guarded by `pnpm test:thank-you`). Changing it silently breaks tracking, so coordinate with whoever owns the conversion goal first.
- Nothing here touches `/api/lead` or the webhook; a failed submission shows the inline error and stays on the page.

## 6c. Studio preview and visual editing

The Studio's **Presentation** tool previews pages with unpublished drafts and click-to-edit overlays:

1. Presentation opens `/services` in an iframe and calls `/services/api/draft-mode/enable`, which validates the request with `SANITY_API_READ_TOKEN` and turns on Next.js draft mode.
2. In draft mode, service pages fetch drafts through `sanityFetch` with click-to-edit markers, and the root layout adds `<SanityLive />` (live draft updates), `<VisualEditing />` (overlays) and a "Disable draft mode" button.
3. Public visitors never enter draft mode: they keep the statically generated pages, which revalidate hourly and on the Sanity webhook, and never open a browser connection to Sanity.

Requirements: `SANITY_API_READ_TOKEN` set in Vercel (it is) and the site origin allowed in Sanity CORS (§3). `pnpm test:preview` guards that the invisible markers never change links, logos, colours, headings or form values.

## 7. GitHub and Vercel connection

The supplied repository must exist under `HighlightsChicago111` and the GitHub account authenticated in `gh` must have write access. Then:

```powershell
git remote add origin https://github.com/HighlightsChicago111/Service-Pages.git
git push -u origin main
```

In Vercel, import the GitHub repository, select the Next.js preset, keep the default build command, add the environment variables above, and deploy. No custom output directory is required.

### GitHub Actions deployment

`.github/workflows/deploy.yml` provides an authenticated production deployment using the pinned Vercel CLI. Add these repository secrets under **GitHub → Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN`: a Vercel access token created by the owner of the destination Vercel project.
- `VERCEL_ORG_ID`: the `orgId` from `.vercel/project.json` after the owner runs `vercel link` against the existing project.
- `VERCEL_PROJECT_ID`: the `projectId` from that same file.

As of 2026-10-10 the repository has no Actions secrets, so this workflow fails at "Validate deployment credentials". Deployments still happen through Vercel's Git integration.

After the secrets are configured, run **Deploy production to Vercel** from the repository's **Actions** tab. The workflow is intentionally manual because Vercel's Git integration already deploys pushes to `main`; this prevents duplicate production deployments. It pulls the Production environment, performs a Vercel production build, deploys the prebuilt output, and verifies the deployed home page.

For a local authenticated deployment to the already linked project:

```powershell
pnpm exec vercel pull --yes --environment=production --token=YOUR_TOKEN
pnpm exec vercel build --prod --token=YOUR_TOKEN
pnpm exec vercel deploy --prebuilt --prod --token=YOUR_TOKEN
```

Do not commit `.vercel/` or a Vercel token. The directory and local environment files are ignored by Git.

## Official references

- [Sanity API tokens](https://www.sanity.io/docs/content-lake/http-auth)
- [Sanity CORS origins](https://www.sanity.io/docs/content-lake/cors)
- [Sanity webhook revalidation with Next.js](https://www.sanity.io/docs/visual-editing/vercel-visual-editing)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
