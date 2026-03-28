import { createClient } from "@libsql/client";

export const db = createClient({
  url:       process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      day        TEXT    NOT NULL,
      option     INTEGER NOT NULL,
      blocks     TEXT    NOT NULL DEFAULT '[]',
      start_time TEXT    NOT NULL DEFAULT '04:30',
      updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(day, option)
    )
  `);

  try {
    await db.execute("ALTER TABLE schedules ADD COLUMN start_time TEXT NOT NULL DEFAULT '04:30'");
  } catch (e) {
    if (!String(e?.message || "").toLowerCase().includes("duplicate column")) {
      throw e;
    }
  }

  await db.execute("UPDATE schedules SET start_time = '04:30' WHERE start_time IS NULL OR start_time = ''");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      emoji      TEXT    NOT NULL DEFAULT '📌',
      color      TEXT    NOT NULL DEFAULT '#94a3b8',
      bg         TEXT    NOT NULL DEFAULT '#0a1020',
      border     TEXT    NOT NULL DEFAULT '#334155',
      mins       INTEGER NOT NULL DEFAULT 30,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
