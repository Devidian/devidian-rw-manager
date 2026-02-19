import { useParams } from 'react-router-dom';
import { useServerContext } from '@/context/ServerContext';
import { ServerDetail } from '@/components/ServerDetail';

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { serverList, refreshOne } = useServerContext();

  const server = id ? serverList.find(s => s.id === id) : undefined;

  return (
    <ServerDetail
      server={server}
      onRefresh={() => id && refreshOne(id)}
    />
  );
}
