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
 * VITALTWIN – ANDROID HEALTH CONNECT PHASE 1 (minimal foundation).
 * READ-ONLY steps access only — no write, no other data types. Kept
 * independent of the (unrelated, backend/cloud-based) Google Health REST
 * integration; this is purely an on-device Health Connect read capability.
 */
@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    private val stepsReadPermission = HealthPermission.getReadPermission(StepsRecord::class)
    private val permissionContract = PermissionController.createRequestPermissionResultContract()
    private val pluginScope = CoroutineScope(Dispatchers.Main)

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
}
