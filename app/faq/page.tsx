import Link from 'next/link';
import type { Metadata } from 'next';
import PublicFooter from '../components/PublicFooter';

export const metadata: Metadata = {
  title: 'Häufige Fragen (FAQ) | VitalTwin',
  description: 'Antworten zu VitalTwin: Kosten, Datenschutz, Google Health, CGM, KI-Funktionen, Konto und mehr.',
  alternates: { canonical: '/faq' },
};

const FAQ_GROUPS: { heading: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    heading: 'Grundlagen',
    items: [
      {
        q: 'Was ist VitalTwin?',
        a: 'VitalTwin ist ein digitaler Wellness-Zwilling: eine Plattform, die deine freiwillig eingetragenen Werte zu Schlaf, Bewegung, Ernährung, Stress und Erholung zusammenführt und verständlich einordnet. Mehr dazu auf unserer Seite "Über uns".',
      },
      {
        q: 'Was ist ein digitaler Wellness-Zwilling?',
        a: 'Ein digitales Abbild deines Wellness-Alltags, das sich mit jedem neuen Eintrag aktualisiert und dir hilft, Zusammenhänge zwischen deinen Gewohnheiten und deinem Wohlbefinden zu erkennen — keine medizinische Vorhersage, sondern eine strukturierte Zusammenfassung deiner eigenen Daten.',
      },
      {
        q: 'Für wen ist VitalTwin gedacht?',
        a: 'Für Menschen, die ihre Wellness-Gewohnheiten (Schlaf, Bewegung, Ernährung, Stress) an einem Ort verstehen und langfristig verbessern möchten — ohne mehrere Einzel-Apps parallel zu nutzen.',
      },
      {
        q: 'Ist VitalTwin ein Medizinprodukt?',
        a: 'Nein. VitalTwin ist ein Wellness-Tool zur Selbstreflexion und Orientierung, kein zugelassenes Medizinprodukt und kein Diagnosewerkzeug.',
      },
      {
        q: 'Gibt VitalTwin Diagnosen oder Therapieempfehlungen?',
        a: 'Nein. VitalTwin stellt keine Diagnosen und gibt keine Therapieempfehlungen. Bei gesundheitlichen Beschwerden wende dich an qualifiziertes medizinisches Fachpersonal.',
      },
    ],
  },
  {
    heading: 'Kosten & Tarife',
    items: [
      {
        q: 'Ist VitalTwin kostenlos?',
        a: (
          <>
            Ja. Der Free-Tarif enthält ein Basis-Dashboard und eine begrenzte Anzahl KI-Fragen pro Tag. Details zu
            allen Tarifen findest du auf der <Link href="/preise" className="underline hover:text-[#58D7D4]">Preise-Seite</Link>.
          </>
        ),
      },
      {
        q: 'Was ist der Unterschied zwischen Free und Premium?',
        a: 'Premium enthält zusätzlich Blutzucker-Tracking (CGM-Import), ein Ernährungstagebuch, mehr KI-Fragen pro Tag, Wochenberichte und einen erweiterten Verlauf. Free bleibt dauerhaft kostenlos nutzbar.',
      },
      {
        q: 'Was ist die Beta-Phase?',
        a: 'Während der aktuellen Beta-Phase kannst du dich kostenlos für den Beta-Zugang freischalten und erhältst dabei unbegrenzte Simulationen und Verlauf, ohne automatische Abbuchung. Details dazu stehen im Dashboard und auf der Preise-Seite.',
      },
      {
        q: 'Was passiert bei einer Kündigung?',
        a: 'Ein bezahltes Abo kannst du jederzeit zum Ende der laufenden Abrechnungsperiode kündigen. Danach wird dein Konto automatisch auf den Free-Tarif zurückgestuft, deine Daten bleiben erhalten.',
      },
      {
        q: 'Gibt es eine automatische Verlängerung?',
        a: 'Bezahlte Abos verlängern sich automatisch um den gewählten Abrechnungszeitraum (monatlich oder jährlich), bis du kündigst. Der Free- und Beta-Zugang lösen niemals automatisch eine Zahlung aus.',
      },
    ],
  },
  {
    heading: 'Daten & Datenschutz',
    items: [
      {
        q: 'Welche Daten kann ich erfassen?',
        a: 'Du entscheidest selbst, was du einträgst: Stimmung, Energie, Stress, Schlafqualität und -dauer, Bewegung, Gewohnheiten, Ziele und optional Biomarker wie HbA1c, CRP, Vitamin D oder ApoB für die Twin-Berechnung.',
      },
      {
        q: 'Wie werden meine Daten geschützt?',
        a: (
          <>
            Alle Angaben sind ausschließlich mit deinem Konto verknüpft. Details zu Speicherung, Verarbeitung und
            deinen Rechten findest du in unserer{' '}
            <Link href="/datenschutz" className="underline hover:text-[#58D7D4]">Datenschutzerklärung</Link>.
          </>
        ),
      },
      {
        q: 'Werden meine Gesundheitsdaten verkauft oder für Werbung genutzt?',
        a: 'Nein. Wellness- und Gesundheitsdaten werden nicht verkauft und nicht für personalisierte Werbung verwendet. Details zu eingesetzten Diensten stehen in der Datenschutzerklärung.',
      },
      {
        q: 'Nutzt VitalTwin meine Daten, um KI-Modelle zu trainieren?',
        a: 'Nein, deine Wellness-Daten werden nicht zum Training fremder KI-Modelle verwendet. Für "Frag deinen Twin" wird nur die konkrete Anfrage samt einer kompakten Zusammenfassung deiner eigenen Daten an einen externen KI-Anbieter übermittelt, um eine Antwort zu erzeugen — siehe unsere KI-Hinweise.',
      },
      {
        q: 'Kann ich meine Daten exportieren?',
        a: 'Ja, jederzeit über den Profilbereich als vollständiger Datenexport (JSON).',
      },
      {
        q: 'Kann ich mein Konto und meine Daten löschen?',
        a: 'Ja. Du kannst eine Löschung direkt im Profilbereich anfordern. Aus Sicherheitsgründen wird jede Löschanfrage manuell geprüft, statt automatisch sofort ausgeführt.',
      },
      {
        q: 'Kann ich einzelne Datenquellen wieder trennen?',
        a: 'Ja. Du kannst einzelne Datenkategorien (z. B. Check-ins, Gewohnheiten, Ziele) im Datenschutzbereich deines Profils gezielt löschen, ohne dein gesamtes Konto zu entfernen.',
      },
      {
        q: 'Welche Cookies setzt VitalTwin ein?',
        a: (
          <>
            Details und Einstellmöglichkeiten findest du auf der Seite{' '}
            <Link href="/cookie-einstellungen" className="underline hover:text-[#58D7D4]">Cookie-Einstellungen</Link>.
          </>
        ),
      },
    ],
  },
  {
    heading: 'Wearables & Datenquellen',
    items: [
      {
        q: 'Kann ich Google Health verbinden?',
        a: 'Ja, die Anbindung ist als Beta-Funktion verfügbar und wurde erfolgreich getestet (Verbindung und Synchronisierung funktionieren). Da sie sich noch in einer begrenzten Testphase befindet, ist der Zugang aktuell auf eine kleine Zahl von Testnutzern beschränkt — wir erweitern das schrittweise.',
      },
      {
        q: 'Unterstützt VitalTwin Fitbit oder die Pixel Watch?',
        a: 'Über Google Health lassen sich unter anderem Fitbit- und Pixel-Watch-Daten anbinden. Diese Anbindung befindet sich in der Beta-Phase — die Grundfunktionen (Verbinden, Synchronisieren) funktionieren bereits, die volle Freigabe für alle Nutzer folgt, sobald wir sie ausreichend getestet haben.',
      },
      {
        q: 'Was ist CGM?',
        a: 'CGM steht für "Continuous Glucose Monitoring" (kontinuierliche Glukosemessung) — Sensoren, die den Blutzuckerverlauf über den Tag aufzeichnen. Premium-Nutzer können solche Messwerte importieren und im Ernährungstagebuch einordnen.',
      },
      {
        q: 'Kann ich VitalTwin ohne Wearable nutzen?',
        a: 'Ja. VitalTwin funktioniert vollständig mit manuell eingetragenen Werten — ein Wearable ist nicht erforderlich.',
      },
    ],
  },
  {
    heading: 'KI & Empfehlungen',
    items: [
      {
        q: 'Wie funktioniert "Frag deinen Twin"?',
        a: 'Du stellst eine Frage zu deiner Entwicklung, und der Twin antwortet auf Basis deiner eigenen, freiwillig eingetragenen Daten — mit nachvollziehbarer Quellenangabe über den "Warum?"-Button.',
      },
      {
        q: 'Kann sich der Twin irren?',
        a: 'Ja. Antworten werden automatisiert von einem Sprachmodell erzeugt und können ungenau sein. Du entscheidest selbst, welche Empfehlungen du umsetzt — siehe unsere KI-Hinweise.',
      },
      {
        q: 'Wie viele KI-Fragen habe ich pro Tag?',
        a: 'Das hängt von deinem Tarif ab (Free: bis zu 3, Premium: bis zu 30 pro Tag). Details auf der Preise-Seite.',
      },
    ],
  },
  {
    heading: 'Beta & Zukunft',
    items: [
      {
        q: 'Wie werde ich Beta-Tester?',
        a: (
          <>
            Über die Seite <Link href="/beta-bewerbung" className="underline hover:text-[#58D7D4]">Beta-Bewerbung</Link>{' '}
            oder direkt im Dashboard über &quot;Beta freischalten&quot;.
          </>
        ),
      },
      {
        q: 'Welche Funktionen kommen später?',
        a: 'Unter anderem eine tiefere Wearable-Anbindung, erweiterte Lifestyle-Simulationen und Mehrfamilienprofile. Alles, was noch nicht fertig ist, kennzeichnen wir ausdrücklich als "bald verfügbar".',
      },
      {
        q: 'Wie erreiche ich den Support?',
        a: (
          <>
            Über unser <Link href="/kontakt" className="underline hover:text-[#58D7D4]">Kontaktformular</Link> oder direkt
            per E-Mail an <a href="mailto:info@vitaltwin.de" className="underline hover:text-[#58D7D4]">info@vitaltwin.de</a>.
          </>
        ),
      },
    ],
  },
];

export default function Faq() {
  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <Link href="/" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          ← Zur Startseite
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">Hilfe</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
          Häufige Fragen
        </h1>
        <p className="mt-4 max-w-2xl text-[#B7BDC4]">
          Ehrliche Antworten zu VitalTwin — inklusive dem, was noch nicht fertig ist.
        </p>

        <div className="mt-12 space-y-10">
          {FAQ_GROUPS.map((group) => (
            <section key={group.heading}>
              <h2 className="text-xl font-semibold text-[#F5F2EA]">{group.heading}</h2>
              <div className="mt-4 space-y-4">
                {group.items.map((item) => (
                  <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="font-semibold text-[#F5F2EA]">{item.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#B7BDC4]">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
