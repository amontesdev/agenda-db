import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function resolveCredentials() {
  const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed?.project_id || !parsed?.client_email || !parsed?.private_key) {
      throw new Error("Invalid FIREBASE_ADMIN_CREDENTIALS_B64 payload");
    }
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };
  }

  throw new Error("Missing Firebase admin credentials. Set FIREBASE_ADMIN_CREDENTIALS_B64 or the PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY trio.");
}

export function getFirebaseAdminApp() {
  if (!getApps().length) {
    const credentials = resolveCredentials();
    initializeApp({
      credential: cert({
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key,
      }),
    });
  }
  return getApp();
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
