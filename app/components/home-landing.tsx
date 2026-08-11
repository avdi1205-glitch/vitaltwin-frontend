'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HomeAuthModal from './home-auth-modal';
import SiteNav from './site-nav';
import VitalTwinHero from './hero/VitalTwinHero';

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
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      {authMode && <HomeAuthModal mode={authMode} onClose={closeAuth} initialNotice={notice} />}

      <SiteNav onOpenLogin={() => openAuth('login')} onOpenRegister={() => openAuth('register')} />

      <VitalTwinHero onOpenRegister={() => openAuth('register')} />

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.3em] text-[#8E969F]">Was VitalTwin anders macht</p>
          <h2 className="mt-3 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Ein Twin, der mit dir wächst</h2>
          <p className="mt-4 max-w-2xl text-[#B7BDC4]">
            VitalTwin ist kein einmaliger Test, sondern ein persönlicher Zwilling, der dich über Zeit immer besser versteht.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-[#F3C979]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F3C979]">Lernt deinen Alltag</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">Dein Twin merkt sich bestätigte Routinen, Ziele und dein Feedback &mdash; und wird mit der Zeit persönlicher.</p>
            </article>
            <article className="rounded-2xl border border-[#58D7D4]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#58D7D4]">Versteht deinen Verlauf</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">Persönliche Baselines, Trends und Entwicklung über Zeit &mdash; statt nur ein einmaliger Momentwert.</p>
            </article>
            <article className="rounded-2xl border border-[#F3C979]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F3C979]">Verbindet deine Daten</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">Manuelle Wellness-Angaben, automatisch ergänzte Datenquellen und &mdash; wo verfügbar &mdash; Stoffwechselwerte an einem Ort.</p>
            </article>
            <article className="rounded-2xl border border-[#58D7D4]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#58D7D4]">Erklärt seine Erkenntnisse</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">Immer mit Quellenangabe und &quot;Warum?&quot; &mdash; statt unbegründeter Black-Box-Aussagen.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">So funktioniert VitalTwin</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">01</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">Deine Daten, deine Entscheidung</h3>
            <p className="mt-3 text-[#B7BDC4]">Du entscheidest, welche Wellness-Daten dein Twin kennt &mdash; manuell eingetragen oder automatisch über kompatible Datenquellen ergänzt.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">02</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">Deine persönliche Baseline</h3>
            <p className="mt-3 text-[#B7BDC4]">VitalTwin vergleicht dich mit deiner eigenen Entwicklung statt nur mit allgemeinen Durchschnittswerten.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">03</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">Lernt mit der Zeit</h3>
            <p className="mt-3 text-[#B7BDC4]">Dein Twin merkt sich bestätigte Routinen, Ziele und dein Feedback und wird mit der Zeit persönlicher.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">04</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">Erkennt Muster, erklärt sie</h3>
            <p className="mt-3 text-[#B7BDC4]">VitalTwin erkennt wiederkehrende Muster in deinen eigenen Daten und zeigt transparent, worauf jede Einschätzung beruht.</p>
          </div>
        </div>
      </section>

      <section id="funktionen" className="border-y border-white/10 bg-white/[0.02] scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Dein täglicher Überblick</h2>
          <p className="mt-3 max-w-2xl text-[#B7BDC4]">
            Alle Bereiche, die für dein Wohlbefinden zählen &mdash; an einem Ort, klar und verständlich dargestellt.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Schlaf</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Bewegung</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Ernährung</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Stress</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Erholung</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Dein digitaler Zwilling</h2>
            <p className="mt-4 text-[#B7BDC4]">
              Dein Zwilling entsteht ausschließlich aus den Angaben, die du freiwillig einträgst. Aus diesen Daten baut
              VitalTwin ein persönliches Wellness-Profil auf, das dir hilft, Zusammenhänge zwischen deinen Gewohnheiten
              und deinem Wohlbefinden zu erkennen.
            </p>
            <p className="mt-4 text-[#B7BDC4]">
              VitalTwin stellt keine medizinischen Diagnosen und ersetzt keinen Arztbesuch &mdash; es ist ein
              Wellness-Werkzeug zur Selbstreflexion und Orientierung.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Beispielhafte Ansicht</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>Schlafqualität</span>
                <span className="font-semibold text-[#58D7D4]">Verbessert</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>Bewegung pro Woche</span>
                <span className="font-semibold text-[#58D7D4]">Im Zielbereich</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>Stresslevel</span>
                <span className="font-semibold text-[#F3C979]">Beobachten</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Warum VitalTwin?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Alles an einem Ort</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">Schlaf, Bewegung, Ernährung, Stress und Erholung gebündelt statt in verschiedenen Apps verstreut.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Verständliche Darstellung</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">Klare Sprache statt Fachjargon &mdash; du verstehst sofort, was deine Werte bedeuten.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Langfristiger Verlauf</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">Du siehst nicht nur deinen heutigen Stand, sondern wie sich dein Twin und sein Verständnis von dir über Zeit entwickeln.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">Individuelle Ziele</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">Empfehlungen richten sich nach deinen persönlichen Wellness-Zielen, nicht nach Pauschalratschlägen.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Preise im Überblick</h2>
          <Link href="/preise" className="text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            Alle Tarife vergleichen →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="text-xl font-semibold text-[#F5F2EA]">Free</h3>
            <p className="mt-2 text-3xl font-bold text-[#F5F2EA]">0 €</p>
            <p className="mt-3 text-sm text-[#B7BDC4]">Eine kostenlose Twin-Berechnung mit Basis-Empfehlungen.</p>
          </div>
          <div className="rounded-3xl border border-[#F3C979]/50 bg-white/[0.06] p-7 text-[#F5F2EA]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F3C979]">Empfohlen</p>
            <h3 className="mt-2 text-xl font-semibold">Beta-Zugang</h3>
            <p className="mt-2 text-3xl font-bold">0 €</p>
            <p className="mt-3 text-sm text-[#B7BDC4]">Automatische Gesundheitsdaten, Blutzucker-Tracking und erweiterter Verlauf bis zu 90 Tage &mdash; kostenlos während der Beta-Phase.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="text-xl font-semibold text-[#F5F2EA]">Premium</h3>
            <p className="mt-2 text-3xl font-bold text-[#F5F2EA]">9,90 €<span className="text-base font-medium text-[#8E969F]">/Monat</span></p>
            <p className="mt-3 text-sm text-[#B7BDC4]">Automatische Gesundheitsdaten, Blutzucker-Tracking, Wochenberichte &amp; erweiterter Verlauf.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-[#B7BDC4]">
          Für höhere Ansprüche gibt es außerdem <span className="font-semibold text-[#F5F2EA]">Pro</span> (u. a. Wellness-Szenarien) und{' '}
          <span className="font-semibold text-[#F5F2EA]">Family</span> (bis zu 6 Profile).{' '}
          <Link href="/preise" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">Alle Tarife vergleichen</Link>.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Bereit für deinen VitalTwin?</h2>
          <p className="mt-4 max-w-2xl text-[#B7BDC4]">
            Starte heute kostenlos und lerne deine Gewohnheiten besser kennen.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-8 py-4 font-semibold text-[#0B1118] transition hover:brightness-110"
            >
              Kostenlos starten
            </button>
            <button
              onClick={() => openAuth('login')}
              className="rounded-2xl border border-white/20 px-8 py-4 font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Zum Login
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 md:pb-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">Häufige Fragen</h2>
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">Ist VitalTwin kostenlos?</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Ja. Du kannst kostenlos starten und während der Beta-Phase unbegrenzt kostenlos weiter nutzen. Premium ist
              optional für 9,90 €/Monat.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">Ist VitalTwin ein Medizinprodukt?</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Nein. VitalTwin ist ein Wellness-Tool zur Selbstreflexion und Orientierung, kein zugelassenes
              Medizinprodukt.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">Ersetzt VitalTwin einen Arzt?</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Nein. VitalTwin diagnostiziert keine Krankheiten und ersetzt keine ärztliche Beratung, Diagnose oder
              Therapie.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">Welche Daten werden verwendet?</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Ausschließlich die Angaben, die du freiwillig einträgst (z. B. Werte zu Schlaf, Bewegung oder
              Biomarkern). Details findest du in unserer{' '}
              <Link href="/datenschutz" className="underline hover:text-[#58D7D4]">Datenschutzerklärung</Link>.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">Kann ich meine Daten löschen?</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Ja, du hast jederzeit das Recht auf Löschung deiner Daten. Schreib uns dazu einfach an info@vitaltwin.de.
            </p>
          </div>
        </div>
        <Link href="/faq" className="mt-6 inline-block text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
          Alle häufigen Fragen ansehen →
        </Link>
      </section>

      <footer className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[#8E969F]">
          <p>VitalTwin DE</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/ueber-uns" className="transition hover:text-[#58D7D4]">Über uns</Link>
            <Link href="/blog" className="transition hover:text-[#58D7D4]">Blog</Link>
            <Link href="/faq" className="transition hover:text-[#58D7D4]">FAQ</Link>
            <Link href="/beta-bewerbung" className="transition hover:text-[#58D7D4]">Beta-Bewerbung</Link>
            <Link href="/preise" className="transition hover:text-[#58D7D4]">Preise</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">KI-Hinweise</Link>
            <Link href="/kontakt" className="transition hover:text-[#58D7D4]">Kontakt</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
