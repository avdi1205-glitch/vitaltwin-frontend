'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type SystemStatus = {
  database: { status: string };
  openai: { configured: boolean };
  stripe: { configured: boolean };
  storage: { note: string };
  cron_jobs: { note: string };
  queues: { note: string };
  health_connect: { note: string };
  apple_health: { note: string };
  release: { version?: string; build_status?: string; released_at?: string; environment?: string; note?: string };
  backup: { status?: string; completed_at?: string; backup_type?: string; note?: string };
  error_events_7d: { total: number | null; by_type: Record<string, number> | null; note: string | null };
  build_status_note: string;
  backup_provider_note: string;
};

const inputStyle = (border: string, card: string, text: string): React.CSSProperties => ({
  background: card,
  border: `1px solid ${border}`,
  borderRadius: '0.5rem',
  padding: '0.5rem',
  color: text,
});

export default function AdminSystemPage() {
  const { authFetch, hasPermission, tokens } = useAdmin();
  const [data, setData] = useState<SystemStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [releaseForm, setReleaseForm] = useState({ version: '', description: '', build_status: 'erfolgreich' });
  const [backupForm, setBackupForm] = useState({ status: 'erfolgreich', note: '' });
  const [formMessage, setFormMessage] = useState('');

  const loadStatus = async () => {
    try {
      const response = await authFetch('/api/admin/system/status');
      if (!response.ok) {
        setErrorMessage('Systemstatus konnte nicht geladen werden.');
        return;
      }
      setData(await response.json());
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitRelease = async () => {
    if (!releaseForm.version.trim()) return;
    setFormMessage('');
    try {
      const response = await authFetch('/api/admin/system/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseForm),
      });
      if (!response.ok) {
        setFormMessage('Release konnte nicht gespeichert werden.');
        return;
      }
      setReleaseForm({ version: '', description: '', build_status: 'erfolgreich' });
      setFormMessage('Release gespeichert.');
      await loadStatus();
    } catch {
      setFormMessage('Backend gerade nicht erreichbar.');
    }
  };

  const submitBackup = async () => {
    setFormMessage('');
    try {
      const response = await authFetch('/api/admin/system/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...backupForm, completed_at: new Date().toISOString() }),
      });
      if (!response.ok) {
        setFormMessage('Backup-Status konnte nicht gespeichert werden.');
        return;
      }
      setBackupForm({ status: 'erfolgreich', note: '' });
      setFormMessage('Backup-Status gespeichert.');
      await loadStatus();
    } catch {
      setFormMessage('Backend gerade nicht erreichbar.');
    }
  };

  const fieldStyle = inputStyle(tokens.border, tokens.card, tokens.text);

  return (
    <div>
      <SectionTitle title="System Center" subtitle="Ehrlicher Status — nur was tatsächlich überwacht werden kann." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Kernstatus</p>
            <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
              Datenbank: {data.database.status === 'reachable' ? '✅ erreichbar' : '❌ nicht erreichbar'}
            </p>
            <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
              OpenAI konfiguriert: {data.openai.configured ? '✅ ja' : '❌ nein'}
            </p>
            <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
              Stripe konfiguriert: {data.stripe.configured ? '✅ ja' : '❌ nein'}
            </p>
            <Note>{data.storage.note}</Note>
            <Note>{data.cron_jobs.note}</Note>
            <Note>{data.queues.note}</Note>
            <Note>{data.health_connect.note}</Note>
            <Note>{data.apple_health.note}</Note>
          </Card>

          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Letzter Release</p>
            {data.release.version ? (
              <>
                <p style={{ color: tokens.text, fontSize: '0.9rem' }}>
                  {data.release.version} ({data.release.environment})
                </p>
                <Badge tone={data.release.build_status === 'erfolgreich' ? 'success' : data.release.build_status === 'fehlgeschlagen' ? 'danger' : 'neutral'}>
                  {data.release.build_status}
                </Badge>
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  {data.release.released_at ? new Date(data.release.released_at).toLocaleString('de-DE') : ''}
                </p>
              </>
            ) : (
              <Note>{data.release.note}</Note>
            )}
            <Note>{data.build_status_note}</Note>
            {hasPermission('manage_founder_os') && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input placeholder="Version (z. B. 1.2.0)" value={releaseForm.version} onChange={(e) => setReleaseForm((f) => ({ ...f, version: e.target.value }))} style={fieldStyle} />
                <input placeholder="Beschreibung (optional)" value={releaseForm.description} onChange={(e) => setReleaseForm((f) => ({ ...f, description: e.target.value }))} style={fieldStyle} />
                <select value={releaseForm.build_status} onChange={(e) => setReleaseForm((f) => ({ ...f, build_status: e.target.value }))} style={fieldStyle}>
                  <option value="erfolgreich">erfolgreich</option>
                  <option value="fehlgeschlagen">fehlgeschlagen</option>
                  <option value="unbekannt">unbekannt</option>
                </select>
                <Button variant="secondary" onClick={submitRelease}>Release erfassen</Button>
              </div>
            )}
          </Card>

          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Letzter Backup-Status</p>
            {data.backup.status ? (
              <>
                <Badge tone={data.backup.status === 'erfolgreich' ? 'success' : data.backup.status === 'fehlgeschlagen' ? 'danger' : 'neutral'}>
                  {data.backup.status}
                </Badge>
                <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  {data.backup.completed_at ? new Date(data.backup.completed_at).toLocaleString('de-DE') : ''} ({data.backup.backup_type})
                </p>
              </>
            ) : (
              <Note>{data.backup.note}</Note>
            )}
            <Note>{data.backup_provider_note}</Note>
            {hasPermission('manage_founder_os') && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <select value={backupForm.status} onChange={(e) => setBackupForm((f) => ({ ...f, status: e.target.value }))} style={fieldStyle}>
                  <option value="erfolgreich">erfolgreich</option>
                  <option value="fehlgeschlagen">fehlgeschlagen</option>
                  <option value="laeuft">läuft</option>
                </select>
                <input placeholder="Notiz (optional)" value={backupForm.note} onChange={(e) => setBackupForm((f) => ({ ...f, note: e.target.value }))} style={fieldStyle} />
                <Button variant="secondary" onClick={submitBackup}>Backup-Status erfassen</Button>
              </div>
            )}
          </Card>

          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Fehler (7 Tage)</p>
            <p style={{ color: tokens.text, fontSize: '1.3rem', fontWeight: 700 }}>
              {data.error_events_7d.total ?? '—'}
            </p>
            {data.error_events_7d.by_type && Object.keys(data.error_events_7d.by_type).length > 0 && (
              <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {Object.entries(data.error_events_7d.by_type).map(([type, count]) => (
                  <Badge key={type} tone="neutral">{type}: {count}</Badge>
                ))}
              </div>
            )}
            {data.error_events_7d.note && <Note>{data.error_events_7d.note}</Note>}
            <Note>
              Erfasst nur unbehandelte Backend-Ausnahmen (vt_error_events). Kein Ersatz für ein externes Tool wie
              Sentry (keine Stacktrace-Gruppierung, kein Alerting).
            </Note>
          </Card>
        </div>
      )}
      {formMessage && <Note>{formMessage}</Note>}
    </div>
  );
}
