'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Button, Card, CollapsibleSection, ErrorText, Kpi, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type StripeSummary = {
  revenue_today: number | null;
  revenue_month: number | null;
  note: string;
};

type AdsenseSummary = {
  earnings_month: number | null;
  earnings_total: number | null;
  last_import_at: string | null;
  last_import_filename: string | null;
  note: string;
};

type AccountingOverview = { stripe: StripeSummary; adsense: AdsenseSummary };

type ImportBatch = {
  id: number;
  created_at: string;
  imported_by: string;
  source_filename: string | null;
  row_count: number;
  skipped_duplicate_count: number;
};

type ImportResult = {
  batch_id: number | null;
  rows_imported: number;
  rows_skipped_duplicate: number;
  rows_skipped_other: number;
  note: string;
};

const SOURCE_OPTIONS = [
  { value: 'stripe_payments', label: 'Stripe – Zahlungen' },
  { value: 'stripe_refunds', label: 'Stripe – Rückerstattungen' },
  { value: 'stripe_subscriptions', label: 'Stripe – Abonnements' },
  { value: 'adsense_earnings', label: 'AdSense – Einnahmen' },
];

function formatEuro(value: number | null | undefined): string {
  return value !== null && value !== undefined ? `${value.toFixed(2)} €` : '—';
}

function fieldStyle(border: string, card: string, text: string): React.CSSProperties {
  return { background: card, border: `1px solid ${border}`, borderRadius: '0.5rem', padding: '0.5rem', color: text };
}

