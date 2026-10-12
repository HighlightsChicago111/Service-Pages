import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {previewClient} from '@/sanity/lib/client'

export const {GET} = defineEnableDraftMode({client: previewClient})
