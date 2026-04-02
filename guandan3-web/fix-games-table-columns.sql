-- 修复games表缺失列的问题
-- 添加缺失的暂停相关列

-- 1. 添加 paused_by 列（玩家ID，谁暂停了游戏）
ALTER TABLE games
ADD COLUMN IF NOT EXISTS paused_by uuid;

-- 2. 添加 paused_at 列（暂停时间戳）
ALTER TABLE games
ADD COLUMN IF NOT EXISTS paused_at timestamptz;

-- 3. 添加 pause_reason 列（暂停原因）
ALTER TABLE games
ADD COLUMN IF NOT EXISTS pause_reason text;

-- 4. 添加注释
COMMENT ON COLUMN games.paused_by IS '暂停游戏的玩家ID';
COMMENT ON COLUMN games.paused_at IS '游戏暂停的时间';
COMMENT ON COLUMN games.pause_reason IS '暂停原因（如：玩家请求、超时等）';

-- 验证修复
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN ('paused_by', 'paused_at', 'pause_reason');

-- 返回成功消息
DO $$
BEGIN
  RAISE NOTICE '✅ games表列修复完成！';
  RAISE NOTICE '添加的列: paused_by, paused_at, pause_reason';
END $$;
