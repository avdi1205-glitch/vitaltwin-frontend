'use client';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Preise() {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  const router = useRouter();

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

  const handlePremium = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bitte zuerst einloggen, um Premium zu kaufen.');
      router.push('/?auth=login');
      return;
    }

    if (!priceId) {
      alert('Preis-ID fehlt. Bitte NEXT_PUBLIC_STRIPE_PRICE_ID in Vercel setzen.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/payments/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, token }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(extractErrorMessage(data));
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert('Stripe Checkout URL fehlt. Bitte Backend-Konfiguration prüfen.');
    } catch {
      alert('Verbindung zur Payment-API fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Wähle deinen Plan</h1>
        <p className="text-xl text-slate-400 mb-16">Starte kostenlos und upgrade jederzeit</p>

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
            <h2 className="text-3xl font-semibold mb-2">Premium</h2>
            <p className="text-6xl font-bold mb-2">9,90 €</p>
            <p className="mb-8">pro Monat • Jederzeit kündbar</p>
            <ul className="text-left space-y-4 mb-12">
              <li>✓ Vollständiger Digital Twin</li>
              <li>✓ Unbegrenzte Simulationen</li>
              <li>✓ Monatliche Updates</li>
            </ul>
            <button onClick={handlePremium} className="w-full bg-white text-black py-4 rounded-2xl font-semibold text-lg">
              Jetzt Premium starten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}