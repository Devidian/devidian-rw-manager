import { ExternalLink } from 'lucide-react';
import { maskPlayerUid } from '@/lib/maskPlayerUid';

interface PlayerUidProps {
  uid?: string;
  platform?: string | number;
  authenticated: boolean;
}

export function PlayerUid({ uid, platform, authenticated }: PlayerUidProps) {
  if (!uid) return <span className="text-muted-foreground">-</span>;
  const platformText = platform === undefined ? '' : String(platform);
  if (authenticated && platformText.toLowerCase() === 'steam' && /^\d+$/.test(uid)) {
    return (
      <a
        href={`https://steamcommunity.com/profiles/${uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80 font-mono text-xs"
        onClick={event => event.stopPropagation()}
      >
        {uid}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return <span className="text-muted-foreground font-mono text-xs">{authenticated ? uid : maskPlayerUid(uid)}</span>;
}
