import { redirect } from 'next/navigation';

type LoginPageProps = {
  searchParams?: Promise<{ registered?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const query = new URLSearchParams({ auth: 'login' });

  if (params?.registered === '1') {
    query.set('registered', '1');
  }

  if (params?.reset === '1') {
    query.set('reset', '1');
  }

  redirect(`/?${query.toString()}`);
}
