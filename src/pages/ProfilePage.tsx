import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { KeyRound, User, Save, Loader2, Link2, Unlink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, loginWithSteam, disconnectSteam, deleteAccount, generateApiToken } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [apiToken, setApiToken] = useState<string | null>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <p>{t('authRequired')}</p>
      </div>
    );
  }

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      toast({ title: t('nameUpdated') });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectSteam = async () => {
    setDisconnecting(true);
    try {
      await disconnectSteam();
      toast({ title: t('steamDisconnected') });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast({ title: t('accountDeleted') });
      navigate('/', { replace: true });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    }
  };

  const handleGenerateApiToken = async () => {
    setGeneratingToken(true);
    try {
      setApiToken(await generateApiToken());
      toast({ title: t('apiTokenGenerated') });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    } finally {
      setGeneratingToken(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          {t('profile')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('profileDesc')}</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role & State badges */}
          <div className="flex gap-2">
            <Badge variant="outline">{t(`role_${user.role || 'user'}`)}</Badge>
          </div>

          {/* Email (read-only) */}
          {user.email && (
            <div>
              <label className="text-xs text-muted-foreground">{t('loginEmail')}</label>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
          )}

          {/* Username edit */}
          <div>
            <label className="text-xs text-muted-foreground">{t('changeName')}</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-sm"
                placeholder={t('username')}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={saving || name === (user.username || '')}
                className="gap-1.5 shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('save')}
              </Button>
            </div>
          </div>

          {/* Steam connection */}
          <div>
            <label className="text-xs text-muted-foreground">{t('steamId')}</label>
            {user.steamId ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-foreground">{user.steamId}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={disconnecting}>
                      {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                      {t('disconnectSteam')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('disconnectSteam')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('disconnectSteamConfirm')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnectSteam}>{t('disconnectSteam')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="mt-1">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={loginWithSteam}>
                  <Link2 className="h-4 w-4" />
                  {t('connectSteam')}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs text-muted-foreground">{t('apiToken')}</label>
            <p className="text-xs text-muted-foreground mt-1">{t('apiTokenDesc')}</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 mt-3"
              onClick={handleGenerateApiToken}
              disabled={generatingToken}
            >
              {generatingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {t('generateApiToken')}
            </Button>
            {apiToken && (
              <div className="mt-3 rounded border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs text-primary mb-2">{t('apiTokenOneTime')}</p>
                <code className="block break-all text-xs text-foreground">{apiToken}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-card border-destructive/30">
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteAccountDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
