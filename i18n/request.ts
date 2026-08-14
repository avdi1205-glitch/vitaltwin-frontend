import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, localeCookie } from '@/lib/i18n/config';
import { messages } from '@/lib/i18n/messages';

export default getRequestConfig(async () => {
  const value = (await cookies()).get(localeCookie)?.value;
  const locale = isLocale(value) ? value : defaultLocale;

  return { locale, messages: messages[locale] };
});
