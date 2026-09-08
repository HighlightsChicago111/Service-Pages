import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

type Document = Record<string, unknown> & {_id: string; _type: string; serviceId?: number}

function loadLocalEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadLocalEnv()
const projectId = process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5w5623jq'
const dataset = process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
const client = createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false, perspective: 'raw'})

const systemFields = new Set(['_id', '_rev', '_createdAt', '_updatedAt'])
const kind = (value: unknown) => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
const publicId = (id: string) => id.replace(/^drafts\./, '')

function walk(value: unknown, currentPath: string, visitor: (path: string, value: unknown) => void) {
  visitor(currentPath, value)
  if (Array.isArray(value)) value.forEach((item) => walk(item, `${currentPath}[]`, visitor))
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (!systemFields.has(key) && key !== '_key' && key !== '_type') walk(child, currentPath ? `${currentPath}.${key}` : key, visitor)
    }
  }
}

function consensusTypes(documents: Document[]) {
  const counts = new Map<string, Map<string, number>>()
  for (const document of documents) walk(document, '', (fieldPath, value) => {
    if (!fieldPath) return
    const types = counts.get(fieldPath) || new Map<string, number>()
    types.set(kind(value), (types.get(kind(value)) || 0) + 1)
    counts.set(fieldPath, types)
  })
  return new Map([...counts].map(([fieldPath, types]) => [fieldPath, [...types].sort((a, b) => b[1] - a[1])[0][0]]))
}

function pathsIn(document: Document) {
  const paths = new Set<string>()
  walk(document, '', (fieldPath) => {
    if (fieldPath) paths.add(fieldPath)
  })
  return paths
}

function auditAgainstPublished(drafts: Document[], published: Document[]) {
  const expected = consensusTypes(published)
  const expectedPresence = new Map<string, number>()
  for (const document of published) {
    for (const fieldPath of pathsIn(document)) expectedPresence.set(fieldPath, (expectedPresence.get(fieldPath) || 0) + 1)
  }
  const standardPaths = [...expectedPresence]
    .filter(([fieldPath, count]) => !fieldPath.endsWith('[]') && count >= Math.ceil(published.length * 0.9))
    .map(([fieldPath]) => fieldPath)
  const issues: string[] = []
  for (const document of drafts) {
    const draftPaths = pathsIn(document)
    for (const fieldPath of standardPaths) {
      if (!draftPaths.has(fieldPath)) issues.push(`${document._id}: missing ${fieldPath}, present on at least 90% of published pages`)
    }
    walk(document, '', (fieldPath, value) => {
      if (!fieldPath) return
      const expectedType = expected.get(fieldPath)
      if (expectedType && expectedType !== kind(value)) issues.push(`${document._id}: ${fieldPath} is ${kind(value)}, published pages use ${expectedType}`)
      if (fieldPath.endsWith('externalUrl') && typeof value === 'string' && !/^https?:\/\//i.test(value)) {
        issues.push(`${document._id}: ${fieldPath} must be absolute for compatibility with the deployed Studio schema`)
      }
      if (fieldPath.endsWith('._ref') && typeof value === 'string' && value.startsWith('drafts.')) {
        issues.push(`${document._id}: ${fieldPath} points directly to a draft ID`)
      }
    })
    if (document._type === 'servicePage') {
      const seo = document.seo as Record<string, unknown> | undefined
      if (typeof seo?.title === 'string' && seo.title.length > 65) issues.push(`${document._id}: seo.title is ${seo.title.length} characters (max 65)`)
      if (typeof seo?.description === 'string' && seo.description.length > 170) issues.push(`${document._id}: seo.description is ${seo.description.length} characters (max 170)`)
      for (const field of ['reviews', 'gallery', 'workingPhotos', 'guides']) {
        if (!Array.isArray(document[field]) || document[field].length === 0) issues.push(`${document._id}: ${field} is empty or has the wrong type`)
      }
      const gallery = document.gallery as Array<{image?: {asset?: {_ref?: string}}}> | undefined
      if (!gallery?.[0]?.image?.asset?._ref) issues.push(`${document._id}: first gallery image is not backed by a Sanity image asset`)
    }
  }
  return issues
}

async function main() {
  const published = await client.fetch<Document[]>(`*[
    !(_id in path("drafts.**")) && serviceId >= 301 && serviceId <= 330 && _type in ["serviceDefinition", "servicePage"]
  ]`)
  const draftIds = Array.from({length: 10}, (_, index) => 331 + index)
  const publishedUpcoming = await client.fetch<Document[]>(`*[
    !(_id in path("drafts.**")) && serviceId in $draftIds && _type in ["serviceDefinition", "servicePage"]
  ]`, {draftIds})
  const draftPageIds = draftIds.map((serviceId) => `drafts.servicePage-${serviceId}-chicago`)
  const draftPageResults = await client.getDocuments(draftPageIds)
  const draftPages = draftPageResults
    .filter((document): document is NonNullable<(typeof draftPageResults)[number]> => document !== null)
    .map((document) => document as Document)
  const publishedServices = published.filter((document) => document._type === 'serviceDefinition')
  const publishedPages = published.filter((document) => document._type === 'servicePage')
  const upcomingServices = publishedUpcoming.filter((document) => document._type === 'serviceDefinition')
  const documentsToAudit = [...upcomingServices, ...draftPages]
  const issues = [
    ...auditAgainstPublished(upcomingServices, publishedServices),
    ...auditAgainstPublished(draftPages, publishedPages),
  ]
  const publishedUpcomingIds = new Set(publishedUpcoming.map((document) => document._id))
  for (const page of draftPages) {
    const reference = page.service as {_ref?: string; _weak?: boolean} | undefined
    if (!reference?._ref || !publishedUpcomingIds.has(reference._ref)) {
      issues.push(`${page._id}: service reference has no published target`)
    } else if (reference._weak) {
      issues.push(`${page._id}: service reference is weak; published pages use a strong reference`)
    }
  }
  const refs = new Set<string>()
  for (const document of documentsToAudit) walk(document, '', (fieldPath, value) => {
    if (fieldPath.endsWith('._ref') && typeof value === 'string') refs.add(publicId(value))
  })
  const refIds = [...refs]
  const resolved = await client.fetch<string[]>(`*[_id in $refIds || _id in $draftRefIds]._id`, {
    refIds,
    draftRefIds: refIds.map((id) => `drafts.${id}`),
  })
  const resolvedPublicIds = new Set(resolved.map(publicId))
  for (const ref of refIds) if (!resolvedPublicIds.has(ref)) issues.push(`Unresolved reference: ${ref}`)

  const topLevelShape = (documents: Document[]) => [...new Set(documents.flatMap((document) => Object.keys(document).filter((key) => !systemFields.has(key))))].sort()
  console.log(JSON.stringify({
    compared: {
      publishedServices: publishedServices.length,
      publishedPages: publishedPages.length,
      upcomingServiceDefinitions: upcomingServices.length,
      draftPages: draftPages.length,
      publishedUpcomingServiceDefinitions: publishedUpcoming.filter((document) => document._type === 'serviceDefinition').length,
      publishedUpcomingPages: publishedUpcoming.filter((document) => document._type === 'servicePage').length,
    },
    publishedShapes: {serviceDefinition: topLevelShape(publishedServices), servicePage: topLevelShape(publishedPages)},
    issueCount: issues.length,
    issues,
  }, null, 2))
  if (upcomingServices.length !== 10 || draftPages.length !== 10 || issues.length) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
