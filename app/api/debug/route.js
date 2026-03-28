import { NextResponse } from "next/server";

export async function GET(req) {
  return NextResponse.json({
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "set" : "not set",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "set" : "not set",
  });
}
