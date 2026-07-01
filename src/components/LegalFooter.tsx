import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_LINKS, LEGAL_UI, legalLocale } from '@/content/legal';

export function LegalFooter() {
  const { i18n } = useTranslation();
  const locale = legalLocale(i18n.language);

  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-xs text-muted-foreground">
      <nav aria-label={LEGAL_UI[locale].legalNavigation} className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-2">
        {LEGAL_LINKS[locale].map(link => (
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
