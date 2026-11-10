import { authHeaders, TOKEN_KEY } from '@/lib/authApi';

export interface DuplicateEntry {
  id: string;
  name: string;
  shortname: string;
  map: string;
  gamemode: number;
  os: string;
  ip: string;
  port: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  strength: 'strong' | 'possible';
}
export interface DuplicateGroup { targetId: string; entries: DuplicateEntry[] }
export interface MergeSelection { targetId: string; sourceIds: string[] }
export interface MergePreview extends MergeSelection {
  currentAddress: string;
  affectedFavorites: number;
  statisticHours: number;
}

async function request<T>(baseUrl: string, path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/storage${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers: authHeaders(token),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
  return data as T;
}
export async function getDuplicateGroups(baseUrl: string, token: string): Promise<DuplicateGroup[]> {
  return (await request<{ groups: DuplicateGroup[] }>(baseUrl, '/server/duplicates', token)).groups;
}
export function previewMerge(baseUrl: string, token: string, selection: MergeSelection): Promise<MergePreview> {
  return request(baseUrl, '/server/merge/preview', token, selection);
}
export function mergeServers(baseUrl: string, token: string, selection: MergeSelection): Promise<MergePreview> {
  return request(baseUrl, '/server/merge', token, selection);
}
export function resolveServerId(baseUrl: string, id: string): Promise<{ canonicalId: string }> {
  return request(baseUrl, `/server/${encodeURIComponent(id)}/resolve`, localStorage.getItem(TOKEN_KEY) ?? '');
}
