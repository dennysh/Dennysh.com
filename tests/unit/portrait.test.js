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
