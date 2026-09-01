import {defineArrayMember, defineField, defineType} from 'sanity'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'question'}},
})

export const externalImage = defineType({
  name: 'externalImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Sanity image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'externalUrl', title: 'Imported external URL', type: 'url'}),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      description: 'Describe the image for search engines and people using screen readers. Do not start with “image of”.',
      type: 'string',
      validation: (rule) => rule.required().min(5).max(160),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'Optional visible context for the image. Keep it concise and factual.',
      type: 'string',
      validation: (rule) => rule.max(180),
    }),
    defineField({name: 'credit', title: 'Credit / source', type: 'string'}),
  ],
  preview: {select: {title: 'alt', media: 'image', subtitle: 'externalUrl'}},
})

export const serviceType = defineType({
  name: 'serviceType',
  title: 'Service type',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'string'}),
    defineField({
      name: 'legacyIconSvg',
      title: 'Imported icon SVG markup',
      description: 'Stored for migration reference only. The frontend never renders this as raw HTML.',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'description'}},
})

export const titledBody = defineType({
  name: 'titledBody',
  title: 'Title and body',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'body', title: 'Body', type: 'text', rows: 4, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'title', subtitle: 'body'}},
})

export const linkedService = defineType({
  name: 'linkedService',
  title: 'Linked service',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'url', title: 'URL', type: 'url', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'name', subtitle: 'url'}},
})

export const pricingRow = defineType({
  name: 'pricingRow',
  title: 'Pricing row',
  type: 'object',
  fields: [
    defineField({name: 'job', title: 'Job', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'driver', title: 'What drives the price', type: 'text', rows: 3}),
    defineField({name: 'permit', title: 'Permit needed?', type: 'string'}),
  ],
  preview: {select: {title: 'job', subtitle: 'permit'}},
})

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'object',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 5, validation: (rule) => rule.required()}),
    defineField({name: 'author', title: 'Author / attribution', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'sourceUrl', title: 'Source URL', type: 'url'}),
    defineField({name: 'sourceId', title: 'Source review ID', type: 'string'}),
    defineField({name: 'verifiedAt', title: 'Last verified', type: 'date'}),
  ],
  preview: {select: {title: 'author', subtitle: 'quote'}},
})

export const guide = defineType({
  name: 'guide',
  title: 'Guide',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'legacyHtml',
      title: 'Imported source HTML',
      description: 'Migration reference only; never rendered directly by the frontend.',
      type: 'text',
      rows: 8,
      hidden: true,
    }),
  ],
  preview: {select: {title: 'title'}},
})

export const subArea = defineType({
  name: 'subArea',
  title: 'Neighborhood / sub-area',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'note', title: 'Note', type: 'string'}),
    defineField({name: 'photo', title: 'Photo', type: 'externalImage'}),
  ],
  preview: {select: {title: 'name', subtitle: 'note', media: 'photo.image'}},
})

export const trustMetric = defineType({
  name: 'trustMetric',
  title: 'Trust metric',
  type: 'object',
  fields: [
    defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'value', subtitle: 'label'}},
})
