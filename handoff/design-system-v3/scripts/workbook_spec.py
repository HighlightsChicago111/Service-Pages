"""Single source of truth for the V2 workbook layout and its Sanity mapping.

make_workbook.py builds the sheets and the Field Map from this file, and
extract_workbook.py checks incoming workbooks against it. If you add a column
here, also map it in scripts/build-documents.ts.
"""

LIST = "List: separate items with ||"

# (column, Sanity field, page section, required, writing rule)
PAGE_COLUMNS = [
    ("service_id", "serviceId", "Basics", True, "Content Plan service ID, e.g. 302. Also the Items 'owner' for this page."),
    ("slug", "slug.current", "URL /services/<slug>", True, "Lowercase, hyphens. Must match the live URL when this replaces the live page."),
    ("name", "name", "Breadcrumb, form, FAQ heading", True, "Service name, e.g. Solar Panel Installation & Service."),
    ("parent_name", "parentName", "Basics", False, "Cluster name from Content Plan '2 Cluster Level'."),
    ("area_slug", "area -> v2ServiceArea", "Basics", True, "Area slug from sheet 03 Area, normally chicago."),
    ("meta_title", "seo.title", "<title>", True, "Max 65 characters. No listicle titles."),
    ("meta_description", "seo.description", "Meta description", True, "Max 170 characters, ends with the phone number CTA."),
    ("kw_primary", "primaryKeywords[]", "Basics", False, LIST),
    ("kw_volume", "monthlySearchVolume", "Basics", False, "Number."),
    ("kw_secondary", "secondaryKeywords[]", "Basics", False, LIST),
    ("h1_prefix", "hero.h1Prefix", "Hero H1", True, "The page adds ' in Chicago'. Do not include the city."),
    ("hero_lede", "hero.lede", "Hero", True, "2 to 3 sentences, the core insight with a verified number."),
    ("cta_secondary", "hero.secondaryCta", "Hero + closing CTA buttons", True, "e.g. Book a Site Assessment."),
    ("issue_question", "form.issueQuestion", "Quote form", True, "e.g. What do you need?"),
    ("issue_options", "form.issueOptions[]", "Quote form", True, LIST + ". Mirror the job paths, end with 'Not sure which'."),
    ("jobs_heading", "jobPaths.heading", "#your-job", False, "Leave the job_path items empty to hide the fold."),
    ("jobs_lede", "jobPaths.lede", "#your-job", False, ""),
    ("jobs_note", "jobPaths.note", "#your-job", False, "Small note under the cards."),
    ("equip_heading", "equipment.heading", "#equipment", True, ""),
    ("equip_lede", "equipment.lede", "#equipment", True, ""),
    ("equip_footnote", "equipment.footnote", "#equipment", False, "Note under the tiles."),
    ("equip_footnote_link_label", "equipment.footnoteLinkLabel", "#equipment", False, ""),
    ("equip_footnote_link_anchor", "equipment.footnoteLinkAnchor", "#equipment", False, "One of the anchors listed in 05 Field Map."),
    ("compare_heading", "equipment.comparison.heading", "#equipment-choices", False, "Comparison table. Rows are compare_row items."),
    ("compare_intro", "equipment.comparison.intro", "#equipment-choices", False, ""),
    ("compare_columns", "equipment.comparison.columns[]", "#equipment-choices", False, LIST + ". 2 to 5 column headings."),
    ("options_heading", "equipment.options.heading", "#equipment-options", False, "Options block. Cards are option items."),
    ("options_callout_lead", "equipment.options.calloutLead", "#equipment-options", False, "Bold first sentence."),
    ("options_callout_body", "equipment.options.calloutBody", "#equipment-options", False, ""),
    ("options_note", "equipment.options.note", "#equipment-options", False, ""),
    ("assess_heading", "assessment.heading", "#site-assessment", False, "Checks are assess_check items. Empty = fold hidden."),
    ("assess_lede", "assessment.lede", "#site-assessment", False, ""),
    ("routes_heading", "assessment.routesHeading", "#assessment-routes", False, "Numbered decision routes are route items."),
    ("routes_note", "assessment.routesNote", "#assessment-routes", False, ""),
    ("diagnose_heading", "diagnose.heading", "#diagnose", False, "Rows are symptom items. Empty = fold hidden."),
    ("diagnose_lede", "diagnose.lede", "#diagnose", False, ""),
    ("diagnose_columns", "diagnose.columns[]", "#diagnose", False, LIST + ". Exactly 3, or blank for the default headings."),
    ("repair_title", "diagnose.repairTitle", "#diagnose", False, "Left box, e.g. Repair, replace or upgrade?"),
    ("repair_body", "diagnose.repairBody", "#diagnose", False, ""),
    ("orphan_title", "diagnose.orphanTitle", "#diagnose", False, "Right box, e.g. Original installer closed?"),
    ("orphan_body", "diagnose.orphanBody", "#diagnose", False, ""),
    ("brands_heading", "brands.heading", "#brands", True, "The page adds ' in Chicago'."),
    ("brands_lede", "brands.lede", "#brands", False, ""),
    ("brands", "brands.items[]", "#brands", True, LIST + ". A logo file must exist in public/images/brands/<brand-slug>.png."),
    ("brands_note", "brands.note", "#brands", False, ""),
    ("why_heading", "why.heading", "#why-us", True, "Cards are why items."),
    ("why_lede", "why.lede", "#why-us", False, ""),
    ("process_heading", "process.heading", "#process", False, "Steps are process_step items. Empty = fold hidden."),
    ("process_lede", "process.lede", "#process", False, ""),
    ("areas_callout", "areasCallout", "#areas", False, "One service-specific note under the neighbourhoods."),
    ("feature_tag", "otherServices.featured.tag", "#other-services", False, "e.g. Main category."),
    ("feature_title", "otherServices.featured.title", "#other-services", False, ""),
    ("feature_desc", "otherServices.featured.description", "#other-services", False, "Links are other_service items (max 4)."),
    ("pricing_heading", "pricing.heading", "#pricing", True, "The page adds ' in Chicago?'. e.g. What Solar Work Costs."),
    ("pricing_lede", "pricing.lede", "#pricing", True, ""),
    ("pricing_caption", "pricing.caption", "#pricing", True, "Source and date range of the permit data."),
    ("pricing_columns", "pricing.columns[]", "#pricing", False, LIST + ". Exactly 3, or blank for the default headings."),
    ("pricing_note", "pricing.note", "#pricing", True, "Reported values are whole-project values, not quotes."),
    ("drivers_heading", "pricing.driversHeading", "#pricing", False, "Rows are cost_driver items."),
    ("incentives_note", "pricing.incentivesNote", "#pricing", False, "No incentive claims until confirmed."),
    ("incl_heading", "included.heading", "#whats-included", False, "Empty in_scope and handover = fold hidden."),
    ("incl_lede", "included.lede", "#whats-included", False, ""),
    ("in_scope_heading", "included.inScopeHeading", "#whats-included", False, ""),
    ("in_scope", "included.inScope[]", "#whats-included", False, LIST),
    ("in_scope_note", "included.inScopeNote", "#whats-included", False, ""),
    ("separate_heading", "included.separateHeading", "#whats-included", False, ""),
    ("separate", "included.separate[]", "#whats-included", False, LIST),
    ("separate_note", "included.separateNote", "#whats-included", False, ""),
    ("handover_heading", "included.handoverHeading", "#whats-included", False, ""),
    ("handover", "included.handover[]", "#whats-included", False, LIST),
    ("warranty_heading", "included.warrantyHeading", "#whats-included", False, "Rows are warranty items."),
    ("cta_heading", "cta.heading", "Closing CTA", True, "The page adds ' in Chicago?'. e.g. Planning solar."),
    ("cta_body", "cta.body", "Closing CTA", True, ""),
    ("ready_heading", "cta.readyHeading", "Closing CTA", False, "e.g. Have these ready when you call."),
    ("ready_items", "cta.readyItems[]", "Closing CTA", False, LIST),
    ("guide_title", "serviceGuide.title", "#guides (4th tab)", True, "e.g. Solar Panel Installation & Service — Detail."),
    ("guide_heading", "serviceGuide.heading", "#guides", True, "Panel heading."),
    ("guide_intro", "serviceGuide.intro", "#guides", True, "Sections are guide_section items."),
]

