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
import { RichText } from '@/components/RichText';
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
  const chooseAll = (group: DuplicateGroup) => {
    const ids = group.entries.filter((item) => item.id !== group.targetId).map((item) => item.id);
    setChecked((current) => ids.every((id) => current.includes(id))
      ? current.filter((id) => !ids.includes(id))
      : [...new Set([...current, ...ids])]);
    setExpanded(group.targetId);
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
      <div className="rounded-lg border border-border overflow-x-auto"><Table className="w-full table-fixed"><TableHeader><TableRow>
        <TableHead className="w-[38%]">{t('server')}</TableHead><TableHead className="w-[20%]">{t('duplicateFirstSeen')}</TableHead><TableHead className="w-[10%]">{t('duplicateCandidates')}</TableHead><TableHead className="w-[32%]" />
      </TableRow></TableHeader><TableBody>{groups.map((group) => {
        const target = group.entries[0];
        const open = expanded === group.targetId;
        const count = checked.filter((id) => group.entries.some((item) => item.id === id)).length;
        const allSelected = count === group.entries.length - 1;
        return <Fragment key={group.targetId}>
          <TableRow><TableCell><Button variant="ghost" className="gap-2 max-w-full" onClick={() => setExpanded(open ? null : group.targetId)}>
            {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}<RichText text={target.name} className="min-w-0 truncate" /></Button></TableCell>
            <TableCell>{new Date(target.firstSeen).toLocaleString()}</TableCell><TableCell>{group.entries.length - 1}</TableCell>
            <TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => chooseAll(group)}>{t(allSelected ? 'duplicateClearSelection' : 'duplicateSelectAll')}</Button><Button size="sm" disabled={!count || busy} onClick={() => void requestPreview(group)}>{t('duplicateMergeSelected')} ({count})</Button></div></TableCell></TableRow>
          {open && <TableRow key={`${group.targetId}-details`}><TableCell colSpan={4} className="bg-muted/20 p-2"><Table className="w-full table-fixed text-xs"><TableHeader><TableRow>
            <TableHead className="w-9 px-2" /><TableHead className="w-[18%] px-2">{t('server')}</TableHead><TableHead className="w-[11%] px-2">{t('duplicateShortname')}</TableHead><TableHead className="w-[11%] px-2">{t('duplicateMap')}</TableHead>
            <TableHead className="w-[12%] px-2">{t('duplicateModeOs')}</TableHead><TableHead className="w-[15%] px-2">IP:Port</TableHead>
            <TableHead className="w-[17%] px-2">{t('duplicateSeen')}</TableHead><TableHead className="w-[8%] px-2">{t('status')}</TableHead><TableHead className="w-[8%] px-2">{t('duplicateMatch')}</TableHead>
          </TableRow></TableHeader><TableBody>{group.entries.map((item) => <TableRow key={item.id}>
            <TableCell className="px-2">{item.id !== group.targetId && <Checkbox aria-label={`${t('duplicateSelect')} ${item.name}`} checked={checked.includes(item.id)} onCheckedChange={(value) => choose(item.id, value === true)} />}</TableCell>
            <TableCell className="px-2 overflow-hidden"><RichText text={item.name} className="block truncate" /><span className="block text-xs text-muted-foreground break-all">{item.id}</span></TableCell>
            <TableCell className="px-2 break-words">{item.shortname}</TableCell><TableCell className="px-2 break-words">{item.map}</TableCell>
            <TableCell className="px-2 break-words">{item.gamemode === 0 ? t('duplicateSurvival') : item.gamemode === 1 ? t('duplicateCreative') : item.gamemode}<span className="block text-muted-foreground">{item.os}</span></TableCell>
            <TableCell className="px-2 break-all">{item.ip}:{item.port}</TableCell>
            <TableCell className="px-2"><span className="block">{t('duplicateSeenFrom')}: {new Date(item.firstSeen).toLocaleString()}</span><span className="block">{t('duplicateSeenTo')}: {new Date(item.lastSeen).toLocaleString()}</span></TableCell>
            <TableCell className="px-2"><Badge variant="outline" className={item.status === 'online' ? 'border-green-500/50 bg-green-500/15 text-green-400' : item.status === 'offline' ? 'border-red-500/50 bg-red-500/15 text-red-400' : 'text-muted-foreground'}>{t(item.status === 'online' ? 'online' : item.status === 'offline' ? 'offline' : 'unknown')}</Badge></TableCell>
            <TableCell className="px-2"><Badge variant={item.strength === 'strong' ? 'default' : 'secondary'}>{t(item.strength === 'strong' ? 'duplicateStrong' : 'duplicatePossible')}</Badge></TableCell>
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
