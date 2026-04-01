import { supabase } from '@/lib/supabase/client';
import { devError, devLog, devWarn, isDev } from '@/lib/utils/devLog';
import type { GameState, Card } from '../types';

/**
 * 出牌动作（兼容旧版本）
 */
export async function playTurn(this: GameState, cards: Card[]): Promise<void> {
  await this.submitTurn('play', cards);
}

/**
 * 提交回合（出牌或不出）
 */
export async function submitTurn(
  this: GameState,
  type: 'play' | 'pass',
  cards: Card[] = []
): Promise<{
  error?: unknown;
  data?: unknown;
  refreshed?: boolean;
  newState?: unknown;
}> {
  const state = this;
  if (!state.gameId) return { error: 'No game ID' };

  // 保存之前状态用于回滚
  const previousHand = state.myHand;

  // 乐观更新（仅针对出牌动作）
  const shouldOptimisticUpdate =
    type === 'play' &&
    cards.length > 0 &&
    state.myHand.length > 0 &&
    // 验证：所有要出的牌都必须在手牌中
    cards.every((pc) => state.myHand.some((c) => c.id === pc.id));

  if (shouldOptimisticUpdate) {
    state.updateHand(
      state.myHand.filter((c) => !cards.some((pc) => pc.id === c.id))
    );
  }

  const { data, error } = await supabase.rpc('submit_turn', {
    p_game_id: state.gameId,
    p_action_id: crypto.randomUUID(),
    p_expected_turn_no: state.turnNo,
    p_payload: { type, cards },
  });

  if (error) {
    // 回滚乐观更新
    if (shouldOptimisticUpdate) {
      state.updateHand(previousHand);
    }

    const isTurnNoMismatch =
      error.code === 'P0001' && error.message.includes('turn_no_mismatch');
    const isNotYourTurn =
      error.code === 'P0001' && error.message.includes('not_your_turn');
    const isCardNotFound =
      error.code === 'P0001' && error.message.includes('Card not found in hand');

    // 错误日志处理
    // Card not found 是竞态条件导致的预期错误（Realtime 更新刷新手牌）
    if (!isTurnNoMismatch && !isNotYourTurn && !isCardNotFound) {
      // 未知错误：生产环境记录简要日志，开发环境记录详细日志
      if (isDev()) {
        devError(
          'Submit turn failed detailed:',
          JSON.stringify(error, null, 2)
        );
      } else {
        console.error('Submit turn failed:', error.message || String(error));
      }
    }

    // 处理回合号不匹配错误
    if (isTurnNoMismatch) {
      devWarn('Turn mismatch detected! Fetching fresh game state...');
      const { data: freshGame } = await supabase
        .from('games')
        .select('id,room_id,status,turn_no,current_seat,state_public')
        .eq('id', state.gameId)
        .single();

      if (freshGame) {
        if (isDev())
          devLog('State refreshed:', freshGame.turn_no, freshGame.current_seat);
        state.setGame({
          turnNo: freshGame.turn_no,
          currentSeat: freshGame.current_seat,
          status: freshGame.status,
        });
        return { error, refreshed: true, newState: freshGame };
      }
    }

    // 处理卡牌未找到错误（竞态条件：手牌在 Realtime 更新中刷新）
    if (isCardNotFound) {
      devWarn('Card not found (hand refreshed). Fetching fresh state...');
      const { data: freshGame } = await supabase
        .from('games')
        .select('id,room_id,status,turn_no,current_seat,state_public,state_private')
        .eq('id', state.gameId)
        .single();

      if (freshGame) {
        if (isDev())
          devLog('State refreshed after card not found');
        state.setGame({
          turnNo: freshGame.turn_no,
          currentSeat: freshGame.current_seat,
          status: freshGame.status,
        });
        return { error, refreshed: true, newState: freshGame };
      }
    }

    return { error };
  } else {
    // 成功：更新本地状态
    if (data && data.length > 0) {
      const result = data[0] as {
        turn_no: number;
        current_seat: number;
        status: string;
        rankings?: number[] | { [key: string]: number } | null;
      };

      // 处理 rankings 类型（可能是数组或 jsonb 对象）
      let rankingsArray: number[] = [];
      if (result.rankings) {
        if (Array.isArray(result.rankings)) {
          rankingsArray = result.rankings;
        } else if (typeof result.rankings === 'object') {
          // jsonb 对象，转换为数组
          rankingsArray = Object.values(result.rankings).filter((v): v is number => typeof v === 'number');
        }
      }

      state.setGame({
        turnNo: result.turn_no,
        currentSeat: result.current_seat,
        status: result.status as 'deal' | 'playing' | 'paused' | 'finished',
        rankings: rankingsArray.length > 0 ? rankingsArray : state.rankings,
      });
    }
    return { data };
  }
}
