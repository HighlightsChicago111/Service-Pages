import fs from 'node:fs'
import {createClient} from 'next-sanity'

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const brand = ' | Highlights Chicago'
const copy = {
  'generator-installation': ['Generator Installation in Chicago', 'Get a standby generator installed with the right load calculation, transfer switch and electrical permits. Ask our Chicago electricians for a quote.'],
  'solar-panel-installation': ['Solar Panel Installation in Chicago', 'Plan solar panel wiring, panel capacity and utility interconnection with Chicago electricians. We install safe, code compliant electrical systems.'],
  'ceiling-fan-installation': ['Ceiling Fan Installation in Chicago', 'Install or replace a ceiling fan with proper support, wiring and controls. Our Chicago electricians check the box and circuit before mounting.'],
  'generator-repair': ['Generator Repair in Chicago', 'A generator that will not start or transfer power needs careful diagnosis. We troubleshoot standby generator electrical faults in Chicago. Call for service.'],
  'whole-house-surge-protector': ['Whole House Surge Protection in Chicago', 'Protect connected equipment with a surge protective device at your electrical panel. We assess your Chicago home and install the right protection.'],
  'gfci-outlet-installation': ['GFCI Outlet Installation in Chicago', 'Add or replace GFCI outlets in kitchens, bathrooms and other required locations. We test the circuit and correct wiring issues in Chicago homes.'],
  'garbage-disposal-wiring': ['Garbage Disposal Wiring in Chicago', 'Wire a new or replacement garbage disposal with a suitable circuit, switch and required protection. Our Chicago electricians check the existing setup.'],
  'electrical-repair': ['Electrical Repair in Chicago', 'From dead outlets to flickering lights and burning smells, our Chicago electricians find the cause and repair the electrical fault safely.'],
  'electrical-panel-upgrade': ['Electrical Panel Upgrades in Chicago', 'Upgrade an aging electrical panel or plan more capacity for new loads. We assess service size, circuits and permit needs for Chicago properties.'],
  'circuit-breaker-replacement': ['Circuit Breaker Replacement in Chicago', 'A tripping breaker may point to a circuit fault. Our Chicago electricians diagnose the cause and replace damaged or unsuitable breakers when needed.'],
  'outdoor-lighting-installation': ['Outdoor Lighting Installation in Chicago', 'Light entrances, paths and exterior spaces with durable fixtures, appropriate wiring and practical controls. Get outdoor lighting installed in Chicago.'],
  'tesla-and-ev-charger-installation': ['EV Charger Installation in Chicago', 'Install a Level 2 EV or Tesla charger with a dedicated circuit sized to your panel and charging needs. Ask our Chicago electricians for a quote.'],
  'fire-alarm-installation': ['Fire Alarm Installation in Chicago', 'Install or update fire alarm wiring and devices with attention to testing, inspection and the needs of your Chicago building. Request an assessment.'],
  'electrical-outlet-installation': ['Electrical Outlet Installation in Chicago', 'Add, move or replace electrical outlets with the right circuit capacity and protection. Our Chicago electricians check the wiring before installation.'],
  'recessed-lighting-installation': ['Recessed Lighting Installation in Chicago', 'Plan recessed lights with even spacing, suitable fixtures and useful controls. Our Chicago electricians handle wiring and installation.'],
  'electrical-wiring-and-repair-services': ['Electrical Wiring & Repair in Chicago', 'Repair damaged wiring or add circuits for renovations and new equipment. Our Chicago electricians assess the existing system before work begins.'],
  'carbon-monoxide-detector-installation': ['CO Detector Installation in Chicago', 'Install and connect carbon monoxide detectors in the right locations for your Chicago property. We check power, placement and existing devices.'],
  'landscape-lighting-installation': ['Landscape Lighting in Chicago', 'Add path, garden and accent lighting with a suitable transformer, weather resistant fixtures and planned cable runs. Serving Chicago properties.'],
  'smoke-detector-installation-and-wiring': ['Smoke Detector Wiring in Chicago', 'Install or replace hardwired, interconnected smoke detectors and check the wiring and placement. Our Chicago electricians can assess your property.'],
  'home-energy-audit': ['Home Energy Audit in Chicago', 'Find where your home uses power and which electrical upgrades may help. We review loads and recommend practical improvements for Chicago homes.'],
  'structured-cabling-installation': ['Structured Cabling in Chicago', 'Plan and install Ethernet runs, patch panels and terminations for dependable building networks. Structured cabling for Chicago properties.'],
  'solar-battery-installation': ['Solar Battery Installation in Chicago', 'Add battery storage to a solar or backup power system with properly sized circuits and interconnection. Discuss your Chicago property with our team.'],
  'breaker-box-and-panel-repair': ['Breaker Box & Panel Repair in Chicago', 'Rust, heat or loose breakers can signal a panel problem. We inspect Chicago electrical panels and repair components when a full upgrade is unnecessary.'],
  'light-fixture-installation-and-replacement': ['Light Fixture Installation in Chicago', 'Install or replace light fixtures with secure mounting, correct wiring and compatible controls. Our Chicago electricians check the existing box.'],
  'electrical-troubleshooting': ['Electrical Troubleshooting in Chicago', 'Track down intermittent outlets, flickering lights and unexplained trips. Our Chicago electricians test the circuit to find the underlying fault.'],
  'electrical-installation-services': ['Electrical Installation in Chicago', 'Add circuits, wiring and electrical equipment for a renovation or new appliance. We plan safe, code compliant installations across Chicago.'],
  'low-voltage-wiring-installation': ['Low Voltage Wiring in Chicago', 'Install low voltage wiring for doorbells, controls, sensors and other building systems. We plan clean cable paths and reliable connections in Chicago.'],
  'cctv-installation': ['CCTV Installation in Chicago', 'Install security cameras with reliable power, cabling and placement. Our Chicago team plans the electrical connections behind your CCTV system.'],
  'energy-star-appliances': ['ENERGY STAR Appliance Wiring in Chicago', 'Check circuits and electrical connections before installing an ENERGY STAR appliance. We help Chicago homeowners prepare for new equipment loads.'],
  'light-switch-replacement-and-installation': ['Light Switch Installation in Chicago', 'Replace a faulty switch or add new lighting controls. Our Chicago electricians inspect the box and wiring before fitting the right device.'],
  'bathroom-exhaust-fan-installation': ['Bathroom Exhaust Fans in Chicago', 'Install or replace a bathroom exhaust fan with proper wiring, switching and ventilation planning. Our Chicago electricians assess the existing circuit.'],
  'grounding-and-bonding': ['Grounding & Bonding in Chicago', 'Identify and correct grounding or bonding faults that affect electrical safety. Our Chicago electricians inspect connections and recommend repairs.'],
  'emergency-lighting-services-and-maintenance': ['Emergency Lighting in Chicago', 'Install, test and repair emergency lighting so exit paths remain visible when normal power fails. Service for Chicago commercial properties.'],
  'led-retrofit': ['LED Lighting Retrofits in Chicago', 'Improve lighting quality, controls and energy use with an LED retrofit. We assess existing fixtures and plan practical upgrades in Chicago.'],
  'energy-efficiency-upgrades': ['Energy Efficiency Upgrades in Chicago', 'Reduce wasted electricity with targeted lighting, controls and circuit improvements. We assess how your Chicago property uses power first.'],
  'chandelier-installation': ['Chandelier Installation in Chicago', 'Hang a chandelier with suitable structural support, safe wiring and compatible dimming. Our Chicago electricians plan access and installation.'],
  'fiber-optic-cable-installation': ['Fiber Optic Installation in Chicago', 'Install fiber cable with planned pathways, careful handling, termination and testing. Fiber optic cabling for Chicago buildings.'],
  'parking-lot-lighting-repair-and-installation': ['Parking Lot Lighting in Chicago', 'Repair or install parking lot and garage lighting with weather rated fixtures and sensible controls. Service for Chicago properties.'],
  'fuse-box-replacement': ['Fuse Box Replacement in Chicago', 'Assess an older fuse box for condition, capacity and safety before converting to breakers. Our Chicago electricians plan the right replacement.'],
  'infrared-electrical-inspection': ['Infrared Electrical Inspection in Chicago', 'Use thermal imaging alongside electrical testing to investigate unusual heat at panels and connections. Request an inspection in Chicago.'],
}

