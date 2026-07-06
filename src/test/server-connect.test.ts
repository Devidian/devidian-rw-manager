import { describe, expect, it } from 'vitest';
import { serverConnectAddress, serverConnectUrl } from '@/lib/serverConnect';

describe('serverConnect', () => {
  it('builds steam connect links from known game addresses', () => {
    expect(serverConnectUrl({
      id: 'server-1',
      label: 'Server',
      queryUrl: 'https://query.example',
      addr: '127.0.0.1:4255',
      createdAt: '2026-07-02T00:00:00.000Z',
    })).toBe('steam://run/324080//+connect 127.0.0.1:4255');

    expect(serverConnectAddress({
      id: 'server-2',
      label: 'Server',
      queryUrl: 'https://query.example',
      createdAt: '2026-07-02T00:00:00.000Z',
      queryData: { ip: '10.0.0.2', port: 4255 } as never,
    })).toBe('10.0.0.2:4255');
  });

  it('does not derive connect links from query urls', () => {
    expect(serverConnectUrl({
      id: 'server-1',
      label: 'Server',
      queryUrl: 'https://query.example:4254',
      createdAt: '2026-07-02T00:00:00.000Z',
    })).toBeUndefined();
  });
});
