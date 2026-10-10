/* eslint-disable @next/next/no-img-element -- Card covers can be local or Sanity-managed URLs and must remain crawlable, as on the collection page. */
import Link from 'next/link'
import {CollectionFooter, CollectionHeader} from './collection-chrome'
import {prepareCollectionItems, type CollectionItem, type PreparedCollectionItem} from '@/lib/collection-items'
import {chooseServiceHeading, clusterTitle, formatServiceCount, serviceClusters, type ServiceCluster} from '@/lib/clusters'
import {PUBLIC_SITE_ORIGIN, serviceRoutePath} from '@/lib/service-urls'

export type ServiceCards = Map<string, PreparedCollectionItem>

/** Published service cards keyed by service slug, prepared exactly as the collection page prepares them. */
export function serviceCardsBySlug(pages: CollectionItem[]): ServiceCards {
  return new Map(prepareCollectionItems(pages).map((page) => [page.serviceSlug, page]))
}

/** The cluster's live services that are published in Sanity, in cluster order. */
export function publishedServices(cluster: ServiceCluster, cards: ServiceCards): PreparedCollectionItem[] {
  return cluster.services.map((slug) => cards.get(slug)).filter((card): card is PreparedCollectionItem => Boolean(card))
}

type CardProps = {
  href: string
  label: string
  title: string
  description?: string
  footer?: string
  image?: {src?: string; alt: string}
}

/** A service or service-group block, using the collection card markup. */
export function ServiceBlock({href, label, title, description, footer, image}: CardProps) {
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
        {footer && <span className="collection-card-volume">{footer}</span>}
      </span>
    </Link>
  )
}

/** "Choose a service" section on /services: one block per service group. */
export function ClusterDirectory({cards}: {cards: ServiceCards}) {
  const groups = serviceClusters
    .map((cluster) => ({cluster, services: publishedServices(cluster, cards)}))
    .filter((group) => group.services.length > 0)
  return (
    <section className="collection-directory" aria-labelledby="service-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Our services</p>
            <h2 id="service-directory-title">Choose a service</h2>
          </div>
          <p>Pick the kind of electrical work you need to see every service we provide for it across Chicago.</p>
        </div>
        <div className="collection-card-grid">
          {groups.map(({cluster, services}) => {
            const cover = services.find((service) => service.cardImage)
            return (
              <ServiceBlock
                key={cluster.slug}
                href={`/${cluster.slug}`}
                label={formatServiceCount(services.length)}
                title={cluster.name}
                description={cluster.description}
                footer="Explore services"
                image={cover ? {src: cover.cardImage, alt: `${cluster.name} services by Highlights Chicago`} : undefined}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** /services/<cluster>: the group's services, linking to their service pages. */
export function ClusterPage({cluster, cards}: {cluster: ServiceCluster; cards: ServiceCards}) {
  const services = publishedServices(cluster, cards)
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
                <li aria-current="page">{cluster.name}</li>
              </ol>
            </nav>
          </div>
          <div className="collection-wrap collection-hero-grid">
            <div>
              <p className="collection-hero-kicker">Licensed Chicago electricians</p>
              <h1>{clusterTitle(cluster)}</h1>
              <p>{cluster.description} Choose a service to see pricing, reviews, coverage and answers to common questions.</p>
            </div>
            <div className="collection-hero-panel">
              <span>{cluster.name}</span>
              <strong>{services.length}</strong>
              <p>{services.length === 1 ? 'Service' : 'Services'} in Chicago</p>
              <a href="tel:7732623333">Talk with an electrician <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <section className="collection-directory" aria-labelledby="cluster-services-title">
          <div className="collection-wrap">
            <div className="collection-directory-heading">
              <div>
                <p className="collection-kicker">Services in this category</p>
                <h2 id="cluster-services-title">{chooseServiceHeading(cluster)}</h2>
              </div>
              <p>Each service page covers the work, what drives the cost, permits, reviews and the Chicago areas we serve.</p>
            </div>
            <div className="collection-card-grid">
              {services.map((service) => (
                <ServiceBlock
                  key={service.serviceSlug}
                  href={serviceRoutePath(service.serviceSlug)}
                  label={service.areaName}
                  title={service.serviceName}
                  description={service.metaDescription}
                  image={{src: service.cardImage, alt: service.cardImageAlt}}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <CollectionFooter />
    </div>
  )
}
