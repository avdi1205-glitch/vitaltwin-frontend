import Link from 'next/link';

export default function AGB() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Allgemeine Geschäftsbedingungen</h1>
          <p className="mt-4 text-stone-300">Gültig für die Nutzung der VitalTwin-Plattform (www.vitaltwin.de).</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">1. Geltungsbereich und Anbieter</h2>
              <p className="mt-3 text-stone-300">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform VitalTwin,
                angeboten von Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach (&quot;Anbieter&quot;). Mit der Registrierung
                erkennst du diese AGB an.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">2. Leistungsbeschreibung</h2>
              <p className="mt-3 text-stone-300">
                VitalTwin ist ein Wellness-Tool zur allgemeinen Gesundheitsorientierung. VitalTwin ist{' '}
                <strong>kein Medizinprodukt</strong> im Sinne der Verordnung (EU) 2017/745 (MDR) und ersetzt keine
                ärztliche Diagnose, Beratung oder Therapie. Die berechneten Werte (z. B. &quot;biologisches Alter&quot;) sind
                orientierende Wellness-Kennzahlen ohne medizinischen Aussagewert. Bei gesundheitlichen Beschwerden
                wende dich immer an eine Ärztin oder einen Arzt.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">3. Registrierung und Nutzerkonto</h2>
              <p className="mt-3 text-stone-300">
                Für die Nutzung ist eine Registrierung mit korrekten Angaben erforderlich. Du bist verpflichtet,
                deine Zugangsdaten geheim zu halten und uns über eine missbräuchliche Nutzung deines Kontos
                unverzüglich zu informieren.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">4. Preise, Beta-Phase und Zahlung</h2>
              <p className="mt-3 text-stone-300">
                Während der Beta-Phase ist der Beta-Zugang kostenlos nutzbar, wie auf der{' '}
                <Link href="/preise" className="text-amber-300 hover:underline">Preise-Seite</Link> beschrieben. Es
                erfolgt keine automatische Abbuchung während der Beta-Phase. Sollten künftig kostenpflichtige Pläne
                eingeführt werden, gelten die zu diesem Zeitpunkt auf der Preise-Seite veröffentlichten Konditionen;
                über Preisänderungen wirst du vorab informiert.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">5. Laufzeit und Kündigung</h2>
              <p className="mt-3 text-stone-300">
                Du kannst dein Konto jederzeit ohne Angabe von Gründen kündigen, indem du eine E-Mail an{' '}
                <a href="mailto:info@vitaltwin.de" className="text-amber-300 hover:underline">info@vitaltwin.de</a>{' '}
                sendest. Bei kostenpflichtigen Abonnements gelten die jeweils vereinbarten Kündigungsfristen laut
                Preise-Seite.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">6. Pflichten der Nutzer</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-stone-300">
                <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
                <li>Keine missbräuchliche oder rechtswidrige Nutzung der Plattform</li>
                <li>Keine Weitergabe des eigenen Kontos an Dritte</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">7. Haftungsbeschränkung</h2>
              <p className="mt-3 text-stone-300">
                Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach dem
                Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten
                (Kardinalpflichten) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im
                Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen. Die Wellness-Empfehlungen von
                VitalTwin stellen keine medizinische Beratung dar; eine Haftung für gesundheitliche Entscheidungen
                auf Basis der App ist ausgeschlossen, soweit gesetzlich zulässig.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">8. Änderungen der AGB</h2>
              <p className="mt-3 text-stone-300">
                Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, sofern dies zur Anpassung an
                geänderte rechtliche oder technische Rahmenbedingungen erforderlich ist. Über wesentliche Änderungen
                wirst du rechtzeitig informiert.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">9. Schlussbestimmungen</h2>
              <p className="mt-3 text-stone-300">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende
                verbraucherschützende Vorschriften deines gewöhnlichen Aufenthaltsorts bleiben unberührt. Sollte eine
                Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-stone-800 pt-6 text-sm text-stone-400">
            <Link href="/" className="transition hover:text-amber-300">Startseite</Link>
            <Link href="/impressum" className="transition hover:text-amber-300">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-amber-300">Datenschutz</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-amber-300">Widerrufsrecht</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
