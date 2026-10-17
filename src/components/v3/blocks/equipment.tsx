import type {CSSProperties} from 'react'
import {ConfirmNotes, Copy, GhostLink, IconBadge, IconTile, PhotoFrame, SectionHead} from '../atoms'
import {BackupDiagram, TopologyDiagram, backupOf, topologyOf} from '../diagrams'
import {pickIcon} from '../icon'
import {splitConfirm} from '@/lib/v3/content'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasEquipment = ({page}: BlockContext) => Boolean(page.equipment?.items?.length || page.equipment?.comparison?.rows?.length || page.equipment?.options?.items?.length)

/** D3 Equipment showcase: photo tiles, note banner, comparison cards, options with diagrams. */
export function EquipmentBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const equipment = page.equipment || {}
  const items = equipment.items || []
  const comparison = equipment.comparison
  const options = equipment.options
  const columns = comparison?.columns || []
  const rows = comparison?.rows || []
  const illustrative = items.some((_, index) => visuals.equipment[index]?.illustrative)

  return (
    <div className="ds-wrap">
      <SectionHead eyebrow="Equipment" id="equipment-title" title={questionHeading(equipment.heading)} lede={equipment.lede} editorial={editorial} />

      {items.length > 0 && <>
        <ul className="ds-tiles">
          {items.map((item, index) => {
            const photo = visuals.equipment[index]
            return (
              <li className="ds-tile" key={item._key || item.name}>
                {photo ? <PhotoFrame photo={photo} pill={false} className="ds-tile-media" /> : <IconTile icon={pickIcon(item.name, 'cpu')} className="ds-tile-media" />}
                <div className="ds-tile-body"><h3 className="ds-h5">{item.name}</h3>{item.description && <p>{item.description}</p>}</div>
              </li>
            )
          })}
        </ul>
        {illustrative && <p className="ds-meta ds-meta--end">Illustrative photos</p>}
      </>}

      {equipment.footnote && <div className="ds-banner">
        <IconBadge icon="wrench" tone="blue" />
        <Copy value={equipment.footnote} show={editorial} />
        {equipment.footnoteLinkLabel && equipment.footnoteLinkAnchor && <GhostLink href={`#${equipment.footnoteLinkAnchor}`}>{equipment.footnoteLinkLabel}</GhostLink>}
      </div>}

      {rows.length > 0 && columns.length > 0 && <div className="ds-sub" id="equipment-choices">
        <div className="ds-sub-head ds-sub-head--split">
          <h3 className="ds-h3">{comparison?.heading}</h3>
          <Copy value={comparison?.intro} show={editorial} className="ds-lede" />
        </div>
        <div className="ds-compare" style={{'--cols': columns.length, '--rows': rows.length + 1} as CSSProperties}>
          {columns.map((column, columnIndex) => {
            const topology = topologyOf(column)
            return (
              <article className="ds-compare-card" key={column}>
                <header className="ds-compare-head"><h4>{column}</h4>{topology && <TopologyDiagram kind={topology} />}</header>
                {rows.map((row) => {
                  const {text, notes} = splitConfirm(row.values?.[columnIndex])
                  return (
                    <div className={`ds-compare-row${/best fit|best for|ideal/i.test(row.label) ? ' is-highlight' : ''}`} key={row._key || row.label}>
                      <span className="ds-compare-label">{row.label}</span>
                      <span className="ds-compare-value">{text}<ConfirmNotes notes={notes} show={editorial} /></span>
                    </div>
                  )
                })}
              </article>
            )
          })}
        </div>
      </div>}

      {Boolean(options?.items?.length) && <div className="ds-sub" id="equipment-options">
        <h3 className="ds-h3 ds-sub-title">{options?.heading}</h3>
        {(options?.calloutLead || options?.calloutBody) && <div className="ds-callout-navy">
          <IconBadge icon="zapOff" tone="navy" size={64} />
          <div>{options?.calloutLead && <p className="ds-callout-lead">{options.calloutLead}</p>}<Copy value={options?.calloutBody} show={editorial} /></div>
        </div>}
        <ul className="ds-options">
          {options?.items?.map((option, _index, all) => {
            const backup = backupOf(option.title)
            // Diagrams exist only for backup-scope options; without any, the cards drop the empty art box.
            const compact = !all.some((item) => backupOf(item.title))
            return (
              <li className={compact ? 'ds-option ds-option--compact' : 'ds-option'} key={option._key || option.title}>
                {compact
                  ? <IconBadge icon={pickIcon(option.title, 'battery')} tone="blue" size={48} />
                  : <div className="ds-option-art">{backup ? <BackupDiagram kind={backup} /> : <IconBadge icon={pickIcon(option.title, 'battery')} tone="blue" size={56} />}</div>}
                <h4 className="ds-h5">{option.title}</h4>
                <Copy value={option.body} show={editorial} />
              </li>
            )
          })}
        </ul>
        {options?.note && <NoteLine value={options.note} editorial={editorial} />}
      </div>}
    </div>
  )
}

/** Hairline note: info icon + copy, CONFIRM chips on their own line. */
export function NoteLine({value, editorial}: {value: string; editorial: boolean}) {
  const {text, notes} = splitConfirm(value)
  if (!text && !(editorial && notes.length)) return null
  return <div className="ds-noteline"><IconBadge icon="info" tone="white" size={32} /><div>{text && <p>{text}</p>}<ConfirmNotes notes={notes} show={editorial} /></div></div>
}
