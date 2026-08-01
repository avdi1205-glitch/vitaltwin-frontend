'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type BusinessOverview = {
  premium_users: number | null;
  stripe_configured: boolean;
  configured_plan_prices: Record<string, boolean>;
  pro_family_note: string;
  revenue_today: number | null;
  revenue_month: number | null;
  revenue_note: string;
  active_subscriptions: number | null;
  canceled_subscriptions: number | null;
  subscriptions_note: string;
  refunds_count_30d: number | null;
  refunds_total_30d: number | null;
  refunds_note: string;
  affiliate_note: string;
  coupons_note: string;
};

export default function AdminBusinessPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<BusinessOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/business/overview');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Business-Daten konnten nicht geladen werden.');
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
      <SectionTitle title="Business Center" subtitle="Abo-Status und Stripe-Konfiguration." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Kpi label="Premium-Nutzer" value={data.premium_users} />
            <Kpi label="Stripe konfiguriert" value={data.stripe_configured ? 'Ja' : 'Nein'} />
            <Kpi label="Umsatz heute" value={data.revenue_today !== null ? `${data.revenue_today.toFixed(2)} €` : '—'} hint={data.revenue_today === null ? data.revenue_note : undefined} />
            <Kpi label="Umsatz (Monat)" value={data.revenue_month !== null ? `${data.revenue_month.toFixed(2)} €` : '—'} hint={data.revenue_month === null ? data.revenue_note : undefined} />
            <Kpi label="Aktive Abonnements" value={data.active_subscriptions} hint={data.active_subscriptions === null ? data.subscriptions_note : undefined} />
            <Kpi label="Kündigungen gesamt" value={data.canceled_subscriptions} hint={data.canceled_subscriptions === null ? data.subscriptions_note : undefined} />
            <Kpi label="Rückerstattungen (30 Tage)" value={data.refunds_count_30d} hint={data.refunds_note} />
            <Kpi label="Rückerstattungssumme (30 Tage)" value={data.refunds_total_30d !== null ? `${data.refunds_total_30d.toFixed(2)} €` : '—'} />
          </div>

          <Card style={{ marginTop: '1rem' }}>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Konfigurierte Preise</p>
            {Object.entries(data.configured_plan_prices).map(([key, configured]) => (
              <p key={key} style={{ color: tokens.muted, fontSize: '0.85rem' }}>
                {key}: {configured ? '✅ konfiguriert' : '❌ nicht konfiguriert'}
              </p>
            ))}
          </Card>

          <Note>{data.pro_family_note}</Note>
          <Note>{data.revenue_note}</Note>
          <Note>{data.affiliate_note}</Note>
          <Note>{data.coupons_note}</Note>
        </>
      )}
    </div>
  );
}
