'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type AiUsage = {
  model_configured: string;
  openai_configured: boolean;
  total_requests_all_time: number;
  unique_users_all_time: number;
  requests_today: number;
  token_usage_note: string;
  response_time_note: string;
  prompt_versions_note: string;
};

export default function AdminAiPage() {
  const { authFetch } = useAdmin();
  const [data, setData] = useState<AiUsage | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/ai/usage');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('KI-Nutzungsdaten konnten nicht geladen werden.');
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
      <SectionTitle title="KI Control Center" subtitle="Modellkonfiguration und Nutzung des Twin-KI-Providers." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Kpi label="Modell" value={data.model_configured} />
            <Kpi label="OpenAI konfiguriert" value={data.openai_configured ? 'Ja' : 'Nein'} />
            <Kpi label="Anfragen gesamt" value={data.total_requests_all_time} />
            <Kpi label="Anfragen heute" value={data.requests_today} />
            <Kpi label="Eindeutige Nutzer" value={data.unique_users_all_time} />
          </div>
          <Note>{data.token_usage_note}</Note>
          <Note>{data.response_time_note}</Note>
          <Note>{data.prompt_versions_note}</Note>
        </>
      )}
    </div>
  );
}
