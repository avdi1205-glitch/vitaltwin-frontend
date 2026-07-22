# VitalTwin — Twin Safety (TWIN_SAFETY.md)

> Erstellt in **Etappe 7 (Twin Intelligence Core)**. Dokumentiert die
> medizinischen Grenzen, die Prompt-Injection-Verteidigung und die
> Ausgabe-Validierung des Twin-Conversation-Layers
> (`backend/app/services/twin_conversation.py`,
> `backend/app/services/ai_provider.py`).

## 1. Medizinische Grenzen (Etappe 7 §4)

**Nicht erlaubt, durchgesetzt auf drei Ebenen:**

1. **Systemprompt** (`twin_conversation.py::build_conversation_system_prompt`):
   explizite Liste von Verboten (keine Diagnose, keine
   Medikamentenempfehlung/-dosierung, keine Heilversprechen, keine
   garantierte Prävention/Lebensverlängerung, keine eigene Beurteilung
   medizinischer Dringlichkeit, kein Arztersatz) plus die feste
   Antwortpflicht bei medizinischen Fragen.
2. **Eingabe-Gate** (`contains_medical_red_flag`, vor jedem KI-Aufruf):
   Keyword-Liste (Diagnose, Medikament, Dosierung, Notfall, Rezept,
   Heilversprechen, garantierte Heilung/Prävention/Lebensverlängerung, ...) —
   erkannt heißt: **kein KI-Aufruf**, direkte feste Antwort.
3. **Ausgabe-Gate** (dieselbe Funktion, auf die Modell-Antwort angewendet):
   falls das Modell dennoch medizinisch klingt, wird die Antwort ersetzt,
   nie durchgelassen.

**Fester Text bei medizinischen Fragen:**

> "VitalTwin bietet allgemeine Wellness-Informationen und keine medizinische
> Beratung. Bei gesundheitlichen Beschwerden oder medizinischen Fragen wende
> dich bitte an qualifiziertes medizinisches Fachpersonal."

## 2. Prompt-Injection und Sicherheit (Etappe 7 §5)

| Bedrohung | Schutzmaßnahme |
|---|---|
| "Ignoriere Systemregeln" | Eingabe-Gate `detect_prompt_injection` (Keyword-Liste, DE+EN) + explizite Systemprompt-Anweisung, solche Versuche zu ignorieren |
| Offenlegung interner Prompts | Systemprompt verbietet es explizit; das Antwortschema hat kein Feld für "internal_prompt" o. ä. |
| Zugriff auf fremde Nutzerdaten | Architektonisch ausgeschlossen — der Kontext enthält nur Daten, die der Aufrufer bereits per `email` geladen hat (siehe [TWIN_CONTEXT.md](./TWIN_CONTEXT.md)) |
| Manipulation von `userId` | `userId` wird nie vom Client akzeptiert — `email` kommt ausschließlich aus dem serverseitig verifizierten Session-Token (`core/auth.py`), wie in jeder Etappe seit Etappe 2 |
| Speicherung ungeprüfter KI-Ausgaben | Jede KI-Antwort wird gegen `TwinAIResponse` (Pydantic) validiert, bevor sie zurückgegeben wird — eine ungültige Struktur wird nie gespeichert oder angezeigt, sondern löst eine sichere Fallback-Antwort aus |
| Überlange Eingaben | `MAX_INPUT_LENGTH = 500` — durchgesetzt in der Pydantic-Validierung (`ChatRequest`) **und** defensiv erneut im Provider |
| Schädliche Tool-Anweisungen | Der Twin hat keine Tool-/Funktionsaufruf-Fähigkeiten in dieser Etappe — es gibt nichts, das ausgeführt werden könnte |

**Erkennung, keine Löschung:** Das Prompt-Injection-Gate erkennt bekannte
Muster zuverlässig, ist aber (wie jede Keyword-Liste) nicht perfekt — es ist
eine von mehreren Verteidigungsebenen, nicht die einzige (siehe Systemprompt
+ Schema-Validierung).

## 3. Schema-Validierung vor Speicherung/Anzeige

Jede KI-Antwort muss dem `TwinAIResponse`-Schema entsprechen
(`reply: str`, `sources: list[{type, label}]`, `needs_more_data: bool`,
`type` nur aus einer festen Werteliste). Eine ungültige Struktur (kaputtes
JSON, fehlendes Pflichtfeld, unbekannter `type`-Wert) wirft
`AIResponseValidationError` — die Antwort wird **nie** an den Nutzer
weitergereicht oder gespeichert, stattdessen erscheint eine feste,
ehrliche Fehlermeldung.

## 4. Zusammenspiel mit Etappe 4 (Recommendation Loop)

Der bereits in Etappe 4 etablierte Grundsatz "Empfehlungen sind ausschließlich
regelbasiert, nie KI-generiert" (`recommendation_rules.py`,
`source_type="rule_based"`) bleibt unverändert — der Twin-Conversation-Layer
aus Etappe 7 ist ein **separates** Feature ("Frag deinen Twin"), das nicht in
die Empfehlungslogik eingreift.
