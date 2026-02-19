export interface ServerConfig {
  id: string;
  label: string;
  queryUrl: string;
  backendUrl?: string; // Optional: base URL of the self-hosted backend (e.g. http://localhost:3001)
  createdAt: string;
}

export type ServerStatus = 'online' | 'offline' | 'loading' | 'unknown';

export interface RisingWorldQueryData {
  servername?: string;
  serverName?: string;
  map?: string;
  version?: string;
  players?: number;
  maxPlayers?: number;
  gamemode?: string;
  passwordProtected?: boolean;
  password?: boolean;
  online?: boolean;
  currentPlayers?: OnlinePlayer[];
  [key: string]: unknown;
}

export interface OnlinePlayer {
  name: string;
  steamId?: string;
  playTime?: number;
}

export interface DbPlayer {
  name: string;
  steamId: string;
  lastLogin?: string;
  playTime?: number;
  groups?: string[];
  rights?: string[];
}

export interface ServerWithStatus extends ServerConfig {
  status: ServerStatus;
  queryData?: RisingWorldQueryData;
  lastChecked?: Date;
  errorMessage?: string;
}
