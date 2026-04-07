import { createClient } from "@libsql/client";

export const db = createClient({
  url:       process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function tableExists(name) {
  const res = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [name],
  });
  return Array.isArray(res?.rows) && res.rows.length > 0;
}

async function columnExists(table, column) {
  const res = await db.execute(`PRAGMA table_info(${table})`);
  return Array.isArray(res?.rows) && res.rows.some((row) => {
    const value = row?.name ?? row?.Name;
    return value === column;
  });
}

async function createSchedulesTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL,
      day        TEXT    NOT NULL,
      option     INTEGER NOT NULL,
      blocks     TEXT    NOT NULL DEFAULT '[]',
      start_time TEXT    NOT NULL DEFAULT '04:30',
      updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, day, option)
    )
  `);
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_user_day_option ON schedules(user_id, day, option)`);
}

async function migrateSchedulesTable() {
  await db.execute("ALTER TABLE schedules RENAME TO schedules_legacy");
  await createSchedulesTable();
  await db.execute(`
    INSERT INTO schedules (user_id, day, option, blocks, start_time, updated_at)
    SELECT '__legacy__', day, option, blocks, COALESCE(start_time, '04:30'), updated_at
    FROM schedules_legacy
  `);
  await db.execute("DROP TABLE schedules_legacy");
}

async function createCustomTasksTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL,
      name       TEXT    NOT NULL,
      emoji      TEXT    NOT NULL DEFAULT '📌',
      color      TEXT    NOT NULL DEFAULT '#94a3b8',
      bg         TEXT    NOT NULL DEFAULT '#0a1020',
      border     TEXT    NOT NULL DEFAULT '#334155',
      mins       INTEGER NOT NULL DEFAULT 30,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_custom_tasks_user ON custom_tasks(user_id, created_at)`);
}

async function migrateCustomTasksTable() {
  await db.execute("ALTER TABLE custom_tasks RENAME TO custom_tasks_legacy");
  await createCustomTasksTable();
  await db.execute(`
    INSERT INTO custom_tasks (id, user_id, name, emoji, color, bg, border, mins, created_at)
    SELECT id, '__legacy__', name, emoji, color, bg, border, mins, created_at
    FROM custom_tasks_legacy
  `);
  await db.execute("DROP TABLE custom_tasks_legacy");
}

export async function initDB() {
  if (!(await tableExists("schedules"))) {
    await createSchedulesTable();
  } else if (!(await columnExists("schedules", "user_id"))) {
    await migrateSchedulesTable();
  } else {
    await createSchedulesTable();
  }

  if (!(await tableExists("custom_tasks"))) {
    await createCustomTasksTable();
  } else if (!(await columnExists("custom_tasks", "user_id"))) {
    await migrateCustomTasksTable();
  } else {
    await createCustomTasksTable();
  }
}
