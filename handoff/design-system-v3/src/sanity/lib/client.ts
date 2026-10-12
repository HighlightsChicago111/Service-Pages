import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId, readToken} from '@/sanity/env'

export const client = createClient({
  projectId: projectId || 'not-configured',
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})

/** Draft-aware client for preview mode. Needs the Viewer read token. */
export const previewClient = client.withConfig({useCdn: false, token: readToken, perspective: 'drafts'})
