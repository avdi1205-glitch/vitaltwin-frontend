import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import PublicFooter from '../../components/PublicFooter';
import { excerptFromBody, formatContentDate, renderContentBody } from '../../components/blog-content-renderer';

export const revalidate = 3600;

type BlogPost = {
  slug: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string | null;
};

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(apiUrl(`/api/content/blog/${encodeURIComponent(slug)}`), {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string | null): string {
  return formatContentDate(iso);
}

function excerpt(body: string | null, maxLength = 160): string {
  return excerptFromBody(body, maxLength);
}

function renderBody(body: string) {
  return renderContentBody(body);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Artikel nicht gefunden | VitalTwin' };
  return {
    title: `${post.title} | VitalTwin Blog`,
    description: excerpt(post.body),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const showUpdatedDate =
    post.updated_at &&
    post.published_at &&
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 24 * 60 * 60 * 1000;

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <Link href="/blog" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          ← Alle Artikel
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">
          VitalTwin Redaktion
          {post.published_at ? ` · Veröffentlicht am ${formatDate(post.published_at)}` : ''}
          {showUpdatedDate ? ` · Aktualisiert am ${formatDate(post.updated_at)}` : ''}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-[#B7BDC4]">{post.excerpt}</p>}

        <article className="mt-8">{renderBody(post.body || '')}</article>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-[#8E969F]">
          Dieser Artikel dient der allgemeinen Wellness-Orientierung und ersetzt keine medizinische Beratung, Diagnose
          oder Therapie. Bei gesundheitlichen Beschwerden wende dich an qualifiziertes medizinisches Fachpersonal.
        </div>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
