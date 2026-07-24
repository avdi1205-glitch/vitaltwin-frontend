'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type NutritionOverview = {
  available: boolean;
  note: string;
  import_errors: unknown[];
  connector_status: unknown[];
  import_stats: Record<string, unknown>;
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
      {data && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700 }}>
            {data.available ? 'Datenpipeline aktiv' : 'Noch keine Datenpipeline vorhanden'}
          </p>
          <p style={{ color: tokens.muted, fontSize: '0.85rem', marginTop: '0.75rem' }}>{data.note}</p>
        </Card>
      )}
    </div>
  );
}
