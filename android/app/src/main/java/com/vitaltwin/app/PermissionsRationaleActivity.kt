package com.vitaltwin.app

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Required by the Android Health Connect platform: an app holding any
 * android.permission.health.* grant must declare an activity that responds to
 * VIEW_PERMISSION_USAGE (see the ViewPermissionUsageActivity alias in
 * AndroidManifest.xml), shown when a user taps the privacy policy link on the
 * Health Connect permissions screen. Also reachable directly via
 * androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE during the permission
 * request itself. Wording mirrors the existing web Datenschutz/dashboard
 * disclaimers (Wellness-Orientierung, keine medizinische Bewertung) rather
 * than inventing a second privacy text.
 */
class PermissionsRationaleActivity : Activity() {

    private val bgColor = Color.parseColor("#0B1118")
    private val textColor = Color.parseColor("#F5F2EA")
    private val mutedColor = Color.parseColor("#B7BDC4")
    private val accentColor = Color.parseColor("#F3C979")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val padding = (24 * resources.displayMetrics.density).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(bgColor)
            setPadding(padding, padding * 2, padding, padding)
        }

        val eyebrow = TextView(this).apply {
            text = "VITALTWIN · GESUNDHEITSDATEN"
            setTextColor(mutedColor)
            textSize = 12f
            letterSpacing = 0.08f
        }

        val title = TextView(this).apply {
            text = "Warum VitalTwin deine Schrittzahl liest"
            setTextColor(textColor)
            textSize = 22f
            setTypeface(typeface, Typeface.BOLD)
            setPadding(0, (12 * resources.displayMetrics.density).toInt(), 0, 0)
        }

        val body = TextView(this).apply {
            text =
                "VitalTwin fragt in Health Connect ausschließlich um Erlaubnis, deine " +
                "Schrittzahl zu lesen (READ_STEPS) — nur lesend, es werden keine Daten " +
                "geschrieben und keine weiteren Datentypen abgefragt.\n\n" +
                "Deine Schritte fließen in deinen persönlichen Twin ein und werden mit " +
                "deiner eigenen bisherigen Entwicklung verglichen. Das dient " +
                "ausschließlich der Wellness-Orientierung — VitalTwin stellt keine " +
                "Diagnosen, gibt keine Behandlungsempfehlungen und ersetzt keine " +
                "ärztliche Beratung.\n\n" +
                "Diese Berechtigung ist freiwillig. Lehnst du sie ab oder brichst du " +
                "ab, funktioniert VitalTwin trotzdem weiter — nur ohne automatische " +
                "Schrittdaten. Du kannst den Zugriff jederzeit wieder entziehen, unter " +
                "Android-Einstellungen \u2192 Sicherheit & Datenschutz \u2192 Health " +
                "Connect \u2192 VitalTwin.\n\n" +
                "Ausführliche Informationen zum Datenschutz findest du unter " +
                "vitaltwin.de/datenschutz."
            setTextColor(mutedColor)
            textSize = 15f
            setLineSpacing(6f, 1.1f)
            setPadding(0, (16 * resources.displayMetrics.density).toInt(), 0, 0)
        }

        val closeButton = Button(this).apply {
            text = "Verstanden"
            setTextColor(bgColor)
            setBackgroundColor(accentColor)
            setPadding(padding, padding / 2, padding, padding / 2)
            setOnClickListener { finish() }
        }
        val buttonWrapper = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            setPadding(0, (28 * resources.displayMetrics.density).toInt(), 0, 0)
            addView(closeButton)
        }

        root.addView(eyebrow)
        root.addView(title)
        root.addView(body)
        root.addView(buttonWrapper)

        val scroll = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(bgColor)
            addView(root)
        }

        setContentView(scroll)
    }
}
