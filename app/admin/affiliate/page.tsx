'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { useAdmin } from '../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Loading, Note, SectionTitle } from '../_lib/AdminUI';

type Tab =
  | 'dashboard'
  | 'partners'
  | 'products'
  | 'categories'
  | 'campaigns'
  | 'tracking'
  | 'analytics'
  | 'commissions'
  | 'import'
  | 'export'
  | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'partners', label: 'Partnerprogramme' },
  { key: 'products', label: 'Produkte' },
  { key: 'categories', label: 'Kategorien' },
  { key: 'campaigns', label: 'Kampagnen' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'commissions', label: 'Provisionen' },
  { key: 'import', label: 'Import' },
  { key: 'export', label: 'Export' },
  { key: 'settings', label: 'Einstellungen' },
];

const PRODUCT_STATUSES = ['draft', 'in_review', 'approved', 'active', 'paused', 'expired', 'archived'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  in_review: 'In Prüfung',
  approved: 'Freigegeben',
  active: 'Aktiv',
  paused: 'Pausiert',
  expired: 'Abgelaufen',
  archived: 'Archiviert',
};

function useDeferredLoad(fn: () => void, deps: unknown[]) {
  useEffect(() => {
    const timer = window.setTimeout(() => fn(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function AdminAffiliatePage() {
  const { tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_affiliate');
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div>
      <SectionTitle
        title="Affiliate Center"
        subtitle="Nur freigegebene, aktive, nicht abgelaufene und nicht gesperrte Produkte darf der Twin je empfehlen — regelbasiert durchgesetzt in core/affiliate_engine.py, nicht per KI-Prompt."
      />
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'primary' : 'secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'partners' && <PartnersTab canManage={canManage} />}
      {tab === 'products' && <ProductsTab canManage={canManage} />}
      {tab === 'categories' && <CategoriesTab canManage={canManage} />}
      {tab === 'campaigns' && <CampaignsTab canManage={canManage} />}
      {tab === 'tracking' && <TrackingTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'import' && <ImportTab canManage={canManage} />}
      {tab === 'export' && <ExportTab />}
      {tab === 'settings' && <SettingsTab canManage={canManage} />}

      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '2rem' }}>
        Partnernetzwerk-APIs (Amazon PartnerNet, Awin, Digistore24, CJ Affiliate, Impact, TradeDoubler) sind nicht
        angebunden — Partnerprogramme werden hier manuell gepflegt. Siehe{' '}
        <a href="/admin/integrations" style={{ color: tokens.accent }}>
          Integrationen
        </a>
        .
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function DashboardTab() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useDeferredLoad(() => {
    (async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await authFetch('/api/admin/affiliate/dashboard');
        if (!response.ok) {
          setErrorMessage('Dashboard konnte nicht geladen werden.');
          return;
        }
        setData(await response.json());
      } catch {
        setErrorMessage('Backend gerade nicht erreichbar.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;
  if (!data) return null;

  const statusCounts = (data.products_by_status as Record<string, number>) || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <Card>
        <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Produkte gesamt</p>
        <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>{String(data.total_products)}</p>
      </Card>
      <Card>
        <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Für Empfehlung zulässig</p>
        <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>{String(data.eligible_for_recommendation)}</p>
      </Card>
      <Card>
        <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Defekte Links</p>
        <p style={{ color: tokens.danger, fontSize: '1.75rem', fontWeight: 700 }}>{String(data.broken_links)}</p>
      </Card>
      <Card>
        <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Partnerprogramme (aktiv)</p>
        <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>
          {String(data.active_partners)} / {String(data.total_partners)}
        </p>
      </Card>
      <Card style={{ gridColumn: '1 / -1' }}>
        <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>Produkte nach Status</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} tone={status === 'active' || status === 'approved' ? 'success' : 'neutral'}>
              {STATUS_LABELS[status] || status}: {count}
            </Badge>
          ))}
          {Object.keys(statusCounts).length === 0 && <Note>Noch keine Produkte angelegt.</Note>}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partnerprogramme
// ---------------------------------------------------------------------------

type Partner = {
  id: string;
  network: string;
  partner_name: string;
  partner_code: string;
  status: string;
  api_available: boolean;
  commission_rate: number | null;
  cookie_duration_days: number | null;
  notes: string | null;
};

function PartnersTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    network: 'amazon_partnernet', partner_name: '', partner_code: '', status: 'inactive',
    api_available: false, commission_rate: '', cookie_duration_days: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authFetch('/api/admin/affiliate/partners');
      if (!response.ok) {
        setErrorMessage('Partnerprogramme konnten nicht geladen werden.');
        return;
      }
      const json = await response.json();
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useDeferredLoad(() => void load(), []);

  const create = async () => {
    if (!form.partner_name.trim() || !form.partner_code.trim()) return;
    try {
      const response = await authFetch('/api/admin/affiliate/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          commission_rate: form.commission_rate ? Number(form.commission_rate) : null,
          cookie_duration_days: form.cookie_duration_days ? Number(form.cookie_duration_days) : null,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(json?.detail || 'Anlegen fehlgeschlagen.');
        return;
      }
      setMessage('Partnerprogramm angelegt.');
      setForm({ network: 'amazon_partnernet', partner_name: '', partner_code: '', status: 'inactive', api_available: false, commission_rate: '', cookie_duration_days: '', notes: '' });
      await load();
    } catch {
      setMessage('Backend gerade nicht erreichbar.');
    }
  };

  const remove = async (id: string) => {
    await authFetch(`/api/admin/affiliate/partners/${id}`, { method: 'DELETE' });
    await load();
  };

  if (loading) return <Loading />;
  if (errorMessage) return <ErrorText>{errorMessage}</ErrorText>;

  return (
    <div>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {['Netzwerk', 'Partner', 'Code', 'Status', 'Provision', 'Cookie (Tage)', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{p.network}</td>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{p.partner_name}</td>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{p.partner_code}</td>
                <td style={{ padding: '0.6rem 0.9rem' }}>
                  <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
                </td>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{p.commission_rate ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{p.cookie_duration_days ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.9rem' }}>
                  {canManage && <Button variant="danger" onClick={() => remove(p.id)}>Löschen</Button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>Keine Partnerprogramme vorhanden.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {canManage && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Neues Partnerprogramm</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
            <input placeholder="Netzwerk" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
            <input placeholder="Partnername" value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} />
            <input placeholder="Partner-Code" value={form.partner_code} onChange={(e) => setForm({ ...form, partner_code: e.target.value })} />
            <input placeholder="Provision %" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} />
            <input placeholder="Cookie-Laufzeit (Tage)" value={form.cookie_duration_days} onChange={(e) => setForm({ ...form, cookie_duration_days: e.target.value })} />
            <input placeholder="Notizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {message && <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>{message}</p>}
          <div style={{ marginTop: '0.75rem' }}>
            <Button onClick={create}>Anlegen</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------

type Category = { id: string; name: string; slug: string };

function CategoriesTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/affiliate/categories');
      const json = await response.json().catch(() => ({ items: [] }));
      setItems(Array.isArray(json.items) ? json.items : []);
    } finally {
      setLoading(false);
    }
  };

  useDeferredLoad(() => void load(), []);

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;
    const response = await authFetch('/api/admin/affiliate/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(json?.detail || 'Anlegen fehlgeschlagen.');
      return;
    }
    setName('');
    setSlug('');
    await load();
  };

  const remove = async (id: string) => {
    await authFetch(`/api/admin/affiliate/categories/${id}`, { method: 'DELETE' });
    await load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {items.map((c) => (
            <Badge key={c.id} tone="neutral">
              {c.name} {canManage && <button onClick={() => remove(c.id)} style={{ marginLeft: '0.4rem', color: tokens.danger, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>}
            </Badge>
          ))}
          {items.length === 0 && <Note>Noch keine Kategorien angelegt.</Note>}
        </div>
      </Card>
      {canManage && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Neue Kategorie</p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Button onClick={create}>Anlegen</Button>
          </div>
          {message && <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>{message}</p>}
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Produkte
// ---------------------------------------------------------------------------

type Product = {
  id: string;
  title: string;
  status: string;
  brand: string | null;
  price: number | null;
  currency: string;
  affiliate_url: string;
  link_status: string;
  pinned: boolean;
  priority: number;
};

function ProductsTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<Product[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ title: '', brand: '', affiliate_url: '', price: '', status: 'draft' });

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
      const response = await authFetch(`/api/admin/affiliate/products${params}`);
      const json = await response.json().catch(() => ({ items: [] }));
      setItems(Array.isArray(json.items) ? json.items : []);
    } finally {
      setLoading(false);
    }
  };

  useDeferredLoad(() => void load(), [filterStatus]);

  const create = async () => {
    if (!form.title.trim() || !form.affiliate_url.trim()) return;
    const response = await authFetch('/api/admin/affiliate/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, brand: form.brand || null, affiliate_url: form.affiliate_url,
        price: form.price ? Number(form.price) : null, status: form.status,
      }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(json?.detail || 'Anlegen fehlgeschlagen.');
      return;
    }
    setForm({ title: '', brand: '', affiliate_url: '', price: '', status: 'draft' });
    setMessage('Produkt angelegt.');
    await load();
  };

  const setStatus = async (id: string, status: string) => {
    await authFetch(`/api/admin/affiliate/products/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const checkLink = async (id: string) => {
    setMessage('Prüfe Link…');
    const response = await authFetch(`/api/admin/affiliate/products/${id}/check-link`, { method: 'POST' });
    const json = await response.json().catch(() => null);
    setMessage(json ? `Link-Status: ${json.link_status} (HTTP ${json.http_status ?? '—'})` : 'Prüfung fehlgeschlagen.');
    await load();
  };

  const remove = async (id: string) => {
    await authFetch(`/api/admin/affiliate/products/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Button variant={filterStatus === '' ? 'primary' : 'secondary'} onClick={() => setFilterStatus('')}>Alle</Button>
        {PRODUCT_STATUSES.map((s) => (
          <Button key={s} variant={filterStatus === s ? 'primary' : 'secondary'} onClick={() => setFilterStatus(s)}>
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && (
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {['Titel', 'Marke', 'Preis', 'Status', 'Link', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{p.title} {p.pinned && '📌'}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{p.brand || '—'}</td>
                  <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{p.price ? `${p.price} ${p.currency}` : '—'}</td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    {canManage ? (
                      <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)}>
                        {PRODUCT_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge tone={p.status === 'active' || p.status === 'approved' ? 'success' : 'neutral'}>{STATUS_LABELS[p.status] || p.status}</Badge>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.9rem' }}>
                    <Badge tone={p.link_status === 'ok' ? 'success' : p.link_status === 'broken' ? 'danger' : 'neutral'}>{p.link_status}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.9rem', display: 'flex', gap: '0.4rem' }}>
                    {canManage && <Button variant="secondary" onClick={() => checkLink(p.id)}>Link prüfen</Button>}
                    {canManage && <Button variant="danger" onClick={() => remove(p.id)}>Löschen</Button>}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>Keine Produkte vorhanden.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {canManage && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Neues Produkt (Basisfelder — weitere Felder per API/Import)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
            <input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input placeholder="Marke" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input placeholder="Affiliate-Link (https://...)" value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} />
            <input placeholder="Preis" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          {message && <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>{message}</p>}
          <div style={{ marginTop: '0.75rem' }}>
            <Button onClick={create}>Anlegen</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kampagnen
// ---------------------------------------------------------------------------

type Campaign = { id: string; name: string; season: string | null; active: boolean; start_date: string | null; end_date: string | null };

function CampaignsTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [season, setSeason] = useState('sommer');

  const load = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/affiliate/campaigns');
      const json = await response.json().catch(() => ({ items: [] }));
      setItems(Array.isArray(json.items) ? json.items : []);
    } finally {
      setLoading(false);
    }
  };

  useDeferredLoad(() => void load(), []);

  const create = async () => {
    if (!name.trim()) return;
    await authFetch('/api/admin/affiliate/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, season, product_ids: [], active: true }),
    });
    setName('');
    await load();
  };

  const remove = async (id: string) => {
    await authFetch(`/api/admin/affiliate/campaigns/${id}`, { method: 'DELETE' });
    await load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {['Name', 'Saison', 'Aktiv', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{c.name}</td>
                <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{c.season || '—'}</td>
                <td style={{ padding: '0.6rem 0.9rem' }}><Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'aktiv' : 'inaktiv'}</Badge></td>
                <td style={{ padding: '0.6rem 0.9rem' }}>{canManage && <Button variant="danger" onClick={() => remove(c.id)}>Löschen</Button>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>Keine Kampagnen vorhanden.</td></tr>}
          </tbody>
        </table>
      </Card>
      {canManage && (
        <Card>
          <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Neue Kampagne</p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              {['sommer', 'winter', 'fruehling', 'herbst', 'weihnachten', 'ostern', 'black_friday', 'neujahr'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button onClick={create}>Anlegen</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

type TrackEvent = { id: string; product_id: string; event_type: string; email: string | null; revenue: number | null; created_at: string };

function TrackingTab() {
  const { authFetch, tokens } = useAdmin();
  const [items, setItems] = useState<TrackEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useDeferredLoad(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await authFetch('/api/admin/affiliate/events?limit=50');
        const json = await response.json().catch(() => ({ items: [] }));
        setItems(Array.isArray(json.items) ? json.items : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
            {['Produkt-ID', 'Typ', 'Nutzer', 'Umsatz', 'Zeitpunkt'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.9rem', color: tokens.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <td style={{ padding: '0.6rem 0.9rem', color: tokens.text }}>{e.product_id}</td>
              <td style={{ padding: '0.6rem 0.9rem' }}><Badge tone={e.event_type === 'conversion' ? 'success' : 'neutral'}>{e.event_type}</Badge></td>
              <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{e.email || 'anonym'}</td>
              <td style={{ padding: '0.6rem 0.9rem', color: tokens.muted }}>{e.revenue ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.9rem', color: tokens.mutedMore }}>{new Date(e.created_at).toLocaleString('de-DE')}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} style={{ padding: '1rem', color: tokens.mutedMore, textAlign: 'center' }}>Noch keine Tracking-Ereignisse.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

type AnalyticsRow = { revenue: number; commission: number; clicks: number; impressions: number; conversions: number; title?: string; product_id?: string; category_id?: string; partner_id?: string };

function AnalyticsTab() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<{ top_products: AnalyticsRow[]; top_categories: AnalyticsRow[]; top_partners: AnalyticsRow[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useDeferredLoad(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await authFetch('/api/admin/affiliate/analytics');
        setData(await response.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const renderList = (title: string, rows: AnalyticsRow[], labelKey: string) => (
    <Card style={{ marginBottom: '1rem' }}>
      <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.5rem' }}>{title}</p>
      {rows.length === 0 && <Note>Noch keine Tracking-Daten vorhanden.</Note>}
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${tokens.border}`, fontSize: '0.85rem' }}>
          <span style={{ color: tokens.text }}>{(row as Record<string, unknown>)[labelKey] as string || row.title || '—'}</span>
          <span style={{ color: tokens.muted }}>
            {row.impressions} Impr. · {row.clicks} Klicks · {row.conversions} Conv. · {row.revenue.toFixed(2)} € Umsatz
          </span>
        </div>
      ))}
    </Card>
  );

  return (
    <div>
      {renderList('Top-Produkte', data.top_products, 'title')}
      {renderList('Top-Kategorien', data.top_categories, 'category_id')}
      {renderList('Top-Partner', data.top_partners, 'partner_id')}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provisionen
// ---------------------------------------------------------------------------

function CommissionsTab() {
  const { authFetch, tokens } = useAdmin();
  const [data, setData] = useState<{ total_commission: number; total_revenue: number; conversion_count: number; note: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useDeferredLoad(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await authFetch('/api/admin/affiliate/commissions');
        setData(await response.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Gesamtprovision</p>
          <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>{data.total_commission.toFixed(2)} €</p>
        </Card>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Gesamtumsatz (Conversions)</p>
          <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>{data.total_revenue.toFixed(2)} €</p>
        </Card>
        <Card>
          <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>Conversions</p>
          <p style={{ color: tokens.text, fontSize: '1.75rem', fontWeight: 700 }}>{data.conversion_count}</p>
        </Card>
      </div>
      <Note>{data.note}</Note>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

function ImportTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<{ imported: number; total_rows: number; errors: { row: number; error: string }[] } | null>(null);
  const [message, setMessage] = useState('');

  if (!canManage) return <Note>Nur Admins mit Berechtigung &quot;manage_affiliate&quot; dürfen importieren.</Note>;

  const onFile = async (file: File) => {
    if (format === 'xlsx') {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      setContent(base64);
    } else {
      setContent(await file.text());
    }
  };

  const runImport = async () => {
    if (!content.trim()) return;
    setMessage('Importiere…');
    const response = await authFetch('/api/admin/affiliate/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, content }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(json?.detail || 'Import fehlgeschlagen.');
      return;
    }
    setResult(json);
    setMessage('');
  };

  return (
    <Card>
      <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Produkte importieren (CSV, JSON oder Excel)</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(['csv', 'json', 'xlsx'] as const).map((f) => (
          <Button key={f} variant={format === f ? 'primary' : 'secondary'} onClick={() => setFormat(f)}>{f.toUpperCase()}</Button>
        ))}
      </div>
      <input type="file" accept={format === 'xlsx' ? '.xlsx' : format === 'json' ? '.json' : '.csv'} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {format !== 'xlsx' && (
        <textarea
          placeholder={format === 'csv' ? 'title,affiliate_url,status\nBeispiel,https://example.com/aff,draft' : '[{"title": "Beispiel", "affiliate_url": "https://example.com/aff"}]'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          style={{ width: '100%', marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
        />
      )}
      <div style={{ marginTop: '0.75rem' }}>
        <Button onClick={runImport}>Import starten</Button>
      </div>
      {message && <p style={{ color: tokens.muted, fontSize: '0.85rem', marginTop: '0.5rem' }}>{message}</p>}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: tokens.text }}>{result.imported} von {result.total_rows} Zeilen importiert.</p>
          {result.errors.length > 0 && (
            <ul style={{ color: tokens.danger, fontSize: '0.8rem' }}>
              {result.errors.map((e, i) => <li key={i}>Zeile {e.row}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function ExportTab() {
  const { tokens } = useAdmin();

  const download = (format: string) => {
    const token = localStorage.getItem('token');
    const url = apiUrl(`/api/admin/affiliate/export?format=${format}`);
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `affiliate_products.${format}`;
        link.click();
      });
  };

  return (
    <Card>
      <p style={{ color: tokens.text, fontWeight: 700, marginBottom: '0.75rem' }}>Alle Produkte exportieren</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button onClick={() => download('csv')}>CSV</Button>
        <Button onClick={() => download('json')}>JSON</Button>
        <Button onClick={() => download('xlsx')}>Excel</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------

function SettingsTab({ canManage }: { canManage: boolean }) {
  const { authFetch, tokens } = useAdmin();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/affiliate/settings');
      const json = await response.json();
      setEnabled(json.recommendations_enabled);
    } finally {
      setLoading(false);
    }
  };

  useDeferredLoad(() => void load(), []);

  const toggle = async () => {
    await authFetch('/api/admin/affiliate/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendations_enabled: !enabled }),
    });
    await load();
  };

  if (loading) return <Loading />;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: tokens.text, fontWeight: 700 }}>Affiliate-Empfehlungen global aktiv</p>
          <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Steuert den Feature-Flag &quot;affiliate_recommendations_enabled&quot; — bei Deaktivierung gibt{' '}
            <code>GET /api/affiliate/recommendations</code> weiterhin gültige Daten zurück; die Kontrolle erfolgt im
            aufrufenden Frontend/Twin-Code, nicht serverseitig blockierend, solange der Flag nur informativ gelesen wird.
          </p>
        </div>
        {canManage ? (
          <Button variant={enabled ? 'primary' : 'secondary'} onClick={toggle}>{enabled ? 'Aktiv' : 'Inaktiv'}</Button>
        ) : (
          <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'Aktiv' : 'Inaktiv'}</Badge>
        )}
      </div>
    </Card>
  );
}
