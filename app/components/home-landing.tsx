'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HomeAuthModal from './home-auth-modal';
import SiteNav from './site-nav';

type AuthMode = 'login' | 'register' | null;

type HomeLandingProps = {
  initialAuthMode: AuthMode;
  initialNotice: string;
  startedFromQuery: boolean;
};

export default function HomeLanding({
  initialAuthMode,
  initialNotice,
  startedFromQuery,
}: HomeLandingProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode);
  const [notice, setNotice] = useState(initialNotice);
  const router = useRouter();

  useEffect(() => {
    // Supabase password-recovery links always redirect to the configured Site URL
    // (this homepage) with the tokens in the URL hash, regardless of the requested
    // redirect_to path. Forward recovery links to the page that can consume them.
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token=')) {
      router.replace(`/passwort-bestaetigen${hash}`);
    }
  }, [router]);

  const openAuth = (mode: Exclude<AuthMode, null>) => {
    setNotice('');
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
    setNotice('');
    if (startedFromQuery) {
      router.replace('/', { scroll: false });
    }
  };

  return (
    <main className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      {authMode && <HomeAuthModal mode={authMode} onClose={closeAuth} initialNotice={notice} />}

      <SiteNav onOpenLogin={() => openAuth('login')} onOpenRegister={() => openAuth('register')} />

      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <h1 className="font-[family-name:var(--font-serif-display)] text-4xl font-semibold leading-[1.1] md:text-6xl">
            Dein persönlicher KI-Wellness-Zwilling
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-700 md:text-xl">
            Verstehe deine Gewohnheiten, erkenne deine Fortschritte und erhalte persönliche Impulse für Schlaf,
            Bewegung, Ernährung und Erholung.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800"
            >
              Kostenlos starten
            </button>
            <Link
              href="/preise"
              className="rounded-2xl border border-neutral-900 bg-white px-8 py-4 text-base font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Preise ansehen
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500">Kostenlos starten. Keine Kreditkarte erforderlich.</p>

          <div className="mx-auto mt-14 grid max-w-3xl gap-3 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">In wenigen Minuten eingerichtet</div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Persönliche Wellness-Einblicke</div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Datenschutzorientiert</div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Keine medizinische Diagnose</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">So funktioniert VitalTwin</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-500">01</p>
            <h3 className="mt-2 text-xl font-semibold">Profil erstellen</h3>
            <p className="mt-3 text-neutral-700">Registriere dich in wenigen Minuten und lege dein persönliches Wellness-Profil an.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-500">02</p>
            <h3 className="mt-2 text-xl font-semibold">Gewohnheiten dokumentieren</h3>
            <p className="mt-3 text-neutral-700">Trage freiwillig Werte und Gewohnheiten zu Schlaf, Bewegung, Ernährung und mehr ein.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-500">03</p>
            <h3 className="mt-2 text-xl font-semibold">Entwicklung verstehen</h3>
            <p className="mt-3 text-neutral-700">Dein Zwilling ordnet deine Werte ein und zeigt, wie sich dein Wellness-Profil entwickelt.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-500">04</p>
            <h3 className="mt-2 text-xl font-semibold">Empfehlungen erhalten</h3>
            <p className="mt-3 text-neutral-700">Du bekommst persönliche, verständliche Impulse &mdash; ohne Fachjargon.</p>
          </div>
        </div>
      </section>

      <section id="funktionen" className="border-y border-neutral-200 bg-white scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Dein täglicher Überblick</h2>
          <p className="mt-3 max-w-2xl text-neutral-700">
            Alle Bereiche, die für dein Wohlbefinden zählen &mdash; an einem Ort, klar und verständlich dargestellt.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6 text-center">
              <h3 className="text-lg font-semibold">Schlaf</h3>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6 text-center">
              <h3 className="text-lg font-semibold">Bewegung</h3>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6 text-center">
              <h3 className="text-lg font-semibold">Ernährung</h3>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6 text-center">
              <h3 className="text-lg font-semibold">Stress</h3>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6 text-center">
              <h3 className="text-lg font-semibold">Erholung</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Dein digitaler Zwilling</h2>
            <p className="mt-4 text-neutral-700">
              Dein Zwilling entsteht ausschließlich aus den Angaben, die du freiwillig einträgst. Aus diesen Daten baut
              VitalTwin ein persönliches Wellness-Profil auf, das dir hilft, Zusammenhänge zwischen deinen Gewohnheiten
              und deinem Wohlbefinden zu erkennen.
            </p>
            <p className="mt-4 text-neutral-700">
              VitalTwin stellt keine medizinischen Diagnosen und ersetzt keinen Arztbesuch &mdash; es ist ein
              Wellness-Werkzeug zur Selbstreflexion und Orientierung.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Beispielhafte Ansicht</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                <span>Schlafqualität</span>
                <span className="font-semibold text-neutral-900">Verbessert</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                <span>Bewegung pro Woche</span>
                <span className="font-semibold text-neutral-900">Im Zielbereich</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                <span>Stresslevel</span>
                <span className="font-semibold text-neutral-900">Beobachten</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Warum VitalTwin?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h3 className="text-lg font-semibold">Alles an einem Ort</h3>
              <p className="mt-3 text-sm text-neutral-700">Schlaf, Bewegung, Ernährung, Stress und Erholung gebündelt statt in verschiedenen Apps verstreut.</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h3 className="text-lg font-semibold">Verständliche Darstellung</h3>
              <p className="mt-3 text-sm text-neutral-700">Klare Sprache statt Fachjargon &mdash; du verstehst sofort, was deine Werte bedeuten.</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h3 className="text-lg font-semibold">Langfristiger Verlauf</h3>
              <p className="mt-3 text-sm text-neutral-700">Verfolge deine Entwicklung über Wochen und Monate statt nur eine Momentaufnahme zu sehen.</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h3 className="text-lg font-semibold">Individuelle Ziele</h3>
              <p className="mt-3 text-sm text-neutral-700">Empfehlungen richten sich nach deinen persönlichen Wellness-Zielen, nicht nach Pauschalratschlägen.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Preise im Überblick</h2>
          <Link href="/preise" className="text-sm font-semibold text-neutral-900 underline hover:text-black">
            Alle Preise ansehen
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="mt-2 text-3xl font-bold">0 €</p>
            <p className="mt-3 text-sm text-neutral-700">Eine kostenlose Twin-Berechnung mit Basis-Empfehlungen.</p>
          </div>
          <div className="rounded-3xl border border-neutral-900 bg-black p-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Empfohlen</p>
            <h3 className="mt-2 text-xl font-semibold">Beta-Zugang</h3>
            <p className="mt-2 text-3xl font-bold">0 €</p>
            <p className="mt-3 text-sm text-white/80">Unbegrenzte Simulationen und Verlauf, kostenlos während der Beta-Phase.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="text-xl font-semibold">Premium</h3>
            <p className="mt-2 text-3xl font-bold">9,90 €<span className="text-base font-medium text-neutral-500">/Monat</span></p>
            <p className="mt-3 text-sm text-neutral-700">Vollständiger Zwilling, unbegrenzte Simulationen, Verlauf &amp; Detailquellen.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-neutral-900 bg-black p-8 text-white md:p-12">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Bereit für deinen VitalTwin?</h2>
          <p className="mt-4 max-w-2xl text-neutral-300">
            Starte heute kostenlos und lerne deine Gewohnheiten besser kennen.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-white px-8 py-4 font-semibold text-black transition hover:bg-neutral-200"
            >
              Kostenlos starten
            </button>
            <button
              onClick={() => openAuth('login')}
              className="rounded-2xl border border-white/50 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Zum Login
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 md:pb-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Häufige Fragen</h2>
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-900">Ist VitalTwin kostenlos?</p>
            <p className="mt-2 text-sm text-neutral-700">
              Ja. Du kannst kostenlos starten und während der Beta-Phase unbegrenzt kostenlos weiter nutzen. Premium ist
              optional für 9,90 €/Monat.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-900">Ist VitalTwin ein Medizinprodukt?</p>
            <p className="mt-2 text-sm text-neutral-700">
              Nein. VitalTwin ist ein Wellness-Tool zur Selbstreflexion und Orientierung, kein zugelassenes
              Medizinprodukt.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-900">Ersetzt VitalTwin einen Arzt?</p>
            <p className="mt-2 text-sm text-neutral-700">
              Nein. VitalTwin diagnostiziert keine Krankheiten und ersetzt keine ärztliche Beratung, Diagnose oder
              Therapie.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-900">Welche Daten werden verwendet?</p>
            <p className="mt-2 text-sm text-neutral-700">
              Ausschließlich die Angaben, die du freiwillig einträgst (z. B. Werte zu Schlaf, Bewegung oder
              Biomarkern). Details findest du in unserer{' '}
              <Link href="/datenschutz" className="underline hover:text-black">Datenschutzerklärung</Link>.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <p className="font-semibold text-neutral-900">Kann ich meine Daten löschen?</p>
            <p className="mt-2 text-sm text-neutral-700">
              Ja, du hast jederzeit das Recht auf Löschung deiner Daten. Schreib uns dazu einfach an info@vitaltwin.de.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-neutral-500">
          <p>VitalTwin DE</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/beta-bewerbung" className="transition hover:text-black">Beta-Bewerbung</Link>
            <Link href="/preise" className="transition hover:text-black">Preise</Link>
            <Link href="/impressum" className="transition hover:text-black">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-black">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-black">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-black">KI-Hinweise</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
