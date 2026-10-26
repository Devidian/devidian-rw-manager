import { useTranslation } from 'react-i18next';
import type { PluginInfo, ServerPluginsResponse } from '@/types/adminMapping';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function PluginsTab({ plugins, latestVersions, nativeAccess = 'available', loading, error }: { plugins: PluginInfo[]; latestVersions: Record<string, string>; nativeAccess?: ServerPluginsResponse['nativeAccess']; loading: boolean; error: boolean }) {
  const { t } = useTranslation();
  if (loading) return <p className="text-sm text-muted-foreground">{t('loadingPlugins')}</p>;
  if (error) return <p className="text-sm text-destructive">{t('backendError')}</p>;
  if (nativeAccess === 'noAccess') return <p className="text-sm text-destructive">{t('nativeAccessDenied')}</p>;
  if (plugins.length === 0) return <p className="text-sm text-muted-foreground">{t('noPlugins')}</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {plugins.map((plugin, index) => (
        <Card key={`${plugin.name ?? 'plugin'}-${plugin.version ?? 'unknown'}-${index}`}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{plugin.name ?? t('unknown')}</p>
            </div>
            <Badge title={plugin.name ? latestVersions[plugin.name] : undefined} className={versionBadgeClass(plugin, latestVersions)} variant={plugin.valid ? 'secondary' : 'destructive'}>
              {plugin.valid ? plugin.version ?? t('unknown') : t('invalidPlugin')}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function versionBadgeClass(plugin: PluginInfo, latestVersions: Record<string, string>): string | undefined {
  const latest = plugin.name ? latestVersions[plugin.name] : undefined;
  if (!plugin.valid || !plugin.version || !latest) return undefined;
  const installed = parseVersion(plugin.version);
  const available = parseVersion(latest);
  if (!installed || !available || installed.major === available.major && installed.minor === available.minor && installed.patch >= available.patch) return undefined;
  if (available.major > installed.major) return 'bg-red-600 text-white hover:bg-red-600';
  if (available.minor > installed.minor) return installed.major === 0
    ? 'bg-red-600 text-white hover:bg-red-600'
    : 'bg-orange-500 text-white hover:bg-orange-500';
  return 'bg-yellow-400 text-black hover:bg-yellow-400';
}

function parseVersion(value: string): { major: number; minor: number; patch: number } | null {
  const match = value.trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
}
