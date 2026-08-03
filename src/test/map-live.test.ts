import {
  getMapLiveWebSocketUrl,
  parseMapLayersChangedMessage,
} from '@/lib/mapLive';
import { act, renderHook } from '@testing-library/react';
import { useMapLiveSubscription } from '@/hooks/useMapLiveSubscription';

describe('map live contract', () => {
  it('derives ws and wss URLs without putting credentials in the URL', () => {
    expect(getMapLiveWebSocketUrl('https://manager.example/backend'))
      .toBe('wss://manager.example/backend/api/storage/map-live');
    expect(getMapLiveWebSocketUrl('http://localhost:3000'))
      .toBe('ws://localhost:3000/api/storage/map-live');
  });

  it('accepts changes only for the selected server', () => {
    const message = {
      type: 'map.layers.changed',
      schemaVersion: 1,
      serverId: 'server-a',
      sequence: 4,
      generatedAt: '2026-08-03T12:00:00.000Z',
      layers: ['players', 'claims'],
    };
    expect(parseMapLayersChangedMessage(message, 'server-a')).toEqual(message);
    expect(parseMapLayersChangedMessage(message, 'server-b')).toBeNull();
  });

  it('rejects unknown layers and malformed sequence values', () => {
    const base = {
      type: 'map.layers.changed',
      schemaVersion: 1,
      serverId: 'server-a',
      sequence: 1,
      generatedAt: '2026-08-03T12:00:00.000Z',
      layers: ['players'],
    };
    expect(parseMapLayersChangedMessage({ ...base, layers: ['unknown'] }, 'server-a')).toBeNull();
    expect(parseMapLayersChangedMessage({ ...base, sequence: 0 }, 'server-a')).toBeNull();
  });
});

describe('map live subscription lifecycle', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: FakeWebSocket });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: originalWebSocket });
  });

  it('closes the old subscription and subscribes only to the newly selected server', () => {
    const onLayersChanged = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ serverId }) => useMapLiveSubscription('https://manager.example', serverId, onLayersChanged),
      { initialProps: { serverId: 'server-a' } },
    );
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => FakeWebSocket.instances[0].emit('open', new Event('open')));
    expect(JSON.parse(FakeWebSocket.instances[0].sent[0])).toMatchObject({ serverId: 'server-a' });

    rerender({ serverId: 'server-b' });
    expect(FakeWebSocket.instances[0].closeReason).toBe('map_unmounted');
    expect(FakeWebSocket.instances).toHaveLength(2);
    act(() => FakeWebSocket.instances[1].emit('open', new Event('open')));
    expect(JSON.parse(FakeWebSocket.instances[1].sent[0])).toMatchObject({ serverId: 'server-b' });

    act(() => FakeWebSocket.instances[1].emit('message', new MessageEvent('message', {
      data: JSON.stringify({
        type: 'map.layers.changed',
        schemaVersion: 1,
        serverId: 'server-a',
        sequence: 1,
        generatedAt: '2026-08-03T12:00:00.000Z',
        layers: ['players'],
      }),
    })));
    expect(onLayersChanged).not.toHaveBeenCalled();
    unmount();
    expect(FakeWebSocket.instances[1].closeReason).toBe('map_unmounted');
  });
});

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  readonly sent: string[] = [];
  closeReason?: string;
  private readonly listeners = new Map<string, Array<(event: Event) => void>>();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(value: string): void {
    this.sent.push(value);
  }

  close(_code?: number, reason?: string): void {
    this.closeReason = reason;
  }

  emit(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}
