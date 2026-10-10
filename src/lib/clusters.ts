import hierarchy from '../../data/cluster-hierarchy.json'

// Service groups for the /services/<cluster>/<service> hierarchy. Names, order
// and membership come from the cluster-level workbook; see the `source` field in
// data/cluster-hierarchy.json.
export type ServiceCluster = {
  slug: string
  name: string
  /** Lower-case phrase used in sentences, e.g. "backup power". */
  noun: string
  description: string
  /** Live service slugs, in display order. */
  services: string[]
}

const allClusters = hierarchy.clusters as ServiceCluster[]

/** Clusters that have at least one live service; empty clusters are not published. */
export const serviceClusters = allClusters.filter((cluster) => cluster.services.length > 0)

const clusterByService = new Map(serviceClusters.flatMap((cluster) => cluster.services.map((service) => [service, cluster] as const)))

export function findCluster(slug: string): ServiceCluster | undefined {
  return serviceClusters.find((cluster) => cluster.slug === slug)
}

export function clusterForService(serviceSlug: string): ServiceCluster | undefined {
  return clusterByService.get(serviceSlug)
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
