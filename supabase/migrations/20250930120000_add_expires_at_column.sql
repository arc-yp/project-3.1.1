-- Migration: add expires_at column to review_cards for automatic deactivation
-- Adds a timestamptz 'expires_at' column (nullable) and an index for querying
-- Cards with expires_at in the past should be treated as inactive by application logic

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cards' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE review_cards ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS review_cards_expires_at_idx ON review_cards(expires_at);
