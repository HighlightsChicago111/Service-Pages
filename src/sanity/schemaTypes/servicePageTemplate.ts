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
      name: 'presentation', title: 'Shared presentation rules', type: 'object',
      description: 'Reusable design rules applied to every service page that references this template.',
      fields: [
        defineField({name: 'footerColor', title: 'Footer/navy color', type: 'string', initialValue: '#151f2a'}),
        defineField({name: 'accentColor', title: 'Highlights Chicago green', type: 'string', initialValue: '#9ec837'}),
        defineField({name: 'accentDarkColor', title: 'Green hover color', type: 'string', initialValue: '#82aa24'}),
        defineField({name: 'equalHeightReviewCards', title: 'Equal-height review cards', type: 'boolean', initialValue: true}),
        defineField({name: 'ratingAfterReviewText', title: 'Rating after review text', type: 'boolean', initialValue: true}),
        defineField({name: 'coverageMapFirst', title: 'Coverage map before neighborhoods', type: 'boolean', initialValue: true}),
        defineField({name: 'neighborhoodGrid', title: 'Neighborhood grid without scrollbar', type: 'boolean', initialValue: true}),
        defineField({name: 'brandLogoCards', title: 'Equipment brand logo cards', type: 'boolean', initialValue: true}),
        defineField({name: 'pricingHeadingAsQuestion', title: 'Pricing heading ends with a question mark', type: 'boolean', initialValue: true}),
      ],
    }),
    defineField({
      name: 'sectionOrder', title: 'Section order', type: 'array',
      of: [defineArrayMember({type: 'string', options: {list: sections.map((value) => ({title: value, value}))}})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'version'}},
})
