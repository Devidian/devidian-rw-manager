import { Link } from 'react-router-dom';

export function PlayerNameLink({ uid, name }: { uid?: string; name?: string }) {
  if (!uid || !name) return <span>{name || '-'}</span>;
  return <Link to={`/player/${encodeURIComponent(uid)}`} state={{ playerName: name }} className="text-foreground underline-offset-2 hover:text-primary hover:underline">{name}</Link>;
}
