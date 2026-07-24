'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '../../_lib/AdminContext';
import { Badge, Button, Card, ErrorText, Kpi, Loading, Note, SectionTitle } from '../../_lib/AdminUI';

type TaskStatus = 'neu' | 'in_bearbeitung' | 'warten' | 'erledigt' | 'archiviert';
type TaskPriority = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';

type FounderTask = {
  id: string;
  title: string;
  category: string;
  source: string;
  priority: TaskPriority;
  status: TaskStatus;
  reason: string;
  data_used: string;
  impact_if_ignored: string;
  suggested_action: string | null;
  suggested_action_available: boolean;
  auto_detected: boolean;
  auto_resolved: boolean;
  ignored: boolean;
  remind_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

type Summary = {
  open_tasks: number;
  critical_tasks: number;
  done_today: number;
  auto_detected: number;
  auto_resolved: number;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  neu: 'Neu',
  in_bearbeitung: 'In Bearbeitung',
  warten: 'Warten',
  erledigt: 'Erledigt',
  archiviert: 'Archiviert',
};

const OPEN_STATUSES: TaskStatus[] = ['neu', 'in_bearbeitung', 'warten'];

const SOURCE_LINKS: Record<string, string> = {
  affiliate: '/admin/affiliate',
  premium: '/admin/business',
  stripe: '/admin/business',
  ki: '/admin/ai',
  support: '/admin/support',
  sicherheit: '/admin/security',
  analytics: '/admin/analytics',
  blog: '/admin/content',
};

function priorityTone(priority: TaskPriority): 'danger' | 'neutral' | 'success' {
  if (priority === 'kritisch' || priority === 'hoch') return 'danger';
  if (priority === 'mittel') return 'neutral';
  return 'success';
}

export default function FounderTasksPage() {
  const { authFetch, tokens, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_founder_tasks');
  const [tasks, setTasks] = useState<FounderTask[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState<'offen' | TaskStatus>('offen');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authFetch('/api/admin/founder/tasks');
        if (!response.ok) {
          if (!cancelled) setErrorMessage('Aufgaben konnten nicht geladen werden.');
          return;
        }
        const json = await response.json();
        if (!cancelled) {
          setTasks(Array.isArray(json.items) ? json.items : []);
          setSummary(json.summary);
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

  const reload = async () => {
    const response = await authFetch('/api/admin/founder/tasks');
    if (response.ok) {
      const json = await response.json();
      setTasks(Array.isArray(json.items) ? json.items : []);
      setSummary(json.summary);
    }
  };

  const runAction = async (id: string, action: () => Promise<Response>) => {
    setBusyId(id);
    try {
      await action();
      await reload();
    } finally {
      setBusyId('');
    }
  };

  const markDone = (id: string) =>
    runAction(id, () =>
      authFetch(`/api/admin/founder/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'erledigt' }),
      }),
    );

  const remindLater = (id: string) => runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/remind`, { method: 'POST' }));

  const ignore = (id: string) => runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/ignore`, { method: 'POST' }));

  const applySuggestion = (id: string) =>
    runAction(id, () => authFetch(`/api/admin/founder/tasks/${id}/apply-suggestion`, { method: 'POST' }));

  const setInProgress = (id: string) =>
    runAction(id, () =>
      authFetch(`/api/admin/founder/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_bearbeitung' }),
      }),
    );

  const filteredTasks =
    statusFilter === 'offen' ? tasks.filter((t) => OPEN_STATUSES.includes(t.status)) : tasks.filter((t) => t.status === statusFilter);

  return (
    <div>
      <SectionTitle
        title="AI Founder Task Manager"
        subtitle="Regelbasiert automatisch erkannte Aufgaben aus echten Daten — kein Freitext-KI-Aufruf. Ausführung von Lösungsvorschlägen nur nach deiner Freigabe."
      />

      {loading && <Loading />}
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && !errorMessage && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <Kpi label="Offene Aufgaben" value={summary.open_tasks} />
            <Kpi label="Kritische Aufgaben" value={summary.critical_tasks} />
            <Kpi label="Heute erledigt" value={summary.done_today} />
            <Kpi label="Automatisch erkannt" value={summary.auto_detected} />
            <Kpi label="Automatisch gelöst" value={summary.auto_resolved} />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Button variant={statusFilter === 'offen' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('offen')}>
              Offen
            </Button>
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <Button key={s} variant={statusFilter === s ? 'primary' : 'secondary'} onClick={() => setStatusFilter(s)}>
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.length === 0 && <Note>Keine Aufgaben in dieser Ansicht.</Note>}
            {filteredTasks.map((task) => (
              <Card key={task.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem' }}>{task.title}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                      <Badge tone="neutral">{task.category}</Badge>
                      <Badge tone="neutral">{STATUS_LABELS[task.status]}</Badge>
                      {task.auto_resolved && <Badge tone="success">automatisch gelöst</Badge>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Button variant="secondary" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                      Details
                    </Button>
                    {SOURCE_LINKS[task.source] && (
                      <a
                        href={SOURCE_LINKS[task.source]}
                        style={{ color: tokens.accent, fontSize: '0.85rem', alignSelf: 'center', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Öffnen →
                      </a>
                    )}
                    {canManage && OPEN_STATUSES.includes(task.status) && (
                      <>
                        {task.status === 'neu' && (
                          <Button variant="secondary" disabled={busyId === task.id} onClick={() => setInProgress(task.id)}>
                            In Bearbeitung
                          </Button>
                        )}
                        {task.suggested_action_available && (
                          <Button disabled={busyId === task.id} onClick={() => applySuggestion(task.id)}>
                            {task.suggested_action}
                          </Button>
                        )}
                        <Button variant="secondary" disabled={busyId === task.id} onClick={() => markDone(task.id)}>
                          Erledigt
                        </Button>
                        <Button variant="secondary" disabled={busyId === task.id} onClick={() => remindLater(task.id)}>
                          Später erinnern
                        </Button>
                        <Button variant="danger" disabled={busyId === task.id} onClick={() => ignore(task.id)}>
                          Ignorieren
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {expanded === task.id && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${tokens.border}` }}>
                    <p style={{ color: tokens.muted, fontSize: '0.8rem' }}>
                      <strong style={{ color: tokens.text }}>Warum erstellt:</strong> {task.reason}
                    </p>
                    <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      <strong style={{ color: tokens.text }}>Verwendete Daten:</strong> {task.data_used}
                    </p>
                    <p style={{ color: tokens.muted, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      <strong style={{ color: tokens.text }}>Auswirkung bei Nichtstun:</strong> {task.impact_if_ignored}
                    </p>
                    {!task.suggested_action_available && (
                      <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginTop: '0.4rem' }}>
                        Keine automatische Lösung verfügbar — muss manuell bearbeitet werden.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
