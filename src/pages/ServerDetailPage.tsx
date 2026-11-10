import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useServerContext } from '@/context/ServerContext';
import { useStorageMode } from '@/context/StorageModeContext';
import { resolveServerId } from '@/lib/serverDuplicateApi';
import { ServerDetail } from '@/components/ServerDetail';

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fixedBackendUrl } = useStorageMode();
  const { serverList, refreshOne } = useServerContext();

  const server = id ? serverList.find(s => s.id === id) : undefined;

  useEffect(() => {
    if (server || !id || !fixedBackendUrl) return;
    let active = true;
    void resolveServerId(fixedBackendUrl, id).then(({ canonicalId }) => {
      if (active && canonicalId !== id) navigate(`/server/${encodeURIComponent(canonicalId)}`, { replace: true });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [server, id, fixedBackendUrl, navigate]);

  return (
    <ServerDetail
      server={server}
      onRefresh={() => id && refreshOne(id)}
    />
  );
}
