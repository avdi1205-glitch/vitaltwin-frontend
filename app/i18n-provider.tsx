'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import { messages } from '@/lib/i18n/messages';

export default function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
