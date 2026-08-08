'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdmin } from '../../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, SectionTitle } from '../../_lib/AdminUI';

type ContentItem = {
  id: string;
  content_type: string;
  slug: string | null;
  title: string;
  body: string | null;
  status: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
};

const CONTENT_TYPES = ['blog', 'faq', 'landing_page', 'help_page', 'notification'];

export default function AdminContentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_content');

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [status, setStatus] = useState('draft');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkup = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const nextBody = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    setBody(nextBody);
    window.setTimeout(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const insertHeading = () => insertMarkup('\n\n## ', '', 'Überschrift');
  const insertBold = () => insertMarkup('**', '**', 'fetter Text');
  const insertList = () => insertMarkup('\n\n- ', '', 'Listenpunkt');
  const insertLink = () => insertMarkup('[', '](https://)', 'Linktext');
  const insertParagraph = () => insertMarkup('\n\n', '', '');

  const applyItem = (data: ContentItem) => {
    setItem(data);
    setTitle(data.title || '');
    setSlug(data.slug || '');
    setContentType(data.content_type || 'blog');
    setStatus(data.status || 'draft');
    setBody(data.body || '');
    setExcerpt(data.excerpt || '');
    setCategory(data.category || '');
    setTags((data.tags || []).join(', '));
    setMetaTitle(data.meta_title || '');
    setMetaDescription(data.meta_description || '');
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authFetch(`/api/admin/content/${params.id}`);
      if (!isMountedRef.current) return;
      if (!response.ok) {
        setErrorMessage(response.status === 404 ? 'Inhalt nicht gefunden.' : 'Inhalt konnte nicht geladen werden.');
        return;
      }
      applyItem(await response.json());
    } catch {
      if (isMountedRef.current) setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [authFetch, params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const buildPayload = () => ({
    content_type: contentType,
    title,
    slug: slug.trim() || null,
    body: body.trim() || null,
    status,
    excerpt: excerpt.trim() || null,
    category: category.trim() || null,
    tags: tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    meta_title: metaTitle.trim() || null,
    meta_description: metaDescription.trim() || null,
  });

  const save = async (overrideStatus?: string) => {
    setBusy(true);
    setMessage('');
    try {
      const response = await authFetch(`/api/admin/content/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), status: overrideStatus || status }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Speichern fehlgeschlagen.');
        return;
      }
      applyItem(json);
      setMessage('Gespeichert.');
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await authFetch(`/api/admin/content/${params.id}/publish`, { method: 'POST' });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Veröffentlichen fehlgeschlagen.');
        return;
      }
      applyItem(json);
      setMessage('Veröffentlicht.');
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await authFetch(`/api/admin/content/${params.id}/unpublish`, { method: 'POST' });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Zurücksetzen fehlgeschlagen.');
        return;
      }
      applyItem(json);
      setMessage('Zurück auf Entwurf gesetzt.');
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`"${title}" wirklich endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setBusy(true);
    try {
      const response = await authFetch(`/api/admin/content/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/admin/content');
      } else {
        setMessage('Löschen fehlgeschlagen.');
      }
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  const readyToPublish = Boolean(title.trim() && slug.trim() && body.trim());

  return (
    <div>
      <SectionTitle title="Inhalt bearbeiten" subtitle="Content Management — einzelner Datensatz" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href="/admin/content" style={{ color: tokens.muted, fontSize: '0.85rem' }}>
          ← Zurück zur Übersicht
        </Link>
        {item && (
          <Link
            href={`/admin/content/${item.id}/preview`}
            target="_blank"
            style={{ color: tokens.accent, fontSize: '0.85rem', fontWeight: 600 }}
          >
            Vorschau öffnen →
          </Link>
        )}
      </div>

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && item && (
        <Card>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Badge tone={status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'danger'}>
              {status}
            </Badge>
            <span style={{ color: tokens.mutedMore, fontSize: '0.8rem' }}>
              Erstellt von {item.created_by || 'unbekannt'} · zuletzt geändert {item.updated_at || '—'}
              {item.published_at ? ` · veröffentlicht ${item.published_at}` : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Titel</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Content Type</span>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Kategorie (optional)</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Tags (kommagetrennt, optional)</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem' }}>
            <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Excerpt (optional, kurze Zusammenfassung)</span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.6rem 0.8rem', color: tokens.text, resize: 'vertical' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem' }}>
            <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>
              Artikelinhalt ({body.trim().split(/\s+/).filter(Boolean).length} Wörter) — Absätze durch Leerzeile
              trennen, &quot;## Überschrift&quot; für Zwischenüberschriften, &quot;- Punkt&quot; für Listen
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={insertHeading}>Überschrift</Button>
              <Button variant="secondary" onClick={insertBold}>Fett</Button>
              <Button variant="secondary" onClick={insertList}>Liste</Button>
              <Button variant="secondary" onClick={insertLink}>Link</Button>
              <Button variant="secondary" onClick={insertParagraph}>Absatz</Button>
            </div>
            <textarea
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={24}
              style={{
                background: tokens.card,
                border: `1px solid ${tokens.border}`,
                borderRadius: '0.5rem',
                padding: '0.8rem 1rem',
                color: tokens.text,
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                resize: 'vertical',
                minHeight: '420px',
                width: '100%',
              }}
            />
          </label>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Meta Title (SEO, optional)</span>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>Meta Description (SEO, optional)</span>
              <input
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: '0.5rem', padding: '0.5rem 0.7rem', color: tokens.text }}
              />
            </label>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <Button disabled={busy} onClick={() => save()}>Speichern</Button>
              {status !== 'published' && (
                <Button
                  disabled={busy || !readyToPublish}
                  onClick={publish}
                  variant={readyToPublish ? 'primary' : 'secondary'}
                >
                  Veröffentlichen
                </Button>
              )}
              {status === 'published' && (
                <Button disabled={busy} variant="secondary" onClick={unpublish}>
                  Zurück zu Entwurf
                </Button>
              )}
              {status !== 'archived' && (
                <Button disabled={busy} variant="secondary" onClick={() => save('archived')}>
                  Archivieren
                </Button>
              )}
              <Button disabled={busy} variant="secondary" onClick={() => router.push('/admin/content')}>
                Zurück
              </Button>
              <Button disabled={busy} variant="danger" onClick={remove}>
                Löschen
              </Button>
            </div>
          )}
          {!readyToPublish && status !== 'published' && (
            <p style={{ color: tokens.mutedMore, fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Titel, Slug und Inhalt müssen ausgefüllt sein, bevor veröffentlicht werden kann.
            </p>
          )}

          {message && <p style={{ color: tokens.accent, fontSize: '0.85rem', marginTop: '1rem' }}>{message}</p>}
        </Card>
      )}
    </div>
  );
}
