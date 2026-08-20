package com.vitaltwin.app

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Schedules the Health Connect background sync (Phase 2.3) once per process
 * start. Two triggers, both enqueuing the SAME `HealthConnectSyncWorker`:
 *  - a periodic ~6h job (WorkManager's own Doze/App-Standby-aware scheduling
 *    applies — deliberately NOT requesting battery-optimization/Doze
 *    exemption, see class doc on HealthConnectSyncWorker; that exemption is
 *    reserved for latency-critical use cases like alarms/VPN and would be a
 *    Play Store policy risk for a routine data-sync job)
 *  - a one-off job on every app foreground (`MainActivity.onResume()`),
 *    deduplicated via `ExistingWorkPolicy.KEEP` so rapid resume/pause cycles
 *    don't pile up redundant requests.
 *
 * Enqueuing itself is cheap/instant (WorkManager persists the request and
 * runs it later on its own schedule) — safe to call unconditionally, even
 * if the user never granted Health Connect permissions yet (the Worker
 * checks that itself and no-ops).
 */
class VitalTwinApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        schedulePeriodicHealthConnectSync()
    }

    private fun schedulePeriodicHealthConnectSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val request = PeriodicWorkRequestBuilder<HealthConnectSyncWorker>(6, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "vt_health_connect_periodic_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            request,
        )
    }

    companion object {
        /** Called from `MainActivity.onResume()` — one-off foreground sync trigger. */
        fun enqueueForegroundSync(app: Application) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = OneTimeWorkRequestBuilder<HealthConnectSyncWorker>()
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(app).enqueueUniqueWork(
                "vt_health_connect_foreground_sync",
                ExistingWorkPolicy.KEEP,
                request,
            )
        }
    }
}
