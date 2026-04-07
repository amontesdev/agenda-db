"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { status, claims, token } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#060a10", color: "#94a3b8", fontFamily: "'Space Mono', monospace"
      }}>
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated" || status === "error") {
    router.push("/");
    return null;
  }

  if (claims?.role !== "admin") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#060a10", color: "#f87171", fontFamily: "'Space Mono', monospace"
      }}>
        Access denied — admin only
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to invite user");
      } else {
        setResult(data);
        setEmail("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#060a10", color: "#e2e8f0",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif", padding: "40px 24px"
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "4px", color: "#38bdf8" }}>ADMIN</span>
          <h1 style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700, color: "#f8fafc" }}>
            Invite users
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
            Send invitation links to new team members.
          </p>
        </div>

        <form onSubmit={handleInvite} style={{
          background: "rgba(15, 23, 42, 0.8)", border: "1px solid #334155", borderRadius: "16px",
          padding: "24px", display: "flex", flexDirection: "column", gap: "16px"
        }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5f5", letterSpacing: "1px" }}>EMAIL ADDRESS</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@yourcompany.com"
              style={{
                background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: "10px", padding: "12px 14px", color: "#f8fafc", fontSize: "14px",
                outline: "none"
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5f5", letterSpacing: "1px" }}>ROLE</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: "10px", padding: "12px 14px", color: "#f8fafc", fontSize: "14px",
                outline: "none", cursor: "pointer"
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px", borderRadius: "999px", border: "none", fontWeight: 600,
              fontSize: "14px", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer",
              background: loading ? "rgba(56, 189, 248, 0.3)" : "linear-gradient(135deg, #38bdf8, #0ea5e9)",
              color: "#0f172a", marginTop: "8px"
            }}
          >
            {loading ? "Creating..." : "Send invitation"}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: "16px", padding: "12px 16px", borderRadius: "10px",
            background: "rgba(248, 113, 113, 0.12)", color: "#fecaca", fontSize: "13px"
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: "16px", padding: "16px 20px", borderRadius: "10px",
            background: "rgba(34, 197, 94, 0.12)", color: "#86efac", fontSize: "13px"
          }}>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>✓ Invitation sent</div>
            <div style={{ wordBreak: "break-all", fontSize: "12px", color: "#cbd5e1" }}>
              {result.activationLink}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
              Share this link with the user. It expires in 24h.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}