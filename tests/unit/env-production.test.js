import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// La clave PÚBLICA de Turnstile de producción va versionada; ningún secreto puede acompañarla (regla 20).
const SITEKEY = '0x4AAAAAAFsOLrEqwEOsvjRo'

describe('.env.production (clave pública de Turnstile)', () => {
  it('existe y git no lo ignora (va versionado)', () => {
    expect(existsSync('.env.production')).toBe(true)
    const ignored = spawnSync('git', ['check-ignore', '-q', '.env.production']).status === 0
    expect(ignored).toBe(false)
  })
  it('contiene exactamente la clave pública y ninguna otra variable', () => {
    const lines = readFileSync('.env.production', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    expect(lines).toEqual([`VITE_TURNSTILE_SITEKEY=${SITEKEY}`])
  })
})
