import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function PlayerNameLink({ id, name }: { id?: string | number; uid?: string; name?: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated || typeof id !== 'string' || !/^[A-Za-z0-9_-]+:\d+$/.test(id) || !name) return <span>{name || '-'}</span>;
  return <Link to={`/player/${encodeURIComponent(id)}`} state={{ playerName: name }} className="text-foreground underline-offset-2 hover:text-primary hover:underline">{name}</Link>;
}
