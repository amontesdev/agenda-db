import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import { getFirebaseAdminAuth } from "../lib/firebaseAdmin.js";

console.log("CREDENTIALS_B64:", process.env.FIREBASE_ADMIN_CREDENTIALS_B64?.slice(0, 50));

const uid = process.argv[2];

if (!uid) {
  console.error("Usage: node scripts/set-admin.js <USER_UID>");
  console.error("Get the UID from Firebase Console → Authentication → select user → copy UID");
  process.exit(1);
}

async function main() {
  const auth = getFirebaseAdminAuth();
  await auth.setCustomUserClaims(uid, { role: "admin" });
  console.log(`✓ User ${uid} is now admin`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});