const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=([^\s\n]+)/);
const DB_URL = dbUrlMatch ? dbUrlMatch[1] : null;

async function fix() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ 已连接到数据库');

    const sql = `
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
  SELECT g.room_id, g.state_private, r.mode
    INTO v_room_id, v_state_private, v_room_mode
  FROM public.games g
  JOIN public.rooms r ON r.id = g.room_id
  WHERE g.id = p_game_id;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = v_room_id AND uid = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT member_type INTO v_member_type
  FROM public.room_members
  WHERE room_id = v_room_id AND seat_no = p_seat_no;

  IF v_member_type IS NULL THEN
    RAISE EXCEPTION 'Seat % does not exist', p_seat_no;
  END IF;

  IF v_member_type != 'ai' AND NOT (v_room_mode = 'pve1v3' AND p_seat_no = 0) THEN
    RAISE EXCEPTION 'Seat % is not an AI member (mode: %, type: %)', p_seat_no, v_room_mode, v_member_type;
  END IF;

  -- 先尝试新结构：{"0": [...]}
  v_hand := v_state_private->(p_seat_no::text);

  -- 如果新结构没找到，尝试旧结构：{"hands": {"0": [...]}}
  IF v_hand IS NULL OR jsonb_typeof(v_hand) = 'null' THEN
    v_hand := v_state_private->'hands'->(p_seat_no::text);
  END IF;

  IF v_hand IS NULL OR jsonb_typeof(v_hand) = 'null' THEN
    v_hand := '[]'::jsonb;
  END IF;

  RETURN v_hand;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_hand TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_hand TO anon;
`;

    console.log('执行 get_ai_hand 修复（支持新旧两种结构）...');
    await client.query(sql);
    console.log('✅ 修复成功！get_ai_hand 现在同时支持新旧两种state_private结构');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
