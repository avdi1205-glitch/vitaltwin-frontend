'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type UserListItem = {
  email: string;
  full_name: string | null;
  premium: boolean;
  plan: string;
  status: string;
  suspended: boolean;
  deletion_requested_at: string | null;
  created_at: string | null;
  role: string | null;
  last_login_at: string | null;
};

type BetaGrant = {
  plan: string;
  started_at: string | null;
  expires_at: string | null;
  granted_by: string | null;
  active: boolean;
  remaining_days: number;
};

type UserDetail = {
  user: UserListItem & { id?: number; suspended_reason?: string | null; beta_access?: boolean; beta_grant?: BetaGrant | null };
  consents: Record<string, { granted?: boolean }>;
  admin_role: string | null;
  recent_logins: { success: boolean; ip_address: string | null; created_at: string }[];
};

const PLAN_LABELS: Record<string, string> = { free: 'Free', premium: 'Premium', pro: 'Pro', family: 'Family' };
const PLAN_OPTIONS = ['free', 'premium', 'pro', 'family'];
const BETA_PLAN_OPTIONS = ['premium', 'pro', 'family'];
const BETA_DURATION_OPTIONS = [30, 60, 90];
const STATUS_LABELS: Record<string, string> = { active: 'Aktiv', deactivated: 'Deaktiviert', deletion_requested: 'Löschung angefragt' };

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE');
  } catch {
    return iso;
  }
}

type DeletionRequest = { email: string; display_name: string | null; deletion_requested_at: string };
type QACleanupItem = { email: string; full_name: string | null; created_at?: string | null };
type QACleanupResultItem = { email: string; success: boolean; error?: string };
type BetaTesterRow = {
  email: string;
  full_name: string | null;
  real_plan: string;
  beta_plan: string;
  beta_expires_at: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'unknown';
  remaining_days: number | null;
};
type BetaTesterSummary = {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  pro_beta: number;
  family_beta: number;
  premium_beta: number;
};
const BETA_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  expiring_soon: 'Läuft bald ab',
  expired: 'Abgelaufen',
  unknown: 'Unbekannt',
};

const ROLE_OPTIONS = ['super_admin', 'admin', 'support', 'moderator', 'editor', 'analyst', 'developer'];

