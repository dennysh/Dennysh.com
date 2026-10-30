import { describe, it, expect } from 'vitest'
import { scanText } from '../../scripts/lib/scan-secrets.mjs'

describe('scanText', () => {
  it('detecta un token de bot de Telegram', () => {
    const hits = scanText('x.js', 'const t = "123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456"')
    expect(hits.map((h) => h.rule)).toContain('telegram-bot-token')
  })

  it('detecta una variable secreta con valor', () => {
    const hits = scanText('.env', 'TELEGRAM_BOT_TOKEN=abc123\n')
    expect(hits.map((h) => h.rule)).toContain('secret-assignment')
  })

  it('no marca una variable secreta vacía ni un marcador', () => {
    expect(scanText('.env.example', 'TELEGRAM_BOT_TOKEN=\nTURNSTILE_SECRET=<valor>\n')).toEqual([])
  })

  it('no marca la expansión de shell ${VAR:?mensaje}', () => {
    expect(scanText('t.sh', ': "${X_API_KEY:?X_API_KEY not set}"')).toEqual([])
  })

  it('no marca texto normal', () => {
    expect(scanText('a.md', 'El token caduca a los 300 s.')).toEqual([])
  })

  it('nunca devuelve el valor encontrado, solo archivo, línea y regla', () => {
    const [hit] = scanText('.env', 'API_SECRET=supersecreto')
    expect(Object.keys(hit).sort()).toEqual(['file', 'line', 'rule'])
    expect(JSON.stringify(hit)).not.toContain('supersecreto')
  })

  it('los valores de prueba conocidos (Turnstile de prueba, token falso de e2e) no se marcan', () => {
    expect(scanText('playwright.config.js', "'TURNSTILE_SECRET=1x0000000000000000000000000000000AA',")).toEqual([])
    expect(scanText('playwright.config.js', "'TELEGRAM_BOT_TOKEN=000000000:e2e-token-invalido-no-existe-000000000',")).toEqual([])
  })

  it('pero un token distinto en la misma línea sigue marcándose', () => {
    expect(scanText('x.js', "TELEGRAM_BOT_TOKEN=123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456").length).toBeGreaterThan(0)
    expect(scanText('x.js', "TURNSTILE_SECRET=0x4AAAAAAAreal-secret-value").length).toBeGreaterThan(0)
  })
})
