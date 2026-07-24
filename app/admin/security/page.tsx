'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Card, ErrorText, Loading, SectionTitle } from '../_lib/AdminUI';

type AuditEvent = { action: string; entity_type: string; entity_id: string | null; email: string | null; created_at?: string };
type LoginEvent = { email: string; success: boolean; ip_address: string | null; created_at: string };
type PermissionMatrix = { roles: Record<string, string[]> };

export default function AdminSecurityPage() {
  const { authFetch, tokens } = useAdmin();
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [auditRes, loginRes, matrixRes] = await Promise.all([
          authFetch('/api/admin/security/audit-logs?limit=50'),
          authFetch('/api/admin/security/login-history?limit=50'),
          authFetch('/api/admin/security/permissions'),
        ]);
        if (cancelled) return;
        if (auditRes.ok) setAuditLogs((await auditRes.json()).items ?? []);
        if (loginRes.ok) setLoginHistory((await loginRes.json()).items ?? []);
        if (matrixRes.ok) setMatrix(await matrixRes.json());
        if (!auditRes.ok && !loginRes.ok && !matrixRes.ok) setErrorMessage('Security-Daten konnten nicht geladen werden.');
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
      <SectionTitle title="Security Center" subtitle="Audit-Log, globale Login-Historie, Berechtigungsmatrix." />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Audit-Log</p>
            {auditLogs.length === 0 && <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Einträge vorhanden.</p>}
            {auditLogs.map((event, index) => (
              <p key={index} style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                {event.action} · {event.entity_type} · {event.email || '—'} {event.entity_id ? `(${event.entity_id})` : ''}
              </p>
            ))}
          </Card>

          <Card>
            <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Globale Login-Historie</p>
            {loginHistory.length === 0 && <p style={{ color: tokens.mutedMore, fontSize: '0.85rem' }}>Keine Einträge vorhanden.</p>}
            {loginHistory.map((event, index) => (
              <p key={index} style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                {event.success ? '✅' : '❌'} {event.email} · {event.ip_address || 'unbekannte IP'} · {event.created_at}
              </p>
            ))}
          </Card>

          {matrix && (
            <Card>
              <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Berechtigungsmatrix</p>
              {Object.entries(matrix.roles).map(([role, permissions]) => (
                <div key={role} style={{ marginBottom: '0.6rem' }}>
                  <p style={{ color: tokens.accent, fontWeight: 600, fontSize: '0.85rem' }}>{role}</p>
                  <p style={{ color: tokens.muted, fontSize: '0.78rem' }}>{permissions.join(', ')}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
