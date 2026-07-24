'use client';

import { useCallback, useEffect, useState } from 'react';
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
  published_at: string | null;
};

const CONTENT_TYPES = ['blog', 'faq', 'landing_page', 'help_page', 'notification'];
const STATUSES = ['draft', 'published', 'archived'];

export default function AdminContentPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_content');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ content_type: 'blog', title: '', slug: '', body: '', status: 'draft' });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = filterType ? `?content_type=${encodeURIComponent(filterType)}` : '';
      const response = await authFetch(`/api/admin/content${params}`);
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
  }, [authFetch, filterType]);

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
      setMessage('Inhalt angelegt.');
      await loadItems();
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await authFetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      await loadItems();
    } catch {
      setMessage('Löschen fehlgeschlagen.');
    }
  };

  return (
    <div>
      <SectionTitle
        title="Content Management"
        subtitle="Blog, FAQ, Landing Pages, Hilfeseiten und Benachrichtigungen — ein gemeinsames Modell."
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Button variant={filterType === '' ? 'primary' : 'secondary'} onClick={() => setFilterType('')}>
          Alle
        </Button>
        {CONTENT_TYPES.map((type) => (
          <Button key={type} variant={filterType === type ? 'primary' : 'secondary'} onClick={() => setFilterType(type)}>
            {type}
          </Button>
        ))}
      </div>

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && (
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {['Titel', 'Typ', 'Status', 'Erstellt von', ''].map((label) => (
                  <th key={label} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{item.title}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{item.content_type}</td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={item.status === 'published' ? 'success' : 'neutral'}>{item.status}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{item.created_by || '—'}</td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    {canManage && (
                      <Button variant="danger" onClick={() => deleteItem(item.id)}>
                        Löschen
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>
                    Keine Inhalte vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
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
            placeholder="Inhalt (optional)"
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
          {message && <p style={{ color: tokens.accent, fontSize: '0.85rem', marginTop: '0.5rem' }}>{message}</p>}
        </Card>
      )}
    </div>
  );
}
