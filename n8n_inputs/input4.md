function detectCrossMetricPatterns(metricResults) {
  const patterns = [];
  let boost = 0;

  function metricHigh(metricName) {
    return (
      metricName in metricResults &&
      metricResults[metricName].priority_score >= 5
    );
  }

  if (metricHigh("stress") && metricHigh("sleep_hours")) {
    patterns.push({
      pattern: "stress_high_and_sleep_low",
      boost: 2,
      explanation: "High stress co-occurs with reduced sleep."
    });
    boost += 2;
  }

  if (metricHigh("fatigue") && metricHigh("steps")) {
    patterns.push({
      pattern: "fatigue_high_and_activity_low",
      boost: 2,
      explanation: "Fatigue co-occurs with reduced activity."
    });
    boost += 2;
  }

  if (metricHigh("cramps") && metricHigh("stress")) {
    patterns.push({
      pattern: "pain_stress_cluster",
      boost: 1,
      explanation: "Pain-related symptoms appear alongside elevated stress."
    });
    boost += 1;
  }

  if (
    metricHigh("resting_heart_rate") &&
    metricHigh("sleep_hours") &&
    metricHigh("stress")
  ) {
    patterns.push({
      pattern: "physiologic_stress_cluster",
      boost: 3,
      explanation: "Elevated resting heart rate, poor sleep, and stress may indicate acute strain."
    });
    boost += 3;
  }

  if (metricHigh("pain_rating_now") && metricHigh("took_pain_medication_today")) {
    patterns.push({
      pattern: "pain_despite_medication",
      boost: 1,
      explanation: "Elevated pain is present despite reported pain medication use."
    });
    boost += 1;
  }

  if (metricHigh("side_effect_severity") && metricHigh("medication_changed_today")) {
    patterns.push({
      pattern: "possible_treatment_side_effect_cluster",
      boost: 2,
      explanation: "Reported side effects appear alongside a recent medication change."
    });
    boost += 2;
  }

  return { patterns, boost };
}

function rankTopConcerns(metricResults) {
  const ranked = Object.values(metricResults).sort(
    (a, b) => b.priority_score - a.priority_score
  );

  return ranked.slice(0, 3).map(r => ({
    metric: r.metric,
    display_name: r.display_name || r.metric,
    priority_score: r.priority_score,
    priority_label: r.priority_label,
    evidence: r.evidence
  }));
}

function buildGeminiPayload(patientId, metricResults, patterns, overallScore, overallLabel, topConcerns) {
  return {
    patient_id: patientId,
    overall_priority_score: overallScore,
    overall_priority_label: overallLabel,
    top_concerns: topConcerns,
    cross_metric_patterns: patterns,
    metric_summaries: Object.values(metricResults).map(r => ({
      metric: r.metric,
      display_name: r.display_name || r.metric,
      question_text: r.question_text || null,
      current: r.current,
      baseline_median: r.baseline_median,
      priority_score: r.priority_score,
      priority_label: r.priority_label,
      evidence: r.evidence,
      recurring_flags: r.recurring_flags
    }))
  };
}

const inputItems = $input.all();

if (!inputItems || inputItems.length === 0) {
  throw new Error("No input items received by Calculate Overall Priority node.");
}

const outputs = inputItems.map(item => {
  const payload = item.json;

  if (!payload || typeof payload !== "object") {
    throw new Error("Each input item must contain a JSON object.");
  }

  const patientId = payload.patient_id;
  const metricResults = payload.metric_results;

  if (!patientId) {
    throw new Error("Missing patient_id in Task 3 input.");
  }

  if (!metricResults || typeof metricResults !== "object" || Array.isArray(metricResults)) {
    throw new Error(`Missing or invalid metric_results for patient ${patientId}.`);
  }

  const baseScore = Object.values(metricResults).reduce(
    (sum, r) => sum + (r.priority_score || 0),
    0
  );

  const { patterns, boost } = detectCrossMetricPatterns(metricResults);
  const overallScore = baseScore + boost;

  let overallLabel = "low";
  if (overallScore >= 14) overallLabel = "high";
  else if (overallScore >= 8) overallLabel = "medium";

  const topConcerns = rankTopConcerns(metricResults);

  const geminiInput = buildGeminiPayload(
    patientId,
    metricResults,
    patterns,
    overallScore,
    overallLabel,
    topConcerns
  );

  return {
    json: {
      patient_id: patientId,
      overall_priority_score: overallScore,
      overall_priority_label: overallLabel,
      cross_metric_boost: boost,
      cross_metric_patterns: patterns,
      top_concerns: topConcerns,
      results: metricResults,
      gemini_input: geminiInput
    }
  };
});

return outputs;