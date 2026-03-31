-- ============================================================
-- 回滚脚本: 20260330000003_fix_start_game_initialize_private_hands.sql
-- 生成时间: 2026-03-31T04:07:03.853Z
-- ============================================================
-- 注意: 此脚本由自动工具生成，请在执行前仔细检查
-- ============================================================

-- 回滚: DROP FUNCTION start_game
DROP FUNCTION IF EXISTS start_game CASCADE;

-- 回滚: REVOKE EXECUTE ON FUNCTION public.start_game(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.start_game(uuid) FROM authenticated;

-- 回滚: REVOKE EXECUTE ON FUNCTION public.start_game(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_game(uuid) FROM anon;

-- ============================================================
-- 回滚脚本结束
-- ============================================================
