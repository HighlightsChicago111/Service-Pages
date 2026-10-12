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
    // Same URL as a current page with that slug: in preview the new-design draft
    // wins, so editors see exactly what publishing it would put live.
    v2ServicePage: defineLocations({
      select: {
        title: 'name',
        slug: 'slug.current',
      },
      resolve: (document) => ({
        locations: document?.slug
          ? [{title: document.title || 'Service page (new design)', href: `/services/${document.slug}`}]
          : [],
      }),
    }),
  },
}
