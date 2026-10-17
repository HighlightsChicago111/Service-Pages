/* eslint-disable @next/next/no-img-element -- Card photos from /public. */
import {Eyebrow, IconTile} from '../atoms'
import {Icon, pickIcon} from '../icon'
import {focus, relatedCardPhoto} from '@/lib/v3/visuals'
import {questionHeading} from '@/lib/headings'
import {SERVICES_PATH, servicePagePath} from '@/lib/service-urls'
import type {BlockContext} from '../types'

export const hasRelated = ({page}: BlockContext) => Boolean(page.otherServices?.featured?.title || page.otherServices?.items?.length)

/** Sanity stores flat links (/services/<slug>); a live page's link goes straight to its group URL instead of redirecting. */
function serviceHref(url: string, routes: BlockContext['routes']) {
  const slug = url.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() || ''
  const route = routes.find((item) => item.slug === slug)
  return route ? servicePagePath(route.slug, route.parentName) : url
}

/** D13 Related services: tall main-category card + 2×2 service cards. */
export function RelatedBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, visuals, routes} = ctx
  const featured = page.otherServices?.featured
  const services = (page.otherServices?.items || []).slice(0, 4)
  const category = visuals.category

  return (
    <div className="ds-wrap">
      <div className="ds-head"><div className="ds-head-main"><Eyebrow>More from Highlights Chicago</Eyebrow><h2 className="ds-h2" id="other-services-title">{questionHeading(`Our other services in ${area.name}`)}</h2></div></div>
      <div className="ds-related">
        {featured?.title && <article className="ds-category-card">
          {category && <img className="ds-category-bg" src={category.src} alt={category.alt} loading="lazy" decoding="async" style={focus(category)} />}
          <div className="ds-category-scrim" aria-hidden="true" />
          {category?.illustrative && <span className="ds-pill-caption ds-category-pill">Illustrative photo</span>}
          <div className="ds-category-body">
            {featured.tag && <p className="ds-glass-chip"><i aria-hidden="true" />{featured.tag}</p>}
            <h3 className="ds-h3">{featured.title}</h3>
            {featured.description && <p>{featured.description}</p>}
            <a className="ds-btn ds-btn--light" href={SERVICES_PATH}><span>View all services</span><Icon name="arrowRight" size={18} /></a>
          </div>
        </article>}
        <ul className="ds-service-cards">
          {services.map((service) => {
            const photo = relatedCardPhoto(service)
            return (
              <li className="ds-service-card" key={service._key || service.url}>
                {photo ? <img className="ds-service-media" src={photo.src} alt={photo.alt} loading="lazy" decoding="async" style={focus(photo)} /> : <IconTile icon={pickIcon(service.name, 'zap')} className="ds-service-media" />}
                <div className="ds-service-body">
                  <h3 className="ds-h6">{service.name}</h3>
                  {service.description && <p>{service.description}</p>}
                  <a className="ds-ghost ds-ghost--caps" href={serviceHref(service.url, routes)}><span>View service</span><Icon name="arrowRight" size={16} /></a>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
