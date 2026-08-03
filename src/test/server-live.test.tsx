import { act, renderHook, waitFor } from '@testing-library/react';
import { useServerLiveSubscription } from '@/hooks/useServerLiveSubscription';
import { useServerStatus } from '@/hooks/useServerStatus';
import {
  getServerLiveWebSocketUrl,
  parseServerStatusChangedMessage,
  parseServerStatusSnapshotMessage,
} from '@/lib/serverLive';
import type { ServerConfig } from '@/types/server';
import type { StorageAdapter } from '@/lib/storage';

describe('server live contract', () => {
  it('builds credential-free ws and wss URLs', () => {
    expect(getServerLiveWebSocketUrl('https://manager.example/backend'))
      .toBe('wss://manager.example/backend/api/storage/server-live');
    expect(getServerLiveWebSocketUrl('http://localhost:3000'))
      .toBe('ws://localhost:3000/api/storage/server-live');
  });

  it('accepts snapshots and deltas only for subscribed server IDs', () => {
    const selected = new Set(['server-a']);
    const value = { status: 'online', lastChecked: '2026-08-03T12:00:00.000Z' };
    const snapshot = {
      type: 'server.status.snapshot', schemaVersion: 1,
      items: [{ serverId: 'server-a', value }], generatedAt: '2026-08-03T12:00:00.000Z',
    };
    const changed = {
      type: 'server.status.changed', schemaVersion: 1, serverId: 'server-a', sequence: 1,
      changed: { status: 'offline', lastChecked: '2026-08-03T12:01:00.000Z' },
      removedFields: ['onlinePlayers'], generatedAt: '2026-08-03T12:01:00.000Z',
    };
    expect(parseServerStatusSnapshotMessage(snapshot, selected)).toEqual(snapshot);
    expect(parseServerStatusChangedMessage(changed, selected)).toEqual(changed);
    expect(parseServerStatusSnapshotMessage({ ...snapshot, items: [{ serverId: 'server-b', value }] }, selected)).toBeNull();
    expect(parseServerStatusChangedMessage({ ...changed, serverId: 'server-b' }, selected)).toBeNull();
  });
});

describe('server live subscription lifecycle', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: FakeWebSocket });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: originalWebSocket });
  });

  it('changes the subscribed IDs without reconnecting', () => {
    const { rerender, unmount } = renderHook(
      ({ ids }) => useServerLiveSubscription('https://manager.example', ids, vi.fn(), vi.fn()),
      { initialProps: { ids: ['server-a'] } },
    );
    const socket = FakeWebSocket.instances[0];
    act(() => socket.open());
    expect(JSON.parse(socket.sent[0])).toMatchObject({ type: 'server.status.subscribe', serverIds: ['server-a'] });
    act(() => socket.message({ type: 'server.status.subscribed', schemaVersion: 1, serverIds: ['server-a'] }));

    rerender({ ids: ['server-a', 'server-b'] });
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(JSON.parse(socket.sent[1])).toMatchObject({
      type: 'server.status.set-servers', serverIds: ['server-a', 'server-b'],
    });
    unmount();
  });

  it('uses REST only as fallback after the socket disconnects', async () => {
    const server: ServerConfig = {
      id: 'server-a', label: 'A', queryUrl: 'https://a.example', createdAt: '2026-08-03T00:00:00.000Z',
    };
    const adapter = adapterFor(server);
    const servers = [server];
    const { result } = renderHook(() => useServerStatus(servers, adapter, servers, 'https://manager.example'));
    expect(adapter.getServerLiveStatus).not.toHaveBeenCalled();
    act(() => FakeWebSocket.instances[0].open());
    act(() => FakeWebSocket.instances[0].message({
      type: 'server.status.subscribed', schemaVersion: 1, serverIds: ['server-a'],
    }));
    expect(adapter.getServerLiveStatus).not.toHaveBeenCalled();

    act(() => FakeWebSocket.instances[0].disconnect(1006));
    await waitFor(() => expect(adapter.getServerLiveStatus).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.statusMap['server-a']?.status).toBe('online'));
  });

  it('keeps REST polling available when no backend WebSocket exists', async () => {
    const server: ServerConfig = {
      id: 'local-a', label: 'Local', queryUrl: 'http://local.example', createdAt: '2026-08-03T00:00:00.000Z',
    };
    const adapter = adapterFor(server);
    const servers = [server];
    renderHook(() => useServerStatus(servers, adapter, servers, null));
    await waitFor(() => expect(adapter.getServerLiveStatus).toHaveBeenCalledTimes(1));
    expect(FakeWebSocket.instances).toHaveLength(0);
  });
});

function adapterFor(server: ServerConfig): StorageAdapter {
  return {
    getServers: vi.fn(async () => [server]), refreshServers: vi.fn(async () => [server]),
    addServer: vi.fn(), updateServer: vi.fn(), deleteServer: vi.fn(), getPinnedServers: vi.fn(async () => []),
    pinServer: vi.fn(), unpinServer: vi.fn(), setServerBlocked: vi.fn(),
    getServerLiveStatus: vi.fn(async () => ({ status: 'online', lastChecked: '2026-08-03T12:00:00.000Z' })),
  };
}

class FakeWebSocket {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readonly sent: string[] = [];
  readyState = 0;
  private readonly listeners = new Map<string, Array<(event: Event) => void>>();

  constructor(readonly url: string) { FakeWebSocket.instances.push(this); }
  addEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  send(value: string): void { this.sent.push(value); }
  close(): void { this.readyState = 3; }
  open(): void { this.readyState = FakeWebSocket.OPEN; this.emit('open', new Event('open')); }
  message(value: unknown): void {
    this.emit('message', new MessageEvent('message', { data: JSON.stringify(value) }));
  }
  disconnect(code: number): void {
    this.readyState = 3;
    const event = new Event('close');
    Object.defineProperty(event, 'code', { value: code });
    this.emit('close', event);
  }
  private emit(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}
