-- 修复 get_ai_hand 函数
-- 问题：当前从 game_hands 表读取，但 AI 的手牌变化只存在 state_private.hands 中
-- 解决：直接从 state_private.hands 读取 AI 手牌

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

  -- 4. 从 state_private.hands 获取AI手牌
  v_hand := v_state_private->'hands'->(p_seat_no::text);

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
