import Link from 'next/link';

export default function Impressum() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Impressum</h1>
          <p className="mt-4 text-slate-300">Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Anbieter</h2>
              <div className="mt-3 space-y-1 text-slate-200">
                <p className="font-semibold">VitalTwin DE</p>
                <p>Avdi Morina</p>
                <p>Klepsauerstr. 60</p>
                <p>74677 Dörzbach</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Kontakt</h2>
              <div className="mt-3 space-y-2 text-slate-200">
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

          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-xl font-semibold text-white">Verantwortlich für den Inhalt</h2>
            <p className="mt-3 text-slate-200">Avdi Morina, Anschrift wie oben.</p>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-xl font-semibold text-white">Haftungshinweis</h2>
            <p className="mt-3 text-slate-300">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-slate-800 pt-6 text-sm text-slate-400">
            <Link href="/" className="transition hover:text-cyan-300">Startseite</Link>
            <Link href="/dashboard" className="transition hover:text-cyan-300">Dashboard</Link>
            <Link href="/datenschutz" className="transition hover:text-cyan-300">Datenschutz</Link>
            <p className="ml-auto">Gilt für www.vitaltwin.de</p>
          </div>
        </div>
      </div>
    </main>
  );
}
