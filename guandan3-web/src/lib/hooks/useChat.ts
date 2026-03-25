import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'emoji';
};

export const useChat = (roomId: string, userId: string, userName: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<any>(null);
  const connectAttemptRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!roomId) return;

    // 防止无限重试
    if (connectAttemptRef.current >= maxRetries) {
      console.warn('[useChat] Max connection retries reached for room:', roomId);
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
        console.warn('[useChat] Connection timeout for room:', roomId, '- cleaning up');
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
        console.log('[useChat] Channel status:', status, 'for room:', roomId);
        if (status === 'SUBSCRIBED') {
          subscribed = true;
          clearTimeout(timeoutId);
          connectAttemptRef.current = 0; // 重置计数器
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeoutId);
          console.warn('[useChat] Channel error:', status, 'for room:', roomId);
        }
      });

    channelRef.current = channel;

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

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
