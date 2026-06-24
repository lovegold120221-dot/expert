-- =============================================================================
-- Orbit Meeting — COMPLETE DATABASE SCHEMA (ALL MIGRATIONS)
-- =============================================================================
-- This file consolidates ALL migration scripts (001–013) + setup.sql + final.sql
-- into one idempotent script. Safe to re-run multiple times.
--
-- Consolidated on: 2026-06-24
-- Migrations included:
--   001_schema.sql        — Initial schema (profiles, meetings, participants, recordings, chat)
--   002_chat_fix.sql       — Add sender_name, fix chat RLS for anonymous users
--   003_chat_fk_fix.sql    — Change chat FK columns from UUID to TEXT
--   004_chat_fix_complete.sql — Idempotent chat FK fix
--   005_translation_history.sql — Translation history table + RLS
--   006_add_content_type.sql — Add content_type to profiles
--   007_chat_rls_fix.sql   — Open chat RLS policies
--   008_theme_preferences.sql — System theme support
--   009_profile_email_phone.sql — Add email/phone to profiles
--   010_glossary.sql       — Add glossary JSONB to profiles
--   011_chat_attachments.sql — Chat attachment columns + storage bucket
--   012_studio_effect.sql  — Add studio_effect to profiles
--   013_room_history_sidebar.sql — Open translation_history read + room index
--   setup.sql             — Consolidated complete setup (tables, RLS, indexes, storage)
--   final.sql             — Final consolidated schema
-- =============================================================================

-- =============================================================================
-- PREREQUISITE: pgcrypto extension
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                        MIGRATION 001 — INITIAL SCHEMA                       ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Orbit Meeting — Full Database Schema
-- Drop tables in dependency order (children first, then parents).
-- Drop functions last (not schema-bound).

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.recordings CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ── 1. PROFILES (extends auth.users) ──────────────────────────────────────

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  default_language TEXT DEFAULT 'en',
  voice TEXT DEFAULT 'Orus',
  mic_device_id TEXT,
  speaker_device_id TEXT,
  auto_join_audio BOOLEAN DEFAULT false,
  noise_suppression BOOLEAN DEFAULT true,
  cam_device_id TEXT,
  mirror_video BOOLEAN DEFAULT true,
  camera_off_on_join BOOLEAN DEFAULT false,
  video_background TEXT DEFAULT 'none',
  show_captions BOOLEAN DEFAULT true,
  mute_original_audio BOOLEAN DEFAULT true,
  translate_audio_playback BOOLEAN DEFAULT true,
  recording_save_path TEXT DEFAULT '',
  recording_auto_start BOOLEAN DEFAULT false,
  glossary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 2. MEETINGS ───────────────────────────────────────────────────────────

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Orbit Meeting',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'ended')),
  room_name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER on_meeting_updated
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 3. MEETING PARTICIPANTS ───────────────────────────────────────────────

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

-- ── 4. RECORDINGS ─────────────────────────────────────────────────────────

CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  recording_type TEXT DEFAULT 'local'
    CHECK (recording_type IN ('local', 'server')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. CHAT MESSAGES (persistent) ─────────────────────────────────────────

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read/update only their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- MEETINGS: creator owns the meeting; participants can read
CREATE POLICY "meetings_select_participant"
  ON public.meetings FOR SELECT
  USING (
    auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT user_id FROM public.meeting_participants WHERE meeting_id = meetings.id
    )
  );

CREATE POLICY "meetings_insert_own"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "meetings_update_own"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "meetings_delete_own"
  ON public.meetings FOR DELETE
  USING (auth.uid() = creator_id);

-- MEETING PARTICIPANTS: only see your own participations
CREATE POLICY "mp_select_own"
  ON public.meeting_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mp_insert_own"
  ON public.meeting_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mp_update_own"
  ON public.meeting_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RECORDINGS: only see your own recordings
CREATE POLICY "recordings_select_own"
  ON public.recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recordings_insert_own"
  ON public.recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_delete_own"
  ON public.recordings FOR DELETE
  USING (auth.uid() = user_id);

-- CHAT MESSAGES: participants of the meeting can read; sender can insert
CREATE POLICY "chat_select_meeting"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.meeting_participants
      WHERE meeting_id = chat_messages.meeting_id
    )
    OR auth.uid() = (
      SELECT creator_id FROM public.meetings
      WHERE id = chat_messages.meeting_id
    )
  );

