// Genera la versión de móvil del retrato (360 px de ancho) con el Chromium de Playwright: canvas → WebP (conserva el alfa y no
// escribe metadatos). Sin dependencias nuevas. Uso: node scripts/make-portrait-small.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { stripMetadata } from './static/webp-meta.mjs'

const SRC = 'public/images/dennys-portrait.webp'
const OUT = 'public/images/dennys-portrait-360.webp'
const WIDTH = 360
const QUALITY = 0.8

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const b64 = readFileSync(SRC).toString('base64')
  const dataUrl = await page.evaluate(async ([data, w, q]) => {
    const img = new Image()
    img.src = `data:image/webp;base64,${data}`
    await img.decode()
    const h = Math.round((img.naturalHeight * w) / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/webp', q)
  }, [b64, WIDTH, QUALITY])
  // Chromium añade un perfil ICC: se quita para que el archivo no lleve ningún metadato.
  writeFileSync(OUT, stripMetadata(Buffer.from(dataUrl.split(',')[1], 'base64')))
  console.log(`${OUT} generado`)
} finally {
  await browser.close()
}
