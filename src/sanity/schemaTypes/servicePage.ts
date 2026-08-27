import {defineArrayMember, defineField, defineType} from 'sanity'

export const servicePage = defineType({
  name: 'servicePage',
  title: 'Service pages',
  type: 'document',
  groups: [
    {name: 'page', title: 'Page', default: true},
    {name: 'seo', title: 'SEO'},
    {name: 'proof', title: 'Reviews & media'},
    {name: 'content', title: 'Guides & overrides'},
  ],
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string', group: 'page', validation: (rule) => rule.required()}),
    defineField({name: 'serviceId', title: 'Imported service ID', type: 'number', group: 'page', validation: (rule) => rule.required().integer().positive()}),
    defineField({name: 'service', title: 'Service', type: 'reference', to: [{type: 'serviceDefinition'}], group: 'page', validation: (rule) => rule.required()}),
    defineField({name: 'area', title: 'Area', type: 'reference', to: [{type: 'serviceArea'}], group: 'page', validation: (rule) => rule.required()}),
    defineField({name: 'template', title: 'Template', type: 'reference', to: [{type: 'servicePageTemplate'}], group: 'page', validation: (rule) => rule.required()}),
    defineField({
      name: 'seo', title: 'SEO metadata', type: 'object', group: 'seo',
      fields: [
        defineField({name: 'title', title: 'Meta title', type: 'string', validation: (rule) => rule.required().max(65)}),
        defineField({name: 'description', title: 'Meta description', type: 'text', rows: 3, validation: (rule) => rule.required().max(170)}),
        defineField({name: 'canonicalUrl', title: 'Canonical URL', type: 'url', validation: (rule) => rule.required()}),
      ],
    }),
    defineField({name: 'reviews', title: 'Reviews', type: 'array', of: [defineArrayMember({type: 'review'})], group: 'proof'}),
    defineField({name: 'gallery', title: 'Hero gallery', type: 'array', of: [defineArrayMember({type: 'externalImage'})], group: 'proof'}),
    defineField({name: 'workingPhotos', title: 'Working-in-area photos', type: 'array', of: [defineArrayMember({type: 'externalImage'})], group: 'proof'}),
    defineField({name: 'guides', title: 'Guides', type: 'array', of: [defineArrayMember({type: 'guide'})], group: 'content'}),
    defineField({name: 'localFaqOverrides', title: 'Local FAQ overrides', type: 'array', of: [defineArrayMember({type: 'faq'})], group: 'content'}),
  ],
  preview: {
    select: {title: 'title', service: 'service.name', area: 'area.name'},
    prepare: ({title, service, area}) => ({title, subtitle: [service, area].filter(Boolean).join(' · ')}),
  },
})
