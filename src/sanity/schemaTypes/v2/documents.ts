import {defineArrayMember, defineField, defineType, type SlugValue} from 'sanity'
import {reservedSlugReason} from '../../../lib/reserved-slugs'
import {PAGE_ANCHORS, photoField} from './objects'

const strings = (name: string, title: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'array', of: [defineArrayMember({type: 'string'})], ...extra})
const list = (name: string, title: string, type: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'array', of: [defineArrayMember({type})], ...extra})
const text = (name: string, title: string, rows = 3) => defineField({name, title, type: 'text', rows})
const str = (name: string, title: string) => defineField({name, title, type: 'string'})
const fold = (name: string, title: string, group: string, fields: ReturnType<typeof defineField>[], description?: string) =>
  defineField({name, title, type: 'object', group, description, options: {collapsible: true, collapsed: false}, fields})

const CONFIRM = /\[CONFIRM:[^\]]*\]/

// The slug is the live URL (/services/<slug>). A redirect source or reserved path
// can never be reached, so it is an error. A slug that a published current-design
// page already uses is only a warning: moving a page to the new design (Phase 2)
// does this on purpose, and publishing then switches that URL to the new design.
const LIVE_SLUG_QUERY = 'count(*[_type == "servicePage" && service->slug.current == $slug && !(_id in path("drafts.**"))])'

