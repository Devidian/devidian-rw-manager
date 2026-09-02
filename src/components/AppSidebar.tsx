import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from '@/components/ui/sidebar';
import { ServerWithStatus } from '@/types/server';
import { useAuth } from '@/context/AuthContext';
import { useGlobalIntercom } from '@/context/GlobalIntercomContext';
import { BarChart3, LayoutDashboard, Server, Loader2, LogOut, LogIn, User, Users, List, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichText } from '@/components/RichText';

interface AppSidebarProps {
  servers: ServerWithStatus[];
  onlinePlayerCount: number;
}

function StatusIcon({ status }: { status: ServerWithStatus['status'] }) {
  if (status === 'online') return <span className="h-2 w-2 rounded-full status-dot-online shrink-0" />;
  if (status === 'offline') return <span className="h-2 w-2 rounded-full status-dot-offline shrink-0" />;
  if (status === 'loading') return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />;
  return <span className="h-2 w-2 rounded-full status-dot-unknown shrink-0" />;
}

function getPlayerCount(server: ServerWithStatus): { current: number | string; max: number | string } {
  return {
    current: server.onlinePlayers?.length ?? server.queryData?.playercount ?? 0,
    max: server.queryData?.maxplayers ?? '?',
  };
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

export function AppSidebar({ servers, onlinePlayerCount }: AppSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, hasAuthService, logout } = useAuth();
  const { unreadCount } = useGlobalIntercom();

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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/serverliste"
                    className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <List className="h-4 w-4 shrink-0" />
                    <span>{t('serverList')}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/spielerliste"
                    className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{t('playerList')}</span>
                    {onlinePlayerCount > 0 && (
                      <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums">
                        {onlinePlayerCount > 99 ? '99+' : onlinePlayerCount}
                      </Badge>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/statistiken"
                    className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>{t('statistics')}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/global-intercom"
                    className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{t('globalIntercomChat')}</span>
                    {unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin/users"
                      className="flex items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{t('userManagement')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
                {servers.map(server => {
                  const players = getPlayerCount(server);
                  return (
                    <SidebarMenuItem key={server.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/server/${server.id}`}
                          className="flex min-w-0 items-center gap-3 px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-accent text-primary font-medium"
                        >
                          <StatusIcon status={server.status} />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            <RichText text={server.label} />
                          </span>
                          <span className="shrink-0 rounded border border-sidebar-border bg-sidebar-accent/40 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                            {players.current}/{players.max}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        {/* User display — clickable to profile */}
        {hasAuthService && isAuthenticated && user && (
          <div
            className="flex items-center gap-2 px-1 cursor-pointer hover:bg-sidebar-accent rounded py-1 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">
              {user.username || user.email || user.steamId}
            </span>
            {isAdmin && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                {t('adminBadge')}
              </Badge>
            )}
          </div>
        )}

        {/* Auth buttons */}
        {hasAuthService && isAuthenticated && (
          <Button
            onClick={logout}
            size="sm"
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t('logoutButton')}
          </Button>
        )}

        {hasAuthService && !isAuthenticated && (
          <Button
            onClick={() => navigate('/auth/login')}
            size="sm"
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            {t('loginSubmit')}
          </Button>
        )}

        <div className="flex justify-center">
          <LanguageToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
