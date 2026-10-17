import {SectionHead} from '../atoms'
import {pickIcon, type IconName} from '../icon'
import {LibraryTabs, type LibraryGuide} from '../library-tabs'
import {structureGuide} from '@/lib/v3/content'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

const guidesOf = ({page, area}: Pick<BlockContext, 'page' | 'area'>) => [...(area.sharedGuides || []), ...(page.serviceGuide?.title ? [page.serviceGuide] : [])]
export const hasLibrary = (ctx: BlockContext) => guidesOf(ctx).length > 0

function guideIcon(title: string): IconName {
  if (/home|house|building/i.test(title)) return 'building'
  if (/permit/i.test(title)) return 'fileText'
  if (/neighbo|suburb|area|ward/i.test(title)) return 'mapPin'
  if (/solar/i.test(title)) return 'sun'
  return pickIcon(title, 'fileText')
}

/** D18 Library tabs: long-form guides, out of the way until wanted. */
export function LibraryBlock({ctx}: {ctx: BlockContext}) {
  const {area, visuals} = ctx
  const guides: LibraryGuide[] = guidesOf(ctx).map((guide, index) => ({...structureGuide(guide), icon: guideIcon(guide.title), photo: visuals.library[index]}))
  return (
    <div className="ds-wrap">
      <SectionHead eyebrow={`Library · ${guides.length} guides`} id="guides-title" title={questionHeading(area.libraryHeading)} lede={area.libraryLede} />
      <LibraryTabs guides={guides} />
    </div>
  )
}
