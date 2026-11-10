import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, GitMerge, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useServerContext } from '@/context/ServerContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { TOKEN_KEY, validate } from '@/lib/authApi';
import { getDuplicateGroups, mergeServers, previewMerge, type DuplicateGroup, type MergePreview, type MergeSelection } from '@/lib/serverDuplicateApi';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ServerDuplicatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSuperAdmin, applyUserUpdate } = useAuth();
  const { refreshServerList } = useServerContext();
  const { mode, fixedBackendUrl } = useStorageMode();
  const { toast } = useToast();
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const base = fixedBackendUrl ?? '';

  const reload = useCallback(async () => {
    if (!base || !token) return;
    setLoading(true);
    try { setGroups(await getDuplicateGroups(base, token)); }
    catch (error) { toast({ title: t('duplicateLoadFailed'), description: String(error), variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [base, token, t, toast]);

  useEffect(() => {
    if (mode !== 'fixed' || !isSuperAdmin) { navigate('/', { replace: true }); return; }
    void reload();
  }, [mode, isSuperAdmin, navigate, reload]);

  const choose = (id: string, value: boolean) => {
    setChecked((current) => value ? [...current, id] : current.filter((item) => item !== id));
  };
  const requestPreview = async (group: DuplicateGroup) => {
    const selection: MergeSelection = { targetId: group.targetId, sourceIds: checked.filter((id) => group.entries.some((item) => item.id === id)) };
    if (!selection.sourceIds.length) return;
    setBusy(true);
    try { setPreview(await previewMerge(base, token, selection)); }
    catch (error) { toast({ title: t('duplicateMergeFailed'), description: String(error), variant: 'destructive' }); await reload(); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await mergeServers(base, token, preview);
      refreshServerList();
      void validate(base.replace(/\/$/, ''), token).then(({ user }) => applyUserUpdate(user)).catch(() => undefined);
      setPreview(null); setChecked([]); await reload();
      toast({ title: t('duplicateMergeDone') });
    } catch (error) {
      toast({ title: t('duplicateMergeFailed'), description: String(error), variant: 'destructive' });
      setPreview(null); await reload();
    } finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold flex items-center gap-3"><GitMerge className="h-6 w-6 text-primary" />{t('serverDuplicates')}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t('serverDuplicatesDescription')}</p></div>
    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : groups.length === 0 ? <p className="text-muted-foreground">{t('serverDuplicatesEmpty')}</p> :
      <div className="rounded-lg border border-border overflow-x-auto"><Table><TableHeader><TableRow>
        <TableHead>{t('server')}</TableHead><TableHead>{t('duplicateFirstSeen')}</TableHead><TableHead>{t('duplicateCandidates')}</TableHead><TableHead />
      </TableRow></TableHeader><TableBody>{groups.map((group) => {
        const target = group.entries[0];
        const open = expanded === group.targetId;
        const count = checked.filter((id) => group.entries.some((item) => item.id === id)).length;
        return <Fragment key={group.targetId}>
          <TableRow><TableCell><Button variant="ghost" className="gap-2" onClick={() => setExpanded(open ? null : group.targetId)}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{target.name}</Button></TableCell>
            <TableCell>{new Date(target.firstSeen).toLocaleString()}</TableCell><TableCell>{group.entries.length - 1}</TableCell>
            <TableCell><Button size="sm" disabled={!count || busy} onClick={() => void requestPreview(group)}>{t('duplicateMergeSelected')} ({count})</Button></TableCell></TableRow>
          {open && <TableRow key={`${group.targetId}-details`}><TableCell colSpan={4} className="bg-muted/20"><Table><TableHeader><TableRow>
            <TableHead /><TableHead>{t('server')}</TableHead><TableHead>{t('duplicateShortname')}</TableHead><TableHead>{t('duplicateMap')}</TableHead>
            <TableHead>{t('duplicateMode')}</TableHead><TableHead>{t('duplicateOs')}</TableHead><TableHead>IP:Port</TableHead>
            <TableHead>{t('duplicateFirstSeen')}</TableHead><TableHead>{t('duplicateLastSeen')}</TableHead><TableHead>Status</TableHead><TableHead>{t('duplicateMatch')}</TableHead>
          </TableRow></TableHeader><TableBody>{group.entries.map((item) => <TableRow key={item.id}>
            <TableCell>{item.id !== group.targetId && <Checkbox aria-label={`${t('duplicateSelect')} ${item.name}`} checked={checked.includes(item.id)} onCheckedChange={(value) => choose(item.id, value === true)} />}</TableCell>
            <TableCell>{item.name}<span className="block text-xs text-muted-foreground">{item.id}</span></TableCell>
            <TableCell>{item.shortname}</TableCell><TableCell>{item.map}</TableCell><TableCell>{item.gamemode === 0 ? t('duplicateSurvival') : item.gamemode === 1 ? t('duplicateCreative') : item.gamemode}</TableCell><TableCell>{item.os}</TableCell>
            <TableCell>{item.ip}:{item.port}</TableCell><TableCell>{new Date(item.firstSeen).toLocaleString()}</TableCell>
            <TableCell>{new Date(item.lastSeen).toLocaleString()}</TableCell><TableCell>{item.status}</TableCell>
            <TableCell><Badge variant={item.strength === 'strong' ? 'default' : 'secondary'}>{t(item.strength === 'strong' ? 'duplicateStrong' : 'duplicatePossible')}</Badge></TableCell>
          </TableRow>)}</TableBody></Table></TableCell></TableRow>}
        </Fragment>;
      })}</TableBody></Table></div>}
    <AlertDialog open={preview !== null} onOpenChange={(open) => { if (!open && !busy) setPreview(null); }}><AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{t('duplicateConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('duplicateConfirmDescription')}</AlertDialogDescription></AlertDialogHeader>
      {preview && <div className="text-sm space-y-1 break-all"><p>{t('duplicateTarget')}: {preview.targetId}</p>
        <p>{t('duplicateSources')}: {preview.sourceIds.join(', ')}</p><p>{t('duplicateCurrentAddress')}: {preview.currentAddress}</p>
        <p>{t('duplicateAffectedFavorites')}: {preview.affectedFavorites}</p><p>{t('duplicateStatisticHours')}: {preview.statisticHours}</p></div>}
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>{t('cancel')}</AlertDialogCancel>
        <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirm(); }}>{t('duplicateConfirm')}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </div>;
}
