import type {V2Area, V2Page, V2PageData, V2Settings} from '@/types/v2'
import type {ResolvedVisuals} from '@/lib/v3/visuals'

/** Everything a block needs, resolved once per request by the page template. */
export type BlockContext = {
  page: V2Page
  area: V2Area
  settings: V2Settings
  visuals: ResolvedVisuals
  routes: V2PageData['routes']
  /** Show "[CONFIRM: …]" chips: development and draft preview only (playbook F.5). */
  editorial: boolean
  /** Words from the page's own copy, used to repair glued workbook text. */
  vocab: Set<string>
  tel: string
  phone: string
}

/** Section surface. Light bands alternate white/grey automatically; navy and photo are fixed. */
export type Band = 'white' | 'grey' | 'navy' | 'photo'
