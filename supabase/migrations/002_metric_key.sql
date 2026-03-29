-- PenguinPals Migration 002: Add metric_key to questions
-- Allows mapping question responses to clean webhook metric names (e.g., "mood", "sleep", "pain")

ALTER TABLE questions ADD COLUMN IF NOT EXISTS metric_key text;

-- Assign test metric keys to existing questions based on text content
UPDATE questions SET metric_key = 'mood' WHERE text ILIKE '%mood%' AND metric_key IS NULL;
UPDATE questions SET metric_key = 'pain' WHERE (text ILIKE '%pain%' OR text ILIKE '%cramp%' OR text ILIKE '%hurt%') AND metric_key IS NULL;
UPDATE questions SET metric_key = 'sleep' WHERE text ILIKE '%sleep%' AND metric_key IS NULL;
UPDATE questions SET metric_key = 'anxiety' WHERE (text ILIKE '%anxi%' OR text ILIKE '%worry%' OR text ILIKE '%stress%') AND metric_key IS NULL;
UPDATE questions SET metric_key = 'energy' WHERE (text ILIKE '%energy%' OR text ILIKE '%tired%' OR text ILIKE '%fatigue%') AND metric_key IS NULL;

-- Fallback: assign generic keys to any remaining scale questions without a metric_key
UPDATE questions SET metric_key = 'metric_' || LEFT(id::text, 6)
  WHERE metric_key IS NULL AND type LIKE 'scale_%';
