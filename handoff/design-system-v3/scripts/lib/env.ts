import fs from 'node:fs'
import path from 'node:path'

/** Load .env.local into process.env for the CLI scripts (Next.js does this for the app). */
export function loadLocalEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (value && !process.env[key]) process.env[key] = value
  }
}

export function sanityTarget() {
  loadLocalEnv()
  const projectId = process.env.NEXT_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_SANITY_DATASET?.trim() || 'production'
  if (!projectId) throw new Error('NEXT_SANITY_PROJECT_ID is empty in .env.local')
  return {projectId, dataset, apiVersion: process.env.NEXT_SANITY_API_VERSION?.trim() || '2026-03-01'}
}
