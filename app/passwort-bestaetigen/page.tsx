'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

export default function PasswortBestaetigen() {
  const t = useTranslations('passwordConfirm');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkChecked, setLinkChecked] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      setAccessToken(params.get('access_token'));
      setLinkChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accessToken) {
      setErrorMessage(t('resetLinkInvalid'));
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/users/complete-password-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, new_password: newPassword }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? t('updateFailed'));
        return;
      }

      router.push('/?auth=login&reset=1');
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1118] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-10">
        <h1 className="text-center text-3xl font-bold text-[#F5F2EA]">{t('title')}</h1>

        {linkChecked && !accessToken && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {t('linkInvalid')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('newPasswordPlaceholder')}
            className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
            required
            minLength={8}
          />

          {errorMessage && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-lg font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? t('updating') : t('savePassword')}
          </button>
        </form>

        <p className="mt-6 text-center text-[#8E969F]">
          {t('backTo')} <Link href="/passwort-vergessen" className="text-[#58D7D4] hover:underline">{t('forgotPassword')}</Link>
        </p>
      </div>
    </div>
  );
}
