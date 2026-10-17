import {defineQuery} from 'next-sanity'

// Two designs share the service URLs. A new-design (v2ServicePage) page only counts
// once it can render: it has a slug and an area, and the new design's settings
// document exists. Callers keep one entry per URL with preferNewDesign().
const NEW_DESIGN_PAGE = `_type == "v2ServicePage" && defined(slug.current) && defined(area->slug.current) && defined(*[_id == "v2-siteSettings"][0]._id)`

const SERVICE_ROUTES = `
  *[_type == "servicePage"] {
    "design": "current",
    "serviceSlug": service->slug.current,
    "areaSlug": area->slug.current,
    "serviceName": service->name,
    "parentName": service->parentName
  } + *[${NEW_DESIGN_PAGE}] {
    "design": "new",
    "serviceSlug": slug.current,
    "areaSlug": area->slug.current,
    "serviceName": name,
    parentName
  }
`

const RESOLVED_IMAGE = `{..., "resolvedUrl": coalesce(image.asset->url, externalUrl)}`

export const SERVICE_INDEX_QUERY = defineQuery(`
  *[
    (_type == "servicePage" && defined(service->slug.current) && defined(area->slug.current)) ||
    (${NEW_DESIGN_PAGE})
  ] | order(coalesce(service->monthlySearchVolume, monthlySearchVolume) desc) {
    _id,
    _updatedAt,
    "design": select(_type == "v2ServicePage" => "new", "current"),
    _type == "servicePage" => {
      title,
      "serviceSlug": service->slug.current,
      "areaSlug": area->slug.current,
      "serviceName": service->name,
      "areaName": area->name,
      "monthlySearchVolume": service->monthlySearchVolume,
      "metaDescription": seo.description
    },
    _type == "v2ServicePage" => {
      "title": seo.title,
      "serviceSlug": slug.current,
      "areaSlug": area->slug.current,
      "serviceName": name,
      "areaName": area->name,
      monthlySearchVolume,
      "metaDescription": seo.description
    },
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
    "serviceRoutes": ${SERVICE_ROUTES},
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
  ][0] {
    "title": seo.title,
    "description": seo.description,
    "serviceName": service->name,
    "areaName": area->name
  }
`)

/** The new-design page for a URL, with everything the Design System v3 template renders. */
export const NEW_DESIGN_PAGE_QUERY = defineQuery(`
  {
    "serviceRoutes": ${SERVICE_ROUTES},
    "page": *[${NEW_DESIGN_PAGE} && slug.current == $serviceSlug && area->slug.current == $areaSlug][0] {
      ...,
      "slug": slug.current,
      gallery[]${RESOLVED_IMAGE},
      workingPhotos[]${RESOLVED_IMAGE},
      // Each block's optional photo, resolved to a URL like the galleries.
      "hero": hero{..., image${RESOLVED_IMAGE}},
      "jobPaths": jobPaths{..., items[]{..., image${RESOLVED_IMAGE}}},
      "equipment": equipment{..., items[]{..., image${RESOLVED_IMAGE}}},
      "assessment": assessment{..., image${RESOLVED_IMAGE}},
      "diagnose": diagnose{..., image${RESOLVED_IMAGE}, orphanImage${RESOLVED_IMAGE}},
      "brands": brands{..., logos[]{..., logo${RESOLVED_IMAGE}}},
      "why": why{..., image${RESOLVED_IMAGE}},
      "otherServices": otherServices{..., featured{..., image${RESOLVED_IMAGE}}, items[]{..., image${RESOLVED_IMAGE}}},
      "pricing": pricing{..., driversImage${RESOLVED_IMAGE}},
      "included": included{..., handoverImage${RESOLVED_IMAGE}},
      "serviceGuide": serviceGuide{..., image${RESOLVED_IMAGE}},
      "area": area->{..., "slug": slug.current, subAreas[]{..., photo${RESOLVED_IMAGE}}, sharedGuides[]{..., image${RESOLVED_IMAGE}}}
    },
    "settings": *[_id == "v2-siteSettings"][0]
  }
`)

export const NEW_DESIGN_METADATA_QUERY = defineQuery(`
  *[${NEW_DESIGN_PAGE} && slug.current == $serviceSlug && area->slug.current == $areaSlug][0] {
    "title": seo.title,
    "description": seo.description,
    "serviceName": name,
    "areaName": area->name
  }
`)
