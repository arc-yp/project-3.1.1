-- Create user_admins table for managing user-level admin access
CREATE TABLE IF NOT EXISTS public.user_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  password TEXT NOT NULL, -- In production, this should be hashed
  business_slug TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by TEXT DEFAULT 'main_admin',
  
  -- Constraints
  CONSTRAINT user_admins_email_key UNIQUE (email),
  CONSTRAINT user_admins_mobile_key UNIQUE (mobile),
  CONSTRAINT user_admins_business_slug_fkey FOREIGN KEY (business_slug) 
    REFERENCES public.review_cards(slug) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_admins_email ON public.user_admins(email);
CREATE INDEX IF NOT EXISTS idx_user_admins_mobile ON public.user_admins(mobile);
CREATE INDEX IF NOT EXISTS idx_user_admins_business_slug ON public.user_admins(business_slug);
CREATE INDEX IF NOT EXISTS idx_user_admins_is_active ON public.user_admins(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_admins ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all for now since we're using custom auth)
CREATE POLICY "Enable read access for all users" ON public.user_admins
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.user_admins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.user_admins
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.user_admins
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_admins_updated_at BEFORE UPDATE ON public.user_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
