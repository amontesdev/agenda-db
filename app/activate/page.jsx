"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

function ActivationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const continueUrl = searchParams.get("continueUrl") ?? "/";

  const [status, setStatus] = useState("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const invalidRequest = useMemo(() => !oobCode || !mode || mode !== "resetPassword", [oobCode, mode]);

  useEffect(() => {
    if (invalidRequest) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const auth = await getFirebaseAuth();
        const recoveredEmail = await verifyPasswordResetCode(auth, oobCode);
        if (cancelled) return;
        setEmail(recoveredEmail);
        setStatus("ready");
      } catch (err) {
        console.error("[Activation] verify error", err);
        if (!cancelled) {
          setStatus("invalid");
          setError("This activation link is invalid or expired. Ask your admin for a fresh invite.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [invalidRequest, oobCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const auth = await getFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("completed");
      setMessage("Password set successfully. You can head to the login page.");
      setTimeout(() => router.push(continueUrl || "/"), 2200);
    } catch (err) {
      console.error("[Activation] set password error", err);
      setError("Something went wrong while activating your account. The link may have expired.");
    }
  };

  if (status === "invalid") {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <h1 style={titleStyles}>Activation failed</h1>
          <p style={copyStyles}>{error || "We couldn't process this request."}</p>
          <button style={secondaryButtonStyles} onClick={() => router.push("/")}>Back to login</button>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <h1 style={titleStyles}>You're all set</h1>
          <p style={copyStyles}>{message}</p>
          <button style={primaryButtonStyles} onClick={() => router.push("/")}>Go to login</button>
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "initial") {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <h1 style={titleStyles}>Checking invite…</h1>
          <p style={copyStyles}>Give me a second to prepare your workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <span style={{ fontSize: "12px", letterSpacing: "4px", color: "#38bdf8" }}>INVITE</span>
        <h1 style={titleStyles}>Create your password</h1>
        <p style={{ ...copyStyles, marginBottom: "22px" }}>
          Account: <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label style={fieldLabelStyles}>
            <span style={fieldLabelText}>NEW PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={12}
              style={inputStyles}
            />
          </label>

          <label style={fieldLabelStyles}>
            <span style={fieldLabelText}>CONFIRM PASSWORD</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={12}
              style={inputStyles}
            />
          </label>

          <button type="submit" style={primaryButtonStyles}>Activate account</button>
        </form>

        {error && <div style={errorStyles}>{error}</div>}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <h1 style={titleStyles}>Loading…</h1>
        <p style={copyStyles}>Preparing your workspace.</p>
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActivationPageContent />
    </Suspense>
  );
}

const containerStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(160deg, #0f172a 0%, #020617 100%)",
  color: "#e2e8f0",
  padding: "24px",
  fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
};

const cardStyles = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(15, 23, 42, 0.88)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "20px",
  padding: "32px 34px",
  boxShadow: "0 22px 50px rgba(8, 47, 73, 0.35)",
  backdropFilter: "blur(20px)",
};

const titleStyles = {
  margin: "8px 0 6px",
  fontSize: "28px",
  fontWeight: 700,
  color: "#f8fafc",
};

const copyStyles = {
  fontSize: "14px",
  color: "#94a3b8",
  lineHeight: 1.6,
};

const fieldLabelStyles = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "12px",
};

const fieldLabelText = {
  color: "#cbd5f5",
  letterSpacing: "1px",
};

const inputStyles = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  borderRadius: "10px",
  padding: "12px 14px",
  color: "#f8fafc",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyles = {
  marginTop: "6px",
  padding: "12px 16px",
  borderRadius: "999px",
  border: "none",
  fontWeight: 600,
  fontSize: "14px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  cursor: "pointer",
  background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
  color: "#0f172a",
  boxShadow: "0 16px 30px rgba(14, 165, 233, 0.25)",
};

const secondaryButtonStyles = {
  marginTop: "22px",
  padding: "10px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  fontWeight: 500,
  fontSize: "13px",
  cursor: "pointer",
  background: "transparent",
  color: "#cbd5f5",
};

const errorStyles = {
  marginTop: "18px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(248, 113, 113, 0.12)",
  color: "#fecaca",
  fontSize: "12px",
  letterSpacing: "0.5px",
};