'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type BusinessOverview = {
  premium_users: number | null;
  stripe_configured: boolean;
  configured_plan_prices: Record<string, boolean>;
  pro_family_note: string;
  revenue_note: string;
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
