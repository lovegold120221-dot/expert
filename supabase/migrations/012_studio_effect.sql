-- Add studio_effect (TikTok-style beautification) column to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS studio_effect BOOLEAN DEFAULT false;
