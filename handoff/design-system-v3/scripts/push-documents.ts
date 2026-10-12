/**
 * Write data/v2-documents.json to Sanity.
 *
 *   pnpm content:push                     dry run: prints the target and the plan, writes nothing
 *   pnpm content:push --yes               writes every document as a DRAFT (nothing goes live)
 *   pnpm content:push --publish --yes     publishes, and removes the matching drafts
 *   add --only 302,305                    limit pages to these service IDs (settings and area always go too)
 *
 * Only v2* document types are ever written, so live service pages in the same dataset are untouched.
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'
import {loadLocalEnv, sanityTarget} from './lib/env'
import type {SanityDoc} from './lib/transform'

const args = process.argv.slice(2)
const publish = args.includes('--publish')
const confirmed = args.includes('--yes')
const onlyIndex = args.indexOf('--only')
const only = onlyIndex >= 0 ? new Set((args[onlyIndex + 1] || '').split(',').map((id) => id.trim()).filter(Boolean)) : null

type Ref = {_type: 'reference'; _ref: string; _weak?: boolean; _strengthenOnPublish?: {type: string}}

function asDraft(doc: SanityDoc): SanityDoc {
  const area = doc.area as Ref | undefined
  return {
    ...doc,
    _id: `drafts.${doc._id}`,
    // A draft may point at an area that is not published yet.
    ...(area ? {area: {...area, _weak: true, _strengthenOnPublish: {type: 'v2ServiceArea'}}} : {}),
  }
}

async function main() {
  loadLocalEnv()
  const target = sanityTarget()
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim()
  const file = path.resolve('data/v2-documents.json')
  if (!fs.existsSync(file)) throw new Error('Run pnpm content:extract and pnpm content:build first')
  const all = JSON.parse(fs.readFileSync(file, 'utf8')) as SanityDoc[]
  if (all.some((doc) => !doc._type.startsWith('v2'))) throw new Error('Refusing to write: a document without a v2 type was found')
  const documents = all.filter((doc) => doc._type !== 'v2ServicePage' || !only || only.has(String(doc.serviceId)))
  if (only && !documents.some((doc) => doc._type === 'v2ServicePage')) throw new Error(`No pages match --only ${[...only].join(',')}`)

  const client = createClient({...target, token, useCdn: false, perspective: 'raw'})
  const ids = documents.map((doc) => doc._id)
  const existing = await client.fetch<string[]>('*[_id in $ids || _id in $draftIds]._id', {ids, draftIds: ids.map((id) => `drafts.${id}`)})

  console.log(`Target: Sanity project ${target.projectId}, dataset ${target.dataset}`)
  console.log(`Mode: ${publish ? 'PUBLISH (pages go live on the V2 site)' : 'drafts only (nothing goes live)'}`)
  for (const doc of documents) {
    const id = publish ? doc._id : `drafts.${doc._id}`
    console.log(`  ${existing.includes(id) ? 'replace' : 'create '} ${id}${doc._type === 'v2ServicePage' ? `  /services/${(doc.slug as {current: string}).current}` : ''}`)
  }
  if (publish) for (const doc of documents) if (existing.includes(`drafts.${doc._id}`)) console.log(`  delete  drafts.${doc._id} (replaced by the published version)`)
  console.log(`${documents.length} document(s).`)

  if (!confirmed) {
    console.log('\nDry run: nothing was written. Add --yes to write.')
    return
  }
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is empty in .env.local')

  let transaction = client.transaction()
  for (const doc of documents) {
    transaction = transaction.createOrReplace(publish ? doc : asDraft(doc))
    if (publish && existing.includes(`drafts.${doc._id}`)) transaction = transaction.delete(`drafts.${doc._id}`)
  }
  const result = await transaction.commit()
  console.log(`\nCommitted transaction ${result.transactionId}.`)

  const written = await client.fetch<string[]>('*[_id in $ids]._id', {ids: documents.map((doc) => (publish ? doc._id : `drafts.${doc._id}`))})
  if (written.length !== documents.length) throw new Error(`Verification failed: expected ${documents.length} documents, found ${written.length}`)
  console.log(`Verified: ${written.length} document(s) present in ${target.projectId}/${target.dataset}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
