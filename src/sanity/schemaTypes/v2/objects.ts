import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Every V2 type name starts with "v2" so this collection can live in the same
 * Sanity project and dataset as the live service pages without any clash.
 */

// Page anchors that "link" fields may point to. Keep in sync with the section ids in
// src/components/v3/service-page.tsx (and its blocks) and the workbook Field Map.
export const PAGE_ANCHORS = [
  'your-job', 'equipment', 'equipment-choices', 'equipment-options', 'site-assessment', 'assessment-routes',
  'diagnose', 'brands', 'trust', 'reviews', 'why-us', 'working-in-area', 'process', 'areas',
  'other-services', 'pricing', 'whats-included', 'faq', 'guides', 'quote',
]

export const PROCESS_OWNERS = [
  {title: 'Highlights Chicago', value: 'highlights'},
  {title: 'City of Chicago', value: 'city'},
  {title: 'ComEd', value: 'comed'},
  {title: 'Customer', value: 'customer'},
  {title: 'Manufacturer', value: 'manufacturer'},
]

export const LEAD_EXTRA_FIELDS = [
  {title: 'Existing system (existingSystem)', value: 'existingSystem'},
  {title: 'Symptom (symptom)', value: 'symptom'},
  {title: 'Other details (details)', value: 'details'},
]

const anchorField = (name = 'linkAnchor', title = 'Link target on this page') =>
  defineField({name, title, type: 'string', options: {list: PAGE_ANCHORS}})

/**
 * An optional photo for one slot of the page. When it is empty the page falls back
 * to its own hero photos, or shows an icon tile; it never borrows another service's photo.
 */
export const photoField = (name: string, title: string, description?: string) =>
  defineField({name, title, type: 'v2Image', description: description || 'Optional. Leave empty to use the page’s own photos or an icon.'})

export const v2Faq = defineType({
  name: 'v2Faq', title: 'FAQ', type: 'object',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'question', subtitle: 'answer'}},
})

export const v2Image = defineType({
  name: 'v2Image', title: 'Image', type: 'object',
  fields: [
    defineField({name: 'image', title: 'Upload', type: 'image', options: {hotspot: true}}),
    defineField({name: 'externalUrl', title: 'Or image URL / site path', type: 'string'}),
    defineField({name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required().min(5).max(160)}),
    defineField({name: 'caption', title: 'Caption', type: 'string', validation: (rule) => rule.max(180)}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {select: {title: 'alt', subtitle: 'externalUrl', media: 'image'}},
})

export const v2TitledBody = defineType({
  name: 'v2TitledBody', title: 'Title and text', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'body', title: 'Text', type: 'text', rows: 3}),
    // Only the Equipment fold's option cards show a photo; every other list hides the field.
    defineField({
      name: 'image', title: 'Photo', type: 'v2Image',
      description: 'Optional. A photo of this option; leave empty to show its icon or diagram.',
      hidden: ({path}) => !path.includes('options'),
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'body', media: 'image.image'}},
})

export const v2LinkedCard = defineType({
  name: 'v2LinkedCard', title: 'Card with optional link', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'body', title: 'Text', type: 'text', rows: 3}),
    defineField({name: 'linkLabel', title: 'Link text', type: 'string'}),
    anchorField(),
  ],
  preview: {select: {title: 'title', subtitle: 'body'}},
})

export const v2JobPath = defineType({
  name: 'v2JobPath', title: 'Job path', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'whoFor', title: 'Who it is for', type: 'text', rows: 2}),
    defineField({name: 'scopeDrivers', title: 'Scope is decided by', type: 'text', rows: 2}),
    defineField({name: 'firstStep', title: 'First step', type: 'string'}),
    defineField({name: 'linkLabel', title: 'Link text', type: 'string'}),
    anchorField(),
    photoField('image', 'Card photo'),
  ],
  preview: {select: {title: 'title', subtitle: 'whoFor', media: 'image.image'}},
})

export const v2EquipmentItem = defineType({
  name: 'v2EquipmentItem', title: 'Equipment tile', type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Short description', type: 'string'}),
    photoField('image', 'Tile photo'),
  ],
  preview: {select: {title: 'name', subtitle: 'description', media: 'image.image'}},
})

export const v2ComparisonRow = defineType({
  name: 'v2ComparisonRow', title: 'Comparison row', type: 'object',
  fields: [
    defineField({name: 'label', title: 'Row label', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'values', title: 'Cells (one per column, in order)', type: 'array', of: [defineArrayMember({type: 'string'})]}),
  ],
  preview: {select: {title: 'label'}},
})

export const v2SymptomRow = defineType({
  name: 'v2SymptomRow', title: 'Symptom row', type: 'object',
  fields: [
    defineField({name: 'symptom', title: 'What you are seeing', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'causes', title: 'Common causes we check', type: 'text', rows: 2}),
    defineField({name: 'firstCheck', title: 'Where we start', type: 'string'}),
  ],
  preview: {select: {title: 'symptom', subtitle: 'firstCheck'}},
})

