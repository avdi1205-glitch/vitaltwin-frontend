package com.vitaltwin.app

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
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
    // Connect record class. Single source of truth, shared with
    // `HealthConnectSyncWorker.kt` via `HealthConnectSyncCore` (Phase 2.3).
    private val wellnessRecordClasses = HealthConnectSyncCore.wellnessRecordClasses

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
        if (dataType == null || !wellnessRecordClasses.containsKey(dataType)) {
            call.reject("Unknown or missing dataType")
            return
        }
        val days = call.getInt("days", 7) ?: 7

        pluginScope.launch {
            try {
                // Delegates to the SAME read+shape logic HealthConnectSyncWorker
                // uses (HealthConnectSyncCore) — single source of truth, see
                // that file's class doc.
                val byType = HealthConnectSyncCore.readGrantedRecords(context, listOf(dataType), days)
                val ret = JSObject()
                ret.put("records", if (byType.has(dataType)) byType.getJSONArray(dataType) else JSArray())
                call.resolve(ret)
            } catch (e: SecurityException) {
                call.reject("Permission not granted for $dataType", e)
            } catch (e: Exception) {
                call.reject("Failed to read $dataType records: ${e.message}", e)
            }
        }
    }

    // ------------------------------------------------------------------
    // Phase 2.3 — background-sync integration (WorkManager). The actual
    // read/upload work lives in HealthConnectSyncCore/HealthConnectSyncWorker
    // — these 3 methods only expose the pieces the JS-side manual flow
    // needs: caching the auth token natively, and taking/releasing the same
    // lock the background worker respects.
    // ------------------------------------------------------------------

    @PluginMethod
    fun cacheAuthToken(call: PluginCall) {
        val token = call.getString("token")
        if (token.isNullOrBlank()) {
            call.reject("Missing token")
            return
        }
        HealthConnectSyncCore.cacheAuthToken(context, token)
        call.resolve()
    }

    @PluginMethod
    fun beginSync(call: PluginCall) {
        val ret = JSObject()
        ret.put("acquired", HealthConnectSyncCore.tryAcquireSyncLock(context))
        call.resolve(ret)
    }

    @PluginMethod
    fun endSync(call: PluginCall) {
        HealthConnectSyncCore.releaseSyncLock(context)
        call.resolve()
    }
}
