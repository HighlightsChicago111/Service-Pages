import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_PAGE_METADATA_QUERY, SERVICE_PAGE_QUERY} from '@/sanity/lib/queries'
import type {ServicePageData} from '@/types/content'

type Props = {params: Promise<{serviceSlug: string; areaSlug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const resolved = await params
  const metadata = await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, resolved)
  if (!metadata) return {}
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {canonical: metadata.canonicalUrl},
  }
}

export default async function ServicePage({params}: Props) {
  const resolved = await params
  const {data} = await sanityFetch({query: SERVICE_PAGE_QUERY, params: resolved})
  const typed = data as ServicePageData
  if (!typed.page || !typed.settings) notFound()
  return <ServiceLandingPage data={typed} />
}
