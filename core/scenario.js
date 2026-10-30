// Generador de escenarios sintéticos (spec §5.3). Puro: el azar entra por `rng`.
// Cuentas ficticias, IP de rangos reservados para documentación (RFC 5737), ciudades genéricas (claves de lista cerrada).
const DOC_NETS = ['192.0.2', '198.51.100', '203.0.113']
const CITY_PAIRS = [
  ['north-city', 'south-city'],
  ['east-city', 'west-city'],
  ['coast-city', 'inland-city'],
]

const int = (rng, n) => Math.floor(rng() * n)
const base = (rng, kind) => ({
  accountLabel: `demo-account-${String(1 + int(rng, 99)).padStart(2, '0')}`,
  sourceIp: `${DOC_NETS[int(rng, DOC_NETS.length)]}.${1 + int(rng, 254)}`,
  kind,
})

const BUILD = {
  A: (rng) => ({
    signals: { failedAttempts: 14, windowSeconds: 40, impliedSpeedKmh: 0, bulkExport: false, localMinutes: 12 * 60 },
    input: { ...base(rng, 'A'), params: { failedAttempts: 14, windowSeconds: 40 } },
  }),
  B: (rng) => {
    const [fromCity, toCity] = CITY_PAIRS[int(rng, CITY_PAIRS.length)]
    const distanceKm = 9000
    const minutes = 12
    const impliedSpeedKmh = distanceKm / (minutes / 60)
    return {
      signals: { failedAttempts: 0, windowSeconds: 60, impliedSpeedKmh, bulkExport: false, localMinutes: 12 * 60 },
      input: { ...base(rng, 'B'), params: { fromCity, toCity, distanceKm, minutes, impliedSpeedKmh } },
    }
  },
  C: (rng) => ({
    signals: { failedAttempts: 0, windowSeconds: 60, impliedSpeedKmh: 0, bulkExport: true, localMinutes: 3 * 60 + 12 },
    input: { ...base(rng, 'C'), params: { action: 'bulkExport', localTime: '03:12', orgZone: 'org' } },
  }),
}

export function scenario(id, rng) {
  if (!Object.hasOwn(BUILD, id)) return { ok: false, reason: 'unknown-scenario' }
  return BUILD[id](rng)
}

export function pickScenario(rng) {
  return ['A', 'B', 'C'][int(rng, 3)]
}
