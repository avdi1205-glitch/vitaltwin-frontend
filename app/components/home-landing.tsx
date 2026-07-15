'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HomeAuthModal from './home-auth-modal';

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

      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <p className="text-neutral-700">
            Beta läuft: begrenzte Plätze für die erste DACH-Kohorte.
          </p>
          <button
            onClick={() => openAuth('register')}
            className="rounded-full border border-neutral-900 px-4 py-1 font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            Platz sichern
          </button>
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-neutral-900 px-4 py-1 text-xs font-semibold tracking-widest text-neutral-900 uppercase">
                VitalTwin Plattform
              </p>
              <h1 className="mt-6 font-[family-name:var(--font-serif-display)] text-4xl font-semibold leading-[1.1] md:text-6xl">
                3 Minuten Eingabe. Dein digitaler Gesundheits-Zwilling für ein längeres, besseres Leben.
              </h1>
              <p className="mt-6 text-lg text-neutral-700 md:text-xl">
                VitalTwin baut aus deinen Biomarkern einen digitalen Zwilling deiner Gesundheit, zeigt dein biologisches
                Alter im Vergleich zu heute und optimierten Szenarien &mdash; für alle, die ihre Werte wirklich verstehen und
                gezielt etwas verändern wollen.
              </p>
              <p className="mt-4 text-sm text-neutral-500">
                &mdash; Avdi Morina, Gründer VitalTwin
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => openAuth('register')}
                  className="rounded-2xl bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800"
                >
                  Jetzt zur Beta starten
                </button>
                <Link
                  href="/preise"
                  className="rounded-2xl border border-neutral-900 bg-white px-8 py-4 text-base font-semibold text-neutral-900 transition hover:bg-neutral-100"
                >
                  Preise ansehen
                </Link>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-neutral-700">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-neutral-900">3 Min</p>
                <p className="mt-1">bis zur ersten Twin-Analyse</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-neutral-900">100%</p>
                <p className="mt-1">personalisierte Auswertung</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-neutral-900">Abo</p>
                <p className="mt-1">skalierbares SaaS-Modell</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 text-xs text-neutral-700 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
              Evidenzbasierte Marker mit Quellen
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
              Kein medizinisches Produkt, klarer Wellness-Fokus
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
              Für DACH optimiert, EU-Skalierung geplant
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Für wen VitalTwin gemacht ist</h2>
        <p className="mt-3 max-w-2xl text-neutral-700">
          Für alle, die wissen wollen, wo sie gesundheitlich stehen &mdash; besonders wertvoll zwischen 35 und 55, wenn
          Vorsorge den größten Unterschied macht.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-neutral-900 bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Kernzielgruppe</p>
            <h3 className="mt-3 font-[family-name:var(--font-serif-display)] text-xl font-semibold">Gesundheitsbewusste 35&ndash;55</h3>
            <p className="mt-3 text-neutral-700">
              Du willst schwarz auf weiß sehen, wo du stehst und was wirklich wirkt &mdash; unabhängig von Beruf oder
              Fitnesslevel.
            </p>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Auch ideal für Vielbeschäftigte</p>
            <h3 className="mt-3 font-[family-name:var(--font-serif-display)] text-xl font-semibold">Manager &amp; Entscheider</h3>
            <p className="mt-3 text-neutral-700">
              Wenig Zeit, klare Kennzahlen: 3 Minuten Eingabe, ein kompakter Überblick statt endloser Wellness-Ratgeber.
            </p>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Auch ideal für Selbstoptimierer</p>
            <h3 className="mt-3 font-[family-name:var(--font-serif-display)] text-xl font-semibold">Biohacker</h3>
            <p className="mt-3 text-neutral-700">
              Marker-Rohdaten, Zielbereiche und Quellen direkt einsehbar &mdash; keine verwässerten Pauschalaussagen.
            </p>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Auch ideal für vorsorgeorientierte Menschen</p>
            <h3 className="mt-3 font-[family-name:var(--font-serif-display)] text-xl font-semibold">Familienkontext</h3>
            <p className="mt-3 text-neutral-700">
              Gib optional an, welche Themen in deiner Familie eine Rolle spielen &mdash; deine Wellness-Empfehlungen werden
              entsprechend priorisiert.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Warum VitalTwin</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Biologisches Alter statt Bauchgefühl</h3>
            <p className="mt-3 text-neutral-700">
              Du siehst sofort, wie deine aktuellen Marker dein biologisches Alter beeinflussen.
            </p>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Persönliche Szenarien</h3>
            <p className="mt-3 text-neutral-700">
              Vergleich von aktuell, optimiert und aggressiv, damit du die Hebel mit dem größten Effekt erkennst.
            </p>
          </article>
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Skalierbar für Millionen Nutzer</h3>
            <p className="mt-3 text-neutral-700">
              Cloud-ready Architektur mit Subscription-Flow und API-gestützter Auswertung.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">So funktioniert es</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <p className="text-neutral-500 font-semibold">01</p>
              <h3 className="mt-2 text-xl font-semibold">Account erstellen</h3>
              <p className="mt-3 text-neutral-700">Registriere dich und starte mit deinem persönlichen Profil.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <p className="text-neutral-500 font-semibold">02</p>
              <h3 className="mt-2 text-xl font-semibold">Marker eingeben</h3>
              <p className="mt-3 text-neutral-700">Trage relevante Biomarker ein, z. B. HbA1c, CRP, Vitamin D und ApoB.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <p className="text-neutral-500 font-semibold">03</p>
              <h3 className="mt-2 text-xl font-semibold">Twin optimieren</h3>
              <p className="mt-3 text-neutral-700">Erhalte klare Empfehlungen und verbessere deinen Score Schritt für Schritt.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-neutral-900 bg-black p-8 text-white md:p-12">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">Bereit für deinen VitalTwin?</h2>
          <p className="mt-4 max-w-2xl text-neutral-300">
            Starte heute mit deiner ersten Analyse und baue dir eine datenbasierte Gesundheitsstrategie auf.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-white px-8 py-4 font-semibold text-black transition hover:bg-neutral-200"
            >
              Kostenlos in die Beta
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

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900">Häufige Fragen</h3>
            <div className="mt-6 space-y-5 text-neutral-800">
              <div>
                <p className="font-semibold text-neutral-900">Ist VitalTwin ein medizinisches Produkt?</p>
                <p className="mt-1 text-sm text-neutral-700">Nein. VitalTwin ist ein Wellness-Tool zur Gesundheitsorientierung und ersetzt keine ärztliche Diagnostik.</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Wie schnell sehe ich erste Ergebnisse?</p>
                <p className="mt-1 text-sm text-neutral-700">In der Regel in unter 3 Minuten nach Eingabe deiner Marker.</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Kann ich erstmal kostenlos starten?</p>
                <p className="mt-1 text-sm text-neutral-700">Ja. Du kannst kostenlos starten und erst später auf Premium upgraden.</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-neutral-200 bg-white p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900">Wie Premium funktioniert</h3>
            <ol className="mt-6 space-y-4 text-sm text-neutral-800">
              <li className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                <span className="font-semibold text-neutral-900">1.</span> Kostenlos registrieren und erste Twin-Berechnung starten.
              </li>
              <li className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                <span className="font-semibold text-neutral-900">2.</span> Premium aktivieren für unbegrenzte Simulationen und Verlauf.
              </li>
              <li className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                <span className="font-semibold text-neutral-900">3.</span> Wöchentlich Fortschritt tracken und Empfehlungen umsetzen.
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openAuth('register')}
                className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Kostenlos starten
              </button>
              <Link
                href="/preise"
                className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900"
              >
                Premium ansehen
              </Link>
            </div>
          </article>
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
          </div>
        </div>
      </footer>
    </main>
  );
}
