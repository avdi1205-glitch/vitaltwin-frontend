'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdmin } from './_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Kpi, Loading, Note, SectionTitle } from './_lib/AdminUI';

type DashboardData = {
  user_count: number | null;
  premium_users: number | null;
  suspended_users: number | null;
  registrations_7d: number | null;
  registrations_30d: number | null;
  active_users_7d: number | null;
  ai_requests_today: number | null;
  open_feedback_count: number | null;
  beta_applications_total: number | null;
  beta_applications_note: string;
  latest_activity: { action: string; entity_type: string; email: string | null; created_at: string } | null;
  stripe_configured: boolean;
  openai_configured: boolean;
  supabase_reachable: boolean;
  revenue_today: number | null;
  revenue_month: number | null;
  revenue_note: string;
  error_count_7d: number | null;
  error_tracking_note: string;
};

type FounderTasksSummary = {
  summary: { open_tasks: number; critical_tasks: number; done_today: number; auto_detected: number; auto_resolved: number };
};

type FounderApprovalsSummary = {
  summary: { total: number; open: number; critical_open: number; approved: number; rejected: number };
};

type SystemStatusData = {
  release: { version?: string; build_status?: string; note?: string };
  backup: { status?: string; completed_at?: string; note?: string };
};

type GrowthData = {
  dau_today: number | null;
  mau_30d: number | null;
  premium_conversion_rate: number | null;
  activation_rate_24h: number | null;
  week1_retention_rate: number | null;
};

type AiUsageData = {
  model_configured: string;
  openai_configured: boolean;
  total_requests_all_time: number;
  unique_users_all_time: number;
  requests_today: number;
  token_usage_note: string;
  usage_today: { requests: number | null; errors: number | null; cost_usd: number | null; cost_note: string | null; avg_latency_ms: number | null };
};

