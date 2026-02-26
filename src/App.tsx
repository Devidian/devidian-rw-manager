import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AddServerDialog } from '@/components/AddServerDialog';
import { ServerProvider, useServerContext } from '@/context/ServerContext';
import { StorageModeProvider, useStorageMode } from '@/context/StorageModeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { checkBackend } from '@/lib/storage';
import Index from './pages/Index';
import ServerDetailPage from './pages/ServerDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SteamCallbackPage from './pages/SteamCallbackPage';

const queryClient = new QueryClient();

function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  const { serverList, addServer } = useServerContext();
  const { mode, backendUrl, fixedBackendUrl } = useStorageMode();
  const { isAdmin, isAuthenticated, hasAuthService } = useAuth();

  const canAddServer = mode === 'local' || isAdmin;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          servers={serverList}
          onAddServer={canAddServer ? () => setAddOpen(true) : undefined}
          storageMode={mode}
          backendUrl={mode === 'fixed' ? fixedBackendUrl : backendUrl}
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
              <Route path="/server/:id" element={<ServerDetailPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>

      {canAddServer && (
        <AddServerDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onAdd={addServer}
          isBackendMode={mode === 'fixed' || mode === 'backend'}
        />
      )}
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
  const { mode, backendUrl, fixedBackendUrl } = useStorageMode();
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    const url = mode === 'fixed' ? fixedBackendUrl : mode === 'backend' ? backendUrl : null;
    if (!url) { setServices([]); return; }
    checkBackend(url, 'storage').then(r => {
      if (r.ok) setServices(r.services);
      else setServices([]);
    });
  }, [mode, backendUrl, fixedBackendUrl]);

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
