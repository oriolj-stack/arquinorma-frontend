-- migration: 024_create_beta_testers_function.sql
-- Description: Creates a SECURITY DEFINER function to submit beta tester emails
-- This bypasses RLS and allows public submissions

BEGIN;

-- Function to submit beta tester email (bypasses RLS)
CREATE OR REPLACE FUNCTION public.submit_beta_tester_email(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email TEXT;
    v_result JSON;
    v_already_exists BOOLEAN;
BEGIN
    -- Normalize email
    v_email := LOWER(TRIM(p_email));
    
    -- Validate email format
    IF v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Introdueix un correu electrònic vàlid'
        );
    END IF;
    
    -- Check if email already exists
    SELECT EXISTS(
        SELECT 1 FROM public.beta_testers 
        WHERE email = v_email
    ) INTO v_already_exists;
    
    IF v_already_exists THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Ja estàs a la llista de beta testers! Et contactarem aviat.',
            'already_exists', true
        );
    END IF;
    
    -- Insert new beta tester
    INSERT INTO public.beta_testers (email)
    VALUES (v_email)
    RETURNING json_build_object(
        'id', id,
        'email', email,
        'created_at', created_at
    ) INTO v_result;
    
    RETURN json_build_object(
        'success', true,
        'message', '🎉 T''has afegit a la llista de beta testers! Revisarem la teva sol·licitud i et contactarem aviat.',
        'data', v_result
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Ja estàs a la llista de beta testers! Et contactarem aviat.',
            'already_exists', true
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Hi ha hagut un error. Torna-ho a provar.',
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.submit_beta_tester_email(TEXT) TO anon, authenticated;

COMMIT;

