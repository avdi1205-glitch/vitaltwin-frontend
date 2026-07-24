'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from './_lib/AdminContext';
import { Card, ErrorText, Kpi, Loading, Note, SectionTitle } from './_lib/AdminUI';

type DashboardData = {
  user_count: number | null;
  premium_users: number | null;
  suspended_users: number | null;
  registrations_7d: number | null;
  registrations_30d: number | null;
  active_users_7d: number | null;
  ai_requests_today: number | null;
  open_feedback_count: number | null;
  stripe_configured: boolean;
  openai_configured: boolean;
  supabase_reachable: boolean;
  revenue_note: string;
  error_tracking_note: string;
};

export default function AdminDashboardPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/dashboard');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Dashboard-Daten konnten nicht geladen werden.');
          return;
        }
        const json = await response.json();
        if (!cancelled) setData(json);
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
      <SectionTitle title="Admin Dashboard" subtitle="Echtzeit-Kennzahlen aus der bestehenden VitalTwin-Datenbank." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Kpi label="Nutzer gesamt" value={data.user_count} />
            <Kpi label="Premium-Nutzer" value={data.premium_users} />
            <Kpi label="Gesperrte Konten" value={data.suspended_users} />
            <Kpi label="Registrierungen (7 Tage)" value={data.registrations_7d} />
            <Kpi label="Registrierungen (30 Tage)" value={data.registrations_30d} />
            <Kpi label="Aktive Nutzer (7 Tage)" value={data.active_users_7d} hint="Nutzer mit mind. einem Check-in" />
            <Kpi label="KI-Anfragen heute" value={data.ai_requests_today} />
            <Kpi label="Offenes Feedback" value={data.open_feedback_count} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <Card>
              <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.9rem' }}>Systemstatus</p>
              <p style={{ color: tokens.muted, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Supabase: {data.supabase_reachable ? '✅ erreichbar' : '❌ nicht erreichbar'}
              </p>
              <p style={{ color: tokens.muted, fontSize: '0.85rem' }}>
                OpenAI konfiguriert: {data.openai_configured ? '✅ ja' : '❌ nein'}
              </p>
              <p style={{ color: tokens.muted, fontSize: '0.85rem' }}>
                Stripe konfiguriert: {data.stripe_configured ? '✅ ja' : '❌ nein'}
              </p>
            </Card>
          </div>
          <Note>{data.revenue_note}</Note>
          <Note>{data.error_tracking_note}</Note>
        </>
      )}
    </div>
  );
}
