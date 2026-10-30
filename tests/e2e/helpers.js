import { makeAudit } from '../helpers/fixtures.js'

export const DELIVERED = { status: 'Delivered', channel: 'telegram', atUtc: '2026-10-29T07:41:18.115Z', maskedChat: '••••67', messageIdPresent: true }

export async function fixtureAudit(over = {}) {
  const audit = await makeAudit({ eventId: 'ab'.repeat(16) + '.' + 'cd'.repeat(16), nowMs: Date.UTC(2026, 9, 29, 7, 41, 17, 402), alert: DELIVERED, id: 'A', lang: 'es', ...over })
  return audit
}

// Sustituye el script de Cloudflare por un doble que entrega un token al instante (el servidor real sí lo verifica con la clave de prueba).
export async function stubTurnstile(page) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: "window.turnstile={render:function(el,o){setTimeout(function(){o.callback('stub-token')},10);return 'w1'},remove:function(){}}",
    }),
  )
}

export async function mockApi(page, handlers = {}) {
  const calls = []
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    calls.push({ method: req.method(), path: url.pathname, body: req.postData() })
    const h = handlers[`${req.method()} ${url.pathname.startsWith('/api/event/') ? '/api/event/:id' : url.pathname}`]
    if (!h) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"E_NOT_FOUND"}' })
    const r = await h(req)
    return route.fulfill({ status: r.status ?? 200, contentType: 'application/json', body: JSON.stringify(r.body) })
  })
  return calls
}
