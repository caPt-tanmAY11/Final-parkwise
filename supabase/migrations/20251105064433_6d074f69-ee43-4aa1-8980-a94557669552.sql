-- Create a trigger to call the assign-manager-role edge function when a user signs up
-- This will automatically assign manager role and parking centre for emails matching pattern: manager#parking-centre-name@gmail.com

CREATE OR REPLACE FUNCTION public.trigger_assign_manager_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email matches manager pattern
  IF NEW.email SIMILAR TO 'manager#%@gmail.com' THEN
    -- Call the edge function via HTTP (this is done asynchronously)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/assign-manager-role',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if allowed) or handle via application code
-- Note: Direct triggers on auth.users may not be allowed, so we'll handle this in application code instead