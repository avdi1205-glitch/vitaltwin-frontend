'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type IntegrationItem = {
  id: string;
  name: string;
  category: string;
  status: 'configured' | 'not_configured' | 'not_implemented';
  implemented: boolean;
  required_env_vars: string[];
  note: string;
};

type IntegrationReport = {
  platforms: IntegrationItem[];
  health_connectors: IntegrationItem[];
  payment_providers: IntegrationItem[];
  affiliate_networks: IntegrationItem[];
  auth_providers: IntegrationItem[];
  ai_providers: IntegrationItem[];
  notification_channels: IntegrationItem[];
};

type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string;
  updated_by: string | null;
  updated_at: string;
};

function statusTone(status: IntegrationItem['status']): 'success' | 'danger' | 'neutral' {
  if (status === 'configured') return 'success';
  if (status === 'not_configured') return 'danger';
  return 'neutral';
}

function statusLabel(status: IntegrationItem['status']): string {
  if (status === 'configured') return 'Konfiguriert';
  if (status === 'not_configured') return 'Nicht konfiguriert';
  return 'Noch nicht eingerichtet';
}

function IntegrationSection({ title, items }: { title: string; items: IntegrationItem[] }) {
  const { tokens } = useAdmin();
  return (
    <>
      <p style={{ color: tokens.text, fontSize: '1.05rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem' }}>
        {title}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {items.map((item) => (
          <Card key={item.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</p>
              <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
            </div>
            {item.note && (
              <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>{item.note}</p>
            )}
            {item.required_env_vars.length > 0 && (
              <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Benötigt: {item.required_env_vars.join(', ')}
              </p>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

export default function AdminIntegrationsPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const [report, setReport] = useState<IntegrationReport | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingKey, setSavingKey] = useState('');

  const load = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [integrationsRes, flagsRes] = await Promise.all([
        authFetch('/api/admin/integrations'),
        authFetch('/api/admin/feature-flags'),
      ]);
      if (!integrationsRes.ok) {
        setErrorMessage('Integrationsdaten konnten nicht geladen werden.');
        return;
      }
      setReport(await integrationsRes.json());
      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        setFlags(Array.isArray(flagsData.items) ? flagsData.items : []);
      }
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [integrationsRes, flagsRes] = await Promise.all([
          authFetch('/api/admin/integrations'),
          authFetch('/api/admin/feature-flags'),
        ]);
        if (cancelled) return;
        if (!integrationsRes.ok) {
          setErrorMessage('Integrationsdaten konnten nicht geladen werden.');
          return;
        }
        setReport(await integrationsRes.json());
        if (flagsRes.ok) {
          const flagsData = await flagsRes.json();
          if (!cancelled) setFlags(Array.isArray(flagsData.items) ? flagsData.items : []);
        }
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

  const toggleFlag = async (key: string, enabled: boolean) => {
    setSavingKey(key);
    try {
      await authFetch(`/api/admin/feature-flags/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      await load();
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div>
      <SectionTitle
        title="Integrationen & Feature Flags"
        subtitle="Echter Status jeder Plattform/Connector/Provider — berechnet aus tatsächlichen Env-Variablen, nichts vorgetäuscht."
      />
      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && report && (
        <>
          <IntegrationSection title="Plattformen" items={report.platforms} />
          <IntegrationSection title="Health- & Wearable-Connectoren" items={report.health_connectors} />
          <IntegrationSection title="Zahlungsanbieter" items={report.payment_providers} />
          <IntegrationSection title="Affiliate-Netzwerke" items={report.affiliate_networks} />
          <IntegrationSection title="Login-Anbieter" items={report.auth_providers} />
          <IntegrationSection title="KI-Anbieter" items={report.ai_providers} />
          <IntegrationSection title="Benachrichtigungskanäle" items={report.notification_channels} />

          {hasPermission('manage_feature_flags') && (
            <>
              <p style={{ color: tokens.text, fontSize: '1.05rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem' }}>
                Feature Flags
              </p>
              {flags.length === 0 && <Note>Noch keine Feature-Flags angelegt.</Note>}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {flags.map((flag) => (
                  <Card key={flag.key}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.9rem' }}>{flag.key}</p>
                        {flag.description && (
                          <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.25rem' }}>{flag.description}</p>
                        )}
                      </div>
                      <Button
                        variant={flag.enabled ? 'primary' : 'secondary'}
                        disabled={savingKey === flag.key}
                        onClick={() => toggleFlag(flag.key, !flag.enabled)}
                      >
                        {flag.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
