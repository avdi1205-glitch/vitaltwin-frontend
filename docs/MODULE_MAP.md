# VitalTwin — Module Map (MODULE_MAP.md)

> Übersicht aller VitalTwin-Module und ihres Implementierungsstatus. Diese
> Datei existierte vor Submodul E nicht — mehrere Spezifikationen
> (Submodul D, Submodul E) verwiesen bereits darauf, daher wird sie hier
> erstmals angelegt und ab jetzt bei jedem neuen Submodul aktualisiert.

## Digital Twin (Nutzer-seitig)

Nicht Teil des Founder Operating System — persönliche Wellness-Begleitung
für einzelne Nutzer.

| Bereich | Status | Doku |
|---|---|---|
| Twin Core / Konversation | ✅ implementiert | [TWIN_CONTEXT.md](./TWIN_CONTEXT.md), [TWIN_INTELLIGENCE_ARCHITECTURE.md](./TWIN_INTELLIGENCE_ARCHITECTURE.md) |
| Twin Memory | ✅ implementiert | [TWIN_MEMORY.md](./TWIN_MEMORY.md) |
| Learning / Pattern Detection | ✅ implementiert | [TWIN_LEARNING_RULES.md](./TWIN_LEARNING_RULES.md) |
| Feedback Loops (Recommendation/Decision/Outcome/Feedback) | ✅ implementiert | [TWIN_FEEDBACK_LOOPS.md](./TWIN_FEEDBACK_LOOPS.md) |
| Explainability ("Warum?") | ✅ implementiert | [TWIN_EXPLAINABILITY.md](./TWIN_EXPLAINABILITY.md) |
| Daily Planning / Reflection Loops | ✅ implementiert | siehe `TWIN_INTELLIGENCE_ARCHITECTURE.md` |
| Safety / medizinische Grenzen | ✅ implementiert | [TWIN_SAFETY.md](./TWIN_SAFETY.md) |

## Affiliate Intelligence Platform

Nicht exklusiv Founder-OS, aber eng verzahnt (Produktdaten, Tracking,
Analytics). Siehe [AFFILIATE_PLATFORM.md](./AFFILIATE_PLATFORM.md),
[AFFILIATE_RULES.md](./AFFILIATE_RULES.md),
[AFFILIATE_TRACKING.md](./AFFILIATE_TRACKING.md),
[AFFILIATE_API.md](./AFFILIATE_API.md). Status: ✅ implementiert.

## Platform Foundation & Integrationen

Registry aller Integrationen (Health-Connectoren, Payment, Auth, KI,
Benachrichtigungen). Siehe
[PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md),
[INTEGRATIONS.md](./INTEGRATIONS.md),
[API_KEYS.md](./API_KEYS.md),
[FEATURE_FLAGS.md](./FEATURE_FLAGS.md). Status: ✅ implementiert.

## Admin Control Center

RBAC, Nutzerverwaltung, Content, Security, System-Status. Siehe
[ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md). Status: ✅ implementiert.

---

## Module 1 — Founder Operating System

Route: `/admin/founder` (eine konsolidierte Seite mit Tabs statt separater
Routen pro Submodul — siehe Begründung in
[SMART_APPROVAL_CENTER.md](./SMART_APPROVAL_CENTER.md) §9). Berechtigungen:
`view_founder_os`/`manage_founder_os` (ein gemeinsames Paar für alle
Submodule, bewusst nicht fragmentiert).

| Submodul | Name | Status | Route/Tab | Doku |
|---|---|---|---|---|
| A | Founder Dashboard | ✅ implementiert | Tab "Dashboard" | *(kein eigenes Dokument — Teil des Gesamt-Founder-OS)* |
| B | Founder Daily Briefing | ✅ implementiert | Tab "Daily Briefing" | [FOUNDER_DAILY_BRIEFING.md](./FOUNDER_DAILY_BRIEFING.md) |
| C | AI Founder Task Manager | ✅ implementiert | Tab "Tasks" | [AI_FOUNDER_TASK_MANAGER.md](./AI_FOUNDER_TASK_MANAGER.md) |
| D | Smart Approval Center | ✅ implementiert | Tab "Approval Center" | [SMART_APPROVAL_CENTER.md](./SMART_APPROVAL_CENTER.md) |
| **E** | **AI Business Coach** | **✅ implementiert** | **Tab "AI Business Coach"** | **[AI_BUSINESS_COACH.md](./AI_BUSINESS_COACH.md)** |

### Abnahmekriterien Submodul E — Status

Alle 20 im Auftrag genannten Abnahmekriterien sind erfüllt — Details und
Nachweis (Tests) in [AI_BUSINESS_COACH.md](./AI_BUSINESS_COACH.md) §12.

### Geplant, noch nicht spezifiziert

Submodul F und folgende — wird erst nach expliziter Freigabe des Gründers
begonnen.
