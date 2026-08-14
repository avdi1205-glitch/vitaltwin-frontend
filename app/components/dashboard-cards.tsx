import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
export function DomainCard({ label, status, hint, detailHref, detailLabel }: DomainCardProps) {
  const t = useTranslations('cards');
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-[#F5F2EA]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#F5F2EA]">
        {status && status.trim() ? status : t('emptyStatus')}
      </p>
      <p className="mt-1 text-sm text-[#B7BDC4]">{hint}</p>
      <Link href={detailHref} className="mt-3 inline-block text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
        {detailLabel ?? t('details')}
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
  const t = useTranslations('cards');
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{title}</h3>
      {actions.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {actions.slice(0, 3).map((action) => (
            <li key={action} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
              {action}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#B7BDC4]">
          {t('todayEmpty')}
        </p>
      )}
      <p className="mt-4 text-xs text-[#8E969F]">
        {t('disclaimer')}
      </p>
    </article>
  );
}
