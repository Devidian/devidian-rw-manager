import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ServerWithStatus } from '@/types/server';
import { LayoutDashboard, Server, Plus, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  servers: ServerWithStatus[];
  onAddServer: () => void;
}

function StatusIcon({ status }: { status: ServerWithStatus['status'] }) {
  if (status === 'online') return <span className="h-2 w-2 rounded-full status-dot-online shrink-0" />;
  if (status === 'offline') return <span className="h-2 w-2 rounded-full status-dot-offline shrink-0" />;
  if (status === 'loading') return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />;
  return <span className="h-2 w-2 rounded-full status-dot-unknown shrink-0" />;
}

export function AppSidebar({ servers, onAddServer }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 border border-primary/30">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground leading-none font-cinzel">RisingWorld</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Server Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {servers.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
              Server
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {servers.map(server => (
                  <SidebarMenuItem key={server.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/server/${server.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <StatusIcon status={server.status} />
                        <span className="truncate text-sm">{server.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          onClick={onAddServer}
          size="sm"
          className="w-full gap-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 hover:text-primary"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Server hinzufügen
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
