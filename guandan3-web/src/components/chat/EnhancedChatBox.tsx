import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat, ChatMessage } from '@/lib/hooks/useChat';
import RippleEffect from '@/components/effects/RippleEffect';
import { EMOJI_CATEGORIES, QUICK_PHRASES, EMOJI_CATEGORY_NAMES } from '@/lib/constants/chatConstants';
import { useDebouncedValue, usePrefersReducedMotion } from '@/lib/performance/optimization';

interface EnhancedChatBoxProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const EnhancedChatBox = ({ roomId, userId, userName }: EnhancedChatBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('basic');
  const { messages, sendMessage } = useChat(roomId, userId, userName);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const debouncedInputValue = useDebouncedValue(inputValue, 300);

  const visibleMessages = useMemo(() => {
    return messages.slice(-50);
  }, [messages]);

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
    setShowEmojiPanel(false);
  };

  const handleQuickPhrase = async (phrase: string) => {
    await sendMessage(phrase, 'text');
    setShowQuickPhrases(false);
  };

  const handleQuickPhraseClick = (phrase: string) => {
    setInputValue(phrase);
    setShowQuickPhrases(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-96 h-[500px] bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
              <span className="text-white font-bold text-sm">💬 聊天室</span>
              <div className="flex gap-2">
                <RippleEffect className="relative inline-block">
                  <button
                    onClick={() => setShowQuickPhrases(!showQuickPhrases)}
                    className="text-white/70 hover:text-white transition-colors text-xs px-2 py-1 rounded bg-white/10"
                  >
                    快捷语
                  </button>
                </RippleEffect>
                <RippleEffect className="relative inline-block">
                  <button
                    onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                    className="text-white/70 hover:text-white transition-colors text-xs px-2 py-1 rounded bg-white/10"
                  >
                    表情
                  </button>
                </RippleEffect>
                <RippleEffect className="relative inline-block">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </RippleEffect>
              </div>
            </div>

            {/* Quick Phrases Panel */}
            <AnimatePresence>
              {showQuickPhrases && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/10 bg-white/5"
                >
                  <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_PHRASES.slice(0, 20).map((phrase, index) => (
                        <RippleEffect key={index} className="relative inline-block">
                          <button
                            onClick={() => handleQuickPhraseClick(phrase)}
                            className="w-full text-left text-xs text-white/80 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded transition-colors truncate"
                          >
                            {phrase}
                          </button>
                        </RippleEffect>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji Panel */}
            <AnimatePresence>
              {showEmojiPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/10 bg-white/5"
                >
                  {/* Category Tabs */}
                  <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
                    {Object.keys(EMOJI_CATEGORIES).map((category) => (
                      <RippleEffect key={category} className="relative inline-block flex-shrink-0">
                        <button
                          onClick={() => setActiveEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                          className={`text-xs px-3 py-1.5 rounded transition-colors ${
                            activeEmojiCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {EMOJI_CATEGORY_NAMES[category as keyof typeof EMOJI_CATEGORY_NAMES]}
                        </button>
                      </RippleEffect>
                    ))}
                  </div>

                  {/* Emoji Grid */}
                  <div className="p-3 max-h-32 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-5 gap-2">
                      {EMOJI_CATEGORIES[activeEmojiCategory].map((emoji, index) => (
                        <RippleEffect key={index} className="relative inline-block">
                          <button
                            onClick={() => handleEmoji(emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        </RippleEffect>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {visibleMessages.length === 0 ? (
                <div className="text-center text-white/30 text-xs mt-10">
                  暂无消息，打个招呼吧！
                </div>
              ) : (
                visibleMessages.map((msg) => {
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
          onClick={() => setIsOpen(!isOpen)}
          data-testid="chat-toggle"
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-blue-500 transition-colors border-2 border-white/20 transform active:scale-95 hover:scale-105 transition-transform"
        >
          {isOpen ? '✕' : '💬'}
        </button>
      </RippleEffect>
    </div>
  );
};
