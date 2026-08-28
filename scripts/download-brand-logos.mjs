import fs from 'node:fs/promises'
import path from 'node:path'

const brands = {
  'Generac': 'generac.com',
  'Kohler': 'kohler.com',
  'Briggs & Stratton': 'briggsandstratton.com',
  'Champion': 'championpowerequipment.com',
  'Cummins': 'cummins.com',
  'Honeywell': 'honeywell.com',
  'Eaton': 'eaton.com',
  'Square D': 'se.com',
  'Siemens': 'siemens.com',
  'Milbank': 'milbankworks.com',
  'Enphase': 'enphase.com',
  'SolarEdge': 'solaredge.com',
  'Tesla': 'tesla.com',
  'LG': 'lg.com',
  'Qcells': 'qcells.com',
  'Canadian Solar': 'canadiansolar.com',
  'SMA': 'sma-america.com',
  'Fronius': 'fronius.com',
  'Hunter': 'hunterfan.com',
  'Casablanca': 'hunterfan.com',
  'Minka-Aire': 'minkagroup.net',
  'Emerson': 'emerson.com',
  'Hampton Bay': 'homedepot.com',
  'Kichler': 'kichler.com',
  'Big Ass Fans': 'bigassfans.com',
  'Lutron': 'lutron.com',
  'Broan': 'broan-nutone.com',
  'Leviton': 'leviton.com',
  'Intermatic': 'intermatic.com',
  'Schneider': 'se.com',
  'Cutler-Hammer': 'eaton.com',
  'GE': 'ge.com',
  'Ditek': 'diteksurgeprotection.com',
  'Legrand': 'legrand.us',
  'Pass & Seymour': 'legrand.us',
  'Hubbell': 'hubbell.com',
  'InSinkErator': 'insinkerator.com',
  'Waste King': 'wasteking.com',
  'Moen': 'moen.com',
  'KitchenAid': 'kitchenaid.com',
  'Murray': 'siemens.com',
  'Challenger': 'eaton.com',
  'Federal Pacific': 'federalpacific.com',
  'Zinsco': 'zincselectrical.com',
}

const slug = (name) => name
  .normalize('NFKD')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const output = path.resolve('public/images/brands')
await fs.mkdir(output, {recursive: true})

const sourceLines = [
  '# Brand logo sources',
  '',
  'Local brand marks are downloaded from Google\'s favicon service using each manufacturer\'s official domain. Brand names remain visible beside each mark for clarity and accessibility.',
  '',
  '| Brand | Official domain | Local asset |',
  '| --- | --- | --- |',
]

for (const [name, domain] of Object.entries(brands)) {
  const urls = [
    `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(`https://${domain}`)}&sz=128`,
    `https://icon.horse/icon/${domain}`,
  ]
  let response
  for (const url of urls) {
    const candidate = await fetch(url)
    if (candidate.ok) {
      response = candidate
      break
    }
  }
  if (!response) throw new Error(`${name}: no logo source returned an image`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 100) throw new Error(`${name}: favicon response is unexpectedly small`)
  const filename = `${slug(name)}.png`
  await fs.writeFile(path.join(output, filename), bytes)
  sourceLines.push(`| ${name} | https://${domain} | ${filename} |`)
  console.log(`${name}: ${filename} (${bytes.length} bytes)`)
}

await fs.writeFile(path.join(output, 'SOURCES.md'), `${sourceLines.join('\n')}\n`)
