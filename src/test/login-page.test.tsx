import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const loginWithSteam = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ loginWithSteam, hasAuthService: true }),
}));
vi.mock('@/components/LegalFooter', () => ({ LegalFooter: () => null }));

const { default: LoginPage } = await import('@/pages/LoginPage');

describe('login page', () => {
  it('uses Valve sign-in artwork and starts Steam OpenID login', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    const button = screen.getByRole('button', { name: 'loginWithSteam' });
    const image = button.querySelector('img');
    expect(image).toHaveAttribute('src', expect.stringContaining('steam-sign-in'));
    expect(image).toHaveAttribute('width', '180');
    expect(image).toHaveAttribute('height', '35');

    fireEvent.click(button);
    expect(loginWithSteam).toHaveBeenCalledOnce();
  });
});
