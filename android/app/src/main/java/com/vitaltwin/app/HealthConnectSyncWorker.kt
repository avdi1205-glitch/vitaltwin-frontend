package com.vitaltwin.app

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * Background Health Connect sync (Phase 2.3) — periodic (~6h) and
 * app-foreground-triggered. Uses the EXACT same read logic
 * (`HealthConnectSyncCore.readGrantedRecords`) and the EXACT same backend
 * endpoint/payload shape as the manual "Jetzt synchronisieren" button in
 * `HealthConnectSync.tsx` — no second/shortened path. The only difference
 * from the manual flow is `sync_type: "background"` in the request body (new
 * value, backend migration 041 makes `health_sync_runs.connection_id`
 * nullable so this can actually be logged).
 *
 * Deliberately uses `HttpURLConnection` (JDK built-in) rather than adding a
 * new HTTP client dependency (OkHttp/Retrofit) — a single JSON POST doesn't
 * warrant one, matching this project's established "no new dependency
 * unless required" convention.
 */
class HealthConnectSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    // Production API base — native code has no access to the Next.js
    // `NEXT_PUBLIC_API_BASE_URL` env var the web app resolves at build time
    // (see frontend/lib/api.ts), so it's mirrored here explicitly.
    private val apiBase = "https://api.vitaltwin.de"

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        if (HealthConnectClient.getSdkStatus(applicationContext) != HealthConnectClient.SDK_AVAILABLE) {
            return@withContext Result.success() // nothing to do on this device, not an error
        }

        val token = HealthConnectSyncCore.getCachedAuthToken(applicationContext)
        if (token.isNullOrBlank()) {
            // No cached session (never logged in on this device yet, or the
            // user logged out) — clean, silent stop. No crash, no retry
            // loop; the next periodic run tries again in ~6h.
            return@withContext Result.success()
        }

        if (!HealthConnectSyncCore.tryAcquireSyncLock(applicationContext)) {
            // Manual button sync (or another background run) is already in
            // flight — skip this run entirely rather than overlap it.
            return@withContext Result.success()
        }

        try {
            val client = HealthConnectClient.getOrCreate(applicationContext)
            val grantedPermissions = client.permissionController.getGrantedPermissions()
            val grantedTypes = HealthConnectSyncCore.grantedWellnessTypes(grantedPermissions)
            if (grantedTypes.isEmpty()) {
                return@withContext Result.success() // nothing granted yet, nothing to sync
            }

            val records = HealthConnectSyncCore.readGrantedRecords(applicationContext, grantedTypes, days = 30)
            val body = org.json.JSONObject()
            body.put("records", records)
            body.put("sync_type", "background")

            val statusCode = postSync(token, body.toString())
            when (statusCode) {
                200 -> Result.success()
                401, 403 -> {
                    // Expired/invalid session — clean abort per spec, no
                    // health_sync_runs "success" row (the backend never even
                    // receives a processable request), no immediate retry.
                    HealthConnectSyncCore.clearCachedAuthToken(applicationContext)
                    Result.failure()
                }
                else -> Result.failure()
            }
        } catch (e: Exception) {
            Result.failure()
        } finally {
            HealthConnectSyncCore.releaseSyncLock(applicationContext)
        }
    }

    private fun postSync(token: String, jsonBody: String): Int {
        val url = URL("$apiBase/api/health/health-connect/sync")
        val connection = url.openConnection() as HttpsURLConnection
        return try {
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.connectTimeout = 15_000
            connection.readTimeout = 30_000
            connection.doOutput = true
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(jsonBody) }
            connection.responseCode
        } finally {
            connection.disconnect()
        }
    }
}
