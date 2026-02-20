export interface ServerConfig {
  id: string;
  label: string;
  queryUrl: string;
  backendUrl?: string; // Optional: base URL of the self-hosted game-server backend (e.g. http://localhost:3001)
  createdAt: string;
  userId?: string; // for backend-server with login, every user should have own server-list
}

export type ServerStatus = 'online' | 'offline' | 'loading' | 'unknown';

export interface RisingWorldQueryData {
  version: string;
  legacy: boolean;
  ip: string;
  port: number;
  steamid: number;
  contact: string;
  name: string;
  map: string;
  os: string;
  uptime: number;
  visible: boolean;
  locked: boolean;
  whitelist: boolean;
  pvp: boolean;
  pve: boolean;
  gamemode: number; // 0=survival, 1=creative
  peaceful: boolean;
  maxplayers: number;
  playercount: number;
  mods: boolean;
  // Allow additional unknown fields from the API
  [key: string]: unknown;
}

export interface OnlinePlayer {
  name: string;
  steamId?: string;
  playTime?: number;
}

export interface DbPlayer {
  id: string;
  steamId: string;
  name: string;
  playTime?: number;
  lastLogin?: string;
  group?: string;
}

export interface ServerWithStatus extends ServerConfig {
  status: ServerStatus;
  queryData?: RisingWorldQueryData;
  lastChecked?: Date;
  errorMessage?: string;
}
