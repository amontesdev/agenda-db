"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export function getFirebaseApp() {
  if (!firebaseConfig.apiKey) {
    throw new Error("Missing Firebase client configuration. Check NEXT_PUBLIC_FIREBASE_* env vars.");
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApp();
}

let auth;

export async function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    await setPersistence(auth, browserLocalPersistence);
  }
  return auth;
}
