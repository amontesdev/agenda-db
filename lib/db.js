import { createClient } from "@libsql/client";

/* ─────────────────────────────────────────────────────────────────────────
   El mismo código funciona en local Y en producción:
   - Local:      TURSO_DATABASE_URL=file:local.db  (sin token)
   - Producción: TURSO_DATABASE_URL=libsql://...   (con token de Turso)
───────────────────────────────────────────────────────────────────────── */
export const db = createClient({
  url:       process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/* ─── Schema ──────────────────────────────────────────────────────────────
   Una sola tabla: cada fila = (dia, opcion) con sus bloques en JSON.
   UNIQUE(day, option) → upsert limpio al guardar.
───────────────────────────────────────────────────────────────────────── */
export async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      day        TEXT    NOT NULL,
      option     INTEGER NOT NULL,
      blocks     TEXT    NOT NULL DEFAULT '[]',
      updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(day, option)
    )
  `);
}
