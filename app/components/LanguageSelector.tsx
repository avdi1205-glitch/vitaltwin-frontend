'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { localeCookie, type Locale } from '@/lib/i18n/config';

export default function LanguageSelector() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('language');

  const changeLocale = (nextLocale: Locale) => {
    document.cookie = `${localeCookie}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <label className="flex items-center gap-2 text-xs text-[#8E969F]">
      <span className="sr-only">{t('label')}</span>
      <select
        value={locale}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        aria-label={t('label')}
        className="rounded-full border border-white/15 bg-[#0B1118] px-3 py-2 text-xs font-semibold text-[#F5F2EA] outline-none transition hover:border-[#58D7D4]/60"
      >
        <option value="de">DE · {t('german')}</option>
        <option value="en">EN · {t('english')}</option>
      </select>
    </label>
  );
}
