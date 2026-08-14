'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

export default function PasswortAendern() {
  const t = useTranslations('passwordChange');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/?auth=login');
    }
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/users/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? t('updateFailed'));
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setSuccessMessage(data?.message ?? t('updateSuccessDefault'));
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
        <p className="mt-3 text-center text-[#8E969F]">
          {t('instructions')}
        </p>

        <form onSubmit={handleChangePassword} className="mt-8 space-y-6">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t('currentPasswordPlaceholder')}
            className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
            required
          />
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

          {successMessage && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-lg font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? t('updating') : t('updatePassword')}
          </button>
        </form>

        <p className="mt-6 text-center text-[#8E969F]">
          {t('backTo')} <Link href="/dashboard" className="text-[#58D7D4] hover:underline">{t('dashboard')}</Link>
        </p>
      </div>
    </div>
  );
}

