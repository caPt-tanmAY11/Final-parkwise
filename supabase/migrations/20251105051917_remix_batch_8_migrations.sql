
-- Migration: 20251027141554
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'bike', 'suv', 'truck')),
  vehicle_model TEXT,
  vehicle_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create membership plans table
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Silver', 'Gold', 'Platinum')),
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]',
  discount_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user memberships table
CREATE TABLE public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loyalty points table
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parking centres table
CREATE TABLE public.parking_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_capacity INTEGER NOT NULL DEFAULT 0,
  operating_hours TEXT NOT NULL DEFAULT '24/7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parking zones table
CREATE TABLE public.parking_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES public.parking_centres(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('vip', 'regular', 'disabled', 'ev_charging')),
  floor_number INTEGER,
  total_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parking slots table
CREATE TABLE public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.parking_zones(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'bike', 'suv', 'truck')),
  hourly_rate DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_id, slot_number)
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES public.parking_centres(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'security', 'maintenance', 'support')),
  shift_timing TEXT,
  hired_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES public.parking_slots(id) ON DELETE RESTRICT,
  booking_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  booking_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  total_hours DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tokens table (for QR codes)
CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  token_code TEXT NOT NULL UNIQUE,
  qr_data TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'wallet', 'cash', 'points')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT UNIQUE,
  points_used INTEGER DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customer support table
CREATE TABLE public.customer_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('complaint', 'feedback', 'query', 'technical')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.staff(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for vehicles
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for membership plans (public read)
CREATE POLICY "Anyone can view membership plans"
  ON public.membership_plans FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user memberships
CREATE POLICY "Users can view their own memberships"
  ON public.user_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
  ON public.user_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loyalty points
CREATE POLICY "Users can view their own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.loyalty_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for parking centres, zones, slots (public read)
CREATE POLICY "Anyone can view parking centres"
  ON public.parking_centres FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view parking zones"
  ON public.parking_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view parking slots"
  ON public.parking_slots FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for tokens
CREATE POLICY "Users can view their booking tokens"
  ON public.tokens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = tokens.booking_id
    AND bookings.user_id = auth.uid()
  ));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for customer support
CREATE POLICY "Users can view their own support tickets"
  ON public.customer_support FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support tickets"
  ON public.customer_support FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets"
  ON public.customer_support FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_support_updated_at
  BEFORE UPDATE ON public.customer_support
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile and points on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default membership plans
INSERT INTO public.membership_plans (name, price_monthly, price_yearly, benefits, discount_percentage)
VALUES 
  ('Silver', 499, 4990, '["10% discount on parking", "Priority booking", "Free cancellation"]'::jsonb, 10),
  ('Gold', 999, 9990, '["20% discount on parking", "Priority booking", "Free cancellation", "2x loyalty points", "Reserved parking zones"]'::jsonb, 20),
  ('Platinum', 1999, 19990, '["30% discount on parking", "Top priority booking", "Free cancellation", "3x loyalty points", "VIP parking zones", "24/7 concierge support"]'::jsonb, 30);

-- Migration: 20251027141657
-- Fix security issues from the linter

-- Add RLS policies for staff table (read-only for authenticated users)
CREATE POLICY "Authenticated users can view staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (true);

-- Update the function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: 20251028153350
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update existing tables with admin policies
CREATE POLICY "Admins can manage parking centres"
ON public.parking_centres
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage parking zones"
ON public.parking_zones
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage parking slots"
ON public.parking_slots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage staff"
ON public.staff
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Migration: 20251028163000
-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add comment
COMMENT ON COLUMN public.profiles.username IS 'Unique username for login';

-- Migration: 20251031192204
-- Add RLS policy for admins to view all support tickets
CREATE POLICY "Admins can view all support tickets"
ON public.customer_support
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Add RLS policy for admins to update support tickets
CREATE POLICY "Admins can update all support tickets"
ON public.customer_support
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);


-- Migration: 20251101091933
-- Update the handle_new_user trigger to include username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  
  INSERT INTO public.loyalty_points (user_id, points)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$function$;


-- Migration: 20251101103823
-- Temporarily disable RLS to insert sample data
ALTER TABLE public.parking_centres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots DISABLE ROW LEVEL SECURITY;

