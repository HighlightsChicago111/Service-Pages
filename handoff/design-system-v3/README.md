# Highlights Chicago Service Pages: V2 template (test collection)

A separate copy of the service-page site that renders the new design ("Service Landing Page new Template.html") from its own Sanity collection. The live project (`C:\highlight chicago service pages`) is not touched. When V2 is approved, the same pages can replace the live ones at the same URLs (`/services/<slug>`).

## What is here

| Part | Where |
|---|---|
| New page template | `src/components/service-landing-page-v2.tsx`, styles at the end of `src/app/globals.css` |
| Sanity collection (schema) | `src/sanity/schemaTypes/` (`v2ServicePage`, `v2ServiceArea`, `v2SiteSettings`) |
| Studio | `http://localhost:3008/services/studio` |
| Workbook | `Highlights Chicago - Service Pages V2 Data.xlsx` (sheet `05 Field Map` maps every column to its Sanity field) |
| Workbook -> Sanity scripts | `scripts/` |
| Writing skill (V2) | `skills/highlights-chicago-service-page-v2/` (also installed in `~/.claude/skills`; `skills/*.zip` for claude.ai) |

## First-time setup

1. Open `.env.local` and paste: project ID, organization ID, read token (Viewer), write token (Editor) and a revalidation secret (any 32+ random characters). Leave the lead webhook lines empty while testing.
2. `corepack pnpm install`
3. `corepack pnpm sanity:check` (read-only) to confirm the connection and see what the dataset holds.
4. In sanity.io/manage > API > CORS origins, add `http://localhost:3008` (allow credentials) so the Studio can sign in.

## Writing and publishing a page

```
corepack pnpm content:extract     # workbook -> data/v2-source.json
corepack pnpm content:build       # validate -> data/v2-documents.json
corepack pnpm dev                 # http://localhost:3008/services/<slug>
corepack pnpm content:push        # dry run: shows target and documents
corepack pnpm content:push --yes  # writes DRAFTS to Sanity
corepack pnpm content:push --publish --yes   # publish after review
```

Without a project ID in `.env.local`, the site renders from `data/v2-documents.json`, so a page can be checked before anything is written to Sanity.

`[CONFIRM: question]` in any cell marks a fact Highlights still has to confirm. It shows as a yellow chip, stays out of the FAQ schema, and is listed by `content:build`.

## Deploying on Vercel

1. New project from `HighlightsChicago111/Service-New-pages-`, framework Next.js, root directory `/`. Vercel detects pnpm from `pnpm-lock.yaml`.
2. Environment variables (Production and Preview):
   - `NEXT_SANITY_PROJECT_ID` = `hzu8fe77`
   - `NEXT_SANITY_DATASET` = `production`
   - `NEXT_SANITY_API_VERSION` = `2026-03-01`
   - `NEXT_SANITY_STUDIO_URL` = `/services/studio`
   - `NEXT_SITE_URL` = the deployment URL, e.g. `https://<project>.vercel.app`
   - `SANITY_API_READ_TOKEN` = the Viewer token (lets the Studio preview drafts)
   - Do not add `SANITY_API_WRITE_TOKEN` to Vercel; it is only for the local import script.
   - `SANITY_REVALIDATE_SECRET` later, together with a Sanity webhook to `https://<domain>/services/api/revalidate`.
3. The site lives under `/services` (the bare domain redirects there). The collection page `/services` lists **published** pages as cards; each card opens its page. Drafts only show in the Studio's preview.
4. In sanity.io/manage > API > CORS origins, add the Vercel domain (allow credentials) so `/services/studio` can sign in.

## Checks

`corepack pnpm test:content` (mapping and validation rules), `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm build`.

## Regenerating the blank workbook

`python -I scripts/make_workbook.py --template "<design file>.html" --source "<live project>/data/source-content.json"` rebuilds the workbook with the solar example. It overwrites the workbook, so save your rows first.
