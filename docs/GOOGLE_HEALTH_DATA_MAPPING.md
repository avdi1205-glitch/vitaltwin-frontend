# Google Health — Data Mapping

Per-data-type mapping between the Google Health API and VitalTwin's internal
schema, implemented in `backend/app/core/health_normalization_service.py`.
Sync priority order matches the spec's "Erste Datentypen" section: Steps →
Sleep → Heart Rate → Weight → Distance/Active Minutes (Nutrition deferred).

| Google data type (URL, kebab-case) | Required scope | Google shape | Internal table | Internal `data_type` | Unit | Dedup key |
|---|---|---|---|---|---|---|
| `steps` | `googlehealth.activity_and_fitness.readonly` | Interval | `health_activity_records` | `steps` | `count` | `(user_id, data_type, provider_record_name)` |
| `distance` | `googlehealth.activity_and_fitness.readonly` | Interval | `health_activity_records` | `distance` | `meter` | `(user_id, data_type, provider_record_name)` |
| `active-minutes` | `googlehealth.activity_and_fitness.readonly` | Interval | `health_activity_records` | `active-minutes` | `seconds` | `(user_id, data_type, provider_record_name)` |
| `sleep` | `googlehealth.sleep.readonly` | Session | `health_sleep_records` | n/a (own table) | n/a (stage label) | `(user_id, provider_record_name)` |
| `heart-rate` | `googlehealth.health_metrics_and_measurements.readonly` | Sample | `health_metric_records` | `heart-rate` | `bpm` | `(user_id, data_type, provider_record_name)` |
| `weight` | `googlehealth.health_metrics_and_measurements.readonly` | Sample | `health_metric_records` | `weight` | `kg` | `(user_id, data_type, provider_record_name)` |
| Nutrition (any) | `googlehealth.nutrition.readonly` | — | **not implemented** | — | — | — (deferred per spec) |

## Shape definitions (as implemented)

- **Interval** — has a start and end time (`interval.startTime`/`endTime`).
  Stored in `health_activity_records` with both `start_time`/`end_time`
  populated.
- **Session** — a longer bounded event, here specifically sleep
  (`session.startTime`/`endTime`, plus a `sleepStage` label per segment).
  Stored in its own `health_sleep_records` table (not merged into
  `health_activity_records`) since sleep has a fundamentally different
  shape (stage segments within one sleep period) than a simple
  interval-value pair.
- **Sample** — a single point-in-time measurement
  (`sampleTime.physicalTime`). Stored in `health_metric_records` with only
  `observed_at` guaranteed populated.

## Normalization rules

- All timestamps are stored as Postgres `timestamptz` (UTC-normalized by
  Postgres on insert) — the application never does its own timezone math
  beyond parsing the ISO 8601 string Google returns.
- `value` is extracted from whichever of `value.floatValue` /
  `value.intValue` / top-level `value` / top-level `count` is present and
  numeric — Google's data-type responses are not perfectly uniform across
  types, so this is intentionally tolerant rather than assuming one fixed
  field name.
- `raw_metadata` (JSONB) always stores the **complete original item**
  regardless of whether the specific fields above were successfully
  extracted — see the "known uncertainty" note in
  `GOOGLE_HEALTH_API_AUDIT.md` section 12. No information is ever discarded
  even if a value/timestamp extraction fails; only rows where **no**
  timestamp at all could be determined are skipped (with the skip counted
  in the sync run's `records_skipped`).
- `provider_record_name` is Google's own resource `name` field for the data
  point (used both as a human-readable audit trail and as the dedup key
  component — Google Health API's own concept of a stable point identity).
- `source_name` is derived from the point's `origin.originId` /
  `origin.packageName` when present (which app/device produced this data
  point on Google's side) — informational, not used for dedup.

## Scope-aware sync behavior

Before attempting to fetch a data type, `health_sync_service.py` checks
`has_required_scope(data_type, connection.granted_scopes)`. If the user's
OAuth grant does not include the scope this data type needs (e.g. they
declined "Sleep" on the consent screen), that data type is **skipped
honestly** with `error_code = "HEALTH_SCOPE_MISSING"` in the sync run's
`per_type` result — the sync never silently returns zero rows as if
everything succeeded, and never crashes the whole sync because one data
type wasn't authorized.
