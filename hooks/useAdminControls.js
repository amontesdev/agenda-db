"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export function useAdminControls() {
  const { token, user, signOut, claims } = useAuth();
  const isAdmin = claims?.role === "admin";

  return {
    token,
    user,
    signOut,
    isAdmin,
  };
}
