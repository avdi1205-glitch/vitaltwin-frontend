'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Kpi, Loading, SectionTitle } from '../_lib/AdminUI';

type CgmImport = { timestamp: string; glucose_value: number };
type NutritionEntry = { meal_name: string | null; carbs: number };

type NutritionOverview = {
  status?: 'empty' | 'active';
  available: boolean;
  note: string | null;
  import_errors: unknown[];
  connector_status: unknown[];
  import_stats: Record<string, unknown>;
  cgm?: { total_readings: number; unique_users: number; last_imports: CgmImport[] };
  nutrition?: { total_entries: number; unique_users: number; last_entries: NutritionEntry[] };
};

export default function AdminNutritionPage() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<NutritionOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/nutrition/overview');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Daten konnten nicht geladen werden.');
          return;
        }
        if (!cancelled) setData(await response.json());
      } catch {
        if (!cancelled) setErrorMessage('Backend gerade nicht erreichbar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SectionTitle title="Nutrition & CGM" subtitle="Überwachung der Ernährungs-/CGM-Datenpipeline." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {data && !data.available && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700 }}>Noch keine Datenpipeline vorhanden</p>
          <p style={{ color: tokens.muted, fontSize: '0.85rem', marginTop: '0.75rem' }}>{data.note}</p>
        </Card>
      )}

      {data && data.available && data.cgm && data.nutrition && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <Kpi label="CGM-Messwerte insgesamt" value={data.cgm.total_readings} hint={`${data.cgm.unique_users} Nutzer mit CGM-Daten`} />
            <Kpi label="Nutrition-Einträge insgesamt" value={data.nutrition.total_entries} hint={`${data.nutrition.unique_users} Nutzer mit Einträgen`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <Card>
              <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Letzte CGM-Importe</p>
              {data.cgm.last_imports.length === 0 ? (
                <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Noch keine</p>
              ) : (
                data.cgm.last_imports.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: `1px solid ${tokens.border}`,
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: tokens.muted }}>{new Date(r.timestamp).toLocaleString('de-DE')}</span>
                    <span style={{ color: tokens.accent, fontWeight: 600 }}>{r.glucose_value} mg/dL</span>
                  </div>
                ))
              )}
            </Card>

            <Card>
              <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Letzte Nutrition-Einträge</p>
              {data.nutrition.last_entries.length === 0 ? (
                <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Noch keine</p>
              ) : (
                data.nutrition.last_entries.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: `1px solid ${tokens.border}`,
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: tokens.muted }}>{r.meal_name || 'Ohne Name'}</span>
                    <span style={{ color: tokens.accent, fontWeight: 600 }}>{r.carbs}g Carbs</span>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

