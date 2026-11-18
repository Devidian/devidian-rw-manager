import { useState, useEffect, useMemo } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ServerProvider, useServerContext } from '@/context/ServerContext';
import { StorageModeProvider, useStorageMode } from '@/context/StorageModeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GlobalIntercomProvider } from '@/context/GlobalIntercomContext';
import { BackendInfoProvider, useBackendInfo } from '@/context/BackendInfoContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import Index from './pages/Index';
import ServerDetailPage from './pages/ServerDetailPage';
import ServerListPage from './pages/ServerListPage';
import ParticipationPage from './pages/ParticipationPage';
import PlayerListPage from './pages/PlayerListPage';
import { listOnlinePlayers } from '@/lib/onlinePlayers';
import { usePublicOnlinePlayers } from '@/hooks/usePublicOnlinePlayers';
import { PlayerProfileGuard } from '@/components/PlayerProfileGuard';
import StatisticsPage from './pages/StatisticsPage';
import GlobalIntercomChatPage from './pages/GlobalIntercomChatPage';
import UserManagementPage from './pages/UserManagementPage';
import ServerDuplicatesPage from './pages/ServerDuplicatesPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SteamCallbackPage from './pages/SteamCallbackPage';
import { LegalFooter } from './components/LegalFooter';
import LegalPage from './pages/LegalPage';
import EmbeddedMapPage from './pages/EmbeddedMapPage';

const queryClient = new QueryClient();

function SessionExpiredDialog() {
  const { t } = useTranslation();
  const { sessionExpired, clearSessionExpired, requiresAuth } = useAuth();
  const navigate = useNavigate();

  const handleConfirm = () => {
    clearSessionExpired();
    if (requiresAuth) {
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <AlertDialog open={sessionExpired}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sessionExpiredTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('sessionExpiredMessage')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>{t('sessionExpiredConfirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Layout() {
  const { pinnedServerList, serverList } = useServerContext();
  const { isAuthenticated } = useAuth();
  const { fixedBackendUrl, backendUrl } = useStorageMode();
  const publicNames = usePublicOnlinePlayers(fixedBackendUrl ?? backendUrl, serverList, isAuthenticated);
  const onlinePlayers = useMemo(() => listOnlinePlayers(serverList, publicNames), [serverList, publicNames]);

  return (
    <GlobalIntercomProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar
            servers={pinnedServerList}
            onlinePlayerCount={onlinePlayers.length}
          />

          <div className="flex flex-col flex-1 min-w-0">
            <header className="h-12 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-4 shrink-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="ml-3 text-xs text-muted-foreground select-none">
                RisingWorld Server Manager
              </div>
            </header>

            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<DashboardRoute />} />
                <Route path="/serverliste" element={<ServerListPage />} />
                <Route path="/teilnehmen" element={<ParticipationPage />} />
                <Route path="/spielerliste" element={<ProtectedRoute><PlayerListPage onlinePlayers={onlinePlayers} /></ProtectedRoute>} />
                <Route path="/player/:id" element={<PlayerProfileGuard />} />
                <Route path="/statistiken" element={<StatisticsPage />} />
                <Route path="/global-intercom" element={<ProtectedRoute><GlobalIntercomChatPage /></ProtectedRoute>} />
                <Route path="/server/:id" element={<ServerDetailPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/server-duplicates" element={<ServerDuplicatesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <LegalFooter />
          </div>
        </div>

        <SessionExpiredDialog />
      </SidebarProvider>
    </GlobalIntercomProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/serverliste" replace />;
}

function DashboardRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Index /> : <Navigate to="/serverliste" replace />;
}

/** Resolves backend services for auth context */
function AppWithAuth({ children }: { children: React.ReactNode }) {
  const { services } = useBackendInfo();

  return (
    <AuthProvider backendServices={services}>
      {children}
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isConfigured } = useStorageMode();

  return (
    <AppWithAuth>
      <Routes>
        <Route path="/setup" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/steam/callback" element={<SteamCallbackPage />} />
        <Route path="/embedded-map/:serverId/auth/steam/callback" element={<EmbeddedMapSteamCallbackPage />} />
        <Route path="/embedded-map" element={<EmbeddedMapPage />} />
        <Route path="/embedded-map/:serverId" element={<EmbeddedMapPage />} />
        <Route path="/imprint" element={<LegalPage pageKey="imprint" />} />
        <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
        <Route path="/terms" element={<LegalPage pageKey="terms" />} />
        <Route path="/community-rules" element={<LegalPage pageKey="community-rules" />} />
        <Route path="/report" element={<LegalPage pageKey="report" />} />
        {isConfigured ? (
          <Route
            path="*"
            element={
              <ServerProvider>
                <Layout />
              </ServerProvider>
            }
          />
        ) : (
          <Route path="*" element={<Navigate to="/setup" replace />} />
        )}
      </Routes>
    </AppWithAuth>
  );
}

function EmbeddedMapSteamCallbackPage() {
  const { serverId } = useParams<{ serverId: string }>();
  return <SteamCallbackPage returnTo={`/embedded-map/${encodeURIComponent(serverId ?? '')}`} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StorageModeProvider>
        <BackendInfoProvider>
          <AppRoutes />
        </BackendInfoProvider>
      </StorageModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
