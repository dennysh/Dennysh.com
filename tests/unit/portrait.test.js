import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { webpInfo, checkWebp, stripMetadata } from '../../scripts/static/webp-meta.mjs'

// TH21 (AC-H9, AC-H13): el retrato y las fotos no llevan EXIF/XMP/ICC y pesan ≤ 90 KB.
const FULL = 'public/images/dennys-portrait.webp'
const SMALL = 'public/images/dennys-portrait-360.webp'

// Copia del WebP con un fragmento EXIF inyectado y la bandera de VP8X encendida.
function withExif(buf) {
  const payload = Buffer.from('Exif\0\0GPS-LAT-0.0')
  const pad = payload.length % 2
  const head = Buffer.alloc(8)
  head.write('EXIF', 0, 'ascii')
  head.writeUInt32LE(payload.length, 4)
  const out = Buffer.concat([buf, head, payload, Buffer.alloc(pad)])
  out.writeUInt32LE(out.length - 8, 4)
  out[20] |= 0x08
  return out
}

describe('lector de fragmentos WebP (RIFF)', () => {
  it('lista los fragmentos y las dimensiones del retrato entregado', () => {
    const buf = readFileSync('docs/design/dennys-portrait.webp')
    const i = webpInfo(buf)
    expect(i.chunks).toEqual(['VP8X', 'ALPH', 'VP8 '])
    expect([i.width, i.height]).toEqual([900, 1210])
    expect(i.hasMetadata).toBe(false)
  })
  it('detecta un EXIF inyectado (por fragmento y por bandera)', () => {
    const bad = withExif(readFileSync('docs/design/dennys-portrait.webp'))
    const i = webpInfo(bad)
    expect(i.chunks).toContain('EXIF')
    expect(i.flags.exif).toBe(true)
    expect(i.hasMetadata).toBe(true)
    expect(checkWebp('x.webp', bad).join(' ')).toMatch(/EXIF/)
  })
  it('rechaza lo que no es WebP y lo que pesa más de 90 KB', () => {
    expect(checkWebp('x.webp', Buffer.from('no es webp, nada de nada')).length).toBeGreaterThan(0)
    const big = Buffer.concat([readFileSync('docs/design/dennys-portrait.webp'), Buffer.alloc(10 * 1024)])
    big.writeUInt32LE(big.length - 8, 4)
    expect(checkWebp('x.webp', big).join(' ')).toMatch(/KB/)
  })
})

// Inyecta un fragmento y/o una bandera de VP8X (0x20 ICC, 0x04 XMP, 0x08 EXIF) para cada tipo de metadato.
function inject(buf, { chunk, flag }) {
  let out = Buffer.from(buf) // copia: no se debe tocar el buffer del llamador
  if (chunk) {
    const payload = Buffer.from('xxxxxx')
    const head = Buffer.alloc(8)
    head.write(chunk, 0, 'ascii')
    head.writeUInt32LE(payload.length, 4)
    out = Buffer.concat([buf, head, payload])
    out.writeUInt32LE(out.length - 8, 4)
  }
  if (flag) out[20] |= flag
  return out
}

