import {Button, ConfirmNotes, Eyebrow, GoogleG, IconBadge, PhotoFrame, Stars} from '../atoms'
import {Icon} from '../icon'
import {credentials, splitConfirm} from '@/lib/v3/content'
import {SHARED_PHOTOS, fromImg} from '@/lib/v3/visuals'
import {questionHeading} from '@/lib/headings'
import type {Faq} from '@/types/v2'
import type {BlockContext} from '../types'

export const faqsOf = ({page, area}: Pick<BlockContext, 'page' | 'area'>): Faq[] => [...(page.faqs || []), ...(area.localFaqs || [])]
export const hasFaq = (ctx: BlockContext) => faqsOf(ctx).length > 0

/** D16 FAQ split: sticky left rail (photo + call + proof), numbered accordion, first open. */
export function FaqBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, settings, editorial, tel, phone} = ctx
  const faqs = faqsOf(ctx)
  const licence = credentials(settings).find((item) => item.kind === 'licence')
  const google = settings.google

  return (
    <div className="ds-wrap ds-faq">
      <aside className="ds-faq-rail">
        <Eyebrow>FAQs · {faqs.length} questions</Eyebrow>
        <h2 className="ds-h2" id="faq-title">{questionHeading(`${page.name} in ${area.name} — FAQs`)}</h2>
        <PhotoFrame photo={fromImg(ctx.settings.faqImage, 'Highlights Chicago electrician') || SHARED_PHOTOS.techTesting} pill={false} className="ds-faq-photo">
          <div className="ds-faq-photo-body"><p className="ds-h5">Didn&apos;t find your question?</p><Button href={tel} tone="light" icon="phone" size="m">Call {phone}</Button></div>
        </PhotoFrame>
        <div className="ds-proof-card">
          {google?.rating && <div className="ds-proof-row"><span className="ds-google-disc ds-google-disc--line"><GoogleG size={24} /></span><div><p className="ds-proof-num"><b>{google.rating}</b><Stars size={14} /></p><p className="ds-proof-cap">{google.reviewCount} Google reviews</p></div></div>}
          {licence && <div className="ds-proof-row"><IconBadge icon="shieldCheck" tone="green" /><div><p className="ds-proof-num"><b>{licence.value}</b></p><p className="ds-proof-cap">{licence.caption}</p></div></div>}
        </div>
      </aside>
      <div className="ds-faq-list">
        {faqs.map((faq, index) => {
          const answer = splitConfirm(faq.answer)
          const question = splitConfirm(faq.question)
          return (
            <details className="ds-faq-item" open={index === 0} key={`${index}-${faq.question}`}>
              <summary>
                <span className="ds-faq-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="ds-faq-q">{question.text}</span>
                <span className="ds-faq-toggle" aria-hidden="true"><Icon name="plus" size={16} className="ds-faq-plus" /><Icon name="minus" size={16} className="ds-faq-minus" /></span>
              </summary>
              <div className="ds-faq-a"><p>{answer.text}</p><ConfirmNotes notes={[...question.notes, ...answer.notes]} show={editorial} /></div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
