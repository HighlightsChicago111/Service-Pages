import {defineConfig, globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', '.sanity/**', 'dist/**', 'out/**', 'coverage/**', 'node_modules/**', 'data/**', 'page_generator_tool/**', 'mmm/**']),
])
