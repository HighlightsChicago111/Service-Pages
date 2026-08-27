import {defineArrayMember, defineField, defineType} from 'sanity'

export const serviceArea = defineType({
  name: 'serviceArea',
  title: 'Service areas',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Area name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: (rule) => rule.required()}),
    defineField({name: 'state', title: 'State', type: 'string', validation: (rule) => rule.required().max(2)}),
    defineField({name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string'}),
    defineField({name: 'galleryLabel', title: 'Gallery label', type: 'string'}),
    defineField({name: 'addressPlaceholder', title: 'Address placeholder', type: 'string'}),
    defineField({name: 'buildingTypes', title: 'Building types', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'workingLede', title: 'Working-in-area introduction', type: 'text'}),
    defineField({name: 'areasHeading', title: 'Coverage heading', type: 'string'}),
    defineField({name: 'areasLede', title: 'Coverage introduction', type: 'text'}),
    defineField({name: 'areasNote', title: 'Coverage note', type: 'text'}),
    defineField({name: 'subAreas', title: 'Neighborhoods and suburbs', type: 'array', of: [defineArrayMember({type: 'subArea'})]}),
    defineField({name: 'mapQuery', title: 'Map query', type: 'string'}),
    defineField({name: 'libraryHeading', title: 'Library heading', type: 'string'}),
    defineField({name: 'libraryLede', title: 'Library introduction', type: 'text'}),
    defineField({name: 'localFaqs', title: 'Default local FAQs', type: 'array', of: [defineArrayMember({type: 'faq'})]}),
  ],
  preview: {select: {title: 'name', subtitle: 'state'}},
})
