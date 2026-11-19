import { brand, whatsappLink } from "./config";
import { ContactForm } from "./ContactForm";
import { Feed } from "./Feed";
import { useI18n } from "./i18n/context";
import { LanguagePicker } from "./LanguagePicker";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"
      />
    </svg>
  );
}

export default function App() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line/80 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <a href="#top" className="mr-auto font-serif text-xl font-semibold tracking-tight">
            {brand}
          </a>
          <nav aria-label={t.nav.label} className="hidden items-center gap-1 text-sm font-medium sm:flex">
            <a href="#feed" className="rounded-full px-3 py-2 hover:bg-ink/5">
              {t.nav.feed}
            </a>
            <a href="#contact" className="rounded-full px-3 py-2 hover:bg-ink/5">
              {t.nav.contact}
            </a>
          </nav>
          <LanguagePicker />
          <a
            href={whatsappLink(t.cta.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-deep px-3.5 py-2 text-sm font-semibold text-surface hover:bg-deep/90"
          >
            <WhatsAppIcon className="size-4" />
            <span>{t.cta.whatsapp}</span>
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-5xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">{t.hero.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t.hero.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#feed"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90"
            >
              {t.cta.seeFeed}
            </a>
            <a
              href={whatsappLink(t.cta.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-semibold hover:bg-ink/5"
            >
              <WhatsAppIcon className="size-5 text-deep" />
              {t.cta.whatsapp}
            </a>
          </div>
        </section>

        <section id="feed" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr] md:gap-12">
            <div className="md:sticky md:top-24 md:self-start">
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{t.feed.title}</h2>
              <p className="mt-3 text-muted">{t.feed.text}</p>
            </div>
            <Feed />
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-deep text-surface">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr] md:gap-12">
            <div>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{t.contact.title}</h2>
              <p className="mt-3 text-surface/75">{t.contact.text}</p>
            </div>
            <div className="rounded-2xl bg-surface p-5 text-ink sm:p-7">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-6">
          <p>
            © {year} {brand}
          </p>
          <p>{t.footer.poweredBy}</p>
        </div>
      </footer>
    </>
  );
}
