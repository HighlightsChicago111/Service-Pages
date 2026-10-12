import type {Guide, V2Settings} from '@/types/v2'
import type {IconName} from '@/components/v3/icon'

const CONFIRM = /\[CONFIRM:[^\]]*\]/g

/** Approved copy with its "[CONFIRM: …]" editorial flags pulled out (playbook F.5). */
export type Editorial = {text: string; notes: string[]}

export function splitConfirm(value?: string): Editorial {
  if (!value) return {text: '', notes: []}
  const notes = value.match(CONFIRM) || []
  const text = value.replace(CONFIRM, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim()
  return {text, notes}
}

export const hasConfirm = (value?: string) => Boolean(value && /\[CONFIRM:[^\]]*\]/.test(value))

/** Split prose into sentences, keeping punctuation. */
export function sentences(value: string): string[] {
  return value.split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9])/).map((part) => part.trim()).filter(Boolean)
}

/** Text after "…: a, b, or c." as separate items, for chips that restate a list in the copy. */
export function listAfterColon(value: string, max = 4): string[] {
  const match = value.match(/:\s*([^:.]+(?:,[^:.]+)+)\./)
  if (!match) return []
  const items = match[1]
    .split(/,\s*(?:or\s+|and\s+)?/)
    .map((item) => item.replace(/^(?:or|and)\s+(?:just\s+)?/i, '').replace(/^(?:the|a|an|just the|just)\s+/i, '').trim())
    .filter(Boolean)
  return items.length >= 2 ? items.slice(0, max).map((item) => item[0].toUpperCase() + item.slice(1)) : []
}

/** Strip a leading "Illustrative photo of" so a caption reads as a label. */
export function photoLabel(caption?: string): string {
  const label = (caption || '').replace(/^illustrative photos? of\s*/i, '').trim()
  return label ? label[0].toUpperCase() + label.slice(1) : ''
}

export const isIllustrative = (value?: string) => /illustrative/i.test(value || '')

/* ------------------------------------------------------------------------ */
/* Glued text: a few workbook cells lost their spaces ("15,906medianreported").
 * Splitting them is a typo fix, which the playbook allows (F.7). Words are only
 * split along a vocabulary taken from the page's own copy. */

function segment(token: string, vocab: Set<string>): string[] | null {
  const lower = token.toLowerCase()
  const best: Array<string[] | null> = Array(lower.length + 1).fill(null)
  best[0] = []
  for (let end = 1; end <= lower.length; end++) {
    for (let start = Math.max(0, end - 18); start < end; start++) {
      const word = lower.slice(start, end)
      const prefix = best[start]
      if (!prefix || word.length < 2 || !vocab.has(word)) continue
      if (!best[end] || prefix.length + 1 < (best[end] as string[]).length) best[end] = [...prefix, word]
    }
  }
  const words = best[lower.length]
  if (!words || words.length < 2) return null
  let cursor = 0
  return words.map((word) => {
    const original = token.slice(cursor, cursor + word.length)
    cursor += word.length
    return original
  })
}

export function vocabularyFrom(values: unknown): Set<string> {
  const vocab = new Set<string>()
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      for (const word of value.toLowerCase().match(/[a-z]{2,}/g) || []) if (word.length <= 14) vocab.add(word)
    } else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(values)
  return vocab
}

