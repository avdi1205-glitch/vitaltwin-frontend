'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type FounderDashboard = {
  users: { total: number | null; new_7d: number | null; active_7d: number | null; premium: number | null };
  revenue: { stripe: number | null; stripe_note: string; affiliate: number | null; premium: number | null; premium_note: string };
  ai: { model: string; requests_total: number | null; errors: number | null; errors_note: string; cost: number | null; cost_note: string };
  affiliate: { active_products: number | null; broken_links: number | null; pending_approval: number | null };
  system: {
    database: string; api: string;
    server: string | null; server_note: string;
    build_status: string | null; build_status_note: string;
  };
  tasks: {
    products_to_review: number | null; broken_links: number | null;
    open_releases: number | null; open_releases_note: string;
    open_bugs: number | null; open_bugs_note: string;
  };
};

const NO_DATA = 'Keine Daten vorhanden';

function Stat({ label, value, note }: { label: string; value: number | string | null; note?: string }) {
  const { tokens } = useAdmin();
  const hasValue = value !== null && value !== undefined;
  return (
    <div style={{ padding: '0.6rem 0', borderBottom: `1px solid ${tokens.border}` }}>
      <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>{label}</p>
      <p style={{ color: hasValue ? tokens.text : tokens.mutedMore, fontSize: '1.3rem', fontWeight: 700 }}>
        {hasValue ? value : NO_DATA}
      </p>
      {!hasValue && note && <p style={{ color: tokens.mutedMore, fontSize: '0.7rem', marginTop: '0.2rem' }}>{note}</p>}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  const { tokens } = useAdmin();
  return <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{children}</p>;
}

export default function FounderDashboardPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<FounderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/founder/dashboard');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Founder Dashboard konnte nicht geladen werden.');
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
      <SectionTitle
        title="Founder Dashboard"
        subtitle="Erstes Modul des Founder Operating Systems — nur echte Daten, keine Platzhalter. Keine Automatisierung, keine KI, keine Reports."
      />

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <Card>
            <CardTitle>1. Nutzer</CardTitle>
            <Stat label="Gesamtzahl" value={data.users.total} />
            <Stat label="Neue Nutzer (7 Tage)" value={data.users.new_7d} />
            <Stat label="Aktive Nutzer (7 Tage)" value={data.users.active_7d} />
            <Stat label="Premium-Nutzer" value={data.users.premium} />
          </Card>

          <Card>
            <CardTitle>2. Umsatz</CardTitle>
            <Stat label="Stripe-Umsatz" value={data.revenue.stripe} note={data.revenue.stripe_note} />
            <Stat
              label="Affiliate-Umsatz"
              value={data.revenue.affiliate !== null ? `${data.revenue.affiliate.toFixed(2)} €` : null}
            />
            <Stat label="Premium-Umsatz" value={data.revenue.premium} note={data.revenue.premium_note} />
          </Card>

          <Card>
            <CardTitle>3. KI</CardTitle>
            <Stat label="Verwendetes Modell" value={data.ai.model} />
            <Stat label="Anzahl Requests" value={data.ai.requests_total} />
            <Stat label="Fehler" value={data.ai.errors} note={data.ai.errors_note} />
            <Stat label="Kosten" value={data.ai.cost} note={data.ai.cost_note} />
          </Card>

          <Card>
            <CardTitle>4. Affiliate</CardTitle>
            <Stat label="Aktive Produkte" value={data.affiliate.active_products} />
            <Stat label="Defekte Links" value={data.affiliate.broken_links} />
            <Stat label="Produkte zur Freigabe" value={data.affiliate.pending_approval} />
          </Card>

          <Card>
            <CardTitle>5. System</CardTitle>
            <div style={{ padding: '0.6rem 0', borderBottom: `1px solid ${tokens.border}` }}>
              <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Datenbank</p>
              <Badge tone={data.system.database === 'reachable' ? 'success' : 'danger'}>{data.system.database}</Badge>
            </div>
            <div style={{ padding: '0.6rem 0', borderBottom: `1px solid ${tokens.border}` }}>
              <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>API</p>
              <Badge tone={data.system.api === 'online' ? 'success' : 'danger'}>{data.system.api}</Badge>
            </div>
            <Stat label="Server" value={data.system.server} note={data.system.server_note} />
            <Stat label="Build-Status" value={data.system.build_status} note={data.system.build_status_note} />
          </Card>

          <Card>
            <CardTitle>6. Aufgaben</CardTitle>
            <Stat label="Produkte prüfen" value={data.tasks.products_to_review} />
            <Stat label="Defekte Links" value={data.tasks.broken_links} />
            <Stat label="Offene Releases" value={data.tasks.open_releases} note={data.tasks.open_releases_note} />
            <Stat label="Offene Bugs" value={data.tasks.open_bugs} note={data.tasks.open_bugs_note} />
          </Card>
        </div>
      )}
    </div>
  );
}
