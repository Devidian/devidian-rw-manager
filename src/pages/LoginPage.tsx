import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/LegalFooter';
import { Server, AlertCircle, Gamepad2 } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithSteam, hasAuthService } = useAuth();
  const steamLoginAvailable = hasAuthService;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Server className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">{t('loginTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('loginDesc')}</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {steamLoginAvailable ? (
            <Button
              onClick={() => loginWithSteam()}
              className="w-full gap-2 bg-[hsl(215_60%_35%)] hover:bg-[hsl(215_60%_40%)] text-white"
              size="lg"
            >
              <Gamepad2 className="h-4 w-4" />
              {t('loginWithSteam')}
            </Button>
          ) : (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{t('steamLoginUnavailable')}</p>
            </div>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            Steam sign-in is used for authentication and admin access verification. We may store your SteamID64,
            display name, avatar URL and login timestamp.{' '}
            <Link to="/privacy" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/setup')}>
            {t('back')}
          </Button>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
