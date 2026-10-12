import fs from 'node:fs/promises'
import path from 'node:path'
import {contentSource} from '@/sanity/env'
import {client, previewClient} from '@/sanity/lib/client'
import {V2_PAGE_QUERY, V2_ROUTES_QUERY} from '@/sanity/lib/queries'
import type {V2Area, V2Page, V2PageData, V2Settings} from '@/types/v2'

export type RouteCard = {slug: string; name: string; parentName?: string; description?: string; image?: string; imageAlt?: string; areaName?: string}

type LocalDoc = Record<string, unknown> & {_id: string; _type: string}
type Ref = {_ref?: string}

const LOCAL_FILE = path.join(process.cwd(), 'data', 'v2-documents.json')

async function localDocs(): Promise<LocalDoc[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as LocalDoc[]
  } catch {
    return []
  }
}

const slugOf = (doc: LocalDoc) => (doc.slug as {current?: string} | undefined)?.current || ''
const withResolved = <T extends {externalUrl?: string}>(images?: T[]) => images?.map((image) => ({...image, resolvedUrl: image.externalUrl}))

function localPage(doc: LocalDoc, docs: LocalDoc[]): {page: V2Page; area: V2Area | null} {
  const areaDoc = docs.find((item) => item._id === (doc.area as Ref | undefined)?._ref)
  const area = areaDoc
    ? {...areaDoc, slug: slugOf(areaDoc), subAreas: (areaDoc.subAreas as V2Area['subAreas'])?.map((sub) => ({...sub, photo: sub.photo && {...sub.photo, resolvedUrl: sub.photo.externalUrl}}))} as unknown as V2Area
    : null
  const page = {...doc, slug: slugOf(doc), gallery: withResolved(doc.gallery as V2Page['gallery']), workingPhotos: withResolved(doc.workingPhotos as V2Page['workingPhotos'])} as unknown as V2Page
  return {page, area}
}

/** Published pages; in preview (draft) mode, drafts as well. */
export async function getRoutes(draft = false): Promise<RouteCard[]> {
  if (contentSource === 'sanity') return (await (draft ? previewClient : client).fetch<RouteCard[]>(V2_ROUTES_QUERY)) || []
  return (await localDocs())
    .filter((doc) => doc._type === 'v2ServicePage')
    .sort((left, right) => Number(left.serviceId) - Number(right.serviceId))
    .map((doc) => ({
      slug: slugOf(doc),
      name: String(doc.name),
      parentName: doc.parentName as string | undefined,
      description: (doc.seo as {description?: string} | undefined)?.description,
      image: (doc.gallery as Array<{externalUrl?: string}> | undefined)?.[0]?.externalUrl,
      imageAlt: (doc.gallery as Array<{alt?: string}> | undefined)?.[0]?.alt,
      areaName: 'Chicago',
    }))
}

export async function getPageData(slug: string, draft = false): Promise<V2PageData> {
  if (contentSource === 'sanity') {
    const result = await (draft ? previewClient : client).fetch<{page: (V2Page & {area: V2Area | null}) | null; settings: V2Settings | null; routes: V2PageData['routes']}>(V2_PAGE_QUERY, {slug})
    const {area = null, ...page} = result.page || ({} as V2Page & {area: V2Area | null})
    return {page: result.page ? page : null, area, settings: result.settings, routes: result.routes || []}
  }
  const docs = await localDocs()
  const doc = docs.find((item) => item._type === 'v2ServicePage' && slugOf(item) === slug)
  const settings = (docs.find((item) => item._type === 'v2SiteSettings') as unknown as V2Settings) || null
  const routes = docs.filter((item) => item._type === 'v2ServicePage').map((item) => ({slug: slugOf(item), name: String(item.name), parentName: item.parentName as string | undefined}))
  if (!doc) return {page: null, area: null, settings, routes}
  return {...localPage(doc, docs), settings, routes}
}
