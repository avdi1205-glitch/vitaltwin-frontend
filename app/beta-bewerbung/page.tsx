'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '@/lib/api';

export default function BetaBewerbung() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [motivation, setMotivation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/beta/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          age: age ? Number(age) : null,
          motivation,
          source: 'beta-bewerbung-landingpage',
          website,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.detail ?? 'Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.');
        return;
      }

      setMessage(data?.message ?? 'Danke für deine Bewerbung!');
      setSuccess(true);
    } catch {
      setMessage('Backend nicht erreichbar. Bitte versuche es in wenigen Sekunden erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE1] px-6 py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-neutral-500">VitalTwin Beta-Kohorte</p>
        <h1 className="mt-2 text-center font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-neutral-900">
          Bewirb dich für die Beta
        </h1>
        <p className="mt-4 text-center text-neutral-600">
          Wir starten mit einer kleinen, ausgewählten DACH-Kohorte. Beta-Zugang ist kostenlos: unbegrenzte
          Simulationen, Verlauf und direkter Einfluss auf das Produkt.
        </p>

        <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
          {success ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
              <p className="text-lg font-semibold text-neutral-900">Bewerbung eingegangen</p>
              <p className="mt-2 text-neutral-600">{message}</p>
              <Link href="/" className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
                Zurück zur Startseite
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-neutral-700" htmlFor="full_name">Vollständiger Name</label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vor- und Nachname"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-700" htmlFor="email">E-Mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@beispiel.de"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-700" htmlFor="age">Alter (optional)</label>
                <input
                  id="age"
                  type="number"
                  min={16}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="z. B. 42"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-700" htmlFor="motivation">
                  Warum möchtest du teilnehmen?
                </label>
                <textarea
                  id="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Was interessiert dich an VitalTwin? Welche Gesundheitsziele hast du?"
                  className="min-h-[120px] w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </div>

              {/* Honeypot field: hidden from real users via CSS, catches simple bots. */}
              <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {message && !success && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black py-4 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-70"
              >
                {loading ? 'Sende Bewerbung...' : 'Jetzt bewerben'}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Mit dem Absenden akzeptierst du unsere{' '}
                <Link href="/agb" className="underline hover:text-black">AGB</Link> und{' '}
                <Link href="/datenschutz" className="underline hover:text-black">Datenschutzerklärung</Link>.
              </p>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Schon ein Konto?{' '}
          <Link href="/?auth=login" className="text-neutral-900 underline hover:text-black">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
