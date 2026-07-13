import HomeLanding from './components/home-landing';

type HomePageProps = {
  searchParams?: Promise<{ auth?: string; registered?: string; reset?: string; premium?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;

  const initialAuthMode =
    params?.auth === 'login' || params?.auth === 'register' ? params.auth : null;

  const initialNotice =
    params?.registered === '1'
      ? 'Konto erstellt. Du kannst dich jetzt anmelden.'
      : params?.reset === '1'
        ? 'Passwort aktualisiert. Bitte melde dich mit dem neuen Passwort an.'
        : params?.premium === '1'
          ? 'Bitte melde dich an, um Premium zu kaufen.'
          : params?.auth === 'login'
            ? 'Hinweis: Im Starter ist genau 1 Berechnung enthalten. Danach kannst du kostenlos als Beta-Tester weitermachen.'
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
