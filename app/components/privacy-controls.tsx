'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type ConsentStatus = { granted: boolean | null; changed_at: string | null };
type Overview = {
  stored_data_counts: Record<string, number>;
  active_memories_count: number;
  active_patterns_count: number;
  consents: Record<string, ConsentStatus>;
  note: string;
};

const CONSENT_LABELS: Record<string, string> = {
  wellness_data_processing: 'Wellness-Datenverarbeitung',
  ai_features: 'KI-Funktionen',
  chat_storage: 'Chat-Speicherung',
  wearables_future: 'Zukünftige Wearables',
  marketing: 'Marketing',
  affiliate_tracking: 'Affiliate-Tracking',
  research_optional: 'Optionale Forschung',
};

const CATEGORY_LABELS: Record<string, string> = {
  checkins: 'Check-ins',
  habits: 'Gewohnheiten',
  habit_entries: 'Gewohnheitseinträge',
  goals: 'Ziele',
  daily_plans: 'Tagespläne',
  reflections: 'Tagesreflexionen',
  weekly_reflections: 'Wochenrückblicke',
  recommendations: 'Empfehlungen',
  memories: 'Twin Memories',
  patterns: 'Erkannte Muster',
  chat_history: 'Chatverlauf',
  feedback: 'Feedback',
};

/**
 * Privacy-UI (Twin Intelligence Core, Etappe 9 §7). Zeigt verständlich, was
 * gespeichert ist, was der Twin aktiv nutzt (Memories/Muster) und welche
 * Einwilligungen je Zweck aktiv sind (§3, nie pauschal) — plus Kategorie-
 * Löschung und optionalen CSV-Export (§1/§2). Nutzt ausschließlich bereits
 * vorhandene `/api/privacy/*`-Endpunkte, keine neue Datenbanklogik hier.
 */
export default function PrivacyControls() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [consentMessage, setConsentMessage] = useState('');
  const [deleteCategory, setDeleteCategory] = useState('checkins');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/privacy/overview'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setOverview(data);
      } else {
        setErrorMessage('Datenschutzübersicht konnte nicht geladen werden.');
      }
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setConsent = async (consentType: string, granted: boolean) => {
    setConsentMessage('');
    try {
      const response = await fetch(apiUrl('/api/privacy/consents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ consent_type: consentType, granted }),
      });
      if (!response.ok) {
        setConsentMessage('Einwilligung konnte nicht gespeichert werden.');
        return;
      }
      setConsentMessage('Gespeichert.');
      await load();
    } catch {
      setConsentMessage('Backend gerade nicht erreichbar.');
    }
  };

  const deleteCategoryData = async () => {
    const label = CATEGORY_LABELS[deleteCategory] ?? deleteCategory;
    if (!window.confirm(`Wirklich alle Daten der Kategorie "${label}" löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setDeleting(true);
    setDeleteMessage('');
    try {
      const response = await fetch(apiUrl(`/api/privacy/data/${deleteCategory}`), {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setDeleteMessage(data?.detail ?? 'Löschung fehlgeschlagen.');
        return;
      }
      setDeleteMessage(data?.message ?? 'Gelöscht.');
      await load();
    } catch {
      setDeleteMessage('Backend gerade nicht erreichbar.');
    } finally {
      setDeleting(false);
    }
  };

  const downloadCsv = async (category: string) => {
    try {
      const response = await fetch(apiUrl(`/api/privacy/export/csv/${category}`), { headers: authHeader() });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vitaltwin_${category}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Best effort — CSV export is a convenience alongside the full JSON export.
    }
  };

  if (loading) {
    return <p className="mt-4 text-sm text-[#8E969F]">Lade Datenschutzübersicht...</p>;
  }

  return (
    <div className="mt-4 space-y-6">
      {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}

      {overview && (
        <>
          <div>
            <p className="text-sm font-semibold text-[#F5F2EA]">Was bei dir gespeichert ist</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(overview.stored_data_counts).map(([category, count]) => (
                <div key={category} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#B7BDC4]">
                  {CATEGORY_LABELS[category] ?? category}: <span className="font-semibold text-[#F5F2EA]">{count}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8E969F]">
              Aktiv vom Twin genutzt: {overview.active_memories_count} Memories, {overview.active_patterns_count} Muster.{' '}
              {overview.note}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#F5F2EA]">Einwilligungen (getrennt je Zweck)</p>
            <div className="mt-2 space-y-2">
              {Object.entries(CONSENT_LABELS).map(([type, label]) => {
                const granted = overview.consents[type]?.granted ?? null;
                return (
                  <div
                    key={type}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span className="text-[#F5F2EA]">{label}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void setConsent(type, true)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          granted === true
                            ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]'
                            : 'border border-white/15 text-[#B7BDC4] hover:border-[#58D7D4]/60'
                        }`}
                      >
                        Erlauben
                      </button>
                      <button
                        onClick={() => void setConsent(type, false)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          granted === false
                            ? 'border border-red-400/40 text-red-300'
                            : 'border border-white/15 text-[#B7BDC4] hover:border-red-400/40'
                        }`}
                      >
                        Widerrufen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {consentMessage && <p className="mt-2 text-xs text-[#8E969F]">{consentMessage}</p>}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#F5F2EA]">Datenkategorie löschen oder als CSV exportieren</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={deleteCategory}
                onChange={(e) => setDeleteCategory(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void downloadCsv(deleteCategory)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
              >
                Als CSV exportieren
              </button>
              <button
                onClick={() => void deleteCategoryData()}
                disabled={deleting}
                className="rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? 'Lösche...' : 'Kategorie löschen'}
              </button>
            </div>
            {deleteMessage && <p className="mt-2 text-xs text-[#8E969F]">{deleteMessage}</p>}
          </div>
        </>
      )}
    </div>
  );
}
