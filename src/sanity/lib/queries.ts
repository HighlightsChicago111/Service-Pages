import {defineQuery} from 'next-sanity'

export const SERVICE_INDEX_QUERY = defineQuery(`
  *[_type == "servicePage" && defined(service->slug.current) && defined(area->slug.current)] | order(service->monthlySearchVolume desc) {
    _id,
    title,
    "serviceId": service->serviceId,
    "serviceSlug": service->slug.current,
    "areaSlug": area->slug.current,
    "serviceName": service->name,
    "areaName": area->name,
    "monthlySearchVolume": service->monthlySearchVolume,
    "metaDescription": seo.description,
    "cardImage": coalesce(
      gallery[0].image.asset->url,
      gallery[0].externalUrl,
      workingPhotos[0].image.asset->url,
      workingPhotos[0].externalUrl
    ),
    "cardImageAlt": coalesce(gallery[0].alt, workingPhotos[0].alt),
    "cardImageCaption": coalesce(gallery[0].caption, workingPhotos[0].caption)
  }
`)

export const SERVICE_PAGE_QUERY = defineQuery(`
  {
    "serviceRoutes": *[_type == "servicePage"] {
      "serviceSlug": service->slug.current,
      "areaSlug": area->slug.current
    },
    "page": *[
      _type == "servicePage" &&
      service->slug.current == $serviceSlug &&
      area->slug.current == $areaSlug
    ][0] {
      _id,
      title,
      serviceId,
      seo,
      reviews,
      gallery[]{..., "resolvedUrl": coalesce(image.asset->url, externalUrl)},
      workingPhotos[]{..., "resolvedUrl": coalesce(image.asset->url, externalUrl)},
      guides,
      localFaqOverrides,
      template->{name, version, active, sectionOrder, presentation},
      service->{
        serviceId,
        name,
        "slug": slug.current,
        parentName,
        parentUrl,
        hubUrl,
        primaryKeywords,
        monthlySearchVolume,
        secondaryKeywords,
        h1Prefix,
        heroLede,
        secondaryCta,
        issueQuestion,
        issueOptions,
        typesHeading,
        typesLede,
        types,
        typesFootnote,
        brandsHeading,
        brandsLede,
        brands,
        brandsNote,
        whyHeading,
        whyLede,
        whyItems,
        featuredCategory,
        otherServices,
        pricing,
        faqs,
        ctaHeading,
        ctaBody
      },
      area->{
        name,
        "slug": slug.current,
        state,
        heroEyebrow,
        galleryLabel,
        addressPlaceholder,
        buildingTypes,
        workingLede,
        areasHeading,
        areasLede,
        areasNote,
        subAreas[]{..., photo{..., "resolvedUrl": coalesce(image.asset->url, externalUrl)}},
        mapQuery,
        libraryHeading,
        libraryLede,
        localFaqs
      }
    },
    "settings": *[_id == "siteSettings"][0] {
      companyName,
      siteUrl,
      phoneDisplay,
      phoneE164,
      email,
      address,
      shopLocation,
      schemaBusinessType,
      brand,
      google,
      trustLines,
      trustHeading,
      trustLede,
      trustMetrics,
      trustCards,
      reviewsHeading,
      reviewsDisclaimer,
      formSubtitle,
      formNote
    }
  }
`)

export const SERVICE_PAGE_METADATA_QUERY = defineQuery(`
  *[
    _type == "servicePage" &&
    service->slug.current == $serviceSlug &&
    area->slug.current == $areaSlug
  ][0] {"title": seo.title, "description": seo.description, "canonicalUrl": seo.canonicalUrl}
`)

const REVIEW_PAGE_FIELDS = `
  _id,
  "serviceSlug": service->slug.current,
  "areaSlug": area->slug.current,
  "serviceName": service->name,
  "parentName": service->parentName,
  "monthlySearchVolume": service->monthlySearchVolume,
  "cardImage": coalesce(
    gallery[0].image.asset->url,
    gallery[0].externalUrl,
    workingPhotos[0].image.asset->url,
    workingPhotos[0].externalUrl
  ),
  "cardImageAlt": coalesce(gallery[0].alt, workingPhotos[0].alt),
  reviews[]{_key, quote, author, location, reviewDate, rating, sourceUrl, sourceId}
`

const REVIEW_SETTINGS_FIELDS = `
  companyName,
  siteUrl,
  phoneDisplay,
  phoneE164,
  google,
  reviewsDisclaimer
`

export const REVIEW_COLLECTION_QUERY = defineQuery(`
  {
    "pages": *[
      _type == "servicePage" &&
      defined(service->slug.current) &&
      defined(area->slug.current) &&
      count(reviews) > 0
    ] | order(service->monthlySearchVolume desc) {
      ${REVIEW_PAGE_FIELDS}
    },
    "settings": *[_id == "siteSettings"][0] {
      ${REVIEW_SETTINGS_FIELDS}
    }
  }
`)

export const REVIEW_SERVICE_QUERY = defineQuery(`
  {
    "page": *[
      _type == "servicePage" &&
      service->slug.current == $serviceSlug &&
      count(reviews) > 0
    ][0] {
      ${REVIEW_PAGE_FIELDS}
    },
    "settings": *[_id == "siteSettings"][0] {
      ${REVIEW_SETTINGS_FIELDS}
    }
  }
`)

export const REVIEW_SERVICE_SLUGS_QUERY = defineQuery(`
  *[_type == "servicePage" && defined(service->slug.current) && count(reviews) > 0] {
    "serviceSlug": service->slug.current
  }
`)
