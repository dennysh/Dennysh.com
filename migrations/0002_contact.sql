-- Límite de tasa del formulario de contacto (correcciones 2, D4). Idempotente. Solo guarda HMAC de la IP y del correo (con la clave del
-- visitante) y la hora: nunca el mensaje, el nombre ni el correo en claro. Se purga a las 25 h.
CREATE TABLE IF NOT EXISTS contact_slots (
  id TEXT PRIMARY KEY,
  byIp TEXT NOT NULL,
  byMail TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_at ON contact_slots (at);
CREATE INDEX IF NOT EXISTS idx_contact_ip ON contact_slots (byIp, at);
CREATE INDEX IF NOT EXISTS idx_contact_mail ON contact_slots (byMail, at);
