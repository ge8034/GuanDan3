-- Add game stats system
CREATE TABLE IF NOT EXISTS public.game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  is_ai_game boolean DEFAULT false,
  team_score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  result text NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
  seat_no integer NOT NULL,
  level_rank integer NOT NULL,
  cards_played integer DEFAULT 0,
  bombs_played integer DEFAULT 0,
  game_duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  games_lost integer DEFAULT 0,
  total_score integer DEFAULT 0,
  bombs_played integer DEFAULT 0,
  cards_played integer DEFAULT 0,
  game_duration_seconds integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_games integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  win_rate numeric(5, 2) DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  avg_score numeric(10, 2) DEFAULT 0,
  bombs_played integer NOT NULL DEFAULT 0,
  cards_played integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  last_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON public.game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON public.game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_room_id ON public.game_stats(room_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_created_at ON public.game_stats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_result ON public.game_stats(result);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_win_rate ON public.leaderboard(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON public.leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated_at ON public.leaderboard(updated_at DESC);

-- Function to record game stats
CREATE OR REPLACE FUNCTION record_game_stats(
  p_user_id uuid,
  p_game_id uuid,
  p_room_id uuid,
  p_is_ai_game boolean,
  p_team_score integer,
  p_opponent_score integer,
  p_result text,
  p_seat_no integer,
  p_level_rank integer,
  p_cards_played integer DEFAULT 0,
  p_bombs_played integer DEFAULT 0,
  p_game_duration_seconds integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stat_id uuid;
  v_today date;
BEGIN
  -- Insert game stat
  INSERT INTO public.game_stats (
    user_id,
    game_id,
    room_id,
    is_ai_game,
    team_score,
    opponent_score,
    result,
    seat_no,
    level_rank,
    cards_played,
    bombs_played,
    game_duration_seconds
  )
  VALUES (
    p_user_id,
    p_game_id,
    p_room_id,
    p_is_ai_game,
    p_team_score,
    p_opponent_score,
    p_result,
    p_seat_no,
    p_level_rank,
    p_cards_played,
    p_bombs_played,
    p_game_duration_seconds
  )
  RETURNING id INTO v_stat_id;

  -- Update daily stats
  v_today := CURRENT_DATE;
  
  INSERT INTO public.daily_stats (
    user_id,
    date,
    games_played,
    games_won,
    games_lost,
    total_score,
    bombs_played,
    cards_played,
    game_duration_seconds
  )
  VALUES (
    p_user_id,
    v_today,
    1,
    CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    CASE WHEN p_result = 'lose' THEN 1 ELSE 0 END,
    p_team_score,
    p_bombs_played,
    p_cards_played,
    p_game_duration_seconds
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    games_played = daily_stats.games_played + 1,
    games_won = daily_stats.games_won + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    games_lost = daily_stats.games_lost + CASE WHEN p_result = 'lose' THEN 1 ELSE 0 END,
    total_score = daily_stats.total_score + p_team_score,
    bombs_played = daily_stats.bombs_played + p_bombs_played,
    cards_played = daily_stats.cards_played + p_cards_played,
    game_duration_seconds = daily_stats.game_duration_seconds + COALESCE(p_game_duration_seconds, 0),
    updated_at = now();

  -- Update leaderboard
  INSERT INTO public.leaderboard (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = leaderboard.total_games + 1,
    total_wins = leaderboard.total_wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    total_losses = leaderboard.total_losses + CASE WHEN p_result = 'lose' THEN 1 ELSE 0 END,
    win_rate = CASE 
      WHEN (leaderboard.total_wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END) = 0 THEN 0
      ELSE ROUND(
        (leaderboard.total_wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END)::numeric / 
        (leaderboard.total_games + 1)::numeric * 100, 
        2
      )
    END,
    total_score = leaderboard.total_score + p_team_score,
    avg_score = ROUND(
      (leaderboard.total_score + p_team_score)::numeric / 
      (leaderboard.total_games + 1)::numeric, 
      2
    ),
    bombs_played = leaderboard.bombs_played + p_bombs_played,
    cards_played = leaderboard.cards_played + p_cards_played,
    current_streak = CASE 
      WHEN p_result = 'win' THEN leaderboard.current_streak + 1
      ELSE 0
    END,
    max_streak = GREATEST(
      leaderboard.max_streak,
      CASE 
        WHEN p_result = 'win' THEN leaderboard.current_streak + 1
        ELSE 0
      END
    ),
    last_played_at = now(),
    updated_at = now();

  RETURN v_stat_id;
END;
$$;

-- Function to get user game stats
CREATE OR REPLACE FUNCTION get_user_game_stats(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  stat_id uuid,
  game_id uuid,
  room_id uuid,
  is_ai_game boolean,
  team_score integer,
  opponent_score integer,
  result text,
  seat_no integer,
  level_rank integer,
  cards_played integer,
  bombs_played integer,
  game_duration_seconds integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.id as stat_id,
    gs.game_id,
    gs.room_id,
    gs.is_ai_game,
    gs.team_score,
    gs.opponent_score,
    gs.result,
    gs.seat_no,
    gs.level_rank,
    gs.cards_played,
    gs.bombs_played,
    gs.game_duration_seconds,
    gs.created_at
  FROM public.game_stats gs
  WHERE gs.user_id = p_user_id
  ORDER BY gs.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get user summary stats
CREATE OR REPLACE FUNCTION get_user_summary_stats(p_user_id uuid)
RETURNS TABLE (
  total_games integer,
  total_wins integer,
  total_losses integer,
  win_rate numeric,
  total_score integer,
  avg_score numeric,
  total_bombs integer,
  total_cards integer,
  avg_game_duration numeric,
  current_streak integer,
  max_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lb.total_games,
    lb.total_wins,
    lb.total_losses,
    lb.win_rate,
    lb.total_score,
    lb.avg_score,
    lb.bombs_played as total_bombs,
    lb.cards_played as total_cards,
    ROUND(
      (SELECT AVG(game_duration_seconds) 
       FROM public.game_stats 
       WHERE user_id = p_user_id 
       AND game_duration_seconds IS NOT NULL
      )::numeric, 
      2
    ) as avg_game_duration,
    lb.current_streak,
    lb.max_streak
  FROM public.leaderboard lb
  WHERE lb.user_id = p_user_id;
END;
$$;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_sort_by text DEFAULT 'win_rate'
)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  nickname text,
  avatar_url text,
  total_games integer,
  total_wins integer,
  total_losses integer,
  win_rate numeric,
  total_score integer,
  avg_score numeric,
  current_streak integer,
  max_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE p_sort_by
          WHEN 'win_rate' THEN lb.win_rate
          WHEN 'total_score' THEN lb.total_score
          WHEN 'total_games' THEN lb.total_games
          ELSE lb.win_rate
        END DESC
    ) as rank,
    lb.user_id,
    p.nickname,
    p.avatar_url,
    lb.total_games,
    lb.total_wins,
    lb.total_losses,
    lb.win_rate,
    lb.total_score,
    lb.avg_score,
    lb.current_streak,
    lb.max_streak
  FROM public.leaderboard lb
  JOIN public.profiles p ON lb.user_id = p.uid
  ORDER BY 
    CASE p_sort_by
      WHEN 'win_rate' THEN lb.win_rate
      WHEN 'total_score' THEN lb.total_score
      WHEN 'total_games' THEN lb.total_games
      ELSE lb.win_rate
    END DESC,
    lb.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get daily stats
CREATE OR REPLACE FUNCTION get_daily_stats(
  p_user_id uuid,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  date date,
  games_played integer,
  games_won integer,
  games_lost integer,
  total_score integer,
  bombs_played integer,
  cards_played integer,
  game_duration_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.date,
    ds.games_played,
    ds.games_won,
    ds.games_lost,
    ds.total_score,
    ds.bombs_played,
    ds.cards_played,
    ds.game_duration_seconds
  FROM public.daily_stats ds
  WHERE ds.user_id = p_user_id
    AND ds.date >= CURRENT_DATE - (p_days || ' days')::interval
  ORDER BY ds.date DESC;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.game_stats TO authenticated;
GRANT ALL ON public.daily_stats TO authenticated;
GRANT ALL ON public.leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION record_game_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_game_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_summary_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_stats TO authenticated;

-- Enable RLS
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_stats
CREATE POLICY "Users can view their own game stats"
ON public.game_stats
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own game stats"
ON public.game_stats
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS policies for daily_stats
CREATE POLICY "Users can view their own daily stats"
ON public.daily_stats
FOR SELECT
USING (user_id = auth.uid());

-- RLS policies for leaderboard
CREATE POLICY "Users can view leaderboard"
ON public.leaderboard
FOR SELECT
USING (true);
