import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    servicePage: defineLocations({
      select: {
        title: 'title',
        serviceSlug: 'service->slug.current',
      },
      resolve: (document) => ({
        locations: document?.serviceSlug
          ? [{title: document.title || 'Service page', href: `/services/${document.serviceSlug}`}]
          : [],
      }),
    }),
  },
}
