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
    await ensureDB();

    const result = await db.execute({
      sql: "SELECT * FROM custom_tasks WHERE user_id = ? ORDER BY created_at DESC",
      args: [user.uid],
    });

    const tasks = (result?.rows ?? []).map(row => {
      const plain = {};
      for (const [key, value] of Object.entries(row ?? {})) {
        plain[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return plain;
    });

    return NextResponse.json({ tasks });

  } catch (err) {
    console.error("[GET /api/tasks]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser(req);
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
        INSERT INTO custom_tasks (user_id, name, emoji, color, bg, border, mins)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        user.uid,
        name,
        emoji || "📌",
        color || "#94a3b8",
        bg || "#0a1020",
        border || "#334155",
        mins || 30,
      ],
    });

    const lastRow = await db.execute("SELECT last_insert_rowid() as id");
    const rawId = lastRow?.rows?.[0]?.id;
    const insertId = rawId !== undefined && rawId !== null
      ? (typeof rawId === "bigint" ? Number(rawId) : rawId)
      : Date.now();

    return NextResponse.json({ ok: true, id: insertId });

  } catch (err) {
    console.error("[POST /api/tasks]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await ensureDB();

    const numericId = Number(id);

    if (!id || !Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM custom_tasks WHERE id = ? AND user_id = ?",
      args: [numericId, user.uid],
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[DELETE /api/tasks]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await ensureDB();

    const numericId = Number(id);

    if (!id || !Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
    }

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

    await db.execute({
      sql: `
        UPDATE custom_tasks
        SET name = ?,
            emoji = ?,
            color = ?,
            bg    = ?,
            border = ?,
            mins  = ?
        WHERE id = ? AND user_id = ?
      `,
      args: [
        name,
        emoji || "📌",
        color || "#94a3b8",
        bg || `${color || "#94a3b8"}22`,
        border || color || "#334155",
        Number.isFinite(Number(mins)) ? Number(mins) : 30,
        numericId,
        user.uid,
      ],
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[PUT /api/tasks]", err);
    const status = err.status || 500;
    const message = err.message || "Internal error";
    return NextResponse.json({ error: message }, { status });
  }
}