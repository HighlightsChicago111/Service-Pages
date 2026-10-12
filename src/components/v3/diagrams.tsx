/*
 * Simple explanatory diagrams for D3 (playbook: "a simple topology diagram").
 * They only render when an option's own name says what it is, so a page about
 * a different service never shows a solar drawing.
 */

export type Topology = 'string' | 'micro' | 'optimiser'
export type Backup = 'none' | 'critical' | 'whole'

export function topologyOf(name: string): Topology | null {
  if (/optimi[sz]er/i.test(name)) return 'optimiser'
  if (/micro-?inverter/i.test(name)) return 'micro'
  if (/string inverter/i.test(name)) return 'string'
  return null
}

export function backupOf(title: string): Backup | null {
  if (/no battery|without (a )?battery/i.test(title)) return 'none'
  if (/critical|essential|backup subpanel/i.test(title)) return 'critical'
  if (/whole[- ]home|whole[- ]house/i.test(title)) return 'whole'
  return null
}

const PANEL_XS = [4, 72, 140, 208]
const PANEL_W = 58
const BUS_Y = 78

/** Four panels; how they reach the inverter. Drawn for a navy card header. */
export function TopologyDiagram({kind}: {kind: Topology}) {
  const perPanel = kind !== 'string'
  const label = kind === 'micro' ? 'A small inverter under every panel' : kind === 'optimiser' ? 'An optimiser under every panel, feeding one inverter on the wall' : 'All panels feeding one inverter on the wall'
  return (
    <svg className="ds-diagram ds-diagram--topology" viewBox="0 0 330 128" role="img" aria-label={label}>
      {PANEL_XS.map((x) => {
        const mid = x + PANEL_W / 2
        return (
          <g key={x}>
            <rect x={x} y="4" width={PANEL_W} height="36" rx="3" className="dg-panel" />
            <path d={`M${x + PANEL_W / 3} 4v36M${x + (2 * PANEL_W) / 3} 4v36M${x} 22h${PANEL_W}`} className="dg-panel-line" />
            {perPanel && <><rect x={mid - 10} y="48" width="20" height="10" rx="2" className="dg-box" /><rect x={mid - 6} y="51" width="12" height="4" rx="1" className="dg-box-mark" /></>}
            <path d={perPanel ? `M${mid} 40v8M${mid} 58V${BUS_Y}` : `M${mid} 40V${BUS_Y}`} className="dg-wire" />
          </g>
        )
      })}
      {kind === 'micro'
        ? <path d={`M${PANEL_XS[0] + PANEL_W / 2} ${BUS_Y}H300m-6-5 6 5-6 5`} className="dg-wire" />
        : <>
            <path d={`M${PANEL_XS[0] + PANEL_W / 2} ${BUS_Y}H297V90`} className="dg-wire" />
            <rect x="276" y="90" width="42" height="32" rx="3" className="dg-inverter" />
            <rect x="283" y="97" width="16" height="8" rx="1.5" className="dg-box-mark" />
            <path d="M283 113h28" className="dg-inverter-line" />
          </>}
    </svg>
  )
}

/** House with four circuit groups; which ones a battery keeps running. Drawn for a light card. */
export function BackupDiagram({kind}: {kind: Backup}) {
  const lit = kind === 'whole' ? [0, 1, 2, 3] : kind === 'critical' ? [1, 2] : []
  const cells = [[22, 48], [74, 48], [22, 74], [74, 74]]
  const batteries = kind === 'whole' ? [196, 226] : kind === 'critical' ? [196] : []
  return (
    <svg className="ds-diagram ds-diagram--backup" viewBox="0 0 260 120" role="img" aria-label={kind === 'none' ? 'No battery: nothing runs in an outage' : kind === 'critical' ? 'One battery keeps critical circuits running' : 'Batteries keep the whole home running'}>
      <path d="M6 42 70 6l64 36" className="dg-house" />
      <rect x="14" y="40" width="112" height="62" rx="2" className="dg-house" />
      {cells.map(([x, y], index) => {
        const on = lit.includes(index)
        return <g key={index}><rect x={x} y={y} width="44" height="18" rx="2" className={on ? 'dg-cell dg-cell--on' : 'dg-cell'} />{on && <path d={`M${x + 24} ${y + 4}l-5 6h6l-5 6`} className="dg-bolt" />}</g>
      })}
      {kind === 'none'
        ? <rect x="200" y="54" width="22" height="44" rx="4" className="dg-battery dg-battery--empty" />
        : <>
            <path d={`M126 82h${batteries[0] - 126}`} className="dg-link" />
            {batteries.map((x) => <g key={x}><rect x={x} y="50" width="24" height="50" rx="4" className="dg-battery" /><rect x={x + 7} y="45" width="10" height="4" rx="1" className="dg-battery-cap" />{[60, 72, 84].map((y) => <rect x={x + 5} y={y} width="14" height="7" rx="1" className="dg-battery-bar" key={y} />)}</g>)}
          </>}
    </svg>
  )
}
