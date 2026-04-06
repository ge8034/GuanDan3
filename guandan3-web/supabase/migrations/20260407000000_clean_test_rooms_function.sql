-- RPC函数：清理测试房间数据
CREATE OR REPLACE FUNCTION clean_test_rooms()
RETURNS TABLE(
  rooms_deleted BIGINT,
  games_finished BIGINT,
  games_reset BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rooms_deleted BIGINT;
  v_games_finished BIGINT;
  v_games_reset BIGINT;
BEGIN
  -- 完成进行中的测试游戏
  UPDATE games 
  SET status = 'finished',
    finished_at = NOW()
  WHERE room_id IN (
    SELECT id FROM rooms 
    WHERE room_type = 'practice'
  )
  AND status = 'playing';
  
  GET DIAGNOSTICS v_games_finished = ROW_COUNT;
  
  -- 删除测试房间
  DELETE FROM rooms
  WHERE room_type = 'practice'
  AND id NOT IN (
    SELECT DISTINCT room_id FROM games 
    WHERE status = 'playing'
  );
  
  GET DIAGNOSTICS v_rooms_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT v_rooms_deleted, v_games_finished, 0::BIGINT;
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION clean_test_rooms() TO anon;
GRANT EXECUTE ON FUNCTION clean_test_rooms() TO authenticated;
