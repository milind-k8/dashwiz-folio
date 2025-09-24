-- Add email_address column to email_monitors table
ALTER TABLE public.email_monitors 
ADD COLUMN email_address TEXT NOT NULL DEFAULT '';

-- Update existing records to use the authenticated user's email
-- This is a one-time operation for existing data
UPDATE public.email_monitors 
SET email_address = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = email_monitors.user_id
) 
WHERE email_address = '';

-- Make sure email_address is not empty going forward
ALTER TABLE public.email_monitors 
ALTER COLUMN email_address DROP DEFAULT;