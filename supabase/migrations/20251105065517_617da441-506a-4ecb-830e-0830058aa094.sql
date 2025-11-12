-- Create table to link attendants to parking centres
CREATE TABLE IF NOT EXISTS public.parking_centre_attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.parking_centres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, centre_id)
);

-- Enable RLS
ALTER TABLE public.parking_centre_attendants ENABLE ROW LEVEL SECURITY;

-- Attendants can view their own assignments
CREATE POLICY "Attendants can view their own centre assignments"
ON public.parking_centre_attendants
FOR SELECT
USING (auth.uid() = user_id);

-- Admins and managers can manage attendant assignments
CREATE POLICY "Admins and managers can manage attendant assignments"
ON public.parking_centre_attendants
FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  EXISTS (
    SELECT 1 FROM public.parking_centre_managers
    WHERE user_id = auth.uid() AND centre_id = parking_centre_attendants.centre_id
  )
);

-- Create function to check if user is attendant of a specific centre
CREATE OR REPLACE FUNCTION public.is_attendant_of_centre(_user_id UUID, _centre_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parking_centre_attendants
    WHERE user_id = _user_id
      AND centre_id = _centre_id
  )
$$;

-- Create function to get attendant's centre_id
CREATE OR REPLACE FUNCTION public.get_attendant_centre_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT centre_id
  FROM public.parking_centre_attendants
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update parking_slots RLS to allow attendants to manage slots
CREATE POLICY "Attendants can manage their centre slots"
ON public.parking_slots
FOR ALL
USING (
  has_role(auth.uid(), 'attendant')
  AND EXISTS (
    SELECT 1 FROM public.parking_zones
    WHERE parking_zones.id = parking_slots.zone_id
      AND is_attendant_of_centre(auth.uid(), parking_zones.centre_id)
  )
);

-- Update bookings RLS to allow attendants to view and manage bookings
CREATE POLICY "Attendants can view their centre bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'attendant')
  AND EXISTS (
    SELECT 1 
    FROM public.parking_slots
    JOIN public.parking_zones ON parking_zones.id = parking_slots.zone_id
    WHERE parking_slots.id = bookings.slot_id
      AND is_attendant_of_centre(auth.uid(), parking_zones.centre_id)
  )
);

-- Attendants can update bookings for their centre
CREATE POLICY "Attendants can update their centre bookings"
ON public.bookings
FOR UPDATE
USING (
  has_role(auth.uid(), 'attendant')
  AND EXISTS (
    SELECT 1 
    FROM public.parking_slots
    JOIN public.parking_zones ON parking_zones.id = parking_slots.zone_id
    WHERE parking_slots.id = bookings.slot_id
      AND is_attendant_of_centre(auth.uid(), parking_zones.centre_id)
  )
);