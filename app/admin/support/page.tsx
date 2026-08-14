'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type FeedbackItem = { score?: number; message?: string; source?: string | null; created_at?: string };
type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};
type BetaApplication = {
  id: number;
  email: string;
  full_name: string;
  age: number | null;
  motivation: string;
  source: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

const CONTACT_STATUSES = ['new', 'beantwortet', 'archiviert'] as const;

export default function AdminSupportPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManageSupport = hasPermission('manage_support');

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactStatusFilter, setContactStatusFilter] = useState('');
  const [contactBusyId, setContactBusyId] = useState<string | null>(null);

  const [betaApplications, setBetaApplications] = useState<BetaApplication[]>([]);
  const [betaTotal, setBetaTotal] = useState(0);
  const [betaBusyId, setBetaBusyId] = useState<number | null>(null);
  const [betaActionMessage, setBetaActionMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authFetch(`/api/admin/support/feedback?page=${page}&page_size=20`);
      if (!response.ok) {
        setErrorMessage('Support-Daten konnten nicht geladen werden.');
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setNote(data.note || '');
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, page]);

  const loadContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '1', page_size: '20' });
      if (contactStatusFilter) params.set('status', contactStatusFilter);
      const response = await authFetch(`/api/admin/support/contacts?${params.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      setContacts(Array.isArray(data.items) ? data.items : []);
      setContactsTotal(typeof data.total === 'number' ? data.total : 0);
    } catch {
      // Non-fatal — feedback section already loaded.
    }
  }, [authFetch, contactStatusFilter]);

  const loadBetaApplications = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/support/beta-applications?page=1&page_size=20');
      if (!response.ok) return;
      const data = await response.json();
      setBetaApplications(Array.isArray(data.items) ? data.items : []);
      setBetaTotal(typeof data.total === 'number' ? data.total : 0);
    } catch {
      // Non-fatal — feedback section already loaded.
    }
  }, [authFetch]);

  const reviewBetaApplication = async (application: BetaApplication, action: 'approve' | 'reject') => {
    setBetaBusyId(application.id);
    setBetaActionMessage('');
    try {
      const response = await authFetch(`/api/admin/support/beta-applications/${application.id}/${action}`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setBetaActionMessage(data?.detail || 'Aktion fehlgeschlagen.');
        return;
      }
      setBetaActionMessage(data?.message || 'Aktion erfolgreich.');
      await loadBetaApplications();
    } catch {
      setBetaActionMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBetaBusyId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContacts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContacts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBetaApplications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBetaApplications]);

  const updateContactStatus = async (id: string, status: string) => {
    setContactBusyId(id);
    try {
      const response = await authFetch(`/api/admin/support/contacts/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) await loadContacts();
    } finally {
      setContactBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <SectionTitle title="Support Center" subtitle="Nutzer-Feedback, Bug Reports, Feature-Wünsche, Kontaktanfragen und Beta-Bewerbungen." />

      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ color: tokens.text, fontWeight: 700 }}>Kontaktanfragen ({contactsTotal})</p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Button variant={contactStatusFilter === '' ? 'primary' : 'secondary'} onClick={() => setContactStatusFilter('')}>
              Alle
            </Button>
            {CONTACT_STATUSES.map((status) => (
              <Button
                key={status}
                variant={contactStatusFilter === status ? 'primary' : 'secondary'}
                onClick={() => setContactStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
        {contacts.length === 0 && (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Kontaktanfragen vorhanden.</p>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} style={{ padding: '0.6rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>
                  {contact.full_name} · {contact.email}
                </p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>{contact.subject || 'Kein Betreff'}</p>
                <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.25rem' }}>{contact.message}</p>
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.25rem' }}>{contact.created_at}</p>
              </div>
              <Badge tone={contact.status === 'new' ? 'danger' : contact.status === 'beantwortet' ? 'success' : 'neutral'}>
                {contact.status}
              </Badge>
            </div>
            {canManageSupport && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {CONTACT_STATUSES.filter((status) => status !== contact.status).map((status) => (
                  <Button
                    key={status}
                    variant="secondary"
                    disabled={contactBusyId === contact.id}
                    onClick={() => updateContactStatus(contact.id, status)}
                  >
                    Als &quot;{status}&quot; markieren
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>
          Beta-Bewerbungen ({betaTotal})
        </p>
        {betaApplications.length === 0 && (
          <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Beta-Bewerbungen vorhanden.</p>
        )}
        {betaApplications.map((application) => (
          <div key={application.id} style={{ padding: '0.6rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ color: tokens.text, fontSize: '0.85rem', fontWeight: 600 }}>
                {application.full_name} · {application.email} {application.age ? `· ${application.age} Jahre` : ''}
              </p>
              <Badge tone={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'danger' : 'neutral'}>
                {application.status}
              </Badge>
            </div>
            <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.25rem' }}>{application.motivation}</p>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {application.source || 'unbekannte Quelle'} · {application.created_at}
            </p>
            {canManageSupport && application.status === 'pending' && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <Button variant="primary" disabled={betaBusyId === application.id} onClick={() => reviewBetaApplication(application, 'approve')}>
                  Beta freigeben (90 Tage Pro)
                </Button>
                <Button variant="secondary" disabled={betaBusyId === application.id} onClick={() => reviewBetaApplication(application, 'reject')}>
                  Ablehnen
                </Button>
              </div>
            )}
          </div>
        ))}
        {betaActionMessage && <Note>{betaActionMessage}</Note>}
      </Card>

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {!loading && !errorMessage && (
        <>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Feedback</p>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  {['Score', 'Nachricht', 'Quelle', 'Datum'].map((label) => (
                    <th key={label} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{item.score ?? '—'}</td>
                    <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{item.message || '—'}</td>
                    <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{item.source || '—'}</td>
                    <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{item.created_at || '—'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>
                      Kein Feedback vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Zurück
            </Button>
            <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>
              Seite {page} von {totalPages} ({total} Einträge)
            </span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Weiter
            </Button>
          </div>
          {note && <Note>{note}</Note>}
        </>
      )}
    </div>
  );
}
