import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { GlobalMarketplaceTab } from '@/components/GlobalMarketplaceTab';

const fetchOffers = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useMapLayers', () => ({
  fetchGlobalMarketplaceOffers: fetchOffers,
}));

describe('GlobalMarketplaceTab', () => {
  beforeEach(() => {
    fetchOffers.mockReset();
  });

  it('shows the empty state after loading', async () => {
    fetchOffers.mockResolvedValue([]);
    render(<GlobalMarketplaceTab apiBaseUrl="/backend" serverId="server-a" />);
    expect(await screen.findByText('mapNoOffers')).toBeInTheDocument();
    expect(fetchOffers).toHaveBeenCalledWith('/backend', 'server-a', expect.any(AbortSignal));
  });

  it('renders item variants and seller data in the shared view', async () => {
    fetchOffers.mockResolvedValue([{
      id: 17,
      itemName: 'Stone',
      itemVariant: 4,
      amount: 3,
      price: 25,
      currency: 'coins',
      sellerName: 'Alex',
      createdAt: '2026-11-24T12:00:00.000Z',
    }]);
    render(<GlobalMarketplaceTab apiBaseUrl="/backend" serverId="server-a" />);
    expect(await screen.findAllByText('Stone #4')).toHaveLength(2);
    expect(screen.getAllByText('Alex')).toHaveLength(2);
    expect(screen.getAllByText('25 coins')).toHaveLength(2);
  });

  it('aborts its active request when the server changes', async () => {
    fetchOffers.mockImplementation(() => new Promise(() => {}));
    const view = render(<GlobalMarketplaceTab apiBaseUrl="/backend" serverId="server-a" />);
    await waitFor(() => expect(fetchOffers).toHaveBeenCalledTimes(1));
    const oldSignal = fetchOffers.mock.calls[0][2] as AbortSignal;
    view.rerender(<GlobalMarketplaceTab apiBaseUrl="/backend" serverId="server-b" />);
    expect(oldSignal.aborted).toBe(true);
    await waitFor(() => expect(fetchOffers).toHaveBeenCalledTimes(2));
    expect(fetchOffers.mock.calls[1][1]).toBe('server-b');
  });
});