export const v2ProcessStep = defineType({
  name: 'v2ProcessStep', title: 'Process step', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Step', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'body', title: 'What happens', type: 'text', rows: 3}),
    defineField({name: 'owners', title: 'Who controls it', type: 'array', of: [defineArrayMember({type: 'string'})], options: {list: PROCESS_OWNERS}, validation: (rule) => rule.min(1)}),
  ],
  preview: {select: {title: 'title', subtitle: 'body'}},
})

export const v2PriceRow = defineType({
  name: 'v2PriceRow', title: 'Price row', type: 'object',
  fields: [
    defineField({name: 'job', title: 'Job', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'driver', title: 'Reported median, or what drives the price', type: 'string'}),
    defineField({name: 'permit', title: 'Permit needed?', type: 'string'}),
  ],
  preview: {select: {title: 'job', subtitle: 'driver'}},
})

export const v2CostDriver = defineType({
  name: 'v2CostDriver', title: 'Cost driver', type: 'object',
  fields: [
    defineField({name: 'factor', title: 'Factor', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'why', title: 'Why it changes the price', type: 'string'}),
    defineField({name: 'when', title: 'When you find out', type: 'string'}),
  ],
  preview: {select: {title: 'factor', subtitle: 'why'}},
})

export const v2WarrantyRow = defineType({
  name: 'v2WarrantyRow', title: 'Warranty row', type: 'object',
  fields: [
    defineField({name: 'item', title: 'What is covered', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'party', title: 'Who warrants it', type: 'text', rows: 2, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'item', subtitle: 'party'}},
})

export const v2LinkedService = defineType({
  name: 'v2LinkedService', title: 'Related service', type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (rule) => rule.required()}),
    photoField('image', 'Card photo'),
  ],
  preview: {select: {title: 'name', subtitle: 'url', media: 'image.image'}},
})

export const v2Review = defineType({
  name: 'v2Review', title: 'Review', type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Review text', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'author', title: 'Reviewer', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'date', title: 'Review date', type: 'date'}),
    defineField({name: 'sourceUrl', title: 'Google review URL', type: 'url'}),
    defineField({name: 'sourceId', title: 'Review ID (Content Plan)', type: 'string'}),
  ],
  preview: {select: {title: 'author', subtitle: 'quote'}},
})

export const v2ExtraFormField = defineType({
  name: 'v2ExtraFormField', title: 'Extra form question', type: 'object',
  fields: [
    defineField({name: 'fieldName', title: 'Sent to the CRM as', type: 'string', options: {list: LEAD_EXTRA_FIELDS}, validation: (rule) => rule.required()}),
    defineField({name: 'label', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'options', title: 'Answers', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (rule) => rule.min(2)}),
  ],
  preview: {select: {title: 'label', subtitle: 'fieldName'}},
})

export const v2GuideSection = defineType({
  name: 'v2GuideSection', title: 'Guide section', type: 'object',
  fields: [
    defineField({name: 'heading', title: 'Sub-heading', type: 'string'}),
    defineField({name: 'body', title: 'Text', type: 'text', rows: 6, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'heading', subtitle: 'body'}},
})

export const v2Guide = defineType({
  name: 'v2Guide', title: 'Library guide', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Tab title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'heading', title: 'Panel heading', type: 'string'}),
    defineField({name: 'intro', title: 'Intro paragraph', type: 'text', rows: 3}),
    defineField({name: 'sections', title: 'Sections', type: 'array', of: [defineArrayMember({type: 'v2GuideSection'})]}),
    photoField('image', 'Tab photo'),
  ],
  preview: {select: {title: 'title', subtitle: 'heading', media: 'image.image'}},
})

export const v2BrandLogo = defineType({
  name: 'v2BrandLogo', title: 'Brand logo', type: 'object',
  fields: [
    defineField({name: 'brand', title: 'Brand', description: 'Exactly as written in the Brands list.', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'logo', title: 'Official logo file', type: 'v2Image', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'brand', media: 'logo.image'}},
})

export const v2SubArea = defineType({
  name: 'v2SubArea', title: 'Neighbourhood', type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'note', title: 'Note', type: 'string'}),
    defineField({name: 'photo', title: 'Photo', type: 'v2Image'}),
  ],
  preview: {select: {title: 'name', subtitle: 'note'}},
})

export const v2TrustMetric = defineType({
  name: 'v2TrustMetric', title: 'Trust metric', type: 'object',
  fields: [
    defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'value', subtitle: 'label'}},
})

export const objectTypes = [
  v2Faq, v2Image, v2TitledBody, v2LinkedCard, v2JobPath, v2EquipmentItem, v2ComparisonRow, v2SymptomRow,
  v2ProcessStep, v2PriceRow, v2CostDriver, v2WarrantyRow, v2LinkedService, v2Review, v2ExtraFormField,
  v2GuideSection, v2Guide, v2SubArea, v2TrustMetric, v2BrandLogo,
]