const client = createClient({
  projectId: process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-03-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})
const pages = await client.fetch(`*[_type == "servicePage" && defined(service->slug.current)] {
  _id, _rev, "slug": service->slug.current, seo
}`)
const slugs = new Set(pages.map((page) => page.slug))
if (pages.length !== 40 || Object.keys(copy).length !== 40 || slugs.size !== 40 ||
    pages.some((page) => !copy[page.slug])) {
  throw new Error('Service page set differs from the reviewed set of 40; no changes made.')
}
const updates = pages.map((page) => {
  const [heading, description] = copy[page.slug]
  const title = heading + brand
  if (title.length > 65 || description.length > 170 || description.length < 100) {
    throw new Error(`SEO copy outside schema limits: ${page.slug} (${title.length}/${description.length})`)
  }
  return {id: page._id, rev: page._rev, slug: page.slug, before: page.seo, after: {...page.seo, title, description}}
})
fs.mkdirSync('outputs', {recursive: true})
fs.writeFileSync('outputs/service-seo-migration-backup.json', JSON.stringify(updates, null, 2) + '\n')
console.log(`Validated ${updates.length} service pages; backup saved to outputs/service-seo-migration-backup.json`)
if (!process.argv.includes('--apply')) {
  console.log('Dry run. Pass --apply to update Sanity.')
  process.exit(0)
}
for (const update of updates) {
  await client.patch(update.id).ifRevisionId(update.rev).set({seo: update.after}).commit()
  console.log(`Updated ${update.slug}`)
}
