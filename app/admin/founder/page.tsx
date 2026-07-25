'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

const NO_DATA = 'Keine Daten vorhanden';

type Tab = 'dashboard' | 'briefing' | 'tasks' | 'approvals';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'briefing', label: 'Daily Briefing' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'approvals', label: 'Approval Center' },
];

function CardTitle({ children }: { children: React.ReactNode }) {
  const { tokens } = useAdmin();
  return <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{children}</p>;
}

function Metric({ label, value, note, suffix }: { label: string; value: number | string | null; note?: string; suffix?: string }) {
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

function priorityTone(priority: 'kritisch' | 'hoch' | 'mittel' | 'niedrig'): 'danger' | 'neutral' | 'success' {
  if (priority === 'kritisch' || priority === 'hoch') return 'danger';
  if (priority === 'mittel') return 'neutral';
  return 'success';
}

export default function FounderOsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div>
      <SectionTitle
        title="Founder Operating System"
        subtitle="Dashboard, Daily Briefing, Task Manager und Approval Center an einem Ort — nur echte Daten, keine Platzhalter, keine Hintergrund-KI."
      />
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'primary' : 'secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'briefing' && <BriefingTab />}
      {tab === 'tasks' && <TasksTab />}
      {tab === 'approvals' && <ApprovalsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard (Release F1)
// ---------------------------------------------------------------------------

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

function DashboardTab() {
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

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!data) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
      <Card>
        <CardTitle>1. Nutzer</CardTitle>
        <Metric label="Gesamtzahl" value={data.users.total} />
        <Metric label="Neue Nutzer (7 Tage)" value={data.users.new_7d} />
        <Metric label="Aktive Nutzer (7 Tage)" value={data.users.active_7d} />
        <Metric label="Premium-Nutzer" value={data.users.premium} />
      </Card>

      <Card>
        <CardTitle>2. Umsatz</CardTitle>
        <Metric label="Stripe-Umsatz" value={data.revenue.stripe} note={data.revenue.stripe_note} />
        <Metric
          label="Affiliate-Umsatz"
          value={data.revenue.affiliate !== null ? data.revenue.affiliate.toFixed(2) : null}
          suffix=" €"
        />
        <Metric label="Premium-Umsatz" value={data.revenue.premium} note={data.revenue.premium_note} />
      </Card>

      <Card>
        <CardTitle>3. KI</CardTitle>
        <Metric label="Verwendetes Modell" value={data.ai.model} />
        <Metric label="Anzahl Requests" value={data.ai.requests_total} />
        <Metric label="Fehler" value={data.ai.errors} note={data.ai.errors_note} />
        <Metric label="Kosten" value={data.ai.cost} note={data.ai.cost_note} />
      </Card>

      <Card>
        <CardTitle>4. Affiliate</CardTitle>
        <Metric label="Aktive Produkte" value={data.affiliate.active_products} />
        <Metric label="Defekte Links" value={data.affiliate.broken_links} />
        <Metric label="Produkte zur Freigabe" value={data.affiliate.pending_approval} />
      </Card>

      <Card>
        <CardTitle>5. System</CardTitle>
        <div style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
          <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>Datenbank</p>
          <Badge tone={data.system.database === 'reachable' ? 'success' : 'danger'}>{data.system.database}</Badge>
        </div>
        <div style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
          <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>API</p>
          <Badge tone={data.system.api === 'online' ? 'success' : 'danger'}>{data.system.api}</Badge>
        </div>
        <Metric label="Server" value={data.system.server} note={data.system.server_note} />
        <Metric label="Build-Status" value={data.system.build_status} note={data.system.build_status_note} />
      </Card>

      <Card>
        <CardTitle>6. Aufgaben</CardTitle>
        <Metric label="Produkte prüfen" value={data.tasks.products_to_review} />
        <Metric label="Defekte Links" value={data.tasks.broken_links} />
        <Metric label="Offene Releases" value={data.tasks.open_releases} note={data.tasks.open_releases_note} />
        <Metric label="Offene Bugs" value={data.tasks.open_bugs} note={data.tasks.open_bugs_note} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Briefing (Release F2)
// ---------------------------------------------------------------------------

type BriefingTaskItem = { label: string; value: number | null; note: string | null };
type Recommendation = { text: string; reason: string };
type BriefingPriority = { label: string; priority: 'hoch' | 'mittel' | 'niedrig' };
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
  tasks: BriefingTaskItem[];
  warnings: string[];
  recommendations: Recommendation[];
  priorities: BriefingPriority[];
};

const QUICK_ACTIONS: { label: string; href: string }[] = [
  { label: 'Produkte prüfen', href: '/admin/affiliate' },
  { label: 'Affiliate öffnen', href: '/admin/affiliate' },
  { label: 'Support öffnen', href: '/admin/support' },
  { label: 'Blog öffnen', href: '/admin/content' },
  { label: 'Analytics öffnen', href: '/admin/analytics' },
];

function BriefingTab() {
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

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!data) return null;

  return (
    <>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1.25rem' }}>
        Erstellt: {new Date(data.generated_at).toLocaleString('de-DE')}
      </p>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Warnungen</CardTitle>
        {data.warnings.length === 0 && <Note>Keine wichtigen Warnungen.</Note>}
        {data.warnings.map((w, i) => (
          <p key={i} style={{ color: tokens.danger, fontSize: '0.85rem', padding: '0.3rem 0' }}>⚠️ {w}</p>
        ))}
      </Card>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <Card>
          <CardTitle>1. Business</CardTitle>
          <Metric label="Umsatz heute" value={data.business.revenue_today} note={data.business.revenue_today_note} />
          <Metric label="Umsatz gestern" value={data.business.revenue_yesterday} note={data.business.revenue_yesterday_note} />
          <Metric label="Umsatz Monat" value={data.business.revenue_month} note={data.business.revenue_month_note} />
          <Metric label="Premium-Verkäufe" value={data.business.premium_sales} note={data.business.premium_sales_note} />
          <Metric
            label="Affiliate-Einnahmen (heute)"
            value={data.business.affiliate_revenue_today !== null ? data.business.affiliate_revenue_today.toFixed(2) : null}
            suffix=" €"
          />
        </Card>

        <Card>
          <CardTitle>2. Nutzer</CardTitle>
          <Metric label="Neue Nutzer (heute)" value={data.users.new_today} />
          <Metric label="Aktive Nutzer (heute)" value={data.users.active_today} />
          <Metric label="Neue Premium-Nutzer" value={data.users.new_premium} note={data.users.new_premium_note} />
          <Metric label="Kündigungen" value={data.users.cancellations} note={data.users.cancellations_note} />
        </Card>

        <Card>
          <CardTitle>3. KI</CardTitle>
          <Metric label="Requests (heute)" value={data.ai.requests_today} />
          <Metric label="Kosten" value={data.ai.cost} note={data.ai.cost_note} />
          <Metric label="Fehler" value={data.ai.errors} note={data.ai.errors_note} />
          <Metric label="Langsame Antworten" value={data.ai.slow_responses} note={data.ai.slow_responses_note} />
        </Card>

        <Card>
          <CardTitle>4. Affiliate</CardTitle>
          <Metric label="Neue Produkte (heute)" value={data.affiliate.new_products_today} />
          <Metric label="Produkte zur Freigabe" value={data.affiliate.pending_approval} />
          <Metric label="Defekte Links" value={data.affiliate.broken_links} />
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
          <Metric label="Server-Status" value={data.system.server_status} note={data.system.server_status_note} />
          <Metric label="Build-Status" value={data.system.build_status} note={data.system.build_status_note} />
          <Metric label="Backups" value={data.system.backups} note={data.system.backups_note} />
        </Card>

        <Card>
          <CardTitle>6. Aufgaben</CardTitle>
          {data.tasks.map((task) => (
            <Metric key={task.label} label={task.label} value={task.value} note={task.note || undefined} />
          ))}
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Task Manager (Release F3)
// ---------------------------------------------------------------------------

type TaskStatus = 'neu' | 'in_bearbeitung' | 'warten' | 'erledigt' | 'archiviert';
type TaskPriority = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';

type FounderTask = {
  id: string;
  title: string;
  category: string;
  source: string;
  priority: TaskPriority;
  status: TaskStatus;
  reason: string;
  data_used: string;
  impact_if_ignored: string;
  suggested_action: string | null;
  suggested_action_available: boolean;
  auto_detected: boolean;
  auto_resolved: boolean;
  ignored: boolean;
  remind_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

type TaskSummary = {
  open_tasks: number;
  critical_tasks: number;
  done_today: number;
  auto_detected: number;
  auto_resolved: number;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  neu: 'Neu',
  in_bearbeitung: 'In Bearbeitung',
  warten: 'Warten',
  erledigt: 'Erledigt',
  archiviert: 'Archiviert',
};

const OPEN_STATUSES: TaskStatus[] = ['neu', 'in_bearbeitung', 'warten'];

const SOURCE_LINKS: Record<string, string> = {
  affiliate: '/admin/affiliate',
  premium: '/admin/business',
  stripe: '/admin/business',
  ki: '/admin/ai',
  support: '/admin/support',
  sicherheit: '/admin/security',
  analytics: '/admin/analytics',
  blog: '/admin/content',
};

function TasksTab() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_founder_os');
  const [tasks, setTasks] = useState<FounderTask[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<'offen' | TaskStatus>('offen');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/founder/tasks');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Aufgaben konnten nicht geladen werden.');
          return;
        }
        const json = await response.json();
        if (!cancelled) {
          setTasks(Array.isArray(json.items) ? json.items : []);
          setSummary(json.summary);
        }
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

  const reload = async () => {
    const response = await authFetch('/api/admin/founder/tasks');
    if (response.ok) {
      const json = await response.json();
      setTasks(Array.isArray(json.items) ? json.items : []);
      setSummary(json.summary);
    }
  };

  const runAction = async (id: string, action: () => Promise<Response>) => {
    setBusyId(id);
    try {
      await action();
      await reload();
    } finally {
      setBusyId('');
    }
  };

  const markDone = (id: string) =>
    runAction(id, () =>
      authFetch(`/api/admin/founder/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'erledigt' }),
      }),
    );

  const remindLater = (id: string) => runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/remind`, { method: 'POST' }));

  const ignore = (id: string) => runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/ignore`, { method: 'POST' }));

  const applySuggestion = (id: string) =>
    runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/apply-suggestion`, { method: 'POST' }));

  const setInProgress = (id: string) =>
    runAction(id, () =>
      authFetch(`/api/admin/founder/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_bearbeitung' }),
      }),
    );

  const filteredTasks =
    statusFilter === 'offen' ? tasks.filter((t) => OPEN_STATUSES.includes(t.status)) : tasks.filter((t) => t.status === statusFilter);

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!summary) return null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Kpi label="Offene Aufgaben" value={summary.open_tasks} />
        <Kpi label="Kritische Aufgaben" value={summary.critical_tasks} />
        <Kpi label="Heute erledigt" value={summary.done_today} />
        <Kpi label="Automatisch erkannt" value={summary.auto_detected} />
        <Kpi label="Automatisch gelöst" value={summary.auto_resolved} />
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Button variant={statusFilter === 'offen' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('offen')}>
          Offen
        </Button>
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
          <Button key={s} variant={statusFilter === s ? 'primary' : 'secondary'} onClick={() => setStatusFilter(s)}>
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredTasks.length === 0 && <Note>Keine Aufgaben in dieser Ansicht.</Note>}
        {filteredTasks.map((task) => (
          <Card key={task.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem' }}>{task.title}</p>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                  <Badge tone="neutral">{task.category}</Badge>
                  <Badge tone="neutral">{STATUS_LABELS[task.status]}</Badge>
                  {task.auto_resolved && <Badge tone="success">automatisch gelöst</Badge>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                  Details
                </Button>
                {SOURCE_LINKS[task.source] && (
                  <a
                    href={SOURCE_LINKS[task.source]}
                    style={{ color: tokens.accent, fontSize: '0.85rem', alignSelf: 'center', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Öffnen →
                  </a>
                )}
                {canManage && OPEN_STATUSES.includes(task.status) && (
                  <>
                    {task.status === 'neu' && (
                      <Button variant="secondary" disabled={busyId === task.id} onClick={() => setInProgress(task.id)}>
                        In Bearbeitung
                      </Button>
                    )}
                    {task.suggested_action_available && (
                      <Button disabled={busyId === task.id} onClick={() => applySuggestion(task.id)}>
                        {task.suggested_action}
                      </Button>
                    )}
                    <Button variant="secondary" disabled={busyId === task.id} onClick={() => markDone(task.id)}>
                      Erledigt
                    </Button>
                    <Button variant="secondary" disabled={busyId === task.id} onClick={() => remindLater(task.id)}>
                      Später erinnern
                    </Button>
                    <Button variant="danger" disabled={busyId === task.id} onClick={() => ignore(task.id)}>
                      Ignorieren
                    </Button>
                  </>
                )}
              </div>
            </div>

            {expanded === task.id && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${tokens.border}` }}>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  <strong style={{ color: tokens.text }}>Warum erstellt:</strong> {task.reason}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Verwendete Daten:</strong> {task.data_used}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Auswirkung bei Nichtstun:</strong> {task.impact_if_ignored}
                </p>
                {!task.suggested_action_available && (
                  <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    Keine automatische Lösung verfügbar — muss manuell bearbeitet werden.
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Smart Approval Center (Founder OS — Submodul D)
// ---------------------------------------------------------------------------

type ApprovalStatus = 'neu' | 'ki_geprueft' | 'zur_pruefung' | 'freigegeben' | 'abgelehnt' | 'archiviert';
type ApprovalPriority = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';

type FounderApproval = {
  id: string;
  title: string;
  category: string;
  source: string;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  reason: string;
  data_used: string;
  rules_applied: string;
  benefits: string;
  risks: string;
  founder_comment: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
};

type ApprovalSummary = {
  total: number;
  open: number;
  critical_open: number;
  approved: number;
  rejected: number;
  by_category: Record<string, number>;
};

const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  neu: 'Neu',
  ki_geprueft: 'KI geprüft',
  zur_pruefung: 'Zur Prüfung',
  freigegeben: 'Freigegeben',
  abgelehnt: 'Abgelehnt',
  archiviert: 'Archiviert',
};

const APPROVAL_CATEGORIES = ['affiliate', 'business', 'ki', 'blog', 'seo', 'technik', 'support', 'releases', 'api', 'sicherheit'];

const OPEN_APPROVAL_STATUSES: ApprovalStatus[] = ['neu', 'ki_geprueft', 'zur_pruefung'];

function ApprovalsTab() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_founder_os');
  const [items, setItems] = useState<FounderApproval[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      const response = await authFetch(`/api/admin/founder/approvals?${params.toString()}`);
      if (!response.ok) {
        setErrorMessage('Vorschläge konnten nicht geladen werden.');
        return;
      }
      const json = await response.json();
      setItems(Array.isArray(json.items) ? json.items : []);
      setSummary(json.summary);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, priorityFilter, search]);

  const setStatus = async (id: string, status: ApprovalStatus) => {
    setBusyId(id);
    try {
      await authFetch(`/api/admin/founder/approvals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId('');
    }
  };

  const setPriority = async (id: string, priority: ApprovalPriority) => {
    await authFetch(`/api/admin/founder/approvals/${id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
    await load();
  };

  const saveComment = async (id: string, comment: string) => {
    await authFetch(`/api/admin/founder/approvals/${id}/comment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulk = async (status: 'freigegeben' | 'abgelehnt') => {
    if (selected.size === 0) return;
    await authFetch('/api/admin/founder/approvals/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    });
    setSelected(new Set());
    await load();
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;

  return (
    <div>
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Kpi label="Gesamt" value={summary.total} />
          <Kpi label="Offen" value={summary.open} />
          <Kpi label="Kritisch (offen)" value={summary.critical_open} />
          <Kpi label="Freigegeben" value={summary.approved} />
          <Kpi label="Abgelehnt" value={summary.rejected} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => setPriorityFilter(priorityFilter === 'kritisch' ? '' : 'kritisch')}>
          Nur kritische anzeigen
        </Button>
        <Button variant="secondary" onClick={() => setStatusFilter(statusFilter === 'ki_geprueft' ? '' : 'ki_geprueft')}>
          Nur neue anzeigen
        </Button>
        <Button variant="secondary" onClick={() => setCategoryFilter(categoryFilter === 'affiliate' ? '' : 'affiliate')}>
          Nur Affiliate anzeigen
        </Button>
        {canManage && (
          <>
            <Button onClick={() => bulk('freigegeben')}>Auswahl freigeben ({selected.size})</Button>
            <Button variant="danger" onClick={() => bulk('abgelehnt')}>Auswahl ablehnen ({selected.size})</Button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Suche (Titel, Kategorie, Priorität, Status, Datum)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 260px' }}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {APPROVAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Alle Status</option>
          {(Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[]).map((s) => (
            <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Alle Prioritäten</option>
          {(['kritisch', 'hoch', 'mittel', 'niedrig'] as ApprovalPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.length === 0 && <Note>Keine Vorschläge in dieser Ansicht.</Note>}
        {items.map((item) => (
          <Card key={item.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                {canManage && OPEN_APPROVAL_STATUSES.includes(item.status) && (
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    style={{ marginTop: '0.3rem' }}
                  />
                )}
                <div>
                  <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</p>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                    <Badge tone="neutral">{item.category}</Badge>
                    <Badge tone={item.status === 'freigegeben' ? 'success' : item.status === 'abgelehnt' ? 'danger' : 'neutral'}>
                      {APPROVAL_STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  Details
                </Button>
                {canManage && OPEN_APPROVAL_STATUSES.includes(item.status) && (
                  <>
                    <Button disabled={busyId === item.id} onClick={() => setStatus(item.id, 'freigegeben')}>
                      Freigeben
                    </Button>
                    <Button variant="danger" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'abgelehnt')}>
                      Ablehnen
                    </Button>
                    <Button variant="secondary" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'zur_pruefung')}>
                      Später prüfen
                    </Button>
                  </>
                )}
              </div>
            </div>

            {expanded === item.id && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${tokens.border}` }}>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  <strong style={{ color: tokens.text }}>Warum erstellt:</strong> {item.reason}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Verwendete Daten:</strong> {item.data_used}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Angewendete Regeln:</strong> {item.rules_applied}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Vorteile:</strong> {item.benefits}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <strong style={{ color: tokens.text }}>Risiken:</strong> {item.risks}
                </p>
                {canManage && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={item.priority}
                      onChange={(e) => setPriority(item.id, e.target.value as ApprovalPriority)}
                    >
                      {(['kritisch', 'hoch', 'mittel', 'niedrig'] as ApprovalPriority[]).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Kommentar..."
                      defaultValue={item.founder_comment || ''}
                      onBlur={(e) => saveComment(item.id, e.target.value)}
                      style={{ flex: '1 1 200px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
