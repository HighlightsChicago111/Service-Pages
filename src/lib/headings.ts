import {stegaClean} from 'next-sanity'

export function questionHeading(value: string | undefined): string {
  const heading = (value || '').trim()
  // Test the plain text: in Studio preview the string carries invisible edit markers.
  const plain = stegaClean(heading)
  if (!/^(what|why|who)\b/i.test(plain) || plain.endsWith('?')) return heading
  return `${heading}?`
}
