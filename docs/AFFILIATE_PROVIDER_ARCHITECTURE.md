# Affiliate Provider Architecture

## Ziel

Eine einheitliche, ehrliche Abstraktion über alle Affiliate-"Provider" —
sowohl echte Netzwerk-APIs (aktuell nicht angebunden) als auch den
tatsächlich funktionierenden manuellen CSV/JSON/Excel-Import.

## `core/affiliate_provider.py`

- `ProviderStatus` (frozen dataclass): `id`, `name`, `configured`,
  `connection_tested`, `kind` (`network_api` | `manual_import`),
  `last_checked`, `note`, `required_credentials`.
- `get_provider_statuses()` — liefert 6 Netzwerke (Amazon PartnerNet, Awin,
  Digistore24, CJ Affiliate, Impact, Tradedoubler) über die **bestehende**
  Registry `core/integrations.py::get_affiliate_networks()` (keine neue
  Providerliste), alle ehrlich mit `configured=False,
  connection_tested=False` markiert, plus **einen** echten Eintrag
  `manual_import` mit `configured=True, connection_tested=True`.
- `ManualImportProvider.sync_products(fmt, content, created_by)` delegiert
  direkt an die bestehende `core/affiliate_import_export.py::import_products()`
  — keine Duplikat-Logik.

## Warum keine echten Netzwerk-Integrationen?

Es liegen keine Zugangsdaten/API-Keys für die 6 Netzwerke vor. Anstatt das
vorzutäuschen, meldet das System ehrlich `not_implemented` /
`configured=False`. Sobald der Gründer echte Zugangsdaten bereitstellt,
kann pro Netzwerk ein eigener `Provider`-Adapter ergänzt werden, ohne die
bestehende Struktur zu ändern.

## Sicherheit

Zugangsdaten (`api_key` in `vt_affiliate_partners`) werden — wie bereits
vor Submodul F — nur serverseitig gelesen, nie an das Frontend
zurückgegeben. Diese Beschränkung wurde nicht verändert.

## Bekannte Grenzen

- `connected_apis` im Dashboard ist ehrlich `0`, solange keine echte
  Netzwerkanbindung existiert.
- Kein automatischer/geplanter Sync-Job — Import ist ausschließlich
  admin-initiiert.
