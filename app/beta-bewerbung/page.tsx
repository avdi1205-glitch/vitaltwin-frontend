'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import PublicFooter from '../components/PublicFooter';

export default function BetaBewerbung() {
  const t = useTranslations('betaApplication');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [motivation, setMotivation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/beta/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          age: age ? Number(age) : null,
          motivation,
          source: 'beta-bewerbung-landingpage',
          website,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.detail ?? t('submitError'));
        return;
      }

      setMessage(data?.message ?? t('successDefault'));
      setSuccess(true);
    } catch {
      setMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] px-6 py-16">
      <div className="mx-auto max-w-xl">
        <p className="font-[family-name:var(--font-mono-technical)] text-center text-xs uppercase tracking-[0.22em] text-[#8E969F]">{t('badge')}</p>
        <h1 className="mt-2 text-center font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA]">
          {t('title')}
        </h1>
        <p className="mt-4 text-center text-[#B7BDC4]">
          {t('intro')}
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          {success ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-lg font-semibold text-[#F5F2EA]">{t('submittedTitle')}</p>
              <p className="mt-2 text-[#B7BDC4]">{message}</p>
              <Link href="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110">
                {t('backToHome')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="full_name">{t('fullNameLabel')}</label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="email">{t('emailLabel')}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="age">{t('ageLabel')}</label>
                <input
                  id="age"
                  type="number"
                  min={16}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t('agePlaceholder')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B7BDC4]" htmlFor="motivation">
                  {t('motivationLabel')}
                </label>
                <textarea
                  id="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder={t('motivationPlaceholder')}
                  className="min-h-[120px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </div>

              {/* Honeypot field: hidden from real users via CSS, catches simple bots. */}
              <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {message && !success && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-base font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
              >
                {loading ? t('sending') : t('applyNow')}
              </button>

              <p className="text-center text-xs text-[#8E969F]">
                {t('termsPrefix')}{' '}
                <Link href="/agb" className="underline hover:text-[#58D7D4]">{t('terms')}</Link> {t('termsAnd')}{' '}
                <Link href="/datenschutz" className="underline hover:text-[#58D7D4]">{t('privacyPolicy')}</Link>.
              </p>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-[#8E969F]">
          {t('alreadyAccount')}{' '}
          <Link href="/?auth=login" className="text-[#58D7D4] underline hover:text-[#F3C979]">{t('login')}</Link>
        </p>

        <PublicFooter centered />
      </div>
    </div>
  );
}