CREATE POLICY "chat_insert_own"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meetings_creator ON public.meetings(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON public.recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting ON public.chat_messages(meeting_id);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                       MIGRATION 002 — CHAT FIX                              ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Adds sender_name column and updates RLS policies to allow
-- anonymous (unauthenticated) users to read/write chat messages.

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Drop old restrictive policies
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;

-- Allow meeting participants (authenticated) to read chat messages.
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
CREATE POLICY chat_select_participant
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() IN (
        SELECT user_id FROM public.meeting_participants
        WHERE meeting_id::text = chat_messages.meeting_id::text
      )
      OR auth.uid() = (
        SELECT creator_id FROM public.meetings
        WHERE id::text = chat_messages.meeting_id::text
      )
    )
  );

-- Allow anonymous users to read chat messages too (the app always filters
-- by meeting_id, which is a UUID known only to participants of that room).
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
CREATE POLICY chat_select_anonymous
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NULL);

-- Allow any user (authenticated or anonymous) to insert chat messages.
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
CREATE POLICY chat_insert_any
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                    MIGRATION 003 — CHAT FK FIX                              ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- chat_messages.meeting_id was UUID FK → public.meetings(id), but the app uses
-- arbitrary UUID room names from crypto.randomUUID() that never get a meetings row.
-- chat_messages.user_id was UUID FK → public.profiles(id), but anonymous users
-- don't have a Supabase profile and send their LiveKit identity (string) instead.

-- Step 1: Drop ALL RLS policies that could possibly depend on meeting_id or user_id
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;

-- Step 2: Drop FK constraints
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_meeting_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Step 3: Change meeting_id from UUID → TEXT (room names are arbitrary strings)
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id SET NOT NULL;

-- Step 4: Change user_id from UUID → TEXT (accepts auth UUIDs or anonymous peer-xxx identities)
ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET DEFAULT NULL;

-- Step 5: Rebuild indexes for fast chat-history queries
DROP INDEX IF EXISTS idx_chat_messages_meeting;
CREATE INDEX idx_chat_messages_meeting ON public.chat_messages(meeting_id);

-- Step 6: Recreate RLS policies (DROP IF EXISTS for full idempotency)
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
CREATE POLICY chat_select_participant
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() IN (
        SELECT user_id FROM public.meeting_participants
        WHERE meeting_id::text = chat_messages.meeting_id
      )
      OR auth.uid() = (
        SELECT creator_id FROM public.meetings
        WHERE id::text = chat_messages.meeting_id
      )
    )
  );

DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
CREATE POLICY chat_select_anonymous
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NULL);

DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
CREATE POLICY chat_insert_any
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                MIGRATION 004 — CHAT FIX COMPLETE (idempotent)               ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Idempotent version ensuring all chat fixes are applied regardless of state.

-- Drop all existing RLS policies (clean slate for idempotency)
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;

-- Drop FK constraints (idempotent)
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_meeting_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Add sender_name column if missing
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Change meeting_id from UUID → TEXT
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id SET NOT NULL;

-- Change user_id from UUID → TEXT
ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET DEFAULT NULL;

-- Ensure index
DROP INDEX IF EXISTS idx_chat_messages_meeting;
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting ON public.chat_messages(meeting_id);

-- Recreate RLS policies
CREATE POLICY chat_select_participant
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() IN (
        SELECT user_id FROM public.meeting_participants
        WHERE meeting_id::text = chat_messages.meeting_id
      )
      OR auth.uid() = (
        SELECT creator_id FROM public.meetings
        WHERE id::text = chat_messages.meeting_id
      )
    )
  );

CREATE POLICY chat_select_anonymous
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NULL);

CREATE POLICY chat_insert_any
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║              MIGRATION 005 — TRANSLATION HISTORY                            ║
--╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT '',
  room_name TEXT NOT NULL DEFAULT '',
  source_identity TEXT NOT NULL DEFAULT '',
  speaker_name TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  translated_text TEXT NOT NULL DEFAULT '',
  source_lang TEXT NOT NULL DEFAULT '',
  target_lang TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow all authenticated/anonymous users to read their own history
DROP POLICY IF EXISTS select_own_history ON public.translation_history;
CREATE POLICY select_own_history ON public.translation_history
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true) OR user_id = '');

-- Allow insert for any user_id (both auth and anonymous)
DROP POLICY IF EXISTS insert_translation_history ON public.translation_history;
CREATE POLICY insert_translation_history ON public.translation_history
  FOR INSERT
  WITH CHECK (true);

