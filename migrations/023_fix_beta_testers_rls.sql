-- migration: 023_fix_beta_testers_rls.sql
-- Description: Fixes RLS policies for beta_testers table to allow public inserts
-- Matches the pattern used in waiting_list table

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public inserts for beta testers" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow public to insert beta testers" ON public.beta_testers;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.beta_testers;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow service role full access to beta testers" ON public.beta_testers;

-- Policy 1a: Allow anonymous users to insert (for form submissions)
CREATE POLICY "Enable insert for anon" ON public.beta_testers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy 1b: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated" ON public.beta_testers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow service role full access (for admin viewing)
CREATE POLICY "Allow service role full access to beta testers"
ON public.beta_testers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure permissions are granted
GRANT INSERT ON public.beta_testers TO anon;
GRANT INSERT ON public.beta_testers TO authenticated;
GRANT ALL ON public.beta_testers TO service_role;

COMMIT;

