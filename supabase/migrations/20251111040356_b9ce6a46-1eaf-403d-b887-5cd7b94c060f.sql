-- Allow attendants and managers to view profiles of users with bookings in their centre
CREATE POLICY "Attendants can view profiles for their centre bookings"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.parking_slots ps ON ps.id = b.slot_id
    JOIN public.parking_zones pz ON pz.id = ps.zone_id
    WHERE b.user_id = profiles.id
      AND (
        is_attendant_of_centre(auth.uid(), pz.centre_id) 
        OR is_manager_of_centre(auth.uid(), pz.centre_id)
      )
  )
);

-- Allow attendants and managers to view vehicles of users with bookings in their centre
CREATE POLICY "Attendants can view vehicles for their centre bookings"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.parking_slots ps ON ps.id = b.slot_id
    JOIN public.parking_zones pz ON pz.id = ps.zone_id
    WHERE b.vehicle_id = vehicles.id
      AND (
        is_attendant_of_centre(auth.uid(), pz.centre_id) 
        OR is_manager_of_centre(auth.uid(), pz.centre_id)
      )
  )
);