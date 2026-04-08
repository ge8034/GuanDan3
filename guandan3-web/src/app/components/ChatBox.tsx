import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat, ChatMessage } from '@/lib/hooks/useChat';
import RippleEffect from '@/components/effects/RippleEffect';
import { X, MessageCircle } from 'lucide-react';

import { logger } from '@/lib/utils/logger'
interface ChatBoxProps {
  roomId: string;
  userId: string;
  userName: string;
}

const EMOJIS = ['😊', '😂', '🤔', '👍', '👎', '🎉', '😡', '😭', '🤝', '⚡'];

export const ChatBox = ({ roomId, userId, userName }: ChatBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage } = useChat(roomId, userId, userName);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    await sendMessage(inputValue, 'text');
    setInputValue('');
  };

  const handleEmoji = async (emoji: string) => {
    await sendMessage(emoji, 'emoji');
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-80 h-96 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
              <span className="text-white font-bold text-sm">💬 聊天室</span>
              <RippleEffect className="relative inline-block">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </RippleEffect>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-white/30 text-xs mt-10">
                  暂无消息，打个招呼吧！
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-white/40 mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div 
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm break-words ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white/10 text-white/90 rounded-bl-none'
                        }`}
                      >
                        {msg.type === 'emoji' ? (
                          <span className="text-2xl">{msg.content}</span>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-white/5 space-y-2">
              {/* Emoji Bar */}
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {EMOJIS.map(emoji => (
                  <RippleEffect key={emoji} className="relative inline-block">
                    <button
                      onClick={() => handleEmoji(emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  </RippleEffect>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="发送消息..."
                  data-testid="chat-input"
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
                <RippleEffect className="relative inline-block">
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    data-testid="chat-send"
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                  >
                    发送
                  </button>
                </RippleEffect>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RippleEffect className="relative inline-block">
        <button
          onClick={() => {
              logger.debug('Chat toggle clicked, isOpen:', { isOpen });
              setIsOpen(!isOpen);
          }}
          data-testid="chat-toggle"
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-blue-500 transition-opacity duration-200 border-2 border-white/20 active:opacity-100 hover:opacity-90"
        >
          {isOpen ? <X className="w-6 h-6" strokeWidth={2.5} /> : <MessageCircle className="w-6 h-6" strokeWidth={2} />}
        </button>
      </RippleEffect>
    </div>
  );
};
