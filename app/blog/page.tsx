import Link from 'next/link';
import type { Metadata } from 'next';
import { apiUrl } from '@/lib/api';
import PublicFooter from '../components/PublicFooter';

export const metadata: Metadata = {
  title: 'Blog | VitalTwin',
  description:
    'Verständliche Artikel zu Schlaf, Bewegung, Ernährung, Gewohnheiten, Wearables und Datenschutz bei Wellness-Apps.',
};

export const revalidate = 3600;

type BlogListItem = {
  slug: string;
  title: string;
  body: string | null;
  published_at: string | null;
};

async function getPublishedPosts(): Promise<BlogListItem[]> {
  try {
    const response = await fetch(apiUrl('/api/content/blog?page_size=50'), { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

function excerpt(body: string | null, maxLength = 200): string {
  if (!body) return '';
  const plain = body.replace(/^#+\s.*$/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <Link href="/" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          ← Zur Startseite
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">Ratgeber</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
          VitalTwin Blog
        </h1>
        <p className="mt-4 max-w-2xl text-[#B7BDC4]">
          Verständliche, ehrliche Artikel zu Schlaf, Bewegung, Ernährung, Gewohnheiten, Wearables und Datenschutz —
          ohne Heilversprechen, ohne erfundene Studien.
        </p>

        {posts.length === 0 && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[#8E969F]">
            Wir arbeiten gerade an den ersten Artikeln. Schau bald wieder vorbei.
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#58D7D4]/50"
            >
              {post.published_at && (
                <p className="text-xs uppercase tracking-widest text-[#8E969F]">{formatDate(post.published_at)}</p>
              )}
              <h2 className="mt-2 text-xl font-semibold text-[#F5F2EA]">{post.title}</h2>
              <p className="mt-3 text-sm text-[#B7BDC4]">{excerpt(post.body)}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#58D7D4]">Weiterlesen →</span>
            </Link>
          ))}
        </div>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
