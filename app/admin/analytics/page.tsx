'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type GrowthData = {
  total_users: number;
  premium_users: number;
  premium_conversion_rate: number | null;
  registrations_by_day: Record<string, number>;
  dau_today: number;
  mau_30d: number;
  activation_rate_24h: number | null;
  median_time_to_value_hours: number | null;
  week1_retention_rate: number | null;
  week4_retention_rate: number | null;
  two_plus_calculations_30d_rate: number | null;
  week1_retention_cohort_size: number;
  week4_retention_cohort_size: number;
  two_plus_calculations_cohort_size: number;
  retention_note: string;
  session_duration_note: string;
  feature_usage_note: string;
};

function formatRate(value: number | null): string {
  return value !== null ? `${(value * 100).toFixed(1)}%` : '— (Kohorte noch zu jung)';
}

export default function AdminAnalyticsPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<GrowthData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/analytics/growth');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Analytics-Daten konnten nicht geladen werden.');
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

  const recentDays = data ? Object.entries(data.registrations_by_day).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14) : [];

  return (
    <div>
      <SectionTitle title="Analytics" subtitle="Wachstum, Aktivität und Conversion — aus echten Bestandsdaten berechnet." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Kpi label="Nutzer gesamt" value={data.total_users} />
            <Kpi label="Premium-Nutzer" value={data.premium_users} />
            <Kpi
              label="Premium-Conversion"
              value={data.premium_conversion_rate !== null ? `${(data.premium_conversion_rate * 100).toFixed(1)}%` : '—'}
            />
            <Kpi label="Aktive Nutzer heute (DAU)" value={data.dau_today} />
            <Kpi label="Aktive Nutzer 30 Tage (MAU)" value={data.mau_30d} />
          </div>

          <Card style={{ marginTop: '1rem' }}>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>
              Roadmap-KPIs (Master-Roadmap 90 Tage)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <Kpi label="Activation Rate (Ziel ≥ 55%)" value={formatRate(data.activation_rate_24h)} />
              <Kpi
                label="Time to Value (Ziel ≤ 8 Min)"
                value={data.median_time_to_value_hours !== null ? `${(data.median_time_to_value_hours * 60).toFixed(0)} Min` : '—'}
              />
              <Kpi
                label={`Week-1 Retention (Ziel ≥ 35%, n=${data.week1_retention_cohort_size})`}
                value={formatRate(data.week1_retention_rate)}
              />
              <Kpi
                label={`Week-4 Retention (Ziel ≥ 20%, n=${data.week4_retention_cohort_size})`}
                value={formatRate(data.week4_retention_rate)}
              />
              <Kpi
                label={`2+ Berechnungen/30 Tage (Ziel ≥ 40%, n=${data.two_plus_calculations_cohort_size})`}
                value={formatRate(data.two_plus_calculations_30d_rate)}
              />
            </div>
          </Card>

          <Card style={{ marginTop: '1rem' }}>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Registrierungen (letzte Tage)</p>
            {recentDays.length === 0 && <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Registrierungen erfasst.</p>}
            {recentDays.map(([day, count]) => (
              <p key={day} style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                {day}: {count}
              </p>
            ))}
          </Card>

          <Note>{data.retention_note}</Note>
          <Note>{data.session_duration_note}</Note>
          <Note>{data.feature_usage_note}</Note>
        </>
      )}
    </div>
  );
}
