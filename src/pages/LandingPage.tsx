import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStorageMode } from '@/context/StorageModeContext';
import { checkBackend, type BackendCheckResult } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LegalFooter } from '@/components/LegalFooter';
import { AlertTriangle, CheckCircle, Loader2, Server, WifiOff } from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasFixedBackend, fixedBackendUrl } = useStorageMode();
  const [check, setCheck] = useState<BackendCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!fixedBackendUrl) return;
    setChecking(true);
    checkBackend(fixedBackendUrl, 'storage')
      .then(result => {
        setCheck(result);
        if (result.ok) navigate('/', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [fixedBackendUrl, navigate]);

  const reason = check && !check.ok ? check.reason : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              {hasFixedBackend ? <Server className="h-6 w-6 text-primary" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
            </div>
            <CardTitle>{t('landingTitle')}</CardTitle>
            <CardDescription>
              {hasFixedBackend ? t('dedicatedBackendChecking') : t('dedicatedBackendMissing')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fixedBackendUrl && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground break-all">
                {fixedBackendUrl}
              </div>
            )}

            {checking && (
              <Badge variant="outline" className="w-full justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('connectionCheck')}
              </Badge>
            )}

            {check?.ok && (
              <Badge className="w-full justify-center gap-2 py-2 bg-[hsl(120_55%_42%/0.15)] text-[hsl(120_55%_62%)] border-[hsl(120_55%_42%/0.4)]">
                <CheckCircle className="h-4 w-4" />
                {t('connected')}
              </Badge>
            )}

            {reason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                <WifiOff className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  {reason === 'unreachable' && t('errUnreachable')}
                  {reason === 'invalid-response' && t('errInvalidResponse')}
                  {reason === 'missing-service' && t('errMissingService')}
                </p>
              </div>
            )}

            {!hasFixedBackend && (
              <p className="text-sm text-muted-foreground">{t('dedicatedBackendMissingDesc')}</p>
            )}

            <Button
              className="w-full"
              disabled={!check?.ok}
              onClick={() => navigate('/', { replace: true })}
            >
              {t('fixedConnect')}
            </Button>
          </CardContent>
        </Card>
      </main>
      <LegalFooter />
    </div>
  );
}
