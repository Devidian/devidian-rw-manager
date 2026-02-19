import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AddServerDialog } from '@/components/AddServerDialog';
import { ServerProvider, useServerContext } from '@/context/ServerContext';
import Index from './pages/Index';
import ServerDetailPage from './pages/ServerDetailPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function Layout() {
  const [addOpen, setAddOpen] = useState(false);
  const { serverList, addServer } = useServerContext();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar servers={serverList} onAddServer={() => setAddOpen(true)} />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Top bar */}
          <header className="h-12 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-3 text-xs text-muted-foreground select-none">
              RisingWorld Server Manager
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/server/:id" element={<ServerDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>

      <AddServerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addServer}
      />
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ServerProvider>
          <Layout />
        </ServerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
