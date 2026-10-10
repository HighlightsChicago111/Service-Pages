/* eslint-disable @next/next/no-img-element -- Card covers can be local or Sanity-managed URLs and must remain crawlable, as on the collection page. */
import type {ReactNode} from 'react'
import Link from 'next/link'
import {CollectionFooter, CollectionHeader} from './collection-chrome'
import {prepareCollectionItems, type CollectionItem, type PreparedCollectionItem} from '@/lib/collection-items'
import {clusterHref, type ServiceCluster} from '@/lib/clusters'
import {PUBLIC_SITE_ORIGIN} from '@/lib/service-urls'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

/** Published service cards keyed by service slug, prepared exactly as the collection page does. */
export async function loadServiceCards(): Promise<Map<string, PreparedCollectionItem>> {
  const pages = (await metadataClient.fetch<CollectionItem[]>(SERVICE_INDEX_QUERY)) || []
  return new Map(prepareCollectionItems(pages).map((page) => [page.serviceSlug, page]))
}

export function clusterCover(cluster: ServiceCluster, cards: Map<string, PreparedCollectionItem>) {
  const card = cluster.services.map((service) => cards.get(service.slug)).find((item) => item?.cardImage)
  return card ? {src: card.cardImage, alt: card.cardImageAlt} : undefined
}

type Crumb = {label: string; href?: string}

const STEP_LABELS = ['Clusters', 'Parent cluster', 'Hub article', 'Services'] as const

function stepHrefs(cluster?: ServiceCluster) {
  return [clusterHref.index(), cluster && clusterHref.parent(cluster), cluster && clusterHref.hub(cluster), cluster && clusterHref.services(cluster)]
}

type PageProps = {
  level: 0 | 1 | 2 | 3
  cluster?: ServiceCluster
  crumbs: Crumb[]
  kicker: string
  title: string
  lede: string
  stat: {label: string; value: string; caption: string}
  sectionKicker: string
  sectionTitle: string
  sectionIntro: string
  children: ReactNode
}

/** Shared layout for every level of the cluster hierarchy, built from the collection page design. */
export function ClusterHierarchyPage(props: PageProps) {
  const hrefs = stepHrefs(props.cluster)
  return (
    <div className="collection-page">
      <CollectionHeader />
      <main>
        <section className="collection-hero">
          <div className="collection-wrap">
            <nav className="hierarchy-crumbs" aria-label="Breadcrumb">
              <ol>
                <li><a href={PUBLIC_SITE_ORIGIN}>Home</a></li>
                <li><Link href="/">Services</Link></li>
                {props.crumbs.map((crumb) => (
                  <li key={crumb.label} aria-current={crumb.href ? undefined : 'page'}>
                    {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="collection-wrap collection-hero-grid">
            <div>
              <p className="collection-hero-kicker">{props.kicker}</p>
              <h1>{props.title}</h1>
              <p>{props.lede}</p>
            </div>
            <div className="collection-hero-panel">
              <span>{props.stat.label}</span>
              <strong>{props.stat.value}</strong>
              <p>{props.stat.caption}</p>
              <a href="tel:7732623333">Talk with an electrician <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <section className="collection-directory" aria-labelledby="hierarchy-section-title">
          <div className="collection-wrap">
            <ol className="hierarchy-steps" aria-label="Service hierarchy">
              {STEP_LABELS.map((label, index) => {
                const href = hrefs[index]
                const done = index < props.level
                return (
                  <li key={label} className={done ? 'done' : undefined} aria-current={index === props.level ? 'step' : undefined}>
                    {done && href ? <Link href={href}>{label}</Link> : label}
                  </li>
                )
              })}
            </ol>
            <div className="collection-directory-heading">
              <div>
                <p className="collection-kicker">{props.sectionKicker}</p>
                <h2 id="hierarchy-section-title">{props.sectionTitle}</h2>
              </div>
              <p>{props.sectionIntro}</p>
            </div>
            {props.children}
          </div>
        </section>
      </main>
      <CollectionFooter />
    </div>
  )
}

type CardProps = {
  href: string
  label: string
  title: string
  description?: string
  meta?: string
  image?: {src?: string; alt: string}
}

/** One block in the hierarchy, using the collection card markup so it matches the service directory. */
export function HierarchyCard({href, label, title, description, meta, image}: CardProps) {
  return (
    <Link className="collection-card" data-card-image={image?.src} href={href}>
      <span className={`collection-card-media${image?.src ? '' : ' collection-card-media-empty'}`}>
        {image?.src && <img className="collection-card-image" src={image.src} alt={image.alt} loading="lazy" decoding="async" />}
        {!image?.src && <span aria-hidden="true">HC</span>}
      </span>
      <span className="collection-card-arrow" aria-hidden="true">→</span>
      <span className="collection-card-content">
        <span className="collection-card-area">{label}</span>
        <strong>{title}</strong>
        {description && <span className="collection-card-description">{description}</span>}
        {meta && <span className="collection-card-volume">{meta}</span>}
      </span>
    </Link>
  )
}

export function formatCount(value: number, noun: string) {
  return `${value.toLocaleString('en-US')} ${noun}${value === 1 ? '' : 's'}`
}
