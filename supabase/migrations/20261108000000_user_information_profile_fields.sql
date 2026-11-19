-- Signup collects a first name and a major, but user_information had no
-- columns for them. Run this in the Supabase SQL editor (or with psql).
--
-- The other columns store short codes ('non_binary', 'boston', 'night_out');
-- backend/validation/profile.js maps them to the labels the app shows.

alter table public.user_information
  add column if not exists first_name text,
  add column if not exists major text;

alter table public.user_information
  add constraint user_information_first_name_length
    check (first_name is null or char_length(first_name) between 1 and 40),
  add constraint user_information_major_length
    check (major is null or char_length(major) between 1 and 60);
