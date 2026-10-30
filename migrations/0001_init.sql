-- Esquema de la demo (plan §4). Idempotente: se puede aplicar más de una vez.
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  createdAt INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,
  visitorHash TEXT NOT NULL,
  lang TEXT NOT NULL,
  scenario TEXT NOT NULL,
  recordHash TEXT NOT NULL,
  auditJson TEXT NOT NULL,
  alertJson TEXT NOT NULL,
  alertMessageId INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_expires ON events (expiresAt);

CREATE TABLE IF NOT EXISTS interventions (
  eventId TEXT NOT NULL,
  seq INTEGER NOT NULL CHECK (seq BETWEEN 1 AND 3),
  action TEXT NOT NULL CHECK (action IN ('approve', 'override', 'escalate')),
  at INTEGER NOT NULL,
  prevHash TEXT NOT NULL,
  hash TEXT NOT NULL,
  PRIMARY KEY (eventId, seq)
);

CREATE TABLE IF NOT EXISTS alert_slots (
  id TEXT PRIMARY KEY,
  visitorHash TEXT NOT NULL,
  at INTEGER NOT NULL,
  eventId TEXT,
  status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_slots_at ON alert_slots (at);
CREATE INDEX IF NOT EXISTS idx_slots_visitor ON alert_slots (visitorHash, at);

CREATE TABLE IF NOT EXISTS breaker (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  openUntil INTEGER NOT NULL
);
