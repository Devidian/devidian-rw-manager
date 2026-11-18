import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LegalFooter } from '@/components/LegalFooter';

export default function SteamCallbackPage({ returnTo = '/' }: { returnTo?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSteamCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    handleSteamCallback(location.search)
      .then(() => navigate(returnTo))
      .catch((e: Error) => setError(e.message === 'MANAGER_ACCESS_DENIED'
        ? t('managerAccessDenied') : e.message || t('errLoginFailed')));
  }, [handleSteamCallback, location.search, navigate, returnTo, t]);

  const link = <a href={window['__BASE_URL__']??'/'} className="text-primary underline">{t('back')}</a>

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            {link}
          </div>
        </main>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('checkingLoginAccess')}</p>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
