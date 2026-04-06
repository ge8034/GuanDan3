-- 清理测试房间的游戏数据
-- 用于E2E测试前清理环境

-- 删除测试房间的进行中游戏
DELETE FROM games
WHERE room_id IN (
  SELECT id FROM rooms 
  WHERE room_type = 'practice' 
  OR name LIKE '%测试%'
  OR name LIKE '%test%'
)
AND status != 'finished';

-- 删除没有关联游戏的测试房间
DELETE FROM rooms
WHERE room_type = 'practice'
AND id NOT IN (SELECT DISTINCT room_id FROM games WHERE status = 'playing');

-- 重置测试房间的回合数
UPDATE games SET 
  current_turn = 0,
  current_seat = 0
WHERE room_id IN (
  SELECT id FROM rooms 
  WHERE room_type = 'practice'
)
AND status = 'playing';
