export interface ServerConfig {
  id: string;
  masterOnly?: boolean;
  canApprove?: boolean;
  canDelete?: boolean;
  dashboardVisible?: boolean;
  label: string;
  steamId?: string;
  addr?: string;
  version?: string;
  name?: string;
  ip?: string;
  port?: number;
  region?: string;
  gm?: number;
  mods?: boolean;
  password?: boolean;
  whitelist?: boolean;
  adminUid?: string;
  queryUrl: string;
  mapUrl?: string;
  backendUrl?: string;
  data?: unknown;
  info?: unknown;
  status?: ServerStatus;
  queryData?: RisingWorldQueryData;
  infoData?: ServerInfoResponse;
  onlinePlayers?: ServerPlayerListPlayer[];
  publicPlayerCount?: number;
  blocked?: boolean;
  blockedAt?: string;
  lastChecked?: string | Date;
  errorMessage?: string;
  firstSeen?: string;
  lastSeen?: string;
  queryDataUpdatedAt?: string;
  pluginListAvailable?: boolean;
  ozToolsInstalled?: boolean;
  ozToolsVersion?: string;
  latestOZToolsVersion?: string;
  createdAt: string;
  userId?: string;
  public?: boolean;
}

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  steamId?: string;
  pinnedServers?: string[];
  intercomChannels?: string[];
  role: 'guest' | 'user' | 'admin';
}

export type ServerStatus = 'online' | 'offline' | 'loading' | 'unknown';

export type UserState = 'new' | 'verified' | 'closed';
export type UserRole = 'guest' | 'user' | 'admin';

export interface PublicUserInterface {
  id: string;
  username: string;
  state: UserState;
  role: UserRole;
  steamId?: string;
  pinnedServers: string[];
  intercomChannels?: string[];
  lastSeenAt?: string;
  createdAt: string;
}

export interface RisingWorldQueryData {
  version: string;
  legacy: boolean;
  ip: string;
  port: number;
  steamid: number | string;
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
  [key: string]: unknown;
}

// GET {queryUrl}/info
export interface ServerInfoResponse {
  name: string;
  shortname: string;
  description: string;
  contact: string;
  headerimage: boolean;
}

// GET {queryUrl}/playerlist
export interface ServerPlayerListPlayer {
  id: string | number;
  slotId?: number;
  name: string;
  uid?: string;
  platform: string;
  ping: number;
}

export interface ServerPlayerListResponse {
  playercount: number;
  players: ServerPlayerListPlayer[];
}

// GET {backendUrl}/ health check
export interface BackendInfo {
  ok: boolean;
  limits?: {
    maxPinnedServers: number;
  };
  services: string[];
  version: number;
}

// GET {backendUrl}/api/storage/server/{serverId}/player
export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
}

export interface DbPlayer {
  id?: string | number;
  uid?: string;
  name?: string;
  posx?: number;
  posy?: number;
  posz?: number;
  rotx?: number;
  roty?: number;
  rotz?: number;
  rotw?: number;
  platform?: string | number;
  permissiongroup?: string;
  health?: number;
  hunger?: number;
  thirst?: number;
  brokenbones?: number;
  temperature?: number;
  dead?: number;
  flying?: number;
  clothes?: unknown;
  primaryspawn?: SpawnPoint | null;
  secondaryspawn?: SpawnPoint | null;
  tertiaryspawn?: SpawnPoint | null;
  lastspawn?: number;
  lastusedmount?: number;
  lastusedvehicle?: number;
  playtime?: number;
  firstseen?: number;
  lastseen?: number;
}

export interface DataPlayerListResponse {
  items: DbPlayer[];
}

export interface ServerWithStatus extends ServerConfig {
  status: ServerStatus;
  queryData?: RisingWorldQueryData;
  infoData?: ServerInfoResponse;
  onlinePlayers?: ServerPlayerListPlayer[];
  lastChecked?: Date | string;
  errorMessage?: string;
}

export interface ServerLiveStatusPayload {
  status: 'online' | 'offline';
  queryData?: RisingWorldQueryData;
  infoData?: ServerInfoResponse;
  onlinePlayers?: ServerPlayerListPlayer[];
  publicPlayerCount?: number;
  lastChecked: string;
  errorMessage?: string;
}

export interface ServerStatisticsBucket {
  id: string;
  serverId: string;
  hourStart: string;
  sampleCount: number;
  onlineSampleCount: number;
  playerSampleTotal: number;
  maxPlayers: number;
  averagePlayers: number;
  availability: number;
  onlinePlayerUids?: string[];
  onlinePlayerIds?: string[];
  updatedAt: string;
}

export interface ServerStatisticsPayload {
  serverId: string;
  from?: string;
  to?: string;
  buckets: ServerStatisticsBucket[];
}

export interface GlobalStatisticsPayload {
  from?: string;
  to?: string;
  buckets: ServerStatisticsBucket[];
}
