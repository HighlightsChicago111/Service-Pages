# Updated source-package analysis

Analyzed on 2026-08-27. The authoritative package is `mmm/page_generator_tool/`. The files duplicated directly under `mmm/` contain the same core generator assets, but the nested package is complete because it also includes the README and example output.

## Executive result

The new package is a replacement dataset, not a small revision to the old three-service package. It supplies ten electrical-service rows, one Chicago service-area row, and ten service-page join rows. All ten service × Chicago joins are complete and internally consistent.

The generator UI and README were not updated to describe the expanded spreadsheet schema. The HTML skeleton contains only minor repairs. For the CMS migration, the spreadsheets/sample data are therefore authoritative for content and the skeleton is authoritative only for page composition.

## File comparison

- `interface.html`: byte-for-byte identical to the old package.
- `README.md`: byte-for-byte identical to the old package and still describes the original three-row/38-field/50-field version.
- `skeleton.html`: fixes the guide-panel initialization, uses unescaped Mustache values for image and area JavaScript values, and adds `.fit-contain`.
- `sample_data.js`: matches all populated spreadsheet values. Object-key order differs in places but values do not.
- All workbook tabs were inspected for values and layout; none contains formulas.

The triple-brace change prevents URL entity encoding, but it would also permit HTML/JavaScript injection if untrusted values reach the old generator. The new Next.js renderer does not render imported HTML or SVG as raw markup.

## Workbook 1: equipment/service definitions

Source: `01_equipment_fields.xlsx`, sheet `Equipment`, used range `A1:AP18`.

- 42 fields
- 10 service rows
- Service IDs 301–310
- New SEO fields that the unchanged generator UI does not declare: `service_id`, `kw_primary`, `kw_volume`, `kw_secondary`

Fields:

`service_id`, `slug`, `name`, `parent_name`, `parent_url`, `hub_url`, `h1_prefix`, `hero_lede`, `cta_secondary`, `issue_question`, `issue_options`, `types_heading`, `types_lede`, `types`, `types_footnote`, `brands_heading`, `brands_lede`, `brands`, `brands_note`, `why_heading`, `why_lede`, `why`, `feature_tag`, `feature_title`, `feature_desc`, `feature_cta`, `feature_url`, `other_services`, `pricing_heading`, `pricing_lede`, `pricing_caption`, `pricing_col_1`, `pricing_col_2`, `pricing_col_3`, `pricing_rows`, `pricing_note`, `faqs`, `cta_heading`, `cta_body`, `kw_primary`, `kw_volume`, `kw_secondary`.

Services:

1. Generator Installation — 73,890 monthly searches
2. Solar Panel Installation — 58,500
3. Ceiling Fan Installation — 26,000
4. Generator Repair — 24,970
5. Whole House Surge Protector — 20,490
6. GFCI Outlet Installation — 19,000
7. Garbage Disposal Wiring — 18,350
8. Electrical Repair — 15,620
9. Electrical Panel Upgrade — 15,440
10. Circuit Breaker Replacement — 14,900

The total supplied monthly volume is 287,160. These values are source inputs, not independently verified search-volume measurements.

## Workbook 2: service areas

Source: `02_area_fields.xlsx`, sheet `Area`, used range `A1:O8`.

- 15 fields
- 1 row: Chicago, Illinois

Fields:

`slug`, `name`, `state`, `hero_eyebrow`, `gallery_label`, `address_placeholder`, `building_types`, `working_lede`, `areas_heading`, `areas_lede`, `areas_note`, `sub_areas`, `map_query`, `library_heading`, `library_lede`.

The Chicago row includes six building types and twelve sub-areas. This collection is deliberately independent of services so another area can be added once and reused across many service-page joins.

## Workbook 3: service-page joins and shared site data

Source: `03_page_fields.xlsx`, sheet `Page`, used range `A1:AY19`.

- 51 fields
- 10 rows
- One row for every supplied service joined to Chicago
- New field that the unchanged generator UI does not declare: `service_id`

Fields:

