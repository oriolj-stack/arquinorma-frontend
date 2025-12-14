-- migration: 022_create_beta_testers_table.sql
-- Description: Creates a simple table for beta tester email registrations
-- Only stores email and registration date for easy management

BEGIN;

CREATE TABLE IF NOT EXISTS public.beta_testers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON public.beta_testers (lower(email));
CREATE INDEX IF NOT EXISTS idx_beta_testers_created_at ON public.beta_testers (created_at DESC);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public inserts for beta testers" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow service role full access to beta testers" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow public to insert beta testers" ON public.beta_testers;

-- Policy: Allow public inserts (for form submissions)
-- This policy allows anyone (including anonymous users) to insert rows
CREATE POLICY "Allow public to insert beta testers"
ON public.beta_testers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow service role full access (for admin viewing)
CREATE POLICY "Allow service role full access to beta testers"
ON public.beta_testers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions explicitly
GRANT INSERT ON public.beta_testers TO anon;
GRANT INSERT ON public.beta_testers TO authenticated;
GRANT ALL ON public.beta_testers TO service_role;

COMMIT;

