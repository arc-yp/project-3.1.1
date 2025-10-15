ALTER TABLE public.review_cards
ADD COLUMN IF NOT EXISTS review_min_length INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS review_max_length INTEGER DEFAULT 200;

UPDATE public.review_cards
SET review_min_length = COALESCE(review_min_length, 150),
    review_max_length = COALESCE(review_max_length, 200);