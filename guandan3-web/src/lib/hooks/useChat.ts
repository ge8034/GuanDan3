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

  useEffect(() => {
    if (!roomId) return;

    // Join room chat channel
    const channel = supabase.channel(`room_chat:${roomId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

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
