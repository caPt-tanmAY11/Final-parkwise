-- Create table to link managers to parking centres
CREATE TABLE IF NOT EXISTS public.parking_centre_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.parking_centres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, centre_id)
);

-- Enable RLS
ALTER TABLE public.parking_centre_managers ENABLE ROW LEVEL SECURITY;

-- Managers can view their own assignments
CREATE POLICY "Managers can view their own centre assignments"
ON public.parking_centre_managers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all manager assignments
CREATE POLICY "Admins can manage manager assignments"
ON public.parking_centre_managers
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to check if user is manager of a specific centre
CREATE OR REPLACE FUNCTION public.is_manager_of_centre(_user_id UUID, _centre_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parking_centre_managers
    WHERE user_id = _user_id
      AND centre_id = _centre_id
  )
$$;

-- Create function to get manager's centre_id
CREATE OR REPLACE FUNCTION public.get_manager_centre_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id
  FROM public.parking_centre_managers
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update staff RLS to allow managers to view their centre's staff
CREATE POLICY "Managers can view their centre staff"
ON public.staff
FOR SELECT
USING (
  has_role(auth.uid(), 'manager') 
  AND is_manager_of_centre(auth.uid(), centre_id)
);

-- Update parking_zones RLS to allow managers to view their centre's zones
CREATE POLICY "Managers can view their centre zones"
ON public.parking_zones
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND is_manager_of_centre(auth.uid(), centre_id)
);

-- Update parking_slots RLS to allow managers to view their centre's slots
CREATE POLICY "Managers can view their centre slots"
ON public.parking_slots
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 FROM public.parking_zones
    WHERE parking_zones.id = parking_slots.zone_id
      AND is_manager_of_centre(auth.uid(), parking_zones.centre_id)
  )
);

-- Update bookings RLS to allow managers to view bookings for their centre's slots
CREATE POLICY "Managers can view their centre bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 
    FROM public.parking_slots
    JOIN public.parking_zones ON parking_zones.id = parking_slots.zone_id
    WHERE parking_slots.id = bookings.slot_id
      AND is_manager_of_centre(auth.uid(), parking_zones.centre_id)
  )
);

-- Managers can update bookings for their centre
CREATE POLICY "Managers can update their centre bookings"
ON public.bookings
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 
    FROM public.parking_slots
    JOIN public.parking_zones ON parking_zones.id = parking_slots.zone_id
    WHERE parking_slots.id = bookings.slot_id
      AND is_manager_of_centre(auth.uid(), parking_zones.centre_id)
  )
);