package com.vitaltwin.app

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
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
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlin.reflect.KClass
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * VITALTWIN – ANDROID HEALTH CONNECT.
 * READ-ONLY wellness data only — no write. Phase 1 shipped steps-only
 * (`readSteps`/`requestStepsPermission`, kept below UNCHANGED). Phase 2.2
 * adds a consolidated, data-type-driven flow (`getGrantedWellnessPermissions`
 * /`requestWellnessPermissions`/`readWellnessRecords`) covering the full
 * supported wellness set, without touching the Phase 1 methods. Kept
 * independent of the (unrelated, backend/cloud-based) Google Health REST
 * integration; this is purely an on-device Health Connect read capability.
 *
 * Deliberately NOT implemented: `SkinTemperatureRecord` — its
 * baseline+delta-list shape can't be safely reduced to one canonical
 * scalar without inventing an interpretation, so it's left out rather than
 * guessed at (see `WELLNESS_DATA_TYPES` — every other requested type from
 * the task spec is present).
 */
@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    private val stepsReadPermission = HealthPermission.getReadPermission(StepsRecord::class)
    private val permissionContract = PermissionController.createRequestPermissionResultContract()
    private val pluginScope = CoroutineScope(Dispatchers.Main)

    // data_type string (SAME identifiers the backend's
    // `health_normalization_service.HEALTH_CONNECT_TYPES` uses) -> Health
    // Connect record class. Single source of truth for the consolidated
    // permission/read flow below.
    private val wellnessRecordClasses: Map<String, KClass<out Record>> = mapOf(
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

    @PluginMethod
    fun checkAvailability(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val ret = JSObject()
        ret.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        ret.put(
            "status",
            when (status) {
                HealthConnectClient.SDK_AVAILABLE -> "available"
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
                else -> "unavailable"
            }
        )
        call.resolve(ret)
    }

    @PluginMethod
    fun requestStepsPermission(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        val intent = permissionContract.createIntent(context, setOf(stepsReadPermission))
        startActivityForResult(call, intent, "handlePermissionResult")
    }

    @ActivityCallback
    private fun handlePermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val granted = permissionContract.parseResult(result.resultCode, result.data)
        val ret = JSObject()
        ret.put("granted", granted.contains(stepsReadPermission))
        call.resolve(ret)
    }

    @PluginMethod
    fun readSteps(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        val days = call.getInt("days", 7) ?: 7
        val client = HealthConnectClient.getOrCreate(context)

        pluginScope.launch {
            try {
                val endTime = Instant.now()
                val startTime = endTime.minus(days.toLong(), ChronoUnit.DAYS)
                val response = client.readRecords(
                    ReadRecordsRequest(
                        StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                )
                val records = JSArray()
                response.records.forEach { record ->
                    val item = JSObject()
                    item.put("id", record.metadata.id)
                    item.put("count", record.count)
                    item.put("startTime", record.startTime.toString())
                    item.put("endTime", record.endTime.toString())
                    records.put(item)
                }
                val ret = JSObject()
                ret.put("records", records)
                call.resolve(ret)
            } catch (e: SecurityException) {
                call.reject("READ_STEPS permission not granted", e)
            } catch (e: Exception) {
                call.reject("Failed to read step records: ${e.message}", e)
            }
        }
    }

    // ------------------------------------------------------------------
    // Phase 2.2 — consolidated, data-type-driven flow.
    // ------------------------------------------------------------------

    @PluginMethod
    fun getGrantedWellnessPermissions(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        val client = HealthConnectClient.getOrCreate(context)
        pluginScope.launch {
            try {
                val grantedPermissions = client.permissionController.getGrantedPermissions()
                val granted = JSArray()
                wellnessRecordClasses.forEach { (dataType, recordClass) ->
                    if (grantedPermissions.contains(HealthPermission.getReadPermission(recordClass))) {
                        granted.put(dataType)
                    }
                }
                val ret = JSObject()
                ret.put("granted", granted)
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("Failed to read granted permissions: ${e.message}", e)
            }
        }
    }

    @PluginMethod
    fun requestWellnessPermissions(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        val requestedTypes = call.getArray("dataTypes")
        val requestedList = mutableListOf<String>()
        if (requestedTypes != null) {
            for (i in 0 until requestedTypes.length()) {
                requestedList.add(requestedTypes.getString(i))
            }
        }
        val permissions = requestedList.mapNotNull { dataType ->
            wellnessRecordClasses[dataType]?.let { HealthPermission.getReadPermission(it) }
        }.toSet()
        if (permissions.isEmpty()) {
            call.reject("No recognized data types requested")
            return
        }
        val intent = permissionContract.createIntent(context, permissions)
        startActivityForResult(call, intent, "handleWellnessPermissionResult")
    }

    @ActivityCallback
    private fun handleWellnessPermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val grantedPermissions = permissionContract.parseResult(result.resultCode, result.data)
        val granted = JSArray()
        wellnessRecordClasses.forEach { (dataType, recordClass) ->
            if (grantedPermissions.contains(HealthPermission.getReadPermission(recordClass))) {
                granted.put(dataType)
            }
        }
        val ret = JSObject()
        ret.put("granted", granted)
        call.resolve(ret)
    }

    @PluginMethod
    fun readWellnessRecords(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        val dataType = call.getString("dataType")
        val recordClass = dataType?.let { wellnessRecordClasses[it] }
        if (dataType == null || recordClass == null) {
            call.reject("Unknown or missing dataType")
            return
        }
        val days = call.getInt("days", 7) ?: 7
        val client = HealthConnectClient.getOrCreate(context)

        pluginScope.launch {
            try {
                val endTime = Instant.now()
                val startTime = endTime.minus(days.toLong(), ChronoUnit.DAYS)
                val response = client.readRecords(
                    ReadRecordsRequest(recordClass, timeRangeFilter = TimeRangeFilter.between(startTime, endTime))
                )
                val records = JSArray()
                response.records.forEach { record -> shapeRecord(dataType, record, records) }
                val ret = JSObject()
                ret.put("records", records)
                call.resolve(ret)
            } catch (e: SecurityException) {
                call.reject("Permission not granted for $dataType", e)
            } catch (e: Exception) {
                call.reject("Failed to read $dataType records: ${e.message}", e)
            }
        }
    }

    /** Shapes ONE Health Connect record into the exact JSON shape the
     * backend's `normalize_health_connect_record()` expects for this data
     * type — a `HeartRateRecord` contains multiple samples per record, so
     * it appends one JSON item PER SAMPLE (with a composite id) rather
     * than one per record. */
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
                    // Raw Health Connect exercise-type int, deliberately NOT
                    // decoded into a human label here (95+ types, no
                    // built-in name lookup) — the real value is preserved
                    // untouched, never guessed at.
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
