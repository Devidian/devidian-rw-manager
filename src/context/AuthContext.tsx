import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '@/types/server';
import * as authApi from '@/lib/authApi';
import { TOKEN_KEY } from '@/lib/authApi';
import { steamProvider, extractOpenIdParams } from '@/lib/steamAuth';
import { useStorageMode } from '@/context/StorageModeContext';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  requiresAuth: boolean;
  hasAuthService: boolean;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username?: string; email: string; password: string; steamId?: string }) => Promise<void>;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
  linkSteamId: (steamId: string) => Promise<void>;
  handleSteamCallback: (search: string) => Promise<void>;
  disconnectSteam: () => Promise<void>;
  updateProfile: (data: { name: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getBackendUrl(mode: string, backendUrl: string | null, fixedBackendUrl: string | null): string | null {
  if (mode === 'fixed') return fixedBackendUrl;
  if (mode === 'backend') return backendUrl;
  return null;
}

export function AuthProvider({
  children,
  backendServices,
}: {
  children: ReactNode;
  backendServices: string[];
}) {
  const { mode, backendUrl, fixedBackendUrl } = useStorageMode();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const baseUrl = getBackendUrl(mode, backendUrl, fixedBackendUrl)?.replace(/\/$/, '') ?? '';
  const hasAuthService = backendServices.includes('auth');
  const requiresAuth = backendServices.includes('forceAuth');
  const fixedAdmin = import.meta.env.VITE_FIXED_BACKEND_ADMIN as string | undefined;

  const isSuperAdmin = user != null && !!fixedAdmin && user.steamId === fixedAdmin;

  const isAdmin = user != null && (
    user.role === 'admin' ||
    isSuperAdmin
  );

  const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  // Validate session on mount
  useEffect(() => {
    const token = getToken();
    if (!token || !baseUrl || !hasAuthService) {
      setIsLoading(false);
      return;
    }
    authApi.validate(baseUrl, token)
      .then(res => setUser(res.user))
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setIsLoading(false));
  }, [baseUrl, hasAuthService]);

  // Listen for 401 session-expired events
  useEffect(() => {
    if (!baseUrl || !hasAuthService) return;
    let handling = false;
    const handler = async () => {
      if (handling) return;
      handling = true;
      const token = getToken();
      if (!token) { handling = false; return; }
      try {
        const res = await authApi.validate(baseUrl, token);
        setUser(res.user);
      } catch {
        clearToken();
        setUser(null);
        setSessionExpired(true);
      }
      handling = false;
    };
    window.addEventListener('rwm:session-expired', handler);
    return () => window.removeEventListener('rwm:session-expired', handler);
  }, [baseUrl, hasAuthService]);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const loginFn = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(baseUrl, { username, password });
    saveToken(res.token);
    setUser(res.user);
  }, [baseUrl]);

  const registerFn = useCallback(async (data: { username?: string; email: string; password: string; steamId?: string }) => {
    const res = await authApi.register(baseUrl, data);
    saveToken(res.token);
    setUser(res.user);
  }, [baseUrl]);

  const loginWithSteam = useCallback(() => {
    const origin = window.location.origin;
    const base = ((window as unknown as Record<string, unknown>)['__BASE_URL__'] as string) ?? '/';
    const returnTo = `${origin}${base === '/' ? '' : base.replace(/\/$/, '')}/auth/steam/callback`;
    steamProvider.startLogin(returnTo, origin);
  }, []);

  const handleSteamCallback = useCallback(async (search: string) => {
    const params = extractOpenIdParams(search);
    const res = await authApi.steamCallback(baseUrl, params);
    saveToken(res.token);
    setUser(res.user);
  }, [baseUrl]);

  const logoutFn = useCallback(async () => {
    const token = getToken();
    if (token && baseUrl) {
      try { await authApi.logout(baseUrl, token); } catch { /* ignore */ }
    }
    clearToken();
    setUser(null);
  }, [baseUrl]);

  const linkSteamIdFn = useCallback(async (steamId: string) => {
    const token = getToken();
    if (!token) return;
    const res = await authApi.linkSteamId(baseUrl, token, steamId);
    setUser(res.user);
  }, [baseUrl]);

  const disconnectSteam = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await authApi.steamDisconnect(baseUrl, token);
    if (res.token) saveToken(res.token);
    setUser(res.user);
  }, [baseUrl]);

  const updateProfile = useCallback(async (data: { name: string }) => {
    const token = getToken();
    if (!token) return;
    const res = await authApi.updateSelf(baseUrl, token, data);
    setUser(res.user);
  }, [baseUrl]);

  const deleteAccount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    await authApi.deleteSelf(baseUrl, token);
    clearToken();
    setUser(null);
  }, [baseUrl]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: user != null,
      isAdmin,
      isSuperAdmin,
      isLoading,
      requiresAuth,
      hasAuthService,
      sessionExpired,
      clearSessionExpired,
      login: loginFn,
      register: registerFn,
      loginWithSteam,
      logout: logoutFn,
      linkSteamId: linkSteamIdFn,
      handleSteamCallback,
      disconnectSteam,
      updateProfile,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