export function tidySpacing(value: string, vocab: Set<string>): string {
  return value
    .replace(/(\d)(permits?|median)/gi, '$1 $2')
    .replace(/median\s*reported/gi, 'median reported')
    .replace(/([a-z])\(/g, '$1 (')
    .replace(/[A-Za-z]{12,}/g, (token) => (vocab.has(token.toLowerCase()) ? token : segment(token, vocab)?.join(' ') || token))
}

/* ------------------------------------------------------------------------ */
/* Pricing rows: a dollar median becomes a stat card, everything else a row. */

export type PriceStat = {job: string; permits?: string; median: number; display: string; label: string; permit?: string}
export type PriceRow = {job: string; driver: string; permit?: string}

export function parsePricing(rows: Array<{job: string; driver?: string; permit?: string}>, vocab: Set<string>) {
  const stats: PriceStat[] = []
  const others: PriceRow[] = []
  for (const row of rows) {
    const job = tidySpacing(row.job, vocab)
    const driver = tidySpacing(row.driver || '', vocab)
    // "$4,000 median reported, whole projects": the qualifier stays with the number.
    const median = driver.match(/^\$?\s*([\d,]+)\s+(median reported\b.*)$/i)
    if (median) {
      const named = job.match(/^(.*?)\s*\((\d[\d,]*)\s+permits?\)\s*$/i)
      stats.push({
        job: named ? named[1] : job,
        permits: named ? `${named[2]} permits` : undefined,
        median: Number(median[1].replace(/,/g, '')),
        display: `$${median[1]}`,
        label: median[2],
        permit: row.permit,
      })
    } else others.push({job, driver, permit: row.permit})
  }
  return {stats, others, highest: Math.max(1, ...stats.map((stat) => stat.median))}
}

export function permitTone(value?: string): 'yes' | 'sometimes' | 'no' | 'other' {
  if (/^yes/i.test(value || '')) return 'yes'
  if (/^no/i.test(value || '')) return 'no'
  if (/sometimes|depends|maybe/i.test(value || '')) return 'sometimes'
  return 'other'
}

/* ------------------------------------------------------------------------ */
/* Library guides: shared guides store stats and sub-headings positionally
 * (number line, caption line, heading line, body line). */

export type GuideView = {title: string; heading?: string; intro?: string; stats: Array<{value: string; caption: string}>; sections: Array<{heading?: string; body: string}>}

const isStatValue = (value: string) => value.length <= 14 && /^(top\s+)?[$#]?\d[\d,.]*\s*(%|days?|k|m|kw)?$/i.test(value.trim())
const isHeadingLine = (value: string) => value.length <= 90 && !/[.!?:]$/.test(value.trim()) && !isStatValue(value)

export function structureGuide(guide: Guide): GuideView {
  const view: GuideView = {title: guide.title, heading: guide.heading, intro: guide.intro, stats: [], sections: []}
  const sections = guide.sections || []
  if (sections.some((section) => section.heading)) {
    view.sections = sections.map((section) => ({heading: section.heading, body: section.body}))
    return view
  }
  const lines = sections.map((section) => section.body.trim()).filter(Boolean)
  let index = 0
  if (!view.intro && lines[0] && !isStatValue(lines[0]) && !isHeadingLine(lines[0])) view.intro = lines[index++]
  while (index < lines.length) {
    const line = lines[index]
    const next = lines[index + 1]
    if (next && isStatValue(line)) {
      view.stats.push({value: line, caption: next})
      index += 2
    } else if (next && isHeadingLine(line) && !isHeadingLine(next)) {
      view.sections.push({heading: line, body: next})
      index += 2
    } else {
      view.sections.push({body: line})
      index += 1
    }
  }
  return view
}

/* ------------------------------------------------------------------------ */
/* Credentials: tag and icon from each verified metric's own wording. */

export type Credential = {tag: string; icon: IconName; value: string; caption: string; label: string; kind: 'founder' | 'licence' | 'bbb' | 'permits' | 'other'}

export function credentials(settings: V2Settings): Credential[] {
  return (settings.trustMetrics || []).map((metric) => {
    const caption = metric.label.split(/\s+[·—]\s+/)[0]
    if (/founder/i.test(metric.label)) return {tag: 'Founder', icon: 'user', value: metric.value, caption, label: metric.label, kind: 'founder'}
    if (/bbb/i.test(metric.label) || /^[A-F][+-]?$/.test(metric.value)) return {tag: 'BBB rating', icon: 'award', value: metric.value, caption, label: metric.label, kind: 'bbb'}
    if (/permit/i.test(metric.label)) return {tag: 'Permit record', icon: 'fileCheck', value: metric.value, caption, label: metric.label, kind: 'permits'}
    if (/^[A-Z]{2,5}\d{4,}/.test(metric.value) || /contractor|licen[cs]/i.test(metric.label)) return {tag: 'Licence', icon: 'shieldCheck', value: metric.value, caption, label: metric.label, kind: 'licence'}
    return {tag: caption, icon: 'circleCheck', value: metric.value, caption, label: metric.label, kind: 'other'}
  })
}

/** "Which solar job is yours?" -> "solar"; used for the form's "Your solar job" group. */
export function jobNoun(heading?: string): string | undefined {
  return heading?.match(/which\s+(.+?)\s+job\s+is\s+yours/i)?.[1]
}
