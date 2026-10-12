'use client'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {resolve} from './src/sanity/presentation'
import {schemaTypes} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

export default defineConfig({
  name: 'service-pages-v2',
  title: 'Highlights Chicago Service Pages (V2 template)',
  projectId: process.env.NEXT_SANITY_PROJECT_ID || 'not-configured',
  dataset: process.env.NEXT_SANITY_DATASET || 'production',
  basePath: '/services/studio',
  plugins: [
    structureTool({structure}),
    presentationTool({resolve, previewUrl: {previewMode: {enable: '/services/api/draft-mode/enable'}}}),
    visionTool(),
  ],
  schema: {types: schemaTypes},
})
