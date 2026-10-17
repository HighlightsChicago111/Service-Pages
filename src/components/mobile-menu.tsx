'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'

/**
 * The phone menu. Its links repeat the desktop menu, so they are rendered only once
 * the menu is opened: the page HTML then carries each navigation link once, not twice.
 */
export function MobileMenu({className, children}: {className: string; children: ReactNode}) {
  const menu = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)

  // A tap before hydration opens the menu without a toggle event React can see.
  useEffect(() => {
    if (menu.current?.open) setOpen(true)
  }, [])

  return (
    <details className={className} ref={menu} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
      <nav aria-label="Mobile navigation">{open ? children : null}</nav>
    </details>
  )
}
