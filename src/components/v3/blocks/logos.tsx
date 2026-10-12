/* eslint-disable @next/next/no-img-element -- Official logo files (SVG/PNG) from /public. */
import {IconBadge, SectionHead} from '../atoms'
import {SERVICES_PATH} from '@/lib/service-urls'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasLogos = ({page}: BlockContext) => Boolean(page.brands?.items?.length)

const slug = (brand: string) => brand.normalize('NFKD').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Official files from the handoff (provenance in its _logo-manifest.json). */
const OFFICIAL: Record<string, string> = {
  enphase: 'logo-enphase.svg',
  solaredge: 'logo-solaredge.svg',
  tesla: 'logo-tesla.svg',
  lg: 'logo-lg.svg',
  qcells: 'logo-qcells.svg',
  'canadian-solar': 'logo-canadian-solar.png',
  sma: 'logo-sma.svg',
  fronius: 'logo-fronius.png',
  'square-d': 'logo-square-d.svg',
  siemens: 'logo-siemens.svg',
}

export function brandLogoSrc(brand: string) {
  const key = slug(brand)
  return OFFICIAL[key] ? `${SERVICES_PATH}/images/v3/logos/${OFFICIAL[key]}` : `${SERVICES_PATH}/images/brands/${key}.png`
}

export function LogoTile({brand, compact}: {brand: string; compact?: boolean}) {
  return <li className={compact ? 'ds-logo-tile ds-logo-tile--compact' : 'ds-logo-tile'}><img src={brandLogoSrc(brand)} alt={`${brand} logo`} loading="lazy" decoding="async" /></li>
}

/** D6 Logo wall: official full-colour logos on white tiles, a big blue count. */
export function LogosBlock({ctx}: {ctx: BlockContext}) {
  const {page, area} = ctx
  const brands = page.brands || {}
  const items = brands.items || []
  return (
    <div className="ds-wrap">
      <SectionHead
        eyebrow="Equipment brands"
        id="brands-title"
        title={questionHeading(`${brands.heading} in ${area.name}`)}
        lede={brands.lede}
        aside={<p className="ds-big-count"><b>{items.length}</b> <span>Brands</span></p>}
      />
      <ul className="ds-logo-wall">{items.map((brand) => <LogoTile brand={brand} key={brand} />)}</ul>
      {brands.note && <div className="ds-note-row"><div className="ds-note-row-main"><IconBadge icon="wrench" tone="green" size={44} /><p>{brands.note}</p></div></div>}
    </div>
  )
}
