import {Copy, IconBadge, SectionHead} from '../atoms'
import {JobSelector, type Job} from '../job-selector'
import {splitConfirm} from '@/lib/v3/content'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasJobs = ({page}: BlockContext) => Boolean(page.jobPaths?.items?.length)

/** D2 Job selector: "Which ___ job is yours?" */
export function JobsBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const paths = page.jobPaths
  const jobs: Job[] = (paths?.items || []).map((item, index) => ({
    title: item.title,
    situation: splitConfirm(item.whoFor),
    scope: splitConfirm(item.scopeDrivers),
    firstStep: splitConfirm(item.firstStep),
    link: item.linkLabel && item.linkAnchor ? {label: item.linkLabel, href: `#${item.linkAnchor}`} : undefined,
    photo: visuals.jobs[index],
  }))
  const illustrative = jobs.some((job) => job.photo?.illustrative)

  return (
    <div className="ds-wrap">
      <SectionHead
        eyebrow="Start here"
        id="your-job-title"
        title={questionHeading(paths?.heading)}
        lede={paths?.lede}
        editorial={editorial}
        aside={<p className="ds-hint"><IconBadge icon="pointer" tone="blue" size={32} />Select a job to see its scope &amp; first step</p>}
      />
      <JobSelector jobs={jobs} editorial={editorial} />
      {(paths?.note || illustrative) && <div className="ds-note-row">
        {paths?.note && <div className="ds-note-row-main"><IconBadge icon="help" tone="blue" size={32} /><Copy value={paths.note} show={editorial} /></div>}
        {illustrative && <small className="ds-meta">Illustrative photos</small>}
      </div>}
    </div>
  )
}
