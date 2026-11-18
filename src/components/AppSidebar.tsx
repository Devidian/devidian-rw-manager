import { getServerPlayerCount } from '@/lib/serverDisplay';
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
import { BarChart3, LayoutDashboard, Server, Loader2, LogOut, LogIn, User, Users, List, MessageSquare, GitMerge, Handshake, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    current: getServerPlayerCount(server),
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

function NavigationItem({ to, label, icon, badge, locked, admin }: {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  locked?: boolean;
  admin?: boolean;
}) {
  const { t } = useTranslation();
  const content = <>{icon}<span className="min-w-0 flex-1 truncate">{label}</span></>;

  return (
    <SidebarMenuItem>
      {locked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span role="link" aria-disabled="true" tabIndex={0}
              className="flex h-8 cursor-default items-center gap-3 rounded px-3 text-sm text-sidebar-foreground/50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sidebar-ring">
              {content}
              <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">{t('navigationLoginRequired')}</TooltipContent>
        </Tooltip>
      ) : (
        <SidebarMenuButton asChild>
          <NavLink to={to} end={to === '/'}
            className={`flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-sidebar-accent ${admin ? 'text-amber-300 hover:text-amber-200' : 'text-sidebar-foreground'}`}
            activeClassName={admin ? 'bg-sidebar-accent text-amber-200 font-medium' : 'bg-sidebar-accent text-primary font-medium'}>
            {content}
            {badge !== undefined && badge > 0 && (
              <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums">
                {badge > 99 ? '99+' : badge}
              </Badge>
            )}
          </NavLink>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
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
              <NavigationItem to="/" label={t('dashboard')} icon={<LayoutDashboard className="size-4 shrink-0" />} locked={!isAuthenticated} />
              <NavigationItem to="/serverliste" label={t('serverList')} icon={<List className="size-4 shrink-0" />} />
              <NavigationItem to="/statistiken" label={t('statistics')} icon={<BarChart3 className="size-4 shrink-0" />} />
              <NavigationItem to="/spielerliste" label={t('playerList')} icon={<Users className="size-4 shrink-0" />} locked={!isAuthenticated} badge={onlinePlayerCount} />
              <NavigationItem to="/global-intercom" label={t('globalIntercomChat')} icon={<MessageSquare className="size-4 shrink-0" />} locked={!isAuthenticated} badge={unreadCount} />
              <li role="separator" className="mx-3 my-1 border-t border-sidebar-border" />
              <NavigationItem to="/teilnehmen" label={t('participation.title')} icon={<Handshake className="size-4 shrink-0" />} />
              {isAuthenticated && isSuperAdmin && (
                <>
                  <li role="separator" className="mx-3 my-1 border-t border-sidebar-border" />
                  <NavigationItem to="/admin/users" label={t('userManagement')} icon={<Users className="size-4 shrink-0" />} admin />
                  <NavigationItem to="/admin/server-duplicates" label={t('serverDuplicates')} icon={<GitMerge className="size-4 shrink-0" />} admin />
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {servers.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
              {t('myServers')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {servers.map(server => {
                  const players = getPlayerCount(server);
                  const serverName = server.queryData?.name || server.name || server.label;
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
                            <RichText text={serverName} />
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
