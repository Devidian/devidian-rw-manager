import { useTranslation } from 'react-i18next';
import type { PluginInfo } from '@/types/adminMapping';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function PluginsTab({ plugins, loading, error }: { plugins: PluginInfo[]; loading: boolean; error: boolean }) {
  const { t } = useTranslation();
  if (loading) return <p className="text-sm text-muted-foreground">{t('loadingPlugins')}</p>;
  if (error) return <p className="text-sm text-destructive">{t('backendError')}</p>;
  if (plugins.length === 0) return <p className="text-sm text-muted-foreground">{t('noPlugins')}</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {plugins.map((plugin, index) => (
        <Card key={`${plugin.name ?? 'plugin'}-${plugin.version ?? 'unknown'}-${index}`}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{plugin.name ?? t('unknown')}</p>
            </div>
            <Badge variant={plugin.valid ? 'secondary' : 'destructive'}>
              {plugin.valid ? plugin.version ?? t('unknown') : t('invalidPlugin')}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
