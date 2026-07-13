export default function Impressum() {
  return (
    <div className="max-w-3xl mx-auto p-8 text-white">
      <h1 className="text-4xl font-bold mb-8">Impressum</h1>

      <div className="space-y-6 text-lg">
        <div>
          <p className="font-semibold">VitalTwin DE</p>
          <p>Avdi Morina</p>
          <p>Deine Straße 123</p>
          <p>12345 Musterstadt</p>
          <p>Deutschland</p>
        </div>

        <div>
          <p><strong>Telefon:</strong> +49 123 456789</p>
          <p><strong>E-Mail:</strong> info@vitaltwin.de</p>
        </div>

        <div>
          <p><strong>Umsatzsteuer-ID:</strong> DE123456789</p>
          <p><strong>Verantwortlich für den Inhalt:</strong> Avdi Morina</p>
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-400">
        Dieses Impressum gilt für die Website vitaltwin.de
      </p>
    </div>
  );
}
