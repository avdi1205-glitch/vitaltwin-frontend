import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KI-Hinweise | VitalTwin',
  description: 'Informationen zur Funktion "Frag deinen Twin" und zum KI-Einsatz bei VitalTwin.',
};

export default function KiHinweise() {
  return (
    <main className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-900">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">KI-Hinweise</h1>
          <p className="mt-4 text-neutral-700">Informationen zur Funktion &quot;Frag deinen Twin&quot;.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Kein Arzt, kein medizinisches Fachpersonal</h2>
              <p className="mt-3 text-neutral-700">
                &quot;Frag deinen Twin&quot; ist ein persönlicher Wellness-Assistent auf Basis eines
                KI-Sprachmodells. Er stellt keine Diagnosen, empfiehlt oder verändert keine Medikamente, nennt keine
                Dosierungen und ersetzt keine ärztliche Beratung. Bei gesundheitlichen Beschwerden oder medizinischen
                Fragen wende dich bitte an qualifiziertes medizinisches Fachpersonal.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">KI-Antworten können Fehler enthalten</h2>
              <p className="mt-3 text-neutral-700">
                Antworten werden automatisiert von einem Sprachmodell erzeugt und können ungenau oder falsch sein. Du
                entscheidest selbst, welche Empfehlungen du umsetzt.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Welche Daten werden verwendet</h2>
              <p className="mt-3 text-neutral-700">
                Deine Nachricht sowie eine kompakte Zusammenfassung deiner eigenen, freiwillig eingetragenen
                Wellness-Ziele, aktiven Gewohnheiten und (je nach Tarif) jüngsten Alltagswerte werden an einen
                externen KI-Anbieter übermittelt, um eine Antwort zu erzeugen. Es werden keine vollständigen
                Datenbankinhalte und keine Daten anderer Nutzer übermittelt.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Speicherung</h2>
              <p className="mt-3 text-neutral-700">
                Aktuell wird nur gespeichert, wie oft du die Funktion pro Tag genutzt hast (zur Einhaltung deines
                Tageslimits) — nicht der Inhalt deiner Nachrichten oder Antworten.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Nutzungslimits</h2>
              <p className="mt-3 text-neutral-700">
                Je nach Tarif gilt ein tägliches Limit an Anfragen. Details siehe{' '}
                <Link href="/preise" className="text-neutral-900 hover:underline">Preise-Seite</Link>.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
            <Link href="/" className="transition hover:text-black">Startseite</Link>
            <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <Link href="/frag-deinen-twin" className="transition hover:text-black">Frag deinen Twin</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
