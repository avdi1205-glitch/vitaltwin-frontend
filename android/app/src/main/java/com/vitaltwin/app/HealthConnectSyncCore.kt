package com.vitaltwin.app

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import java.time.Instant
import java.time.temporal.ChronoUnit
import kotlin.reflect.KClass

/**
 * Shared core between `HealthConnectPlugin.kt` (manual, JS-bridge-triggered
 * sync) and `HealthConnectSyncWorker.kt` (WorkManager background sync) —
 * Phase 2.3. Both call the SAME `readGrantedRecords`, hit the SAME backend
 * endpoint shape, and share the SAME sync lock / cached-auth-token storage.
 * Deliberately NOT duplicated per caller — this is what keeps "manual button
 * and background job use the identical code path" true rather than just
 * asserted.
 *
 * Record-type map and per-record JSON shaping are moved here verbatim from
 * `HealthConnectPlugin.kt` (unchanged shapes — the backend's
 * `health_normalization_service.py` is NOT touched by this phase and must
 * keep receiving the exact same per-type JSON it already expects).
 */
object HealthConnectSyncCore {

    const val PREFS_NAME = "vt_health_connect"
    private const val KEY_AUTH_TOKEN = "cached_auth_token"
    private const val KEY_SYNC_LOCK_SINCE = "sync_lock_since_epoch_ms"

    // Generous upper bound for one full multi-type read+upload cycle — long
    // enough that a real sync never gets pre-empted by its own lock, short
    // enough that a crashed/killed process doesn't wedge the lock forever.
    private const val SYNC_LOCK_TIMEOUT_MS = 5 * 60 * 1000L

    val wellnessRecordClasses: Map<String, KClass<out Record>> = mapOf(
        "steps" to StepsRecord::class,
        "distance" to DistanceRecord::class,
        "active-calories" to ActiveCaloriesBurnedRecord::class,
        "total-calories" to TotalCaloriesBurnedRecord::class,
        "exercise-session" to ExerciseSessionRecord::class,
        "heart-rate" to HeartRateRecord::class,
        "resting-heart-rate" to RestingHeartRateRecord::class,
        "heart-rate-variability" to HeartRateVariabilityRmssdRecord::class,
        "oxygen-saturation" to OxygenSaturationRecord::class,
        "respiratory-rate" to RespiratoryRateRecord::class,
        "body-temperature" to BodyTemperatureRecord::class,
        "weight" to WeightRecord::class,
        "sleep-session" to SleepSessionRecord::class,
    )

    // --- Cached auth token (native SharedPreferences; the JWT itself still
    // lives primarily in WebView localStorage — this is only a background-
    // sync-accessible copy, cached explicitly by the JS layer). ---

    fun cacheAuthToken(context: Context, token: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun getCachedAuthToken(context: Context): String? =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_AUTH_TOKEN, null)

