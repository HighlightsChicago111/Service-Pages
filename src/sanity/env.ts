function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function usableSecret(value: string | undefined): string | undefined {
  if (!value || /^(PASTE_|your_)/i.test(value)) return undefined
  return value
}

export const projectId = required(process.env.NEXT_SANITY_PROJECT_ID, 'NEXT_SANITY_PROJECT_ID')
export const dataset = required(process.env.NEXT_SANITY_DATASET, 'NEXT_SANITY_DATASET')
export const apiVersion = process.env.NEXT_SANITY_API_VERSION || '2026-03-01'
export const studioUrl = process.env.NEXT_SANITY_STUDIO_URL || '/studio'
export const siteUrl = process.env.NEXT_SITE_URL || 'http://localhost:3000'
export const readToken = usableSecret(process.env.SANITY_API_READ_TOKEN)
