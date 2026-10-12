# Design System v3 service pages: handoff

Snapshot of the V2 test app (`HighlightsChicago111/Service-New-pages-`, local branch `feat/design-system-v3`, commit 166a5fc) after the Design System v3 re-skin. It lives here because the new service-page design is being rolled out inside this live project; the Service-New-pages- repo is becoming the Service Area pages project.

This folder is reference material, not part of the build: it is excluded in the root `tsconfig.json` and `eslint.config.mjs`, and nothing under it is a route or a public asset.

## What to port (rollout plan, Phase 0)

| Piece | Path in this folder |
|---|---|
| v3 page template (one component per block) | `src/components/v3/`, entry `src/components/v3/service-page.tsx` |
| v3 content parsing and per-slug photo map | `src/lib/v3/` |
| Scoped styles (`.ds`) | `src/app/design-system-v3.css` |
| v3 assets | `public/images/v3/` |
| Sanity types `v2ServicePage`, `v2ServiceArea`, `v2SiteSettings` | `src/sanity/schemaTypes/` |
| Workbook pipeline (extract, build, push) | `scripts/`, `Highlights Chicago - Service Pages V2 Data.xlsx` |
| V2 writing skill | `skills/highlights-chicago-service-page-v2/` |

Rules from the plan: keep the v2 type names, a published v2 page for a slug wins over the current page, URLs never change, and nothing in the current types is changed or deleted before Phase 3.
