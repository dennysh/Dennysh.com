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

  describe('falsos negativos conocidos (revisión T092)', () => {
    const must = {
      'JSON con la clave entre comillas': '{"TELEGRAM_BOT_TOKEN": "abc123secretvalue"}',
      'token dentro de la URL de la API': 'fetch("https://api.telegram.org/bot123456789:AAHabcdefghijklmnopqrstuvwxyz0123456/sendMessage")',
      'minúsculas y camelCase': 'const apiKey = "sk_live_abcdefghijklmnopqrstuvwx"',
      'clave AWS': 'aws = "AKIAIOSFODNN7EXAMPLE"',
      'token de GitHub': 'GH=ghp_abcdefghijklmnopqrstuvwxyz0123456789',
      'clave HMAC en variable de entorno': 'EVENT_HMAC_KEY=deadbeefdeadbeefdeadbeef',
      'cabecera Bearer': 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345',
      'valor de prueba con sufijo real pegado': 'TURNSTILE_SECRET=1x0000000000000000000000000000000AAreal',
    }
    for (const [name, line] of Object.entries(must)) {
      it(`detecta: ${name}`, () => expect(scanText('x.js', line).length).toBeGreaterThan(0))
    }
    const mustNot = [
      'turnstileToken: "t"',
      "const token = await getToken()",
      "const token = 'x'.repeat(2049)",
      "TELEGRAM_BOT_TOKEN=",
      "'TELEGRAM_BOT_TOKEN=000000000:e2e-token-invalido-no-existe-000000000',",
      "apiKey: process.env.KEY",
      "const bearer = 'Bearer'",
    ]
    for (const line of mustNot) it(`no marca: ${line}`, () => expect(scanText('x.js', line)).toEqual([]))
  })
})
