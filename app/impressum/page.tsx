import Link from 'next/link';

export default function Impressum() {
  return (
    <main className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-900">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Impressum</h1>
          <p className="mt-4 text-neutral-700">Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Anbieter</h2>
              <div className="mt-3 space-y-1 text-neutral-800">
                <p className="font-semibold">VitalTwin DE</p>
                <p>Avdi Morina</p>
                <p>Klepsauerstr. 60</p>
                <p>74677 Dörzbach</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Kontakt</h2>
              <div className="mt-3 space-y-2 text-neutral-800">
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

          <section className="mt-6 rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Verantwortlich für den Inhalt</h2>
            <p className="mt-3 text-neutral-800">Avdi Morina, Anschrift wie oben.</p>
          </section>

          <section className="mt-6 rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Haftungshinweis</h2>
            <p className="mt-3 text-neutral-700">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
            <Link href="/" className="transition hover:text-black">Startseite</Link>
            <Link href="/dashboard" className="transition hover:text-black">Dashboard</Link>
            <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-black">Widerrufsrecht</Link>
            <p className="ml-auto">Gilt für www.vitaltwin.de</p>
          </div>
        </div>
      </div>
    </main>
  );
}
