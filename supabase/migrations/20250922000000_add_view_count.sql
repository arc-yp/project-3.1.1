/*
  # Add view count tracking to review_cards table

  1. Changes
    - Add `view_count` column to track how many times each card has been viewed
    - Create `increment_view_count` function to safely increment view counts
    - Add index on view_count for analytics queries

  2. Features
    - Atomic increment operations to prevent race conditions
    - Returns the new view count after increment
    - Handles non-existent cards gracefully
*/

-- Add view_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cards' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE review_cards ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create index for view_count for analytics queries
CREATE INDEX IF NOT EXISTS idx_review_cards_view_count ON review_cards(view_count DESC);

-- Function to safely increment view count
CREATE OR REPLACE FUNCTION increment_view_count(card_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  -- Atomically increment the view count and return the new value
  UPDATE review_cards 
  SET view_count = view_count + 1
  WHERE id = card_id
  RETURNING view_count INTO new_count;
  
  -- If no rows were affected, the card doesn't exist
  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Card with id % not found', card_id;
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public to execute the increment function (for view tracking)
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO public;

-- Update existing cards to have 0 view count if they don't have one
UPDATE review_cards SET view_count = 0 WHERE view_count IS NULL;