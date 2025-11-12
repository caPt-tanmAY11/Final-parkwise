-- Function to get a random attendant user_id
CREATE OR REPLACE FUNCTION public.get_random_attendant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'attendant'::app_role
  ORDER BY random()
  LIMIT 1
$$;

-- Trigger function to auto-assign tickets to attendants
CREATE OR REPLACE FUNCTION public.auto_assign_ticket_to_attendant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attendant_id uuid;
BEGIN
  -- Only auto-assign if not already assigned
  IF NEW.assigned_to IS NULL THEN
    -- Get a random attendant
    SELECT public.get_random_attendant() INTO attendant_id;
    
    -- If an attendant is available, assign the ticket
    IF attendant_id IS NOT NULL THEN
      NEW.assigned_to := attendant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on customer_support table
DROP TRIGGER IF EXISTS assign_ticket_on_insert ON public.customer_support;
CREATE TRIGGER assign_ticket_on_insert
BEFORE INSERT ON public.customer_support
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_ticket_to_attendant();

-- Allow attendants to view tickets assigned to them
CREATE POLICY "Attendants can view their assigned tickets"
ON public.customer_support
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'attendant'::app_role) AND
  assigned_to = auth.uid()
);

-- Allow attendants to update their assigned tickets (change status, etc.)
CREATE POLICY "Attendants can update their assigned tickets"
ON public.customer_support
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'attendant'::app_role) AND
  assigned_to = auth.uid()
);