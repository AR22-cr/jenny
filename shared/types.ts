/**
 * Jenny — Shared Types
 * ──────────────────────────
 * Used by both patient app and doctor dashboard.
 * Mirrors the Supabase/Postgres schema exactly.
 */

// ── Question Types ──
export type QuestionType =
  | 'yes_no'
  | 'scale_5'
  | 'scale_7'
  | 'scale_10'
  | 'vas'
  | 'multi_choice'
  | 'multi_select'
  | 'frequency'
  | 'duration'
  | 'mood_grid'
  | 'text_short';

export type DeckStatus = 'draft' | 'active' | 'archived';
export type CheckInFrequency = 'daily' | 'every_2_days' | 'every_3_days' | 'custom';

// ── Core Entities ──

export interface Doctor {
  id: string;
  email: string;
  name: string;
  specialty?: string;
  clinic?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  doctor_id: string | null;
  pairing_code: string | null;
  pairing_code_expires_at: string | null;
  timezone: string;
  check_in_time: string; // HH:MM
  streak: number;
  created_at: string;
}

export interface Deck {
  id: string;
  patient_id: string;
  doctor_id: string;
  name: string;
  status: DeckStatus;
  check_in_frequency: CheckInFrequency;
  active_from: string | null;
  active_to: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  deck_id: string;
  order: number;
  text: string;
  type: QuestionType;
  config: QuestionConfig;
  tags: string[];
  is_required: boolean;
  created_from: 'library' | 'custom';
  metric_key?: string;  // Maps to webhook metric name (e.g., "mood", "pain")
}

export interface QuestionConfig {
  // Scale anchors
  anchorLow?: string;
  anchorHigh?: string;
  // Multi-choice/select options
  options?: string[];
  // Scale5 variant
  variant?: 'faces' | 'stars';
  // Flagging threshold
  flagIf?: {
    operator: 'gte' | 'lte' | 'eq';
    value: number | string | boolean;
    consecutiveDays?: number;
  };
}

export interface Response {
  id: string;
  question_id: string;
  patient_id: string;
  deck_id: string;
  session_id: string;
  value: any; // JSON
  skipped: boolean;
  answered_at: string;
}

export interface CheckInSession {
  id: string;
  patient_id: string;
  deck_id: string;
  completed_at: string;
  questions_total: number;
  questions_answered: number;
}

// ── Question Library ──

export type QuestionCategory =
  | 'pain'
  | 'sleep'
  | 'mood'
  | 'medication'
  | 'anxiety'
  | 'activity'
  | 'social'
  | 'appetite'
  | 'cognition'
  | 'custom';

export interface LibraryQuestion {
  id: string;
  text: string;
  type: QuestionType;
  config: QuestionConfig;
  category: QuestionCategory;
  tags: string[];
  use_count: number;
}

// ── Pairing ──

export interface PairingResult {
  success: boolean;
  doctor_name?: string;
  error?: string;
}

// ── API Response Wrappers ──

export interface ActiveDeckResponse {
  deck: Deck | null;
  questions: Question[];
}

export interface PatientDashboardData {
  patient: Patient;
  activeDeck: Deck | null;
  recentSessions: CheckInSession[];
  streak: number;
}

export interface DoctorPatientView {
  patient: Patient;
  activeDeck: Deck | null;
  totalSessions: number;
  lastCheckIn: string | null;
  avgCompletion: number;
  hasFlags: boolean;
}
