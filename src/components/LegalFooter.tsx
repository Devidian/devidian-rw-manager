import { Link } from 'react-router-dom';
import { LEGAL_LINKS } from '@/content/legal';

export function LegalFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-xs text-muted-foreground">
      <nav aria-label="Legal links" className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-2">
        {LEGAL_LINKS.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
