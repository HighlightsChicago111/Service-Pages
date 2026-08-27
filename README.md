# Highlights Chicago service pages

Next.js 16 and Sanity implementation for data-driven service × area landing pages.

## Architecture

- `serviceDefinition`: reusable service content and SEO research.
- `serviceArea`: Chicago/local content, coverage, map and neighborhood data.
- `servicePage`: one service × area page with SEO, media, reviews and guides.
- `servicePageTemplate`: singleton defining the standard page section order.
- `siteSettings`: singleton for company, contact, brand, ratings, trust and form defaults.
- Embedded Sanity Studio: `/studio`.

The original spreadsheet package is preserved locally but ignored by Git. The normalized import source is `data/source-content.json`.

## Local setup

1. Copy `.env.example` to `.env.local` or fill the provided `.env.local`.
2. Create a Sanity Viewer token and Editor token in project `5w5623jq`.
3. Install dependencies with `pnpm install`.
4. Validate the normalized source with `pnpm source:validate`.
5. Import content with `pnpm content:import`.
6. Run the application with `pnpm dev` and open `http://localhost:3000`.
7. Open the embedded Studio at `http://localhost:3000/studio`.

## Secrets

- Never commit `.env.local`.
- `SANITY_API_READ_TOKEN` should have Viewer permissions.
- `SANITY_API_WRITE_TOKEN` and `SANITY_AUTH_TOKEN` are local migration/CLI credentials and should normally not be added to Vercel.
- `SANITY_REVALIDATE_SECRET` must match the Sanity webhook secret.
- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, and `LEAD_NOTIFICATION_EMAIL` deliver form submissions directly through Resend without another Sanity webhook.

See `docs/SETUP.md` and `docs/SOURCE_ANALYSIS.md` for deployment and source-audit details.
