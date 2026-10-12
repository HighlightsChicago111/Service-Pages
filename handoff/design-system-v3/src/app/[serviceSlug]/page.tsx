import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {ServiceLandingPage} from '@/components/v3/service-page'
import {getPageData, getRoutes} from '@/lib/content'
import {servicePageUrl} from '@/lib/service-urls'

type Props = {params: Promise<{serviceSlug: string}>}

export const revalidate = 60

export async function generateStaticParams() {
  return (await getRoutes()).map((route) => ({serviceSlug: route.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {serviceSlug} = await params
  const {page, area} = await getPageData(serviceSlug, (await draftMode()).isEnabled)
  if (!page) return {}
  return {
    title: page.seo?.title || `${page.name} in ${area?.name || 'Chicago'}`,
    description: page.seo?.description,
    alternates: {canonical: servicePageUrl(page.slug)},
    // Test collection: keep it out of search until it replaces the live template.
    robots: {index: false, follow: false},
  }
}

export default async function ServicePage({params}: Props) {
  const {serviceSlug} = await params
  const draft = (await draftMode()).isEnabled
  const data = await getPageData(serviceSlug, draft)
  if (!data.page || !data.area || !data.settings) notFound()
  return <>{draft && <DisableDraftMode />}<ServiceLandingPage data={data} draft={draft} /></>
}
