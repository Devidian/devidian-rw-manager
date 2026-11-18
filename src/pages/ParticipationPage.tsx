import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const paths = ['websocket', 'marker', 'contact'] as const;

export default function ParticipationPage() {
  const { t } = useTranslation();
  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{t('participation.title')}</h1>
      <p className="text-muted-foreground">{t('participation.intro')}</p>
    </div>
    {paths.map((path, index) => <Card key={path}>
      <CardHeader><CardTitle>{index + 1}. {t(`participation.${path}.title`)}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed">
        <p>{t(`participation.${path}.how`)}</p>
        <p>{t(`participation.${path}.result`)}</p>
      </CardContent>
    </Card>)}
    <p className="text-sm text-muted-foreground">{t('participation.privacy')}</p>
  </div>;
}