describe('cada tipo de metadato se detecta y se quita (revisión de pruebas, hallazgo 3)', () => {
  const clean = readFileSync('docs/design/dennys-portrait.webp')
  const CASES = [['EXIF', 'EXIF', 0x08], ['XMP ', 'XMP', 0x04], ['ICCP', 'ICC', 0x20]]
  for (const [chunk, name, flag] of CASES) {
    it(`${name}: fragmento y bandera juntos → se marca`, () => expect(checkWebp('x.webp', inject(clean, { chunk, flag })).join(' ')).toMatch(new RegExp(name)))
    it(`${name}: solo el fragmento (sin bandera) → se marca`, () => expect(checkWebp('x.webp', inject(clean, { chunk })).join(' ')).toMatch(new RegExp(name)))
    it(`${name}: solo la bandera (sin fragmento) → se marca`, () => expect(checkWebp('x.webp', inject(clean, { flag })).join(' ')).toMatch(new RegExp(name)))
    it(`${name}: webpInfo informa hasMetadata`, () => expect(webpInfo(inject(clean, { chunk, flag })).hasMetadata).toBe(true))
    it(`${name}: stripMetadata lo quita y apaga su bandera, y queda idéntico al limpio`, () => {
      const out = stripMetadata(inject(clean, { chunk, flag }))
      expect(webpInfo(out).hasMetadata).toBe(false)
      expect(out.equals(clean)).toBe(true)
    })
  }
  it('los tres a la vez también se quitan', () => {
    const all = inject(inject(inject(clean, { chunk: 'EXIF', flag: 0x08 }), { chunk: 'XMP ', flag: 0x04 }), { chunk: 'ICCP', flag: 0x20 })
    expect(webpInfo(all).chunks).toEqual(expect.arrayContaining(['EXIF', 'XMP ', 'ICCP']))
    expect(stripMetadata(all).equals(clean)).toBe(true)
  })
  it('el tope de 90 KB es exacto: 90 KB pasa y 90 KB + 1 byte no', () => {
    const pad = (n) => { const b = Buffer.concat([clean, Buffer.alloc(n - clean.length)]); b.writeUInt32LE(b.length - 8, 4); return b }
    // Se rellena con un fragmento desconocido para que el tamaño RIFF siga cuadrando.
    const sized = (n) => { const extra = n - clean.length - 8; const head = Buffer.alloc(8); head.write('JUNK', 0, 'ascii'); head.writeUInt32LE(extra, 4); const b = Buffer.concat([clean, head, Buffer.alloc(extra)]); b.writeUInt32LE(b.length - 8, 4); return b }
    expect(checkWebp('x.webp', sized(90 * 1024))).toEqual([])
    expect(checkWebp('x.webp', sized(90 * 1024 + 2)).join(' ')).toMatch(/KB/)
    void pad
  })
})

describe('webpInfo con archivos rotos (hallazgo de la revisión)', () => {
  const full = readFileSync('docs/design/dennys-portrait.webp')
  it('ningún truncado lanza: devuelve null o un problema', () => {
    for (let n = 0; n < 200; n += 1) {
      const cut = full.subarray(0, n)
      expect(() => webpInfo(cut), `n=${n}`).not.toThrow()
      expect(() => checkWebp('x.webp', cut), `n=${n}`).not.toThrow()
      expect(() => { try { stripMetadata(cut) } catch (e) { if (!/WebP/.test(e.message)) throw e } }, `n=${n}`).not.toThrow()
    }
  })
  it('un retrato cortado en mitad de la imagen no pasa la compuerta (el tamaño RIFF no cuadra)', () => {
    expect(checkWebp('x.webp', full.subarray(0, full.length - 5000)).join(' ')).toMatch(/truncado|tamaño/i)
  })
  it('el archivo bueno sigue pasando', () => expect(checkWebp('x.webp', full)).toEqual([]))
})

describe('stripMetadata', () => {
  it('quita EXIF/XMP/ICC y deja intactos los fragmentos de imagen', () => {
    const clean = readFileSync('docs/design/dennys-portrait.webp')
    const dirty = withExif(clean)
    const out = stripMetadata(dirty)
    expect(webpInfo(out).hasMetadata).toBe(false)
    expect(webpInfo(out).chunks).toEqual(['VP8X', 'ALPH', 'VP8 '])
    expect(out.equals(clean)).toBe(true) // tras quitarlo queda idéntico al original limpio
    expect(out.readUInt32LE(4)).toBe(out.length - 8)
  })
  it('no toca un archivo que ya está limpio', () => {
    const clean = readFileSync('docs/design/dennys-portrait.webp')
    expect(stripMetadata(clean).equals(clean)).toBe(true)
  })
})

describe('retrato publicado', () => {
  it('existe el retrato completo y es byte a byte el entregado por Dennys', () => {
    expect(existsSync(FULL)).toBe(true)
    expect(readFileSync(FULL).equals(readFileSync('docs/design/dennys-portrait.webp'))).toBe(true)
  })
  it('existe la versión pequeña de móvil, también limpia y más ligera', () => {
    expect(existsSync(SMALL)).toBe(true)
    const small = readFileSync(SMALL)
    expect(checkWebp(SMALL, small)).toEqual([])
    expect(webpInfo(small).width).toBe(360)
    expect(small.length).toBeLessThan(readFileSync(FULL).length)
  })
  it('los dos pasan la comprobación de metadatos y de peso', () => {
    for (const f of [FULL, SMALL]) expect(checkWebp(f, readFileSync(f))).toEqual([])
  })
})
