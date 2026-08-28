export function questionHeading(value: string | undefined): string {
  const heading = (value || '').trim()
  if (!/^(what|why|who)\b/i.test(heading) || heading.endsWith('?')) return heading
  return `${heading}?`
}
