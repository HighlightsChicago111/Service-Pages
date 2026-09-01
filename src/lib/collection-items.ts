export type CollectionItem = {
  _id?: string | null
  title?: string | null
  serviceSlug?: string | null
  areaSlug?: string | null
  serviceName?: string | null
  areaName?: string | null
  monthlySearchVolume?: number | null
  metaDescription?: string | null
  cardImage?: string | null
  cardImageAlt?: string | null
  cardImageCaption?: string | null
}

export type PreparedCollectionItem = Omit<CollectionItem, 'serviceSlug' | 'areaSlug' | 'serviceName' | 'areaName' | 'monthlySearchVolume' | 'metaDescription' | 'cardImage' | 'cardImageAlt' | 'cardImageCaption'> & {
  _id: string
  serviceSlug: string
  areaSlug: string
  serviceName: string
  areaName: string
  monthlySearchVolume?: number
  metaDescription?: string
  cardImage?: string
  cardImageAlt: string
  cardImageCaption: string
}

const serviceCardImages: Record<string, string> = {
  'generator-installation': '/services/images/services/generator-installation.jpg',
  'solar-panel-installation': '/services/images/services/solar-panel-installation.jpg',
  'ceiling-fan-installation': '/services/images/services/ceiling-fan-installation.jpg',
  'generator-repair': '/services/images/services/generator-repair.jpg',
  'whole-house-surge-protector': '/services/images/services/whole-house-surge-protector.jpg',
  'gfci-outlet-installation': '/services/images/services/gfci-outlet-installation.jpg',
  'garbage-disposal-wiring': '/services/images/services/garbage-disposal-wiring.jpg',
  'electrical-repair': '/services/images/services/electrical-repair.jpg',
  'electrical-panel-upgrade': '/services/images/services/electrical-panel-upgrade.jpg',
  'circuit-breaker-replacement': '/services/images/services/circuit-breaker-replacement.jpg',
}

export function serviceCardImageForSlug(serviceSlug: string): string | undefined {
  return serviceCardImages[serviceSlug]
}

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function prepareCollectionItems(pages: CollectionItem[]): PreparedCollectionItem[] {
  return pages.flatMap((page, index) => {
    const serviceSlug = cleanString(page.serviceSlug)
    const areaSlug = cleanString(page.areaSlug)
    if (!serviceSlug || !areaSlug) return []

    const monthlySearchVolume = typeof page.monthlySearchVolume === 'number' && Number.isFinite(page.monthlySearchVolume) && page.monthlySearchVolume > 0
      ? page.monthlySearchVolume
      : undefined

    const serviceName = cleanString(page.serviceName) || cleanString(page.title) || 'Electrical service'
    const areaName = cleanString(page.areaName) || 'Chicago'
    const localCover = serviceCardImageForSlug(serviceSlug)
    const usesLocalCover = Boolean(localCover)

    return [{
      ...page,
      _id: cleanString(page._id) || `${serviceSlug}-${areaSlug}-${index}`,
      serviceSlug,
      areaSlug,
      serviceName,
      areaName,
      monthlySearchVolume,
      metaDescription: cleanString(page.metaDescription),
      cardImage: localCover || cleanString(page.cardImage),
      cardImageAlt: usesLocalCover
        ? `${serviceName} in ${areaName}`
        : cleanString(page.cardImageAlt) || `${serviceName} in ${areaName}`,
      cardImageCaption: cleanString(page.cardImageCaption) || `${serviceName} in ${areaName}`,
    }]
  })
}
