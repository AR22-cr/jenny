const HIGH_IS_BAD_METRICS = new Set([
  "stress",
  "fatigue",
  "cramps",
  "pain",
  "pain_rating_now",
  "pain_interference_daily_activities",
  "nervous_or_on_edge_today",
  "anxiety_level_today",
  "irritability_today",
  "hormonal_symptoms_today",
  "deviation_from_cycle_pattern",
  "side_effect_severity",
  "side_effect_trend",
  "side_effect_interference",
  "treatment_sleep_impact",
  "fatigue_vs_baseline",
  "heart_rate_change_today",
  "dizziness_today",
  "nausea_today",
  "temperature_sensitivity_today",
  "productivity_impact",
  "increased_rest_need",
  "woke_up_during_night"
]);

const LOW_IS_BAD_METRICS = new Set([
  "sleep_hours",
  "sleep_quality_last_night",
  "rested_feeling_now",
  "enjoyed_usual_activities",
  "hopeful_about_future_today",
  "emotional_stability_today",
  "mental_clarity_today",
  "morning_refreshment",
  "daily_functionality",
  "perceived_recovery_trend",
  "treatment_effectiveness_today",
  "symptoms_improved_since_treatment",
  "medication_timing_adherence",
  "took_all_medications_as_prescribed_today"
]);

function inferDirection(metricName) {
  if (HIGH_IS_BAD_METRICS.has(metricName)) return "high_is_bad";
  if (LOW_IS_BAD_METRICS.has(metricName)) return "low_is_bad";
  return "neutral";
}

function ensureNumericList(value, fieldName) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a list.`);
  }

  return value.map((x) => {
    const parsed = Number(x);
    if (Number.isNaN(parsed)) {
      throw new Error(`All values in ${fieldName} must be numeric.`);
    }
    return parsed;
  });
}

function ensureOptionalDates(value) {
  if (value == null) return null;
  if (!Array.isArray(value)) {
    throw new Error("dates must be a list if provided.");
  }
  return value.map((x) => String(x));
}

function ensureTreatmentContext(value) {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("treatment_context must be an object if provided.");
  }

  const active = Boolean(value.active ?? false);
  const daysSinceChange = value.days_since_change ?? null;

  if (daysSinceChange !== null && !Number.isInteger(daysSinceChange)) {
    throw new Error("days_since_change must be an integer if provided.");
  }

  return {
    active,
    days_since_change: daysSinceChange
  };
}

function validateMetricPayload(metricName, metricPayload) {
  if (!metricPayload || typeof metricPayload !== "object" || Array.isArray(metricPayload)) {
    throw new Error(`Metric payload for '${metricName}' must be an object.`);
  }

  if (!("current" in metricPayload)) {
    throw new Error(`Metric '${metricName}' is missing required field 'current'.`);
  }

  const current = Number(metricPayload.current);
  if (Number.isNaN(current)) {
    throw new Error(`Metric '${metricName}' current value must be numeric.`);
  }

  const history = ensureNumericList(metricPayload.history ?? [], `${metricName}.history`);
  const dates = ensureOptionalDates(metricPayload.dates);
  const treatmentContext = ensureTreatmentContext(metricPayload.treatment_context);

  return {
    current,
    history,
    dates,
    direction: inferDirection(metricName),
    treatment_context: treatmentContext
  };
}

const inputItems = $input.all();

if (!inputItems || inputItems.length === 0) {
  throw new Error("No input items received by Validate and Normalize Data node.");
}

const outputs = inputItems.map((item) => {
  const payload = item.json;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Each input item must contain a JSON object.");
  }

  const patientId = payload.patient_id;
  if (!patientId) {
    throw new Error("Missing patient_id.");
  }

  const rawMetrics = payload.metrics;
  if (!rawMetrics || typeof rawMetrics !== "object" || Array.isArray(rawMetrics) || Object.keys(rawMetrics).length === 0) {
    throw new Error(`Missing or invalid metrics object for patient ${patientId}.`);
  }

  const normalizedMetrics = {};

  for (const [metricName, metricPayload] of Object.entries(rawMetrics)) {
    normalizedMetrics[metricName] = validateMetricPayload(metricName, metricPayload);
  }

  return {
    json: {
      patient_id: String(patientId),
      metrics: normalizedMetrics
    }
  };
});

return outputs;