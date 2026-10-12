import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    v2ServicePage: defineLocations({
      select: {title: 'name', slug: 'slug.current'},
      resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Service page', href: `/services/${doc.slug}`}] : []}),
    }),
  },
}
