-- Drop old constraint first
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- Update existing data to match new roles
UPDATE public.staff
SET role = CASE 
  WHEN role = 'manager' THEN 'Manager'
  WHEN role = 'security' THEN 'Security'
  WHEN role = 'maintenance' THEN 'Security'
  WHEN role = 'support' THEN 'Security'
  ELSE 'Security'
END;

-- Add new constraint with updated values
ALTER TABLE public.staff 
ADD CONSTRAINT staff_role_check 
CHECK (role IN ('Manager', 'Attendant', 'Security'));