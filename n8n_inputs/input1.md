const QUESTION_REGISTRY = {
  "How often did you feel nervous or on edge today?": {
    metric_id: "nervous_or_on_edge_today",
    display_name: "feeling nervous or on edge",
    response_type: "scale_0_10",
  },
  "Where is your pain located today?": {
    metric_id: "pain_location_today",
    display_name: "pain location",
    response_type: "categorical",
    encoding: {
      none: 0,
      head: 1,
      abdomen: 2,
      pelvis: 3,
      back: 4,
      legs: 5,
      chest: 6,
      generalized: 7,
      other: 8
    }
  },
  "Has your pain changed since yesterday?": {
    metric_id: "pain_changed_since_yesterday",
    display_name: "change in pain since yesterday",
    response_type: "categorical",
    encoding: {
      better: -1,
      same: 0,
      worse: 1
    }
  },
  "How would you rate your pain right now?": {
    metric_id: "pain_rating_now",
    display_name: "pain level",
    response_type: "scale_0_10",
  },
  "How much did pain interfere with daily activities?": {
    metric_id: "pain_interference_daily_activities",
    display_name: "pain interference with daily activities",
    response_type: "scale_0_10",
  },
  "How long did it take you to fall asleep?": {
    metric_id: "fall_asleep_duration",
    display_name: "time to fall asleep",
    response_type: "numeric"
  },
  "Did you take pain medication today?": {
    metric_id: "took_pain_medication_today",
    display_name: "pain medication use",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "How rested do you feel right now?": {
    metric_id: "rested_feeling_now",
    display_name: "restfulness",
    response_type: "scale_0_10"
  },
  "How anxious have you felt today?": {
    metric_id: "anxiety_level_today",
    display_name: "anxiety level",
    response_type: "scale_0_10"
  },
  "Have you been able to enjoy things you usually enjoy?": {
    metric_id: "enjoyed_usual_activities",
    display_name: "ability to enjoy usual activities",
    response_type: "scale_0_10"
  },
  "How would you describe your mood today?": {
    metric_id: "mood_today",
    display_name: "mood",
    response_type: "categorical",
    encoding: {
      very_bad: 1,
      bad: 2,
      neutral: 3,
      good: 4,
      very_good: 5
    }
  },
  "Did you take all of your medications as prescribed today?": {
    metric_id: "took_all_medications_as_prescribed_today",
    display_name: "medication adherence",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Did you use any sleep aids last night?": {
    metric_id: "used_sleep_aids_last_night",
    display_name: "sleep aid use",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Have you felt hopeful about your future today?": {
    metric_id: "hopeful_about_future_today",
    display_name: "sense of hopefulness",
    response_type: "scale_0_10"
  },
  "How would you rate your sleep quality last night?": {
    metric_id: "sleep_quality_last_night",
    display_name: "sleep quality",
    response_type: "scale_0_10"
  },
  "Did you wake up during the night?": {
    metric_id: "woke_up_during_night",
    display_name: "waking up during the night",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Did you start or change any medications today?": {
    metric_id: "medication_changed_today",
    display_name: "medication change today",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 },
    store_as_treatment_context: true
  },
  "Did you miss any doses of your medication today?": {
    metric_id: "missed_medication_dose_today",
    display_name: "missed medication dose",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Did you take your medication at the usual time today?": {
    metric_id: "medication_timing_adherence",
    display_name: "medication timing adherence",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Have you noticed any effects after taking your medication today?": {
    metric_id: "medication_effect_notice",
    display_name: "noticed effects after medication",
    response_type: "scale_0_10"
  },
  "How effective does your current treatment feel today?": {
    metric_id: "treatment_effectiveness_today",
    display_name: "treatment effectiveness",
    response_type: "scale_0_10"
  },
  "Have your symptoms improved since starting your current treatment?": {
    metric_id: "symptoms_improved_since_treatment",
    display_name: "symptom improvement since treatment started",
    response_type: "scale_0_10"
  },
  "Where are you in your menstrual cycle today?": {
    metric_id: "cycle_phase_today",
    display_name: "menstrual cycle phase",
    response_type: "categorical",
    encoding: {
      unknown: 0,
      menstrual: 1,
      follicular: 2,
      ovulatory: 3,
      luteal: 4
    }
  },
  "Have you experienced any unusual hormonal symptoms today?": {
    metric_id: "hormonal_symptoms_today",
    display_name: "hormonal symptom burden",
    response_type: "scale_0_10"
  },
  "Have your symptoms been different than your typical cycle pattern?": {
    metric_id: "deviation_from_cycle_pattern",
    display_name: "deviation from usual cycle pattern",
    response_type: "scale_0_10"
  },
  "Have you experienced any spotting or irregular bleeding today?": {
    metric_id: "irregular_bleeding_today",
    display_name: "irregular bleeding",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "Have your cramps been different from your usual pattern?": {
    metric_id: "cramps_vs_baseline",
    display_name: "change in cramps from baseline",
    response_type: "scale_0_10"
  },
  "Did you experience any side effects from your treatment today?": {
    metric_id: "side_effects_today",
    display_name: "presence of side effects",
    response_type: "boolean",
    encoding: { yes: 1, no: 0 }
  },
  "How severe were your side effects today?": {
    metric_id: "side_effect_severity",
    display_name: "side effect severity",
    response_type: "scale_0_10"
  },
  "Have your side effects increased compared to previous days?": {
    metric_id: "side_effect_trend",
    display_name: "change in side effects",
    response_type: "scale_0_10"
  },
  "Did any side effects interfere with your daily activities?": {
    metric_id: "side_effect_interference",
    display_name: "side effect interference with daily activities",
    response_type: "scale_0_10"
  },
  "Have you noticed mood changes after taking your medication?": {
    metric_id: "mood_change_post_medication",
    display_name: "mood changes after medication",
    response_type: "scale_0_10"
  },
  "Have you felt more emotionally stable than usual today?": {
    metric_id: "emotional_stability_today",
    display_name: "emotional stability",
    response_type: "scale_0_10"
  },
  "Have you experienced any unusual irritability today?": {
    metric_id: "irritability_today",
    display_name: "irritability",
    response_type: "scale_0_10"
  },
  "Have you felt mentally clear or foggy today?": {
    metric_id: "mental_clarity_today",
    display_name: "mental clarity",
    response_type: "categorical",
    encoding: {
      very_foggy: 1,
      foggy: 2,
      neutral: 3,
      clear: 4,
      very_clear: 5
    }
  },
  "Did your treatment affect your sleep last night?": {
    metric_id: "treatment_sleep_impact",
    display_name: "treatment impact on sleep",
    response_type: "scale_0_10"
  },
  "Did you feel more tired than usual today?": {
    metric_id: "fatigue_vs_baseline",
    display_name: "fatigue compared with baseline",
    response_type: "scale_0_10"
  },
  "Did you wake up feeling refreshed today?": {
    metric_id: "morning_refreshment",
    display_name: "morning refreshment",
    response_type: "scale_0_10"
  },
  "Did you notice any changes in your heart rate today?": {
    metric_id: "heart_rate_change_today",
    display_name: "change in heart rate",
    response_type: "scale_0_10"
  },
  "Did you feel dizzy or lightheaded today?": {
    metric_id: "dizziness_today",
    display_name: "dizziness or lightheadedness",
    response_type: "scale_0_10"
  },
  "Did you experience any nausea today?": {
    metric_id: "nausea_today",
    display_name: "nausea",
    response_type: "scale_0_10"
  },
  "Did you feel unusually cold or warm today?": {
    metric_id: "temperature_sensitivity_today",
    display_name: "temperature sensitivity",
    response_type: "scale_0_10"
  },
  "Were you able to complete your normal daily activities today?": {
    metric_id: "daily_functionality",
    display_name: "daily functioning",
    response_type: "scale_0_10"
  },
  "Did your symptoms limit your productivity today?": {
    metric_id: "productivity_impact",
    display_name: "productivity impact",
    response_type: "scale_0_10"
  },
  "Did you need to rest more than usual today?": {
    metric_id: "increased_rest_need",
    display_name: "increased need for rest",
    response_type: "scale_0_10"
  },
  "Overall, do you feel better, worse, or the same compared to yesterday?": {
    metric_id: "overall_change_vs_yesterday",
    display_name: "overall change since yesterday",
    response_type: "categorical",
    encoding: {
      better: -1,
      same: 0,
      worse: 1
    }
  },
  "How consistent have your symptoms been over the past few days?": {
    metric_id: "symptom_consistency",
    display_name: "symptom consistency",
    response_type: "scale_0_10"
  },
  "Do you feel your condition is improving over time?": {
    metric_id: "perceived_recovery_trend",
    display_name: "perceived recovery trend",
    response_type: "scale_0_10"
  }
};

function normalizeString(value) {
  return String(value).trim().toLowerCase();
}

function unwrapPatientPayload(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (obj.patient_id && obj.responses) return obj;
  if (obj.body && typeof obj.body === "object") return unwrapPatientPayload(obj.body);
  if (obj.data && typeof obj.data === "object") return unwrapPatientPayload(obj.data);
  if (obj.payload && typeof obj.payload === "object") return unwrapPatientPayload(obj.payload);
  if (obj.message && typeof obj.message === "object") return unwrapPatientPayload(obj.message);

  return obj;
}

function encodeBoolean(answer, encoding) {
  if (typeof answer === "boolean") return answer ? 1 : 0;
  if (typeof answer === "number") return answer ? 1 : 0;

  const key = normalizeString(answer);
  if (encoding && key in encoding) return encoding[key];
  if (["yes", "y", "true", "1"].includes(key)) return 1;
  if (["no", "n", "false", "0"].includes(key)) return 0;

  throw new Error(`Could not encode boolean answer: ${answer}`);
}

function encodeCategorical(answer, encoding, questionText) {
  if (typeof answer === "number") return answer;
  const key = normalizeString(answer);
  if (!encoding || !(key in encoding)) {
    throw new Error(`Unknown categorical answer '${answer}' for question '${questionText}'`);
  }
  return encoding[key];
}

function encodeNumeric(answer, questionText) {
  if (typeof answer === "number") return answer;
  const parsed = Number(answer);
  if (Number.isNaN(parsed)) {
    throw new Error(`Answer for '${questionText}' must be numeric`);
  }
  return parsed;
}

function encodeAnswer(questionText, answer, registryEntry) {
  const type = registryEntry.response_type;

  if (type === "boolean") return encodeBoolean(answer, registryEntry.encoding);
  if (type === "categorical") return encodeCategorical(answer, registryEntry.encoding, questionText);
  if (type === "scale_0_10" || type === "numeric") return encodeNumeric(answer, questionText);

  throw new Error(`Unsupported response_type '${type}' for question '${questionText}'`);
}

function normalizeOnePatient(rawPatientPayload) {
  const patientPayload = unwrapPatientPayload(rawPatientPayload);

  if (!patientPayload || typeof patientPayload !== "object" || Array.isArray(patientPayload)) {
    throw new Error("Each patient payload must be an object.");
  }

  const patientId = patientPayload.patient_id;
  if (!patientId) {
    throw new Error(`Missing patient_id. Received keys: ${Object.keys(patientPayload).join(", ")}`);
  }

  const responses = patientPayload.responses;
  if (!Array.isArray(responses) || responses.length === 0) {
    throw new Error(`Missing or invalid responses array for patient ${patientId}.`);
  }

  const metrics = {};
  let treatmentChangedToday = false;

  for (const response of responses) {
    if (!response || typeof response !== "object") {
      throw new Error(`Each response must be an object for patient ${patientId}.`);
    }

    const questionText = response.question_text;
    const answer = response.answer;

    if (!questionText) {
      throw new Error(`Response is missing question_text for patient ${patientId}.`);
    }

    if (answer === undefined || answer === null || answer === "") continue;

    const registryEntry = QUESTION_REGISTRY[questionText];
    if (!registryEntry) {
      throw new Error(`Question not found in registry: '${questionText}'`);
    }

    const encodedValue = encodeAnswer(questionText, answer, registryEntry);
    const metricId = registryEntry.metric_id;

    metrics[metricId] = {
      current: encodedValue,
      display_name: registryEntry.display_name || metricId.replace(/_/g, " "),
      question_text: questionText
    };

    if (Array.isArray(response.history)) {
      metrics[metricId].history = response.history.map(v => Number(v));
    }

    if (Array.isArray(response.dates)) {
      metrics[metricId].dates = response.dates.map(d => String(d));
    }

    if (response.treatment_context && typeof response.treatment_context === "object") {
      metrics[metricId].treatment_context = {
        active: Boolean(response.treatment_context.active ?? false),
        days_since_change: response.treatment_context.days_since_change ?? null
      };
    }

    if (registryEntry.store_as_treatment_context && encodedValue === 1) {
      treatmentChangedToday = true;
    }
  }

  if (treatmentChangedToday) {
    for (const metricId of Object.keys(metrics)) {
      if (!metrics[metricId].treatment_context) {
        metrics[metricId].treatment_context = {
          active: true,
          days_since_change: 0
        };
      }
    }
  }

  return {
    patient_id: String(patientId),
    metrics
  };
}

// ---------- n8n input handling ----------
const inputItems = $input.all();

if (!inputItems || inputItems.length === 0) {
  throw new Error("No input items received by Process Incoming Data node.");
}

let patientsArray = [];

if (inputItems.length === 1) {
  const firstJson = inputItems[0].json;

  if (Array.isArray(firstJson)) {
    patientsArray = firstJson;
  } else if (Array.isArray(firstJson.patients)) {
    patientsArray = firstJson.patients;
  } else if (firstJson.body && Array.isArray(firstJson.body.patients)) {
    patientsArray = firstJson.body.patients;
  } else if (firstJson.data && Array.isArray(firstJson.data.patients)) {
    patientsArray = firstJson.data.patients;
  } else {
    patientsArray = [firstJson];
  }
} else {
  patientsArray = inputItems.map(item => item.json);
}

const outputs = patientsArray.map(patient => ({
  json: normalizeOnePatient(patient)
}));

return outputs;