/*
  # Add Gemini API fields to review_cards table

  1. Changes
    - Add `gemini_api_key` column to store API key for each card
    - Add `gemini_model` column to store selected model for each card
    - Both fields are optional and can be null

  2. Security Note
    - API keys are stored in database for per-card configuration
    - Consider encryption for production use
*/

DO $$
BEGIN
  -- Add gemini_api_key column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cards' AND column_name = 'gemini_api_key'
  ) THEN
    ALTER TABLE review_cards ADD COLUMN gemini_api_key text;
  END IF;

  -- Add gemini_model column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cards' AND column_name = 'gemini_model'
  ) THEN
    ALTER TABLE review_cards ADD COLUMN gemini_model text DEFAULT 'gemini-2.0-flash';
  END IF;
END $$;