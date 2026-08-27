import {defineArrayMember, defineField, defineType} from 'sanity'

const sections = [
  'hero', 'types', 'brands', 'trust', 'reviews', 'why', 'workingArea',
  'coverage', 'otherServices', 'pricing', 'faq', 'closingCta', 'guides',
]

export const servicePageTemplate = defineType({
  name: 'servicePageTemplate',
  title: 'Service-page template',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Template name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'version', title: 'Version', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
    defineField({
      name: 'sectionOrder', title: 'Section order', type: 'array',
      of: [defineArrayMember({type: 'string', options: {list: sections.map((value) => ({title: value, value}))}})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'version'}},
})
