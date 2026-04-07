"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, getIdTokenResult } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

const AuthContext = createContext({
  status: "loading",
  user: null,
  token: null,
  claims: {},
  signIn: async () => {},
  signOut: async () => {},
});

async function fetchAuthInstance() {
  return getFirebaseAuth();
}

export default function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [claims, setClaims] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    (async () => {
      try {
        const auth = await fetchAuthInstance();
        unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
          if (cancelled) return;
          if (!currentUser) {
            setUser(null);
            setToken(null);
            setClaims({});
            setStatus("unauthenticated");
            return;
          }

          setUser(currentUser);
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          const tokenResult = await getIdTokenResult(currentUser);
          setClaims(tokenResult.claims ?? {});
          setStatus("authenticated");
        });
      } catch (err) {
        console.error("[AuthProvider] Failed to initialise Firebase", err);
        setError(err);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    status,
    user,
    token,
    claims,
    error,
    async signIn(email, password) {
      const auth = await fetchAuthInstance();
      return signInWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      const auth = await fetchAuthInstance();
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      setClaims({});
      setStatus("unauthenticated");
    },
  }), [status, user, token, claims, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
