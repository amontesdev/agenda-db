"use client";

import AgendaApp from "@/components/AgendaApp";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Page() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#060a10",
        color: "#94a3b8",
        fontFamily: "'Space Mono','Courier New',monospace",
        letterSpacing: "1px",
      }}>
        Initialising workspace…
      </div>
    );
  }

  if (status === "unauthenticated" || status === "error") {
    return <LoginForm />;
  }

  return <AgendaApp />;
}
