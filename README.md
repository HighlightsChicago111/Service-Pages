# Highlights Chicago service pages

Next.js 16 and Sanity implementation for data-driven service × area landing pages, served at `https://www.highlightschicago.com/services` (the app uses the `/services` basePath; the site root is Webflow).

## Architecture

- `serviceDefinition`: reusable service content and SEO research.
- `serviceArea`: Chicago/local content, coverage, map and neighborhood data.
- `servicePage`: one service × area page with SEO, media, reviews and guides.
- `servicePageTemplate`: singleton defining the standard page section order.
- `siteSettings`: singleton for company, contact, brand, ratings, trust and form defaults.
- Embedded Sanity Studio: `/services/studio`.

Sanity is the source of truth for published content. `data/source-content.json` is the normalized spreadsheet export that seeded the first import; it does not include the pages added later in the Studio (Sanity has 40 service pages, the file has 30). The original spreadsheet package is preserved locally but ignored by Git.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values you need.
2. Create a Sanity Viewer token (and, only for imports, an Editor token) in project `5w5623jq`.
3. Install dependencies with `pnpm install`.
4. Run the application with `pnpm dev` and open `http://localhost:3000/services`.
5. Open the embedded Studio at `http://localhost:3000/services/studio`. `http://localhost:3000` must be an allowed CORS origin in Sanity.

To seed an empty dataset, run `pnpm source:validate` and then `pnpm content:import`. The import only creates documents that are missing and never overwrites content edited in Sanity; see `docs/SETUP.md`.

## Testing before merging

Every push to `main` deploys straight to production, so run these before merging:

```powershell
pnpm typecheck
pnpm lint
pnpm test:collection-data
pnpm test:indexing-contract
pnpm test:lead
pnpm test:preview
pnpm build
```

Then start the build (`pnpm start`) or use the PR's preview deployment and run the end-to-end checks against it, for example `pnpm test:smoke http://localhost:3000`, `pnpm test:indexing http://localhost:3000` and `pnpm test:thank-you http://localhost:3000`. The smoke and preview tests read the expected content from the live Sanity dataset.

## Secrets

- Never commit `.env.local`.
- `SANITY_API_READ_TOKEN` should have Viewer permissions.
- `SANITY_API_WRITE_TOKEN` and `SANITY_AUTH_TOKEN` are local migration/CLI credentials and should normally not be added to Vercel.
- `SANITY_REVALIDATE_SECRET` must match the Sanity webhook secret.
- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, and `LEAD_NOTIFICATION_EMAIL` deliver form submissions directly through Resend without another Sanity webhook.

See `docs/SETUP.md` and `docs/SOURCE_ANALYSIS.md` for deployment and source-audit details.
