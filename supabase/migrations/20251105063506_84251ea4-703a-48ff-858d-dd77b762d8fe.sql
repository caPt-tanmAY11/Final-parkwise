-- Add manager role to app_role enum in a separate transaction
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';