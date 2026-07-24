'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../_lib/AdminContext';
import { Badge, Card, ErrorText, Loading, Note, SectionTitle } from '../../_lib/AdminUI';

type Task = { label: string; value: number | null; note: string | null };
type Recommendation = { text: string; reason: string };
type Priority = { label: string; priority: 'hoch' | 'mittel' | 'niedrig' };
type TopProduct = { product_id: string; title: string; revenue: number };

type Briefing = {
  generated_at: string;
  business: {
    revenue_today: number | null; revenue_today_note: string;
    revenue_yesterday: number | null; revenue_yesterday_note: string;
    revenue_month: number | null; revenue_month_note: string;
    premium_sales: number | null; premium_sales_note: string;
    affiliate_revenue_today: number | null;
  };
  users: {
    new_today: number | null; active_today: number | null;
    new_premium: number | null; new_premium_note: string;
    cancellations: number | null; cancellations_note: string;
  };
  ai: {
    requests_today: number | null;
    cost: number | null; cost_note: string;
    errors: number | null; errors_note: string;
    slow_responses: number | null; slow_responses_note: string;
  };
  affiliate: {
    new_products_today: number | null; pending_approval: number | null; broken_links: number | null;
    top_products: TopProduct[];
  };
  system: {
    server_status: string | null; server_status_note: string;
    database: string; api_status: string;
    build_status: string | null; build_status_note: string;
    backups: string | null; backups_note: string;
  };
  tasks: Task[];
  warnings: string[];
  recommendations: Recommendation[];
  priorities: Priority[];
};

const NO_DATA = 'Keine Daten vorhanden';

const QUICK_ACTIONS: { label: string; href: string }[] = [
  { label: 'Produkte prüfen', href: '/admin/affiliate' },
  { label: 'Affiliate öffnen', href: '/admin/affiliate' },
  { label: 'Dashboard öffnen', href: '/admin/founder' },
  { label: 'Support öffnen', href: '/admin/support' },
  { label: 'Blog öffnen', href: '/admin/content' },
  { label: 'Analytics öffnen', href: '/admin/analytics' },
];

