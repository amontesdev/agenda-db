import { NextResponse } from "next/server";
import { getDb, initDB } from "@/lib/db";

const dbCache = { local: false, prod: false };

async function ensureDB(useProduction) {
  if (!dbCache[useProduction ? "prod" : "local"]) { 
    await initDB(useProduction); 
    dbCache[useProduction ? "prod" : "local"] = true; 
  }
}

/* ────────────────────────────────────────────────────────────────────────
   GET /api/tasks
   Retorna todas las tareas personalizadas.
──────────────────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const prodParam = searchParams.get("prod");
    const prod = prodParam === "true" || (prodParam === null && !!process.env.TURSO_DATABASE_URL);
    
    await ensureDB(prod);
    const client = getDb(prod);
    
    const result = await client.execute({
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
    const { searchParams } = new URL(req.url);
    const prodParam = searchParams.get("prod");
    const prod = prodParam === "true" || (prodParam === null && !!process.env.TURSO_DATABASE_URL);
    
    console.log("[POST /api/tasks] prod:", prod);
    
    await ensureDB(prod);
    const client = getDb(prod);
    
    console.log("[POST /api/tasks] client:", client);
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[POST /api/tasks] JSON parse error:", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    console.log("[POST /api/tasks] body:", body);
    
    const { name, emoji, color, bg, border, mins } = body || {};

    if (!name) {
      return NextResponse.json({ error: "Se requiere name" }, { status: 400 });
    }

    console.log("[POST /api/tasks] inserting...");
    const result = await client.execute({
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

    console.log("[POST /api/tasks] Insert result:", result);

    const lastRow = await client.execute("SELECT last_insert_rowid() as id");
    console.log("[POST /api/tasks] Last row:", lastRow);
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
    const prodParam = searchParams.get("prod");
    const prod = prodParam === "true" || (prodParam === null && !!process.env.TURSO_DATABASE_URL);
    const id = searchParams.get("id");

    await ensureDB(prod);
    const client = getDb(prod);

    if (!id) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM custom_tasks WHERE id = ?",
      args: [parseInt(id)],
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[DELETE /api/tasks]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
