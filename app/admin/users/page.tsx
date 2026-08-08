'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type UserListItem = {
  email: string;
  full_name: string | null;
  premium: boolean;
  suspended: boolean;
  created_at: string | null;
};

type UserDetail = {
  user: UserListItem & { suspended_reason?: string | null };
  consents: Record<string, { granted?: boolean }>;
  admin_role: string | null;
  recent_logins: { success: boolean; ip_address: string | null; created_at: string }[];
};

type DeletionRequest = { email: string; display_name: string | null; deletion_requested_at: string };

const ROLE_OPTIONS = ['super_admin', 'admin', 'support', 'moderator', 'editor', 'analyst', 'developer'];

export default function AdminUsersPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
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

  const canManageUsers = hasPermission('manage_users');
  const canManageRoles = hasPermission('manage_roles');
  const canManagePremium = hasPermission('manage_premium');

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
    if (!window.confirm(`Konto ${email} und ALLE zugehörigen Daten endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) {
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

  const openDetail = async (email: string) => {
    setSelectedEmail(email);
    setDetail(null);
    setActionMessage('');
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
      await Promise.all([loadUsers(), openDetail(selectedEmail)]);
    } catch {
      setActionMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
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
      <SectionTitle title="Nutzerverwaltung" subtitle="Suche, Sperren/Entsperren, Rollen, Premium-Status. Passwörter werden nie angezeigt." />

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

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {['E-Mail', 'Name', 'Premium', 'Status', ''].map((label) => (
                  <th key={label} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.email} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{user.email}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{user.full_name || '—'}</td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={user.premium ? 'success' : 'neutral'}>{user.premium ? 'Premium' : 'Standard'}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={user.suspended ? 'danger' : 'success'}>{user.suspended ? 'Gesperrt' : 'Aktiv'}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <Button variant="secondary" onClick={() => openDetail(user.email)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>
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
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Admin-Rolle: <strong style={{ color: tokens.text }}>{detail.admin_role || 'keine'}</strong>
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                  Gesperrt: {detail.user.suspended ? `ja (${detail.user.suspended_reason || 'kein Grund angegeben'})` : 'nein'}
                </p>
              </div>

              {canManageUsers && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {detail.user.suspended ? (
                    <Button
                      disabled={busy}
                      onClick={() => runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/unsuspend`, 'POST')}
                    >
                      Entsperren
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() =>
                        runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/suspend`, 'POST', {
                          reason: 'Über Admin Control Center gesperrt',
                        })
                      }
                    >
                      Sperren
                    </Button>
                  )}
                </div>
              )}

              {canManagePremium && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      runAction(`/api/admin/users/${encodeURIComponent(selectedEmail)}/premium`, 'POST', {
                        premium: !detail.user.premium,
                      })
                    }
                  >
                    {detail.user.premium ? 'Premium entziehen' : 'Premium gewähren'}
                  </Button>
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

              {canManageUsers && detail.admin_role !== 'super_admin' && (
                <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: '1rem' }}>
                  <p style={{ color: tokens.danger, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Gefahrenzone
                  </p>
                  <Button variant="danger" disabled={busy} onClick={() => deleteUserDirectly(selectedEmail)}>
                    Nutzer endgültig löschen
                  </Button>
                  <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    Löscht Konto und alle Daten sofort, unabhängig von einer eigenen Löschanfrage des Nutzers.
                  </p>
                </div>
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
    </div>
  );
}
