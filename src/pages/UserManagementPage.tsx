import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { PublicUserInterface, UserRole, UserState } from '@/types/server';
import * as authApi from '@/lib/authApi';
import { TOKEN_KEY } from '@/lib/authApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Trash2, Loader2, ExternalLink, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { de as deFns } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

const STATE_VARIANTS: Record<UserState, 'default' | 'secondary' | 'destructive'> = {
  new: 'secondary',
  verified: 'default',
  closed: 'destructive',
};

const ROLE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  guest: 'outline',
  user: 'secondary',
  admin: 'default',
};

export default function UserManagementPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { mode, fixedBackendUrl } = useStorageMode();
  const { toast } = useToast();
  const dateLocale = i18n.language?.startsWith('de') ? deFns : enUS;

  const [users, setUsers] = useState<PublicUserInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = fixedBackendUrl?.replace(/\/$/, '') ?? '';
  const token = localStorage.getItem(TOKEN_KEY) ?? '';

  const fetchUsers = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    try {
      const res = await authApi.getUsers(baseUrl, token);
      setUsers(res.users);
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token, t, toast]);

  useEffect(() => {
    if (mode !== 'fixed' || !isSuperAdmin) {
      navigate('/', { replace: true });
      return;
    }
    fetchUsers();
  }, [mode, isSuperAdmin, navigate, fetchUsers]);

  const handleUpdate = async (id: string, data: { state?: UserState; role?: UserRole }) => {
    try {
      const updated = await authApi.updateUser(baseUrl, token, id, data);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
      toast({ title: t('userUpdated') });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authApi.deleteUser(baseUrl, token, id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast({ title: t('userDeleted') });
    } catch {
      toast({ title: t('backendError'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t('connectionCheck')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          {t('userManagement')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('userManagementDesc')}</p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('noUsers')}</p>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {users.length} {t('players')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>{t('username')}</TableHead>
                    <TableHead>{t('state')}</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('steamId')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{user.username || '—'}</TableCell>
                      <TableCell>
                        <Select
                          value={user.state}
                          onValueChange={(val: UserState) => handleUpdate(user.id, { state: val })}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['new', 'verified', 'closed'] as UserState[]).map(s => (
                              <SelectItem key={s} value={s}>
                                <Badge variant={STATE_VARIANTS[s]} className="text-[10px]">{t(`state_${s}`)}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val: UserRole) => handleUpdate(user.id, { role: val })}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['user', 'admin'] as UserRole[]).map(r => (
                              <SelectItem key={r} value={r}>
                                <Badge variant={ROLE_VARIANTS[r]} className="text-[10px]">{t(`role_${r}`)}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.steamId ? (
                          <a
                            href={`https://steamcommunity.com/profiles/${user.steamId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80 font-mono text-xs"
                          >
                            {user.steamId}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {user.createdAt
                          ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: dateLocale })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('deleteUserConfirm')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('deleteUserDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                {t('deleteUser')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
