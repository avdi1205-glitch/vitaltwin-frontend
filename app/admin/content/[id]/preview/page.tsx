'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdmin } from '../../../_lib/AdminContext';
import { Badge, Loading } from '../../../_lib/AdminUI';
import { excerptFromBody, formatContentDate, renderContentBody } from '../../../../components/blog-content-renderer';

type ContentItem = {
  id: string;
  content_type: string;
  slug: string | null;
  title: string;
  body: string | null;
  status: string;
  published_at: string | null;
};

export default function AdminContentPreviewPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAdmin();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authFetch(`/api/admin/content/${params.id}`);
      if (!isMountedRef.current) return;
      if (!response.ok) {
        setErrorMessage(response.status === 404 ? 'Inhalt nicht gefunden.' : 'Vorschau konnte nicht geladen werden.');
        return;
      }
      setItem(await response.json());
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

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[#F3C979]/40 bg-[#F3C979]/10 px-4 py-3 text-sm text-[#F3C979]">
          <span>Admin-Vorschau — nicht öffentlich sichtbar, solange der Status nicht &quot;published&quot; ist.</span>
          <Link href={`/admin/content/${params.id}`} className="underline hover:text-[#F5F2EA]">
            Zurück zum Editor
          </Link>
        </div>

        {loading && <Loading />}
        {errorMessage && <p className="text-red-400">{errorMessage}</p>}

        {!loading && !errorMessage && item && (
          <article>
            <div className="mb-4 flex items-center gap-3">
              <Badge tone={item.status === 'published' ? 'success' : 'danger'}>{item.status}</Badge>
              {item.slug && <span className="text-xs text-[#8E969F]">/blog/{item.slug}</span>}
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">
              VitalTwin Redaktion{item.published_at ? ` · ${formatContentDate(item.published_at)}` : ''}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">
              {item.title}
            </h1>
            <div className="mt-8">{renderContentBody(item.body || '')}</div>
            <p className="mt-6 text-xs text-[#8E969F]">Meta-Beschreibung (Vorschau): {excerptFromBody(item.body, 160)}</p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-[#8E969F]">
              Dieser Artikel dient der allgemeinen Wellness-Orientierung und ersetzt keine medizinische Beratung,
              Diagnose oder Therapie.
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
