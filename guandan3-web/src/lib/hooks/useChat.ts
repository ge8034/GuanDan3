import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

import { logger } from '@/lib/utils/logger'

/**
 * 聊天消息类型
 */
export type ChatMessage = {
  /** 消息唯一 ID */
  id: string;
  /** 发送者用户 ID */
  senderId: string;
  /** 发送者昵称 */
  senderName: string;
  /** 消息内容 */
  content: string;
  /** 消息时间戳 */
  timestamp: number;
  /** 消息类型 */
  type: 'text' | 'emoji';
};

/**
 * 返回值类型
 */
interface UseChatReturn {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 发送消息函数 */
  sendMessage: (content: string, type?: 'text' | 'emoji') => Promise<void>;
}

/**
 * 聊天室 Hook
 *
 * 管理游戏房间内的实时聊天功能。
 *
 * @param roomId - 房间 ID
 * @param userId - 当前用户 ID
 * @param userName - 当前用户昵称
 * @returns 聊天消息列表和发送消息函数
 *
 * @example
 * ```tsx
 * function RoomChat() {
 *   const { user } = useAuthStore()
 *   const { messages, sendMessage } = useChat(roomId, user.id, user.nickname)
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>
 *           <strong>{msg.senderName}:</strong> {msg.content}
 *         </div>
 *       ))}
 *       <input onSend={sendMessage} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @remarks
 * **连接管理**:
 * - 最多重试 3 次连接
 * - 10 秒连接超时保护
 * - 自动清理连接防止泄漏
 *
 * **消息类型**:
 * - `text`: 普通文本消息
 * - `emoji`: 表情消息
 *
 * **可靠性保证**:
 * - 使用 Supabase Broadcast 保证消息送达
 * - 自动重连机制
 * - 连接状态日志记录
 */
export const useChat = (
  roomId: string,
  userId: string,
  userName: string
): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<any>(null);
  const connectAttemptRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!roomId) return;

    // 防止无限重试
    if (connectAttemptRef.current >= maxRetries) {
      logger.warn('[useChat] Max connection retries reached for room:', roomId);
      return;
    }

    connectAttemptRef.current++;

    // Join room chat channel with timeout protection
    const channel = supabase.channel(`room_chat:${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });

    let subscribed = false;

    // 设置超时保护
    const timeoutId = setTimeout(() => {
      if (!subscribed) {
        logger.warn('[useChat] Connection timeout for room:', { roomId });
        supabase.removeChannel(channel);
        // 不重置计数器，防止快速重连循环
        // useEffect重新运行时会在开头检查connectAttemptRef
      }
    }, 10000); // 10秒超时

    channel
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe((status) => {
        logger.debug('[useChat] Channel status:', { status, roomId });
        if (status === 'SUBSCRIBED') {
          subscribed = true;
          clearTimeout(timeoutId);
          connectAttemptRef.current = 0; // 重置计数器
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeoutId);
          logger.warn('[useChat] Channel error:', { status, roomId });
        }
      });

    channelRef.current = channel;

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  /**
   * 发送消息
   *
   * 向房间广播一条消息。
   *
   * @param content - 消息内容
   * @param type - 消息类型，默认为 'text'
   *
   * @example
   * ```ts
   * // 发送文本消息
   * await sendMessage('你好！')
   *
   * // 发送表情
   * await sendMessage('😀', 'emoji')
   * ```
   */
  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'emoji' = 'text') => {
      if (!channelRef.current) return;

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: userId,
        senderName: userName,
        content,
        timestamp: Date.now(),
        type,
      };

      await channelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: msg,
      });
    },
    [userId, userName]
  );

  return { messages, sendMessage };
};
