'use client';

import { useState } from 'react';
import { useAdmin } from './AdminContext';

/** A themed content card — the base building block for every admin page. */
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { tokens } = useAdmin();
  return (
    <div
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        borderRadius: '1rem',
        padding: '1.25rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A single KPI stat tile: label + big value + optional small hint. */
export function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  const { tokens } = useAdmin();
  return (
    <Card>
      <p style={{ color: tokens.muted, fontSize: '0.8rem', fontWeight: 600 }}>{label}</p>
      <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem' }}>
        {value === null || value === undefined ? '—' : value}
      </p>
      {hint ? <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.35rem' }}>{hint}</p> : null}
    </Card>
  );
}

/** An honest "this is not implemented yet" note — never hide the gap, never fake a number. */
export function Note({ children }: { children: React.ReactNode }) {
  const { tokens } = useAdmin();
  return (
    <p
      style={{
        color: tokens.mutedMore,
        fontSize: '0.8rem',
        background: tokens.cardHover,
        border: `1px dashed ${tokens.border}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginTop: '0.75rem',
      }}
    >
      ℹ️ {children}
    </p>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { tokens } = useAdmin();
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h1 style={{ color: tokens.text, fontSize: '1.5rem', fontWeight: 700 }}>{title}</h1>
      {subtitle ? <p style={{ color: tokens.muted, fontSize: '0.9rem', marginTop: '0.25rem' }}>{subtitle}</p> : null}
    </div>
  );
}

export function Badge({ tone, children }: { tone: 'success' | 'danger' | 'neutral'; children: React.ReactNode }) {
  const { tokens } = useAdmin();
  const color = tone === 'success' ? tokens.success : tone === 'danger' ? tokens.danger : tokens.muted;
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: '999px',
        padding: '0.1rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const { tokens } = useAdmin();
  const background = variant === 'primary' ? tokens.accent : variant === 'danger' ? tokens.danger : 'transparent';
  const color = variant === 'secondary' ? tokens.text : '#0B1118';
  const border = variant === 'secondary' ? `1px solid ${tokens.border}` : 'none';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: variant === 'secondary' ? 'transparent' : background,
        color: variant === 'secondary' ? tokens.text : color,
        border,
        borderRadius: '0.6rem',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Loading() {
  const { tokens } = useAdmin();
  return <p style={{ color: tokens.muted, fontSize: '0.9rem' }}>Lädt…</p>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  const { tokens } = useAdmin();
  return <p style={{ color: tokens.danger, fontSize: '0.85rem' }}>{children}</p>;
}

/**
 * Shared collapsible section header — the one component every admin page
 * uses for "click to expand" categories, so the collapse/expand look is
 * consistent site-wide instead of a per-page reimplementation. Starts
 * closed by default (`defaultOpen=false`); open/closed state is local
 * component state only, never persisted, so every page load starts fresh.
 * Wrapping existing JSX in this component changes ONLY its visibility —
 * any data-fetching above it in the page is completely unaffected.
 */
export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { tokens } = useAdmin();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: '1rem',
        marginBottom: '1rem',
        overflow: 'hidden',
        background: tokens.card,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '1rem 1.25rem',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ color: tokens.text, fontSize: '1rem', fontWeight: 700 }}>{title}</span>
          {subtitle ? <span style={{ color: tokens.muted, fontSize: '0.8rem' }}>{subtitle}</span> : null}
        </span>
        <span
          aria-hidden
          style={{
            color: tokens.muted,
            fontSize: '0.75rem',
            transition: 'transform 0.15s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>
      {open ? <div style={{ padding: '0 1.25rem 1.25rem' }}>{children}</div> : null}
    </div>
  );
}
