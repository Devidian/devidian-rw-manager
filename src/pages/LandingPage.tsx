import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorageMode } from '@/context/StorageModeContext';
import { checkBackend } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HardDrive,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Server,
  ArrowRight,
  Wifi,
} from 'lucide-react';

type CheckState = 'idle' | 'checking' | 'ok' | 'unreachable' | 'invalid-response' | 'missing-service';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setLocalMode, setBackendMode } = useStorageMode();

  const [backendUrl, setBackendUrl] = useState('');
  const [checkState, setCheckState] = useState<CheckState>('idle');

  const handleLocal = () => {
    setLocalMode();
    navigate('/');
  };

  const handleCheckBackend = async () => {
    if (!backendUrl.trim()) return;
    setCheckState('checking');
    const result = await checkBackend(backendUrl.trim(), 'storage');
    if (result.ok) {
      setCheckState('ok');
      setBackendMode(backendUrl.trim());
      setTimeout(() => navigate('/'), 800);
    } else {
      const r = result as { ok: false; reason: string };
      setCheckState(r.reason as CheckState);
    }
  };

  const errorMessages: Record<string, string> = {
    unreachable: 'Backend nicht erreichbar. Prüfe die URL und stelle sicher, dass der Server läuft.',
    'invalid-response': 'Kein gültiger Server. Der Server antwortete nicht mit dem erwarteten Format.',
    'missing-service': 'Dieser Server bietet keinen Storage-Service an.',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Server className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground font-display">RisingWorld Server Manager</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Wähle, wie deine Server-Konfigurationen gespeichert werden sollen.
        </p>
      </div>

      {/* Mode cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A: Local */}
        <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer group" onClick={handleLocal}>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
              <HardDrive className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <CardTitle className="text-lg">Lokal (Browser)</CardTitle>
            <CardDescription>
              Server-Konfigurationen werden im Browser gespeichert. Kein Backend erforderlich.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Sofort einsatzbereit
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Kein Login nötig
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                Daten nur im aktuellen Browser
              </li>
            </ul>
            <Button className="w-full gap-2 group-hover:bg-primary/90" onClick={handleLocal}>
              Lokal starten
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Option B: Backend */}
        <Card className="bg-card border-border hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Eigenes Backend</CardTitle>
            <CardDescription>
              Verbinde einen selbst gehosteten Storage-Server für gemeinsamen Zugriff.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Geteilte Server-Liste
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Multi-User fähig
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                Eigener Server erforderlich
              </li>
            </ul>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="http://localhost:3000"
                  value={backendUrl}
                  onChange={e => { setBackendUrl(e.target.value); setCheckState('idle'); }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckBackend()}
                  className="text-sm"
                  disabled={checkState === 'checking' || checkState === 'ok'}
                />
                <Button
                  onClick={handleCheckBackend}
                  disabled={!backendUrl.trim() || checkState === 'checking' || checkState === 'ok'}
                  className="shrink-0 gap-1.5"
                >
                  {checkState === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : checkState === 'ok' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  Prüfen
                </Button>
              </div>

              {/* Status feedback */}
              {checkState === 'ok' && (
                <Badge className="gap-1.5 bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)] w-full justify-center py-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verbunden – wird weitergeleitet…
                </Badge>
              )}
              {checkState !== 'idle' && checkState !== 'checking' && checkState !== 'ok' && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{errorMessages[checkState]}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Du kannst die Wahl später in den Einstellungen ändern.
      </p>
    </div>
  );
}
