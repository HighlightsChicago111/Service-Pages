import hierarchy from '../../data/cluster-hierarchy.json'
import {SERVICES_PATH} from './service-urls'

// Service clusters from the content plan (cluster -> parent -> hub listicle
// title -> live service pages). Generated from the cluster-level workbook; see
// the `source` field in data/cluster-hierarchy.json.
export type ClusterKeyword = {keyword: string; volume: number}

export type ClusterService = {
  serviceId: number
  slug: string
  planService: string
  volume: number
}

export type ServiceCluster = {
  number: number
  name: string
  slug: string
  parent: string
  parentName: string
  hub: {
    id: number
    title: string
    keywordCount: number
    volume: number
    kd: number
    cpc: number
    primaryKeywords: ClusterKeyword[]
    secondaryKeywords: ClusterKeyword[]
  }
  services: ClusterService[]
}

export const CLUSTERS_PATH = `${SERVICES_PATH}/clusters`

export const serviceClusters = hierarchy.clusters as ServiceCluster[]

export function findCluster(slug: string): ServiceCluster | undefined {
  return serviceClusters.find((cluster) => cluster.slug === slug)
}

// Base-relative hrefs for next/link; basePath adds /services.
export const clusterHref = {
  index: () => '/clusters',
  parent: (cluster: ServiceCluster) => `/clusters/${cluster.slug}`,
  hub: (cluster: ServiceCluster) => `/clusters/${cluster.slug}/hub`,
  services: (cluster: ServiceCluster) => `/clusters/${cluster.slug}/hub/services`,
}
