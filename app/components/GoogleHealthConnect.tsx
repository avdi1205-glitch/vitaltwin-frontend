'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('health');
  const [status, setStatus] = useState<GoogleHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [denied, setDenied] = useState(false);
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
      } else if (response.status === 403) {
        setDenied(true);
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
        setMessage(`✅ ${t('successMsg')}`);
        void loadStatus();
      } else if (result === 'partial_consent') {
        setMessage(`⚠️ ${t('partialConsentMsg')}`);
        void loadStatus();
      } else {
        const reason = params.get('reason');
        setMessage(reason ? t('failureMsgReason', { reason }) : t('failureMsg'));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus, t]);

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
        setMessage(data?.detail?.message ?? t('connectStartError'));
        setBusy(false);
        return;
      }
      window.location.href = data.authorization_url;
    } catch {
      setMessage(t('backendShort'));
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
        setMessage(t('disconnectSuccess'));
      } else {
        setMessage(t('disconnectError'));
      }
    } catch {
      setMessage(t('backendShort'));
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
        if (data?.status === 'failed') {
          setMessage(t('syncNoDataError'));
        } else if (data?.status === 'partial') {
          setMessage(t('syncPartial'));
        } else {
          setMessage(t('syncComplete'));
        }
        void loadStatus();
      } else if (response.status === 409) {
        setMessage(t('tokenExpired'));
        void loadStatus();
      } else {
        setMessage(data?.detail?.message ?? t('syncError'));
      }
    } catch {
      setMessage(t('backendShort'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (denied) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">
          {t('deniedTitle')}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#B7BDC4]">
          {t('deniedText')}
        </p>
        <Link
          href="/preise"
          className="mt-5 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          {t('deniedLink')}
        </Link>
      </div>
    );
  }

  const reauthRequired = status?.status === 'reauthorization_required';
  const connected = Boolean(status?.connected) && !reauthRequired;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-[#B7BDC4]">
        {t('description')}
      </p>

      {reauthRequired ? (
        <>
          <p className="mt-3 text-sm text-[#F3C979]">⚠️ {t('reauthWarning')}</p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="mt-4 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? t('reauthBusy') : t('reauthIdle')}
          </button>
        </>
      ) : connected ? (
        <>
          <p className="mt-3 text-sm text-[#58D7D4]">{t('connectedStatus')}</p>
          {status?.last_sync_at && (
            <p className="mt-1 text-xs text-[#8E969F]">
              {t('lastSync')} {new Date(status.last_sync_at).toLocaleString('de-DE')}
              {status.last_sync_status === 'partial' && ` ${t('partialSuffix')}`}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? t('syncBusy') : t('syncIdle')}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={busy}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('disconnect')}
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
          {busy ? t('connectBusy') : t('connectIdle')}
        </button>
      )}

      {message && <p className="mt-3 text-sm text-[#B7BDC4]">{message}</p>}
    </div>
  );
}