# block: (item columns a..f, Sanity field, page section, writing rule)
PAGE_BLOCKS = {
    "form_field": (["field_name", "label", "options"], "form.extraFields[]", "Quote form", "field_name is existingSystem, symptom or details. options: list with ||. Max 3."),
    "job_path": (["title", "who_for", "scope_drivers", "first_step", "link_label", "link_anchor"], "jobPaths.items[]", "#your-job", "3 to 5 paths."),
    "equipment": (["name", "description"], "equipment.items[]", "#equipment", "4 to 8 tiles. Description under 45 characters."),
    "compare_row": (["label", "col_1", "col_2", "col_3", "col_4", "col_5"], "equipment.comparison.rows[]", "#equipment-choices", "One cell per compare_columns heading."),
    "option": (["title", "body"], "equipment.options.items[]", "#equipment-options", "2 to 4 options."),
    "assess_check": (["title", "why"], "assessment.checks[]", "#site-assessment", "6 to 10 checks, each with why it matters."),
    "route": (["title", "body"], "assessment.routes[]", "#assessment-routes", "2 to 4 numbered routes."),
    "symptom": (["symptom", "causes", "first_check"], "diagnose.rows[]", "#diagnose", "4 to 8 rows."),
    "why": (["title", "body", "link_label", "link_anchor"], "why.items[]", "#why-us", "6 cards. Link optional."),
    "review": (["review_id", "reviewer", "date", "google_url", "excerpt", "location"], "reviews[]", "#reviews", "4 reviews from Content Plan '3 Service Level'. Excerpt max 14 words; full text is filled from data/full-reviews.json by ID."),
    "gallery": (["url", "alt", "caption"], "gallery[]", "Hero photos", "Exactly 3. url is a site path (/services/images/...) or https URL."),
    "working_photo": (["url", "alt", "caption"], "workingPhotos[]", "#working-in-area", "Exactly 3."),
    "process_step": (["title", "body", "owners"], "process.steps[]", "#process", "owners: list with || of highlights, city, comed, customer, manufacturer."),
    "other_service": (["name", "description", "url"], "otherServices.items[]", "#other-services", "Max 4, absolute live URLs."),
    "price_row": (["job", "driver", "permit"], "pricing.rows[]", "#pricing", "Medians only for categories with 100+ costed permits."),
    "cost_driver": (["factor", "why", "when"], "pricing.drivers[]", "#pricing", "6 to 10 drivers."),
    "warranty": (["item", "party"], "included.warranty[]", "#whats-included", ""),
    "faq": (["question", "answer"], "faqs[]", "#faq", "6 to 12. Area FAQs are added after these automatically."),
    "guide_section": (["heading", "body"], "serviceGuide.sections[]", "#guides", "3 to 5 sections. Blank line in body = new paragraph."),
}

