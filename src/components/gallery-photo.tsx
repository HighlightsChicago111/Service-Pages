'use client'

/* eslint-disable @next/next/no-img-element -- Native image events remove failed Sanity or external images without a broken glyph. */
import {useEffect, useRef, useState} from 'react'

type Props = {src: string; alt: string; title: string; eager?: boolean}

export function GalleryPhoto({src, alt, title, eager = false}: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const image = imageRef.current
    if (!image?.complete) return
    if (image.naturalWidth > 0) setLoaded(true)
    else setFailed(true)
  }, [src])

  if (failed) return null
  return <span className="cs-shot"><span className="cs-shot-img">
    <img
      ref={imageRef}
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