    fun clearCachedAuthToken(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_AUTH_TOKEN).apply()
    }

    // --- Sync lock: prevents the manual button and the background worker
    // from running a real sync at the same time. Not required for data
    // correctness (the backend upserts on a stable per-record id regardless
    // — see `health_normalization_service.py`), only to avoid wasted
    // network/battery from two overlapping full read+upload cycles. ---

    @Synchronized
    fun tryAcquireSyncLock(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lockedSince = prefs.getLong(KEY_SYNC_LOCK_SINCE, 0L)
        val now = System.currentTimeMillis()
        if (lockedSince != 0L && now - lockedSince < SYNC_LOCK_TIMEOUT_MS) {
            return false
        }
        prefs.edit().putLong(KEY_SYNC_LOCK_SINCE, now).apply()
        return true
    }

    fun releaseSyncLock(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_SYNC_LOCK_SINCE).apply()
    }

    // --- Reading + shaping (identical to the pre-existing manual-only
    // logic, just no longer private to the Plugin class). ---

    suspend fun readGrantedRecords(context: Context, grantedTypes: List<String>, days: Int = 30): JSObject {
        val client = HealthConnectClient.getOrCreate(context)
        val endTime = Instant.now()
        val startTime = endTime.minus(days.toLong(), ChronoUnit.DAYS)
        val result = JSObject()
        for (dataType in grantedTypes) {
            val recordClass = wellnessRecordClasses[dataType] ?: continue
            try {
                val response = readOneType(client, recordClass, TimeRangeFilter.between(startTime, endTime))
                val records = JSArray()
                response.forEach { record -> shapeRecord(dataType, record, records) }
                if (records.length() > 0) {
                    result.put(dataType, records)
                }
            } catch (e: Exception) {
                // One category failing to read must not block the others —
                // matches the manual button's existing per-type try/catch.
            }
        }
        return result
    }

    // Explicit type argument (`<Record>`) rather than relying on inference
    // from a `KClass<out Record>` value — Kotlin can't infer a generic type
    // parameter from an out-projected KClass, so this is told directly what
    // T is instead of asked to guess it. Safe: `Record` itself satisfies
    // `ReadRecordsRequest`'s `T : Record` bound, and the cast only narrows a
    // wildcard capture, it never changes which concrete class is read.
    @Suppress("UNCHECKED_CAST")
    private suspend fun readOneType(
        client: HealthConnectClient,
        recordClass: KClass<out Record>,
        timeRangeFilter: TimeRangeFilter,
    ): List<Record> {
        val typed = recordClass as KClass<Record>
        return client.readRecords(ReadRecordsRequest<Record>(typed, timeRangeFilter = timeRangeFilter)).records
    }

    fun grantedWellnessTypes(grantedPermissions: Set<String>): List<String> =
        wellnessRecordClasses.filter { (_, recordClass) ->
            grantedPermissions.contains(HealthPermission.getReadPermission(recordClass))
        }.keys.toList()

    private fun shapeRecord(dataType: String, record: Record, out: JSArray) {
        when (dataType) {
            "steps" -> (record as StepsRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("count", it.count)
                    put("startTime", it.startTime.toString())
                    put("endTime", it.endTime.toString())
                })
            }
            "distance" -> (record as DistanceRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("distanceMeters", it.distance.inMeters)
                    put("startTime", it.startTime.toString())
                    put("endTime", it.endTime.toString())
                })
            }
            "active-calories" -> (record as ActiveCaloriesBurnedRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("energyKcal", it.energy.inKilocalories)
                    put("startTime", it.startTime.toString())
                    put("endTime", it.endTime.toString())
                })
            }
            "total-calories" -> (record as TotalCaloriesBurnedRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("energyKcal", it.energy.inKilocalories)
                    put("startTime", it.startTime.toString())
                    put("endTime", it.endTime.toString())
                })
            }
            "exercise-session" -> (record as ExerciseSessionRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("durationSeconds", java.time.Duration.between(it.startTime, it.endTime).seconds)
                    put("exerciseType", it.exerciseType)
                    put("title", it.title)
                    put("startTime", it.startTime.toString())
                    put("endTime", it.endTime.toString())
                })
            }
            "heart-rate" -> (record as HeartRateRecord).let { hr ->
                hr.samples.forEachIndexed { index, sample ->
                    out.put(JSObject().apply {
                        put("id", "${hr.metadata.id}:$index")
                        put("beatsPerMinute", sample.beatsPerMinute)
                        put("time", sample.time.toString())
                    })
                }
            }
            "resting-heart-rate" -> (record as RestingHeartRateRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("beatsPerMinute", it.beatsPerMinute)
                    put("time", it.time.toString())
                })
            }
            "heart-rate-variability" -> (record as HeartRateVariabilityRmssdRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("rmssdMillis", it.heartRateVariabilityMillis)
                    put("time", it.time.toString())
                })
            }
            "oxygen-saturation" -> (record as OxygenSaturationRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("percentage", it.percentage.value)
                    put("time", it.time.toString())
                })
            }
            "respiratory-rate" -> (record as RespiratoryRateRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("rate", it.rate)
                    put("time", it.time.toString())
                })
            }
            "body-temperature" -> (record as BodyTemperatureRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("temperatureCelsius", it.temperature.inCelsius)
                    put("time", it.time.toString())
                })
            }
            "weight" -> (record as WeightRecord).let {
                out.put(JSObject().apply {
                    put("id", it.metadata.id)
                    put("weightKg", it.weight.inKilograms)
                    put("time", it.time.toString())
                })
            }
            "sleep-session" -> (record as SleepSessionRecord).let { session ->
                val stages = JSArray()
                session.stages.forEach { stage ->
                    stages.put(JSObject().apply {
                        put("stage", sleepStageLabel(stage.stage))
                        put("startTime", stage.startTime.toString())
                        put("endTime", stage.endTime.toString())
                    })
                }
                out.put(JSObject().apply {
                    put("id", session.metadata.id)
                    put("startTime", session.startTime.toString())
                    put("endTime", session.endTime.toString())
                    put("stages", stages)
                })
            }
        }
    }

    private fun sleepStageLabel(stageType: Int): String = when (stageType) {
        SleepSessionRecord.STAGE_TYPE_AWAKE -> "awake"
        SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED -> "awake_in_bed"
        SleepSessionRecord.STAGE_TYPE_SLEEPING -> "sleeping"
        SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "out_of_bed"
        SleepSessionRecord.STAGE_TYPE_LIGHT -> "light"
        SleepSessionRecord.STAGE_TYPE_DEEP -> "deep"
        SleepSessionRecord.STAGE_TYPE_REM -> "rem"
        else -> "unknown"
    }
}
