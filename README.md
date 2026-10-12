# Highlights Chicago service pages

Next.js 16 and Sanity implementation for data-driven service × area landing pages, served at `https://www.highlightschicago.com/services` (the app uses the `/services` basePath; the site root is Webflow).

## Architecture

- `serviceDefinition`: reusable service content and SEO research.
- `serviceArea`: Chicago/local content, coverage, map and neighborhood data.
- `servicePage`: one service × area page with SEO, media, reviews and guides.
- `servicePageTemplate`: singleton defining the standard page section order.
- `siteSettings`: singleton for company, contact, brand, ratings, trust and form defaults.
- Embedded Sanity Studio: `/services/studio`.

## Two designs during the rollout

Service pages are moving to a new design (Design System v3). Until that is finished, both designs live in Studio under **Service pages**:

- **Current design**: the `servicePage` documents above, rendered by `src/components/service-landing-page.tsx`.
- **New design**: `v2ServicePage` pages plus two shared documents, "New design settings" (`v2-siteSettings`) and "New design area: Chicago" (`v2-area-chicago`), rendered by `src/components/v3/`. All new-design type names start with `v2`.

One rule decides what a URL shows: `/services/<slug>` renders its **published** new-design page when there is one (and the new-design settings exist), otherwise its current page. The sitemap, the `/services` list, related-service links and the old `/<slug>/chicago` redirects all follow the same rule with one entry per URL (`src/lib/design-precedence.ts`). Publishing a new-design page switches its URL to the new design; unpublishing it switches the URL straight back. Drafts only show in Studio Presentation.

New-design slugs cannot be a redirect source in `next.config.ts` or a reserved path. `src/lib/reserved-slugs.ts` holds that list, and `pnpm test:design` fails if it drifts from `next.config.ts`.

Sanity is the source of truth for published content. `data/source-content.json` is the normalized spreadsheet export that seeded the first import; it does not include the pages added later in the Studio (Sanity has 40 service pages, the file has 30). The original spreadsheet package is preserved locally but ignored by Git.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values you need.
2. Create a Sanity Viewer token (and, only for imports, an Editor token) in project `5w5623jq`.
3. Install dependencies with `pnpm install`.
4. Run the application with `pnpm dev` and open `http://localhost:3000/services`.
5. Open the embedded Studio at `http://localhost:3000/services/studio`. `http://localhost:3000` must be an allowed CORS origin in Sanity.

To seed an empty dataset, run `pnpm source:validate` and then `pnpm content:import`. The import only creates documents that are missing and never overwrites content edited in Sanity; see `docs/SETUP.md`.

## Testing before merging

Every push to `main` deploys straight to production. The **Test** workflow (`.github/workflows/test.yaml`) runs the checks below on every pull request and push to `main`, builds the site, runs the indexing and thank-you tests against that build, and reports parity with production in the run summary. To run them yourself:

```powershell
pnpm typecheck
pnpm lint
pnpm test:collection-data
pnpm test:indexing-contract
pnpm test:lead
pnpm test:preview
pnpm test:design
pnpm build
```

Then start the build (`pnpm start`) or use the PR's preview deployment and run the end-to-end checks against it, for example `pnpm test:smoke http://localhost:3000`, `pnpm test:indexing http://localhost:3000` and `pnpm test:thank-you http://localhost:3000`. The smoke and preview tests read the expected content from the live Sanity dataset.

`pnpm check:parity <baseUrl>` compares a build or preview deployment with production: the sitemap, every page's status, title, canonical, robots, JSON-LD and markup, the `/chicago` links and the 78 redirects. It only sends GET requests.

## Secrets

- Never commit `.env.local`.
- `SANITY_API_READ_TOKEN` should have Viewer permissions.
- `SANITY_API_WRITE_TOKEN` and `SANITY_AUTH_TOKEN` are local migration/CLI credentials and should normally not be added to Vercel.
- `SANITY_REVALIDATE_SECRET` must match the Sanity webhook secret.
- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, and `LEAD_NOTIFICATION_EMAIL` deliver form submissions directly through Resend without another Sanity webhook.

See `docs/SETUP.md` and `docs/SOURCE_ANALYSIS.md` for deployment and source-audit details.
