import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const sourcePath = path.resolve('mmm/page_generator_tool/sample_data.js')
const outputPath = path.resolve('data/source-content.json')
const context = {window: {}}
vm.runInNewContext(await fs.readFile(sourcePath, 'utf8'), context)
await fs.mkdir(path.dirname(outputPath), {recursive: true})
await fs.writeFile(outputPath, `${JSON.stringify(context.window.SAMPLE_DATA, null, 2)}\n`)
console.log(`Wrote ${outputPath}`)
