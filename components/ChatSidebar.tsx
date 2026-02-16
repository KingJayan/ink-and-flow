import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquare, RefreshCw, User, Bot } from 'lucide-react';
import { sendChatMessage, ChatMessage } from '../services/geminiService';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentContext: { title: string; content: string };
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, documentContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I\'m your writing partner. I have read your current draft. How can I help you refine or expand it?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg = input.trim();
    setInput('');
    setIsThinking(true);

    // Optimistic UI update
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);

    try {
      // Strip HTML tags from content for better token efficiency in context
      const originalLength = documentContext.content.length;
      // Regex strips tags, then replaces multiple spaces with single space
      const cleanContent = documentContext.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanLength = cleanContent.length;

      // Heuristic warning if stripping removed a massive amount of data (e.g., >30%)
      if (Math.abs(originalLength - cleanLength) > originalLength * 0.3 && originalLength > 100) {
        console.warn("ChatSidebar: Content significantly reduced after stripping HTML.", { original: originalLength, cleaned: cleanLength });
      }

      const response = await sendChatMessage(
        messages,
        userMsg,
        { title: documentContext.title, content: cleanContent }
      );

      if (response) {
        setMessages([...newHistory, { role: 'model', text: response }]);
      }
    } catch (err) {
      setMessages([...newHistory, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: 'Chat cleared. How can I help with this document?' }]);
  };

  return (
    <div
      className={`
        fixed inset-y-0 right-0 z-40 w-80 md:w-96 
        bg-paper dark:bg-[#1a1a22] 
        border-l border-wash-stone/50 dark:border-white/5 
        shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-wash-stone/20 dark:border-white/5 bg-paper/95 dark:bg-[#1a1a22]/95 backdrop-blur z-10">
        <div className="flex items-center gap-2 text-navy dark:text-blue-400">
          <Sparkles size={18} />
          <h2 className="font-serif font-bold text-lg">Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 text-ink-faint dark:text-white/30 hover:text-navy dark:hover:text-white hover:bg-wash-stone/10 dark:hover:bg-white/5 rounded-md transition-colors"
            title="Clear Chat"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-faint dark:text-white/30 hover:text-ink dark:hover:text-white hover:bg-wash-stone/10 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-navy text-white' : 'bg-sage text-white'}
            `}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={14} />}
            </div>

            <div className={`
              max-w-[85%] text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-wash-stone/10 dark:bg-white/5 text-ink dark:text-white/90 rounded-2xl rounded-tr-sm px-4 py-2 font-sans'
                : 'text-ink dark:text-white/80 font-serif'}
            `}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={14} />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-1.5 h-1.5 bg-ink-faint dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-ink-faint dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-ink-faint dark:bg-white/30 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-wash-stone/20 dark:border-white/5 bg-paper dark:bg-[#1a1a22]">
        <form
          onSubmit={handleSend}
          className="relative flex items-center bg-white dark:bg-white/5 border border-wash-stone/50 dark:border-white/10 rounded-xl focus-within:ring-1 focus-within:ring-sage focus-within:border-sage transition-all shadow-sm"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your document..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-white/25"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2 mr-1 text-navy dark:text-blue-400 hover:text-sage disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-[10px] text-ink-faint dark:text-white/20 text-center mt-2">
          AI uses the current document content as context.
        </div>
      </div>
    </div>
  );
};