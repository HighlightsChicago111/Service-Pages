import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

type IndexItem = {_id: string; title: string; serviceSlug: string; areaSlug: string; serviceName: string; areaName: string; monthlySearchVolume?: number; metaDescription?: string}

export const revalidate = 60

export default async function HomePage() {
  const {data} = await sanityFetch({query: SERVICE_INDEX_QUERY, stega: false})
  const pages = (data || []) as IndexItem[]
  return (
    <main>
      <section className="index-hero"><div className="page-wrap"><p className="eyebrow">Highlights Chicago</p><h1>Chicago electrical service pages</h1><p className="lede narrow">Service-specific local landing pages powered by Sanity.</p></div></section>
      <div className="page-wrap">
        {!pages.length && <p className="setup-note">The Sanity dataset is connected but empty. Add the Viewer and Editor tokens to <code>.env.local</code>, then run <code>pnpm content:import</code>.</p>}
        <div className="service-index">{pages.map((page) => <Link href={`/services/${page.serviceSlug}/${page.areaSlug}`} key={page._id}><p className="eyebrow">{page.areaName}</p><h2>{page.serviceName}</h2><p>{page.metaDescription}</p>{page.monthlySearchVolume ? <strong>{page.monthlySearchVolume.toLocaleString()} monthly searches</strong> : null}</Link>)}</div>
      </div>
    </main>
  )
}
