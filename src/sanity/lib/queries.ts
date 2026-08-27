import {defineQuery} from 'next-sanity'

export const SERVICE_INDEX_QUERY = defineQuery(`
  *[_type == "servicePage"] | order(service->monthlySearchVolume desc) {
    _id,
    title,
    "serviceSlug": service->slug.current,
    "areaSlug": area->slug.current,
    "serviceName": service->name,
    "areaName": area->name,
    "monthlySearchVolume": service->monthlySearchVolume,
    "metaDescription": seo.description
  }
`)

export const SERVICE_PAGE_QUERY = defineQuery(`
  {
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
      gallery,
      workingPhotos,
      guides,
      localFaqOverrides,
      template->{name, version, active, sectionOrder},
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
        subAreas,
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
