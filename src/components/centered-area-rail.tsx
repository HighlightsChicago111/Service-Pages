'use client'

import type {ReactNode} from 'react'
import {useEffect, useRef} from 'react'

export function CenteredAreaRail({children, label}: {children: ReactNode; label: string}) {
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 620px)')
    let frame = 0

    const centerRail = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rail = railRef.current
        if (!rail || !mobile.matches) return
        rail.scrollLeft = Math.max(0, (rail.scrollWidth - rail.clientWidth) / 2)
      })
    }

    centerRail()
    mobile.addEventListener('change', centerRail)
    return () => {
      cancelAnimationFrame(frame)
      mobile.removeEventListener('change', centerRail)
    }
  }, [])

  return <div className="area-rail area-rail-single-row" ref={railRef} role="list" aria-label={label} tabIndex={0}>{children}</div>
}
