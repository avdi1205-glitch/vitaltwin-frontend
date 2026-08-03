'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

const NO_DATA = 'Keine Daten vorhanden';

type Tab = 'dashboard' | 'briefing' | 'tasks' | 'approvals' | 'coach' | 'affiliate_intelligence' | 'automation' | 'ceo_intelligence' | 'documentation' | 'autopilot';

const TABS: { key: Tab; label: string; permission?: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'briefing', label: 'Daily Briefing' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'approvals', label: 'Approval Center' },
  { key: 'coach', label: 'AI Business Coach' },
  { key: 'affiliate_intelligence', label: 'Affiliate Intelligence' },
  { key: 'automation', label: 'Automation Engine', permission: 'view_automation_engine' },
  { key: 'ceo_intelligence', label: 'CEO Intelligence', permission: 'view_ceo_intelligence' },
  { key: 'documentation', label: 'Auto Documentation', permission: 'view_documentation' },
  { key: 'autopilot', label: 'Founder Autopilot', permission: 'view_founder_autopilot' },
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
  const { hasPermission } = useAdmin();
  const visibleTabs = TABS.filter((t) => !t.permission || hasPermission(t.permission));

  return (
    <div>
      <SectionTitle
        title="Founder Operating System"
        subtitle="Dashboard, Daily Briefing, Task Manager, Approval Center, AI Business Coach, Affiliate Intelligence und Automation Engine an einem Ort — nur echte Daten, keine Platzhalter, keine Hintergrund-KI."
      />
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {visibleTabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'primary' : 'secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab onSelectTab={setTab} />}
      {tab === 'briefing' && <BriefingTab />}
      {tab === 'tasks' && <TasksTab />}
      {tab === 'approvals' && <ApprovalsTab />}
      {tab === 'coach' && <BusinessCoachTab />}
      {tab === 'affiliate_intelligence' && <AffiliateIntelligenceTab />}
      {tab === 'automation' && <AutomationEngineTab />}
      {tab === 'ceo_intelligence' && <CeoIntelligenceTab />}
      {tab === 'documentation' && <AutoDocumentationTab />}
      {tab === 'autopilot' && <FounderAutopilotTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — kompakte Founder-Zusammenfassung (bewusst KEINE Duplikate der
// Kennzahlen aus /admin — dafür gibt es das zentrale Admin Dashboard).
// ---------------------------------------------------------------------------

type ApprovalsSummaryData = {
  summary: { total: number; open: number; critical_open: number; approved: number; rejected: number };
};

type RecommendationItem = {
  id: string;
  title: string;
  reasoning: string;
  priority: 'kritisch' | 'hoch' | 'mittel' | 'niedrig';
  status: string;
};

type AutomationDashboardData = {
  active_rules: { value: number };
  runs_today: { value: number };
  failed_today: { value: number };
  awaiting_approval: { value: number };
};

function DashboardTab({ onSelectTab }: { onSelectTab: (tab: Tab) => void }) {
  const { authFetch, hasPermission, tokens } = useAdmin();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [approvals, setApprovals] = useState<ApprovalsSummaryData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [automation, setAutomation] = useState<AutomationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchJson<T>(path: string): Promise<T | null> {
      try {
        const response = await authFetch(path);
        if (!response.ok) return null;
        return (await response.json()) as T;
      } catch {
        return null;
      }
    }

    (async () => {
      const [briefingData, approvalsData, recommendationsData, automationData] = await Promise.all([
        fetchJson<Briefing>('/api/admin/founder/daily-briefing'),
        fetchJson<ApprovalsSummaryData>('/api/admin/founder/approvals'),
        fetchJson<{ items: RecommendationItem[] }>('/api/admin/founder/business-coach/recommendations'),
        hasPermission('view_automation_engine')
          ? fetchJson<AutomationDashboardData>('/api/admin/founder/automation/dashboard')
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setBriefing(briefingData);
      setApprovals(approvalsData);
      setRecommendations(recommendationsData?.items ?? null);
      setAutomation(automationData);
      if (!briefingData) setErrorMessage('Founder-Zusammenfassung konnte nicht geladen werden.');
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;
  if (errorMessage && !briefing) return <ErrorText>{errorMessage}</ErrorText>;

  const openRecommendations = (recommendations ?? []).filter((r) => r.status === 'offen').slice(0, 3);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <Card>
        <CardTitle>Wichtigste heutige Kennzahlen</CardTitle>
        <Metric label="Neue Nutzer heute" value={briefing?.users.new_today ?? null} />
        <Metric label="Aktive Nutzer heute" value={briefing?.users.active_today ?? null} />
        <Metric label="KI-Anfragen heute" value={briefing?.ai.requests_today ?? null} />
        <Metric
          label="Affiliate-Umsatz heute"
          value={briefing?.business.affiliate_revenue_today != null ? briefing.business.affiliate_revenue_today.toFixed(2) : null}
          suffix=" €"
        />
      </Card>

      <Card>
        <CardTitle>Kritische Warnungen</CardTitle>
        {briefing && briefing.warnings.length > 0 ? (
          briefing.warnings.map((w, i) => (
            <p key={i} style={{ color: tokens.text, fontSize: '0.85rem', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
              ⚠️ {w}
            </p>
          ))
        ) : (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine kritischen Warnungen.</p>
        )}
      </Card>

      <Card>
        <CardTitle>Offene Entscheidungen & Freigaben</CardTitle>
        <Metric label="Offene Freigaben" value={approvals?.summary.open ?? null} />
        <Metric label="Davon kritisch" value={approvals?.summary.critical_open ?? null} />
        <Button variant="secondary" onClick={() => onSelectTab('approvals')}>Approval Center öffnen</Button>
      </Card>

      <Card>
        <CardTitle>Wichtigste Aufgaben</CardTitle>
        {briefing && briefing.tasks.length > 0 ? (
          briefing.tasks.slice(0, 5).map((t, i) => (
            <Metric key={i} label={t.label} value={t.value} note={t.note ?? undefined} />
          ))
        ) : (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine offenen Aufgaben erfasst.</p>
        )}
      </Card>

      <Card>
        <CardTitle>Automatisierungsstatus</CardTitle>
        {hasPermission('view_automation_engine') ? (
          automation ? (
            <>
              <Metric label="Aktive Regeln" value={automation.active_rules.value} />
              <Metric label="Läufe heute" value={automation.runs_today.value} />
              <Metric label="Fehlgeschlagen heute" value={automation.failed_today.value} />
              <Metric label="Warten auf Freigabe" value={automation.awaiting_approval.value} />
            </>
          ) : (
            <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Nicht verfügbar.</p>
          )
        ) : (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Berechtigung (view_automation_engine erforderlich).</p>
        )}
      </Card>

      <Card>
        <CardTitle>Empfehlungen des AI Business Coach</CardTitle>
        {openRecommendations.length > 0 ? (
          openRecommendations.map((r) => (
            <div key={r.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>{r.title}</p>
              </div>
              <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>{r.reasoning}</p>
            </div>
          ))
        ) : (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine offenen Empfehlungen.</p>
        )}
      </Card>

      <Card>
        <CardTitle>Nächste Gründeraktionen</CardTitle>
        {briefing && briefing.priorities.length > 0 ? (
          briefing.priorities.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0' }}>
              <Badge tone={priorityTone(p.priority as 'kritisch' | 'hoch' | 'mittel' | 'niedrig')}>{p.priority}</Badge>
              <p style={{ color: tokens.text, fontSize: '0.85rem' }}>{p.label}</p>
            </div>
          ))
        ) : (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Prioritäten erfasst.</p>
        )}
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

// ---------------------------------------------------------------------------
// AI Business Coach (Founder OS — Submodul E)
// ---------------------------------------------------------------------------

type CoachKpi = { value: number | string | null; note: string | null; source: string };
type CoachDashboard = {
  computed_at: string;
  revenue_today: CoachKpi; revenue_month: CoachKpi; mrr: CoachKpi;
  new_premium_subscriptions: CoachKpi; cancellations: CoachKpi;
  affiliate_revenue_today: CoachKpi; ai_cost: CoachKpi; infra_cost: CoachKpi;
  conversion_rate: CoachKpi; open_risks: CoachKpi; open_opportunities: CoachKpi;
  open_founder_decisions: CoachKpi;
};

type BusinessInsight = {
  id: string; title: string; category: string; description: string; severity: string; confidence: string;
  status: string; possible_cause: string | null; possible_impact: string | null; recommended_action: string | null;
};

type BusinessGoal = {
  id: string; title: string; category: string; target_value: number; current_progress: number | null;
  progress_note: string | null; status: string; data_source: string;
  explanation: { on_track: boolean | null; at_risk: boolean | null; next_action: string };
};

type BusinessRecommendation = {
  id: string; title: string; reasoning: string; priority: string; status: string; expected_benefit: string | null; risk: string | null;
};

function CoachKpiCard({ label, kpi }: { label: string; kpi: CoachKpi }) {
  const { tokens } = useAdmin();
  const hasValue = kpi.value !== null && kpi.value !== undefined;
  return (
    <Card>
      <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>{label}</p>
      <p style={{ color: hasValue ? tokens.text : tokens.mutedMore, fontSize: '1.2rem', fontWeight: 700, marginTop: '0.2rem' }}>
        {hasValue ? kpi.value : 'Noch nicht verbunden'}
      </p>
      <p style={{ color: tokens.mutedMore, fontSize: '0.7rem', marginTop: '0.3rem' }}>Quelle: {kpi.source}</p>
      {!hasValue && kpi.note && <p style={{ color: tokens.mutedMore, fontSize: '0.7rem', marginTop: '0.15rem' }}>{kpi.note}</p>}
    </Card>
  );
}

function BusinessCoachTab() {
  const { authFetch, tokens } = useAdmin();
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null);
  const [opportunities, setOpportunities] = useState<BusinessInsight[]>([]);
  const [risks, setRisks] = useState<BusinessInsight[]>([]);
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [recommendations, setRecommendations] = useState<BusinessRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; insufficient: boolean } | null>(null);
  const [asking, setAsking] = useState(false);

  const [newGoal, setNewGoal] = useState({ title: '', category: 'premium_abos', target_value: '' });

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [dashRes, oppRes, riskRes, goalRes, recRes] = await Promise.all([
        authFetch('/api/admin/founder/business-coach/dashboard'),
        authFetch('/api/admin/founder/business-coach/opportunities'),
        authFetch('/api/admin/founder/business-coach/risks'),
        authFetch('/api/admin/founder/business-coach/goals'),
        authFetch('/api/admin/founder/business-coach/recommendations'),
      ]);
      if (!dashRes.ok) {
        setErrorMessage('Business Coach konnte nicht geladen werden.');
        return;
      }
      setDashboard(await dashRes.json());
      setOpportunities((await oppRes.json()).items || []);
      setRisks((await riskRes.json()).items || []);
      setGoals((await goalRes.json()).items || []);
      setRecommendations((await recRes.json()).items || []);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendInsightToTasks = async (id: string) => {
    await authFetch(`/api/admin/founder/business-coach/insights/${id}/send-to-tasks`, { method: 'POST' });
    await loadAll();
  };

  const createGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.target_value) return;
    await authFetch('/api/admin/founder/business-coach/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newGoal.title, category: newGoal.category, target_value: Number(newGoal.target_value) }),
    });
    setNewGoal({ title: '', category: 'premium_abos', target_value: '' });
    await loadAll();
  };

  const sendRecommendationToApproval = async (id: string) => {
    await authFetch(`/api/admin/founder/business-coach/recommendations/${id}/send-to-approval`, { method: 'POST' });
    await loadAll();
  };

  const askCoach = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const response = await authFetch('/api/admin/founder/business-coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setAnswer({ text: json?.detail || 'Der Business Coach ist gerade nicht erreichbar.', insufficient: false });
        return;
      }
      setAnswer({ text: json.answer, insufficient: json.insufficient_data });
    } catch {
      setAnswer({ text: 'Backend gerade nicht erreichbar.', insufficient: false });
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!dashboard) return null;

  return (
    <div>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1rem' }}>
        Aktualisiert: {new Date(dashboard.computed_at).toLocaleString('de-DE')} — regelbasierte Analyse, kein Freitext-KI-Aufruf
        außer bei &quot;Frag deinen Business Coach&quot; unten.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <CoachKpiCard label="Umsatz heute" kpi={dashboard.revenue_today} />
        <CoachKpiCard label="Umsatz Monat" kpi={dashboard.revenue_month} />
        <CoachKpiCard label="Wiederkehrender Monatsumsatz" kpi={dashboard.mrr} />
        <CoachKpiCard label="Neue Premium-Abos" kpi={dashboard.new_premium_subscriptions} />
        <CoachKpiCard label="Kündigungen" kpi={dashboard.cancellations} />
        <CoachKpiCard label="Affiliate-Umsatz (heute)" kpi={dashboard.affiliate_revenue_today} />
        <CoachKpiCard label="KI-Kosten" kpi={dashboard.ai_cost} />
        <CoachKpiCard label="Infrastrukturkosten" kpi={dashboard.infra_cost} />
        <CoachKpiCard label="Conversion-Rate" kpi={dashboard.conversion_rate} />
        <CoachKpiCard label="Offene Chancen" kpi={dashboard.open_opportunities} />
        <CoachKpiCard label="Offene Risiken" kpi={dashboard.open_risks} />
        <CoachKpiCard label="Offene Gründerentscheidungen" kpi={dashboard.open_founder_decisions} />
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Chancen</CardTitle>
        {opportunities.length === 0 && <Note>Aktuell keine erkannten Chancen — keine auffälligen positiven Veränderungen.</Note>}
        {opportunities.map((i) => (
          <div key={i.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>{i.title}</p>
            <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>{i.description}</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center' }}>
              <Badge tone="success">{i.confidence} Konfidenz</Badge>
              <Button variant="secondary" onClick={() => sendInsightToTasks(i.id)}>An Task Manager übergeben</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Risiken</CardTitle>
        {risks.length === 0 && <Note>Aktuell keine erkannten Risiken.</Note>}
        {risks.map((i) => (
          <div key={i.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>{i.title}</p>
            <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>{i.description}</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center' }}>
              <Badge tone={i.severity === 'hoch' || i.severity === 'kritisch' ? 'danger' : 'neutral'}>{i.severity}</Badge>
              <Button variant="secondary" onClick={() => sendInsightToTasks(i.id)}>An Task Manager übergeben</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Business Goals</CardTitle>
        {goals.length === 0 && <Note>Noch keine Ziele definiert.</Note>}
        {goals.map((g) => (
          <div key={g.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>{g.title}</p>
            <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Fortschritt: {g.current_progress !== null ? `${g.current_progress} / ${g.target_value}` : (g.progress_note || NO_DATA)}
            </p>
            <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.15rem' }}>{g.explanation.next_action}</p>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <input placeholder="Zieltitel" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
          <select value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}>
            {['premium_abos', 'aktive_nutzer', 'conversion_rate', 'affiliate_umsatz', 'veroeffentlichte_inhalte', 'monatsumsatz', 'kuendigungsrate', 'ki_kostenlimit', 'individuell'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input placeholder="Zielwert" value={newGoal.target_value} onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })} />
          <Button onClick={createGoal}>Ziel anlegen</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Empfehlungen</CardTitle>
        {recommendations.length === 0 && <Note>Noch keine Empfehlungen.</Note>}
        {recommendations.map((r) => (
          <div key={r.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>{r.title}</p>
            <p style={{ color: tokens.muted, fontSize: '0.78rem', marginTop: '0.2rem' }}>{r.reasoning}</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center' }}>
              <Badge tone="neutral">{r.status}</Badge>
              {r.status === 'offen' && (
                <Button variant="secondary" onClick={() => sendRecommendationToApproval(r.id)}>
                  An Approval Center übergeben
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle>Frag deinen Business Coach …</CardTitle>
        <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginBottom: '0.5rem' }}>
          Antworten beruhen ausschließlich auf echten, aggregierten Daten — nie auf individuellen Nutzerdaten.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="z. B. Welche Affiliate-Kategorie entwickelt sich am besten?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: '1 1 300px' }}
          />
          <Button disabled={asking} onClick={askCoach}>{asking ? 'Frage läuft...' : 'Fragen'}</Button>
        </div>
        {answer && (
          <p style={{ color: answer.insufficient ? tokens.mutedMore : tokens.text, fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {answer.text}
          </p>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Affiliate Intelligence (Founder OS — Submodul F)
// ---------------------------------------------------------------------------

type IntelKpi = { value: number | string | null; note?: string | null; source: string };
type IntelDashboard = { computed_at: string; [key: string]: IntelKpi | string };

type ProviderStatus = { id: string; name: string; configured: boolean; connection_tested: boolean; kind: string; note: string };
type ProductHealthItem = { product_id: string; title: string; status: string; reasons: string[] };
type DuplicateCandidate = { id: string; product_a_id: string; product_b_id: string; match_reason: string; status: string };
type ApprovalAssistantItem = { product_id: string; title: string; bucket: string; confidence: string; reasons: string[]; risks: string[] };
type SimulatedProduct = { product_id: string; title: string; category: string | null; status: string; score: number; explanation: string[]; disclosure: string };
type ExcludedProduct = { product_id: string; title: string; reason: string };

const HEALTH_TONE: Record<string, 'success' | 'neutral' | 'danger'> = {
  healthy: 'success', warning: 'neutral', critical: 'danger', paused: 'neutral', unknown: 'neutral',
};

function AffiliateIntelligenceTab() {
  const { authFetch, tokens } = useAdmin();
  const [dashboard, setDashboard] = useState<IntelDashboard | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [productHealth, setProductHealth] = useState<ProductHealthItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [assistantSummary, setAssistantSummary] = useState('');
  const [assistantItems, setAssistantItems] = useState<ApprovalAssistantItem[]>([]);
  const [automationScore, setAutomationScore] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [context, setContext] = useState('');
  const [simResult, setSimResult] = useState<{ matched_category: string | null; recommended: SimulatedProduct[]; excluded: ExcludedProduct[] } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [dashRes, provRes, healthRes, dupRes, assistRes, autoRes] = await Promise.all([
        authFetch('/api/admin/founder/affiliate-intelligence/dashboard'),
        authFetch('/api/admin/founder/affiliate-intelligence/providers'),
        authFetch('/api/admin/founder/affiliate-intelligence/product-health'),
        authFetch('/api/admin/founder/affiliate-intelligence/duplicates'),
        authFetch('/api/admin/founder/affiliate-intelligence/approval-assistant'),
        authFetch('/api/admin/founder/affiliate-intelligence/automation-score'),
      ]);
      if (!dashRes.ok) {
        setErrorMessage('Affiliate Intelligence konnte nicht geladen werden.');
        return;
      }
      setDashboard(await dashRes.json());
      setProviders((await provRes.json()).items || []);
      setProductHealth((await healthRes.json()).items || []);
      setDuplicates((await dupRes.json()).items || []);
      const assistant = await assistRes.json();
      setAssistantSummary(assistant.summary || '');
      setAssistantItems(assistant.items || []);
      setAutomationScore(await autoRes.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendBucketToApproval = async (bucket: string) => {
    const ids = assistantItems.filter((i) => i.bucket === bucket).map((i) => i.product_id);
    if (ids.length === 0) return;
    await authFetch('/api/admin/founder/affiliate-intelligence/approval-assistant/send-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: ids }),
    });
    await loadAll();
  };

  const resolveDuplicate = async (id: string, status: 'bestaetigtes_duplikat' | 'getrennt_bestaetigt') => {
    await authFetch(`/api/admin/founder/affiliate-intelligence/duplicates/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadAll();
  };

  const runSimulation = async () => {
    if (!context.trim()) return;
    setSimulating(true);
    try {
      const response = await authFetch('/api/admin/founder/affiliate-intelligence/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok) setSimResult(json);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!dashboard) return null;

  const bucketCounts: Record<string, number> = {};
  assistantItems.forEach((i) => { bucketCounts[i.bucket] = (bucketCounts[i.bucket] || 0) + 1; });

  return (
    <div>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1rem' }}>
        Aktualisiert: {new Date(dashboard.computed_at as string).toLocaleString('de-DE')} — regelbasiert, kein
        automatischer Hintergrundjob. Keine parallele Produktdatenbank — nutzt das bestehende Affiliate Center direkt.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(dashboard)
          .filter((entry): entry is [string, IntelKpi] => entry[0] !== 'computed_at')
          .map(([key, kpi]) => (
          <Card key={key}>
            <p style={{ color: tokens.muted, fontSize: '0.72rem' }}>{key.replace(/_/g, ' ')}</p>
            <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {kpi.value !== null && kpi.value !== undefined ? String(kpi.value) : NO_DATA}
            </p>
            <p style={{ color: tokens.mutedMore, fontSize: '0.68rem', marginTop: '0.2rem' }}>Quelle: {kpi.source}</p>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Partnerprogramme & Provider</CardTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {providers.map((p) => (
            <Badge key={p.id} tone={p.configured ? 'success' : 'neutral'}>{p.name}: {p.configured ? 'konfiguriert' : 'nicht konfiguriert'}</Badge>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Product Health</CardTitle>
        {productHealth.length === 0 && <Note>Keine Produkte vorhanden.</Note>}
        {productHealth.slice(0, 10).map((p) => (
          <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.85rem' }}>{p.title}</span>
            <Badge tone={HEALTH_TONE[p.status] || 'neutral'}>{p.status}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Mögliche Duplikate</CardTitle>
        {duplicates.filter((d) => d.status === 'moegliches_duplikat').length === 0 && <Note>Keine offenen Dubletten-Kandidaten.</Note>}
        {duplicates.filter((d) => d.status === 'moegliches_duplikat').map((d) => (
          <div key={d.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.82rem' }}>{d.match_reason}</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Button variant="secondary" onClick={() => resolveDuplicate(d.id, 'bestaetigtes_duplikat')}>Bestätigen</Button>
              <Button variant="secondary" onClick={() => resolveDuplicate(d.id, 'getrennt_bestaetigt')}>Kein Duplikat</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>AI Approval Assistant</CardTitle>
        <p style={{ color: tokens.text, fontSize: '0.85rem', marginBottom: '0.6rem' }}>{assistantSummary}</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {Object.entries(bucketCounts).map(([bucket, count]) => (
            <Badge key={bucket} tone="neutral">{bucket.replace(/_/g, ' ')}: {count}</Badge>
          ))}
        </div>
        {bucketCounts.sammelfreigabe > 0 && (
          <div style={{ marginTop: '0.6rem' }}>
            <Button onClick={() => sendBucketToApproval('sammelfreigabe')}>
              Geeignete gesammelt zur Freigabe senden ({bucketCounts.sammelfreigabe})
            </Button>
          </div>
        )}
      </Card>

      {automationScore && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Automatisierungsgrad</CardTitle>
          <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700 }}>
            {automationScore.automation_percentage !== null && automationScore.automation_percentage !== undefined
              ? `${automationScore.automation_percentage}%` : NO_DATA}
          </p>
          <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.3rem' }}>{String(automationScore.note)}</p>
        </Card>
      )}

      <Card>
        <CardTitle>Recommendation Simulator</CardTitle>
        <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginBottom: '0.5rem' }}>
          Neutraler Testkontext — keine echten Nutzerdaten.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input placeholder="z. B. besser schlafen" value={context} onChange={(e) => setContext(e.target.value)} style={{ flex: '1 1 250px' }} />
          <Button disabled={simulating} onClick={runSimulation}>{simulating ? 'Simuliere...' : 'Simulieren'}</Button>
        </div>
        {simResult && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>Erkannte Kategorie: {simResult.matched_category || 'keine'}</p>
            <p style={{ color: tokens.text, fontWeight: 600, fontSize: '0.85rem', marginTop: '0.5rem' }}>Empfohlen:</p>
            {simResult.recommended.length === 0 && <Note>Keine passenden Produkte gefunden.</Note>}
            {simResult.recommended.map((p) => (
              <p key={p.product_id} style={{ color: tokens.text, fontSize: '0.8rem', padding: '0.2rem 0' }}>
                {p.title} — Score {p.score.toFixed(2)} — <span style={{ color: tokens.mutedMore }}>{p.disclosure}</span>
              </p>
            ))}
            {simResult.excluded.length > 0 && (
              <>
                <p style={{ color: tokens.text, fontWeight: 600, fontSize: '0.85rem', marginTop: '0.6rem' }}>Ausgeschlossen:</p>
                {simResult.excluded.map((p) => (
                  <p key={p.product_id} style={{ color: tokens.mutedMore, fontSize: '0.78rem', padding: '0.15rem 0' }}>{p.title} — {p.reason}</p>
                ))}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Automation Engine (Founder OS — Submodul G)
// ---------------------------------------------------------------------------

type AutomationRule = {
  id: string; name: string; description: string; category: string; trigger_type: string;
  risk_level: string; approval_policy: string; environment: string; status: string; enabled: boolean;
  version: number; run_count: number; last_run_at: string | null; next_run_at: string | null;
  actions: { action_type: string; params?: Record<string, unknown> }[];
};
type AutomationRun = { id: string; rule_id: string; status: string; attempt: number; created_at: string; started_at: string | null; finished_at: string | null; error: string | null };
type AutomationOpportunity = { id: string; description: string; occurrences: number; category: string | null; status: string };
type AutomationAlert = { id: string; severity: string; title: string; message: string; status: string };
type RegistryAction = { action_type: string; label: string; risk_level: string; reversible: boolean; idempotent: boolean; note: string };

const RUN_STATUS_TONE: Record<string, 'success' | 'neutral' | 'danger'> = {
  erfolgreich: 'success', teilweise_erfolgreich: 'neutral', laeuft: 'neutral', wartend: 'neutral',
  wartet_auf_freigabe: 'neutral', fehlgeschlagen: 'danger', fehlgeschlagen_wird_wiederholt: 'danger',
  dead_letter: 'danger', zurueckgerollt: 'neutral', timeout: 'danger', abgebrochen: 'neutral',
};

function AutomationEngineTab() {
  const { authFetch, tokens } = useAdmin();
  const [dashboard, setDashboard] = useState<Record<string, { value: number | string | null; note?: string | null }> | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [registryActions, setRegistryActions] = useState<RegistryAction[]>([]);
  const [automationScore, setAutomationScore] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [dashRes, rulesRes, runsRes, oppRes, alertsRes, registryRes, scoreRes] = await Promise.all([
        authFetch('/api/admin/founder/automation/dashboard'),
        authFetch('/api/admin/founder/automation/rules'),
        authFetch('/api/admin/founder/automation/runs'),
        authFetch('/api/admin/founder/automation/opportunities'),
        authFetch('/api/admin/founder/automation/alerts?status=offen'),
        authFetch('/api/admin/founder/automation/registry'),
        authFetch('/api/admin/founder/automation/automation-score'),
      ]);
      if (!dashRes.ok) {
        setErrorMessage('Automation Engine konnte nicht geladen werden (fehlende Berechtigung oder Backend nicht erreichbar).');
        return;
      }
      setDashboard(await dashRes.json());
      setRules((await rulesRes.json()).items || []);
      setRuns((await runsRes.json()).items || []);
      setOpportunities((await oppRes.json()).items || []);
      setAlerts((await alertsRes.json()).items || []);
      setRegistryActions((await registryRes.json()).actions || []);
      setAutomationScore(await scoreRes.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runRuleNow = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      await authFetch(`/api/admin/founder/automation/rules/${ruleId}/run`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const dryRunRule = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      const response = await authFetch(`/api/admin/founder/automation/rules/${ruleId}/dry-run`, { method: 'POST' });
      const json = await response.json().catch(() => null);
      if (json) {
        window.alert(
          `Dry Run: würde ${json.would_run ? '' : 'NICHT '}ausgeführt werden.\n` +
          `Freigabe nötig: ${json.requires_approval ? 'Ja' : 'Nein'}\n` +
          `Mögliches Duplikat: ${json.possible_duplicate ? 'Ja' : 'Nein'}`
        );
      }
    } finally {
      setBusyId('');
    }
  };

  const activateRule = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      await authFetch(`/api/admin/founder/automation/rules/${ruleId}/activate`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const pauseRule = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      await authFetch(`/api/admin/founder/automation/rules/${ruleId}/pause`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const rollbackRun = async (runId: string) => {
    setBusyId(runId);
    try {
      await authFetch(`/api/admin/founder/automation/runs/${runId}/rollback`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const dismissOpportunity = async (id: string) => {
    setBusyId(id);
    try {
      await authFetch(`/api/admin/founder/automation/opportunities/${id}/dismiss`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const createRuleFromOpportunity = async (id: string) => {
    setBusyId(id);
    try {
      await authFetch(`/api/admin/founder/automation/opportunities/${id}/create-rule`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  const runDueNow = async () => {
    setBusyId('run-due');
    try {
      await authFetch('/api/admin/founder/automation/run-due', { method: 'POST' });
      await loadAll();
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!dashboard) return null;

  return (
    <div>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1rem' }}>
        Kein Hintergrund-Scheduler vorhanden — zeitgesteuerte Regeln werden beim Laden dieses Dashboards oder über
        &quot;Fällige Automationen jetzt ausführen&quot; ausgewertet. Kein Risk Level &quot;critical&quot; ist jemals ausführbar
        (Preisänderungen, Rechtstexte, Kontolöschung etc. sind bewusst nicht implementiert).
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <Button disabled={busyId === 'run-due'} onClick={runDueNow}>
          {busyId === 'run-due' ? 'Läuft...' : 'Fällige Automationen jetzt ausführen'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(dashboard).filter(([key]) => key !== 'computed_at').map(([key, kpi]) => (
          <Card key={key}>
            <p style={{ color: tokens.muted, fontSize: '0.72rem' }}>{key.replace(/_/g, ' ')}</p>
            <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {kpi.value !== null && kpi.value !== undefined ? String(kpi.value) : NO_DATA}
            </p>
          </Card>
        ))}
      </div>

      {automationScore && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Automation Score</CardTitle>
          <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700 }}>
            {automationScore.overall_percentage !== null && automationScore.overall_percentage !== undefined
              ? `${automationScore.overall_percentage}%` : NO_DATA}
          </p>
          <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.3rem' }}>{String(automationScore.note)}</p>
        </Card>
      )}

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Automatisierungsregeln</CardTitle>
        {rules.length === 0 && <Note>Noch keine Regeln erstellt.</Note>}
        {rules.map((rule) => (
          <div key={rule.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ color: tokens.text, fontWeight: 600, fontSize: '0.85rem' }}>{rule.name} (v{rule.version})</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <Badge tone={rule.risk_level === 'low' ? 'success' : 'neutral'}>{rule.risk_level}</Badge>
                <Badge tone={rule.status === 'aktiv' ? 'success' : 'neutral'}>{rule.status}</Badge>
              </div>
            </div>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.2rem' }}>
              {rule.category} — Trigger: {rule.trigger_type} — Läufe: {rule.run_count}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" disabled={busyId === rule.id} onClick={() => dryRunRule(rule.id)}>Dry Run</Button>
              {rule.status !== 'aktiv' && (
                <Button variant="secondary" disabled={busyId === rule.id} onClick={() => activateRule(rule.id)}>Aktivieren</Button>
              )}
              {rule.status === 'aktiv' && (
                <Button variant="secondary" disabled={busyId === rule.id} onClick={() => pauseRule(rule.id)}>Pausieren</Button>
              )}
              <Button variant="secondary" disabled={busyId === rule.id} onClick={() => runRuleNow(rule.id)}>Jetzt ausführen</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Letzte Läufe</CardTitle>
        {runs.length === 0 && <Note>Noch keine Läufe vorhanden.</Note>}
        {runs.slice(0, 15).map((run) => (
          <div key={run.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>{new Date(run.created_at).toLocaleString('de-DE')}</span>
            <Badge tone={RUN_STATUS_TONE[run.status] || 'neutral'}>{run.status}</Badge>
            {run.status === 'erfolgreich' && (
              <Button variant="secondary" disabled={busyId === run.id} onClick={() => rollbackRun(run.id)}>Rollback</Button>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Automatisierungschancen</CardTitle>
        {opportunities.filter((o) => o.status === 'neu').length === 0 && <Note>Keine wiederkehrenden manuellen Abläufe erkannt.</Note>}
        {opportunities.filter((o) => o.status === 'neu').map((o) => (
          <div key={o.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.82rem' }}>{o.description}</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Button variant="secondary" disabled={busyId === o.id} onClick={() => createRuleFromOpportunity(o.id)}>Regel-Entwurf erstellen</Button>
              <Button variant="secondary" disabled={busyId === o.id} onClick={() => dismissOpportunity(o.id)}>Verwerfen</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Founder Alerts</CardTitle>
        {alerts.length === 0 && <Note>Keine offenen Warnungen.</Note>}
        {alerts.map((a) => (
          <div key={a.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.text, fontWeight: 600, fontSize: '0.82rem' }}>{a.title}</span>
              <Badge tone={a.severity === 'hoch' || a.severity === 'kritisch' ? 'danger' : 'neutral'}>{a.severity}</Badge>
            </div>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.2rem' }}>{a.message}</p>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle>Safe Action Registry</CardTitle>
        <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginBottom: '0.5rem' }}>
          Nur diese Aktionen können jemals von einer Regel ausgeführt werden — kein Risk Level &quot;critical&quot; ist vorhanden.
        </p>
        {registryActions.map((a) => (
          <div key={a.action_type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.8rem' }}>{a.label}</span>
            <Badge tone={a.risk_level === 'low' ? 'success' : 'neutral'}>{a.risk_level}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CEO Intelligence (Founder OS — Submodul H)
// ---------------------------------------------------------------------------

type ExMetric = { value: unknown; source: string; note?: string | null; trend?: number | null; data_quality: string };
type ScorecardItem = { area: string; status: string; trend: number | null; current_value: number | null; target_value: number | null; risk_level: string; next_action: string };
type StrategicGoal = { id: string; title: string; category: string; target_value: number; current_progress: number | null; status: string; forecast?: { computable: boolean; statement: string | null; note: string } };
type ExecutiveRisk = { ref: string; title: string; category: string; severity: string; status: string; recommended_action: string | null; responsible_module: string };
type ExecutiveOpportunity = { ref: string; title: string; category: string; expected_benefit: string | null; status: string; responsible_module: string };
type ExecutiveSummaryData = {
  whats_going_well: string[]; whats_going_badly: string[]; whats_changed: string[];
  goals_at_risk: { title: string }[]; top_risks: ExecutiveRisk[]; top_opportunities: ExecutiveOpportunity[];
  open_founder_decisions: number; automation_percentage: number | null;
};

const SCORECARD_STATUS_TONE: Record<string, 'success' | 'neutral' | 'danger'> = {
  sehr_gut: 'success', im_plan: 'success', beobachten: 'neutral', gefaehrdet: 'danger', kritisch: 'danger', keine_daten: 'neutral',
};

function CeoIntelligenceTab() {
  const { authFetch, tokens } = useAdmin();
  const [overview, setOverview] = useState<Record<string, ExMetric> | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardItem[]>([]);
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [risks, setRisks] = useState<ExecutiveRisk[]>([]);
  const [opportunities, setOpportunities] = useState<ExecutiveOpportunity[]>([]);
  const [summary, setSummary] = useState<ExecutiveSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyRef, setBusyRef] = useState('');

  const [scenarioType, setScenarioType] = useState('premium_conversion_up');
  const [deltaPct, setDeltaPct] = useState('10');
  const [scenarioResult, setScenarioResult] = useState<Record<string, unknown> | null>(null);
  const [simulating, setSimulating] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; insufficient: boolean } | null>(null);
  const [asking, setAsking] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [ovRes, scRes, goalsRes, risksRes, oppRes, summaryRes] = await Promise.all([
        authFetch('/api/admin/founder/ceo-intelligence/overview'),
        authFetch('/api/admin/founder/ceo-intelligence/scorecard'),
        authFetch('/api/admin/founder/ceo-intelligence/goals'),
        authFetch('/api/admin/founder/ceo-intelligence/risks'),
        authFetch('/api/admin/founder/ceo-intelligence/opportunities'),
        authFetch('/api/admin/founder/ceo-intelligence/executive-summary?period=daily'),
      ]);
      if (!ovRes.ok) {
        setErrorMessage('CEO Intelligence konnte nicht geladen werden (fehlende Berechtigung oder Backend nicht erreichbar).');
        return;
      }
      setOverview(await ovRes.json());
      setScorecard((await scRes.json()).items || []);
      setGoals((await goalsRes.json()).items || []);
      setRisks((await risksRes.json()).items || []);
      setOpportunities((await oppRes.json()).items || []);
      setSummary(await summaryRes.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendRiskToTask = async (ref: string, title: string) => {
    setBusyRef(ref);
    try {
      await authFetch(`/api/admin/founder/ceo-intelligence/risks/${encodeURIComponent(ref)}/send-to-task`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, reason: 'Von CEO Intelligence gesendet.' }),
      });
      await loadAll();
    } finally {
      setBusyRef('');
    }
  };

  const closeRisk = async (ref: string) => {
    setBusyRef(ref);
    try {
      await authFetch(`/api/admin/founder/ceo-intelligence/risks/${encodeURIComponent(ref)}/close`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyRef('');
    }
  };

  const archiveOpportunity = async (ref: string) => {
    setBusyRef(ref);
    try {
      await authFetch(`/api/admin/founder/ceo-intelligence/opportunities/${encodeURIComponent(ref)}/archive`, { method: 'POST' });
      await loadAll();
    } finally {
      setBusyRef('');
    }
  };

  const runScenario = async () => {
    setSimulating(true);
    try {
      const response = await authFetch('/api/admin/founder/ceo-intelligence/scenarios/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: scenarioType, delta_pct: Number(deltaPct) }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok) setScenarioResult(json);
    } finally {
      setSimulating(false);
    }
  };

  const askCeo = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const response = await authFetch('/api/admin/founder/ceo-intelligence/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json) setAnswer({ text: json.answer, insufficient: json.insufficient_data });
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!overview) return null;

  return (
    <div>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1rem' }}>
        Aggregationsschicht über Dashboard, Daily Briefing, Task Manager, Approval Center, AI Business Coach,
        Affiliate Intelligence und Automation Engine — keine parallelen Datenquellen, keine erfundenen Werte.
      </p>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>CEO Overview</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          {Object.entries(overview).filter(([key]) => key !== 'computed_at').map(([key, m]) => (
            <div key={key}>
              <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>{key.replace(/_/g, ' ')}</p>
              <p style={{ color: tokens.text, fontSize: '1.05rem', fontWeight: 700 }}>
                {m.value !== null && m.value !== undefined ? String(m.value) : NO_DATA}
              </p>
              <p style={{ color: tokens.mutedMore, fontSize: '0.65rem' }}>{m.note || `Quelle: ${m.source}`}</p>
            </div>
          ))}
        </div>
      </Card>

      {summary && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Executive Summary (täglich)</CardTitle>
          <p style={{ color: tokens.text, fontSize: '0.82rem', fontWeight: 600 }}>Läuft gut:</p>
          {summary.whats_going_well.map((s, i) => <p key={i} style={{ color: tokens.mutedMore, fontSize: '0.78rem' }}>{s}</p>)}
          <p style={{ color: tokens.text, fontSize: '0.82rem', fontWeight: 600, marginTop: '0.4rem' }}>Läuft schlecht:</p>
          {summary.whats_going_badly.map((s, i) => <p key={i} style={{ color: tokens.mutedMore, fontSize: '0.78rem' }}>{s}</p>)}
          <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Offene Entscheidungen: {summary.open_founder_decisions} — Automatisierungsgrad: {summary.automation_percentage ?? NO_DATA}
          </p>
        </Card>
      )}

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Executive Scorecard</CardTitle>
        {scorecard.map((item) => (
          <div key={item.area} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.82rem' }}>{item.area}</span>
            <Badge tone={SCORECARD_STATUS_TONE[item.status] || 'neutral'}>{item.status.replace(/_/g, ' ')}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Strategic Goals</CardTitle>
        {goals.length === 0 && <Note>Noch keine strategischen Ziele definiert.</Note>}
        {goals.map((g) => (
          <div key={g.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.text, fontWeight: 600, fontSize: '0.82rem' }}>{g.title}</span>
              <Badge tone={g.status === 'gefaehrdet' ? 'danger' : 'neutral'}>{g.status}</Badge>
            </div>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
              Fortschritt: {g.current_progress ?? NO_DATA} / Ziel: {g.target_value}
            </p>
            {g.forecast?.statement && <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', fontStyle: 'italic' }}>{g.forecast.statement}</p>}
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Executive Risks</CardTitle>
        {risks.length === 0 && <Note>Keine offenen Risiken erkannt.</Note>}
        {risks.map((r) => (
          <div key={r.ref} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.text, fontSize: '0.82rem' }}>{r.title}</span>
              <Badge tone={r.severity === 'kritisch' || r.severity === 'hoch' ? 'danger' : 'neutral'}>{r.severity}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Button variant="secondary" disabled={busyRef === r.ref} onClick={() => sendRiskToTask(r.ref, r.title)}>An Task Manager senden</Button>
              <Button variant="secondary" disabled={busyRef === r.ref} onClick={() => closeRisk(r.ref)}>Schließen</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Executive Opportunities</CardTitle>
        {opportunities.length === 0 && <Note>Keine offenen Chancen erkannt.</Note>}
        {opportunities.map((o) => (
          <div key={o.ref} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.82rem' }}>{o.title}</span>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <Button variant="secondary" disabled={busyRef === o.ref} onClick={() => archiveOpportunity(o.ref)}>Archivieren</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Scenario Planning</CardTitle>
        <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginBottom: '0.5rem' }}>
          Transparente Annahmen, keine Garantie, keine automatische Preisänderung.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
            <option value="premium_conversion_up">Premium-Conversion steigt</option>
            <option value="churn_down">Kündigungsrate sinkt</option>
            <option value="affiliate_ctr_up">Affiliate-CTR steigt</option>
            <option value="ai_cost_up">KI-Kosten steigen</option>
            <option value="new_users_grow">Neue Nutzer wachsen</option>
            <option value="annual_plan_share_up">Jahresabo-Anteil steigt</option>
          </select>
          <input type="number" value={deltaPct} onChange={(e) => setDeltaPct(e.target.value)} style={{ width: '80px' }} />
          <Button disabled={simulating} onClick={runScenario}>{simulating ? 'Simuliere...' : 'Simulieren'}</Button>
        </div>
        {scenarioResult && (
          <pre style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.6rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(scenarioResult, null, 2)}
          </pre>
        )}
      </Card>

      <Card>
        <CardTitle>Frag CEO Intelligence</CardTitle>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="z. B. Welche drei Bereiche benötigen heute meine Aufmerksamkeit?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: '1 1 300px' }}
          />
          <Button disabled={asking} onClick={askCeo}>{asking ? 'Frage läuft...' : 'Fragen'}</Button>
        </div>
        {answer && (
          <p style={{ color: answer.insufficient ? tokens.mutedMore : tokens.text, fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {answer.text}
          </p>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto Documentation (Founder OS — Submodul I)
// ---------------------------------------------------------------------------

type DocDashboard = Record<string, unknown>;
type RegistryDoc = { id: string; title: string; category: string; status: string; document_path: string; version: number };
type StaleFinding = { registry_id: string; document_path: string; reason: string };
type MissingFinding = { category: string; identifier: string; source: string };

const DOC_STATUS_TONE: Record<string, 'success' | 'neutral' | 'danger'> = {
  current: 'success', approved: 'success', stale: 'danger', missing: 'danger',
  draft: 'neutral', pending_review: 'neutral', rejected: 'danger', archived: 'neutral', manually_managed: 'neutral',
};

function AutoDocumentationTab() {
  const { authFetch, tokens } = useAdmin();
  const [dashboard, setDashboard] = useState<DocDashboard | null>(null);
  const [documents, setDocuments] = useState<RegistryDoc[]>([]);
  const [stale, setStale] = useState<StaleFinding[]>([]);
  const [missing, setMissing] = useState<MissingFinding[]>([]);
  const [changelog, setChangelog] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RegistryDoc[] | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; insufficient: boolean } | null>(null);
  const [asking, setAsking] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [dashRes, regRes, staleRes, missingRes, changelogRes] = await Promise.all([
        authFetch('/api/admin/founder/documentation/dashboard'),
        authFetch('/api/admin/founder/documentation/registry'),
        authFetch('/api/admin/founder/documentation/stale'),
        authFetch('/api/admin/founder/documentation/missing'),
        authFetch('/api/admin/founder/documentation/changelog/draft'),
      ]);
      if (!dashRes.ok) {
        setErrorMessage('Auto Documentation konnte nicht geladen werden (fehlende Berechtigung oder Backend nicht erreichbar).');
        return;
      }
      setDashboard(await dashRes.json());
      setDocuments((await regRes.json()).items || []);
      setStale((await staleRes.json()).items || []);
      setMissing((await missingRes.json()).items || []);
      setChangelog(await changelogRes.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runGeneration = async () => {
    setGenerating(true);
    try {
      await authFetch('/api/admin/founder/documentation/generate', { method: 'POST' });
      await loadAll();
    } finally {
      setGenerating(false);
    }
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    const response = await authFetch(`/api/admin/founder/documentation/search?q=${encodeURIComponent(searchQuery)}`);
    const json = await response.json().catch(() => null);
    if (response.ok) setSearchResults(json.items || []);
  };

  const askDocs = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const response = await authFetch('/api/admin/founder/documentation/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json) setAnswer({ text: json.answer, insufficient: json.insufficient_data });
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!dashboard) return null;

  return (
    <div>
      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1rem' }}>
        Analysiert ausschließlich das Backend-Repository sicher und lesend (Routen, Datenmodelle,
        Migrationen, Services) — Frontend-Dokumente liegen in einem separaten Repository und werden
        ehrlich als &quot;nicht automatisch prüfbar&quot; markiert. Geschützte Dokumente (Constitution,
        AGB, Impressum, Datenschutz, Preise) werden niemals automatisch verändert.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <Button disabled={generating} onClick={runGeneration}>{generating ? 'Läuft...' : 'Dokumentationslauf jetzt ausführen'}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(dashboard).map(([key, value]) => (
          <Card key={key}>
            <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>{key.replace(/_/g, ' ')}</p>
            <p style={{ color: tokens.text, fontSize: '1.05rem', fontWeight: 700 }}>
              {value !== null && value !== undefined ? String(value) : NO_DATA}
            </p>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Documentation Registry</CardTitle>
        {documents.length === 0 && <Note>Noch keine Dokumente registriert.</Note>}
        {documents.slice(0, 15).map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.82rem' }}>{d.title} (v{d.version})</span>
            <Badge tone={DOC_STATUS_TONE[d.status] || 'neutral'}>{d.status}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Stale Documentation</CardTitle>
        {stale.length === 0 && <Note>Keine veraltete Dokumentation erkannt.</Note>}
        {stale.map((s) => (
          <div key={s.registry_id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.82rem' }}>{s.document_path}</p>
            <p style={{ color: tokens.mutedMore, fontSize: '0.72rem' }}>{s.reason}</p>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Missing Documentation</CardTitle>
        {missing.length === 0 && <Note>Keine fehlende Dokumentation erkannt.</Note>}
        {missing.slice(0, 15).map((m, i) => (
          <p key={i} style={{ color: tokens.mutedMore, fontSize: '0.78rem', padding: '0.2rem 0' }}>
            {m.category}: {m.identifier} ({m.source})
          </p>
        ))}
      </Card>

      {changelog && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Changelog-Entwurf</CardTitle>
          <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginBottom: '0.4rem' }}>{String(changelog.source_note)}</p>
          {Object.entries((changelog.categories as Record<string, string[]>) || {}).map(([category, entries]) => (
            <div key={category} style={{ marginBottom: '0.4rem' }}>
              <p style={{ color: tokens.text, fontWeight: 600, fontSize: '0.8rem' }}>{category}</p>
              {entries.slice(0, 5).map((entry, i) => <p key={i} style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>{entry}</p>)}
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Dokumentationssuche</CardTitle>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input placeholder="Titel, Modul, Kategorie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: '1 1 250px' }} />
          <Button variant="secondary" onClick={runSearch}>Suchen</Button>
        </div>
        {searchResults && (
          <div style={{ marginTop: '0.6rem' }}>
            {searchResults.length === 0 && <Note>Keine Treffer.</Note>}
            {searchResults.map((r) => <p key={r.id} style={{ color: tokens.mutedMore, fontSize: '0.78rem' }}>{r.title} ({r.category})</p>)}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Frag die Projektdokumentation</CardTitle>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="z. B. Welche Module sind bereits implementiert?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: '1 1 300px' }}
          />
          <Button disabled={asking} onClick={askDocs}>{asking ? 'Frage läuft...' : 'Fragen'}</Button>
        </div>
        {answer && (
          <p style={{ color: answer.insufficient ? tokens.mutedMore : tokens.text, fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {answer.text}
          </p>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Founder Autopilot (Founder OS — Submodul J)
// ---------------------------------------------------------------------------

type AutopilotState = { mode: string; kill_switch_active: boolean; incident_mode_active: boolean };
type TodayViewData = { auto_completed_today: number | null; failed_automations_today: number | null; waiting_approvals: number | null; entries: { source: string; priority: string; reason: string; approval_required: boolean }[] };
type DecisionItem = { id: string; title: string; category: string; priority: string; attention_score: number };
type ModuleHealthItem = { module: string; name: string; status: string; reason: string };
type AutopilotAlertItem = { id: string; severity: string; title: string; message: string; status: string };

const AUTOPILOT_MODE_LABELS: Record<string, string> = {
  off: 'Aus', monitor: 'Monitor', assist: 'Assist', controlled_autopilot: 'Controlled Autopilot',
  maintenance: 'Wartung', incident_mode: 'Incident Mode',
};
const MODULE_HEALTH_TONE: Record<string, 'success' | 'neutral' | 'danger'> = {
  healthy: 'success', warning: 'neutral', critical: 'danger', unavailable: 'danger', not_configured: 'neutral',
};

function FounderAutopilotTab() {
  const { authFetch, tokens } = useAdmin();
  const [state, setState] = useState<AutopilotState | null>(null);
  const [todayView, setTodayView] = useState<TodayViewData | null>(null);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [moduleHealth, setModuleHealth] = useState<ModuleHealthItem[]>([]);
  const [alerts, setAlerts] = useState<AutopilotAlertItem[]>([]);
  const [automationScore, setAutomationScore] = useState<Record<string, unknown> | null>(null);
  const [releaseReadiness, setReleaseReadiness] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; insufficient: boolean } | null>(null);
  const [asking, setAsking] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [stateRes, todayRes, decisionsRes, healthRes, alertsRes, scoreRes, readinessRes] = await Promise.all([
        authFetch('/api/admin/founder/autopilot/mode'),
        authFetch('/api/admin/founder/autopilot/today-view'),
        authFetch('/api/admin/founder/autopilot/decision-inbox'),
        authFetch('/api/admin/founder/autopilot/module-health'),
        authFetch('/api/admin/founder/autopilot/alerts'),
        authFetch('/api/admin/founder/autopilot/automation-score'),
        authFetch('/api/admin/founder/autopilot/release-readiness'),
      ]);
      if (!stateRes.ok) {
        setErrorMessage('Founder Autopilot konnte nicht geladen werden (fehlende Berechtigung oder Backend nicht erreichbar).');
        return;
      }
      setState(await stateRes.json());
      setTodayView(await todayRes.json());
      setDecisions((await decisionsRes.json()).items || []);
      setModuleHealth((await healthRes.json()).items || []);
      setAlerts((await alertsRes.json()).items || []);
      setAutomationScore(await scoreRes.json());
      setReleaseReadiness(await readinessRes.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeMode = async (mode: string) => {
    setBusy(true);
    try {
      await authFetch('/api/admin/founder/autopilot/mode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const toggleKillSwitch = async () => {
    if (!state) return;
    setBusy(true);
    try {
      if (state.kill_switch_active) {
        await authFetch('/api/admin/founder/autopilot/kill-switch/deactivate', { method: 'POST' });
      } else {
        await authFetch('/api/admin/founder/autopilot/kill-switch/activate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Manuell über Founder OS ausgelöst.' }),
        });
      }
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const askAutopilot = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const response = await authFetch('/api/admin/founder/autopilot/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json) setAnswer({ text: json.answer, insufficient: json.insufficient_data });
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!state || !todayView) return null;

  return (
    <div>
      <Card style={{ marginBottom: '1.25rem', border: state.kill_switch_active ? `2px solid ${tokens.danger}` : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <CardTitle>Autopilot-Status</CardTitle>
            <Badge tone={state.kill_switch_active ? 'danger' : state.incident_mode_active ? 'danger' : 'success'}>
              {state.kill_switch_active ? 'KILL SWITCH AKTIV' : (AUTOPILOT_MODE_LABELS[state.mode] || state.mode)}
            </Badge>
          </div>
          <Button variant={state.kill_switch_active ? 'secondary' : 'danger'} disabled={busy} onClick={toggleKillSwitch}>
            {state.kill_switch_active ? 'Autopilot wieder aktivieren' : 'Autopilot sofort pausieren'}
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
          {Object.entries(AUTOPILOT_MODE_LABELS).map(([mode, label]) => (
            <Button key={mode} variant={state.mode === mode ? 'primary' : 'secondary'} disabled={busy} onClick={() => changeMode(mode)}>
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>Heute automatisch erledigt</p>
          <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700 }}>{todayView.auto_completed_today ?? NO_DATA}</p>
        </Card>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>Fehlgeschlagene Automationen</p>
          <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700 }}>{todayView.failed_automations_today ?? NO_DATA}</p>
        </Card>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>Wartende Freigaben</p>
          <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700 }}>{todayView.waiting_approvals ?? NO_DATA}</p>
        </Card>
        {automationScore && (
          <Card>
            <p style={{ color: tokens.muted, fontSize: '0.7rem' }}>Automatisierungsgrad</p>
            <p style={{ color: tokens.text, fontSize: '1.1rem', fontWeight: 700 }}>
              {automationScore.overall_percentage !== null && automationScore.overall_percentage !== undefined ? `${automationScore.overall_percentage}%` : NO_DATA}
            </p>
          </Card>
        )}
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Jetzt meine Entscheidung nötig (Decision Inbox)</CardTitle>
        {decisions.length === 0 && <Note>Keine offenen Entscheidungen.</Note>}
        {decisions.slice(0, 10).map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.82rem' }}>{d.title}</span>
            <Badge tone={d.priority === 'kritisch' || d.priority === 'hoch' ? 'danger' : 'neutral'}>{d.priority}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Module Health</CardTitle>
        {moduleHealth.map((m) => (
          <div key={m.module} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <span style={{ color: tokens.text, fontSize: '0.8rem' }}>{m.module} — {m.name}</span>
            <Badge tone={MODULE_HEALTH_TONE[m.status] || 'neutral'}>{m.status}</Badge>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <CardTitle>Smart Alerts</CardTitle>
        {alerts.filter((a) => a.status === 'offen').length === 0 && <Note>Keine offenen Warnungen.</Note>}
        {alerts.filter((a) => a.status === 'offen').map((a) => (
          <div key={a.id} style={{ padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.text, fontWeight: 600, fontSize: '0.82rem' }}>{a.title}</span>
              <Badge tone={a.severity === 'hoch' || a.severity === 'kritisch' ? 'danger' : 'neutral'}>{a.severity}</Badge>
            </div>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>{a.message}</p>
          </div>
        ))}
      </Card>

      {releaseReadiness && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Release Readiness</CardTitle>
          <Badge tone={releaseReadiness.verdict === 'bereit' ? 'success' : releaseReadiness.verdict === 'nicht_bereit' ? 'danger' : 'neutral'}>
            {String(releaseReadiness.verdict).replace(/_/g, ' ')}
          </Badge>
          <p style={{ color: tokens.mutedMore, fontSize: '0.72rem', marginTop: '0.4rem' }}>{String(releaseReadiness.note)}</p>
        </Card>
      )}

      <Card>
        <CardTitle>Frag Founder Autopilot</CardTitle>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="z. B. Was muss ich heute entscheiden?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: '1 1 300px' }}
          />
          <Button disabled={asking} onClick={askAutopilot}>{asking ? 'Frage läuft...' : 'Fragen'}</Button>
        </div>
        {answer && (
          <p style={{ color: answer.insufficient ? tokens.mutedMore : tokens.text, fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {answer.text}
          </p>
        )}
      </Card>
    </div>
  );
}
