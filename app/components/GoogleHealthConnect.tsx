'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type GoogleHealthStatus = {
  connected: boolean;
  status?: string;
  connected_at?: string | null;
  granted_scopes?: string[];
  reauthorization_required_at?: string | null;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_sync_error_code?: string | null;
};

export default function GoogleHealthConnect() {
  const [status, setStatus] = useState<GoogleHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const loadStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/health/google/status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setStatus(await response.json());
      }
    } catch {
      // Backend gerade nicht erreichbar — Verbinden-Button bleibt trotzdem nutzbar.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('health_connect');
    if (!result) return;

    const timer = window.setTimeout(() => {
      if (result === 'success') {
        setMessage('✅ Google Health erfolgreich verbunden.');
        void loadStatus();
      } else if (result === 'partial_consent') {
        setMessage('⚠️ Verbunden, aber nicht alle angefragten Berechtigungen wurden erteilt.');
        void loadStatus();
      } else {
        const reason = params.get('reason');
        setMessage(`❌ Verbindung fehlgeschlagen${reason ? ` (${reason})` : ''}. Bitte erneut versuchen.`);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  const handleConnect = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/health/google/connect'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.authorization_url) {
        setMessage(data?.detail?.message ?? 'Google Health konnte nicht gestartet werden.');
        setBusy(false);
        return;
      }
      window.location.href = data.authorization_url;
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/health/google/disconnect'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setStatus({ connected: false, status: 'not_connected' });
        setMessage('Verbindung getrennt. Gespeicherte Tokens wurden gelöscht.');
      } else {
        setMessage('Trennen fehlgeschlagen. Bitte versuche es erneut.');
      }
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/health/google/sync'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setMessage(
          data?.status === 'partial'
            ? '⚠️ Synchronisierung teilweise abgeschlossen — manche Datentypen konnten nicht geladen werden.'
            : 'Synchronisierung abgeschlossen.'
        );
        void loadStatus();
      } else if (response.status === 409) {
        setMessage('Verbindung ist abgelaufen. Bitte erneut verbinden.');
        void loadStatus();
      } else {
        setMessage(data?.detail?.message ?? 'Synchronisierung fehlgeschlagen.');
      }
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  const reauthRequired = status?.status === 'reauthorization_required';
  const connected = Boolean(status?.connected) && !reauthRequired;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-[#B7BDC4]">
        Verbinde Fitbit, Pixel Watch und unterstützte Gesundheitsdaten sicher über Google Health.
      </p>

      {reauthRequired ? (
        <>
          <p className="mt-3 text-sm text-[#F3C979]">⚠️ Verbindung abgelaufen — bitte erneut verbinden.</p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="mt-4 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Wird geöffnet…' : 'Erneut verbinden'}
          </button>
        </>
      ) : connected ? (
        <>
          <p className="mt-3 text-sm text-[#58D7D4]">✅ Verbunden</p>
          {status?.last_sync_at && (
            <p className="mt-1 text-xs text-[#8E969F]">
              Zuletzt synchronisiert: {new Date(status.last_sync_at).toLocaleString('de-DE')}
              {status.last_sync_status === 'partial' && ' (teilweise)'}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Läuft…' : 'Jetzt synchronisieren'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={busy}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verbindung trennen
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy}
          className="mt-4 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Wird geöffnet…' : 'Mit Google Health verbinden'}
        </button>
      )}

      {message && <p className="mt-3 text-sm text-[#B7BDC4]">{message}</p>}
    </div>
  );
}
