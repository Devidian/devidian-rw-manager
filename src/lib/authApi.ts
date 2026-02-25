import { AuthUser } from '@/types/server';

const TIMEOUT = 10_000;

export class AuthApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(res.status, (json as Record<string, string>).error ?? `HTTP ${res.status}`);
  return json as T;
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function register(
  baseUrl: string,
  data: { username?: string; email: string; password: string; steamId?: string },
): Promise<{ user: AuthUser; token: string }> {
  return authFetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
}

export async function login(
  baseUrl: string,
  data: { username: string; password: string },
): Promise<{ user: AuthUser; token: string }> {
  return authFetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
}

export async function validate(baseUrl: string, token: string): Promise<{ user: AuthUser }> {
  return authFetch(`${baseUrl}/api/auth/validate`, { headers: headers(token) });
}

export async function logout(baseUrl: string, token: string): Promise<void> {
  await authFetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: headers(token),
    body: '{}',
  });
}

export async function linkSteamId(
  baseUrl: string,
  token: string,
  steamId: string,
): Promise<{ user: AuthUser }> {
  return authFetch(`${baseUrl}/api/auth/steam-id`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ steamId }),
  });
}

export async function steamCallback(
  baseUrl: string,
  openIdParams: Record<string, string>,
): Promise<{ user: AuthUser; token: string }> {
  return authFetch(`${baseUrl}/api/auth/steam`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(openIdParams),
  });
}
