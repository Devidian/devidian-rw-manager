import { AuthUser, PublicUserInterface, UserState, UserRole } from '@/types/server';

const TIMEOUT = 10_000;
export const TOKEN_KEY = 'rwm_auth_token';

export class AuthApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function authFetch<T>(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT): Promise<T> {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('rwm:session-expired'));
    }
    throw new AuthApiError(res.status, (json as Record<string, string>).error ?? `HTTP ${res.status}`);
  }
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

export async function updateSelf(
  baseUrl: string,
  token: string,
  data: { name: string },
): Promise<{ user: AuthUser }> {
  return authFetch(`${baseUrl}/api/auth/self`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateIntercomChannels(
  baseUrl: string,
  token: string,
  channels: string[],
): Promise<{ user: AuthUser }> {
  return authFetch(`${baseUrl}/api/auth/self/intercom-channels`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ channels }),
  });
}

export async function deleteSelf(
  baseUrl: string,
  token: string,
): Promise<{ ok: true }> {
  return authFetch(`${baseUrl}/api/auth/self`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function generateApiToken(
  baseUrl: string,
  token: string,
): Promise<{ apiToken: string }> {
  return authFetch(`${baseUrl}/api/auth/api-token`, {
    method: 'POST',
    headers: authHeaders(token),
    body: '{}',
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
  }, 90_000);
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
): Promise<{ user: PublicUserInterface }> {
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
