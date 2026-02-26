import { AuthUser, PublicUserInterface, UserState, UserRole } from '@/types/server';

const TIMEOUT = 10_000;
export const TOKEN_KEY = 'rwm_auth_token';

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
  if(json.token) localStorage.setItem(TOKEN_KEY, json.token)
  return json as T;
}

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function authHeaders(token: string=getAuthToken()): HeadersInit {
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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function login(
  baseUrl: string,
  data: { username: string; password: string },
): Promise<{ user: AuthUser; token: string }> {
  return authFetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function validate(baseUrl: string, token: string): Promise<{ user: AuthUser }> {
  return authFetch(`${baseUrl}/api/auth/validate`, { headers: authHeaders(token) });
}

export async function logout(baseUrl: string, token: string): Promise<void> {
  await authFetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: authHeaders(token),
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
    headers: authHeaders(token),
    body: JSON.stringify({ steamId }),
  });
}

export async function steamCallback(
  baseUrl: string,
  openIdParams: Record<string, string>,
): Promise<{ user: AuthUser; token: string }> {
  return authFetch(`${baseUrl}/api/auth/steam`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(openIdParams),
  });
}

// ─── User Management (Superadmin) ────────────────────────────────────────────

export async function getUsers(
  baseUrl: string,
  token: string,
): Promise<{ users: PublicUserInterface[] }> {
  return authFetch(`${baseUrl}/api/storage/user`, { headers: authHeaders(token) });
}

export async function updateUser(
  baseUrl: string,
  token: string,
  id: string,
  data: { state?: UserState; role?: UserRole },
): Promise<PublicUserInterface> {
  return authFetch(`${baseUrl}/api/storage/user/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function deleteUser(
  baseUrl: string,
  token: string,
  id: string,
): Promise<void> {
  return authFetch(`${baseUrl}/api/storage/user/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
