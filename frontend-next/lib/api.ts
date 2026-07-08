/**
 * API client.
 *
 * Defaults to the app's own same-origin `/api` Route Handlers (the ported
 * backend on Neon). Set NEXT_PUBLIC_API_BASE_URL to an absolute URL to point
 * at a different backend (e.g. the legacy Laravel API during migration).
 *
 * Because server components run in Node — where `fetch` needs an absolute URL —
 * a relative base is expanded to an absolute origin server-side (VERCEL_URL /
 * NEXT_PUBLIC_SITE_URL / localhost). In the browser the relative base is used
 * as-is.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api";

function resolveUrl(path: string): string {
  const url = `${BASE}${path}`;
  if (url.startsWith("http") || typeof window !== "undefined") return url;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return `${origin}${url}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions extends RequestInit {
  /** Bearer token for authenticated requests (client-side). */
  token?: string;
  /** Next.js fetch caching controls (server components). */
  next?: NextFetchRequestConfig;
}

const TIMEOUT_MS = 15_000;

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers, signal, ...rest } = opts;

  let res: Response;
  try {
    res = await fetch(resolveUrl(path), {
      ...rest,
      // A dead/unreachable backend would otherwise hang the request
      // indefinitely (some browsers wait minutes before giving up).
      signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    throw new ApiError(0, timedOut ? "The server took too long to respond. Please try again." : "Could not reach the server. Check your connection.");
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    const message =
      (body as { message?: string })?.message ?? `Request failed (${res.status})`;

    // Session handling — only when an authenticated request fails (a token was
    // sent). A 401 on the login call itself (no token) must NOT trigger logout.
    if (typeof window !== "undefined" && token) {
      if (res.status === 401) {
        // Token expired / revoked: clear the persisted session and bounce to login.
        localStorage.removeItem("adepa-auth");
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?next=${next}`;
        }
      } else if (res.status === 423) {
        // Backend force-password-change gate.
        if (!window.location.pathname.startsWith("/change-password")) {
          window.location.href = "/change-password";
        }
      }
    }

    throw new ApiError(res.status, message, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Convenience for server components fetching public data with ISR. */
export function publicApi<T>(path: string, revalidateSeconds = 60) {
  return api<T>(path, { next: { revalidate: revalidateSeconds } });
}

export { BASE as API_BASE };
