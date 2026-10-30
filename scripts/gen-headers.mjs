import { writeFileSync } from 'node:fs'
import { renderHeadersFile } from './static/headers.mjs'

writeFileSync('public/_headers', renderHeadersFile())
console.log('public/_headers generado')
