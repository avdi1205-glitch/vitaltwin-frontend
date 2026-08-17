import type { ReactNode } from 'react';

export function excerptFromBody(body: string | null | undefined, maxLength = 200): string {
  if (!body) return '';
  const plain = body
    .replace(/^#+\s.*$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}

export function formatContentDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

// Parses a single line of text for the small set of supported inline
// markers (**bold**, [text](url) links) into safe React nodes — never
// `dangerouslySetInnerHTML`, so there is no HTML/script-injection surface
// regardless of what an editor types into the textarea.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\(\s*(.+?)\s*\)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${index}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const url = match[3];
      if (isSafeUrl(url)) {
        nodes.push(
          <a
            key={`${keyPrefix}-l${index}`}
            href={url}
            target={url.startsWith('/') ? undefined : '_blank'}
            rel={url.startsWith('/') ? undefined : 'noopener noreferrer'}
            className="underline hover:text-[#58D7D4]"
          >
            {match[2]}
          </a>,
        );
      } else {
        nodes.push(match[2]);
      }
    }
    lastIndex = pattern.lastIndex;
    index += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

// The CMS stores body as plain text with lightweight "## "/"### "/"- "
// block markers, blank-line paragraph breaks, and inline "**bold**"/
// "[text](url)" markers — deliberately no markdown library dependency, no
// `dangerouslySetInnerHTML` anywhere (so there is no HTML/script-injection
// surface at all, by construction rather than by sanitization).
export function renderContentBody(body: string): ReactNode[] {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={index} className="mt-8 text-xl font-semibold text-[#F5F2EA]">
          {renderInline(block.slice(4), `h3-${index}`)}
        </h3>
      );
    }
    if (block.startsWith('## ')) {
      return (
        <h2 key={index} className="mt-10 text-2xl font-semibold text-[#F5F2EA]">
          {renderInline(block.slice(3), `h2-${index}`)}
        </h2>
      );
    }
    if (block.startsWith('# ')) {
      return (
        <h2 key={index} className="mt-10 text-2xl font-semibold text-[#F5F2EA]">
          {renderInline(block.slice(2), `h1-${index}`)}
        </h2>
      );
    }
    if (block.startsWith('- ')) {
      const items = block.split('\n').map((line) => line.replace(/^- /, ''));
      return (
        <ul key={index} className="mt-4 list-disc space-y-2 pl-5 text-[#B7BDC4]">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li-${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={index} className="mt-4 leading-relaxed text-[#B7BDC4]">
        {renderInline(block, `p-${index}`)}
      </p>
    );
  });
}
