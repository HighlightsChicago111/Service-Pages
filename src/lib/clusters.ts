import hierarchy from '../../data/cluster-hierarchy.json'

// Service groups for the /services/<cluster>/<service> hierarchy. Names, order
// and membership come from the cluster-level workbook; see the `source` field in
// data/cluster-hierarchy.json. A page published after the workbook joins its
// group through the cluster name stored on it in Sanity (parentName).
export type ServiceCluster = {
  slug: string
  /** Earlier URL slugs of this group; they redirect to /services/<slug> (next.config.ts). */
  formerSlugs?: string[]
  name: string
  /** Lower-case phrase used in sentences, e.g. "backup power". */
  noun: string
  description: string
  /** The Sanity cluster name (parentName) of the pages in this group. */
  parentName?: string
  /** Service slugs from the workbook, in display order. */
  services: string[]
}

const allClusters = hierarchy.clusters as ServiceCluster[]

/**
 * Whether service pages live at /services/<group>/<service> (true) or /services/<service>
 * (false). The live proxy forwards only one path segment under /services to Vercel, so
 * nested URLs 404 on www.highlightschicago.com until it forwards /services/*\/* as well.
 */
export const NESTED_SERVICE_URLS = hierarchy.nestedServiceUrls === true

/** Clusters that can hold a page; one with no listed service and no Sanity name is not published. */
export const serviceClusters = allClusters.filter((cluster) => cluster.services.length > 0 || cluster.parentName)

const clusterByService = new Map(serviceClusters.flatMap((cluster) => cluster.services.map((service) => [service, cluster] as const)))
const groupKey = (name: string) => name.trim().toLowerCase()
const clusterByParentName = new Map(serviceClusters.flatMap((cluster) => cluster.parentName ? [[groupKey(cluster.parentName), cluster] as const] : []))

export function findCluster(slug: string): ServiceCluster | undefined {
  return serviceClusters.find((cluster) => cluster.slug === slug)
}

/** The workbook's group for a listed service, otherwise the group named by the page's Sanity parentName. */
export function clusterForService(serviceSlug: string, parentName?: string | null): ServiceCluster | undefined {
  return clusterByService.get(serviceSlug) || (parentName ? clusterByParentName.get(groupKey(parentName)) : undefined)
}

export function clusterTitle(cluster: ServiceCluster): string {
  return `${cluster.noun.charAt(0).toUpperCase()}${cluster.noun.slice(1)} services in Chicago`
}

export function chooseServiceHeading(cluster: ServiceCluster): string {
  return `Choose ${/^[aeiou]/i.test(cluster.noun) ? 'an' : 'a'} ${cluster.noun} service`
}

export function formatServiceCount(count: number): string {
  return `${count} service${count === 1 ? '' : 's'}`
}