function Field({ label, value, note, suffix }: { label: string; value: number | string | null; note?: string; suffix?: string }) {
  const { tokens } = useAdmin();
  const hasValue = value !== null && value !== undefined;
  return (
    <div style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
      <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>{label}</p>
      <p style={{ color: hasValue ? tokens.text : tokens.mutedMore, fontSize: '1.15rem', fontWeight: 700 }}>
        {hasValue ? `${value}${suffix || ''}` : NO_DATA}
      </p>
      {!hasValue && note && <p style={{ color: tokens.mutedMore, fontSize: '0.7rem', marginTop: '0.2rem' }}>{note}</p>}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  const { tokens } = useAdmin();
  return <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{children}</p>;
}

function priorityTone(priority: Priority['priority']): 'danger' | 'neutral' | 'success' {
  if (priority === 'hoch') return 'danger';
  if (priority === 'mittel') return 'neutral';
  return 'success';
}

export default function FounderDailyBriefingPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/founder/daily-briefing');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Daily Briefing konnte nicht geladen werden.');
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
        title="Founder Daily Briefing"
        subtitle="Automatisch bei jedem Aufruf aus echten Daten zusammengestellt — keine geplanten Jobs, keine E-Mails, keine KI-Freitextgenerierung."
      />

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && data && (
        <>
          <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1.25rem' }}>
            Erstellt: {new Date(data.generated_at).toLocaleString('de-DE')}
          </p>

          {/* Warnungen */}
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>Warnungen</CardTitle>
            {data.warnings.length === 0 && <Note>Keine wichtigen Warnungen.</Note>}
            {data.warnings.map((w, i) => (
              <p key={i} style={{ color: tokens.danger, fontSize: '0.85rem', padding: '0.3rem 0' }}>⚠️ {w}</p>
            ))}
          </Card>

          {/* CEO Prioritäten */}
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>CEO-Prioritäten</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {data.priorities.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: tokens.text, fontSize: '0.85rem' }}>{p.label}</span>
                  <Badge tone={priorityTone(p.priority)}>{p.priority}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* KI-Empfehlungen */}
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>KI-Empfehlungen (regelbasiert, kein Freitext-KI-Aufruf)</CardTitle>
            {data.recommendations.length === 0 && <Note>Aktuell keine Empfehlungen — keine auffälligen Veränderungen erkannt.</Note>}
            {data.recommendations.map((r, i) => (
              <div key={i} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
                <p style={{ color: tokens.text, fontSize: '0.85rem' }}>{r.text}</p>
                <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.15rem' }}>{r.reason}</p>
              </div>
            ))}
          </Card>

          {/* Quick Actions */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <CardTitle>Quick Actions</CardTitle>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  style={{
                    background: tokens.accent, color: '#0B1118', borderRadius: '0.6rem', padding: '0.5rem 1rem',
                    fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>

          {/* Datenkarten */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <Card>
              <CardTitle>1. Business</CardTitle>
              <Field label="Umsatz heute" value={data.business.revenue_today} note={data.business.revenue_today_note} />
              <Field label="Umsatz gestern" value={data.business.revenue_yesterday} note={data.business.revenue_yesterday_note} />
              <Field label="Umsatz Monat" value={data.business.revenue_month} note={data.business.revenue_month_note} />
              <Field label="Premium-Verkäufe" value={data.business.premium_sales} note={data.business.premium_sales_note} />
              <Field
                label="Affiliate-Einnahmen (heute)"
                value={data.business.affiliate_revenue_today !== null ? data.business.affiliate_revenue_today.toFixed(2) : null}
                suffix=" €"
              />
            </Card>

            <Card>
              <CardTitle>2. Nutzer</CardTitle>
              <Field label="Neue Nutzer (heute)" value={data.users.new_today} />
              <Field label="Aktive Nutzer (heute)" value={data.users.active_today} />
              <Field label="Neue Premium-Nutzer" value={data.users.new_premium} note={data.users.new_premium_note} />
              <Field label="Kündigungen" value={data.users.cancellations} note={data.users.cancellations_note} />
            </Card>

            <Card>
              <CardTitle>3. KI</CardTitle>
              <Field label="Requests (heute)" value={data.ai.requests_today} />
              <Field label="Kosten" value={data.ai.cost} note={data.ai.cost_note} />
              <Field label="Fehler" value={data.ai.errors} note={data.ai.errors_note} />
              <Field label="Langsame Antworten" value={data.ai.slow_responses} note={data.ai.slow_responses_note} />
            </Card>

            <Card>
              <CardTitle>4. Affiliate</CardTitle>
              <Field label="Neue Produkte (heute)" value={data.affiliate.new_products_today} />
              <Field label="Produkte zur Freigabe" value={data.affiliate.pending_approval} />
              <Field label="Defekte Links" value={data.affiliate.broken_links} />
              <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.5rem' }}>Beste Produkte</p>
              {data.affiliate.top_products.length === 0 && (
                <p style={{ color: tokens.mutedMore, fontSize: '0.8rem' }}>{NO_DATA}</p>
              )}
              {data.affiliate.top_products.map((p) => (
                <p key={p.product_id} style={{ color: tokens.text, fontSize: '0.8rem', padding: '0.15rem 0' }}>
                  {p.title} — {p.revenue.toFixed(2)} €
                </p>
              ))}
            </Card>

            <Card>
              <CardTitle>5. System</CardTitle>
              <div style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
                <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>Datenbank</p>
                <Badge tone={data.system.database === 'reachable' ? 'success' : 'danger'}>{data.system.database}</Badge>
              </div>
              <div style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
                <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>API</p>
                <Badge tone={data.system.api_status === 'online' ? 'success' : 'danger'}>{data.system.api_status}</Badge>
              </div>
              <Field label="Server-Status" value={data.system.server_status} note={data.system.server_status_note} />
              <Field label="Build-Status" value={data.system.build_status} note={data.system.build_status_note} />
              <Field label="Backups" value={data.system.backups} note={data.system.backups_note} />
            </Card>

            <Card>
              <CardTitle>6. Aufgaben</CardTitle>
              {data.tasks.map((task) => (
                <Field key={task.label} label={task.label} value={task.value} note={task.note || undefined} />
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
