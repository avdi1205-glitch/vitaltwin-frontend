import Link from 'next/link';

export default function Datenschutz() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Datenschutzerklärung</h1>
          <p className="mt-4 text-slate-300">Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">1. Verantwortliche Stelle</h2>
              <p className="mt-3 text-slate-300">VitalTwin DE, Avdi Morina, info@vitaltwin.de</p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">2. Verarbeitete Daten</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-300">
                <li>Accountdaten wie Name und E-Mail-Adresse</li>
                <li>Biomarker und Eingaben aus dem Dashboard</li>
                <li>Technische Logdaten zur Stabilität und Sicherheit</li>
                <li>Zahlungsinformationen bei Premium-Abschluss über Stripe</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">3. Zweck und Rechtsgrundlagen</h2>
              <p className="mt-3 text-slate-300">
                Die Verarbeitung erfolgt zur Bereitstellung der Plattform, zur Berechnung deines Digital Twins, zur
                Vertragserfüllung sowie zur sicheren Zahlungsabwicklung. Rechtsgrundlagen sind insbesondere Art. 6
                Abs. 1 lit. b und lit. f DSGVO.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">4. Weitergabe und Dienstleister</h2>
              <p className="mt-3 text-slate-300">
                Eine Weitergabe erfolgt ausschließlich, soweit sie für den Betrieb erforderlich ist, z. B. an Stripe
                für Zahlungen sowie Hosting- und Infrastruktur-Dienstleister.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">5. Speicherdauer</h2>
              <p className="mt-3 text-slate-300">
                Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke notwendig ist oder gesetzliche
                Aufbewahrungsfristen bestehen.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">6. Deine Rechte</h2>
              <p className="mt-3 text-slate-300">
                Du hast Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und
                Widerspruch. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-slate-800 pt-6 text-sm text-slate-400">
            <Link href="/" className="transition hover:text-cyan-300">Startseite</Link>
            <Link href="/dashboard" className="transition hover:text-cyan-300">Dashboard</Link>
            <Link href="/impressum" className="transition hover:text-cyan-300">Impressum</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}