'use client'

import {useState} from 'react'
import {questionHeading} from '@/lib/headings'

type GuideItem = {title: string; paragraphs: string[]}

export function GuideTabs({guides}: {guides: GuideItem[]}) {
  const [active, setActive] = useState(0)

  return (
    <div className="guide-tabs">
      <div className="guide-nav" role="tablist" aria-label="Guides">
        {guides.map((guide, index) => <button key={guide.title} type="button" role="tab" id={`guide-tab-${index}`} aria-controls={`guide-panel-${index}`} aria-selected={active === index} onClick={() => setActive(index)}>{questionHeading(guide.title)}</button>)}
      </div>
      <div className="guide-panels">
        {guides.map((guide, index) => (
          <div className="guide-panel" id={`guide-panel-${index}`} role="tabpanel" aria-labelledby={`guide-tab-${index}`} hidden={active !== index} key={guide.title}>
            <button className="guide-mobile-head" type="button" onClick={() => setActive(active === index ? -1 : index)}>{questionHeading(guide.title)}</button>
            <div className="guide-body">
              {guide.paragraphs.map((paragraph, paragraphIndex) => paragraphIndex === 0 ? <h3 key={paragraphIndex}>{questionHeading(paragraph)}</h3> : <p key={paragraphIndex}>{paragraph}</p>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
