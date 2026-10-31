// Lector de fragmentos RIFF de WebP, sin dependencias (AC-H9, AC-H13): sin EXIF, XMP ni perfil ICC, y ≤ 90 KB.
export const MAX_KB = 90

export function webpInfo(buf) {
  const tag = (o) => buf.toString('ascii', o, o + 4)
  if (buf.length < 21 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null
  const chunks = []
  const at = []
  let truncated = false
  for (let o = 12; o + 8 <= buf.length;) {
    const n = buf.readUInt32LE(o + 4)
    if (o + 8 + n > buf.length) { truncated = true; break } // el fragmento declara más bytes de los que hay
    chunks.push(tag(o))
    at.push(o)
    o += 8 + n + (n & 1)
  }
  if (!chunks.length) return null
  const f = chunks[0] === 'VP8X' ? buf[20] : 0
  const flags = { icc: !!(f & 0x20), alpha: !!(f & 0x10), exif: !!(f & 0x08), xmp: !!(f & 0x04) }
  let width
  let height
  const d = at[0] + 8
  if (chunks[0] === 'VP8X' && d + 10 <= buf.length) { width = 1 + buf.readUIntLE(d + 4, 3); height = 1 + buf.readUIntLE(d + 7, 3) }
  else if (chunks[0] === 'VP8 ' && d + 10 <= buf.length) { width = buf.readUInt16LE(d + 6) & 0x3fff; height = buf.readUInt16LE(d + 8) & 0x3fff }
  else if (chunks[0] === 'VP8L' && d + 5 <= buf.length) { const v = buf.readUInt32LE(d + 1); width = (v & 0x3fff) + 1; height = ((v >> 14) & 0x3fff) + 1 }
  const riffOk = buf.readUInt32LE(4) === buf.length - 8
  const hasMetadata = chunks.some((c) => ['EXIF', 'XMP ', 'ICCP'].includes(c)) || flags.exif || flags.xmp || flags.icc
  return { chunks, flags, width, height, hasMetadata, truncated, riffOk }
}

export function checkWebp(path, buf, maxKb = MAX_KB) {
  const i = webpInfo(buf)
  if (!i) return [`${path}: no es un WebP válido`]
  const problems = []
  if (i.truncated || !i.riffOk) problems.push(`${path}: WebP truncado o con el tamaño RIFF incoherente`)
  for (const c of ['EXIF', 'XMP ', 'ICCP']) if (i.chunks.includes(c)) problems.push(`${path}: lleva metadatos (${c.trim()})`)
  if (i.flags.exif) problems.push(`${path}: bandera EXIF encendida`)
  if (i.flags.xmp) problems.push(`${path}: bandera XMP encendida`)
  if (i.flags.icc) problems.push(`${path}: bandera ICC encendida`)
  if (buf.length > maxKb * 1024) problems.push(`${path}: pesa ${(buf.length / 1024).toFixed(1)} KB (máximo ${maxKb} KB)`)
  return problems
}

// Quita los fragmentos EXIF, XMP e ICCP y apaga sus banderas de VP8X; recalcula el tamaño RIFF. Deja intactos los de imagen.
export function stripMetadata(buf) {
  const info = webpInfo(buf)
  if (!info || info.truncated) throw new Error('no es un WebP válido (vacío o truncado)')
  const parts = [buf.subarray(0, 12)]
  for (let o = 12; o + 8 <= buf.length;) {
    const n = buf.readUInt32LE(o + 4)
    const end = o + 8 + n + (n & 1)
    const id = buf.toString('ascii', o, o + 4)
    if (!['EXIF', 'XMP ', 'ICCP'].includes(id)) {
      const chunk = Buffer.from(buf.subarray(o, Math.min(end, buf.length)))
      if (id === 'VP8X') chunk[8] &= ~(0x20 | 0x08 | 0x04)
      parts.push(chunk)
    }
    o = end
  }
  const out = Buffer.concat(parts)
  out.writeUInt32LE(out.length - 8, 4)
  return out
}
