import { NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";
import { requireUser } from "@/lib/auth/server";

let dbReady = false;

async function ensureDB() {
  if (!dbReady) { 
    await initDB(); 
    dbReady = true; 
  }
}

export async function GET(req) {
  try {
    const user = await requireUser(req);

    const { searchParams } = new URL(req.url);
    const day    = searchParams.get("day");
    const option = searchParams.get("option");

    if (!day || !option) {
      return NextResponse.json({ error: "Faltan parámetros: day, option" }, { status: 400 });
    }

    await ensureDB();

    const result = await db.execute({
      sql:  "SELECT blocks, start_time, updated_at FROM schedules WHERE user_id = ? AND day = ? AND option = ?",
      args: [user.uid, day, parseInt(option)],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      found:      true,
      day,
      option:     parseInt(option),
      blocks:     JSON.parse(row.blocks),
      startTime:  row.start_time || "04:30",
      updated_at: row.updated_at,
    });

  } catch (err) {
    console.error("[GET /api/agenda]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser(req);
    await ensureDB();
    
    const body = await req.json();
    const { day, option, blocks, startTime } = body;

    if (!day || !option || !Array.isArray(blocks)) {
      return NextResponse.json({ error: "Body inválido: se requiere day, option, blocks[]" }, { status: 400 });
    }

    const st = startTime || "04:30";

    await db.execute({
      sql: `
        INSERT INTO schedules (user_id, day, option, blocks, start_time, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, day, option) DO UPDATE SET
          blocks     = excluded.blocks,
          start_time = excluded.start_time,
          updated_at = excluded.updated_at
      `,
      args: [user.uid, day, parseInt(option), JSON.stringify(blocks), st],
    });

    return NextResponse.json({ ok: true, day, option, saved: blocks.length });

  } catch (err) {
    console.error("[POST /api/agenda]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}