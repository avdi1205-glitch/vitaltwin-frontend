'use client';

// Health Connect (on-device Android) sync — the missing glue between the
// native `HealthConnectPlugin.kt` (checkAvailability/permissions/reads) and
// VitalTwin's own backend (`POST /api/health/health-connect/sync`). Before
// this component existed, the Kotlin plugin + backend endpoint were both
// fully built but NEVER actually reachable from the running app — nothing
// in the web/JS layer ever called them. Renders nothing at all on web or
// iOS (`isHealthConnectSupportedPlatform()` guards every branch) — Chrome
// never opens, no behavior change for non-Android users.

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import HealthConnect, {
  WELLNESS_DATA_TYPES,
  isHealthConnectSupportedPlatform,
  type HealthConnectRawRecord,
} from '@/lib/health-connect';

const CATEGORY_LABELS: Record<string, string> = {
  steps: 'Schritte',
  distance: 'Distanz',
  'active-calories': 'Aktive Kalorien',
  'total-calories': 'Gesamtkalorien',
  'exercise-session': 'Trainingseinheiten',
  'heart-rate': 'Herzfrequenz',
  'resting-heart-rate': 'Ruheherzfrequenz',
  'heart-rate-variability': 'Herzfrequenzvariabilität (HRV)',
  'oxygen-saturation': 'Sauerstoffsättigung (SpO2)',
  'respiratory-rate': 'Atemfrequenz',
  'body-temperature': 'Körpertemperatur',
  weight: 'Gewicht',
  'sleep-session': 'Schlaf',
};

type SyncResult = { received: number; stored: number; skipped: number };
type SyncResponse = { results: Record<string, SyncResult>; unsupported_types: string[]; debug_last_error: string | null };

export default function HealthConnectSync() {
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(false);
  const [granted, setGranted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResults, setLastResults] = useState<Record<string, SyncResult> | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!isHealthConnectSupportedPlatform()) return;
    try {
      const availability = await HealthConnect.checkAvailability();
      setAvailable(availability.available);
      if (availability.available) {
        const perms = await HealthConnect.getGrantedWellnessPermissions();
        setGranted(perms.granted);
      }
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSupported(isHealthConnectSupportedPlatform());
      void refreshStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshStatus]);

  const handleConnect = async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await HealthConnect.requestWellnessPermissions({ dataTypes: [...WELLNESS_DATA_TYPES] });
      setGranted(result.granted);
      if (result.granted.length === 0) {
        setMessage('Keine Berechtigung erteilt — VitalTwin funktioniert trotzdem weiter.');
      } else {
        setMessage('Berechtigungen erteilt. Du kannst jetzt synchronisieren.');
      }
    } catch {
      setMessage('Health Connect Berechtigungsanfrage fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token || granted.length === 0) return;
    setBusy(true);
    setMessage('');
    try {
      const records: Record<string, HealthConnectRawRecord[]> = {};
      for (const dataType of granted) {
        try {
          const read = await HealthConnect.readWellnessRecords({ dataType, days: 30 });
          if (read.records.length > 0) {
            records[dataType] = read.records;
          }
        } catch {
          // One category failing to read must not block the others.
        }
      }
      const response = await fetch(apiUrl('/api/health/health-connect/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records }),
      });
      const data = (await response.json().catch(() => null)) as SyncResponse | null;
      if (response.ok && data) {
        setLastResults(data.results);
        setMessage('Synchronisierung abgeschlossen.');
      } else {
        setMessage('Synchronisierung fehlgeschlagen. Bitte später erneut versuchen.');
      }
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  if (!supported || !available) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-[#B7BDC4]">
        Verbinde weitere Wellness-Daten direkt von deinem Android-Gerät über Health Connect — nur lesend, du
        entscheidest bei jeder Anfrage, welche Kategorien du erlaubst.
      </p>

      {granted.length > 0 && (
        <p className="mt-3 text-sm text-[#58D7D4]">
          ✅ Erlaubt: {granted.map((g) => CATEGORY_LABELS[g] ?? g).join(', ')}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Läuft…' : granted.length > 0 ? 'Berechtigungen ändern' : 'Health Connect verbinden'}
        </button>
        {granted.length > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Läuft…' : 'Jetzt synchronisieren'}
          </button>
        )}
      </div>

      {lastResults && (
        <ul className="mt-3 space-y-1 text-xs text-[#8E969F]">
          {Object.entries(lastResults).map(([dataType, result]) => (
            <li key={dataType}>
              {CATEGORY_LABELS[dataType] ?? dataType}: {result.stored} gespeichert
              {result.skipped > 0 ? `, ${result.skipped} übersprungen` : ''}
            </li>
          ))}
        </ul>
      )}

      {message && <p className="mt-3 text-sm text-[#B7BDC4]">{message}</p>}
    </div>
  );
}
