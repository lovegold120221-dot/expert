-- Allow the room history sidebar to read room-scoped translation history
-- across all participants, and index room_name for faster lookups.

DROP POLICY IF EXISTS select_own_history ON public.translation_history;
CREATE POLICY select_translation_history_all ON public.translation_history
  FOR SELECT
  USING (true);

DROP INDEX IF EXISTS idx_translation_history_room_name;
CREATE INDEX IF NOT EXISTS idx_translation_history_room_name
  ON public.translation_history (room_name);
