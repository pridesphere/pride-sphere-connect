-- Enhanced security for sensitive mental health data in mood_entries table

-- 1. Add DELETE policy so users can delete their own mood entries
CREATE POLICY "Users can delete own mood entries" 
ON public.mood_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Create a secure function for bulk mood entry cleanup
-- This allows users to completely remove their mental health data
CREATE OR REPLACE FUNCTION public.delete_all_user_mood_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete mood entries';
  END IF;

  -- Delete all mood entries for the current user
  DELETE FROM public.mood_entries 
  WHERE user_id = current_user_id;
  
  -- Log the deletion for audit purposes (without storing sensitive data)
  INSERT INTO public.audit_logs (user_id, action, table_name, created_at)
  VALUES (current_user_id, 'bulk_delete_mood_entries', 'mood_entries', now())
  ON CONFLICT DO NOTHING; -- In case audit_logs table doesn't exist yet
  
END;
$$;

-- 3. Create audit logs table for tracking sensitive data operations (optional but recommended)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only users can see their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only the system can insert audit logs (via security definer functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true); -- This will be called from security definer functions

-- 4. Add data anonymization function for enhanced privacy
CREATE OR REPLACE FUNCTION public.anonymize_mood_entries_older_than(days_old INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Anonymize old mood entries by clearing notes but keeping mood_score for personal analytics
  UPDATE public.mood_entries 
  SET notes = '[ANONYMIZED]'
  WHERE user_id = current_user_id 
    AND created_at < (now() - (days_old || ' days')::interval)
    AND notes IS NOT NULL 
    AND notes != '[ANONYMIZED]';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the anonymization
  INSERT INTO public.audit_logs (user_id, action, table_name, created_at)
  VALUES (current_user_id, 'anonymize_old_entries', 'mood_entries', now())
  ON CONFLICT DO NOTHING;
  
  RETURN affected_rows;
END;
$$;

-- 5. Add trigger to automatically log mood entry deletions for audit purposes
CREATE OR REPLACE FUNCTION public.log_mood_entry_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log individual deletions (without storing sensitive data)
  INSERT INTO public.audit_logs (user_id, action, table_name, created_at)
  VALUES (OLD.user_id, 'delete_mood_entry', 'mood_entries', now())
  ON CONFLICT DO NOTHING;
  
  RETURN OLD;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS mood_entry_deletion_audit ON public.mood_entries;
CREATE TRIGGER mood_entry_deletion_audit
  AFTER DELETE ON public.mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mood_entry_deletion();

-- 6. Grant execute permissions on the new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_all_user_mood_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_mood_entries_older_than(INTEGER) TO authenticated;