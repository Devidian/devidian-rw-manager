import { describe, expect, it, vi } from 'vitest';
import { resolveSteamPersonaName } from '@/lib/steamProfile';

describe('resolveSteamPersonaName', () => {
  it('reads the persona name for the OpenID Steam ID', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      response: { players: [{ personaname: 'Steam Alice' }] },
    }), { status: 200 }));

    await expect(resolveSteamPersonaName({
      'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561198000000000',
    }, 'api-key')).resolves.toBe('Steam Alice');
    expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({
      href: expect.stringContaining('steamids=76561198000000000'),
    }));
    fetchMock.mockRestore();
  });

  it('leaves login usable when no profile name can be resolved', async () => {
    await expect(resolveSteamPersonaName({
      'openid.identity': 'https://steamcommunity.com/openid/id/76561198000000000',
    }, undefined)).resolves.toBeUndefined();
  });
});
