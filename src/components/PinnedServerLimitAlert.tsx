import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PinnedServerLimitAlert({ max }: { max: number }) {
  const { t } = useTranslation();
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('pinnedServerLimitTitle')}</AlertTitle>
      <AlertDescription>{t('pinnedServerLimitDesc', { max })}</AlertDescription>
    </Alert>
  );
}
