---
name: highlights-chicago-service-page-v2
description: Write Highlights Chicago service landing pages for the NEW V2 template (the redesign with job paths, equipment comparison, site assessment, symptom table, step-by-step process, cost drivers, what's included and a "have these ready" checklist). Fills the "Highlights Chicago - Service Pages V2 Data.xlsx" workbook from the approved Content Plan, review and permit datasets, then imports into the separate V2 Sanity collection. Use whenever the user asks for V2 / new-template / redesigned Highlights Chicago service pages, names the V2 workbook, or wants a page tested on the new template. For pages on the CURRENT live template use the original highlights-chicago-service-page skill instead.
---

# Highlights Chicago service landing pages: V2 template

This is a copy of the original `highlights-chicago-service-page` skill, extended for the V2 template. Every fact, permit and review rule from the original still applies. What is new is the page structure, the workbook layout and the import path.

Create accurate, locally grounded service-page records without inventing company claims, prices, service areas, review text, credentials or availability.

## Where things live

- Project: `C:\highlights-chicago-service-pages-v2` (separate from the live project; never edit the live project for V2 work).
- Workbook: `Highlights Chicago - Service Pages V2 Data.xlsx` in the project root.
- Sanity: document types `v2ServicePage`, `v2ServiceArea`, `v2SiteSettings` (IDs `v2-page-<serviceId>`, `v2-area-chicago`, `v2-siteSettings`). They never touch the live `servicePage` documents, even in the same dataset.
- Design reference: the approved design file `Service Landing Page new Template.html` (solar). Service 302 in the workbook is the same page as data: copy its depth and tone.
- Fold-by-fold writing guide: `references/fold-guide.md`. Read it before drafting.

## Required inputs

Read these current source workbooks before drafting:

1. `Highlights Chicago Content Plan.xlsx`
   - `README`: scope and risk rules.
   - `Reviews`: review IDs, dates, URLs, service matches, themes, locations and staff.
   - `2 Cluster Level`: canonical cluster names, slugs and hierarchy.
   - `3 Service Level`: service IDs, keywords, monthly volume, review assignments, service slug and parent cluster slug.
2. `Highlights Chicago — Chicago Permit & Building Data.xlsx`
   - `1 Costs`: citywide permit counts and reported whole-project medians.
   - `2 Work Types`: service-specific permit context.
   - `3 Building Data`: Chicago building-stock facts.
   - `4 Highlights Chicago`: company permit history and registrations.
3. The current live page data (`Highlights Chicago - First 40 Service Page Data.xlsx`) when the service already has a live page: keep its verified claims, URL and reviews unless the request says otherwise.

If any source conflicts with the public site, do not silently choose one. Preserve the existing published claim or flag the conflict with a `[CONFIRM: ...]` placeholder.

## URL and hierarchy

- The page URL is `/services/{service-slug}` (the same URL as the live page, so V2 can later replace it in place).
- `parent_name` must be one of the canonical clusters from `2 Cluster Level`.
- The planning workbook's “10 Best …” titles are competitor-listicle research labels, never H1s or meta titles. The build rejects them.

## Verified company facts

Use only when relevant and keep wording precise:

- Company: Highlights Chicago Inc.
- Phone: `(773) 262-3333`; E.164: `+17732623333`.
- Email: `info@highlightschicago.com`.
- Address: `5766 N Lincoln Ave, Suite 1, Chicago, IL 60659`.
- City of Chicago electrical contractor registrations: `ECC96456` and `ECC94521`.
- Current external registrations: Evanston `18LICL-0250`; Palatine `CON-006592-2024`.
- Do not claim current DuPage or Bartlett registration; the source marks them lapsed.
- Public permit record: 1,213 permits beginning in April 2012; 1,173 include a reported construction value.
- Ranking: #73 of 588 licensed electrical contractors by 24-month permit volume (top 13%).
- Company permits in the most recent 24-month slice: 48.
- Google rating snapshot: 4.9/5 from 494 reviews (verified 2026-08-27). Update rating, count and date together.

Never claim 24/7 or 24-hour availability (the hours conflict in the Content Plan README is unresolved; the build rejects it). Do not lead with solar project proof until verified project evidence exists.

## Permit and pricing rules

Permit values are reported whole-project construction values, not company revenue and not a quote. Always label them that way.

Medians are written in dollars without the currency sign here, because skill arguments replace a dollar sign followed by a digit. On the page, write them with a dollar sign before the number.

Use a median only when the source has at least 100 costed permits. Reliable examples:

- Lighting: 9,748 permits; 4,000 dollars reported median.
- Outlets/receptacles: 9,306 permits; 3,750 dollars reported median.
- Service/new service: 6,672 permits; 4,000 dollars reported median.
- Panels: 5,219 permits; 15,906 dollars reported median.
- Solar: 4,033 permits; 18,992 dollars reported median.
- Low voltage: 2,074 permits; 15,000 dollars reported median.
- 100A service: 2,190 permits; 3,000 dollars reported median.
- 200A service: 2,863 permits; 4,700 dollars reported median.

For small categories (GFCI, CCTV, rewiring, ceiling fans, switchgear, transformers, temporary power and anything under 100 costed permits) write what drives the price instead of a median. The V2 cost-drivers table is where that detail goes.

## Reviews

Use the four review IDs assigned to the service in `3 Service Level`, and look up each in `Reviews`.

- Never invent or merge reviewers. Keep reviewer, ISO date, review URL and review ID exactly.
- In the workbook, write an excerpt of at most 14 consecutive words, ending in `…` when cut. The build swaps in the full public text by review ID from `data/full-reviews.json`, as the live site does.
- One `review` item per review in `02 Items`: `a=review_id, b=reviewer, c=date, d=google_url, e=excerpt, f=location (optional)`.

## Images

One original 3:2 service cover per new service: realistic Chicago electrical work, no readable text, logos, watermarks or identifiable faces, 1200×800 JPEG. Three `gallery` and three `working_photo` items per page, each with descriptive alt text naming the service and Chicago, and a caption. Use stable site paths (`/services/images/services/...`) or Sanity CDN URLs. Never hotlink search-result or stock-preview URLs. Label illustrative photos as illustrative until real job photos exist.

## Placeholders instead of guesses

The V2 template asks for operational detail (visit length, warranty terms, who does roofing, typical install days, incentives). When the sources do not answer it, write `[CONFIRM: the exact question]` in the cell. The page shows it as a yellow chip, unanswered FAQ placeholders stay out of the FAQ schema, and the build lists every placeholder. Never fill such a gap with a plausible-sounding number. A page with placeholders can be imported as a draft for review, but not published.

## Workbook output

Sheets (do not rename sheets or columns; `05 Field Map` is the authority on what each one means):

- `01 Pages`: one row per service. Single values and simple lists separated by `||`.
- `02 Items`: one row per repeating item: `owner` (the service_id), `block`, `order`, then `a` to `f`. Blocks: `form_field`, `job_path`, `equipment`, `compare_row`, `option`, `assess_check`, `route`, `symptom`, `why`, `review`, `gallery`, `working_photo`, `process_step`, `other_service`, `price_row`, `cost_driver`, `warranty`, `faq`, `guide_section`.
- `03 Area` and `04 Settings`: shared; change only when the request says so. Their repeating items use owner `area:chicago` and `settings`.

Link fields (`link_anchor`, `equip_footnote_link_anchor`) take one of these page anchors: `your-job, equipment, equipment-choices, equipment-options, site-assessment, assessment-routes, diagnose, brands, trust, reviews, why-us, working-in-area, process, areas, other-services, pricing, whats-included, faq, guides, quote`.

Optional folds are hidden when their items are empty: job paths, comparison table, options block, assessment, diagnose, process, what's included. Leave a fold out rather than pad it when the service genuinely has no such content; say which folds you left out and why.

## Import and preview

From the project root:

1. `pnpm content:extract` reads the workbook into `data/v2-source.json`.
2. `pnpm content:build` validates and writes `data/v2-documents.json`. Fix every error; review every warning and placeholder.
3. Preview at `http://localhost:3008/services/<slug>` (`pnpm dev`). With no Sanity project ID set, the site renders straight from `data/v2-documents.json`.
4. `pnpm sanity:check` (read-only) proves which Sanity project and dataset `.env.local` points at. Confirm it is the intended V2 project before any write.
5. `pnpm content:push` is a dry run that prints the target and every document. `pnpm content:push --yes` writes drafts only (`drafts.v2-page-<id>`). Get the user's explicit go-ahead, naming the project and dataset, before running it.
6. Publishing (`pnpm content:push --publish --yes`) happens only when the user asks, after they have reviewed the drafts in Studio (`/services/studio`) and no placeholders remain.

## Quality gate

Before delivery:

1. `pnpm content:extract && pnpm test:content && pnpm content:build` with zero errors.
2. `pnpm typecheck` and `pnpm lint` if any code changed.
3. Open each new page at desktop and phone width; check every visible fold, the form's extra questions, the FAQ and the library tabs.
4. Confirm each page has four reviews, three gallery and three working photos, and a service guide with sections.
5. List every `[CONFIRM]` placeholder for the user, grouped by page.
6. Report any check that could not run; never describe an unrun check as passed.
