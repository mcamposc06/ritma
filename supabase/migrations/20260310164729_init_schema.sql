-- Enable pgcrypto for UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- Enum for days of the week for habit frequency
create type day_of_week as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- TABLE: users
-- Since we use Supabase Auth, we extend the auth.users table with a public profile if needed.
-- For simple MVP, auth.users is often enough, but a profiles table is good practice.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);


-- TABLE: habits
-- Stores the habits created by the user
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  frequency day_of_week[] default '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}'::day_of_week[],
  color_hex text default '#3498db', -- Simple way to identify habits visually
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for habits
alter table public.habits enable row level security;
create policy "Users can view own habits." on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits." on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits." on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits." on public.habits for delete using (auth.uid() = user_id);


-- TABLE: daily_logs
-- Tracks the completion of habits on specific dates
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null, -- The day this habit was marked as done
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent logging the same habit twice on the same day
  unique(habit_id, log_date)
);

-- RLS for daily_logs
alter table public.daily_logs enable row level security;
create policy "Users can view own daily logs." on public.daily_logs for select using (auth.uid() = user_id);
create policy "Users can insert own daily logs." on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own daily logs." on public.daily_logs for delete using (auth.uid() = user_id);


-- FUNCTION: handle_new_user
-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
