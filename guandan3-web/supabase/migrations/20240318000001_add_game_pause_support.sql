-- Add game pause/resume support
-- Add paused status to games table
ALTER TABLE public.games 
ADD CONSTRAINT games_status_check 
CHECK (status IN ('deal', 'playing', 'paused', 'finished'));

-- Add pause tracking fields
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS paused_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS paused_at timestamptz,
ADD COLUMN IF NOT EXISTS pause_reason text;

-- Create index for paused games
CREATE INDEX IF NOT EXISTS idx_games_paused 
ON public.games(status) 
WHERE status = 'paused';

-- Function to pause a game
CREATE OR REPLACE FUNCTION pause_game(p_game_id uuid, p_uid uuid, p_reason text DEFAULT '')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status text;
  v_room_id uuid;
BEGIN
  -- Get current game status and room_id
  SELECT status, room_id INTO v_current_status, v_room_id
  FROM public.games
  WHERE id = p_game_id;
  
  -- Check if game exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Check if game can be paused (only playing games can be paused)
  IF v_current_status != 'playing' THEN
    RAISE EXCEPTION 'Game is not in playing status';
  END IF;
  
  -- Update game status to paused
  UPDATE public.games
  SET status = 'paused',
      paused_by = p_uid,
      paused_at = now(),
      pause_reason = p_reason,
      updated_at = now()
  WHERE id = p_game_id;
  
  -- Notify room about game pause
  PERFORM pg_notify(
    'room:' || v_room_id::text,
    json_build_object(
      'type', 'game_paused',
      'game_id', p_game_id,
      'paused_by', p_uid,
      'reason', p_reason
    )::text
  );
  
  RETURN true;
END;
$$;

-- Function to resume a game
CREATE OR REPLACE FUNCTION resume_game(p_game_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status text;
  v_room_id uuid;
BEGIN
  -- Get current game status and room_id
  SELECT status, room_id INTO v_current_status, v_room_id
  FROM public.games
  WHERE id = p_game_id;
  
  -- Check if game exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Check if game can be resumed (only paused games can be resumed)
  IF v_current_status != 'paused' THEN
    RAISE EXCEPTION 'Game is not in paused status';
  END IF;
  
  -- Update game status back to playing
  UPDATE public.games
  SET status = 'playing',
      paused_by = NULL,
      paused_at = NULL,
      pause_reason = NULL,
      updated_at = now()
  WHERE id = p_game_id;
  
  -- Notify room about game resume
  PERFORM pg_notify(
    'room:' || v_room_id::text,
    json_build_object(
      'type', 'game_resumed',
      'game_id', p_game_id,
      'resumed_by', p_uid
    )::text
  );
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION pause_game TO authenticated;
GRANT EXECUTE ON FUNCTION resume_game TO authenticated;
