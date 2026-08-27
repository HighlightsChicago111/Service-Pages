import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'business', title: 'Business', default: true},
    {name: 'brand', title: 'Brand'},
    {name: 'proof', title: 'Trust & ratings'},
    {name: 'forms', title: 'Forms'},
  ],
  fields: [
    defineField({name: 'companyName', title: 'Company name', type: 'string', group: 'business', validation: (rule) => rule.required()}),
    defineField({name: 'siteUrl', title: 'Production site URL', type: 'url', group: 'business', validation: (rule) => rule.required()}),
    defineField({name: 'phoneDisplay', title: 'Phone (display)', type: 'string', group: 'business'}),
    defineField({name: 'phoneE164', title: 'Phone (E.164)', type: 'string', group: 'business'}),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'business', validation: (rule) => rule.email()}),
    defineField({
      name: 'address', title: 'Address', type: 'object', group: 'business',
      fields: [
        defineField({name: 'street', title: 'Street', type: 'string'}),
        defineField({name: 'city', title: 'City', type: 'string'}),
        defineField({name: 'state', title: 'State', type: 'string'}),
        defineField({name: 'zip', title: 'ZIP code', type: 'string'}),
      ],
    }),
    defineField({name: 'shopLocation', title: 'Shop location', type: 'geopoint', group: 'business'}),
    defineField({
      name: 'schemaBusinessType', title: 'Schema.org business type', type: 'string', group: 'business',
      options: {list: [{title: 'Electrician', value: 'Electrician'}, {title: 'LocalBusiness', value: 'LocalBusiness'}]},
    }),
    defineField({
      name: 'brand', title: 'Brand colors', type: 'object', group: 'brand',
      fields: [
        defineField({name: 'primary', title: 'Primary', type: 'string'}),
        defineField({name: 'dark', title: 'Dark', type: 'string'}),
        defineField({name: 'light', title: 'Light', type: 'string'}),
        defineField({name: 'secondary', title: 'Secondary', type: 'string'}),
        defineField({name: 'accent', title: 'Accent', type: 'string'}),
        defineField({name: 'accentDark', title: 'Accent dark', type: 'string'}),
      ],
    }),
    defineField({
      name: 'google', title: 'Google profile', type: 'object', group: 'proof',
      fields: [
        defineField({name: 'rating', title: 'Rating', type: 'number', validation: (rule) => rule.min(0).max(5)}),
        defineField({name: 'reviewCount', title: 'Review count', type: 'number', validation: (rule) => rule.integer().min(0)}),
        defineField({name: 'reviewsUrl', title: 'Reviews URL', type: 'url'}),
        defineField({name: 'verifiedAt', title: 'Last verified', type: 'date'}),
      ],
    }),
    defineField({name: 'trustLines', title: 'Hero trust lines', type: 'array', of: [defineArrayMember({type: 'string'})], group: 'proof'}),
    defineField({name: 'trustHeading', title: 'Trust heading', type: 'string', group: 'proof'}),
    defineField({name: 'trustLede', title: 'Trust introduction', type: 'text', group: 'proof'}),
    defineField({name: 'trustMetrics', title: 'Trust metrics', type: 'array', of: [defineArrayMember({type: 'trustMetric'})], group: 'proof'}),
    defineField({name: 'trustCards', title: 'Trust cards', type: 'array', of: [defineArrayMember({type: 'titledBody'})], group: 'proof'}),
    defineField({name: 'reviewsHeading', title: 'Reviews heading', type: 'string', group: 'proof'}),
    defineField({name: 'reviewsDisclaimer', title: 'Reviews disclaimer', type: 'text', group: 'proof'}),
    defineField({name: 'formSubtitle', title: 'Form subtitle', type: 'string', group: 'forms'}),
    defineField({name: 'formNote', title: 'Form note', type: 'text', group: 'forms'}),
  ],
  preview: {prepare: () => ({title: 'Highlights Chicago site settings'})},
})
