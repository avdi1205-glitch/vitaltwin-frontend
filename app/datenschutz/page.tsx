export default function Datenschutz() {
  return (
    <div className="max-w-3xl mx-auto p-8 text-white">
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
      
      <div className="space-y-8 text-lg">
        <section>
          <h2 className="text-2xl mb-4">1. Verantwortliche Stelle</h2>
          <p>VitalTwin DE, Avdi Morina, info@vitaltwin.de</p>
        </section>

        <section>
          <h2 className="text-2xl mb-4">2. Welche Daten wir erheben</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>E-Mail-Adresse und Name (bei Registrierung)</li>
            <li>Biomarker-Werte, die du im Dashboard eingibst</li>
            <li>Zahlungsdaten (über Stripe)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl mb-4">3. Zweck der Datenerhebung</h2>
          <p>Wir speichern deine Daten, um dir den Digital Twin berechnen zu können und Premium-Funktionen bereitzustellen.</p>
        </section>

        <section>
          <h2 className="text-2xl mb-4">4. Weitergabe der Daten</h2>
          <p>Wir geben keine Daten an Dritte weiter, außer an Stripe für die Zahlungsabwicklung.</p>
        </section>

        <section>
          <h2 className="text-2xl mb-4">5. Deine Rechte</h2>
          <p>Du kannst jederzeit Auskunft, Löschung oder Berichtigung deiner Daten verlangen.</p>
        </section>
      </div>

      <p className="mt-10 text-sm text-slate-400">
        Stand: Juli 2026
      </p>
    </div>
  );
}