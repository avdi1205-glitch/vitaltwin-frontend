import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import PublicFooter from '../../components/PublicFooter';

export const revalidate = 3600;

type BlogPost = {
  slug: string;
  title: string;
  body: string | null;
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
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

function excerpt(body: string | null, maxLength = 160): string {
  if (!body) return '';
  const plain = body.replace(/^#+\s.*$/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}

// The CMS stores body as plain text with lightweight "## "/"### " heading
// markers and blank-line paragraph breaks — no markdown library dependency
// needed for this simple, controlled content format.
function renderBody(body: string) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={index} className="mt-8 text-xl font-semibold text-[#F5F2EA]">
          {block.slice(4)}
        </h3>
      );
    }
    if (block.startsWith('## ')) {
      return (
        <h2 key={index} className="mt-10 text-2xl font-semibold text-[#F5F2EA]">
          {block.slice(3)}
        </h2>
      );
    }
    if (block.startsWith('- ')) {
      const items = block.split('\n').map((line) => line.replace(/^- /, ''));
      return (
        <ul key={index} className="mt-4 list-disc space-y-2 pl-5 text-[#B7BDC4]">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={index} className="mt-4 leading-relaxed text-[#B7BDC4]">
        {block}
      </p>
    );
  });
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

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <Link href="/blog" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          ← Alle Artikel
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">
          VitalTwin Redaktion{post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-4xl">
          {post.title}
        </h1>

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
