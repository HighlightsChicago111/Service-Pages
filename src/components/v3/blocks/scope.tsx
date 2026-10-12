import {ConfirmNotes, Copy, Eyebrow, IconBadge, PhotoFrame, SectionHead} from '../atoms'
import {Icon, pickIcon} from '../icon'
import {splitConfirm} from '@/lib/v3/content'
import type {BlockContext} from '../types'

export const hasScope = ({page}: BlockContext) => Boolean(page.included?.inScope?.length || page.included?.handover?.length || page.included?.warranty?.length)

function ScopePanel({tone, label, heading, items, note, editorial}: {tone: 'in' | 'out'; label: string; heading?: string; items: string[]; note?: string; editorial: boolean}) {
  const extra = splitConfirm(note)
  return (
    <article className={`ds-scope-panel ds-scope-panel--${tone}`}>
      <header>
        <span className="ds-scope-mark"><Icon name={tone === 'in' ? 'check' : 'plus'} size={22} /></span>
        <div><p className="ds-label-head">{label}</p><h3 className="ds-h5">{heading}</h3></div>
      </header>
      <ul>
        {items.map((item) => {
          const {text, notes} = splitConfirm(item)
          return <li key={item}><span className="ds-scope-bullet"><Icon name={tone === 'in' ? 'check' : 'plus'} size={14} /></span><span>{text}<ConfirmNotes notes={notes} show={editorial} /></span></li>
        })}
      </ul>
      {extra.text && <p className="ds-scope-note">{extra.text}</p>}
      <ConfirmNotes notes={extra.notes} show={editorial} />
    </article>
  )
}

/** D15 Scope & handover: included vs separate, navy handover strip, who warrants what. */
export function ScopeBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const included = page.included || {}
  const handover = included.handover || []
  const warranty = included.warranty || []

  return (
    <>
      <div className="ds-wrap">
        <SectionHead eyebrow="Scope & handover" id="whats-included-title" title={included.heading} lede={included.lede} editorial={editorial} />
        {(Boolean(included.inScope?.length) || Boolean(included.separate?.length)) && <div className="ds-scope">
          {Boolean(included.inScope?.length) && <ScopePanel tone="in" label="Included" heading={included.inScopeHeading} items={included.inScope || []} note={included.inScopeNote} editorial={editorial} />}
          {Boolean(included.separate?.length) && <ScopePanel tone="out" label="Separate quote" heading={included.separateHeading} items={included.separate || []} note={included.separateNote} editorial={editorial} />}
        </div>}
      </div>

      {handover.length > 0 && <div className="ds-handover">
        <div className="ds-wrap">
          <div className="ds-head ds-head--aside ds-head--dark">
            <div className="ds-head-main"><Eyebrow>At handover</Eyebrow><h2 className="ds-h2">{included.handoverHeading}</h2></div>
            <div className="ds-head-aside"><p className="ds-glass-chip"><Icon name="fileText" size={16} />{handover.length} items to collect</p></div>
          </div>
          <ol className="ds-docs">
            {handover.map((item, index) => {
              const {text, notes} = splitConfirm(item)
              return (
                <li className="ds-doc" key={item}>
                  <div className="ds-doc-top"><IconBadge icon={pickIcon(text, 'fileCheck')} tone="navy" /><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <h3 className="ds-h6">{text}</h3>
                  <ConfirmNotes notes={notes} show={editorial} />
                </li>
              )
            })}
            {visuals.handover && <li className="ds-doc ds-doc--photo"><PhotoFrame photo={visuals.handover} /></li>}
          </ol>
        </div>
      </div>}

      {warranty.length > 0 && <div className="ds-wrap ds-warranties">
        <div>
          <Eyebrow>Warranties</Eyebrow>
          <h2 className="ds-h2">{included.warrantyHeading}</h2>
          <ul className="ds-legend-list">
            <li><i className="ds-ring ds-ring--green" aria-hidden="true" />Warranted by Highlights Chicago</li>
            <li><i className="ds-ring ds-ring--blue" aria-hidden="true" />Warranted by the manufacturer</li>
          </ul>
        </div>
        <ul className="ds-warranty-rows">
          {warranty.map((row) => {
            const ours = /highlights/i.test(row.party)
            return (
              <li key={row._key || row.item}>
                <IconBadge icon={ours ? 'wrench' : pickIcon(row.item, 'shieldCheck')} tone={ours ? 'green' : 'blue'} />
                <h3 className="ds-h6">{row.item}</h3>
                <Copy value={row.party} show={editorial} className={ours ? 'ds-warranty-party is-ours' : 'ds-warranty-party'} />
              </li>
            )
          })}
        </ul>
      </div>}
    </>
  )
}
