import Link from 'next/link';

export type DomainCardProps = {
  label: string;
  status?: string | null;
  hint: string;
  detailHref: string;
  detailLabel?: string;
};

/**
 * Reusable "Tagesübersicht" domain card (Schlaf, Bewegung, Ernährung, Stress,
 * Energie, Erholung, ...). Shows a real status when one is available, and an
 * honest "Noch keine Daten vorhanden" empty state otherwise — never a
 * fabricated or random value.
 */
export function DomainCard({ label, status, hint, detailHref, detailLabel = 'Details' }: DomainCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold text-neutral-900">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">
        {status && status.trim() ? status : 'Noch keine Daten vorhanden'}
      </p>
      <p className="mt-1 text-sm text-neutral-600">{hint}</p>
      <Link href={detailHref} className="mt-3 inline-block text-sm font-semibold text-neutral-900 underline hover:text-black">
        {detailLabel}
      </Link>
    </article>
  );
}

export type ActionCardProps = {
  title: string;
  actions: string[];
};

/** "Heute für dich": up to 3 prioritized, rule-based wellness actions. */
export function TodayActionsCard({ title, actions }: ActionCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">{title}</h3>
      {actions.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {actions.slice(0, 3).map((action) => (
            <li key={action} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-sm text-neutral-800">
              {action}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-neutral-600">
          Noch keine Empfehlungen verfügbar. Starte eine Berechnung, um persönliche Wellness-Impulse zu erhalten.
        </p>
      )}
      <p className="mt-4 text-xs text-neutral-500">
        Diese Vorschläge basieren auf deinen eingetragenen Werten und allgemeinen Wellness-Regeln — keine Diagnose,
        keine Therapieempfehlung.
      </p>
    </article>
  );
}