-- Insert parking centres
INSERT INTO public.parking_centres (name, address, city, state, pincode, total_capacity, operating_hours, latitude, longitude)
VALUES 
  ('Phoenix Mall Parking', 'LBS Marg, Kurla West', 'Mumbai', 'Maharashtra', '400070', 200, '24/7', 19.0760, 72.8777),
  ('Bandra West Complex', 'Hill Road, Bandra', 'Mumbai', 'Maharashtra', '400050', 150, '6:00 AM - 12:00 AM', 19.0596, 72.8295),
  ('Andheri Metro Station', 'SV Road, Andheri West', 'Mumbai', 'Maharashtra', '400058', 300, '24/7', 19.1136, 72.8697);

-- Insert parking zones
INSERT INTO public.parking_zones (centre_id, zone_name, zone_type, floor_number, total_slots)
SELECT pc.id, 'Zone A', 'regular', 0, 50 FROM parking_centres pc WHERE pc.name = 'Phoenix Mall Parking'
UNION ALL
SELECT pc.id, 'Zone B', 'regular', 1, 50 FROM parking_centres pc WHERE pc.name = 'Phoenix Mall Parking'
UNION ALL
SELECT pc.id, 'Zone C - VIP', 'vip', 2, 30 FROM parking_centres pc WHERE pc.name = 'Phoenix Mall Parking'
UNION ALL
SELECT pc.id, 'Zone D - EV', 'ev_charging', 2, 20 FROM parking_centres pc WHERE pc.name = 'Phoenix Mall Parking'
UNION ALL
SELECT pc.id, 'Ground Floor', 'regular', 0, 70 FROM parking_centres pc WHERE pc.name = 'Bandra West Complex'
UNION ALL
SELECT pc.id, 'First Floor', 'regular', 1, 70 FROM parking_centres pc WHERE pc.name = 'Bandra West Complex'
UNION ALL
SELECT pc.id, 'Disabled Parking', 'disabled', 0, 10 FROM parking_centres pc WHERE pc.name = 'Bandra West Complex'
UNION ALL
SELECT pc.id, 'Two Wheeler Zone', 'regular', 0, 120 FROM parking_centres pc WHERE pc.name = 'Andheri Metro Station'
UNION ALL
SELECT pc.id, 'Four Wheeler Zone', 'regular', 1, 120 FROM parking_centres pc WHERE pc.name = 'Andheri Metro Station'
UNION ALL
SELECT pc.id, 'VIP Zone', 'vip', 1, 30 FROM parking_centres pc WHERE pc.name = 'Andheri Metro Station'
UNION ALL
SELECT pc.id, 'EV Charging', 'ev_charging', 1, 30 FROM parking_centres pc WHERE pc.name = 'Andheri Metro Station';

