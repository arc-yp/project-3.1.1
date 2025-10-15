-- Migration: add active column to review_cards
-- Adds a boolean 'active' column default true and backfills existing rows
-- Also create an index to filter active cards quickly

alter table review_cards
  add column if not exists active boolean not null default true;

-- Backfill existing rows (if null) to true
update review_cards set active = true where active is null;

-- Index for queries filtering on active
create index if not exists review_cards_active_idx on review_cards(active);
