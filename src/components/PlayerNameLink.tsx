import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function PlayerNameLink({ uid, name }: { uid?: string; name?: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated || !uid || !name) return <span>{name || '-'}</span>;
  return <Link to={`/player/${encodeURIComponent(uid)}`} state={{ playerName: name }} className="text-foreground underline-offset-2 hover:text-primary hover:underline">{name}</Link>;
}
