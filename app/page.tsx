import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomeLanding from './components/home-landing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: { canonical: '/' },
  };
}

type HomePageProps = {
  searchParams?: Promise<{ auth?: string; registered?: string; reset?: string; premium?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const t = await getTranslations('siteMeta');
  const params = searchParams ? await searchParams : undefined;

  const initialAuthMode =
    params?.auth === 'login' || params?.auth === 'register' ? params.auth : null;

  const initialNotice =
    params?.registered === '1'
      ? t('accountCreatedNotice')
      : params?.reset === '1'
        ? t('passwordUpdatedNotice')
        : params?.premium === '1'
          ? t('loginForPremiumNotice')
          : params?.auth === 'login'
            ? t('starterHintNotice')
        : '';

  const startedFromQuery =
    Boolean(initialAuthMode) || params?.registered === '1' || params?.reset === '1' || params?.premium === '1';

  return (
    <HomeLanding
      initialAuthMode={initialAuthMode}
      initialNotice={initialNotice}
      startedFromQuery={startedFromQuery}
    />
  );
}
