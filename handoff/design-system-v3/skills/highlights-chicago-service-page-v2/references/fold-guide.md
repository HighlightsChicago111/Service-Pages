# V2 fold-by-fold writing guide

Page order, top to bottom. "Existing" folds work as on the live template; "New" and "Updated" folds are the V2 additions. Service 302 (solar) in the workbook is the worked example for every row below.

| # | Fold (anchor) | Status | Workbook source |
|---|---|---|---|
| 1 | Hero + quote form | Updated | `01 Pages` hero/form columns, `form_field`, `gallery` |
| 2 | Which job is yours? (`#your-job`) | New | `jobs_*`, `job_path` |
| 3 | Equipment (`#equipment`), comparison (`#equipment-choices`), options (`#equipment-options`) | Updated | `equip_*`, `compare_*`, `options_*`, `equipment`, `compare_row`, `option` |
| 4 | What the assessment checks (`#site-assessment`, `#assessment-routes`) | New | `assess_*`, `routes_*`, `assess_check`, `route` |
| 5 | Symptoms and what we check (`#diagnose`) | New | `diagnose_*`, `repair_*`, `orphan_*`, `symptom` |
| 6 | Brands (`#brands`) | Existing | `brands_*` |
| 7 | Who you're actually calling (`#trust`) | Existing, shared | `04 Settings` |
| 8 | Reviews (`#reviews`) | Existing | `review` |
| 9 | Why Highlights (`#why-us`) | Updated | `why_*`, `why` |
| 10 | Our works photos (`#working-in-area`) | Existing | `working_photo` |
| 11 | Process (`#process`) | New | `process_*`, `process_step` |
| 12 | Areas (`#areas`) | Updated | `areas_callout` (+ shared area) |
| 13 | Other services (`#other-services`) | Existing | `feature_*`, `other_service` |
| 14 | Cost (`#pricing`) | Updated | `pricing_*`, `drivers_heading`, `incentives_note`, `price_row`, `cost_driver` |
| 15 | What's included (`#whats-included`) | New | `incl_*`, `in_scope*`, `separate*`, `handover*`, `warranty*`, `warranty` |
| 16 | FAQ (`#faq`) | Updated | `faq` (+ shared area FAQ) |
| 17 | Closing CTA + have these ready | Updated | `cta_*`, `ready_*` |
| 18 | Library (`#guides`) | Updated | `guide_*`, `guide_section` (+ 3 shared tabs) |

## 1. Hero and form

- `h1_prefix` names the service; the page appends "in Chicago". `hero_lede` states the core insight with one verified number and names the two or three places the job usually stalls. The new folds then expand each stall point, so write the lede last.
- `issue_options` mirror the job paths one to one, then add "Quote only" if relevant and always end with "Not sure which".
- `form_field` adds at most three extra questions. Use `existingSystem` when the service has an installed base (generators, solar, EV chargers, panels) and `symptom` for repair-heavy services; the symptom options must match the rows of the symptom table. Options start with a neutral answer ("Not applicable", "No, this would be new").

## 2. Which job is yours?

The buyer question: "Is my situation even what this page is about?" Write 3 to 5 paths that genuinely start in different places (new install, upgrade that unblocks it, add-on, repair, commercial or multi-unit).

Each `job_path`: `title`; `who_for` (one sentence starting "You..."); `scope_drivers` (the 2 to 4 things that decide scope and price); `first_step` (a concrete first action, e.g. "Site assessment.", "Tell us your inverter make and model."); `link_label` + `link_anchor` pointing at the fold that explains that path. `jobs_note` tells an unsure reader to pick "Not sure which" in the form.

## 3. Equipment, comparison and options

- Keep 4 to 8 equipment tiles, descriptions under 45 characters. `equip_footnote` mentions repair work and links to `diagnose` when that fold exists.
- Comparison table (`compare_*`, `compare_row`): only when the buyer faces a real technology choice (inverter types, generator fuel, charger level, panel brands, fixture types). 2 to 5 columns; 4 to 7 rows covering where it sits, best fit, failure behaviour, maintenance, future add-ons. State "depends on the model, so ask" rather than invent specs.
- Options block (`options_*`, `option`): a scope decision the buyer must make (backup scope, number of circuits, smart vs standard). `options_callout_lead` is the one misconception to correct, in bold.

## 4. What the assessment checks

The buyer question: "What decides my price, and when do I find out?" 6 to 10 `assess_check` items, each `title` + why it matters in Chicago buildings (age of stock, brick, two-flats, condo approvals, service size). Then 2 to 4 numbered `route` items for the most common blocker (usually panel or service capacity). `routes_note` says the route is decided on site and written into the scope before work starts.

## 5. Symptoms and what we check

For services with an installed base. 4 to 8 `symptom` rows: what the customer sees, common causes we check, where diagnosis starts. Never promise a fix. `repair_*` box: repair vs replace vs upgrade, including discontinued parts and manufacturer warranty. `orphan_*` box: the original installer has closed, and what to bring.

## 9. Why Highlights

Six cards. Keep verified facts (permit counts, ECC numbers, express permits). Where a card's claim is explained by a new fold, add `link_label` + `link_anchor` (e.g. "What the assessment checks" -> `site-assessment`). Keep cards short; the folds carry the detail.

## 11. Process

5 to 9 `process_step` items from first visit to handover. `owners` is `highlights`, `city`, `comed`, `customer` or `manufacturer` (several allowed, separated by `||`). Be explicit about which steps are outside Highlights' control. Use `[CONFIRM: ...]` for visit length, filing order and install days unless sourced.

## 12. Areas callout

One service-specific sentence or two on how Chicago building types change this job (flat roofs, brick, two-flat meters, condo associations, detached garages).

## 14. Cost

Keep the permit-median table (medians only with 100+ costed permits; otherwise what drives the price). Column 2 heading: "Reported median, or what drives the price". Add 6 to 10 `cost_driver` rows: factor, why it changes the price, when you find out (assessment, design, during the job). `incentives_note` only when incentives exist for the service, and it states nothing until confirmed.

## 15. What's included

`in_scope` vs `separate` (quoted separately, when needed), `handover` (what the buyer should hold at the end: permit closed, inspection passed, documents, warranty registrations) and `warranty` rows (`item`, who warrants it). Workmanship warranty terms are always `[CONFIRM: ...]` until Highlights confirms them.

## 16. FAQ

6 to 12 service FAQs: keep the live page's verified questions, then add the questions the new folds raise (roof first? outage? two-flat or condo? installer closed? how many visits? incentives?). An FAQ whose answer is a placeholder is shown for review but left out of the FAQ schema automatically. The area FAQ ("Do you cover my part of Chicago?") is appended for you.

## 17. Closing CTA

`cta_heading` without the city (the page adds "in Chicago?"). `ready_items`: 4 to 6 things to have ready when calling (bills, a photo of the panel with the main breaker label readable, meter photo, equipment make and model, error codes, condo approvals contact).

## 18. Library

The three shared Chicago tabs come from the area. Write the fourth tab: `guide_title` ("<Service> — Detail"), `guide_heading`, `guide_intro`, then 3 to 5 `guide_section` items (sub-heading + 1 to 3 paragraphs; blank line = new paragraph). Original long-form content that explains the why behind the folds; no copied text.