export const v2ServicePage = defineType({
  name: 'v2ServicePage',
  title: 'Service page (new design)',
  type: 'document',
  // One tab per page block, numbered as in the Service Page Playbook, Part C (the standard order the
  // v3 template renders, src/components/v3/service-page.tsx). Blocks 0, 1 and 20 (utility bar, nav,
  // footer) and 8 (credentials, "Who you're actually calling?") are shared: they live in
  // "New design settings", not on the page.
  groups: [
    {name: 'basics', title: 'Basics & SEO', default: true},
    {name: 'hero', title: '02 · Hero + quote form'},
    {name: 'jobs', title: '03 · Job selector'},
    {name: 'equipment', title: '04 · Equipment'},
    {name: 'assessment', title: '05 · Checklist + decision flow'},
    {name: 'diagnose', title: '06 · Symptoms'},
    {name: 'brands', title: '07 · Logo wall'},
    {name: 'reviews', title: '09 · Google reviews'},
    {name: 'why', title: '10 · Reasons (why Highlights)'},
    {name: 'works', title: '11 · Photo gallery'},
    {name: 'process', title: '12 · Process track'},
    {name: 'areas', title: '13 · Areas + map'},
    {name: 'other', title: '14 · Related services'},
    {name: 'cost', title: '15 · Pricing'},
    {name: 'included', title: '16 · Scope & handover'},
    {name: 'faq', title: '17 · FAQ'},
    {name: 'cta', title: '18 · Closing CTA'},
    {name: 'library', title: '19 · Library tabs'},
  ],

  fields: [
    defineField({name: 'serviceId', title: 'Service ID', type: 'number', group: 'basics', validation: (rule) => rule.required().integer()}),
    defineField({name: 'name', title: 'Service name', type: 'string', group: 'basics', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug', title: 'URL slug', description: 'Page URL is /services/<slug>.', type: 'slug', group: 'basics', options: {source: 'name'},
      validation: (rule) => [
        rule.required().custom((slug: SlugValue | undefined) => reservedSlugReason(slug?.current) || true),
        rule.custom(async (slug: SlugValue | undefined, context) => {
          if (!slug?.current) return true
          const live = await context.getClient({apiVersion: '2026-03-01'}).fetch<number>(LIVE_SLUG_QUERY, {slug: slug.current})
          return live
            ? 'A published current-design page already uses this slug. Publishing this page replaces it on the live URL. That is right for a Phase 2 move; for a new service, pick another slug.'
            : true
        }).warning(),
      ],
    }),
    defineField({name: 'parentName', title: 'Cluster name', type: 'string', group: 'basics'}),
    defineField({name: 'area', title: 'Service area', type: 'reference', to: [{type: 'v2ServiceArea'}], group: 'basics', validation: (rule) => rule.required()}),
    defineField({
      name: 'seo', title: 'SEO', type: 'object', group: 'basics',
      fields: [
        defineField({name: 'title', title: 'Meta title', type: 'string', validation: (rule) => rule.required().max(65)}),
        defineField({name: 'description', title: 'Meta description', type: 'text', rows: 3, validation: (rule) => rule.required().max(170)}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({...strings('primaryKeywords', 'Primary keywords'), group: 'basics'}),
    defineField({name: 'monthlySearchVolume', title: 'Monthly search volume', type: 'number', group: 'basics'}),
    defineField({...strings('secondaryKeywords', 'Secondary keywords'), group: 'basics'}),

    fold('hero', '02 · Hero', 'hero', [
      defineField({name: 'h1Prefix', title: 'H1 (the page adds "in <Area>")', type: 'string', validation: (rule) => rule.required()}),
      text('lede', 'Lede'),
      str('secondaryCta', 'Booking button text'),
      photoField('image', 'Hero background photo', 'Optional. Leave empty to use the first hero photo below.'),
    ]),
    defineField({...list('gallery', '02 · Hero crew photos (3)', 'v2Image'), group: 'hero', validation: (rule) => rule.max(3)}),
    fold('form', '02 · Quote form', 'hero', [
      str('issueQuestion', 'Job-type question'),
      strings('issueOptions', 'Job-type answers'),
      list('extraFields', 'Extra questions', 'v2ExtraFormField', {validation: (rule: {max: (n: number) => unknown}) => rule.max(3)} as Record<string, unknown>),
    ]),

    fold('jobPaths', '03 · Job selector: which job is yours?', 'jobs', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('items', 'Paths', 'v2JobPath'), text('note', 'Note under the cards', 2),
    ], 'Leave empty to hide the fold.'),
    fold('equipment', '04 · Equipment showcase (+ comparison, + options)', 'equipment', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('items', 'Equipment tiles', 'v2EquipmentItem'),
      text('footnote', 'Note under the tiles', 2), str('footnoteLinkLabel', 'Note link text'),
      defineField({name: 'footnoteLinkAnchor', title: 'Note link target', type: 'string', options: {list: PAGE_ANCHORS}}),
      defineField({
        name: 'comparison', title: 'Comparison table (optional)', type: 'object',
        fields: [str('heading', 'Heading'), text('intro', 'Intro', 2), strings('columns', 'Column headings (not counting the row-label column)'), list('rows', 'Rows', 'v2ComparisonRow')],
      }),
      defineField({
        name: 'options', title: 'Options block (optional)', type: 'object',
        fields: [str('heading', 'Heading'), str('calloutLead', 'Callout: bold first sentence'), text('calloutBody', 'Callout: rest'), list('items', 'Options', 'v2TitledBody'), text('note', 'Note', 2)],
      }),
    ]),

    fold('assessment', '05 · Checklist + decision flow: what the assessment checks', 'assessment', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('checks', 'Checks', 'v2TitledBody'),
      str('routesHeading', 'Decision block heading'), list('routes', 'Decision routes (numbered)', 'v2TitledBody'), text('routesNote', 'Decision block note', 2),
      photoField('image', 'Assessment photo'),
    ], 'Leave empty to hide the fold.'),
    fold('diagnose', '06 · Symptom accordion: symptoms and what we check', 'diagnose', [
      str('heading', 'Heading'), text('lede', 'Lede'),
      strings('columns', 'Table column headings (3)'),
      list('rows', 'Symptom rows', 'v2SymptomRow'),
      str('repairTitle', 'Left box title'), text('repairBody', 'Left box text', 4),
      str('orphanTitle', 'Right box title'), text('orphanBody', 'Right box text', 4),
      photoField('image', 'Symptoms photo'), photoField('orphanImage', 'Right box photo'),
    ], 'Leave empty to hide the fold.'),

    fold('brands', '07 · Logo wall: brands', 'brands', [
      str('heading', 'Heading'), text('lede', 'Lede'), strings('items', 'Brands'), text('note', 'Note', 2),
      list('logos', 'Logo uploads (only for brands without a built-in logo)', 'v2BrandLogo'),
    ]),
    defineField({...list('reviews', '09 · Google reviews (4)', 'v2Review'), group: 'reviews'}),
    fold('why', '10 · Reasons band: why Highlights', 'why', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('items', 'Reason cards', 'v2LinkedCard'),
      list('stats', 'Green stat row (up to 3, figures from this page only)', 'v2TrustMetric', {validation: (rule: {max: (n: number) => unknown}) => rule.max(3)} as Record<string, unknown>),
      photoField('image', 'Why Highlights photo'),
    ]),
    defineField({...list('workingPhotos', '11 · Photo gallery: our work (3 real job photos, shown first)', 'v2Image'), group: 'works', validation: (rule) => rule.max(3)}),

    fold('process', '12 · Process track', 'process', [str('heading', 'Heading'), text('lede', 'Lede'), list('steps', 'Steps', 'v2ProcessStep')], 'Leave empty to hide the fold.'),
    defineField({name: 'areasCallout', title: '13 · Areas + map: service-specific note', type: 'text', rows: 3, group: 'areas'}),
    fold('otherServices', '14 · Related services', 'other', [
      defineField({name: 'featured', title: 'Featured category card', type: 'object', fields: [str('tag', 'Tag'), str('title', 'Title'), text('description', 'Description', 2), photoField('image', 'Card background photo')]}),
      list('items', 'Related services (up to 4)', 'v2LinkedService'),
    ]),

    fold('pricing', '15 · Pricing stats (+ cost drivers, incentives)', 'cost', [
      str('heading', 'Heading'), text('lede', 'Lede'), str('caption', 'Table caption'),
      strings('columns', 'Column headings (3)'), list('rows', 'Rows', 'v2PriceRow'), text('note', 'Note under table', 2),
      str('driversHeading', 'Cost drivers heading'), list('drivers', 'Cost drivers', 'v2CostDriver'), text('incentivesNote', 'Incentives note', 2),
      photoField('driversImage', 'Cost drivers photo'),
    ]),
    fold('included', '16 · Scope & handover (+ warranties)', 'included', [
      str('heading', 'Heading'), text('lede', 'Lede'),
      str('inScopeHeading', 'In-scope heading'), strings('inScope', 'In scope'), text('inScopeNote', 'In-scope note', 2),
      str('separateHeading', 'Quoted-separately heading'), strings('separate', 'Quoted separately'), text('separateNote', 'Quoted-separately note', 2),
      str('handoverHeading', 'Handover heading'), strings('handover', 'Handover checklist'),
      str('warrantyHeading', 'Warranty heading'), list('warranty', 'Who warrants what', 'v2WarrantyRow'),
      photoField('handoverImage', 'Handover photo'),
    ], 'Leave empty to hide the fold.'),

    defineField({...list('faqs', '17 · FAQ (service-specific; the area FAQs are added after these)', 'v2Faq'), group: 'faq'}),
    fold('cta', '18 · Closing CTA', 'cta', [str('heading', 'Heading (the page adds "in <Area>?")'), text('body', 'Text', 2), str('readyHeading', 'Checklist heading'), strings('readyItems', 'Have these ready')]),
    defineField({name: 'serviceGuide', title: '19 · Library tabs: service detail tab', type: 'v2Guide', group: 'library'}),
  ],
  validation: (rule) => rule.custom((doc) => {
    const placeholders = JSON.stringify(doc || {}).match(new RegExp(CONFIRM, 'g'))
    return placeholders ? `${placeholders.length} [CONFIRM: ...] placeholder(s) still need an answer before publishing` : true
  }).warning(),
  preview: {select: {title: 'name', subtitle: 'slug.current', id: 'serviceId'}, prepare: ({title, subtitle, id}) => ({title: `${id || ''} ${title || ''}`.trim(), subtitle: subtitle ? `/services/${subtitle}` : 'No slug'})},
  orderings: [{title: 'Service ID', name: 'serviceIdAsc', by: [{field: 'serviceId', direction: 'asc'}]}],
})

