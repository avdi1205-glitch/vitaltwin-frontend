# VitalTwin — Affiliate API Reference (AFFILIATE_API.md)

> Alle Endpunkte der Affiliate Intelligence & Management Platform.
> Admin-Endpunkte erfordern `Authorization: Bearer <token>` eines Admins
> mit der jeweils genannten Berechtigung (`core/admin_rbac.py`).
> Öffentliche Endpunkte (`/api/affiliate/*`) erfordern normale
> Nutzer-Anmeldung, außer wo explizit "anonym erlaubt" vermerkt ist.

## Admin — `/api/admin/affiliate` (`routers/affiliate_admin.py`)

| Methode | Pfad | Berechtigung | Zweck |
|---|---|---|---|
| GET | `/dashboard` | `view_affiliate` | KPIs: Produkte nach Status, zulässige Empfehlungen, defekte Links, Partner |
| GET | `/partners` | `view_affiliate` | Partnerprogramme auflisten |
| POST | `/partners` | `manage_affiliate` | Partnerprogramm anlegen |
| PATCH | `/partners/{id}` | `manage_affiliate` | Partnerprogramm bearbeiten |
| DELETE | `/partners/{id}` | `manage_affiliate` | Partnerprogramm löschen |
| GET | `/categories` | `view_affiliate` | Kategorien auflisten |
| POST | `/categories` | `manage_affiliate` | Kategorie anlegen |
| DELETE | `/categories/{id}` | `manage_affiliate` | Kategorie löschen |
| GET | `/products` | `view_affiliate` | Produkte auflisten (optional `?status=`) |
| POST | `/products` | `manage_affiliate` | Produkt anlegen (Status startet i. d. R. bei `draft`) |
| PATCH | `/products/{id}` | `manage_affiliate` | Produkt vollständig bearbeiten |
| PATCH | `/products/{id}/status` | `manage_affiliate` | Nur Status ändern (Freigabe-Workflow) |
| DELETE | `/products/{id}` | `manage_affiliate` | Produkt löschen |
| POST | `/products/{id}/check-link` | `manage_affiliate` | **Echter** HTTP-Request gegen den Affiliate-Link jetzt |
| GET | `/blacklist` | `view_affiliate` | Sperrliste auflisten |
| POST | `/blacklist` | `manage_affiliate` | Produkt/Marke/Partner/Kategorie sperren |
| DELETE | `/blacklist/{id}` | `manage_affiliate` | Sperre aufheben |
| GET | `/campaigns` | `view_affiliate` | Saisonale Kampagnen auflisten |
| POST | `/campaigns` | `manage_affiliate` | Kampagne anlegen |
| PATCH | `/campaigns/{id}` | `manage_affiliate` | Kampagne bearbeiten |
| DELETE | `/campaigns/{id}` | `manage_affiliate` | Kampagne löschen |
| GET | `/ab-tests` | `view_affiliate` | A/B-Tests inkl. live aggregierter Ereignisse je Variante |
| POST | `/ab-tests` | `manage_affiliate` | A/B-Test anlegen (Produkt A vs. B) |
| POST | `/ab-tests/{id}/complete` | `manage_affiliate` | Test abschließen, Gewinner anhand echter Conversions bestimmen |
| GET | `/events` | `view_affiliate` | Tracking-Ereignisse (Filter: `event_type`, `product_id`, `limit`) |
| GET | `/analytics` | `view_affiliate` | Top-Produkte/-Kategorien/-Partner |
| GET | `/commissions` | `view_affiliate` | Summierte Provision/Umsatz aus echten Conversions |
| POST | `/import` | `manage_affiliate` | Produkte importieren (`{format, content}`, siehe unten) |
| GET | `/export?format=` | `view_affiliate` | Produkte exportieren (`csv`\|`json`\|`xlsx`) |
| GET | `/settings` | `view_affiliate` | Globaler Empfehlungs-Schalter lesen |
| PUT | `/settings` | `manage_affiliate` | Globalen Empfehlungs-Schalter setzen |

### Import-Body

```json
{ "format": "csv" | "json" | "xlsx", "content": "<Rohtext für csv/json, Base64 für xlsx>" }
```

Pflichtfelder je Produktzeile: `title`, `affiliate_url`. `category`/
`partner` werden per Namens-Lookup aufgelöst; nicht gefundene Namen führen
zu einer Fehlermeldung pro Zeile, aber die Zeile wird trotzdem ohne diese
Zuordnung importiert (kein stiller Datenverlust).

## Öffentlich — `/api/affiliate` (`routers/affiliate.py`)

| Methode | Pfad | Auth | Zweck |
|---|---|---|---|
| GET | `/recommendations?category=&limit=` | Login erforderlich | Regelbasierte Produktempfehlungen (siehe [AFFILIATE_RULES.md](./AFFILIATE_RULES.md)), jedes Element mit `is_affiliate: true` + `disclosure` |
| POST | `/track` | anonym erlaubt | Impression/Klick/Conversion erfassen (`{product_id, event_type, ...}`) |
| GET | `/prefs` | Login erforderlich | Eigene Affiliate-Präferenzen lesen |
| PUT | `/prefs` | Login erforderlich | Präferenzen setzen (`affiliate_enabled`, `hidden_categories`, `hidden_products`) |

## Fehlerkonventionen

Wie im restlichen Backend: `404` bei nicht gefundenen Ressourcen (nie
`403` zur Ownership-Verschleierung, wo relevant), `400` bei ungültigen
Eingaben (z. B. unbekannter Produktstatus, unbekanntes Export-Format),
`500` nur bei echten Backend-/DB-Fehlern — nie ein stiller Erfolg mit
erfundenen Daten.
