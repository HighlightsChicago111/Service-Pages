# Highlights Chicago service pages

Next.js 16 and Sanity implementation for data-driven service × area landing pages, served at `https://www.highlightschicago.com/services` (the app uses the `/services` basePath; the site root is Webflow).

## Architecture

- `serviceDefinition`: reusable service content and SEO research.
- `serviceArea`: Chicago/local content, coverage, map and neighborhood data.
- `servicePage`: one service × area page with SEO, media, reviews and guides.
- `servicePageTemplate`: singleton defining the standard page section order.
- `siteSettings`: singleton for company, contact, brand, ratings, trust and form defaults.
- Embedded Sanity Studio: `/services/studio`.

## URL structure

Services are grouped like `/services/heating/heater-repair/` on the City & Suburban site:

- `/services`: one block per service group ("Choose a service").
- `/services/<group>`: the group's services, e.g. `/services/backup-power`.
- `/services/<group>/<service>`: the service page, e.g. `/services/backup-power/generator-installation`.

Group names, order, descriptions and membership live in `data/cluster-hierarchy.json`, built from the cluster-level workbook; group slugs are the content plan's slugs. A group with no published service is hidden. Earlier URLs (`/services/<service>`, `/services/<service>/chicago` and the retired Webflow slugs in `next.config.ts`) permanently redirect to the nested service page. A service missing from the file keeps a flat `/services/<service>` URL.

## Two designs during the rollout

Service pages are moving to a new design (Design System v3). Until that is finished, both designs live in Studio under **Service pages**:

- **Current design**: the `servicePage` documents above, rendered by `src/components/service-landing-page.tsx`.
- **New design**: `v2ServicePage` pages plus two shared documents, "New design settings" (`v2-siteSettings`) and "New design area: Chicago" (`v2-area-chicago`), rendered by `src/components/v3/`. All new-design type names start with `v2`.

One rule decides what a URL shows: a service page URL renders its **published** new-design page when there is one (and the new-design settings exist), otherwise its current page. The sitemap, the `/services` list, related-service links and the old `/<slug>/chicago` redirects all follow the same rule with one entry per URL (`src/lib/design-precedence.ts`). Publishing a new-design page switches its URL to the new design; unpublishing it switches the URL straight back. Drafts only show in Studio Presentation.

Every photo slot in the new design has an optional image field on the page (hero background, each job card and equipment tile, assessment, symptoms, repair box, Why Highlights, category card, cost drivers, handover, related-service cards, guide tabs), plus logo uploads for brands without a built-in logo and the Why Highlights figures. An empty slot falls back to the page's own hero photos or an icon; the Solar reference photos in `src/lib/v3/visuals.ts` only fill Solar's empty slots.

New-design slugs cannot be a redirect source in `next.config.ts` or a reserved path. `src/lib/reserved-slugs.ts` holds that list, and `pnpm test:design` fails if it drifts from `next.config.ts`.

Sanity is the source of truth for published content. `data/source-content.json` is the normalized spreadsheet export that seeded the first import; it does not include the pages added later in the Studio (Sanity has 40 service pages, the file has 30). The original spreadsheet package is preserved locally but ignored by Git.

## The Google Sheet copy of the new-design pages

The team's page sheet keeps one row per **published** new-design service page in its **Service Pages** tab. The headings are the exact Sanity field paths, so each cell maps to one field:

| Heading | Means |
|---|---|
| `name`, `serviceId`, `slug`, `area` | a single field (`slug` is the URL slug, `area` the area document's `_id`) |
| `seo.title`, `hero.h1Prefix` | a part of an object field |
| `primaryKeywords[1]`, `cta.readyItems[3]` | item 1, item 3 of a list of text |
| `faqs[2].question`, `gallery[1].alt` | a part of item 2 of a list |
| `equipment.comparison.rows[1].values[2]` | a list inside a list item |
| `hero.image.image` | an uploaded Sanity image, one JSON cell |
| `_id`, `_status`, `_url`, `_updatedAt` | bookkeeping |

Every list has two spare items. Same rules as the service area tab (service area repo, `scripts/lib/sheet.ts`).

**Sanity to sheet** is automatic: the Apps Script `google-apps-script/service-pages.gs`, installed in the sheet, rewrites only the Service Pages tab every hour and from its **Service pages → Refresh from Sanity** menu, reading published pages from Sanity's public API (no token). A row edited in the sheet, or a new row not in Sanity yet, is kept as written and marked in `_status`; delete an edited row to take Sanity's version again. After a schema change, run `pnpm sheet:apps-script` and paste the file into the sheet's Apps Script again (`pnpm test:sheet` fails until the checked-in copy is current).

**Sheet to Sanity** (new or edited rows):

```powershell
pnpm sheet:import -- --sheet "<URL of the Service pages tab, with #gid=...>"                 # dry run
pnpm sheet:import -- --sheet "<URL of the Service pages tab, with #gid=...>" --only 341 --yes   # write drafts
```

The dry run checks every row (misspelled headings, bad numbers or JSON, missing required fields, an `_id` that does not match `serviceId`, a slug another page owns) and lists the fields that differ from Sanity. `--yes` writes only changed pages, as **drafts** (never published, never duplicated), and skips a page edited in Sanity after its row's `_updatedAt`. Review and publish in the Studio. `pnpm sheet:export` writes the same rows to `exports/service-pages.csv`.

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
