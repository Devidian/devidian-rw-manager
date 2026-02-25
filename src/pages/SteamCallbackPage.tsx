import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SteamCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSteamCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    handleSteamCallback(location.search)
      .then(() => navigate('/'))
      .catch((e: Error) => setError(e.message || t('errLoginFailed')));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/" className="text-primary underline">{t('back')}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