export default function AdminAccountingPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canView = hasPermission('view_accounting');
  const canManage = hasPermission('manage_accounting');
  const input = fieldStyle(tokens.border, tokens.card, tokens.text);

  const [overview, setOverview] = useState<AccountingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeTotals, setRangeTotals] = useState<{ stripe: number; adsense: number } | null>(null);
  const [rangeBusy, setRangeBusy] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  const [exportSource, setExportSource] = useState('stripe_payments');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'datev'>('csv');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportDisclaimer, setExportDisclaimer] = useState('');

  const loadImportBatches = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/accounting/adsense/import-batches');
      if (!response.ok) return;
      const data = await response.json();
      setBatches(Array.isArray(data.batches) ? data.batches : []);
    } catch {
      // Non-fatal — the overview above already loaded fine.
    }
  }, [authFetch]);

  useEffect(() => {
    if (!canView) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/accounting/overview');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Buchhaltungs-Übersicht konnte nicht geladen werden.');
          return;
        }
        if (!cancelled) setOverview(await response.json());
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
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    const timer = window.setTimeout(() => {
      void loadImportBatches();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canView, loadImportBatches]);

  if (!canView) {
    return (
      <div>
        <SectionTitle title="Buchhaltung" />
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700 }}>Kein Zugriff</p>
          <p style={{ color: tokens.muted, fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Dieser Bereich enthält Finanzdaten für den Steuerberater-Handover und ist ausschließlich für die
            super_admin-Rolle freigeschaltet.
          </p>
        </Card>
      </div>
    );
  }

  const computeRangeTotals = async () => {
    setRangeBusy(true);
    setRangeError('');
    setRangeTotals(null);
    try {
      const params = new URLSearchParams({ format: 'json' });
      if (rangeFrom) params.set('start_date', rangeFrom);
      if (rangeTo) params.set('end_date', rangeTo);
      const [paymentsRes, adsenseRes] = await Promise.all([
        authFetch(`/api/admin/accounting/export?source=stripe_payments&${params.toString()}`),
        authFetch(`/api/admin/accounting/export?source=adsense_earnings&${params.toString()}`),
      ]);
      if (!paymentsRes.ok || !adsenseRes.ok) {
        setRangeError('Zeitraum-Summe konnte nicht berechnet werden.');
        return;
      }
      const paymentsJson = await paymentsRes.json();
      const adsenseJson = await adsenseRes.json();
      const stripeTotal =
        (paymentsJson.rows ?? []).reduce((sum: number, row: { amount_paid?: number }) => sum + (row.amount_paid ?? 0), 0) / 100;
      const adsenseTotal =
        (adsenseJson.rows ?? []).reduce((sum: number, row: { gross_revenue_cents?: number }) => sum + (row.gross_revenue_cents ?? 0), 0) /
        100;
      setRangeTotals({ stripe: stripeTotal, adsense: adsenseTotal });
    } catch {
      setRangeError('Backend gerade nicht erreichbar.');
    } finally {
      setRangeBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setImportResult(null);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await authFetch('/api/admin/accounting/adsense/import', { method: 'POST', body: formData });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setImportError(json?.detail || 'Import fehlgeschlagen.');
        return;
      }
      setImportResult(json);
      setFile(null);
      await loadImportBatches();
    } catch {
      setImportError('Backend gerade nicht erreichbar.');
    } finally {
      setUploading(false);
    }
  };

  const downloadExport = async () => {
    setExportBusy(true);
    setExportMessage('');
    setExportDisclaimer('');
    try {
      const params = new URLSearchParams({
        source: exportFormat === 'datev' ? 'datev' : exportSource,
        format: exportFormat === 'datev' ? 'csv' : exportFormat,
      });
      if (exportFrom) params.set('start_date', exportFrom);
      if (exportTo) params.set('end_date', exportTo);
      const response = await authFetch(`/api/admin/accounting/export?${params.toString()}`);
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setExportMessage(json?.detail || 'Export fehlgeschlagen.');
        return;
      }
      if (json.disclaimer) setExportDisclaimer(json.disclaimer);
      const content = exportFormat === 'json' ? JSON.stringify(json.rows ?? [], null, 2) : json.csv ?? '';
      const blob = new Blob([content], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const namePart = exportFormat === 'datev' ? 'datev_buchungsstapel' : exportSource;
      link.download = `${namePart}.${exportFormat === 'json' ? 'json' : 'csv'}`;
      link.click();
      URL.revokeObjectURL(link.href);
      setExportMessage(`Export erstellt (${json.row_count ?? 0} Zeilen).`);
    } catch {
      setExportMessage('Backend gerade nicht erreichbar.');
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Buchhaltung"
        subtitle="Stripe- und AdSense-Einnahmen, GoBD-orientierter Export für den Steuerberater-Handover."
      />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && overview && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Kpi label="Stripe – Umsatz heute" value={formatEuro(overview.stripe.revenue_today)} hint={overview.stripe.note || undefined} />
            <Kpi label="Stripe – Umsatz (Monat)" value={formatEuro(overview.stripe.revenue_month)} />
            <Kpi label="AdSense – Einnahmen (Monat)" value={formatEuro(overview.adsense.earnings_month)} hint={overview.adsense.note || undefined} />
            <Kpi label="AdSense – Einnahmen gesamt" value={formatEuro(overview.adsense.earnings_total)} />
          </div>
          {overview.adsense.last_import_at && (
            <Note>
              Letzter AdSense-Import: {new Date(overview.adsense.last_import_at).toLocaleString('de-DE')}
              {overview.adsense.last_import_filename ? ` (${overview.adsense.last_import_filename})` : ''}
            </Note>
          )}
        </>
      )}

      <CollapsibleSection title="Zeitraum-Auswahl" subtitle="Summe für einen frei wählbaren Zeitraum berechnen">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
            Von{' '}
            <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} style={input} />
          </label>
          <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
            Bis{' '}
            <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} style={input} />
          </label>
          <Button variant="secondary" disabled={rangeBusy} onClick={computeRangeTotals}>
            Summe berechnen
          </Button>
        </div>
        {rangeError && <ErrorText>{rangeError}</ErrorText>}
        {rangeTotals && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            <Kpi label="Stripe im Zeitraum" value={formatEuro(rangeTotals.stripe)} />
            <Kpi label="AdSense im Zeitraum" value={formatEuro(rangeTotals.adsense)} />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="AdSense-CSV-Import" subtitle="Manueller Import des AdSense-eigenen CSV-Exports">
        {canManage ? (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ color: tokens.text, fontSize: '0.85rem' }}
              />
              <Button disabled={!file || uploading} onClick={handleUpload}>
                {uploading ? 'Lädt hoch…' : 'CSV hochladen'}
              </Button>
            </div>
            {importError && <ErrorText>{importError}</ErrorText>}
            {importResult && (
              <Note>
                {importResult.rows_imported} Zeilen importiert · {importResult.rows_skipped_duplicate} Duplikate übersprungen
                {importResult.rows_skipped_other > 0 ? ` · ${importResult.rows_skipped_other} sonstige Zeilen übersprungen (z. B. Summenzeile)` : ''}
                {importResult.note ? ` · ${importResult.note}` : ''}
              </Note>
            )}
          </>
        ) : (
          <Note>Import erfordert die Berechtigung manage_accounting.</Note>
        )}

        <p style={{ color: tokens.text, fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>Bisherige Importe</p>
        {batches.length === 0 && <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Noch keine Importe vorhanden.</p>}
        {batches.map((batch) => (
          <div key={batch.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${tokens.border}` }}>
            <p style={{ color: tokens.text, fontSize: '0.85rem' }}>
              {batch.source_filename || 'unbenannte Datei'} · {batch.row_count} Zeilen
              {batch.skipped_duplicate_count > 0 ? ` (${batch.skipped_duplicate_count} Duplikate übersprungen)` : ''}
            </p>
            <p style={{ color: tokens.mutedMore, fontSize: '0.75rem' }}>
              {batch.imported_by} · {new Date(batch.created_at).toLocaleString('de-DE')}
            </p>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Export" subtitle="Zeitraum wählen, Format wählen, Datei herunterladen">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
            Von
            <br />
            <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} style={input} />
          </label>
          <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
            Bis
            <br />
            <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} style={input} />
          </label>
          <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
            Format
            <br />
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'datev')} style={input}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="datev">DATEV</option>
            </select>
          </label>
          {exportFormat !== 'datev' && (
            <label style={{ color: tokens.muted, fontSize: '0.8rem' }}>
              Datenquelle
              <br />
              <select value={exportSource} onChange={(e) => setExportSource(e.target.value)} style={input}>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button disabled={exportBusy} onClick={downloadExport}>
            {exportBusy ? 'Erstellt…' : 'Herunterladen'}
          </Button>
        </div>
        {exportFormat === 'datev' && (
          <Note>
            Nur nutzen, falls ein Steuerberater mit DATEV-Software beauftragt ist — sonst CSV/JSON verwenden. DATEV
            kombiniert Stripe-Zahlungen, -Rückerstattungen und AdSense-Einnahmen automatisch in einer Datei.
          </Note>
        )}
        {exportMessage && <p style={{ color: tokens.accent, fontSize: '0.85rem', marginTop: '0.5rem' }}>{exportMessage}</p>}
        {exportDisclaimer && <Note>{exportDisclaimer}</Note>}
      </CollapsibleSection>
    </div>
  );
}
