-- 修复 get_ai_hand 函数以支持练习模式
-- 问题：练习模式中，AI需要为座位0的人类玩家代管出牌
-- 原函数检查成员类型必须是'ai'，导致座位0获取手牌失败

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
  v_room_mode text;
BEGIN
  -- 1. 获取房间ID和状态
  SELECT g.room_id, g.state_private, r.mode
    INTO v_room_id, v_state_private, v_room_mode
  FROM public.games g
  JOIN public.rooms r ON r.id = g.room_id
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

  -- 3. 检查该座位的成员类型
  SELECT member_type INTO v_member_type
  FROM public.room_members
  WHERE room_id = v_room_id AND seat_no = p_seat_no;

  IF v_member_type IS NULL THEN
    RAISE EXCEPTION 'Seat % does not exist', p_seat_no;
  END IF;

  -- 4. 修复：在练习模式(pve1v3)中，允许为座位0的人类玩家获取手牌
  -- 因为AI需要代管人类玩家的出牌
  IF v_member_type != 'ai' AND NOT (v_room_mode = 'pve1v3' AND p_seat_no = 0) THEN
    RAISE EXCEPTION 'Seat % is not an AI member (mode: %, type: %)', p_seat_no, v_room_mode, v_member_type;
  END IF;

  -- 5. 从 state_private 直接获取手牌 (新结构)
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
GRANT EXECUTE ON FUNCTION public get_ai_hand TO anon;

COMMENT ON FUNCTION public.get_ai_hand IS '获取AI手牌或练习模式中人类玩家手牌';
