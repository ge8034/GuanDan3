# 练习模式游戏开始修复指南

## 问题描述
练习模式（pve1v3）下点击"开始游戏"失败，错误：`Room not found or not ready to start`

## 根本原因
`start_game` 函数对于匿名用户（`auth.uid()` 返回 NULL）的权限验证失败

## 修复步骤

### 方式 1: 通过 Supabase Dashboard（推荐）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目 (`rzzywltxlfgucngfiznx`)
3. 进入 **SQL Editor**
4. 复制并执行以下 SQL：

```sql
-- 删除旧版本函数
DROP FUNCTION IF EXISTS start_game(UUID) CASCADE;

CREATE OR REPLACE FUNCTION start_game(
  p_room_id UUID
)
RETURNS TABLE(game_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id UUID;
  v_seed BIGINT;
  v_suits TEXT[];
  v_ranks TEXT[];
  v_deck TEXT[];
  v_card_count INTEGER;
  v_state_private JSONB;
  v_state_public JSONB;
  v_i INTEGER;
  v_j INTEGER;
  v_temp TEXT;
  v_k INTEGER;
  v_s TEXT;
  v_r TEXT;
  v_room_owner_uid UUID;
  v_room_mode TEXT;
BEGIN
  -- 获取房间信息
  SELECT owner_uid, mode INTO v_room_owner_uid, v_room_mode
  FROM rooms
  WHERE id = p_room_id;

  -- 如果房间不存在，抛出错误
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- 1. 验证房间状态 - 对练习模式放宽限制
  IF v_room_mode = 'pve1v3' THEN
    -- 练习模式：只检查房间状态为 'open'，不检查所有者
    IF NOT EXISTS (
      SELECT 1 FROM rooms
      WHERE id = p_room_id
      AND status = 'open'
    ) THEN
      RAISE EXCEPTION 'Practice room not ready to start';
    END IF;
  ELSE
    -- PVP 模式：检查所有者权限
    IF NOT EXISTS (
      SELECT 1 FROM rooms
      WHERE id = p_room_id
      AND status = 'open'
      AND owner_uid = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Room not found or not ready to start';
    END IF;
  END IF;

  -- 2. 检查是否已有运行中的游戏
  IF EXISTS (
    SELECT 1 FROM games
    WHERE room_id = p_room_id
    AND status IN ('playing', 'finished')
  ) THEN
    RAISE EXCEPTION 'Game already exists';
  END IF;

  -- 3. 生成随机种子
  v_seed := (FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT) % 2147483647;

  -- 4. 初始化花色和点数数组
  v_suits := ARRAY['S', 'H', 'C', 'D'];
  v_ranks := ARRAY['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  -- 5. 生成牌组
  v_deck := ARRAY[]::TEXT[];

  -- 第一副牌
  v_i := 1;
  WHILE v_i <= 4 LOOP
    v_s := v_suits[v_i];
    v_j := 1;
    WHILE v_j <= 13 LOOP
      v_r := v_ranks[v_j];
      v_deck := array_append(v_deck, v_s || '-' || v_r);
      v_j := v_j + 1;
    END LOOP;
    v_i := v_i + 1;
  END LOOP;

  -- 第二副牌
  v_i := 1;
  WHILE v_i <= 4 LOOP
    v_s := v_suits[v_i];
    v_j := 1;
    WHILE v_j <= 13 LOOP
      v_r := v_ranks[v_j];
      v_deck := array_append(v_deck, v_s || '-' || v_r);
      v_j := v_j + 1;
    END LOOP;
    v_i := v_i + 1;
  END LOOP;

  -- 添加4张大小王
  v_deck := array_append(v_deck, 'J-SJ');
  v_deck := array_append(v_deck, 'J-BJ');
  v_deck := array_append(v_deck, 'J-SJ');
  v_deck := array_append(v_deck, 'J-BJ');

  -- 6. Fisher-Yates洗牌
  v_card_count := array_length(v_deck, 1);
  v_i := v_card_count;
  WHILE v_i > 1 LOOP
    v_k := (((v_seed * v_i) % v_card_count) + 1)::INTEGER;
    v_seed := ((v_seed * 1103515245 + 12345) % 2147483647)::BIGINT;
    v_temp := v_deck[v_i];
    v_deck[v_i] := v_deck[v_k];
    v_deck[v_k] := v_temp;
    v_i := v_i - 1;
  END LOOP;

  -- 7. 创建游戏状态
  v_state_public := '{"counts":[27,27,27,27],"rankings":[]}'::JSONB;

  -- 8. 构建手牌数据
  v_state_private := (
    SELECT jsonb_build_object(
      'hands', jsonb_build_object(
        '0', (SELECT jsonb_agg(jsonb_build_object('id', idx, 'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1), 'rank', CASE WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ' WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ' ELSE SUBSTRING(v_deck[idx + 1] FROM 3) END, 'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3) WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10 WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13 WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16 ELSE 0 END)) FROM generate_series(0, 26) AS idx),
        '1', (SELECT jsonb_agg(jsonb_build_object('id', idx, 'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1), 'rank', CASE WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ' WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ' ELSE SUBSTRING(v_deck[idx + 1] FROM 3) END, 'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3) WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10 WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13 WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16 ELSE 0 END)) FROM generate_series(27, 53) AS idx),
        '2', (SELECT jsonb_agg(jsonb_build_object('id', idx, 'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1), 'rank', CASE WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ' WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ' ELSE SUBSTRING(v_deck[idx + 1] FROM 3) END, 'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3) WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10 WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13 WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16 ELSE 0 END)) FROM generate_series(54, 80) AS idx),
        '3', (SELECT jsonb_agg(jsonb_build_object('id', idx, 'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1), 'rank', CASE WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ' WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ' ELSE SUBSTRING(v_deck[idx + 1] FROM 3) END, 'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3) WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10 WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13 WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16 ELSE 0 END)) FROM generate_series(81, 107) AS idx)
      )
    )
  );

  -- 9. 插入游戏记录
  INSERT INTO games (id, room_id, seed, status, turn_no, current_seat, state_public, state_private, created_at)
  VALUES (gen_random_uuid(), p_room_id, v_seed, 'playing', 0, 0, v_state_public, v_state_private, NOW())
  RETURNING id INTO v_game_id;

  -- 10. 更新房间状态
  UPDATE rooms SET status = 'playing' WHERE id = p_room_id;

  RETURN QUERY SELECT v_game_id;
END;
$$;

GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO anon;
```

5. 执行成功后，点击 **Run** 按钮运行

### 方式 2: 使用 Supabase CLI

```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref rzzywltxlfgucngfiznx

# 应用迁移
supabase db push
```

## 验证修复

执行 SQL 后，运行测试验证：

```bash
cd D:\Learn-Claude\GuanDan3\guandan3-web
node test-complete-game.mjs
```

预期结果：
- ✓ 练习房间创建成功
- ✓ 游戏自动开始（无 P0001 错误）
- ✓ AI 玩家自动出牌
- ✓ 游戏进行到结束
- ✓ 出现 1/2/3/4 排名
