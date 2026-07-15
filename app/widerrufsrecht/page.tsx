import Link from 'next/link';

export default function Widerrufsrecht() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Widerrufsbelehrung</h1>
          <p className="mt-4 text-stone-300">Gilt für Verbraucherinnen und Verbraucher im Sinne des § 13 BGB.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Widerrufsrecht</h2>
              <p className="mt-3 text-stone-300">
                Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
                Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mt-3 text-stone-300">
                Um dein Widerrufsrecht auszuüben, musst du uns
              </p>
              <p className="mt-3 text-stone-300">
                VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, E-Mail:{' '}
                <a href="mailto:info@vitaltwin.de" className="text-emerald-300 hover:underline">info@vitaltwin.de</a>
              </p>
              <p className="mt-3 text-stone-300">
                mittels einer eindeutigen Erklärung (z. B. per Post versandter Brief oder E-Mail) über deinen
                Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende
                Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
              </p>
              <p className="mt-3 text-stone-300">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
                Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Folgen des Widerrufs</h2>
              <p className="mt-3 text-stone-300">
                Wenn du diesen Vertrag widerrufst, erstatten wir dir alle Zahlungen, die wir von dir erhalten haben,
                unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an dem die Mitteilung über
                deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel,
                das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, ausdrücklich wurde etwas
                anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.
              </p>
              <p className="mt-3 text-stone-300">
                Hast du verlangt, dass die Nutzung der Plattform bereits während der Widerrufsfrist beginnen soll, so
                hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du
                uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichtest, bereits
                erbrachten Leistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Leistungen
                entspricht.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Hinweis zur Beta-Phase</h2>
              <p className="mt-3 text-stone-300">
                Während der aktuellen Beta-Phase ist die Nutzung von VitalTwin kostenlos. Da keine Zahlung erfolgt,
                entstehen dir aus einem Widerruf keine finanziellen Ansprüche. Sobald kostenpflichtige Pläne
                eingeführt werden, gilt diese Widerrufsbelehrung uneingeschränkt für den jeweiligen Vertrag.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Muster-Widerrufsformular</h2>
              <p className="mt-3 text-stone-300">
                (Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es an uns zurück.)
              </p>
              <div className="mt-4 rounded-xl border border-stone-700 bg-stone-950/70 p-5 font-mono text-sm text-stone-300">
                <p>An: VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, info@vitaltwin.de</p>
                <p className="mt-3">
                  Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Nutzung der
                  VitalTwin-Plattform.
                </p>
                <p className="mt-3">Bestellt am / erhalten am: _______________</p>
                <p className="mt-1">Name des/der Verbraucher(s): _______________</p>
                <p className="mt-1">Anschrift des/der Verbraucher(s): _______________</p>
                <p className="mt-3">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _______________</p>
                <p className="mt-1">Datum: _______________</p>
              </div>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-stone-800 pt-6 text-sm text-stone-400">
            <Link href="/" className="transition hover:text-emerald-300">Startseite</Link>
            <Link href="/impressum" className="transition hover:text-emerald-300">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-emerald-300">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-emerald-300">AGB</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
