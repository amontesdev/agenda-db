import { NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await initDB(); dbReady = true; }
}

/* ────────────────────────────────────────────────────────────────────────
   GET /api/agenda?day=semana&option=1
   Retorna los bloques guardados para ese día/opción.
   Si no existe aún → 404 (el frontend usa el preset por defecto).
──────────────────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    await ensureDB();
    const { searchParams } = new URL(req.url);
    const day    = searchParams.get("day");
    const option = searchParams.get("option");

    if (!day || !option) {
      return NextResponse.json({ error: "Faltan parámetros: day, option" }, { status: 400 });
    }

    const result = await db.execute({
      sql:  "SELECT blocks, updated_at FROM schedules WHERE day = ? AND option = ?",
      args: [day, parseInt(option)],
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
      updated_at: row.updated_at,
    });

  } catch (err) {
    console.error("[GET /api/agenda]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ────────────────────────────────────────────────────────────────────────
   POST /api/agenda
   Body: { day: "semana", option: 1, blocks: [...] }
   Upsert: inserta o actualiza si ya existe (day, option).
──────────────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    await ensureDB();
    const body = await req.json();
    const { day, option, blocks } = body;

    if (!day || !option || !Array.isArray(blocks)) {
      return NextResponse.json({ error: "Body inválido: se requiere day, option, blocks[]" }, { status: 400 });
    }

    await db.execute({
      sql: `
        INSERT INTO schedules (day, option, blocks, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(day, option) DO UPDATE SET
          blocks     = excluded.blocks,
          updated_at = excluded.updated_at
      `,
      args: [day, parseInt(option), JSON.stringify(blocks)],
    });

    return NextResponse.json({ ok: true, day, option, saved: blocks.length });

  } catch (err) {
    console.error("[POST /api/agenda]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