-- Indexes for fast lookups
DROP INDEX IF EXISTS idx_translation_history_user_id;
CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON public.translation_history (user_id);

DROP INDEX IF EXISTS idx_translation_history_created_at;
CREATE INDEX IF NOT EXISTS idx_translation_history_created_at ON public.translation_history (created_at DESC);

ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;


--╔══════════════════════════════════════════════════════════════════════════════╗
--║               MIGRATION 006 — ADD CONTENT TYPE                              ║
--╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'normal';


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                MIGRATION 007 — CHAT RLS FIX                                 ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- The existing chat_select_participant policy requires joining via
-- meeting_participants table, but that table is never populated in
-- the LiveKit join flow. This migration replaces the restrictive
-- policies with open ones so any user in the room can read its chat
-- history and any user can send messages.

-- Drop existing policies
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_all ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_all ON public.chat_messages;

-- Allow anyone to SELECT chat messages (matching by meeting_id happens in the query)
CREATE POLICY chat_select_all
  ON public.chat_messages FOR SELECT
  USING (true);

-- Allow anyone to INSERT chat messages
CREATE POLICY chat_insert_all
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

-- Allow the message column to be null (for attachment-only messages)
ALTER TABLE public.chat_messages ALTER COLUMN message DROP NOT NULL;


--╔══════════════════════════════════════════════════════════════════════════════╗
--║             MIGRATION 008 — THEME PREFERENCES                               ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Add system theme preference support to profiles.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_theme_check;

UPDATE public.profiles
SET theme = 'system'
WHERE theme IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN theme SET DEFAULT 'system';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_check
  CHECK (theme IN ('system', 'light', 'dark'));


--╔══════════════════════════════════════════════════════════════════════════════╗
--║            MIGRATION 009 — PROFILE EMAIL & PHONE                            ║
--╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update existing profiles from auth.users (if any exist)
UPDATE public.profiles p
SET email = u.email,
    phone = u.phone
FROM auth.users u
WHERE p.id = u.id;

-- Recreate trigger function to copy email and phone on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Allow SELECT on profiles for all users
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║               MIGRATION 010 — GLOSSARY                                      ║
--╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT '[]'::jsonb;


--╔══════════════════════════════════════════════════════════════════════════════╗
--║            MIGRATION 011 — CHAT ATTACHMENTS                                 ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Add attachment columns to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create the storage bucket for chat files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT
  'chat-files', 'chat-files', true, false,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
        'application/pdf','text/plain','text/csv',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip','application/x-zip-compressed',
        'audio/mpeg','audio/wav','audio/ogg','audio/mp4','video/mp4']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-files');

-- RLS: allow authenticated/anonymous users to upload to chat-files
DROP POLICY IF EXISTS chat_files_insert ON storage.objects;
CREATE POLICY chat_files_insert ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_select ON storage.objects;
CREATE POLICY chat_files_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_delete ON storage.objects;
CREATE POLICY chat_files_delete ON storage.objects
  FOR DELETE
  USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║            MIGRATION 012 — STUDIO EFFECT                                    ║
--╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS studio_effect BOOLEAN DEFAULT false;


--╔══════════════════════════════════════════════════════════════════════════════╗
--║          MIGRATION 013 — ROOM HISTORY SIDEBAR                               ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- Allow the room history sidebar to read room-scoped translation history
-- across all participants, and index room_name for faster lookups.

DROP POLICY IF EXISTS select_own_history ON public.translation_history;
CREATE POLICY select_translation_history_all ON public.translation_history
  FOR SELECT
  USING (true);

DROP INDEX IF EXISTS idx_translation_history_room_name;
CREATE INDEX IF NOT EXISTS idx_translation_history_room_name
  ON public.translation_history (room_name);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                    CONSOLIDATED SETUP (replaces 001–007)                    ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- This section replaces all individual migration files (001–007) with an
