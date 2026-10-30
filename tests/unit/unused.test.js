import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkUnused } from '../../scripts/static/unused.mjs'

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'unused-'))
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(join(root, p, '..'), { recursive: true })
    writeFileSync(join(root, p), text)
  }
  return root
}

describe('checkUnused (T093)', () => {
  const base = { 'src/main.jsx': "import A from './A.jsx'\nimport './a.css'", 'src/A.jsx': "import B from './sub/B.jsx'", 'src/sub/B.jsx': '', 'src/a.css': '', 'src/entry-server.jsx': '', 'index.html': '' }
  it('sin sobrantes pasa', () => expect(checkUnused({ root: fixture(base) })).toEqual([]))
  it('detecta un archivo de src que nadie importa', () => {
    expect(checkUnused({ root: fixture({ ...base, 'src/Old.jsx': '' }) })).toEqual(['src/Old.jsx: no se importa desde ninguna entrada'])
  })
  it('un archivo solo importado por otro sobrante también cuenta como sobrante', () => {
    const p = checkUnused({ root: fixture({ ...base, 'src/Old.jsx': "import './old.css'", 'src/old.css': '' }) })
    expect(p.sort()).toEqual(['src/Old.jsx: no se importa desde ninguna entrada', 'src/old.css: no se importa desde ninguna entrada'])
  })
  it('respeta la lista de conservados', () => {
    expect(checkUnused({ root: fixture({ ...base, 'src/data/x.js': '' }), keep: ['src/data/'] })).toEqual([])
  })
  it('detecta una imagen de public que no se referencia y acepta la referenciada', () => {
    const root = fixture({ ...base, 'src/main.jsx': base['src/main.jsx'] + "\nconst x = '/images/usada.png'", 'public/images/usada.png': '', 'public/images/vieja.png': '', 'public/_headers': '' })
    expect(checkUnused({ root })).toEqual(['public/images/vieja.png: no se referencia en el código'])
  })
})
