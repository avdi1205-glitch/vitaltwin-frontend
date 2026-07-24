'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Button, Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type FeedbackItem = { score?: number; message?: string; source?: string | null; created_at?: string };

export default function AdminSupportPage() {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <SectionTitle title="Support Center" subtitle="Nutzer-Feedback, Bug Reports und Feature-Wünsche." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {!loading && !errorMessage && (
        <>
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