`equipment_slug`, `area_slug`, `service_id`, `meta_title`, `meta_description`, `canonical_url`, `site_url`, `company_name`, `phone_display`, `phone_e164`, `email`, `address_street`, `address_city`, `address_state`, `address_zip`, `shop_lat`, `shop_lng`, `schema_business_type`, `brand_color`, `brand_dark`, `brand_light`, `brand_secondary`, `accent_color`, `accent_dark`, `google_rating`, `google_review_count`, `rating_pct`, `google_reviews_url`, `trust_line_1`, `trust_line_2`, `trust_heading`, `trust_lede`, `trust_cell_1_value`, `trust_cell_1_label`, `trust_cell_2_value`, `trust_cell_2_label`, `trust_cell_4_value`, `trust_cell_4_label`, `trust_cell_5_value`, `trust_cell_5_label`, `trust_cards`, `reviews_heading`, `reviews`, `reviews_disclaimer`, `gallery`, `working_photos`, `form_subtitle`, `form_note`, `form_action`, `guides`, `faqs_local`.

Seven values vary by service page: `equipment_slug`, `service_id`, `meta_title`, `meta_description`, `canonical_url`, `reviews`, and `guides`. The other 44 fields are duplicated across all ten rows. The CMS model removes that duplication.

## Join and encoded-field validation

- All service slugs are unique.
- All service IDs are unique and match between equipment and page sheets.
- All expected service × area page keys exist exactly once.
- No orphan page rows were found.
- Every encoded list parsed successfully.
- Per service: 5–6 issue options, 6–8 service types, 10 brands, 6 why-us items, 4 related services, 6 pricing rows, and 5 service FAQs.
- Per page: 4 reviews, 3 gallery images, 3 working-area photos, 4 guides, and 1 local FAQ.
- Per area: 6 building types and 12 sub-areas.

## Sanity collection design

The source maps to three reusable collections plus two standard singletons:

| Sanity type | Source ownership | Purpose |
| --- | --- | --- |
| `serviceDefinition` | Equipment sheet | Service-specific copy, service taxonomy, keyword research, FAQs, pricing, and related services |
| `serviceArea` | Area sheet | Reusable city/area copy, building types, neighborhoods, map query, and local FAQs |
| `servicePage` | Page sheet | One service × area join, page SEO, reviews, page media, guides, and controlled overrides |
| `siteSettings` | 44 duplicated page fields | Company, contact, address, brand, ratings, trust, and form defaults stored once |
| `servicePageTemplate` | Skeleton composition | Versioned standard section order referenced by every service page |

This separation is the merge model: a page resolves `servicePage → serviceDefinition + serviceArea + siteSettings + servicePageTemplate`. It avoids copying shared fields into every page and permits one service to be combined with additional areas later.

## Migration decisions and source risks

- The ten new services replace, rather than merge with, the three old rows. The old service records are not imported automatically.
- Google-hosted and Wikimedia image URLs remain external migration references. They should ultimately be uploaded to Sanity assets with explicit rights/credits and meaningful alt text.
- Imported SVG icon markup and guide HTML are retained only as hidden migration references. The frontend renders a safe icon and plaintext Portable Text blocks.
- The supplied `form_action` currently points to `https://www.highlightschicago.com/submit`. It is not used. Leads go through `/api/lead` to a separately configured `LEAD_WEBHOOK_URL`.
- Local FAQs are included both visually and in generated FAQ structured data, correcting an omission in the old skeleton.
- Ratings, review counts, quotes, source links, and claimed keyword volumes should be reverified before production launch.
- The old skeleton hardcodes an empty Maps API key and map-center assumptions. The new renderer uses the area's `map_query` with the standard Maps embed URL and does not require a browser-exposed Maps key.
- Spreadsheet meta titles and descriptions exceed the Sanity limits on most rows. The importer generates a concise `Service in Area | Company` title and shortens descriptions at a word boundary to 170 characters, while preserving the original spreadsheet values in `data/source-content.json`.

## Generated artifacts

`scripts/extract-source.mjs` extracts the authoritative `sample_data.js` into the committed, normalized `data/source-content.json`. `scripts/validate-source.ts` verifies keys, joins, service IDs, canonical URLs, and key numeric fields before import. `scripts/import-content.ts` maps that normalized file into deterministic Sanity document IDs, so repeat imports update the same records instead of duplicating them.
