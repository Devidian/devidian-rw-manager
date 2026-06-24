import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ServerProvider, useServerContext } from '@/context/ServerContext';
import { StorageModeProvider, useStorageMode } from '@/context/StorageModeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { checkBackend } from '@/lib/storage';
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import Index from './pages/Index';
import ServerDetailPage from './pages/ServerDetailPage';
import ServerListPage from './pages/ServerListPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SteamCallbackPage from './pages/SteamCallbackPage';
import { LocalPinSyncDialog } from './components/LocalPinSyncDialog';

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
  const { pinnedServerList } = useServerContext();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          servers={pinnedServerList}
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
              <Route path="/" element={<Index />} />
              <Route path="/serverliste" element={<ServerListPage />} />
              <Route path="/server/:id" element={<ServerDetailPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>

      <LocalPinSyncDialog />
      <SessionExpiredDialog />
    </SidebarProvider>
  );
}

/** Auth guard: redirects to login if forceAuth is active */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { requiresAuth, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && requiresAuth && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isLoading, requiresAuth, isAuthenticated, navigate]);

  if (isLoading) return null;
  if (requiresAuth && !isAuthenticated) return null;
  return <>{children}</>;
}

/** Resolves backend services for auth context */
function AppWithAuth({ children }: { children: React.ReactNode }) {
  const { fixedBackendUrl } = useStorageMode();
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    if (!fixedBackendUrl) { setServices([]); return; }
    checkBackend(fixedBackendUrl, 'storage').then(r => {
      if (r.ok) setServices(r.services);
      else setServices([]);
    });
  }, [fixedBackendUrl]);

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
        {isConfigured ? (
          <Route
            path="*"
            element={
              <ServerProvider>
                <AuthGuard>
                  <Layout />
                </AuthGuard>
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StorageModeProvider>
        <AppRoutes />
      </StorageModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
