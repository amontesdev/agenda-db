import { createClient } from "@libsql/client";

const LOCAL_URL = "file:local.db";

let prodClient = null;
let localClient = null;

function getProdClient() {
  if (!prodClient) {
    const url = process.env.TURSO_DATABASE_URL;
    console.log("[getProdClient] TURSO_DATABASE_URL:", url);
    console.log("[getProdClient] TURSO_AUTH_TOKEN:", process.env.TURSO_AUTH_TOKEN ? "set" : "not set");
    prodClient = createClient({
      url:       url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return prodClient;
}

function getLocalClient() {
  if (!localClient) {
    localClient = createClient({
      url:       LOCAL_URL,
      authToken: null,
    });
  }
  return localClient;
}

export function getDb(useProduction = false) {
  if (useProduction && process.env.TURSO_DATABASE_URL) {
    return getProdClient();
  }
  return getLocalClient();
}

export const db = getLocalClient();

export async function initDB(useProduction = false) {
  const client = getDb(useProduction);
  await client.execute(`
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

  await client.execute(`
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
