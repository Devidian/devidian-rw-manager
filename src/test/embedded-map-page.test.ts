import { describe, expect, it } from 'vitest';
import { embeddedMapRequestUrl } from '@/pages/EmbeddedMapPage';

describe('embedded map request URL', () => {
  it('uses the selected server public data endpoint', () => {
    expect(embeddedMapRequestUrl('https://manager.example/', 'server id'))
      .toBe('https://manager.example/api/data/server/server%20id/map');
  });
});
