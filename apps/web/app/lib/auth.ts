import { ADMIN_API_BASE_URL } from "./admin/config";
import type { Env } from "./env";

export interface Session {
  user: {
    name: string;
    email: string | null;
    role: string;
    githubLogin?: string;
  };
}

/**
 * Check if the request has a valid session by calling the Go API.
 * Returns the session data or null if not authenticated.
 */
export async function getSession(request: Request, env: Env): Promise<Session | null> {
  if (env.ADMIN_AUTH_DISABLED === "true") {
    return {
      user: {
        name: "Dev Admin",
        email: "dev@example.com",
        role: "admin",
      },
    };
  }

  const cookie = request.headers.get("Cookie") || "";
  if (!cookie.includes("gng_session=")) {
    return null;
  }

  try {
    const res = await fetch(`${ADMIN_API_BASE_URL}/auth/session`, {
      headers: { Cookie: cookie },
    });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

/**
 * Get the GitHub OAuth login URL from the Go API.
 */
export function getLoginURL(callbackUrl: string): string {
  return `${ADMIN_API_BASE_URL}/auth/github?callback=${encodeURIComponent(callbackUrl)}`;
}

/**
 * Get the logout URL.
 */
export function getLogoutURL(): string {
  return `${ADMIN_API_BASE_URL}/auth/logout`;
}
