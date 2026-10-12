'use client'

import {useEffect, useRef, useState} from 'react'
import {Icon} from './icon'

/** Full review text is always in the HTML; it is clamped to five lines with a toggle (playbook D8). */
export function ReviewText({text}: {text: string}) {
  const [open, setOpen] = useState(false)
  const [clamped, setClamped] = useState(true)
  const ref = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 2)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <blockquote ref={ref} className={open ? 'ds-review-text is-open' : 'ds-review-text'}>{text}</blockquote>
      {(clamped || open) && <button type="button" className="ds-text-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Read more'}<Icon name="chevronDown" size={16} />
      </button>}
    </>
  )
}
