import {defineArrayMember, defineField, defineType} from 'sanity'
import {PAGE_ANCHORS} from './objects'

const strings = (name: string, title: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'array', of: [defineArrayMember({type: 'string'})], ...extra})
const list = (name: string, title: string, type: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'array', of: [defineArrayMember({type})], ...extra})
const text = (name: string, title: string, rows = 3) => defineField({name, title, type: 'text', rows})
const str = (name: string, title: string) => defineField({name, title, type: 'string'})
const fold = (name: string, title: string, group: string, fields: ReturnType<typeof defineField>[], description?: string) =>
  defineField({name, title, type: 'object', group, description, options: {collapsible: true, collapsed: false}, fields})

const CONFIRM = /\[CONFIRM:[^\]]*\]/

export const v2ServicePage = defineType({
  name: 'v2ServicePage',
  title: 'Service pages (V2 template)',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics & SEO', default: true},
    {name: 'hero', title: 'Hero & form'},
    {name: 'decide', title: 'Job paths & equipment'},
    {name: 'assess', title: 'Assessment & diagnosis'},
    {name: 'proof', title: 'Brands, why, reviews, photos'},
    {name: 'process', title: 'Process & areas'},
    {name: 'cost', title: 'Pricing & scope'},
    {name: 'close', title: 'FAQ, CTA & library'},
  ],
  fields: [
    defineField({name: 'serviceId', title: 'Service ID', type: 'number', group: 'basics', validation: (rule) => rule.required().integer()}),
    defineField({name: 'name', title: 'Service name', type: 'string', group: 'basics', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'URL slug', description: 'Page URL is /services/<slug>.', type: 'slug', group: 'basics', options: {source: 'name'}, validation: (rule) => rule.required()}),
    defineField({name: 'parentName', title: 'Cluster name', type: 'string', group: 'basics'}),
    defineField({name: 'area', title: 'Service area', type: 'reference', to: [{type: 'v2ServiceArea'}], group: 'basics', validation: (rule) => rule.required()}),
    defineField({
      name: 'seo', title: 'SEO', type: 'object', group: 'basics',
      fields: [
        defineField({name: 'title', title: 'Meta title', type: 'string', validation: (rule) => rule.max(65)}),
        defineField({name: 'description', title: 'Meta description', type: 'text', rows: 3, validation: (rule) => rule.max(170)}),
      ],
    }),
    defineField({...strings('primaryKeywords', 'Primary keywords'), group: 'basics'}),
    defineField({name: 'monthlySearchVolume', title: 'Monthly search volume', type: 'number', group: 'basics'}),
    defineField({...strings('secondaryKeywords', 'Secondary keywords'), group: 'basics'}),

    fold('hero', 'Hero', 'hero', [
      defineField({name: 'h1Prefix', title: 'H1 (the page adds "in <Area>")', type: 'string', validation: (rule) => rule.required()}),
      text('lede', 'Lede'),
      str('secondaryCta', 'Booking button text'),
    ]),
    defineField({...list('gallery', 'Hero photos (3)', 'v2Image'), group: 'hero', validation: (rule) => rule.max(3)}),
    fold('form', 'Quote form', 'hero', [
      str('issueQuestion', 'Job-type question'),
      strings('issueOptions', 'Job-type answers'),
      list('extraFields', 'Extra questions', 'v2ExtraFormField', {validation: (rule: {max: (n: number) => unknown}) => rule.max(3)} as Record<string, unknown>),
    ]),

    fold('jobPaths', 'Fold: Which job is yours?', 'decide', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('items', 'Paths', 'v2JobPath'), text('note', 'Note under the cards', 2),
    ], 'Leave empty to hide the fold.'),
    fold('equipment', 'Fold: Equipment', 'decide', [
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

    fold('assessment', 'Fold: What the assessment checks', 'assess', [
      str('heading', 'Heading'), text('lede', 'Lede'), list('checks', 'Checks', 'v2TitledBody'),
      str('routesHeading', 'Decision block heading'), list('routes', 'Decision routes (numbered)', 'v2TitledBody'), text('routesNote', 'Decision block note', 2),
    ], 'Leave empty to hide the fold.'),
    fold('diagnose', 'Fold: Symptoms and what we check', 'assess', [
      str('heading', 'Heading'), text('lede', 'Lede'),
      strings('columns', 'Table column headings (3)'),
      list('rows', 'Symptom rows', 'v2SymptomRow'),
      str('repairTitle', 'Left box title'), text('repairBody', 'Left box text', 4),
      str('orphanTitle', 'Right box title'), text('orphanBody', 'Right box text', 4),
    ], 'Leave empty to hide the fold.'),

    fold('brands', 'Fold: Brands', 'proof', [str('heading', 'Heading'), text('lede', 'Lede'), strings('items', 'Brands'), text('note', 'Note', 2)]),
    fold('why', 'Fold: Why Highlights', 'proof', [str('heading', 'Heading'), text('lede', 'Lede'), list('items', 'Reason cards', 'v2LinkedCard')]),
    defineField({...list('reviews', 'Reviews (4)', 'v2Review'), group: 'proof'}),
    defineField({...list('workingPhotos', 'Our works photos (3)', 'v2Image'), group: 'proof', validation: (rule) => rule.max(3)}),

    fold('process', 'Fold: Process, step by step', 'process', [str('heading', 'Heading'), text('lede', 'Lede'), list('steps', 'Steps', 'v2ProcessStep')], 'Leave empty to hide the fold.'),
    defineField({name: 'areasCallout', title: 'Service-specific note in the Areas fold', type: 'text', rows: 3, group: 'process'}),
    fold('otherServices', 'Fold: Other services', 'process', [
      defineField({name: 'featured', title: 'Featured category card', type: 'object', fields: [str('tag', 'Tag'), str('title', 'Title'), text('description', 'Description', 2)]}),
      list('items', 'Related services (up to 4)', 'v2LinkedService'),
    ]),

    fold('pricing', 'Fold: Cost', 'cost', [
      str('heading', 'Heading'), text('lede', 'Lede'), str('caption', 'Table caption'),
      strings('columns', 'Column headings (3)'), list('rows', 'Rows', 'v2PriceRow'), text('note', 'Note under table', 2),
      str('driversHeading', 'Cost drivers heading'), list('drivers', 'Cost drivers', 'v2CostDriver'), text('incentivesNote', 'Incentives note', 2),
    ]),
    fold('included', "Fold: What's included", 'cost', [
      str('heading', 'Heading'), text('lede', 'Lede'),
      str('inScopeHeading', 'In-scope heading'), strings('inScope', 'In scope'), text('inScopeNote', 'In-scope note', 2),
      str('separateHeading', 'Quoted-separately heading'), strings('separate', 'Quoted separately'), text('separateNote', 'Quoted-separately note', 2),
      str('handoverHeading', 'Handover heading'), strings('handover', 'Handover checklist'),
      str('warrantyHeading', 'Warranty heading'), list('warranty', 'Who warrants what', 'v2WarrantyRow'),
    ], 'Leave empty to hide the fold.'),

    defineField({...list('faqs', 'FAQs (service-specific; the area FAQs are added after these)', 'v2Faq'), group: 'close'}),
    fold('cta', 'Closing call to action', 'close', [str('heading', 'Heading (the page adds "in <Area>?")'), text('body', 'Text', 2), str('readyHeading', 'Checklist heading'), strings('readyItems', 'Have these ready')]),
    defineField({name: 'serviceGuide', title: 'Library: service detail tab', type: 'v2Guide', group: 'close'}),
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
  title: 'Service areas (V2)',
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
  title: 'Site settings (V2)',
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
  ],
  preview: {prepare: () => ({title: 'Site settings (V2)'})},
})
