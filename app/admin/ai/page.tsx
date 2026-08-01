'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type AiUsageSummary = {
  requests: number | null;
  errors: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  cost_note: string | null;
  avg_latency_ms: number | null;
};

type AiUsage = {
  model_configured: string;
  openai_configured: boolean;
  total_requests_all_time: number;
  unique_users_all_time: number;
  requests_today: number;
  token_usage_note: string;
  response_time_note: string;
  prompt_versions_note: string;
  usage_today: AiUsageSummary;
  usage_30d: AiUsageSummary;
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

          <p style={{ marginTop: '1.5rem', fontWeight: 700 }}>KI-Kosten &amp; Fehler (aus vt_ai_usage_events)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <Kpi label="Requests heute" value={data.usage_today.requests} />
            <Kpi label="Fehler heute" value={data.usage_today.errors} />
            <Kpi label="Tokens heute" value={data.usage_today.total_tokens} />
            <Kpi label="Kosten heute" value={data.usage_today.cost_usd !== null ? `$${data.usage_today.cost_usd.toFixed(4)}` : '—'} hint={data.usage_today.cost_note ?? undefined} />
            <Kpi label="Ø Antwortzeit heute" value={data.usage_today.avg_latency_ms !== null ? `${data.usage_today.avg_latency_ms} ms` : '—'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <Kpi label="Requests (30 Tage)" value={data.usage_30d.requests} />
            <Kpi label="Fehler (30 Tage)" value={data.usage_30d.errors} />
            <Kpi label="Tokens (30 Tage)" value={data.usage_30d.total_tokens} />
            <Kpi label="Kosten (30 Tage)" value={data.usage_30d.cost_usd !== null ? `$${data.usage_30d.cost_usd.toFixed(4)}` : '—'} hint={data.usage_30d.cost_note ?? undefined} />
          </div>
        </>
      )}
    </div>
  );
}
