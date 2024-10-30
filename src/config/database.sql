-- Drop existing progress tables if they exist
drop table if exists public.video_progress;
drop table if exists public.course_progress;

-- Enable Row Level Security (RLS)
alter table if exists public.profiles enable row level security;
alter table if exists public.videos enable row level security;
alter table if exists public.courses enable row level security;
alter table if exists public.course_videos enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint profiles_email_key unique (email)
);

-- Create videos table
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  youtube_url text not null,
  thumbnail text,
  library_id text not null,
  storage_url text not null default 'https://vz-803138bc-70c.b-cdn.net',
  category text check (category in ('programming', 'design', 'business', 'marketing')) not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create courses table
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail_url text,
  category text check (category in ('programming', 'design', 'business', 'marketing')) not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rest of the schema remains the same...