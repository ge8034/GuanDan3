-- 添加 level_rank 列到 games 表
-- 2026-03-31

-- 检查列是否存在，如果不存在则添加
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS level_rank int DEFAULT 2;

-- 添加注释
COMMENT ON COLUMN public.games.level_rank IS '当前级牌点数，用于牌型验证';

-- 更新现有记录的默认值
UPDATE public.games
SET level_rank = 2
WHERE level_rank IS NULL;
