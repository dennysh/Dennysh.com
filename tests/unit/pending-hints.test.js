import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { stripPendingHints } from '../../scripts/vite-plugin-strip-pending-hints.mjs'
import { checkNoPendingHints } from '../../scripts/static/site.mjs'
import { collectPending } from '../../src/content/site.js'

// Verificación del supervisor (2026-10-31): las pistas internas de los marcadores no deben viajar en el JS público; solo id y estado.
describe('stripPendingHints (transformación del build)', () => {
  it('quita la pista y deja el id y la etiqueta pública', () => {
    expect(stripPendingHints("x: pending('P-04', 'Pista interna larga', 'Etiqueta pública')")).toBe("x: pending('P-04', '', 'Etiqueta pública')")
  })
  it('sin etiqueta: solo id y pista vacía', () => {
    expect(stripPendingHints("pending('P-06', 'URL correcta')")).toBe("pending('P-06', '')")
  })
  it('respeta comillas escapadas y comillas dobles', () => {
    expect(stripPendingHints("pending('P-1', 'it\\'s a hint, with \"quotes\"')")).toBe("pending('P-1', '')")
    expect(stripPendingHints('pending("P-2", "otra pista", "etiqueta")')).toBe("pending(\"P-2\", '', \"etiqueta\")")
  })
  it('no toca otras llamadas ni el texto que no es un marcador', () => {
    const code = "const a = other('P-04', 'no es un marcador'); // pending(id, pista)"
    expect(stripPendingHints(code)).toBe(code)
  })
  it('sobre el contenido real: ninguna pista de ningún P-<n> sobrevive, pero los ids y las etiquetas sí', () => {
    const out = stripPendingHints(readFileSync('src/content/site.js', 'utf8'))
    const all = collectPending()
    expect(all.length).toBeGreaterThan(0)
    for (const p of all) {
      expect(out, `pista de ${p.id}`).not.toContain(p.hint)
      expect(out).toContain(`'${p.id}'`)
      if (p.label) expect(out).toContain(p.label)
    }
  })
})

describe('checkNoPendingHints (compuerta sobre dist/)', () => {
  const pendings = [{ id: 'P-29', hint: 'Fotos de la galería: Dennys las entrega en unos días' }, { id: 'P-09', hint: 'Disponibilidad' }]
  it('pasa si el bundle solo lleva el id y el estado', () => {
    expect(checkNoPendingHints([{ path: 'dist/assets/a.js', text: 'var x={pending:!0,id:"P-29",hint:""}' }], pendings)).toEqual([])
  })
  it('falla si el bundle lleva la pista de cualquiera de los marcadores', () => {
    const bad = checkNoPendingHints([{ path: 'dist/assets/a.js', text: 'var x={pending:!0,id:"P-29",hint:"Fotos de la galería: Dennys las entrega en unos días"}' }], pendings)
    expect(bad.join(' ')).toMatch(/P-29/)
    expect(checkNoPendingHints([{ path: 'dist/assets/a.js', text: 'hint:"Disponibilidad"' }], pendings).join(' ')).toMatch(/P-09/)
  })
  it('también falla si la pista se ve como pista de marcador en el HTML ([pista · P-n])', () => {
    expect(checkNoPendingHints([{ path: 'dist/es/index.html', text: '<span>[Disponibilidad · P-09]</span>' }], pendings).length).toBe(1)
  })
  it('falla con la llamada sin transformar pending("P-n", "pista")', () => {
    expect(checkNoPendingHints([{ path: 'dist/assets/a.js', text: 'x=pending("P-09","Disponibilidad")' }], pendings).length).toBe(1)
    expect(checkNoPendingHints([{ path: 'dist/assets/a.js', text: "x=pending('P-09', 'Disponibilidad')" }], pendings).length).toBe(1)
  })
  it('no marca como pista una palabra igual que aparece en texto legítimo (p. ej. el título "Disponibilidad" de los Términos)', () => {
    const ok = [{ path: 'dist/es/terminos/index.html', text: '<h2>Disponibilidad</h2>' }, { path: 'dist/assets/a.js', text: '["Disponibilidad","El sitio se ofrece tal cual"]' }]
    expect(checkNoPendingHints(ok, pendings)).toEqual([])
  })
})
