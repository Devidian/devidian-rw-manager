import { useServerContext } from '@/context/ServerContext';
import { AddServerDialog } from '@/components/AddServerDialog';
import { ServerCard } from '@/components/ServerCard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Plus, Server, RefreshCw } from 'lucide-react';

export default function Index() {
  const [addOpen, setAddOpen] = useState(false);
  const { servers, serverList, addServer, removeServer, refreshAll, refreshOne } = useServerContext();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {servers.length === 0
              ? 'Füge deinen ersten Server hinzu um zu beginnen.'
              : `${serverList.filter(s => s.status === 'online').length} von ${servers.length} Server${servers.length !== 1 ? 'n' : ''} online`}
          </p>
        </div>
        <div className="flex gap-2">
          {servers.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={refreshAll}
            >
              <RefreshCw className="h-4 w-4" />
              Alle prüfen
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Server hinzufügen
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {servers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 border border-border mb-6">
            <Server className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Noch kein Server eingetragen</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Füge einen RisingWorld-Server mit seiner Query-URL hinzu, um Status, Spieler und mehr im Blick zu behalten.
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ersten Server hinzufügen
          </Button>
        </div>
      )}

      {/* Server grid */}
      {servers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serverList.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              onRefresh={() => refreshOne(server.id)}
              onDelete={() => void removeServer(server.id)}
            />
          ))}
        </div>
      )}

      <AddServerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addServer}
      />
    </div>
  );
}
