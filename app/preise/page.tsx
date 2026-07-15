'use client';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Preise() {
  const router = useRouter();
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const extractErrorMessage = (data: unknown): string => {
    if (!data || typeof data !== 'object') {
      return 'Checkout konnte nicht gestartet werden.';
    }

    const payload = data as { detail?: unknown; message?: string };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }

    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const first = payload.detail[0] as { msg?: string };
      if (typeof first?.msg === 'string' && first.msg.trim()) {
        return first.msg;
      }
    }

    return 'Checkout konnte nicht gestartet werden.';
  };

  const handlePremium = () => {
    setCheckoutMessage('');
    setConfirmCheckout(true);
  };

  const activateFreeBeta = async () => {
    setCheckoutMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=register&premium=1');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users/activate-beta'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCheckoutMessage(extractErrorMessage(data));
        return;
      }

      router.push('/dashboard?beta=activated');
    } catch {
      setCheckoutMessage('Beta-Aktivierung gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white py-20 px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Wähle deinen Zugang</h1>
        <p className="text-xl text-stone-400 mb-4">Beta-Test ohne Kostenfalle: erst testen, Feedback geben, dann in Ruhe entscheiden</p>
        <p className="text-sm text-amber-300 mb-16">Keine automatische Abbuchung im Beta-Test. Keine Kreditkarte nötig für den Einstieg.</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-stone-900 p-10 rounded-3xl">
            <h2 className="text-3xl font-semibold mb-2">Free</h2>
            <p className="text-6xl font-bold mb-8">0 €</p>
            <ul className="text-left space-y-4 mb-12">
              <li>✓ Einmalige Twin-Berechnung</li>
              <li>✓ Basis-Empfehlungen</li>
            </ul>
            <Link href="/?auth=register" className="block text-center py-4 border border-white rounded-2xl font-semibold">Kostenlos starten</Link>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-10 rounded-3xl relative scale-105">
            <div className="absolute -top-4 left-1/2 -transtone-x-1/2 bg-yellow-400 text-black px-8 py-1 rounded-full font-bold">EMPFOHLEN</div>
            <h2 className="text-3xl font-semibold mb-2">Beta-Zugang</h2>
            <p className="text-6xl font-bold mb-2">0 €</p>
            <p className="mb-8">Kostenlos als Beta-Tester starten</p>
            <ul className="text-left space-y-4 mb-12">
              <li>✓ Vollständiger Digital Twin</li>
              <li>✓ Unbegrenzte Simulationen</li>
              <li>✓ Monatliche Updates</li>
              <li>✓ Priorisierte Produktverbesserungen durch dein Feedback</li>
            </ul>
            <button onClick={handlePremium} className="w-full bg-white text-black py-4 rounded-2xl font-semibold text-lg">
              Als Beta-Tester starten
            </button>

            {confirmCheckout && (
              <div className="mt-4 rounded-2xl border border-white/35 bg-black/25 p-4 text-left text-sm text-white">
                <p className="font-semibold">Beta-Start bestätigen</p>
                <p className="mt-2 text-white/85">Du startest kostenlos als Tester. Keine automatische Zahlung, keine Kreditkarte.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={activateFreeBeta}
                    disabled={checkoutLoading}
                    className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {checkoutLoading ? 'Aktiviere...' : 'Als Beta-Tester kostenlos starten'}
                  </button>
                  <button
                    onClick={() => setConfirmCheckout(false)}
                    className="rounded-xl border border-white/60 px-4 py-2 font-semibold"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {checkoutMessage && <p className="mt-3 text-sm text-red-100">{checkoutMessage}</p>}

            <div className="mt-6 rounded-2xl border border-white/30 bg-black/25 p-4 text-left text-sm">
              <p className="font-semibold">Nach der Beta hast du die Wahl:</p>
              <ul className="mt-2 space-y-1 text-white/90">
                <li>1. Sonderangebot für 6 Monate</li>
                <li>2. Danach regulärer Preis</li>
                <li>3. Oder jederzeit ohne Verlängerung beenden</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className="mx-auto mt-16 flex max-w-5xl flex-wrap items-center justify-center gap-5 border-t border-white/10 pt-6 text-sm text-stone-400">
        <Link href="/" className="transition hover:text-amber-300">Startseite</Link>
        <Link href="/impressum" className="transition hover:text-amber-300">Impressum</Link>
        <Link href="/datenschutz" className="transition hover:text-amber-300">Datenschutz</Link>
        <Link href="/agb" className="transition hover:text-amber-300">AGB</Link>
        <Link href="/widerrufsrecht" className="transition hover:text-amber-300">Widerrufsrecht</Link>
      </footer>
    </div>
  );
}