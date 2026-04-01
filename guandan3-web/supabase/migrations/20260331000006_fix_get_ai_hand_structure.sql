-- 修复 get_ai_hand 函数以匹配新的 state_private 结构
-- 新结构：state_private = {"0": [...], "1": [...], ...}
-- 旧结构：state_private = {"hands": {"0": [...], ...}}

CREATE OR REPLACE FUNCTION public.get_ai_hand(
  p_game_id uuid,
  p_seat_no int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_room_id uuid;
  v_state_private jsonb;
  v_hand jsonb;
  v_member_type text;
BEGIN
  -- 1. 获取房间ID和状态
  SELECT g.room_id, g.state_private
    INTO v_room_id, v_state_private
  FROM public.games g
  WHERE g.id = p_game_id;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- 2. 检查当前用户是房间成员
  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = v_room_id AND uid = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 3. 检查该座位是否为AI
  SELECT member_type INTO v_member_type
  FROM public.room_members
  WHERE room_id = v_room_id AND seat_no = p_seat_no;

  IF v_member_type IS NULL OR v_member_type != 'ai' THEN
    RAISE EXCEPTION 'Seat % is not an AI member', p_seat_no;
  END IF;

  -- 4. 从 state_private 直接获取AI手牌 (新结构)
  v_hand := v_state_private->(p_seat_no::text);

  -- 如果手牌为空，返回空数组
  IF v_hand IS NULL THEN
    v_hand := '[]'::jsonb;
  END IF;

  RETURN v_hand;
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION public.get_ai_hand TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_hand TO anon;

COMMENT ON FUNCTION public.get_ai_hand IS '获取AI玩家手牌，直接从 state_private 读取';
