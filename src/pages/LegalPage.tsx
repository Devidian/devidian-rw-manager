import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/LegalFooter';
import { LEGAL_PAGES, LEGAL_UI, legalLocale, type LegalPageKey } from '@/content/legal';
import { useTranslation } from 'react-i18next';

interface LegalPageProps {
  pageKey: LegalPageKey;
}

export default function LegalPage({ pageKey }: LegalPageProps) {
  const { i18n } = useTranslation();
  const locale = legalLocale(i18n.language);
  const page = LEGAL_PAGES[locale][pageKey];
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reportedServer = params.get('server');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {LEGAL_UI[locale].back}
          </Link>
        </Button>

        <article className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{page.updated}</p>
            <h1 className="text-3xl font-bold tracking-normal">{page.title}</h1>
            {reportedServer && (
              <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                {LEGAL_UI[locale].reportContext} <span className="font-mono text-foreground">{reportedServer}</span>
              </p>
            )}
            {page.intro?.map(paragraph => (
              <p key={paragraph} className="text-sm leading-6 text-muted-foreground">{paragraph}</p>
            ))}
          </header>

          {page.sections.map(section => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-normal">{section.heading}</h2>
              {section.body.map(paragraph => (
                <p key={paragraph} className="text-sm leading-6 text-muted-foreground">{paragraph}</p>
              ))}
              {section.items && (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {section.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
