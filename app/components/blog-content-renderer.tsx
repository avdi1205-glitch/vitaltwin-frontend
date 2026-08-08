import type { ReactNode } from 'react';

export function excerptFromBody(body: string | null | undefined, maxLength = 200): string {
  if (!body) return '';
  const plain = body.replace(/^#+\s.*$/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}

export function formatContentDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

// The CMS stores body as plain text with lightweight "## "/"### "/"- "
// markers and blank-line paragraph breaks — deliberately no markdown
// library dependency, no `dangerouslySetInnerHTML` anywhere (so there is no
// HTML/script-injection surface at all, by construction rather than by
// sanitization).
export function renderContentBody(body: string): ReactNode[] {
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
