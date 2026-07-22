import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum | VitalTwin',
  description: 'Impressum und Anbieterkennzeichnung von VitalTwin.',
};

export default function Impressum() {
  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Impressum</h1>
          <p className="mt-4 text-[#B7BDC4]">Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Anbieter</h2>
              <div className="mt-3 space-y-1 text-[#F5F2EA]">
                <p className="font-semibold">VitalTwin DE</p>
                <p>Avdi Morina</p>
                <p>Klepsauerstr. 60</p>
                <p>74677 Dörzbach</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Kontakt</h2>
              <div className="mt-3 space-y-2 text-[#F5F2EA]">
                <p>
                  <span className="font-semibold">Telefon:</span> +49 123 456789
                </p>
                <p>
                  <span className="font-semibold">E-Mail:</span> info@vitaltwin.de
                </p>
                <p>
                  <span className="font-semibold">USt-IdNr.:</span> DE123456789
                </p>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-[#F5F2EA]">Verantwortlich für den Inhalt</h2>
            <p className="mt-3 text-[#F5F2EA]">Avdi Morina, Anschrift wie oben.</p>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-[#F5F2EA]">Haftungshinweis</h2>
            <p className="mt-3 text-[#B7BDC4]">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6 text-sm text-[#8E969F]">
            <Link href="/" className="transition hover:text-[#58D7D4]">Startseite</Link>
            <Link href="/dashboard" className="transition hover:text-[#58D7D4]">Dashboard</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">KI-Hinweise</Link>
            <p className="ml-auto">Gilt für www.vitaltwin.de</p>
          </div>
        </div>
      </div>
    </main>
  );
}