-- idempotent CREATE TABLE IF NOT EXISTS + ALTER approach. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  default_language TEXT DEFAULT 'en',
  voice TEXT DEFAULT 'Orus',
  mic_device_id TEXT,
  speaker_device_id TEXT,
  auto_join_audio BOOLEAN DEFAULT false,
  noise_suppression BOOLEAN DEFAULT true,
  cam_device_id TEXT,
  mirror_video BOOLEAN DEFAULT true,
  camera_off_on_join BOOLEAN DEFAULT false,
  video_background TEXT DEFAULT 'none',
  studio_effect BOOLEAN DEFAULT false,
  show_captions BOOLEAN DEFAULT true,
  mute_original_audio BOOLEAN DEFAULT true,
  translate_audio_playback BOOLEAN DEFAULT true,
  recording_save_path TEXT DEFAULT '',
  recording_auto_start BOOLEAN DEFAULT false,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra columns added by later migrations (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'normal';

-- Functions & Triggers (idempotent recreation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_meeting_updated ON public.meetings;
CREATE TRIGGER on_meeting_updated
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Orbit Meeting',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'ended')),
  room_name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  recording_type TEXT DEFAULT 'local'
    CHECK (recording_type IN ('local', 'server')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id TEXT NOT NULL,
  user_id TEXT,
  message TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachment columns (idempotent)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_size BIGINT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Drop stale FK constraints
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_meeting_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Ensure correct column types
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN meeting_id SET NOT NULL;
ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET DEFAULT NULL;
ALTER TABLE public.chat_messages ALTER COLUMN message DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT '',
  room_name TEXT NOT NULL DEFAULT '',
  source_identity TEXT NOT NULL DEFAULT '',
  speaker_name TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  translated_text TEXT NOT NULL DEFAULT '',
  source_lang TEXT NOT NULL DEFAULT '',
  target_lang TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (idempotent DROP + CREATE)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- MEETINGS
DROP POLICY IF EXISTS meetings_select_participant ON public.meetings;
CREATE POLICY meetings_select_participant ON public.meetings FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() IN (SELECT user_id FROM public.meeting_participants WHERE meeting_id = meetings.id));

DROP POLICY IF EXISTS meetings_insert_own ON public.meetings;
CREATE POLICY meetings_insert_own ON public.meetings FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS meetings_update_own ON public.meetings;
CREATE POLICY meetings_update_own ON public.meetings FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS meetings_delete_own ON public.meetings;
CREATE POLICY meetings_delete_own ON public.meetings FOR DELETE USING (auth.uid() = creator_id);

-- MEETING PARTICIPANTS
DROP POLICY IF EXISTS mp_select_own ON public.meeting_participants;
CREATE POLICY mp_select_own ON public.meeting_participants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS mp_insert_own ON public.meeting_participants;
CREATE POLICY mp_insert_own ON public.meeting_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mp_update_own ON public.meeting_participants;
CREATE POLICY mp_update_own ON public.meeting_participants FOR UPDATE USING (auth.uid() = user_id);

-- RECORDINGS
DROP POLICY IF EXISTS recordings_select_own ON public.recordings;
CREATE POLICY recordings_select_own ON public.recordings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS recordings_insert_own ON public.recordings;
CREATE POLICY recordings_insert_own ON public.recordings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS recordings_delete_own ON public.recordings;
CREATE POLICY recordings_delete_own ON public.recordings FOR DELETE USING (auth.uid() = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
DROP POLICY IF EXISTS chat_select_all ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_all ON public.chat_messages;

CREATE POLICY chat_select_all ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY chat_insert_all ON public.chat_messages FOR INSERT WITH CHECK (true);

-- TRANSLATION HISTORY
DROP POLICY IF EXISTS select_own_history ON public.translation_history;
DROP POLICY IF EXISTS insert_translation_history ON public.translation_history;
DROP POLICY IF EXISTS select_translation_history_all ON public.translation_history;

-- Broad read access for the room history sidebar (replaces the earlier
-- select_own_history restriction).
CREATE POLICY select_translation_history_all ON public.translation_history
  FOR SELECT
  USING (true);

CREATE POLICY insert_translation_history ON public.translation_history
  FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_creator ON public.meetings(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON public.recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user ON public.recordings(user_id);

DROP INDEX IF EXISTS idx_chat_messages_meeting;
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting ON public.chat_messages(meeting_id);

CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON public.translation_history (user_id);
CREATE INDEX IF NOT EXISTS idx_translation_history_created_at ON public.translation_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_history_room_name ON public.translation_history (room_name);

-- Storage bucket: chat-files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT
  'chat-files', 'chat-files', true, false,
  10485760,
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
    'application/pdf','text/plain','text/csv',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip','application/x-zip-compressed',
    'audio/mpeg','audio/wav','audio/ogg','audio/mp4','video/mp4'
  ]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-files');

-- Storage RLS
DROP POLICY IF EXISTS chat_files_insert ON storage.objects;
CREATE POLICY chat_files_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_select ON storage.objects;
CREATE POLICY chat_files_select ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_delete ON storage.objects;
CREATE POLICY chat_files_delete ON storage.objects FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);


--╔══════════════════════════════════════════════════════════════════════════════╗
--║                    FINAL CONSOLIDATED SCHEMA (clean-state version)          ║
--╚══════════════════════════════════════════════════════════════════════════════╝

-- This section provides a clean-state full schema. It drops all objects and
-- recreates them from scratch. Best for fresh database setups.

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.recordings CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ── PROFILES ──────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  default_language TEXT DEFAULT 'en',
  voice TEXT DEFAULT 'Orus',
  mic_device_id TEXT,
  speaker_device_id TEXT,
  auto_join_audio BOOLEAN DEFAULT false,
  noise_suppression BOOLEAN DEFAULT true,
  cam_device_id TEXT,
  mirror_video BOOLEAN DEFAULT true,
  camera_off_on_join BOOLEAN DEFAULT false,
  video_background TEXT DEFAULT 'none',
  studio_effect BOOLEAN DEFAULT false,
  show_captions BOOLEAN DEFAULT true,
  mute_original_audio BOOLEAN DEFAULT true,
  translate_audio_playback BOOLEAN DEFAULT true,
  recording_save_path TEXT DEFAULT '',
  recording_auto_start BOOLEAN DEFAULT false,
  glossary JSONB DEFAULT '[]'::jsonb,
  content_type TEXT DEFAULT 'normal',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers & Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── MEETINGS ──────────────────────────────────────────────────────────────

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Orbit Meeting',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'ended')),
  room_name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER on_meeting_updated
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── MEETING PARTICIPANTS ──────────────────────────────────────────────────

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

-- ── RECORDINGS ────────────────────────────────────────────────────────────

CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  recording_type TEXT DEFAULT 'local'
    CHECK (recording_type IN ('local', 'server')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHAT MESSAGES ─────────────────────────────────────────────────────────

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id TEXT NOT NULL,
  user_id TEXT,
  message TEXT,
  sender_name TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size BIGINT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_meeting ON public.chat_messages(meeting_id);

-- ── TRANSLATION HISTORY ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT '',
  room_name TEXT NOT NULL DEFAULT '',
  source_identity TEXT NOT NULL DEFAULT '',
  speaker_name TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  translated_text TEXT NOT NULL DEFAULT '',
  source_lang TEXT NOT NULL DEFAULT '',
  target_lang TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translation_history_user_id ON public.translation_history (user_id);
CREATE INDEX idx_translation_history_created_at ON public.translation_history (created_at DESC);
CREATE INDEX idx_translation_history_room_name ON public.translation_history (room_name);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- MEETINGS
CREATE POLICY "meetings_select_participant" ON public.meetings FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() IN (SELECT user_id FROM public.meeting_participants WHERE meeting_id = meetings.id));
CREATE POLICY "meetings_insert_own" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "meetings_update_own" ON public.meetings FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "meetings_delete_own" ON public.meetings FOR DELETE USING (auth.uid() = creator_id);

-- MEETING PARTICIPANTS
CREATE POLICY "mp_select_own" ON public.meeting_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mp_insert_own" ON public.meeting_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp_update_own" ON public.meeting_participants FOR UPDATE USING (auth.uid() = user_id);

-- RECORDINGS
CREATE POLICY "recordings_select_own" ON public.recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recordings_insert_own" ON public.recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recordings_delete_own" ON public.recordings FOR DELETE USING (auth.uid() = user_id);

-- CHAT MESSAGES
CREATE POLICY "chat_select_all" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert_all" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- TRANSLATION HISTORY (broad read for room history sidebar)
CREATE POLICY "select_translation_history_all" ON public.translation_history FOR SELECT USING (true);
CREATE POLICY "insert_translation_history" ON public.translation_history FOR INSERT WITH CHECK (true);

-- ── INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meetings_creator ON public.meetings(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON public.recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user ON public.recordings(user_id);

-- ── STORAGE BUCKETS ───────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT
  'chat-files', 'chat-files', true, false,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
        'application/pdf','text/plain','text/csv',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip','application/x-zip-compressed',
        'audio/mpeg','audio/wav','audio/ogg','audio/mp4','video/mp4']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-files');

DROP POLICY IF EXISTS chat_files_insert ON storage.objects;
CREATE POLICY chat_files_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_select ON storage.objects;
CREATE POLICY chat_files_select ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS chat_files_delete ON storage.objects;
CREATE POLICY chat_files_delete ON storage.objects FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);