export const v2ServiceArea = defineType({
  name: 'v2ServiceArea',
  title: 'Service area (new design)',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: (rule) => rule.required()}),
    defineField({name: 'state', title: 'State', type: 'string', validation: (rule) => rule.required()}),
    str('heroEyebrow', 'Hero eyebrow'), str('galleryLabel', 'Hero photo label'), str('addressPlaceholder', 'Form address placeholder'),
    strings('buildingTypes', 'Form building types'), text('workingLede', 'Our works lede', 2),
    str('areasHeading', 'Areas heading'), text('areasLede', 'Areas lede'), text('areasNote', 'Areas note', 2),
    list('subAreas', 'Neighbourhoods', 'v2SubArea'), str('mapQuery', 'Google Maps query'),
    str('libraryHeading', 'Library heading'), text('libraryLede', 'Library lede', 2),
    list('sharedGuides', 'Shared library guides (shown on every page)', 'v2Guide'),
    list('localFaqs', 'Area FAQs (shown on every page)', 'v2Faq'),
  ],
  preview: {select: {title: 'name', subtitle: 'state'}},
})

export const v2SiteSettings = defineType({
  name: 'v2SiteSettings',
  title: 'Site settings (new design)',
  type: 'document',
  fields: [
    defineField({name: 'companyName', title: 'Company name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'siteUrl', title: 'Site URL', type: 'url'}),
    str('phoneDisplay', 'Phone (display)'), str('phoneE164', 'Phone (+1...)'), str('email', 'Email'),
    defineField({name: 'address', title: 'Address', type: 'object', fields: [str('street', 'Street'), str('city', 'City'), str('state', 'State'), str('zip', 'ZIP')]}),
    defineField({name: 'shopLocation', title: 'Shop location', type: 'geopoint'}),
    str('schemaBusinessType', 'Schema.org business type'),
    defineField({
      name: 'google', title: 'Google rating', type: 'object',
      fields: [
        defineField({name: 'rating', title: 'Rating', type: 'number'}),
        defineField({name: 'reviewCount', title: 'Review count', type: 'number'}),
        defineField({name: 'reviewsUrl', title: 'Reviews URL', type: 'url'}),
        defineField({name: 'verifiedAt', title: 'Verified on', type: 'date'}),
      ],
    }),
    strings('trustLines', 'Hero trust lines'), str('trustHeading', 'Trust heading'), text('trustLede', 'Trust lede'),
    list('trustMetrics', 'Trust metrics', 'v2TrustMetric'), list('trustCards', 'Trust cards', 'v2TitledBody'),
    str('reviewsHeading', 'Reviews heading'), text('reviewsDisclaimer', 'Reviews note', 2),
    str('formSubtitle', 'Form subtitle'), str('formNote', 'Form note'),
    // Shared block photos, used on every new-design page (playbook D7, D16, D17). Empty = the design's default photo.
    photoField('credentialsImage', "08 · Credentials photo (Who you're actually calling?)", 'Optional. A Highlights van or crew photo; empty uses the default van photo.'),
    photoField('faqImage', '17 · FAQ photo card', 'Optional. Empty uses the default photo.'),
    photoField('closingImage', '18 · Closing CTA background', 'Optional. A wide branded photo; empty uses the default van and skyline photo.'),
  ],
  preview: {prepare: () => ({title: 'New design settings'})},
})