export default function AdminUsersPage() {
  const { authFetch, tokens, hasPermission, principal } = useAdmin();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [deletionMessage, setDeletionMessage] = useState('');
  const [betaTesters, setBetaTesters] = useState<BetaTesterRow[]>([]);
  const [betaSummary, setBetaSummary] = useState<BetaTesterSummary | null>(null);
  const [qaPreview, setQaPreview] = useState<QACleanupItem[] | null>(null);
  const [qaBusy, setQaBusy] = useState(false);
  const [qaMessage, setQaMessage] = useState('');
  const [qaResults, setQaResults] = useState<QACleanupResultItem[] | null>(null);
  const [betaPlanChoice, setBetaPlanChoice] = useState<string>('pro');
  const [betaDays, setBetaDays] = useState<number>(90);
  const [betaConfirmPending, setBetaConfirmPending] = useState<'grant' | 'extend' | 'revoke' | null>(null);

  const canManageUsers = hasPermission('manage_users');
  const canManageRoles = hasPermission('manage_roles');
  const canManagePremium = hasPermission('manage_premium');
  const isSuperAdmin = principal.role === 'super_admin';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (search.trim()) params.set('search', search.trim());
      const response = await authFetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        setErrorMessage('Nutzerliste konnte nicht geladen werden.');
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, search]);

  const loadDeletionRequests = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/users/deletion-requests');
      if (!response.ok) return;
      const data = await response.json();
      setDeletionRequests(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Non-fatal — the main user list already loaded fine.
    }
  }, [authFetch]);

  const loadBetaTesters = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/beta-testers');
      if (!response.ok) return;
      const data = await response.json();
      setBetaTesters(Array.isArray(data.testers) ? data.testers : []);
      setBetaSummary(data.summary ?? null);
    } catch {
      // Non-fatal — small overview only, main user list already loaded fine.
    }
  }, [authFetch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBetaTesters();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBetaTesters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeletionRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeletionRequests]);

  const completeDeletion = async (email: string) => {
    if (
      !window.confirm(
        'Diese Aktion entfernt oder anonymisiert personenbezogene Daten dieses Accounts. Fortfahren?'
      )
    ) {
      return;
    }
    const typed = window.prompt(`Zur Bestätigung bitte die E-Mail-Adresse exakt eingeben: ${email}`);
    if (typed !== email) {
      setDeletionMessage('Löschung abgebrochen — Bestätigung stimmte nicht überein.');
      return;
    }
    setBusy(true);
    setDeletionMessage('');
    try {
      const response = await authFetch(`/api/admin/users/${encodeURIComponent(email)}/deletion-requests/complete`, {
        method: 'POST',
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setDeletionMessage(json?.detail || 'Löschung fehlgeschlagen.');
        return;
      }
      setDeletionMessage(json?.message || 'Konto gelöscht.');
      await Promise.all([loadDeletionRequests(), loadUsers()]);
    } catch {
      setDeletionMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const runQaPreview = async () => {
    setQaBusy(true);
    setQaMessage('');
    setQaResults(null);
    try {
      const response = await authFetch('/api/admin/users/qa-cleanup/preview');
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setQaMessage(json?.detail || 'Vorschau konnte nicht geladen werden.');
        return;
      }
      setQaPreview(Array.isArray(json?.items) ? json.items : []);
    } catch {
      setQaMessage('Backend gerade nicht erreichbar.');
    } finally {
      setQaBusy(false);
    }
  };

  const runQaCleanup = async () => {
    if (!qaPreview || qaPreview.length === 0) return;
    if (
      !window.confirm(
        `${qaPreview.length} QA-Testaccounts (Muster "qa-test-" + "QA TEST ACCOUNT") werden endgültig entfernt. Fortfahren?`
      )
    ) {
      return;
    }
    setQaBusy(true);
    setQaMessage('');
    try {
      const response = await authFetch('/api/admin/users/qa-cleanup/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setQaMessage(json?.detail || 'Bereinigung fehlgeschlagen.');
        return;
      }
      setQaMessage(json?.message || 'Erledigt.');
      setQaResults(Array.isArray(json?.results) ? json.results : []);
      setQaPreview(null);
      await loadUsers();
    } catch {
      setQaMessage('Backend gerade nicht erreichbar.');
    } finally {
      setQaBusy(false);
    }
  };

  const openDetail = async (email: string) => {
    setSelectedEmail(email);
    setDetail(null);
    setActionMessage('');
    setBetaConfirmPending(null);
    try {
      const response = await authFetch(`/api/admin/users/${encodeURIComponent(email)}`);
      if (!response.ok) return;
      setDetail(await response.json());
    } catch {
      // Detail panel simply stays empty — the list itself already loaded fine.
    }
  };

  const runAction = async (path: string, method: 'POST' | 'DELETE', body?: object) => {
    if (!selectedEmail) return;
    setBusy(true);
    setActionMessage('');
    try {
      const response = await authFetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setActionMessage(json?.detail || 'Aktion fehlgeschlagen.');
        return;
      }
      setActionMessage(json?.message || 'Erledigt.');
      await Promise.all([loadUsers(), openDetail(selectedEmail), loadBetaTesters()]);
    } catch {
      setActionMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const suspendUser = async (email: string) => {
    if (!window.confirm(`Account ${email} wirklich deaktivieren? Der Nutzer kann sich danach nicht mehr anmelden.`)) {
      return;
    }
    await runAction(`/api/admin/users/${encodeURIComponent(email)}/suspend`, 'POST', {
      reason: 'Über Admin Control Center deaktiviert',
    });
  };

  const deleteUserDirectly = async (email: string) => {
    const confirmed = window.confirm(
      `ACHTUNG: Konto ${email} und ALLE zugehörigen Daten (Check-ins, Gewohnheiten, Ziele, Tagespläne, Chat-Verlauf, Empfehlungen, Zustimmungen) werden ENDGÜLTIG gelöscht. Der Nutzer kann sich danach nicht mehr anmelden. Das kann nicht rückgängig gemacht werden. Fortfahren?`
    );
    if (!confirmed) return;
    const typed = window.prompt(`Zur Bestätigung bitte die E-Mail-Adresse exakt eingeben: ${email}`);
    if (typed !== email) {
      setActionMessage('Löschung abgebrochen — Bestätigung stimmte nicht überein.');
      return;
    }
    setBusy(true);
    setActionMessage('');
    try {
      const response = await authFetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setActionMessage(json?.detail || 'Löschung fehlgeschlagen.');
        return;
      }
      setActionMessage(json?.message || 'Nutzer gelöscht.');
      setSelectedEmail(null);
      setDetail(null);
      await loadUsers();
    } catch {
      setActionMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <SectionTitle title="Nutzerverwaltung" subtitle="Suche, Aktivieren/Deaktivieren, Rollen, Tarife (Free/Premium/Pro/Family). Passwörter werden nie angezeigt." />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Suche nach E-Mail oder Name…"
          style={{
            flex: 1,
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
            borderRadius: '0.6rem',
            padding: '0.5rem 0.75rem',
            color: tokens.text,
            fontSize: '0.85rem',
          }}
        />
      </div>

      {deletionRequests.length > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>
            Löschanfragen ({deletionRequests.length})
          </p>
          <p style={{ color: tokens.muted, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Aus Sicherheitsgründen wird eine Löschung manuell geprüft, nicht automatisch ausgeführt.
          </p>
          {deletionRequests.map((request) => (
            <div
              key={request.email}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: `1px solid ${tokens.border}`,
              }}
            >
              <div>
                <p style={{ color: tokens.text, fontSize: '0.85rem' }}>{request.display_name || request.email}</p>
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
                  {request.email} · angefragt am {request.deletion_requested_at}
                </p>
              </div>
              {canManageUsers && (
                <Button variant="danger" disabled={busy} onClick={() => completeDeletion(request.email)}>
                  Endgültig löschen
                </Button>
              )}
            </div>
          ))}
          {deletionMessage && <p style={{ color: tokens.accent, fontSize: '0.85rem', marginTop: '0.5rem' }}>{deletionMessage}</p>}
        </Card>
      )}

      {isSuperAdmin && (
        <Card style={{ marginBottom: '1rem' }}>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.4rem' }}>QA-Testaccount-Bereinigung</p>
          <p style={{ color: tokens.muted, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Entfernt ausschließlich Accounts, deren E-Mail mit &quot;qa-test-&quot; beginnt UND deren Name
            &quot;QA TEST ACCOUNT&quot; enthält — niemals reguläre Nutzer per Wildcard. Erst Vorschau (Dry-Run), dann
            bestätigte Bereinigung.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Button variant="secondary" disabled={qaBusy} onClick={runQaPreview}>
              QA-Accounts anzeigen (Dry-Run)
            </Button>
            {qaPreview && qaPreview.length > 0 && (
              <Button variant="danger" disabled={qaBusy} onClick={runQaCleanup}>
                {qaPreview.length} QA-Testaccounts endgültig bereinigen
              </Button>
            )}
          </div>

          {qaPreview && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ color: tokens.text, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                {qaPreview.length === 0 ? 'Keine QA-Testaccounts gefunden.' : `${qaPreview.length} QA-Testaccounts gefunden:`}
              </p>
              {qaPreview.map((item) => (
                <p key={item.email} style={{ color: tokens.muted, fontSize: '0.78rem' }}>
                  {item.email} — {item.full_name || 'kein Name'}
                </p>
              ))}
            </div>
          )}

          {qaResults && (
            <div style={{ marginBottom: '0.5rem' }}>
              {qaResults.map((result) => (
                <p key={result.email} style={{ color: result.success ? tokens.muted : tokens.danger, fontSize: '0.78rem' }}>
                  {result.success ? '✅' : '❌'} {result.email}
                  {result.error ? ` — ${result.error}` : ''}
                </p>
              ))}
            </div>
          )}

          {qaMessage && <p style={{ color: tokens.accent, fontSize: '0.85rem' }}>{qaMessage}</p>}
        </Card>
      )}

      {betaSummary && betaSummary.total > 0 && (
        <Card style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p style={{ color: tokens.text, fontWeight: 700 }}>Beta-Tester Übersicht</p>
            <Button variant="secondary" onClick={loadBetaTesters}>
              Aktualisieren
            </Button>
          </div>
          <p style={{ color: tokens.muted, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            {betaSummary.active} aktiv · {betaSummary.expiring_soon} laufen bald ab (≤7 Tage) · {betaSummary.expired} abgelaufen
            {' · '}Pro: {betaSummary.pro_beta} · Family: {betaSummary.family_beta} · Premium: {betaSummary.premium_beta}
          </p>
          {betaTesters.map((tester) => (
            <div
              key={tester.email}
              onClick={() => openDetail(tester.email)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.4rem 0',
                borderBottom: `1px solid ${tokens.border}`,
                cursor: 'pointer',
              }}
            >
              <div>
                <p style={{ color: tokens.text, fontSize: '0.85rem' }}>{tester.full_name || tester.email}</p>
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
                  {tester.email} · {PLAN_LABELS[tester.beta_plan] || tester.beta_plan} Beta · läuft ab am{' '}
                  {formatDateTime(tester.beta_expires_at)}
                  {tester.remaining_days !== null && tester.status !== 'expired' ? ` (noch ${tester.remaining_days} Tage)` : ''}
                </p>
              </div>
              <Badge tone={tester.status === 'active' ? 'success' : tester.status === 'expiring_soon' ? 'danger' : 'neutral'}>
                {BETA_STATUS_LABELS[tester.status] || tester.status}
              </Badge>
            </div>
          ))}
        </Card>
      )}

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table className="vt-user-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {['E-Mail', 'Name', 'Rolle', 'Tarif', 'Status', 'Löschung', 'Registriert', 'Letzte Anmeldung', ''].map((label) => (
                  <th key={label} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr
                  key={user.email}
                  onClick={() => openDetail(user.email)}
                  style={{ borderBottom: `1px solid ${tokens.border}`, cursor: 'pointer' }}
                >
                  <td data-label="E-Mail" style={{ padding: '0.6rem 0.9rem', color: tokens.text, fontWeight: 600 }}>
                    {user.email}
                  </td>
                  <td data-label="Name" style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {user.full_name || '—'}
                  </td>
                  <td data-label="Rolle" style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {user.role || '—'}
                  </td>
                  <td data-label="Tarif" style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={user.plan === 'free' ? 'neutral' : 'success'}>{PLAN_LABELS[user.plan] || user.plan}</Badge>
                  </td>
                  <td data-label="Status" style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={user.suspended ? 'danger' : 'success'}>{user.suspended ? 'Deaktiviert' : 'Aktiv'}</Badge>
                  </td>
                  <td data-label="Löschung" style={{ padding: '0.6rem 0.9rem' }}>
                    {user.deletion_requested_at ? (
                      <Badge tone="danger">Angefragt</Badge>
                    ) : (
                      <span style={{ color: tokens.mutedMore }}>—</span>
                    )}
                  </td>
                  <td data-label="Registriert" style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {formatDateTime(user.created_at)}
                  </td>
                  <td data-label="Letzte Anmeldung" style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {formatDateTime(user.last_login_at)}
                  </td>
                  <td data-label="" style={{ padding: '0.6rem 0.9rem' }}>
                    <Button variant="secondary" onClick={() => openDetail(user.email)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>
                    Keine Nutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Zurück
        </Button>
        <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>
          Seite {page} von {totalPages} ({total} Nutzer)
        </span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Weiter
        </Button>
      </div>

      {selectedEmail && (
        <Card style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ color: tokens.text, fontWeight: 700 }}>{selectedEmail}</p>
            <Button variant="secondary" onClick={() => setSelectedEmail(null)}>
              Schließen
            </Button>
          </div>

          {!detail && <Loading />}

          {detail && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Account</p>
                {detail.user.id !== undefined && (
                  <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                    Benutzer-ID: <strong style={{ color: tokens.text }}>{detail.user.id}</strong>
                  </p>
                )}
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Admin-Rolle: <strong style={{ color: tokens.text }}>{detail.admin_role || 'keine'}</strong>
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Tarif: <strong style={{ color: tokens.text }}>{PLAN_LABELS[detail.user.plan] || detail.user.plan}</strong>
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Status: <strong style={{ color: tokens.text }}>{STATUS_LABELS[detail.user.status] || detail.user.status}</strong>
                  {detail.user.suspended && ` (${detail.user.suspended_reason || 'kein Grund angegeben'})`}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Beta-Zugang: <strong style={{ color: tokens.text }}>{detail.user.beta_access ? 'ja (kostenlos aktiviert, keine Zahlung)' : 'nein'}</strong>
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Registriert am: {formatDateTime(detail.user.created_at)}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Letzte Anmeldung: {formatDateTime(detail.user.last_login_at)}
                </p>
              </div>

              {(canManageUsers || canManagePremium) && (
                <div>
                  <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Account-Aktionen
                  </p>

                  {canManageUsers && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      {detail.user.suspended ? (
                        <Button
                          disabled={busy}
                          onClick={() => runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/unsuspend`, 'POST')}
                        >
                          Account reaktivieren
                        </Button>
                      ) : (
                        <Button variant="danger" disabled={busy} onClick={() => suspendUser(selectedEmail)}>
                          Account deaktivieren
                        </Button>
                      )}
                    </div>
                  )}

                  {canManagePremium && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Tarif ändern (administrativ, keine Stripe-Zahlung):</span>
                      {PLAN_OPTIONS.map((plan) => (
                        <Button
                          key={plan}
                          variant={detail.user.plan === plan ? 'primary' : 'secondary'}
                          disabled={busy}
                          onClick={() =>
                            runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/plan`, 'POST', { plan })
                          }
                        >
                          {PLAN_LABELS[plan]}
                        </Button>
                      ))}
                    </div>
                  )}

                  {canManagePremium && (
                    <div
                      style={{
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '0.6rem',
                        padding: '0.75rem',
                        marginBottom: '0.6rem',
                      }}
                    >
                      <p style={{ color: tokens.text, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        Beta Tester Programm
                      </p>
                      <p style={{ color: tokens.muted, fontSize: '0.78rem', marginBottom: '0.6rem' }}>
                        Zeitlich befristeter Pro/Family/Premium-Zugang für ausgewählte Tester — überschreibt niemals den
                        echten Tarif oben und rührt keine Stripe-Zahlung an.
                      </p>

                      {detail.user.beta_grant ? (
                        <p style={{ color: tokens.muted, fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                          {detail.user.beta_grant.active ? '✅ Aktiv: ' : '⚠️ Abgelaufen: '}
                          <strong style={{ color: tokens.text }}>{PLAN_LABELS[detail.user.beta_grant.plan] || detail.user.beta_grant.plan} · Beta-Tester</strong>
                          {' — läuft ab am '}
                          {formatDateTime(detail.user.beta_grant.expires_at)}
                          {detail.user.beta_grant.active ? ` (noch ${detail.user.beta_grant.remaining_days} Tage)` : ''}
                          {detail.user.beta_grant.granted_by ? ` · gewährt von ${detail.user.beta_grant.granted_by}` : ''}
                        </p>
                      ) : (
                        <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                          Kein Beta-Zugang gewährt.
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: tokens.muted, fontSize: '0.78rem' }}>Tarif:</span>
                        {BETA_PLAN_OPTIONS.map((plan) => (
                          <Button
                            key={plan}
                            variant={betaPlanChoice === plan ? 'primary' : 'secondary'}
                            disabled={busy}
                            onClick={() => {
                              setBetaPlanChoice(plan);
                              setBetaConfirmPending(null);
                            }}
                          >
                            {PLAN_LABELS[plan]} Beta
                          </Button>
                        ))}
                        <span style={{ color: tokens.muted, fontSize: '0.78rem', marginLeft: '0.5rem' }}>Dauer:</span>
                        {BETA_DURATION_OPTIONS.map((days) => (
                          <Button
                            key={days}
                            variant={betaDays === days ? 'primary' : 'secondary'}
                            disabled={busy}
                            onClick={() => {
                              setBetaDays(days);
                              setBetaConfirmPending(null);
                            }}
                          >
                            {days} Tage
                          </Button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {betaConfirmPending === 'grant' ? (
                          <>
                            <Button
                              variant="danger"
                              disabled={busy}
                              onClick={async () => {
                                await runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/beta/grant`, 'POST', {
                                  plan: betaPlanChoice,
                                  days: betaDays,
                                });
                                setBetaConfirmPending(null);
                              }}
                            >
                              Bestätigen: {PLAN_LABELS[betaPlanChoice]} Beta für {betaDays} Tage gewähren
                            </Button>
                            <Button variant="secondary" disabled={busy} onClick={() => setBetaConfirmPending(null)}>
                              Abbrechen
                            </Button>
                          </>
                        ) : (
                          <Button variant="secondary" disabled={busy} onClick={() => setBetaConfirmPending('grant')}>
                            {detail.user.beta_grant ? 'Beta-Zugang neu setzen' : 'Beta-Zugang gewähren'}
                          </Button>
                        )}

                        {detail.user.beta_grant && (
                          <>
                            {betaConfirmPending === 'extend' ? (
                              <>
                                <Button
                                  variant="danger"
                                  disabled={busy}
                                  onClick={async () => {
                                    await runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/beta/extend`, 'POST', {
                                      days: betaDays,
                                    });
                                    setBetaConfirmPending(null);
                                  }}
                                >
                                  Bestätigen: um {betaDays} Tage verlängern
                                </Button>
                                <Button variant="secondary" disabled={busy} onClick={() => setBetaConfirmPending(null)}>
                                  Abbrechen
                                </Button>
                              </>
                            ) : (
                              <Button variant="secondary" disabled={busy} onClick={() => setBetaConfirmPending('extend')}>
                                Verlängern
                              </Button>
                            )}

                            {betaConfirmPending === 'revoke' ? (
                              <>
                                <Button
                                  variant="danger"
                                  disabled={busy}
                                  onClick={async () => {
                                    await runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/beta/revoke`, 'POST');
                                    setBetaConfirmPending(null);
                                  }}
                                >
                                  Bestätigen: Beta-Zugang widerrufen
                                </Button>
                                <Button variant="secondary" disabled={busy} onClick={() => setBetaConfirmPending(null)}>
                                  Abbrechen
                                </Button>
                              </>
                            ) : (
                              <Button variant="danger" disabled={busy} onClick={() => setBetaConfirmPending('revoke')}>
                                Widerrufen
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {canManageUsers && detail.user.deletion_requested_at && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <p style={{ color: tokens.muted, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        Löschanforderung vom {formatDateTime(detail.user.deletion_requested_at)}.
                      </p>
                      <Button variant="danger" disabled={busy} onClick={() => completeDeletion(selectedEmail)}>
                        Löschung abschließen
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {canManageRoles && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Admin-Rolle setzen:</span>
                  {ROLE_OPTIONS.map((role) => (
                    <Button
                      key={role}
                      variant={detail.admin_role === role ? 'primary' : 'secondary'}
                      disabled={busy}
                      onClick={() =>
                        runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/role`, 'POST', { role })
                      }
                    >
                      {role}
                    </Button>
                  ))}
                  {detail.admin_role && (
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/role`, 'DELETE')}
                    >
                      Rolle entfernen
                    </Button>
                  )}
                </div>
              )}

              <div>
                <p style={{ color: tokens.text, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Letzte Logins
                </p>
                {detail.recent_logins.length === 0 && (
                  <p style={{ color: tokens.mutedMore, fontSize: '0.8rem' }}>Keine Login-Historie vorhanden.</p>
                )}
                {detail.recent_logins.map((login, index) => (
                  <p key={index} style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                    {login.success ? '✅' : '❌'} {login.created_at} · {login.ip_address || 'unbekannte IP'}
                  </p>
                ))}
              </div>

              {canManageUsers && principal.role === 'super_admin' && detail.admin_role !== 'super_admin' && (
                <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: '1rem' }}>
                  <p style={{ color: tokens.danger, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Gefahrenzone
                  </p>
                  <Button variant="danger" disabled={busy} onClick={() => deleteUserDirectly(selectedEmail)}>
                    Nutzer endgültig löschen
                  </Button>
                  <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    Löscht Konto und alle Daten sofort, unabhängig von einer eigenen Löschanfrage des Nutzers. Nur
                    Super-Admins können diese Aktion ausführen.
                  </p>
                </div>
              )}
              {canManageUsers && principal.role !== 'super_admin' && detail.admin_role !== 'super_admin' && (
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
                  Nutzer endgültig löschen können aus Sicherheitsgründen nur Super-Admins.
                </p>
              )}
              {canManageUsers && detail.admin_role === 'super_admin' && (
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
                  Super-Admin-Konten können aus Sicherheitsgründen nicht gelöscht werden.
                </p>
              )}

              {actionMessage && <p style={{ color: tokens.accent, fontSize: '0.85rem' }}>{actionMessage}</p>}
            </div>
          )}
        </Card>
      )}
      <style jsx>{`
        @media (max-width: 760px) {
          :global(.vt-user-table thead) {
            display: none;
          }
          :global(.vt-user-table),
          :global(.vt-user-table tbody),
          :global(.vt-user-table tr),
          :global(.vt-user-table td) {
            display: block;
            width: 100%;
          }
          :global(.vt-user-table tr) {
            padding: 0.75rem 0.9rem;
          }
          :global(.vt-user-table td) {
            padding: 0.25rem 0 !important;
            text-align: left;
          }
          :global(.vt-user-table td[data-label]:not([data-label=''])::before) {
            content: attr(data-label);
            display: block;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${tokens.mutedMore};
            margin-bottom: 0.1rem;
          }
          :global(.vt-user-table td[data-label='']) {
            margin-top: 0.4rem;
          }
        }
      `}</style>
    </div>
  );
}
