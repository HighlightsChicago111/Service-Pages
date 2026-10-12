import {defineQuery} from 'next-sanity'

const IMAGE = `{..., "resolvedUrl": coalesce(image.asset->url, externalUrl)}`

export const V2_ROUTES_QUERY = defineQuery(`
  *[_type == "v2ServicePage" && defined(slug.current)] | order(serviceId asc) {
    "slug": slug.current, name, parentName, "description": seo.description, "image": coalesce(gallery[0].image.asset->url, gallery[0].externalUrl), "imageAlt": gallery[0].alt, "areaName": area->name
  }
`)

export const V2_PAGE_QUERY = defineQuery(`
  {
    "routes": *[_type == "v2ServicePage" && defined(slug.current)] {"slug": slug.current, name, parentName},
    "page": *[_type == "v2ServicePage" && slug.current == $slug][0] {
      ...,
      "slug": slug.current,
      gallery[]${IMAGE},
      workingPhotos[]${IMAGE},
      "area": area->{..., "slug": slug.current, subAreas[]{..., photo${IMAGE}}}
    },
    "settings": *[_id == "v2-siteSettings"][0]
  }
`)