AREA_COLUMNS = [
    ("slug", "slug.current"), ("name", "name"), ("state", "state"), ("hero_eyebrow", "heroEyebrow"),
    ("gallery_label", "galleryLabel"), ("address_placeholder", "addressPlaceholder"), ("building_types", "buildingTypes[]"),
    ("working_lede", "workingLede"), ("areas_heading", "areasHeading"), ("areas_lede", "areasLede"), ("areas_note", "areasNote"),
    ("map_query", "mapQuery"), ("library_heading", "libraryHeading"), ("library_lede", "libraryLede"),
]

# Items whose owner is "area:<slug>"
AREA_BLOCKS = {
    "sub_area": (["name", "note", "photo_url", "credit"], "subAreas[]", "#areas", "Neighbourhood chips."),
    "shared_guide": (["tab_title", "panel_heading", "section_heading", "body"], "sharedGuides[]", "#guides (first tabs)", "Rows with the same tab_title form one guide. Blank section_heading = intro paragraph."),
    "local_faq": (["question", "answer"], "localFaqs[]", "#faq", "Shown after every page's own FAQs."),
}

SETTINGS_FIELDS = [
    ("company_name", "companyName"), ("site_url", "siteUrl"), ("phone_display", "phoneDisplay"), ("phone_e164", "phoneE164"),
    ("email", "email"), ("address_street", "address.street"), ("address_city", "address.city"), ("address_state", "address.state"),
    ("address_zip", "address.zip"), ("shop_lat", "shopLocation.lat"), ("shop_lng", "shopLocation.lng"),
    ("schema_business_type", "schemaBusinessType"), ("google_rating", "google.rating"), ("google_review_count", "google.reviewCount"),
    ("google_reviews_url", "google.reviewsUrl"), ("google_verified_at", "google.verifiedAt"), ("trust_heading", "trustHeading"),
    ("trust_lede", "trustLede"), ("reviews_heading", "reviewsHeading"), ("reviews_disclaimer", "reviewsDisclaimer"),
    ("form_subtitle", "formSubtitle"), ("form_note", "formNote"),
]

# Items whose owner is "settings"
SETTINGS_BLOCKS = {
    "trust_line": (["text"], "trustLines[]", "Hero trust bar", "2 lines."),
    "trust_metric": (["value", "label"], "trustMetrics[]", "#trust", "4 metrics."),
    "trust_card": (["title", "body"], "trustCards[]", "#trust", "3 cards."),
}

ANCHORS = [
    "your-job", "equipment", "equipment-choices", "equipment-options", "site-assessment", "assessment-routes",
    "diagnose", "brands", "trust", "reviews", "why-us", "working-in-area", "process", "areas",
    "other-services", "pricing", "whats-included", "faq", "guides", "quote",
]

ITEM_COLUMNS = ["owner", "block", "order", "a", "b", "c", "d", "e", "f"]
