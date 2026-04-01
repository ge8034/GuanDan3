# 数据库迁移应用指南

## 概述

需要将 `supabase/migrations/20260401000001_fix_last_payload_validation.sql` 应用到生产数据库以修复AI 400错误问题。

## 修复内容

**问题**：当其他玩家过牌时，数据库验证函数使用 `turn_no - 1` 获取上家出牌，可能获取到 `pass` 而不是实际出牌，导致AI出牌验证失败产生400错误。

**修复**：修改SQL查询，排除 `pass` 类型的出牌，找到最近一个实际出牌的回合。

## 应用方法

### 方法1：Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目
3. 进入 SQL Editor
4. 复制并执行以下SQL：

```sql
-- 修复 submit_turn 中的 last_payload 获取逻辑
-- 问题：当其他玩家过牌时，validate_guandan_move 应该找到最近一个实际出牌的回合
--       而不是简单地使用 turn_no - 1
-- 2026-04-01

create or replace function public.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb)
returns table(turn_no int, current_seat int, status text, rankings int[])
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_current_seat int;
  v_turn_no int;
  v_my_seat int;
  v_actor_seat int;
  v_is_ai boolean;
  v_member_type text;
  v_member_uid uuid;
  v_is_member boolean;
  v_action_type text;
  v_played_cards jsonb;
  v_level_rank int;
  v_state_private jsonb;
  v_state_public jsonb;
  v_hands jsonb;
  v_my_hand jsonb;
  v_new_hand jsonb;
  v_card_id int;
  v_card_to_remove jsonb;
  v_card_idx int;
  v_found boolean;
  v_counts int[];
  v_rankings int[];
  v_game_status text;
  v_last_payload jsonb;
begin
  -- 1. 锁定游戏行并获取状态
  select g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status, g.level_rank
    into v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status, v_level_rank
    from public.games g
    where g.id = p_game_id
    for update of g;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. 验证回合号
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. 识别执行者并检查成员资格
  select
    member_type,
    uid,
    seat_no
  into
    v_member_type,
    v_member_uid,
    v_actor_seat
  from public.room_members
  where room_id = v_room_id and seat_no = v_current_seat;

  if v_actor_seat is null then
    raise exception 'Current seat % is empty!', v_current_seat;
  end if;

  -- 4. 判断是否为 AI
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. 授权检查
  if v_is_ai then
    select exists(
      select 1 from public.room_members
      where room_id = v_room_id and uid = auth.uid()
    ) into v_is_member;

    if not v_is_member then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'not_your_turn: You are Seat %, Current is Seat %',
        v_my_seat, v_current_seat;
    end if;
  end if;

  -- 6. 解析动作payload
  v_action_type := p_payload->>'type';
  v_played_cards := p_payload->'cards';

  -- 6.5 验证牌型（修复：找到最近一个实际出牌的回合，而不是 turn_no - 1）
  if v_action_type = 'play' and jsonb_array_length(v_played_cards) > 0 then
    -- 修复：查找最近一个非 pass 的出牌回合
    -- 如果当前是第一轮（turn_no = 0），则没有上家出牌
    if v_turn_no > 0 then
      select t.payload
        into v_last_payload
        from public.turns t
        where t.game_id = p_game_id
          and t.turn_no < v_turn_no
          and (t.payload->>'type') <> 'pass'  -- 关键修复：排除过牌
        order by t.turn_no desc, t.id desc
        limit 1;
    end if;

    if not public.validate_guandan_move(p_payload, v_last_payload, v_level_rank) then
      raise exception 'invalid_move: 无效牌型或不满足掼蛋规则';
    end if;
  end if;

  -- 7. 执行出牌
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
    values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 8. 更新手牌
  if v_action_type = 'play' and jsonb_array_length(v_played_cards) > 0 then
    v_hands := v_state_private->'hands';
    v_my_hand := v_hands->(v_current_seat::text);
    v_new_hand := v_my_hand;

    for v_card_to_remove in select * from jsonb_array_elements(v_played_cards) loop
      v_card_id := (v_card_to_remove->>'id')::int;
      v_found := false;

      for v_card_idx in 0..jsonb_array_length(v_new_hand)-1 loop
        if (v_new_hand->v_card_idx->>'id')::int = v_card_id then
          v_new_hand := v_new_hand - v_card_idx;
          v_found := true;
          exit;
        end if;
      end loop;

      if not v_found then
        raise exception 'Card not found in hand: card_id=%', v_card_id;
      end if;
    end loop;

    v_state_private := jsonb_set(
      v_state_private,
      array['hands', v_current_seat::text],
      v_new_hand
    );

    v_counts := coalesce((v_state_public->'counts')::jsonb, jsonb_build_array(27,27,27,27))::int[];
    v_counts[v_current_seat + 1] := jsonb_array_length(v_new_hand);
    v_state_public := jsonb_set(
      coalesce(v_state_public, '{}'::jsonb),
      array['counts'],
      to_jsonb(v_counts)
    );

    if jsonb_array_length(v_new_hand) = 0 then
      v_rankings := coalesce((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];
      v_rankings := array_append(v_rankings, v_current_seat);
      v_state_public := jsonb_set(
        v_state_public,
        array['rankings'],
        to_jsonb(v_rankings)
      );

      if array_length(v_rankings, 1) >= 3 then
        v_game_status := 'finished';
      end if;
    end if;
  end if;

  -- 9. 更新游戏状态
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        state_private = v_state_private,
        state_public = v_state_public,
        status = v_game_status,
        updated_at = now()
  where id = p_game_id;

  -- 10. 返回结果
  v_rankings := coalesce((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];
  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4, v_game_status, v_rankings;
end;
$$;

COMMENT ON FUNCTION public.submit_turn IS '提交出牌（修复版）：正确处理过牌后的last_payload获取';
```

### 方法2：使用 psql 命令行

```bash
psql -h <your-db-host>.supabase.co -U postgres -d postgres -f supabase/migrations/20260401000001_fix_last_payload_validation.sql
```

### 方法3：使用迁移脚本（如果配置了）

```bash
npm run migrate:apply
```

## 验证

应用迁移后，验证函数是否正确更新：

```sql
-- 查看函数定义
SELECT prosrc FROM pg_proc WHERE proname = 'submit_turn';

-- 或者
\df+ public.submit_turn
```

检查关键行是否包含：
```sql
and (t.payload->>'type') <> 'pass'
```

## 回滚（如果需要）

如果需要回滚到旧版本，使用 `supabase/migrations/20260331000002_add_validation_to_submit_turn.sql` 中的旧版本重新创建函数。

## 影响范围

- ✅ 修复过牌序列后AI无法出牌的问题
- ✅ 修复400 Bad Request错误
- ✅ 不影响正常的出牌流程
- ✅ 向后兼容所有现有游戏数据

## 部署检查清单

- [ ] 在测试环境应用迁移
- [ ] 运行E2E测试验证
- [ ] 检查400错误率下降
- [ ] 应用到生产环境
- [ ] 监控生产环境错误率

---

**创建日期**：2026-04-01
**相关文件**：
- `supabase/migrations/20260401000001_fix_last_payload_validation.sql`
- `supabase/migrations/20260331000002_add_validation_to_submit_turn.sql` (原版本)
