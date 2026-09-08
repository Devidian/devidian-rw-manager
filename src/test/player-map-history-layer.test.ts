import { describe, expect, it } from 'vitest';
import { playerMapBitmapPixelIndex } from '@/components/AdminMapTab';

describe('player map history bitmap projection', () => {
  it('flips bitmap rows to match Leaflet CRS.Simple world Z coordinates', () => {
    expect(playerMapBitmapPixelIndex(0)).toBe(255 * 256);
    expect(playerMapBitmapPixelIndex(255)).toBe(256 * 256 - 1);
    expect(playerMapBitmapPixelIndex(255 * 256)).toBe(0);
    expect(playerMapBitmapPixelIndex(256 * 256 - 1)).toBe(255);
  });
});
