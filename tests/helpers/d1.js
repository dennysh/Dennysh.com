// Doble de D1 sobre node:sqlite (D1 es SQLite): misma forma prepare().bind().run()/first()/all().
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'

export function createD1({ migrate = true } = {}) {
  const raw = new DatabaseSync(':memory:')
  if (migrate) raw.exec(readFileSync('migrations/0001_init.sql', 'utf8'))
  const state = { down: false }
  const guard = () => {
    if (state.down) throw new Error('D1 down (inyectado)')
  }
  return {
    raw,
    state,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              guard()
              const r = raw.prepare(sql).run(...args)
              return { success: true, meta: { changes: Number(r.changes) } }
            },
            async first() {
              guard()
              return raw.prepare(sql).get(...args) ?? null
            },
            async all() {
              guard()
              return { results: raw.prepare(sql).all(...args) }
            },
          }
        },
      }
    },
  }
}
