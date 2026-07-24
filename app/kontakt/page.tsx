'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '@/lib/api';

export default function Kontakt() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    try {
      const response = await fetch(apiUrl('/api/contact/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          subject,
          message,
          website,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatusMessage(data?.detail ?? 'Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
        return;
      }

      setStatusMessage(data?.message ?? 'Danke für deine Nachricht!');
      setSuccess(true);
    } catch {
      setStatusMessage('Backend nicht erreichbar. Bitte versuche es in wenigen Sekunden erneut oder schreib uns direkt an info@vitaltwin.de.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] px-6 py-16">
      <div className="mx-auto max-w-xl">
        <p className="font-[family-name:var(--font-mono-technical)] text-center text-xs uppercase tracking-[0.22em] text-[#8E969F]">Kontakt</p>
        <h1 className="mt-2 text-center font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA]">
          Schreib uns
        </h1>
        <p className="mt-4 text-center text-[#B7BDC4]">
          Fragen, Feedback oder ein Anliegen zur Beta? Wir antworten dir so schnell wie möglich per E-Mail. Direkt
          erreichbar sind wir auch unter{' '}
          <a href="mailto:info@vitaltwin.de" className="text-[#58D7D4] underline hover:text-[#F3C979]">
            info@vitaltwin.de
          </a>
          .
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          {success ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-lg font-semibold text-[#F5F2EA]">Nachricht gesendet</p>
              <p className="mt-2 text-[#B7BDC4]">{statusMessage}</p>
              <Link href="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110">
                Zurück zur Startseite
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="full_name">Name</label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vor- und Nachname"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="email">E-Mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@beispiel.de"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="subject">Betreff (optional)</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Worum geht's?"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="message">Nachricht</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deine Nachricht an uns..."
                  rows={6}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                  minLength={10}
                  maxLength={3000}
                />
              </div>

              {/* Honeypot field: hidden from real users via CSS, bots tend to fill every input. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
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

              {statusMessage && <p className="text-sm text-red-300">{statusMessage}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Wird gesendet...' : 'Nachricht senden'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-[#8E969F]">
          <Link href="/" className="transition hover:text-[#58D7D4]">Startseite</Link>
          <Link href="/impressum" className="transition hover:text-[#58D7D4]">Impressum</Link>
          <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
        </div>
      </div>
    </div>
  );
}
