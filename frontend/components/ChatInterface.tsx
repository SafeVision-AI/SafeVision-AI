'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { sendChatMessage, ChatMessage as ApiChatMessage } from '@/lib/api';
import { useGeolocation } from '@/lib/geolocation';
import { ConnectivityBadge } from './ConnectivityBadge';
import { Send, Wifi, WifiOff, Loader2, Bot, UserCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export function ChatInterface() {
  const {
    aiMode,
    connectivity,
    setAiMode
  } = useAppStore();
  const { location } = useGeolocation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: 'Hello! I am your SafeVisionAI assistant. How can I help you today? You can ask me about traffic rules, emergency procedures, or first-aid instructions.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (aiMode === 'online') {
        const response = await sendChatMessage({
          message: userMsg.content,
          session_id: 'default-session',
          lat: location?.lat,
          lon: location?.lon,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.response,
            sources: response.sources,
          },
        ]);
      } else {
        // Offline mode simulation
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: '[OFFLINE] First aid for burns: 1. Cool the burn under running water for 20 minutes. 2. Remove clothing/jewelry near the burn. 3. Cover with a sterile dressing. Do NOT apply ice or ointments.',
            },
          ]);
          setIsLoading(false);
        }, 1000);
        return;
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered a communication error. Please check your connection or switch to Offline Mode.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#071325]">
      {/* HEADER / MODE TOGGLE */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bot size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">SafeVisionAI Chat</span>
        </div>

        {/* Toggle between Online and Offline Mode */}
        <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-full p-0.5 border border-slate-200 dark:border-white/10">
          <button
            onClick={() => setAiMode('online')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              aiMode === 'online'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wifi size={12} />
            Online
          </button>
          <button
            onClick={() => setAiMode('offline')}
            disabled={connectivity === 'offline'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              aiMode === 'offline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <WifiOff size={12} />
            Offline
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in-up`}
            >
              <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[85%]`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {isUser ? <UserCircle size={14} /> : <Bot size={14} />}
                </div>

                <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md'
                    : 'bg-white dark:bg-white/5 text-slate-800 dark:text-[#d7e3fc] rounded-2xl rounded-tl-sm border border-slate-200 dark:border-white/10 shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 self-start">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Bot size={14} className="text-emerald-500" />
            </div>
            <div className="px-4 py-3 bg-white dark:bg-white/5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-white/10 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="px-4 py-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl border-t border-slate-200 dark:border-white/5">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about traffic rules or first aid..."
            disabled={isLoading || aiMode === 'loading'}
            aria-label="Chat message input"
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-[#d7e3fc] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || aiMode === 'loading'}
            aria-label="Send message"
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
              !input.trim() || isLoading
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            {aiMode === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
