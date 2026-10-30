import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createD1 } from '../helpers/d1.js'

describe('migración 0001 (T030)', () => {
  it('se aplica limpia sobre una base vacía y otra vez sin error', () => {
    const db = createD1({ migrate: false })
    const sql = readFileSync('migrations/0001_init.sql', 'utf8')
    db.raw.exec(sql)
    db.raw.exec(sql)
    const tables = db.raw.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name)
    expect(tables).toEqual(['alert_slots', 'breaker', 'events', 'interventions'])
  })

  it('no existe ninguna columna para la IP en claro ni para texto libre', () => {
    const db = createD1()
    const cols = ['events', 'interventions', 'alert_slots', 'breaker'].flatMap((t) =>
      db.raw.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name.toLowerCase()),
    )
    expect(cols.filter((c) => /(^|_)ip($|_)|address|email|name$/.test(c))).toEqual([])
  })

  it('rechaza una cuarta intervención y acciones desconocidas por restricción', () => {
    const db = createD1()
    const ins = (seq, action) => db.raw.prepare('INSERT INTO interventions VALUES (?,?,?,?,?,?)').run('e', seq, action, 1, 'p', 'h')
    ins(1, 'approve')
    expect(() => ins(4, 'approve')).toThrow()
    expect(() => ins(2, 'delete')).toThrow()
    expect(() => ins(1, 'override')).toThrow()
  })
})
