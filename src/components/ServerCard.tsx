import { ServerWithStatus } from '@/types/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Tag, RefreshCw, Trash2, Loader2, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  server: ServerWithStatus;
  onRefresh: () => void;
  onDelete: () => void;
}

function StatusBadge({ status }: { status: ServerWithStatus['status'] }) {
  if (status === 'loading') {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground border-border">
        <Loader2 className="h-3 w-3 animate-spin" />
        Prüfe...
      </Badge>
    );
  }
  if (status === 'online') {
    return (
      <Badge className="gap-1.5 bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)] hover:bg-[hsl(120_55%_42%/0.2)]">
        <span className="h-1.5 w-1.5 rounded-full status-dot-online" />
        Online
      </Badge>
    );
  }
  if (status === 'offline') {
    return (
      <Badge className="gap-1.5 bg-[hsl(0_55%_42%/0.15)] text-[hsl(0_55%_65%)] border-[hsl(0_55%_42%/0.4)] hover:bg-[hsl(0_55%_42%/0.2)]">
        <span className="h-1.5 w-1.5 rounded-full status-dot-offline" />
        Offline
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground border-border">
      <span className="h-1.5 w-1.5 rounded-full status-dot-unknown" />
      Unbekannt
    </Badge>
  );
}

export function ServerCard({ server, onRefresh, onDelete }: ServerCardProps) {
  const navigate = useNavigate();
  const data = server.queryData;
  const serverName = data?.name ?? server.label;
  const map = data?.map ?? '—';
  const playercount = data?.playercount ?? 0;
  const maxplayers = data?.maxplayers ?? '?';
  const version = data?.version;

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg',
        'bg-card border-border stone-texture relative overflow-hidden'
      )}
      onClick={() => navigate(`/server/${server.id}`)}
    >
      {/* Top color accent bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-0.5',
          server.status === 'online' ? 'bg-[hsl(var(--status-online))]' :
          server.status === 'offline' ? 'bg-[hsl(var(--status-offline))]' :
          'bg-border'
        )}
      />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate leading-tight">{serverName}</h3>
            {server.label !== serverName && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{server.label}</p>
            )}
          </div>
          <StatusBadge status={server.status} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium">{playercount}</span>
            <span>/ {maxplayers}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{map}</span>
          </div>
          {version && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">v{version}</span>
            </div>
          )}
          {server.lastChecked && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">
                {formatDistanceToNow(server.lastChecked, { addSuffix: true, locale: de })}
              </span>
            </div>
          )}
        </div>

        {server.errorMessage && server.status === 'offline' && (
          <p className="text-xs text-destructive/80 mb-3 truncate">
            {server.errorMessage}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); onRefresh(); }}
              title="Status aktualisieren"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Server entfernen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Details
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
