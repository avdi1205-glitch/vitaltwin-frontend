'use client';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Preise() {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
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

  const startCheckout = async () => {
    setCheckoutMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login&premium=1');
      return;
    }

    if (!priceId) {
      setCheckoutMessage('Preis-ID fehlt. Bitte NEXT_PUBLIC_STRIPE_PRICE_ID in Vercel setzen.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch(apiUrl('/api/payments/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, token }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCheckoutMessage(extractErrorMessage(data));
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutMessage('Stripe Checkout URL fehlt. Bitte Backend-Konfiguration prüfen.');
    } catch {
      setCheckoutMessage('Verbindung zur Payment-API fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePremium = () => {
    setCheckoutMessage('');
    setConfirmCheckout(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Wähle deinen Zugang</h1>
        <p className="text-xl text-slate-400 mb-4">Starte kostenlos und sichere dir den Beta-Zugang</p>
        <p className="text-sm text-cyan-300 mb-16">30 Tage kostenlos, danach 9,90 € pro Monat, jederzeit kündbar.</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-900 p-10 rounded-3xl">
            <h2 className="text-3xl font-semibold mb-2">Free</h2>
            <p className="text-6xl font-bold mb-8">0 €</p>
            <ul className="text-left space-y-4 mb-12">
              <li>✓ Einmalige Twin-Berechnung</li>
              <li>✓ Basis-Empfehlungen</li>
            </ul>
            <Link href="/?auth=register" className="block text-center py-4 border border-white rounded-2xl font-semibold">Kostenlos starten</Link>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-10 rounded-3xl relative scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-8 py-1 rounded-full font-bold">EMPFOHLEN</div>
            <h2 className="text-3xl font-semibold mb-2">Beta-Zugang</h2>
            <p className="text-6xl font-bold mb-2">9,90 €</p>
            <p className="mb-8">30 Tage kostenlos • danach monatlich kündbar</p>
            <ul className="text-left space-y-4 mb-12">
              <li>✓ Vollständiger Digital Twin</li>
              <li>✓ Unbegrenzte Simulationen</li>
              <li>✓ Monatliche Updates</li>
              <li>✓ Priorisierte Produktverbesserungen durch dein Feedback</li>
            </ul>
            <button onClick={handlePremium} className="w-full bg-white text-black py-4 rounded-2xl font-semibold text-lg">
              Beta-Zugang aktivieren
            </button>

            {confirmCheckout && (
              <div className="mt-4 rounded-2xl border border-white/35 bg-black/25 p-4 text-left text-sm text-white">
                <p className="font-semibold">Weiter zu Stripe?</p>
                <p className="mt-2 text-white/85">Du startest mit 30 Tagen kostenlos. Heute wird laut Angebot nichts berechnet.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={startCheckout}
                    disabled={checkoutLoading}
                    className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {checkoutLoading ? 'Weiterleitung...' : 'Ja, zu Stripe'}
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
          </div>
        </div>
      </div>
    </div>
  );
}