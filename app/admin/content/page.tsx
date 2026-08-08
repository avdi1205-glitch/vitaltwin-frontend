'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type ContentItem = {
  id: string;
  content_type: string;
  slug: string | null;
  title: string;
  body: string | null;
  status: string;
  created_by: string | null;
  updated_at: string | null;
  published_at: string | null;
};

const CONTENT_TYPES = ['blog', 'faq', 'landing_page', 'help_page', 'notification'];
const STATUSES = ['draft', 'published', 'archived'];

export default function AdminContentPage() {
  const router = useRouter();
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_content');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ content_type: 'blog', title: '', slug: '', body: '', status: 'draft' });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('content_type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const query = params.toString();
      const response = await authFetch(`/api/admin/content${query ? `?${query}` : ''}`);
      if (!response.ok) {
        setErrorMessage('Inhalte konnten nicht geladen werden.');
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, filterType, filterStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  const createItem = async () => {
    if (!form.title.trim()) return;
    setMessage('');
    try {
      const response = await authFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: form.content_type,
          title: form.title,
          slug: form.slug || null,
          body: form.body || null,
          status: form.status,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Anlegen fehlgeschlagen.');
        return;
      }
      setForm({ content_type: 'blog', title: '', slug: '', body: '', status: 'draft' });
      setMessage('Inhalt angelegt. Öffne ihn in der Liste, um ihn zu bearbeiten.');
      await loadItems();
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    }
  };

  const publishItem = async (id: string) => {
    setBusyId(id);
    try {
      const response = await authFetch(`/api/admin/content/${id}/publish`, { method: 'POST' });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Veröffentlichen fehlgeschlagen.');
        return;
      }
      await loadItems();
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteItem = async (item: ContentItem) => {
    if (!window.confirm(`"${item.title}" wirklich endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setBusyId(item.id);
    try {
      await authFetch(`/api/admin/content/${item.id}`, { method: 'DELETE' });
      await loadItems();
    } catch {
      setMessage('Löschen fehlgeschlagen.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Content Management"
        subtitle="Blog, FAQ, Landing Pages, Hilfeseiten und Benachrichtigungen — ein gemeinsames Modell."
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant={filterType === '' ? 'primary' : 'secondary'} onClick={() => setFilterType('')}>
          Alle
        </Button>
        {CONTENT_TYPES.map((type) => (
          <Button key={type} variant={filterType === type ? 'primary' : 'secondary'} onClick={() => setFilterType(type)}>
            {type}
          </Button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Button variant={filterStatus === '' ? 'primary' : 'secondary'} onClick={() => setFilterStatus('')}>
          Alle Status
        </Button>
        {STATUSES.map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {message && <p style={{ color: tokens.accent, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{message}</p>}

      {!loading && !errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {items.map((item) => (
            <Card key={item.id} style={{ padding: '1rem 1.2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem' }}>
                <Link
                  href={`/admin/content/${item.id}`}
                  style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}
                >
                  {item.title}
                </Link>
                <Badge tone={item.status === 'published' ? 'success' : item.status === 'archived' ? 'neutral' : 'danger'}>
                  {item.status}
                </Badge>
              </div>
              <p style={{ color: tokens.mutedMore, fontSize: '0.78rem', marginTop: '0.3rem' }}>
                {item.content_type} · erstellt von {item.created_by || 'unbekannt'} · zuletzt geändert{' '}
                {item.updated_at || '—'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <Button variant="secondary" onClick={() => router.push(`/admin/content/${item.id}`)}>
                  Öffnen
                </Button>
                <Button variant="secondary" onClick={() => window.open(`/admin/content/${item.id}/preview`, '_blank')}>
                  Vorschau
                </Button>
                {canManage && item.status !== 'published' && (
                  <Button disabled={busyId === item.id} onClick={() => publishItem(item.id)}>
                    Veröffentlichen
                  </Button>
                )}
                {canManage && (
                  <Button variant="danger" disabled={busyId === item.id} onClick={() => deleteItem(item)}>
                    Löschen
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <Card style={{ textAlign: 'center', color: tokens.mutedMore }}>Keine Inhalte vorhanden.</Card>
          )}
        </div>
      )}

      {canManage && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Neuen Inhalt anlegen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
            <select
              value={form.content_type}
              onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
              style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem', color: tokens.text }}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem', color: tokens.text }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              placeholder="Titel"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem', color: tokens.text }}
            />
            <input
              placeholder="Slug (optional)"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem', color: tokens.text }}
            />
          </div>
          <textarea
            placeholder="Inhalt (optional — kann nach dem Anlegen bequem im Editor ergänzt werden)"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            style={{
              width: '100%',
              marginTop: '0.6rem',
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: tokens.text,
            }}
          />
          <div style={{ marginTop: '0.75rem' }}>
            <Button onClick={createItem}>Anlegen</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

