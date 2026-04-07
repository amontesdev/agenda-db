import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!email.endsWith("@yourcompany.com") && !process.env.ALLOW_ANY_EMAIL) {
      return NextResponse.json({ error: "Only @yourcompany.com emails are allowed" }, { status: 403 });
    }

    const auth = getFirebaseAdminAuth();
    const userRecord = await auth.createUser({
      email,
      emailVerified: false,
      disabled: false,
    });

    if (role) {
      await auth.setCustomUserClaims(userRecord.uid, { role });
    }

    const resetLink = await auth.generatePasswordResetLink(email);

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
      email: userRecord.email,
      activationLink: resetLink,
      message: "User created. Send them the activation link.",
    });

  } catch (err) {
    console.error("[POST /api/admin/invite]", err);
    if (err.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const auth = getFirebaseAdminAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const maxResults = 20;

    const listResult = await auth.listUsers(null, maxResults);
    const users = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      emailVerified: u.emailVerified,
      disabled: u.disabled,
      customClaims: u.customClaims,
      createdAt: u.metadata.creationTime,
      lastLoginAt: u.metadata.lastLoginTime,
    }));

    return NextResponse.json({ users, nextPageToken: listResult.pageToken });

  } catch (err) {
    console.error("[GET /api/admin/invite]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}