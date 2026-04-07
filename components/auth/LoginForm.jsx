"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginForm() {
  const { signIn, status, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const disabled = loading || status === "loading";

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const code = err?.code ?? "auth/unknown";
      let message = "Login failed";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        message = "Invalid email or password";
      } else if (code === "auth/user-not-found") {
        message = "User not found";
      } else if (code === "auth/too-many-requests") {
        message = "Too many attempts. Try again later.";
      }
      setFormError(message);
      setLoading(false);
    }
  };

  const renderError = formError || (status === "error" ? error?.message : null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at top, #0f172a, #020617)",
      color: "#e2e8f0",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "360px",
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: "18px",
        padding: "28px 28px 32px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(14px)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "4px", color: "#38bdf8" }}>MI AGENDA</span>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#f8fafc" }}>Welcome back</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            Use the company email you were invited with.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5f5", letterSpacing: "1px" }}>EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#f8fafc",
                fontSize: "14px",
                outline: "none",
                transition: "border 0.2s, box-shadow 0.2s",
              }}
              onFocus={(event) => {
                event.target.style.border = "1px solid #38bdf8";
                event.target.style.boxShadow = "0 0 0 4px rgba(56, 189, 248, 0.15)";
              }}
              onBlur={(event) => {
                event.target.style.border = "1px solid rgba(148, 163, 184, 0.4)";
                event.target.style.boxShadow = "none";
              }}
              autoComplete="email"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5f5", letterSpacing: "1px" }}>PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "#f8fafc",
                fontSize: "14px",
                outline: "none",
                transition: "border 0.2s, box-shadow 0.2s",
              }}
              onFocus={(event) => {
                event.target.style.border = "1px solid #38bdf8";
                event.target.style.boxShadow = "0 0 0 4px rgba(56, 189, 248, 0.15)";
              }}
              onBlur={(event) => {
                event.target.style.border = "1px solid rgba(148, 163, 184, 0.4)";
                event.target.style.boxShadow = "none";
              }}
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={disabled}
            style={{
              marginTop: "4px",
              padding: "12px 14px",
              borderRadius: "999px",
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: disabled ? "not-allowed" : "pointer",
              background: disabled ? "rgba(56, 189, 248, 0.3)" : "linear-gradient(135deg, #38bdf8, #0ea5e9)",
              color: "#0f172a",
              boxShadow: disabled ? "none" : "0 12px 24px rgba(14, 165, 233, 0.25)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(event) => {
              if (disabled) return;
              event.currentTarget.style.transform = "translateY(-1px)";
              event.currentTarget.style.boxShadow = "0 16px 28px rgba(14, 165, 233, 0.3)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateY(0)";
              event.currentTarget.style.boxShadow = disabled ? "none" : "0 12px 24px rgba(14, 165, 233, 0.25)";
            }}
          >
            {loading ? "Signing in..." : "Access workspace"}
          </button>
        </form>

        {renderError && (
          <div style={{
            marginTop: "18px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(248, 113, 113, 0.12)",
            color: "#fecaca",
            fontSize: "12px",
            letterSpacing: "0.5px",
          }}>
            {renderError}
          </div>
        )}

        <div style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.6,
        }}>
          Need access? Ask an admin to send you an invite.
        </div>
      </div>
    </div>
  );
}
