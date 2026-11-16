"use client";

import { apiFetch } from "./api";

const ACCESS_KEY = "escrow.accessToken";
const REFRESH_KEY = "escrow.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function saveTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await apiFetch<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveTokens(tokens);
}

export async function register(
  email: string,
  displayName: string,
  password: string,
): Promise<void> {
  const tokens = await apiFetch<TokenPair>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, displayName, password }),
  });
  saveTokens(tokens);
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  clearTokens();
}

/** Authenticated fetch that transparently refreshes an expired access token once. */
export async function authedFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  try {
    return await apiFetch<T>(path, { ...opts, token });
  } catch (err) {
    const status = (err as { status?: number }).status;
    const refreshToken = getRefreshToken();
    if (status === 401 && refreshToken) {
      const tokens = await apiFetch<TokenPair>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      saveTokens(tokens);
      return apiFetch<T>(path, { ...opts, token: tokens.accessToken });
    }
    throw err;
  }
}
