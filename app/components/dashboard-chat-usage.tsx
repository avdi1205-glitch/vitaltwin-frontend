'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type ChatStatus = {
  daily_limit: number;
  used_today: number;
  remaining_today: number;
  plan: string;
};

/**
 * Real, plan-aware KI-usage indicator for the dashboard's "Frag deinen
 * Twin" card — reads `GET /api/chat/status` (the same server-side source
 * `/frag-deinen-twin` already uses), never a client-computed/hardcoded
 * counter, so the shown limit always reflects the caller's own real tier.
 */
export default function DashboardChatUsage() {
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/chat/status'), { headers: authHeader() });
        const json = await response.json().catch(() => null);
        if (response.ok && json) {
          setStatus(json as ChatStatus);
        }
      } catch {
        // Non-fatal — the usage line just stays hidden.
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeader]);

  if (loading || !status) {
    return null;
  }

  return (
    <p className="mt-3 text-xs text-[#8E969F]">
      {status.used_today} von {status.daily_limit} KI-Fragen heute verwendet
      {status.remaining_today <= 0 && (
        <>
          {' '}
          — Limit erreicht.{' '}
          <Link href="/preise" className="text-[#58D7D4] underline hover:text-[#F3C979]">
            Für mehr Anfragen upgraden
          </Link>
        </>
      )}
    </p>
  );
}
