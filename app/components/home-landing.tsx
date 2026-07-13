'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {authMode && <HomeAuthModal mode={authMode} onClose={closeAuth} initialNotice={notice} />}

      <div className="border-b border-cyan-400/20 bg-cyan-500/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <p className="text-cyan-100">
            Beta läuft: begrenzte Plätze für die erste DACH-Kohorte.
          </p>
          <button
            onClick={() => openAuth('register')}
            className="rounded-full border border-cyan-300/40 px-4 py-1 font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
          >
            Platz sichern
          </button>
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold tracking-widest text-cyan-200 uppercase">
              VitalTwin Plattform
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Dein digitaler Gesundheits-Zwilling für ein längeres, besseres Leben.
            </h1>
            <p className="mt-6 text-lg text-slate-300 md:text-xl">
              VitalTwin analysiert deine Biomarker, berechnet dein biologisches Alter und zeigt dir klare,
              personalisierte Schritte zur Gesundheitsoptimierung.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => openAuth('register')}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                Jetzt zur Beta starten
              </button>
              <Link
                href="/preise"
                className="rounded-2xl border border-slate-600 bg-slate-900/60 px-8 py-4 text-base font-semibold text-slate-100 transition hover:border-cyan-300/50"
              >
                Preise ansehen
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-2xl font-bold text-white">3 Min</p>
                <p>bis zur ersten Twin-Analyse</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-2xl font-bold text-white">100%</p>
                <p>personalisierte Auswertung</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 col-span-2 md:col-span-1">
                <p className="text-2xl font-bold text-white">Abo</p>
                <p>skalierbares SaaS-Modell</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                Evidenzbasierte Marker mit Quellen
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                Kein medizinisches Produkt, klarer Wellness-Fokus
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                Für DACH optimiert, EU-Skalierung geplant
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="text-3xl font-bold md:text-4xl">Warum VitalTwin</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <h3 className="text-xl font-semibold">Biologisches Alter statt Bauchgefühl</h3>
            <p className="mt-3 text-slate-300">
              Du siehst sofort, wie deine aktuellen Marker dein biologisches Alter beeinflussen.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <h3 className="text-xl font-semibold">Persönliche Szenarien</h3>
            <p className="mt-3 text-slate-300">
              Vergleich von aktuell, optimiert und aggressiv, damit du die Hebel mit dem größten Effekt erkennst.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <h3 className="text-xl font-semibold">Skalierbar für Millionen Nutzer</h3>
            <p className="mt-3 text-slate-300">
              Cloud-ready Architektur mit Subscription-Flow und API-gestützter Auswertung.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-800/80 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-3xl font-bold md:text-4xl">So funktioniert es</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-cyan-300 font-semibold">01</p>
              <h3 className="mt-2 text-xl font-semibold">Account erstellen</h3>
              <p className="mt-3 text-slate-300">Registriere dich und starte mit deinem persönlichen Profil.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-cyan-300 font-semibold">02</p>
              <h3 className="mt-2 text-xl font-semibold">Marker eingeben</h3>
              <p className="mt-3 text-slate-300">Trage relevante Biomarker ein, z. B. HbA1c, CRP, Vitamin D und ApoB.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-cyan-300 font-semibold">03</p>
              <h3 className="mt-2 text-xl font-semibold">Twin optimieren</h3>
              <p className="mt-3 text-slate-300">Erhalte klare Empfehlungen und verbessere deinen Score Schritt für Schritt.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-blue-600/30 to-cyan-500/20 p-8 md:p-12">
          <h2 className="text-3xl font-bold md:text-4xl">Bereit für deinen VitalTwin?</h2>
          <p className="mt-4 max-w-2xl text-slate-200">
            Starte heute mit deiner ersten Analyse und baue dir eine datenbasierte Gesundheitsstrategie auf.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-white px-8 py-4 font-semibold text-slate-900"
            >
              Kostenlos in die Beta
            </button>
            <button
              onClick={() => openAuth('login')}
              className="rounded-2xl border border-white/50 px-8 py-4 font-semibold text-white"
            >
              Zum Login
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <h3 className="text-2xl font-bold text-white">Häufige Fragen</h3>
            <div className="mt-6 space-y-5 text-slate-200">
              <div>
                <p className="font-semibold text-white">Ist VitalTwin ein medizinisches Produkt?</p>
                <p className="mt-1 text-sm text-slate-300">Nein. VitalTwin ist ein Wellness-Tool zur Gesundheitsorientierung und ersetzt keine ärztliche Diagnostik.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Wie schnell sehe ich erste Ergebnisse?</p>
                <p className="mt-1 text-sm text-slate-300">In der Regel in unter 3 Minuten nach Eingabe deiner Marker.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Kann ich erstmal kostenlos starten?</p>
                <p className="mt-1 text-sm text-slate-300">Ja. Du kannst kostenlos starten und erst später auf Premium upgraden.</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <h3 className="text-2xl font-bold text-white">Wie Premium funktioniert</h3>
            <ol className="mt-6 space-y-4 text-sm text-slate-200">
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="font-semibold text-cyan-300">1.</span> Kostenlos registrieren und erste Twin-Berechnung starten.
              </li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="font-semibold text-cyan-300">2.</span> Premium aktivieren für unbegrenzte Simulationen und Verlauf.
              </li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="font-semibold text-cyan-300">3.</span> Wöchentlich Fortschritt tracken und Empfehlungen umsetzen.
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openAuth('register')}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Kostenlos starten
              </button>
              <Link
                href="/preise"
                className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300"
              >
                Premium ansehen
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
