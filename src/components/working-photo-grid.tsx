'use client'

/* eslint-disable @next/next/no-img-element -- These Sanity URLs can be external and need native load/error events. */
import {useState} from 'react'
import type {ExternalImage} from '@/types/content'

type Props = {
  photos?: ExternalImage[]
  serviceName: string
  areaName: string
}

export function WorkingPhotoGrid({photos = [], serviceName, areaName}: Props) {
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const available = photos.map((photo, index) => ({photo, index, src: photo.resolvedUrl || photo.externalUrl}))
    .filter(({src, index}) => Boolean(src) && !failed[index])

  if (!available.length) {
    return <div className="photo-grid" style={{gridTemplateColumns: 'minmax(0, 460px)'}}><div className="work-photo">
      <div className="ph"><span>Photo coming soon</span></div>
    </div></div>
  }

  return <div className="photo-grid">{available.map(({photo, index, src}) => {
    const fallback = `${serviceName} work completed by Highlights Chicago in ${areaName} — project photo ${index + 1}`
    const alt = photo.alt?.trim() || fallback
    const caption = photo.caption?.trim() || fallback
    return <figure className="work-photo" key={photo._key || index}>
      <div className="ph">
        <img
          src={src}
          alt={alt}
          title={caption}
          loading="lazy"
          decoding="async"
          style={{visibility: loaded[index] ? 'visible' : 'hidden'}}
          onLoad={() => setLoaded((current) => ({...current, [index]: true}))}
          onError={() => setFailed((current) => ({...current, [index]: true}))}
        />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  })}</div>
}