type BusinessData = {
  premium_users: number;
  stripe_configured: boolean;
  configured_plan_prices: Record<string, boolean>;
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

type TwinData = {
  active_twins: number;
  total_calculations: number;
  twin_memory_entries: number | null;
  learning_events: number | null;
  recommendation_feedback_count: number | null;
  sub_twins_note: string;
};

type ContentData = { items: { status: string }[] };
type SecuritySummary = { items: unknown[]; total: number; failed_total?: number };
type FeedbackData = { items: unknown[]; total: number };
type NutritionData = { available: boolean; note: string };

function formatRate(value: number | null | undefined): string {
  return value !== null && value !== undefined ? `${(value * 100).toFixed(1)}%` : '—';
}

export default function AdminDashboardPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsageData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [twin, setTwin] = useState<TwinData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecuritySummary | null>(null);
  const [loginHistory, setLoginHistory] = useState<SecuritySummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [founderTasks, setFounderTasks] = useState<FounderTasksSummary | null>(null);
  const [founderApprovals, setFounderApprovals] = useState<FounderApprovalsSummary | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
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
      const tasks: Promise<void>[] = [];

      if (hasPermission('view_dashboard')) {
        tasks.push(fetchJson<DashboardData>('/api/admin/dashboard').then((d) => { if (!cancelled) setDashboard(d); }));
        tasks.push(fetchJson<TwinData>('/api/admin/twin/overview').then((d) => { if (!cancelled) setTwin(d); }));
      }
      if (hasPermission('view_analytics')) {
        tasks.push(fetchJson<GrowthData>('/api/admin/analytics/growth').then((d) => { if (!cancelled) setGrowth(d); }));
      }
      if (hasPermission('view_ai_usage')) {
        tasks.push(fetchJson<AiUsageData>('/api/admin/ai/usage').then((d) => { if (!cancelled) setAiUsage(d); }));
      }
      if (hasPermission('view_business')) {
        tasks.push(fetchJson<BusinessData>('/api/admin/business/overview').then((d) => { if (!cancelled) setBusiness(d); }));
      }
      if (hasPermission('view_content')) {
        tasks.push(fetchJson<ContentData>('/api/admin/content').then((d) => { if (!cancelled) setContent(d); }));
      }
      if (hasPermission('view_security')) {
        tasks.push(fetchJson<SecuritySummary>('/api/admin/security/audit-logs?limit=1').then((d) => { if (!cancelled) setAuditLogs(d); }));
        tasks.push(fetchJson<SecuritySummary>('/api/admin/security/login-history?limit=1').then((d) => { if (!cancelled) setLoginHistory(d); }));
      }
      if (hasPermission('view_support')) {
        tasks.push(fetchJson<FeedbackData>('/api/admin/support/feedback?page_size=1').then((d) => { if (!cancelled) setFeedback(d); }));
      }
      if (hasPermission('view_nutrition_admin')) {
        tasks.push(fetchJson<NutritionData>('/api/admin/nutrition/overview').then((d) => { if (!cancelled) setNutrition(d); }));
      }
      if (hasPermission('view_founder_os')) {
        tasks.push(fetchJson<FounderTasksSummary>('/api/admin/founder/tasks').then((d) => { if (!cancelled) setFounderTasks(d); }));
        tasks.push(fetchJson<FounderApprovalsSummary>('/api/admin/founder/approvals').then((d) => { if (!cancelled) setFounderApprovals(d); }));
      }
      if (hasPermission('view_system_status')) {
        tasks.push(fetchJson<SystemStatusData>('/api/admin/system/status').then((d) => { if (!cancelled) setSystemStatus(d); }));
      }

      await Promise.all(tasks);
      if (!cancelled) {
        if (tasks.length === 0) setErrorMessage('Keine Berechtigungen für Dashboard-Daten.');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draftCount = content?.items.filter((i) => i.status === 'draft').length ?? null;
  const publishedCount = content?.items.filter((i) => i.status === 'published').length ?? null;

  const sectionTitleStyle: React.CSSProperties = {
    color: tokens.text,
    fontSize: '1.05rem',
    fontWeight: 700,
    marginTop: '2rem',
    marginBottom: '0.75rem',
  };
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  };

  return (
    <div>
      <SectionTitle
        title="VitalTwin Admin Dashboard"
        subtitle="Alle Kennzahlen aus der echten Datenbank — keine Demo-/Platzhalterdaten."
      />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && (
        <>
          {/* --------------------------- Schnellaktionen --------------------------- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.5rem' }}>
            {hasPermission('manage_content') && (
              <Link href="/admin/content"><Button variant="secondary">+ Neuer Blogartikel</Button></Link>
            )}
            {hasPermission('view_users') && (
              <Link href="/admin/users"><Button variant="secondary">Nutzer verwalten</Button></Link>
            )}
            <Button variant="secondary" disabled>+ Gutschein erstellen</Button>
            <Button variant="secondary" disabled>+ Newsletter senden</Button>
            <Button variant="secondary" disabled>Systemwartung</Button>
            <Button variant="secondary" disabled>Cache leeren</Button>
            <Button variant="secondary" disabled>Backup starten</Button>
          </div>
          <Note>
            Ausgegraute Schnellaktionen (Gutschein, Newsletter, Systemwartung, Cache, Backup) sind noch nicht
            eingerichtet — es gibt aktuell keine entsprechende Backend-Funktion dafür.
          </Note>

          {/* --------------------------- 1. Systemübersicht --------------------------- */}
          <p style={sectionTitleStyle}>1. Systemübersicht</p>
          {dashboard ? (
            <>
              <div style={gridStyle}>
                <Kpi label="Nutzer gesamt" value={dashboard.user_count} />
                <Kpi label="Aktive Nutzer (7 Tage)" value={dashboard.active_users_7d} />
                <Kpi label="Neue Registrierungen (7 Tage)" value={dashboard.registrations_7d} />
                <Kpi label="Beta-Bewerbungen" value={dashboard.beta_applications_total} hint={dashboard.beta_applications_note} />
                <Kpi label="Premium-Nutzer" value={dashboard.premium_users} />
                <Kpi
                  label="Umsatz (Monat)"
                  value={business?.revenue_month != null ? `${business.revenue_month.toFixed(2)} €` : '—'}
                  hint={business?.revenue_month == null ? (business?.revenue_note ?? 'Lädt…') : undefined}
                />
                <Kpi label="Affiliate-Umsatz" value="—" hint={business?.affiliate_note ?? 'Kein Affiliate-Provisions-Tracking implementiert'} />
                <Kpi label="KI-Nutzung heute" value={dashboard.ai_requests_today} />
                <Kpi label="KI-Kosten" value="—" hint="Kein Kosten-Tracking implementiert" />
                <Kpi
                  label="Fehler (7 Tage)"
                  value={dashboard.error_count_7d}
                  hint={dashboard.error_tracking_note}
                />
              </div>
              <div style={{ ...gridStyle, marginTop: '1rem' }}>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Datenbankstatus</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Badge tone={dashboard.supabase_reachable ? 'success' : 'danger'}>
                      {dashboard.supabase_reachable ? 'Erreichbar' : 'Nicht erreichbar'}
                    </Badge>
                  </div>
                </Card>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>API-Status</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Badge tone="success">Läuft (diese Anfrage kam durch)</Badge>
                  </div>
                </Card>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Stripe-Status</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Badge tone={dashboard.stripe_configured ? 'success' : 'danger'}>
                      {dashboard.stripe_configured ? 'Konfiguriert' : 'Nicht konfiguriert'}
                    </Badge>
                  </div>
                </Card>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>KI-Status</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Badge tone={dashboard.openai_configured ? 'success' : 'danger'}>
                      {dashboard.openai_configured ? 'Konfiguriert' : 'Nicht konfiguriert'}
                    </Badge>
                  </div>
                </Card>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Letzter Release</p>
                  {systemStatus?.release.version ? (
                    <p style={{ color: tokens.text, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      {systemStatus.release.version} · {systemStatus.release.build_status}
                    </p>
                  ) : (
                    <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {systemStatus?.release.note ?? 'Noch keine Releases erfasst (System Center).'}
                    </p>
                  )}
                </Card>
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Letzter Backup-Status</p>
                  {systemStatus?.backup.status ? (
                    <p style={{ color: tokens.text, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      {systemStatus.backup.status}
                      {systemStatus.backup.completed_at ? ` · ${new Date(systemStatus.backup.completed_at).toLocaleString('de-DE')}` : ''}
                    </p>
                  ) : (
                    <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {systemStatus?.backup.note ?? 'Noch keine Backups erfasst (System Center).'}
                    </p>
                  )}
                </Card>
                {hasPermission('view_founder_os') && (
                  <>
                    <Card>
                      <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Offene Aufgaben</p>
                      <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700, marginTop: '0.4rem' }}>
                        {founderTasks ? founderTasks.summary.open_tasks : '—'}
                      </p>
                      <Link href="/admin/founder" style={{ color: tokens.accent, fontSize: '0.75rem' }}>Founder OS öffnen →</Link>
                    </Card>
                    <Card>
                      <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Offene Freigaben</p>
                      <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700, marginTop: '0.4rem' }}>
                        {founderApprovals ? founderApprovals.summary.open : '—'}
                      </p>
                      <Link href="/admin/founder" style={{ color: tokens.accent, fontSize: '0.75rem' }}>Founder OS öffnen →</Link>
                    </Card>
                    <Card>
                      <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Kritische Warnungen</p>
                      <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700, marginTop: '0.4rem' }}>
                        {founderTasks && founderApprovals
                          ? founderTasks.summary.critical_tasks + founderApprovals.summary.critical_open
                          : '—'}
                      </p>
                      <p style={{ color: tokens.mutedMore, fontSize: '0.7rem', marginTop: '0.2rem' }}>
                        Kritische Founder-Tasks + kritische offene Freigaben
                      </p>
                    </Card>
                  </>
                )}
                <Card>
                  <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>Letzte Systemaktivität</p>
                  {dashboard.latest_activity ? (
                    <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      {dashboard.latest_activity.action} · {dashboard.latest_activity.entity_type}
                      {dashboard.latest_activity.email ? ` · ${dashboard.latest_activity.email}` : ''}
                      <br />
                      {new Date(dashboard.latest_activity.created_at).toLocaleString('de-DE')}
                    </p>
                  ) : (
                    <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginTop: '0.5rem' }}>Keine Aktivität erfasst.</p>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_dashboard erforderlich).</Note>
          )}

          {/* --------------------------- 2. Nutzer --------------------------- */}
          <p style={sectionTitleStyle}>2. Nutzer</p>
          {dashboard ? (
            <div style={gridStyle}>
              <Kpi label="Nutzer gesamt" value={dashboard.user_count} />
              <Kpi label="Premium-Nutzer" value={dashboard.premium_users} />
              <Kpi label="Gesperrte Konten" value={dashboard.suspended_users} />
              <Kpi label="Registrierungen (30 Tage)" value={dashboard.registrations_30d} />
            </div>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_dashboard erforderlich).</Note>
          )}
          {hasPermission('view_users') && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/admin/users"><Button variant="secondary">Details: Nutzerverwaltung öffnen</Button></Link>
            </div>
          )}

          {/* --------------------------- 3. Content --------------------------- */}
          <p style={sectionTitleStyle}>3. Content</p>
          {content ? (
            <div style={gridStyle}>
              <Kpi label="Inhalte gesamt" value={content.items.length} />
              <Kpi label="Entwürfe" value={draftCount} />
              <Kpi label="Veröffentlicht" value={publishedCount} />
            </div>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_content erforderlich).</Note>
          )}
          {hasPermission('view_content') && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/admin/content"><Button variant="secondary">Details: Content Management öffnen</Button></Link>
            </div>
          )}
          <Note>
            Newsletter ist als eigener Bereich nicht implementiert (kein Versand-System angebunden). FAQ/Seiten
            laufen über den generischen Content-Typ oben.
          </Note>

          {/* --------------------------- 4. KI --------------------------- */}
          <p style={sectionTitleStyle}>4. KI</p>
          {aiUsage ? (
            <>
              <div style={gridStyle}>
                <Kpi label="Verwendetes Modell" value={aiUsage.model_configured} />
                <Kpi label="KI-Anfragen gesamt" value={aiUsage.total_requests_all_time} />
                <Kpi label="KI-Anfragen heute" value={aiUsage.requests_today} />
                <Kpi label="Eindeutige Nutzer" value={aiUsage.unique_users_all_time} />
                <Kpi
                  label="Ø Antwortzeit"
                  value={aiUsage.usage_today.avg_latency_ms != null ? `${aiUsage.usage_today.avg_latency_ms} ms` : '—'}
                  hint={aiUsage.usage_today.avg_latency_ms == null ? 'Noch keine Anfragen heute erfasst' : undefined}
                />
                <Kpi
                  label="Fehler (heute)"
                  value={aiUsage.usage_today.errors}
                  hint="Erfasst seit Migration 022 (vt_ai_usage_events), zusätzlich an Sentry gesendet sofern konfiguriert"
                />
              </div>
              <Note>{aiUsage.token_usage_note}</Note>
            </>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_ai_usage erforderlich).</Note>
          )}

          {/* --------------------------- 5. Twin --------------------------- */}
          <p style={sectionTitleStyle}>5. Twin</p>
          {twin ? (
            <>
              <div style={gridStyle}>
                <Kpi label="Aktive Twins" value={twin.active_twins} hint="Nutzer mit mind. 1 Berechnung" />
                <Kpi label="Berechnungen gesamt" value={twin.total_calculations} />
                <Kpi label="Twin-Memory-Einträge" value={twin.twin_memory_entries} />
                <Kpi label="Lern-Events" value={twin.learning_events} />
                <Kpi label="Empfehlungs-Feedback" value={twin.recommendation_feedback_count} />
                <Kpi label="Nutrition / Sleep / Movement / Metabolic Twin" value="—" hint="Nicht als Sub-Twin implementiert" />
              </div>
              <Note>{twin.sub_twins_note}</Note>
            </>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_dashboard erforderlich).</Note>
          )}

          {/* --------------------------- 6. Zahlungen --------------------------- */}
          <p style={sectionTitleStyle}>6. Zahlungen</p>
          {business ? (
            <>
              <div style={gridStyle}>
                <Kpi
                  label="Stripe-Status"
                  value={business.stripe_configured ? 'Konfiguriert' : 'Nicht konfiguriert'}
                />
                <Kpi
                  label="Umsatz heute"
                  value={business.revenue_today != null ? `${business.revenue_today.toFixed(2)} €` : '—'}
                  hint={business.revenue_today == null ? business.revenue_note : undefined}
                />
                <Kpi
                  label="Umsatz Monat"
                  value={business.revenue_month != null ? `${business.revenue_month.toFixed(2)} €` : '—'}
                  hint={business.revenue_month == null ? business.revenue_note : undefined}
                />
                <Kpi label="Kündigungen gesamt" value={business.canceled_subscriptions} hint={business.canceled_subscriptions == null ? business.subscriptions_note : undefined} />
                <Kpi
                  label="Erstattungen (30 Tage)"
                  value={business.refunds_total_30d != null ? `${business.refunds_total_30d.toFixed(2)} €` : '—'}
                  hint={business.refunds_note}
                />
                <Kpi label="Aktive Abonnements" value={business.active_subscriptions ?? business.premium_users} hint={business.active_subscriptions == null ? business.subscriptions_note : undefined} />
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(business.configured_plan_prices).map(([key, configured]) => (
                  <Badge key={key} tone={configured ? 'success' : 'neutral'}>
                    {key}: {configured ? 'aktiv' : 'nicht konfiguriert'}
                  </Badge>
                ))}
              </div>
              <Note>{business.revenue_note}</Note>
            </>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_business erforderlich).</Note>
          )}

          {/* --------------------------- 7. Affiliate --------------------------- */}
          <p style={sectionTitleStyle}>7. Affiliate</p>
          <div style={gridStyle}>
            <Kpi label="Klicks" value="—" />
            <Kpi label="Verkäufe" value="—" />
            <Kpi label="Provisionen" value="—" />
            <Kpi label="Gutscheine" value="—" />
            <Kpi label="Partnerprogramme" value="—" />
          </div>
          <Note>{business?.affiliate_note ?? 'Kein Affiliate-/Provisions-System implementiert.'}</Note>
          <Note>{business?.coupons_note ?? 'Keine Gutschein-Verwaltung implementiert.'}</Note>

          {/* --------------------------- 8. Support --------------------------- */}
          <p style={sectionTitleStyle}>8. Support</p>
          {feedback ? (
            <div style={gridStyle}>
              <Kpi label="Neue Supportanfragen / Feedback" value={feedback.total} />
              <Kpi label="Bugmeldungen" value="—" hint="Keine eigene Kategorie — alles läuft über Feedback" />
              <Kpi label="Feature-Wünsche" value="—" hint="Keine eigene Kategorie — alles läuft über Feedback" />
            </div>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_support erforderlich).</Note>
          )}
          {hasPermission('view_support') && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/admin/support"><Button variant="secondary">Details: Support Center öffnen</Button></Link>
            </div>
          )}

          {/* --------------------------- 9. Analytics --------------------------- */}
          <p style={sectionTitleStyle}>9. Analytics</p>
          {growth ? (
            <>
              <div style={gridStyle}>
                <Kpi label="Aktive Nutzer heute (DAU)" value={growth.dau_today} />
                <Kpi label="Aktive Nutzer 30 Tage (MAU)" value={growth.mau_30d} />
                <Kpi label="Premium-Conversion" value={formatRate(growth.premium_conversion_rate)} />
                <Kpi label="Activation Rate (24h)" value={formatRate(growth.activation_rate_24h)} />
                <Kpi label="Week-1 Retention" value={formatRate(growth.week1_retention_rate)} />
                <Kpi label="Seitenaufrufe / Sitzungen" value="—" hint="Kein Frontend-Analytics-Tracking" />
              </div>
              <Note>Beliebteste Funktionen: Feature-Nutzung im Detail nicht aggregiert.</Note>
            </>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_analytics erforderlich).</Note>
          )}
          {hasPermission('view_analytics') && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/admin/analytics"><Button variant="secondary">Details: Analytics öffnen</Button></Link>
            </div>
          )}

          {/* --------------------------- 10. Sicherheit --------------------------- */}
          <p style={sectionTitleStyle}>10. Sicherheit</p>
          {auditLogs || loginHistory ? (
            <div style={gridStyle}>
              <Kpi label="Login-Versuche gesamt" value={loginHistory?.total ?? null} />
              <Kpi label="Fehlgeschlagene Logins" value={loginHistory?.failed_total ?? null} />
              <Kpi label="Audit-Log-Einträge" value={auditLogs?.total ?? null} />
            </div>
          ) : (
            <Note>Keine Berechtigung oder Daten nicht verfügbar (view_security erforderlich).</Note>
          )}
          {hasPermission('view_security') && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/admin/security"><Button variant="secondary">Details: Security Center öffnen</Button></Link>
            </div>
          )}
          {hasPermission('view_nutrition_admin') && nutrition && !nutrition.available && (
            <Note>Nutrition & CGM: {nutrition.note}</Note>
          )}
        </>
      )}
    </div>
  );
}

