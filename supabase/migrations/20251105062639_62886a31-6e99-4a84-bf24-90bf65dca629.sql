-- Add UPDATE policy for loyalty_points table so users can update their own points
CREATE POLICY "Users can update their own points" 
ON public.loyalty_points 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);