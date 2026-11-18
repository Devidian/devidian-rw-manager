import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state }));
vi.mock('@/pages/PlayerProfilePage', () => ({ default: () => <div>Private profile</div> }));
const { PlayerProfileGuard } = await import('@/components/PlayerProfileGuard');

function renderRoute() {
  return render(<MemoryRouter initialEntries={['/player/aaaaaaaaaaaaaaaaaaaaaaaa']}><Routes>
    <Route path="/player/:id" element={<PlayerProfileGuard />} />
    <Route path="/auth/login" element={<div>Login</div>} />
  </Routes></MemoryRouter>);
}

describe('player profile access', () => {
  it('waits for session validation before rendering or redirecting', () => {
    state.isLoading = true;
    state.isAuthenticated = false;
    const { container, rerender } = renderRoute();
    expect(container).toBeEmptyDOMElement();
    state.isLoading = false;
    rerender(<MemoryRouter initialEntries={['/player/aaaaaaaaaaaaaaaaaaaaaaaa']}><Routes>
      <Route path="/player/:id" element={<PlayerProfileGuard />} />
      <Route path="/auth/login" element={<div>Login</div>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders the profile for a signed-in player', () => {
    state.isLoading = false;
    state.isAuthenticated = true;
    renderRoute();
    expect(screen.getByText('Private profile')).toBeInTheDocument();
  });
});
