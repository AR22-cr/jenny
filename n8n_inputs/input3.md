function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeMedianMad(series) {
  const med = median(series);
  const absDevs = series.map(x => Math.abs(x - med));
  const mad = median(absDevs);
  return { median: med, mad };
}

function robustZScore(current, med, mad) {
  if (mad < 1e-6) {
    return current === med ? 0.0 : 3.0;
  }
  return (current - med) / (1.4826 * mad);
}

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

function directionalSeverity(metric, value, baseline) {
  if (HIGH_IS_BAD_METRICS.has(metric)) return value - baseline;
  if (LOW_IS_BAD_METRICS.has(metric)) return baseline - value;
  return Math.abs(value - baseline);
}

function trendDelta(metric, history) {
  if (!history || history.length < 7) return 0.0;

  const shortAvg = mean(history.slice(-7));
  const longAvg = history.length >= 30 ? mean(history.slice(-30)) : mean(history);

  if (HIGH_IS_BAD_METRICS.has(metric)) return shortAvg - longAvg;
  if (LOW_IS_BAD_METRICS.has(metric)) return longAvg - shortAvg;
  return Math.abs(shortAvg - longAvg);
}

function extremenessPoints(z) {
  const az = Math.abs(z);
  if (az >= 3.5) return 3;
  if (az >= 2.5) return 2;
  if (az >= 1.5) return 1;
  return 0;
}

function trendPoints(delta) {
  if (delta > 2) return 2;
  if (delta > 0.75) return 1;
  return 0;
}

function persistencePoints(metric, history, baseline) {
  const recent = history.slice(-5);
  if (recent.length === 0) return 0;

  let badDays = 0;
  for (const x of recent) {
    if (directionalSeverity(metric, x, baseline) > 0) {
      badDays += 1;
    }
  }

  if (badDays >= 4) return 2;
  if (badDays >= 2) return 1;
  return 0;
}

function severityPoints(metric, current) {
  if (["stress", "fatigue", "cramps", "pain", "pain_rating_now"].includes(metric)) {
    if (current >= 9) return 2;
    if (current >= 7) return 1;
    return 0;
  }

  if (["sleep_hours", "sleep_quality_last_night"].includes(metric)) {
    if (current < 4) return 2;
    if (current < 6) return 1;
    return 0;
  }

  if (metric === "steps") {
    if (current < 2000) return 2;
    if (current < 5000) return 1;
    return 0;
  }

  if (["resting_heart_rate", "heart_rate_change_today"].includes(metric)) {
    if (current >= 90) return 2;
    if (current >= 80) return 1;
    return 0;
  }

  return 0;
}

function treatmentPoints(treatmentContext) {
  if (!treatmentContext) return 0;

  const active = treatmentContext.active ?? false;
  const daysSinceChange = treatmentContext.days_since_change;

  if (!active || daysSinceChange == null) return 0;
  if (daysSinceChange >= 0 && daysSinceChange <= 7) return 2;
  if (daysSinceChange >= 8 && daysSinceChange <= 14) return 1;
  return 0;
}

function recurringPatternFlags(metric, dates, history) {
  if (!dates || dates.length !== history.length || history.length < 10) {
    return [];
  }

  const monthEndVals = [];
  const midMonthVals = [];

  for (let i = 0; i < dates.length; i++) {
    const d = String(dates[i]);
    const v = history[i];
    const parts = d.split("-");
    const day = parseInt(parts[parts.length - 1], 10);

    if (Number.isNaN(day)) continue;

    if (day >= 25) monthEndVals.push(v);
    else if (day >= 10 && day <= 20) midMonthVals.push(v);
  }

  if (monthEndVals.length < 3 || midMonthVals.length < 3) {
    return [];
  }

  const monthEndMed = median(monthEndVals);
  const midMonthMed = median(midMonthVals);

  if (HIGH_IS_BAD_METRICS.has(metric) && monthEndMed > midMonthMed + 1) {
    return ["possible_month_end_worsening_pattern"];
  }
  if (LOW_IS_BAD_METRICS.has(metric) && monthEndMed < midMonthMed - 1) {
    return ["possible_month_end_worsening_pattern"];
  }

  return [];
}

function priorityLabel(score) {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

function analyzeMetric(metric, payload) {
  const history = payload.history || [];
  const current = payload.current;
  const dates = payload.dates || null;
  const treatmentContext = payload.treatment_context || null;
  const displayName = payload.display_name || metric;
  const questionText = payload.question_text || null;

  const { median: med, mad } = computeMedianMad(history);
  const z = robustZScore(current, med, mad);
  const delta = trendDelta(metric, history);
  const persistence = persistencePoints(metric, history, med);
  const severity = severityPoints(metric, current);
  const treatment = treatmentPoints(treatmentContext);
  const recurringFlags = recurringPatternFlags(metric, dates, history);

  const total =
    extremenessPoints(z) +
    trendPoints(delta) +
    persistence +
    severity +
    treatment;

  return {
    metric,
    display_name: displayName,
    question_text: questionText,
    current: Number(current),
    baseline_median: Number(med),
    mad: Number(mad),
    robust_z: Number(z),
    trend_delta: Number(delta),
    persistence_points: persistence,
    severity_points: severity,
    treatment_points: treatment,
    priority_score: total,
    priority_label: priorityLabel(total),
    recurring_flags: recurringFlags,
    evidence: `${displayName} is ${current} vs personal baseline ${Number(med.toFixed(2))}`
  };
}

const inputItems = $input.all();

if (!inputItems || inputItems.length === 0) {
  throw new Error("No input items received by Compute Statistical Analysis node.");
}

const outputs = inputItems.map(item => {
  const payload = item.json;

  if (!payload || typeof payload !== "object") {
    throw new Error("Each input item must contain a JSON object.");
  }

  const patientId = payload.patient_id;
  const metrics = payload.metrics;

  if (!patientId) {
    throw new Error("Missing patient_id in Task 2 input.");
  }

  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
    throw new Error(`Missing or invalid metrics for patient ${patientId}.`);
  }

  const metricResults = {};

  for (const [metricName, metricPayload] of Object.entries(metrics)) {
    metricResults[metricName] = analyzeMetric(metricName, metricPayload);
  }

  return {
    json: {
      patient_id: patientId,
      metric_results: metricResults
    }
  };
});

return outputs;