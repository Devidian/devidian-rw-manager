import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
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

  disconnect() {
    this.readyState = 3;
    this.dispatchEvent(new Event('close'));
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event('open'));
  }

  receive(data: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}

const { GlobalIntercomProvider, useGlobalIntercom } = await import('@/context/GlobalIntercomContext');
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

  it('reconnects after the relay socket closes and restores player state', () => {
    vi.useFakeTimers();
    state.user = {
      id: 'user-1',
      username: 'Maik',
      steamId: '7656',
      role: 'user',
      pinnedServers: [],
    };

    try {
      renderPage();
      act(() => MockWebSocket.instances[0].open());

      expect(MockWebSocket.instances[0].sent).toHaveLength(2);

      act(() => MockWebSocket.instances[0].disconnect());
      expect(screen.getByText('globalIntercomStatus.disconnected')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(3000));

      expect(MockWebSocket.instances).toHaveLength(2);
      act(() => MockWebSocket.instances[1].open());

      expect(MockWebSocket.instances[1].sent).toHaveLength(2);
      expect(JSON.parse(MockWebSocket.instances[1].sent[0])).toMatchObject({
        event: 'playerOnline',
        payload: { playerName: 'Maik', playerUID: '7656' },
      });
      expect(JSON.parse(MockWebSocket.instances[1].sent[1])).toMatchObject({
        event: 'playerJoinChannel',
        payload: { playerName: 'Maik', playerUID: '7656', channel: 'global' },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders rich text colors in the message source', async () => {
    renderPage();
    act(() => MockWebSocket.instances[0].open());

    act(() => MockWebSocket.instances[0].receive({
      event: 'broadcastMessage',
      payload: {
        createdOn: '2026-06-25T09:00:00.000Z',
        chatVersion: 2,
        chatContent: 'Hello from server',
        chatChannel: 'global',
        playerName: 'Alice',
        playerUID: 'alice-uid',
        sourceName: '<color=#ff8800>GS1</color>',
        sourceIP: '127.0.0.1',
        sourceVersion: '1.0.0',
      },
    }));

    const source = await screen.findByText('GS1');
    expect(source).toHaveStyle({ color: '#ff8800' });
  });

  it('renders screenshot attachments from relay messages', async () => {
    renderPage();
    act(() => MockWebSocket.instances[0].open());

    act(() => MockWebSocket.instances[0].receive({
      event: 'broadcastMessage',
      payload: {
        createdOn: '2026-06-25T09:00:00.000Z',
        chatVersion: 2,
        chatContent: 'look here 🖼️',
        chatChannel: 'global',
        playerName: 'Alice',
        playerUID: 'alice-uid',
        sourceName: 'GS1',
        sourceIP: '127.0.0.1',
        sourceVersion: '1.0.0',
        attachment: '/9j/4AAQSkZJRgABAQAAAQABAAD',
      },
    }));

    await screen.findByText('look here 🖼️');
    const image = document.querySelector('img[src^="data:image/jpeg;base64,"]');
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD');
  });

  it('keeps only the latest 100 chat messages', async () => {
    renderPage();
    act(() => MockWebSocket.instances[0].open());

    for (let index = 0; index < 101; index += 1) {
      act(() => MockWebSocket.instances[0].receive(messageEnvelope(`message-${index}`)));
    }

    expect(screen.queryByText('message-0')).not.toBeInTheDocument();
    expect(await screen.findByText('message-1')).toBeInTheDocument();
    expect(screen.getByText('message-100')).toBeInTheDocument();
  });

  it('counts unread messages outside the chat route and clears them when opened', async () => {
    renderUnreadApp();
    act(() => MockWebSocket.instances[0].open());

    act(() => MockWebSocket.instances[0].receive(messageEnvelope('background message')));

    expect(await screen.findByTestId('unread-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('link', { name: 'open chat' }));

    expect(await screen.findByText('background message')).toBeInTheDocument();
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });
});

function renderPage() {
  render(
    <MemoryRouter>
      <GlobalIntercomProvider>
        <GlobalIntercomChatPage />
      </GlobalIntercomProvider>
    </MemoryRouter>,
  );
}

function renderUnreadApp() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <GlobalIntercomProvider>
        <UnreadCounter />
        <Link to="/global-intercom">open chat</Link>
        <Routes>
          <Route path="/global-intercom" element={<GlobalIntercomChatPage />} />
          <Route path="/" element={<div />} />
        </Routes>
      </GlobalIntercomProvider>
    </MemoryRouter>,
  );
}

function UnreadCounter() {
  const { unreadCount } = useGlobalIntercom();
  return <div data-testid="unread-count">{unreadCount}</div>;
}

function messageEnvelope(content: string) {
  return {
    event: 'broadcastMessage',
    payload: {
      createdOn: '2026-06-25T09:00:00.000Z',
      chatVersion: 2,
      chatContent: content,
      chatChannel: 'global',
      playerName: 'Alice',
      playerUID: 'alice-uid',
      sourceName: 'GS1',
      sourceIP: '127.0.0.1',
      sourceVersion: '1.0.0',
    },
  };
}
