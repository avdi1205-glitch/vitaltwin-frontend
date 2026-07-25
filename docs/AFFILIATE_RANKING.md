# Affiliate Ranking (Smart Ranking Explainability)

## Zweck

`core/affiliate_ranking.py` liefert eine **erklärbare**, zusätzliche
Score-Berechnung für den Recommendation-Simulator und das Dashboard. Sie
verändert **nicht** die echte Live-Sortierung in
`core/affiliate_engine.py::get_eligible_products()` — jene bleibt
unverändert, um das Risiko einer Regression im produktiven
Empfehlungspfad zu vermeiden.

## Zentrale Gewichtung

```python
RANKING_WEIGHTS = {
    "quality": 0.35,
    "relevance": 0.25,
    "feedback": 0.15,
    "conversion": 0.10,
    "recency_availability": 0.10,
    "commission": 0.05,
}
```

Qualität und Relevanz für den Nutzer wiegen bewusst deutlich schwerer als
die Provision (`commission`), um dem Prinzip "Qualität vor Provision" zu
entsprechen.

## Score-Berechnung

`compute_product_score(product, context_category_id=None, impressions=0,
conversions=0)` liefert:

```json
{
  "score": 0.0,
  "breakdown": { "quality": 0.0, "relevance": 0.0, ... },
  "weights": { ... },
  "explanation": ["Qualität: ...", "Relevanz: ...", ...]
}
```

Jede Komponente (`_quality_component`, `_relevance_component`,
`_feedback_component`, `_conversion_component`,
`_recency_availability_component`, `_commission_component`) ist einzeln
testbar und erklärt ihren eigenen Beitrag im `explanation`-Array.

## Verwendung

- **Recommendation Simulator** (`POST
  /affiliate-intelligence/simulate`): rankt die von
  `affiliate_engine.get_eligible_products()` gelieferten, bereits
  gefilterten Produkte zusätzlich nach Score, rein zu
  Erklärungs-/Testzwecken.
- **Dashboard**: keine direkte Nutzung, nur über den Simulator sichtbar.

## Bekannte Grenzen

- Kein A/B-Test-Beweis, dass dieses Scoring die Konversion verbessert —
  es ist ein transparentes, regelbasiertes Erklärungswerkzeug, kein
  produktives Sortierkriterium.
