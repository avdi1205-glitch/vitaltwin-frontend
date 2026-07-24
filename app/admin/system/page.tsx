'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type SystemStatus = {
  database: { status: string };
  openai: { configured: boolean };
  stripe: { configured: boolean };
  storage: { note: string };
  cron_jobs: { note: string };
  queues: { note: string };
  health_connect: { note: string };
  apple_health: { note: string };
};

export default function AdminSystemPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<SystemStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/system/status');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Systemstatus konnte nicht geladen werden.');
          return;
        }
        if (!cancelled) setData(await response.json());
      } catch {
        if (!cancelled) setErrorMessage('Backend gerade nicht erreichbar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SectionTitle title="System Center" subtitle="Ehrlicher Status — nur was tatsächlich überwacht werden kann." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <Card>
          <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
            Datenbank: {data.database.status === 'reachable' ? '✅ erreichbar' : '❌ nicht erreichbar'}
          </p>
          <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
            OpenAI konfiguriert: {data.openai.configured ? '✅ ja' : '❌ nein'}
          </p>
          <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
            Stripe konfiguriert: {data.stripe.configured ? '✅ ja' : '❌ nein'}
          </p>
          <Note>{data.storage.note}</Note>
          <Note>{data.cron_jobs.note}</Note>
          <Note>{data.queues.note}</Note>
          <Note>{data.health_connect.note}</Note>
          <Note>{data.apple_health.note}</Note>
        </Card>
      )}
    </div>
  );
}
