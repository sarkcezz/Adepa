/**
 * API client for the Laravel backend.
 *
 * The same backend powers the old Vite app; this just talks to it over the
 * v1 REST endpoints. Server components call `api()` directly (cached per the
 * `next` options); client components add the bearer token via `apiClient()`.
 */

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "https://api.adepaporkhub.shop/api/v1";

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

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    const message =
      (body as { message?: string })?.message ?? `Request failed (${res.status})`;
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
