'use client'

/* eslint-disable @next/next/no-img-element -- Native image events remove failed Sanity or external images without a broken glyph. */
import {useState} from 'react'

type Props = {src: string; alt: string; title: string; eager?: boolean}

export function GalleryPhoto({src, alt, title, eager = false}: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <span className="cs-shot"><span className="cs-shot-img">
    <img
      src={src}
      alt={alt}
      title={title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{visibility: loaded ? 'visible' : 'hidden'}}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  </span></span>
}
