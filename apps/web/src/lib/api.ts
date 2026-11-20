/**
 * Thin API client. Reads the backend base URL from the environment. All
 * displayed data comes from these real endpoints — there is no mock layer.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface PaymentCapabilities {
  configured: boolean;
  liveMoneyMovementEnabled: boolean;
  provider: string;
  reason?: string;
}

export function getPaymentCapabilities(): Promise<PaymentCapabilities> {
  return apiFetch<PaymentCapabilities>("/payments/capabilities");
}
