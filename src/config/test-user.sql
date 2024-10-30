-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, insert into auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  uuid_generate_v4(), -- Generate a proper UUID
  'test@example.com',
  crypt('password123', gen_salt('bf')), -- Create a proper password hash
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Then, insert into public.profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  is_admin,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  true, -- Set the test user as an admin
  created_at,
  updated_at
FROM auth.users
WHERE email = 'test@example.com';

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.profiles
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable insert access for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert access for authenticated users only" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable update access for users based on id'
  ) THEN
    CREATE POLICY "Enable update access for users based on id" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END
$$;