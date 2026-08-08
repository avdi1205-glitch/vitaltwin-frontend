import Link from 'next/link';
import type { Metadata } from 'next';
import PublicFooter from '../components/PublicFooter';

export const metadata: Metadata = {
  title: 'Über uns | VitalTwin',
  description:
    'Was ist VitalTwin, warum wurde es entwickelt, was kann die Plattform heute wirklich und wo liegen ihre Grenzen?',
};

export default function UeberUns() {
  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <Link href="/" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          ← Zur Startseite
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">Über uns</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
          Was ist VitalTwin?
        </h1>
        <p className="mt-6 text-lg text-[#B7BDC4]">
          VitalTwin ist ein digitaler Wellness-Zwilling: ein persönliches Profil, das aus den Werten entsteht, die du
          selbst freiwillig einträgst — zu Schlaf, Bewegung, Ernährung, Stress und Erholung. Aus diesen Angaben baut
          VitalTwin ein verständliches Bild deiner Gewohnheiten auf und zeigt dir, wie sie sich über die Zeit
          entwickeln.
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Warum wurde VitalTwin entwickelt?</h2>
          <p className="text-[#B7BDC4]">
            Die meisten Gesundheits- und Fitness-Apps sammeln viele Einzelwerte, ordnen sie aber selten in einen
            größeren Zusammenhang ein. Schlafdaten liegen in einer App, Trainingsdaten in einer anderen, Ernährung
            wieder woanders — und niemand zeigt dir, wie diese Bereiche zusammenhängen. VitalTwin wurde entwickelt,
            um genau diese Lücke zu schließen: ein Ort, an dem deine Wellness-Daten zusammenkommen und verständlich
            eingeordnet werden, statt nur als isolierte Zahlen nebeneinander zu stehen.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Was bedeutet &quot;digitaler Wellness-Zwilling&quot;?</h2>
          <p className="text-[#B7BDC4]">
            Ein digitaler Zwilling ist im technischen Sinn ein digitales Abbild eines realen Systems, das sich mit
            neuen Daten laufend aktualisiert. Bei VitalTwin ist dieses &quot;System&quot; dein Wellness-Alltag: dein
            Zwilling entsteht ausschließlich aus deinen eigenen, freiwillig eingetragenen Angaben und wird mit jedem
            neuen Eintrag präziser. Er ist kein Blick in die Zukunft und keine medizinische Vorhersage, sondern eine
            strukturierte, nachvollziehbare Zusammenfassung deiner eigenen Muster.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">
            Was unterscheidet VitalTwin von einer normalen Tracking-App?
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-[#B7BDC4]">
            <li>Ein zusammenhängendes Profil statt getrennter Einzel-Apps für Schlaf, Bewegung und Ernährung.</li>
            <li>
              Erklärbare Empfehlungen: jede Einschätzung von &quot;Frag deinen Twin&quot; verweist auf die konkreten
              eigenen Daten, aus denen sie abgeleitet wurde — kein Blackbox-Ergebnis.
            </li>
            <li>
              Rückblicke statt Momentaufnahmen: Wochenrückblick und Verlauf zeigen Entwicklung über Zeit, nicht nur
              den heutigen Tag.
            </li>
            <li>Volle Datenkontrolle: Export und Löschung jederzeit selbst im Profil möglich.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Welche Funktionen gibt es heute?</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#B7BDC4]">
            <li>Tägliches Check-in zu Stimmung, Energie, Stress, Schlaf und Bewegung.</li>
            <li>Gewohnheiten anlegen und verfolgen, inklusive Serien und Erfüllungsquoten.</li>
            <li>Wellness-Ziele definieren und Fortschritt beobachten.</li>
            <li>Twin-Berechnung auf Basis eingetragener Biomarker (z. B. HbA1c, CRP, Vitamin D, ApoB).</li>
            <li>&quot;Frag deinen Twin&quot; — ein KI-gestützter Wellness-Assistent auf Basis deiner eigenen Daten.</li>
            <li>Wochenrückblick und Musterserkennung bei ausreichender Datenlage.</li>
            <li>Premium: Blutzucker-Tracking (CGM-Import) und Ernährungstagebuch.</li>
            <li>Automatische Gesundheitsdaten über Google Health (Beta) — Verbinden und Synchronisieren funktionieren bereits, aktuell in begrenzter Testphase.</li>
            <li>Vollständiger Datenexport und selbstständige Löschung im Profilbereich.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Welche Funktionen sind geplant?</h2>
          <p className="text-[#B7BDC4]">
            Wir bauen VitalTwin schrittweise aus. Geplant sind unter anderem eine breitere Freigabe der Google-Health-Anbindung (aktuell Beta mit begrenzter Testnutzerzahl), erweiterte Lifestyle-Simulationen im
            Pro-Tarif und Mehrfamilienprofile im Family-Tarif. Funktionen, die noch nicht fertig sind, kennzeichnen
            wir auf der <Link href="/preise" className="underline hover:text-[#58D7D4]">Preise-Seite</Link> ausdrücklich
            als &quot;bald verfügbar&quot; — wir stellen nichts als aktiv verfügbar dar, was es noch nicht ist.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Welche Grenzen hat VitalTwin?</h2>
          <p className="text-[#B7BDC4]">
            VitalTwin ist ein Wellness-Tool zur Selbstreflexion und Orientierung — <strong>kein Medizinprodukt</strong>{' '}
            und keine zugelassene medizinische Software. Die Plattform stellt keine Diagnosen, gibt keine
            Therapieempfehlungen und ersetzt keinen Arztbesuch. Alle Auswertungen basieren ausschließlich auf den
            Daten, die du selbst einträgst — bei fehlenden oder ungenauen Angaben sind auch die Einschätzungen
            entsprechend eingeschränkt. Details zur KI-Funktion findest du in unseren{' '}
            <Link href="/ki-hinweise" className="underline hover:text-[#58D7D4]">KI-Hinweisen</Link>.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">Kontakt</h2>
          <p className="text-[#B7BDC4]">
            Fragen, Feedback oder Interesse an der Beta? Schreib uns über das{' '}
            <Link href="/kontakt" className="underline hover:text-[#58D7D4]">Kontaktformular</Link> oder direkt an{' '}
            <a href="mailto:info@vitaltwin.de" className="underline hover:text-[#58D7D4]">info@vitaltwin.de</a>.
            Anbieterangaben findest du im <Link href="/impressum" className="underline hover:text-[#58D7D4]">Impressum</Link>.
          </p>
        </section>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
