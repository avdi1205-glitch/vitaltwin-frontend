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
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import HealthConnect, {
  WELLNESS_DATA_TYPES,
  isHealthConnectSupportedPlatform,
  type HealthConnectRawRecord,
} from '@/lib/health-connect';

type CategoryLabelKey = 'catSteps' | 'catDistance' | 'catActiveCal' | 'catTotalCal' | 'catExercise' | 'catHeartRate' | 'catRestingHr' | 'catHrv' | 'catOxygen' | 'catRespiratory' | 'catBodyTemp' | 'catWeight' | 'catSleep';
const CATEGORY_LABEL_KEYS: Record<string, CategoryLabelKey> = {
  steps: 'catSteps',
  distance: 'catDistance',
  'active-calories': 'catActiveCal',
  'total-calories': 'catTotalCal',
  'exercise-session': 'catExercise',
  'heart-rate': 'catHeartRate',
  'resting-heart-rate': 'catRestingHr',
  'heart-rate-variability': 'catHrv',
  'oxygen-saturation': 'catOxygen',
  'respiratory-rate': 'catRespiratory',
  'body-temperature': 'catBodyTemp',
  weight: 'catWeight',
  'sleep-session': 'catSleep',
};

// Compact, grouped reference list shown while not yet connected — helps the
// user understand what they're about to grant. Deliberately excludes Skin
// Temperature (intentionally unsupported, see HealthConnectPlugin.kt).
type GroupLabelKey = 'groupActivity' | 'groupSleep' | 'groupRecovery' | 'groupBody';
type ItemLabelKey = CategoryLabelKey | 'itemTraining' | 'itemCalories' | 'itemSleepPhases' | 'itemRestingPulse';
const CATEGORY_GROUP_KEYS: { labelKey: GroupLabelKey; itemKeys: ItemLabelKey[] }[] = [
  { labelKey: 'groupActivity', itemKeys: ['catSteps', 'catDistance', 'itemTraining', 'itemCalories'] },
  { labelKey: 'groupSleep', itemKeys: ['catSleep', 'itemSleepPhases'] },
  { labelKey: 'groupRecovery', itemKeys: ['catHeartRate', 'itemRestingPulse', 'catHrv', 'catOxygen', 'catRespiratory'] },
  { labelKey: 'groupBody', itemKeys: ['catWeight', 'catBodyTemp'] },
];

type SyncResult = { received: number; stored: number; skipped: number };
type SyncResponse = { results: Record<string, SyncResult>; unsupported_types: string[]; debug_last_error: string | null };

export default function HealthConnectSync() {
  const t = useTranslations('health');
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(false);
  const [granted, setGranted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResults, setLastResults] = useState<Record<string, SyncResult> | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

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
        setMessage(t('noPermission'));
      } else {
        setMessage(t('permissionGranted'));
      }
    } catch {
      setMessage(t('permissionError'));
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
        setLastSyncedAt(new Date().toLocaleString('de-DE'));
        setMessage(t('syncComplete'));
      } else {
        setMessage(t('syncError'));
      }
    } catch {
      setMessage(t('backendShort'));
    } finally {
      setBusy(false);
    }
  };

  if (!supported || !available) return null;

  const connected = granted.length > 0;

  return (
    <div className="mt-16">
      <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
        {t('source')}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA] md:text-6xl">
        {t('connect')}
      </h2>
      <p className="mt-4 max-w-2xl text-[#B7BDC4]">
        Verbinde VitalTwin mit Health Connect, damit dein Twin freigegebene Wellness-Daten wie Schritte, Schlaf,
        Herzfrequenz, HRV, Gewicht und Aktivität automatisch berücksichtigen kann.
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      {connected ? (
        <>
          <p className="text-base font-semibold text-[#58D7D4]">✅ {t('connected')}</p>
          <p className="mt-2 text-sm text-[#B7BDC4]">
            {t('categories')}: {granted.map((g) => (CATEGORY_LABEL_KEYS[g] ? t(CATEGORY_LABEL_KEYS[g]) : g)).join(', ')}
          </p>
          {lastSyncedAt && (
            <p className="mt-1 text-xs text-[#8E969F]">{t('lastSync')} {lastSyncedAt}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-[#B7BDC4]">
            {t('intro')}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORY_GROUP_KEYS.map((group) => (
              <div key={group.labelKey}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8E969F]">{t(group.labelKey)}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-[#B7BDC4]">
                  {group.itemKeys.map((itemKey) => (
                    <li key={itemKey}>{t(itemKey)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy}
          className={
            connected
              ? 'rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60'
              : 'rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-3 text-base font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          {busy ? '…' : connected ? t('manage') : t('connect')}
        </button>
        {connected && (
          <button
            type="button"
            onClick={handleSync}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? '…' : t('sync')}
          </button>
        )}
      </div>

      {lastResults && (
        <ul className="mt-4 space-y-1 text-xs text-[#8E969F]">
          {Object.entries(lastResults).map(([dataType, result]) => (
            <li key={dataType}>
              {CATEGORY_LABEL_KEYS[dataType] ? t(CATEGORY_LABEL_KEYS[dataType]) : dataType}: {result.stored} {t('syncStored')}
              {result.skipped > 0 ? `, ${result.skipped} ${t('syncSkipped')}` : ''}
            </li>
          ))}
        </ul>
      )}

      {message && <p className="mt-3 text-sm text-[#B7BDC4]">{message}</p>}
      </div>
    </div>
  );
}
