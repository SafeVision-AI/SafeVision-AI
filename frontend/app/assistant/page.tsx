'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ShieldCheck, BookOpen, Copy,
  HelpCircle, Mic, Paperclip, Send, ThumbsUp, ThumbsDown, RotateCcw,
  Search, Menu
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TopSearch from '@/components/dashboard/TopSearch';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import SystemHeader from '@/components/dashboard/SystemHeader';
import PureMultimodalInput, { Attachment } from '@/components/chat/multimodal-ai-chat-input';
import { useGeolocation } from '@/lib/geolocation';
import { logClientError } from '@/lib/client-logger';
import { PUBLIC_CHATBOT_BASE_URL } from '@/lib/public-env';

const CHATBOT_URL = PUBLIC_CHATBOT_BASE_URL;

async function* streamChat(
  message: string,
  session_id: string,
  lat?: number,
  lon?: number,
): AsyncGenerator<{ type: string; text?: string; intent?: string; sources?: string[]; session_id?: string; message?: string }> {
  const resp = await fetch(`${CHATBOT_URL}/api/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id, lat, lon }),
  });
  if (!resp.ok || !resp.body) throw new Error(`Chat error: ${resp.status}`);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try { yield JSON.parse(line.slice(6)); } catch { /* skip */ }
      }
    }
  }
}
interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  citations?: string[];
  suggestedQueries?: string[];
}

import TypingText from '@/components/dashboard/TypingText';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'sys-1',
    role: 'system',
    text: 'Session encrypted with SafeVixAI Protocol v2.4',
    timestamp: '',
  }
];

const MOCK_RESPONSES: Record<string, Message> = {
  dui: {
    id: 'mock-dui',
    role: 'ai',
    text: 'Under current regulations, first-time offenders face imprisonment up to 6 months and/or a fine up to ₹10,000 for Drunk Driving (BAC > 30mg/100ml). Subsequent offenses within 3 years increase the penalty significantly.',
    timestamp: '',
    citations: ['MV Act §185', 'Fine: ₹10,000', 'Custody: Max 6 Mo.'],
    suggestedQueries: ['What if the breathalyzer test was faulty?', 'Bail procedure details']
  },
  default: {
    id: 'mock-default',
    role: 'ai',
    text: 'Under the Motor Vehicles Act 1988, the general penalty for traffic violations not covered under specific sections is ₹500 for the first offense and ₹1,500 for repeat violations.',
    timestamp: '',
    citations: ['MV Act §177', 'Gen. Penalty: ₹500']
  }
};

const SUGGESTED_STARTERS = [
  "🚨 Help! I've been in an accident, what do I do?",
  "🚑 Send an ambulance to my current location",
  "Explain the hit-and-run legal procedure",
  "What are my rights during a police inspection?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const setSystemSidebarOpen = useAppStore((state) => state.setSystemSidebarOpen);
  const { location } = useGeolocation();
  const [sessionId] = useState(() => `assistant-${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const welcomeAdded = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-mount
    if (welcomeAdded.current) return;
    welcomeAdded.current = true;
    document.title = 'AI Assistant | SafeVixAI';
    const welcomeMsg: Message = {
      id: 'ai-1',
      role: 'ai',
      text: 'SafeVixAI assistant online. I can answer questions about the Motor Vehicles Act, traffic penalties, your rights during a police stop, and road safety laws across India. What do you need?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, welcomeMsg]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Streaming assistant placeholder
    const assistantId = `ai-${Date.now() + 1}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'ai', text: '', timestamp: time }]);

    try {
      let accumulated = '';
      for await (const event of streamChat(text, sessionId, location?.lat, location?.lon)) {
        if (event.type === 'token' && event.text) {
          accumulated += event.text;
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, text: accumulated } : m)
          );
        } else if (event.type === 'done') {
          const sources = event.sources ?? [];
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, text: accumulated || 'No response received.', citations: sources }
                : m
            )
          );
        } else if (event.type === 'error') {
          throw new Error(event.message ?? 'Stream error');
        }
      }
    } catch (err) {
      logClientError('Chat error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: 'Connection error. Please check your network or try again.' }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, location]);

  return (
    <div className="flex flex-col h-[100dvh] w-full relative overflow-hidden bg-slate-50/50 dark:bg-[#0A0E14]">
      {/* ── Background Decorative Lines (SafeVixAI Pro Aesthetic) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#1A5C38]/5 dark:bg-[#1A5C38]/10 blur-[120px] hidden dark:block" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] hidden dark:block" />
      </div>

      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="AI Assistant HUD" showBack={false} />

      <div className="lg:hidden relative z-40">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />
      <BottomNav />

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-lg text-sm font-medium"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Canvas ── */}
      <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 overflow-x-hidden pt-28 lg:pt-24 pb-48 lg:pb-36 flex flex-col max-w-4xl mx-auto w-full relative z-10 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 flex flex-col w-full pb-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="self-center mt-2"
                  >
                    <div className="bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-md">
                      <span className="text-[#1A5C38] dark:text-[#00C896] text-[10px] uppercase tracking-[0.1em] font-black font-space">
                        {msg.text}
                      </span>
                    </div>
                  </motion.div>
                );
              }

              if (msg.role === 'user') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="self-end max-w-[85%] sm:max-w-[75%]"
                  >
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-gradient-to-br from-[#1A5C38] to-[#145230] dark:from-[#1A5C38]/80 dark:to-[#0f3d28]/80 rounded-t-2xl rounded-bl-2xl px-5 py-3.5 shadow-lg shadow-[#1A5C38]/20 border border-[#1A5C38]/30">
                        <p className="text-white text-[15px] leading-relaxed font-medium">{msg.text}</p>
                      </div>
                      <time dateTime={msg.timestamp} suppressHydrationWarning className="text-[10px] text-slate-400 dark:text-slate-500 mr-2 font-medium tracking-wide shadow-sm">{msg.timestamp} • SafeVixAI</time>
                    </div>
                  </motion.div>
                );
              }

              if (msg.role === 'ai') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="self-start max-w-[90%] sm:max-w-[85%]"
                  >
                    <div className="flex flex-col items-start gap-2 w-full">
                      <div className="bg-white/90 dark:bg-[#1a2133]/60 backdrop-blur-xl rounded-lg rounded-tl-sm p-5 sm:p-6 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-[#1A5C38]/20 text-emerald-600 dark:text-[#00C896]">
                            <ShieldCheck size={16} />
                          </div>
                          <span className="text-emerald-600 dark:text-[#00C896] text-[11px] font-semibold uppercase tracking-[0.15em] font-space">SafeVixAI</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 text-[15px] leading-relaxed font-medium">
                          <TypingText text={msg.text} />
                        </p>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {msg.citations.map((cite, i) => (
                              <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${i === 0 ? 'bg-[#1A5C38]/8 dark:bg-[#1A5C38]/10 border border-[#1A5C38]/20 dark:border-[#1A5C38]/20 text-[#1A5C38] dark:text-[#00C896]' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}>
                                {i === 0 && <BookOpen size={12} />}
                                <span className={`text-[11px] font-semibold tracking-wide ${!i && 'uppercase'}`}>{cite}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 ml-2 mb-1">
                        <time dateTime={msg.timestamp} suppressHydrationWarning className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">{msg.timestamp} • SafeVixAI</time>
                        <div className="flex gap-1.5 ml-1">
                          <button 
                            onClick={() => setToastMessage("Copied to clipboard!")}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Copy size={13} strokeWidth={2} />
                          </button>
                          <button 
                            onClick={() => setToastMessage("Feedback recorded")}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <ThumbsUp size={13} strokeWidth={2} />
                          </button>
                          <button 
                            onClick={() => setToastMessage("Feedback recorded")}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <ThumbsDown size={13} strokeWidth={2} />
                          </button>
                          <button 
                            onClick={() => setToastMessage("Retrying...")}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
                          >
                            <RotateCcw size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {msg.suggestedQueries && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 w-full">
                          {msg.suggestedQueries.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(q)}
                              className="group bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition-all duration-200 p-4 rounded-xl flex items-start gap-3 text-left border border-slate-200/60 dark:border-white/5 hover:border-[#1A5C38]/30 dark:hover:border-[#1A5C38]/30 hover:shadow-sm"
                            >
                              <div className="mt-0.5 p-1 rounded bg-[#1A5C38]/8 dark:bg-[#1A5C38]/10 text-[#1A5C38] dark:text-[#00C896] group-hover:scale-110 transition-transform">
                                <HelpCircle size={14} />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300 text-[13px] font-medium leading-snug">{q}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }
            })}

            {((messages.length <= 2) || showSuggestions) && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="self-start w-full mt-2"
              >
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold px-2 uppercase tracking-widest">Suggested Inquiries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_STARTERS.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(text)}
                      className="group bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition-all duration-200 px-4 py-3 rounded-xl text-left border border-slate-200/60 dark:border-white/5 hover:border-[#1A5C38]/30 dark:hover:border-[#1A5C38]/30 hover:shadow-sm flex items-start gap-3"
                    >
                      <div className="mt-0.5 p-1 rounded bg-[#1A5C38]/8 dark:bg-[#1A5C38]/10 text-[#1A5C38] dark:text-[#00C896] group-hover:scale-110 transition-transform flex-shrink-0">
                        <HelpCircle size={14} />
                      </div>
                      <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
                {messages.length > 2 && (
                  <button 
                    onClick={() => setShowSuggestions(false)}
                    className="mt-4 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 transition-colors mx-auto block"
                  >
                    Hide Suggestions
                  </button>
                )}
              </motion.div>
            )}

            {messages.length > 2 && !showSuggestions && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-center">
                <button 
                  onClick={() => setShowSuggestions(true)}
                  className="px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
                >
                  Show Suggested Inquiries
                </button>
              </motion.div>
            )}

            {/* Skeleton Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="self-start max-w-[90%] sm:max-w-[85%]"
              >
                <div className="bg-white/80 dark:bg-[#111520]/60 backdrop-blur-xl rounded-lg rounded-tl-sm px-6 py-5 shadow-sm border border-slate-200/60 dark:border-white/5 flex gap-1.5 items-center w-fit">
                  <span className="w-2.5 h-2.5 bg-emerald-500/70 dark:bg-[#00C896]/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-emerald-500/70 dark:bg-[#00C896]/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-emerald-500/70 dark:bg-[#00C896]/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom Input Shell ── */}
      <div className="absolute bottom-0 w-full z-50 flex justify-between items-end bg-gradient-to-t from-slate-50 dark:from-[#0D1117] via-slate-50/90 dark:via-[#0D1117]/90 to-transparent pt-16 pb-28 lg:pb-6 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full flex flex-col relative items-end pointer-events-none">
          <div className="w-full flex items-end gap-2 sm:gap-3 pointer-events-auto">
            <PureMultimodalInput
              value={input}
              onChange={setInput}
              onSendMessage={({ input }) => handleSend(input)}
              isGenerating={loading}
              canSend={!loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
