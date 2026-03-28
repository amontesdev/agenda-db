import { NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";

let dbReady = false;

async function ensureDB() {
  if (!dbReady) { 
    await initDB(); 
    dbReady = true; 
  }
}

/* ────────────────────────────────────────────────────────────────────────
   GET /api/tasks
   Retorna todas las tareas personalizadas.
──────────────────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    await ensureDB();
    
    const result = await db.execute({
      sql: "SELECT * FROM custom_tasks ORDER BY created_at DESC",
    });

    return NextResponse.json({ tasks: result.rows || [] });

  } catch (err) {
    console.error("[GET /api/tasks]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ────────────────────────────────────────────────────────────────────────
   POST /api/tasks
   Body: { name, emoji, color, bg, border, mins }
   Crea una nueva tarea personalizada.
──────────────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    await ensureDB();
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const { name, emoji, color, bg, border, mins } = body || {};

    if (!name) {
      return NextResponse.json({ error: "Se requiere name" }, { status: 400 });
    }

    const result = await db.execute({
      sql: `
        INSERT INTO custom_tasks (name, emoji, color, bg, border, mins)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        name,
        emoji || "📌",
        color || "#94a3b8",
        bg || "#0a1020",
        border || "#334155",
        mins || 30,
      ],
    });

    const lastRow = await db.execute("SELECT last_insert_rowid() as id");
    const insertId = lastRow?.rows?.[0]?.id || Date.now();

    return NextResponse.json({ ok: true, id: insertId });

  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ────────────────────────────────────────────────────────────────────────
   DELETE /api/tasks?id=X
   Elimina una tarea personalizada.
──────────────────────────────────────────────────────────────────────── */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await ensureDB();

    if (!id) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM custom_tasks WHERE id = ?",
      args: [parseInt(id)],
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[DELETE /api/tasks]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
