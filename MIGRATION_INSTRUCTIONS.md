# Supabase Migration Instructions

## Apply the View Count Migration

To add view count tracking to your Supabase database, you need to apply the migration file:

### Option 1: Using Supabase CLI (Recommended)

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Navigate to your project directory:
   ```bash
   cd "d:\pal ladani\ARC_API"
   ```

3. Apply the migration:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Navigate to your project
3. Go to the SQL Editor
4. Copy and paste the contents of `supabase/migrations/20250922000000_add_view_count.sql`
5. Run the SQL

### What the Migration Does

✅ **Adds `view_count` column** to the `review_cards` table
✅ **Creates `increment_view_count()` function** for atomic view count updates  
✅ **Adds database index** for efficient view count queries
✅ **Sets up proper permissions** for public access to the increment function
✅ **Initializes existing records** with 0 view count

### Verification

After applying the migration, you can verify it worked by checking:

1. **Table Structure**: The `review_cards` table should have a `view_count` column
2. **Function**: The `increment_view_count(uuid)` function should exist
3. **Test**: Try viewing a review card - the view count should increment

### Database Schema After Migration

```sql
review_cards (
  id uuid PRIMARY KEY,
  business_name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  description text,
  location text,
  services text[],
  slug text UNIQUE NOT NULL,
  logo_url text,
  google_maps_url text NOT NULL,
  gemini_api_key text,
  gemini_model text DEFAULT 'gemini-2.0-flash',
  view_count integer DEFAULT 0 NOT NULL,  -- ← NEW COLUMN
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

The view counter feature will work automatically once this migration is applied!