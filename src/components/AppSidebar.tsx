import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from '@/components/ui/sidebar';
import { ServerWithStatus } from '@/types/server';
import { StorageMode } from '@/context/StorageModeContext';
import { LayoutDashboard, Server, Plus, Loader2, HardDrive, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichText } from '@/components/RichText';

interface AppSidebarProps {
  servers: ServerWithStatus[];
  onAddServer: () => void;
  storageMode: StorageMode;
  backendUrl: string | null;
}

function StatusIcon({ status }: { status: ServerWithStatus['status'] }) {
  if (status === 'online') return <span className="h-2 w-2 rounded-full status-dot-online shrink-0" />;
  if (status === 'offline') return <span className="h-2 w-2 rounded-full status-dot-offline shrink-0" />;
  if (status === 'loading') return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />;
  return <span className="h-2 w-2 rounded-full status-dot-unknown shrink-0" />;
}

function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('de') ? 'de' : 'en';
  const toggle = () => i18n.changeLanguage(current === 'de' ? 'en' : 'de');

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={toggle}
    >
      {current === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
    </Button>
  );
}

export function AppSidebar({ servers, onAddServer, storageMode, backendUrl }: AppSidebarProps) {
  const { t } = useTranslation();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 border border-primary/30">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground leading-none font-cinzel">{t('risingWorld')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('serverManager')}</p>
          </div>
        </div>

        <div className="mt-3">
          {storageMode === 'backend' ? (
            <Badge variant="outline" className="gap-1.5 text-xs w-full justify-center py-1 border-primary/30 text-primary/80">
              <Globe className="h-3 w-3" />
              {t('storageBackend')}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-xs w-full justify-center py-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              {t('storageLocal')}
            </Badge>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
            {t('navigation')}
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
                    <span>{t('dashboard')}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {servers.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
              {t('server')}
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
                        <span className="truncate text-sm">
                          <RichText text={server.label} />
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          onClick={onAddServer}
          size="sm"
          className="w-full gap-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 hover:text-primary"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          {t('addServer')}
        </Button>
        <div className="flex justify-center">
          <LanguageToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
