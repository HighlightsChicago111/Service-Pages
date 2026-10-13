// Push a QC-passed New-design page (vault W/pages-v2/<slug>.json) to Sanity as a DRAFT.
//
//   node scripts/push-v2-draft.mjs <vault>/clients/highlights-chicago/deliverables/service-pages/pages-v2/<slug>.json [--replace]
//
// Refuses unless W/build/qc-v2/<slug>/receipt.json is LAUNCH or GO for this exact file (sp_v2.py gate).
// Uploads real Yelp photos ({"yelp": id}) and vault logos ({"vaultLogo": key}) and sets each photo's
// registered credit. Writes drafts.<id> only; never publishes. --replace overwrites an existing draft.
import {createHash} from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

const [file, flag] = process.argv.slice(2)
if (!file) throw new Error('usage: node scripts/push-v2-draft.mjs <pages-v2/<slug>.json> [--replace]')
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]))
const token = env.SANITY_API_WRITE_TOKEN || env.SANITY_AUTH_TOKEN
if (!token) throw new Error('No SANITY_API_WRITE_TOKEN in .env.local')

const W = path.resolve(path.dirname(file), '..')
const slug = path.basename(file, '.json')
const raw = fs.readFileSync(file)
const receiptPath = path.join(W, 'build', 'qc-v2', slug, 'receipt.json')
if (!fs.existsSync(receiptPath)) throw new Error(`BLOCKED: no QC receipt for ${slug}. Run sp_v2.py check + judge + gate first.`)
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
const sha = createHash('sha256').update(raw).digest('hex')
if (receipt.page_sha256 !== sha) throw new Error(`BLOCKED: ${slug} changed after its last QC check.`)
if (!['LAUNCH', 'GO'].includes(receipt.verdict) || receipt.judgment_carried) throw new Error(`BLOCKED: ${slug} verdict is ${receipt.verdict}${receipt.judgment_carried ? ' (judgment carried)' : ''}.`)

const profile = JSON.parse(fs.readFileSync(path.join(W, 'profile.json'), 'utf8'))
const assets = profile.assets
const client = createClient({
  projectId: env.NEXT_SANITY_PROJECT_ID || env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5w5623jq',
  dataset: env.NEXT_SANITY_DATASET || env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-03-01', useCdn: false, token,
})
async function upload(localPath) {
  const name = path.basename(localPath)
  const found = await client.fetch('*[_type=="sanity.imageAsset" && originalFilename==$name][0]._id', {name})
  return found || (await client.assets.upload('image', fs.createReadStream(localPath), {filename: name}))._id
}
const ref = (id) => ({_type: 'image', asset: {_type: 'reference', _ref: id}})

async function resolve(v) {
  if (Array.isArray(v)) return Promise.all(v.map(resolve))
  if (!v || typeof v !== 'object') return v
  if (v._type === 'v2Image' && v.yelp) {
    const asset = Object.values(assets).find((a) => a.yelp_id === v.yelp)
    if (!asset || asset.do_not_use) throw new Error(`Yelp photo ${v.yelp} is not usable`)
    const {yelp, ...rest} = v
    return {...rest, image: ref(await upload(path.resolve(W, asset.file))), credit: asset.credit}
  }
  if (v._type === 'v2Image' && v.vaultLogo) {
    const asset = assets[v.vaultLogo]
    if (!asset || asset.kind !== 'logo') throw new Error(`Logo ${v.vaultLogo} is not registered`)
    const {vaultLogo, ...rest} = v
    return {...rest, image: ref(await upload(path.resolve(W, asset.file)))}
  }
  return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await resolve(x)])))
}

const page = JSON.parse(raw.toString('utf8'))
const id = page._id?.startsWith('drafts.') ? page._id : `drafts.v2-page-${page.serviceId}`
const existing = await client.fetch('*[_id in [$id, $pub]]{_id}', {id, pub: id.replace(/^drafts\./, '')})
if (existing.some((d) => d._id === id) && flag !== '--replace') throw new Error(`${id} already exists. Re-run with --replace to overwrite that draft.`)
const doc = await resolve({...page, _id: id})
const res = await client.createOrReplace(doc)
console.log(`DRAFT written: ${res._id} (${slug}, ${receipt.verdict} ${receipt.score}). Not published.`)
