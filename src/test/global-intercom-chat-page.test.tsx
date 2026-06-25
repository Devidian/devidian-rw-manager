import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@/types/server';

const state = vi.hoisted(() => ({
  user: null as AuthUser | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: state.user,
    isAuthenticated: state.user != null,
  }),
}));

class MockWebSocket extends EventTarget {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  sent: string[] = [];
  readyState = 0;

  constructor(readonly url: string) {
    super();
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event('open'));
  }

  receive(data: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}

const { default: GlobalIntercomChatPage } = await import('@/pages/GlobalIntercomChatPage');

describe('global intercom chat page', () => {
  beforeEach(() => {
    state.user = null;
    MockWebSocket.instances = [];
    vi.stubEnv('VITE_GLOBAL_INTERCOM_WS_URL', 'ws://relay.example/ws');
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('allows anonymous users to read but not send', () => {
    renderPage();
    act(() => MockWebSocket.instances[0].open());

    expect(screen.getByText('globalIntercomReadOnlyTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('globalIntercomMessage')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('sends broadcast messages for signed-in users on the global channel', async () => {
    state.user = {
      id: 'user-1',
      username: 'Maik',
      steamId: '7656',
      role: 'user',
      pinnedServers: [],
    };

    renderPage();
    act(() => MockWebSocket.instances[0].open());

    fireEvent.change(screen.getByLabelText('globalIntercomMessage'), { target: { value: 'Hello global' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(MockWebSocket.instances[0].sent).toHaveLength(3));
    expect(JSON.parse(MockWebSocket.instances[0].sent[0])).toMatchObject({
      event: 'playerOnline',
      payload: { playerName: 'Maik', playerUID: '7656' },
    });
    expect(JSON.parse(MockWebSocket.instances[0].sent[1])).toMatchObject({
      event: 'playerJoinChannel',
      payload: { playerName: 'Maik', playerUID: '7656', channel: 'global' },
    });
    const payload = JSON.parse(MockWebSocket.instances[0].sent[2]);
    expect(payload).toMatchObject({
      event: 'broadcastMessage',
      payload: {
        chatContent: 'Hello global',
        chatChannel: 'global',
        playerName: 'Maik',
        playerUID: '7656',
      },
    });
  });

  it('ignores the relay echo for messages sent by the current user', async () => {
    state.user = {
      id: 'user-1',
      username: 'Maik',
      steamId: '7656',
      role: 'user',
      pinnedServers: [],
    };

    renderPage();
    act(() => MockWebSocket.instances[0].open());

    fireEvent.change(screen.getByLabelText('globalIntercomMessage'), { target: { value: 'Hello global' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(MockWebSocket.instances[0].sent).toHaveLength(3));
    const sent = JSON.parse(MockWebSocket.instances[0].sent[2]);
    act(() => MockWebSocket.instances[0].receive(sent));

    expect(screen.getAllByText('Hello global')).toHaveLength(1);
  });
});

function renderPage() {
  render(
    <MemoryRouter>
      <GlobalIntercomChatPage />
    </MemoryRouter>,
  );
}
