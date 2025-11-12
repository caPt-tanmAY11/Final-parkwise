-- Allow managers to insert staff for their centre
CREATE POLICY "Managers can insert staff for their centre"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) 
  AND is_manager_of_centre(auth.uid(), centre_id)
);