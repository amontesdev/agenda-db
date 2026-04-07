import { headers } from "next/headers";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";

export class AuthError extends Error {
  constructor(message, status = 401, code = "unauthorized") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function getBearerToken(req) {
  const headerValue = req.headers.get("authorization") ?? headers().get("authorization");
  if (!headerValue) return null;
  if (!headerValue.toLowerCase().startsWith("bearer ")) return null;
  return headerValue.slice(7).trim();
}

export async function verifyRequestUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AuthError("Missing Authorization bearer token", 401, "missing_token");
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(token, true);
    if (decoded?.disabled) {
      throw new AuthError("User account disabled", 403, "disabled_user");
    }
    return decoded;
  } catch (err) {
    if (err instanceof AuthError) {
      throw err;
    }
    throw new AuthError("Invalid or expired token", 401, "invalid_token");
  }
}

export async function requireUser(req, options = {}) {
  const decoded = await verifyRequestUser(req);

  if (options.requireVerified && !decoded.email_verified) {
    throw new AuthError("Email not verified", 403, "email_not_verified");
  }

  if (options.requireRole) {
    const userRole = decoded.role ?? decoded.roles?.primary ?? decoded.roles;
    if (Array.isArray(options.requireRole)) {
      if (!options.requireRole.some(role => role === userRole || (typeof userRole === "object" && userRole?.[role]))) {
        throw new AuthError("Forbidden", 403, "forbidden");
      }
    } else if (typeof options.requireRole === "string") {
      const role = options.requireRole;
      if (typeof userRole === "object") {
        if (!userRole?.[role]) {
          throw new AuthError("Forbidden", 403, "forbidden");
        }
      } else if (userRole !== role) {
        throw new AuthError("Forbidden", 403, "forbidden");
      }
    }
  }

  return decoded;
}
