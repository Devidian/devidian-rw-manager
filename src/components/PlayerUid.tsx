import { ExternalLink } from 'lucide-react';

function maskUid(uid: string): string {
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}${'*'.repeat(uid.length - 8)}${uid.slice(-4)}`;
}

interface PlayerUidProps {
  uid: string;
  platform?: string | number;
  authenticated: boolean;
}

export function PlayerUid({ uid, platform, authenticated }: PlayerUidProps) {
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

  return <span className="text-muted-foreground font-mono text-xs">{authenticated ? uid : maskUid(uid)}</span>;
}
