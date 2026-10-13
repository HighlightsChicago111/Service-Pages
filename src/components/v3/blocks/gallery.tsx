import {Eyebrow, PhotoFrame} from '../atoms'
import {Icon} from '../icon'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasGallery = ({visuals}: BlockContext) => visuals.gallery.length > 0

/** D10 Photo gallery: tall portrait left, two stacked right, then a two-image strip. */
export function GalleryBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, visuals} = ctx
  const photos = visuals.gallery.slice(0, 5)
  return (
    <div className="ds-wrap">
      <div className="ds-head ds-head--aside">
        <div className="ds-head-main"><Eyebrow>Our works</Eyebrow><h2 className="ds-h2" id="working-in-area-title">{questionHeading(`Our Works in ${area.name}`)}</h2>{area.workingLede && <p className="ds-lede">{area.workingLede}</p>}</div>
        <div className="ds-head-aside"><a className="ds-text-cta" href="#quote">{page.hero.secondaryCta || 'Request service'}<Icon name="arrowRight" size={18} /></a></div>
      </div>
      <ul className={`ds-gallery ds-gallery--${photos.length}`}>
        {photos.map((photo, index) => {
          const caption = photo.label || (photo.illustrative ? `Illustrative photo of ${page.name.toLowerCase()}` : photo.alt)
          return (
            <li key={`${photo.src}-${index}`}>
              <PhotoFrame photo={photo} pill={false} credit={false}>
                <figcaption className="ds-gallery-caption"><Icon name="camera" size={16} />{caption}</figcaption>
              </PhotoFrame>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