-- Insert parking slots
INSERT INTO public.parking_slots (zone_id, slot_number, vehicle_type, status, hourly_rate)
-- Phoenix Mall Zone A (Regular) - Bikes
SELECT pz.id, 'A-' || lpad(gs::text, 3, '0'), 'bike', 'available', 20
FROM parking_zones pz
CROSS JOIN generate_series(1, 25) gs
WHERE pz.zone_name = 'Zone A' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone A - Cars
SELECT pz.id, 'A-' || lpad(gs::text, 3, '0'), 'car', 'available', 50
FROM parking_zones pz
CROSS JOIN generate_series(26, 50) gs
WHERE pz.zone_name = 'Zone A' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone B - Bikes
SELECT pz.id, 'B-' || lpad(gs::text, 3, '0'), 'bike', 'available', 20
FROM parking_zones pz
CROSS JOIN generate_series(1, 30) gs
WHERE pz.zone_name = 'Zone B' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone B - Cars
SELECT pz.id, 'B-' || lpad(gs::text, 3, '0'), 'car', 'available', 50
FROM parking_zones pz
CROSS JOIN generate_series(31, 50) gs
WHERE pz.zone_name = 'Zone B' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone C - VIP Cars
SELECT pz.id, 'C-' || lpad(gs::text, 3, '0'), 'car', 'available', 100
FROM parking_zones pz
CROSS JOIN generate_series(1, 20) gs
WHERE pz.zone_name = 'Zone C - VIP' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone C - VIP SUVs
SELECT pz.id, 'C-' || lpad(gs::text, 3, '0'), 'suv', 'available', 120
FROM parking_zones pz
CROSS JOIN generate_series(21, 30) gs
WHERE pz.zone_name = 'Zone C - VIP' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Phoenix Mall Zone D - EV Charging
SELECT pz.id, 'D-' || lpad(gs::text, 3, '0'), 'car', 'available', 80
FROM parking_zones pz
CROSS JOIN generate_series(1, 20) gs
WHERE pz.zone_name = 'Zone D - EV' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Phoenix Mall Parking')
UNION ALL
-- Bandra West Ground Floor - Bikes
SELECT pz.id, 'G-' || lpad(gs::text, 3, '0'), 'bike', 'available', 25
FROM parking_zones pz
CROSS JOIN generate_series(1, 40) gs
WHERE pz.zone_name = 'Ground Floor' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Bandra West Complex')
UNION ALL
-- Bandra West Ground Floor - Cars
SELECT pz.id, 'G-' || lpad(gs::text, 3, '0'), 'car', 'available', 60
FROM parking_zones pz
CROSS JOIN generate_series(41, 70) gs
WHERE pz.zone_name = 'Ground Floor' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Bandra West Complex')
UNION ALL
-- Bandra West First Floor - Bikes
SELECT pz.id, 'F1-' || lpad(gs::text, 3, '0'), 'bike', 'available', 25
FROM parking_zones pz
CROSS JOIN generate_series(1, 35) gs
WHERE pz.zone_name = 'First Floor' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Bandra West Complex')
UNION ALL
-- Bandra West First Floor - Cars
SELECT pz.id, 'F1-' || lpad(gs::text, 3, '0'), 'car', 'available', 60
FROM parking_zones pz
CROSS JOIN generate_series(36, 70) gs
WHERE pz.zone_name = 'First Floor' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Bandra West Complex')
UNION ALL
-- Bandra West Disabled Parking
SELECT pz.id, 'D-' || lpad(gs::text, 3, '0'), 'car', 'available', 40
FROM parking_zones pz
CROSS JOIN generate_series(1, 10) gs
WHERE pz.zone_name = 'Disabled Parking' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Bandra West Complex')
UNION ALL
-- Andheri Metro Two Wheeler Zone
SELECT pz.id, 'TW-' || lpad(gs::text, 3, '0'), 'bike', 'available', 15
FROM parking_zones pz
CROSS JOIN generate_series(1, 120) gs
WHERE pz.zone_name = 'Two Wheeler Zone' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Andheri Metro Station')
UNION ALL
-- Andheri Metro Four Wheeler Zone - Cars
SELECT pz.id, 'FW-' || lpad(gs::text, 3, '0'), 'car', 'available', 45
FROM parking_zones pz
CROSS JOIN generate_series(1, 90) gs
WHERE pz.zone_name = 'Four Wheeler Zone' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Andheri Metro Station')
UNION ALL
-- Andheri Metro Four Wheeler Zone - SUVs
SELECT pz.id, 'FW-' || lpad(gs::text, 3, '0'), 'suv', 'available', 55
FROM parking_zones pz
CROSS JOIN generate_series(91, 120) gs
WHERE pz.zone_name = 'Four Wheeler Zone' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Andheri Metro Station')
UNION ALL
-- Andheri Metro VIP Zone
SELECT pz.id, 'VIP-' || lpad(gs::text, 3, '0'), 'suv', 'available', 90
FROM parking_zones pz
CROSS JOIN generate_series(1, 30) gs
WHERE pz.zone_name = 'VIP Zone' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Andheri Metro Station')
UNION ALL
-- Andheri Metro EV Charging
SELECT pz.id, 'EV-' || lpad(gs::text, 3, '0'), 'car', 'available', 70
FROM parking_zones pz
CROSS JOIN generate_series(1, 30) gs
WHERE pz.zone_name = 'EV Charging' AND pz.centre_id IN (SELECT id FROM parking_centres WHERE name = 'Andheri Metro Station');

-- Re-enable RLS
ALTER TABLE public.parking_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;


-- Migration: 20251101104228
-- Add RLS policy for users to update parking slots when booking
CREATE POLICY "Users can update slot status when booking"
ON public.parking_slots
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add RLS policy for users to insert tokens for their bookings
CREATE POLICY "Users can create tokens for their bookings"
ON public.tokens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = tokens.booking_id
    AND bookings.user_id = auth.uid()
  )
);

